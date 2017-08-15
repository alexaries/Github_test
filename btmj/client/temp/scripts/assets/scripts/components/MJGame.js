"use strict";
cc._RFpush(module, '7fa8fcvrqFOj6lhh6xHzd3c', 'MJGame');
// scripts/components/MJGame.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        gameRoot: {
            default: null,
            type: cc.Node
        },
        prepareRoot: {
            default: null,
            type: cc.Node
        },
        _myMJArr: [],
        _options: null,
        _selectedMJ: null,
        _chupaiSprite: [],
        _mjcount: null,
        _gamecount: null,
        _hupaiTips: [],
        _hupaiLists: [],
        _playEfxs: [],
        _opts: [],
        // 用于存放服务端发过来的可以吃的组合
        _chiArrays: [],
        // 用来存放玩家选中的吃的组合
        _chiOptionArray: [],
        _chiOpts: null,
        _optionsData: null,
        _canChupai: false
    },
    onLoad: function onLoad() {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.addComponent("NoticeTip");
        this.addComponent("GameOver");
        this.addComponent("PengGangs");
        this.addComponent("MJRoom");
        this.addComponent("TimePointer");
        this.addComponent("GameResult");
        this.addComponent("Chat");
        this.addComponent("Folds");
        this.addComponent("ReplayCtrl");
        this.addComponent("PopupMgr");
        this.addComponent("ReConnect");
        this.addComponent("Voice");
        this.initView();
        this.initEventHandlers();
        this.gameRoot.active = false;
        this.prepareRoot.active = true;
        this._chiArrays = [];
        this._chiOptionArray = [];
        this.initWanfaLabel();
        this.onGameBeign();
    },
    initView: function initView() {
        //搜索需要的子节点
        var gameChild = this.node.getChildByName("game");
        this._mjcount = gameChild.getChildByName('mjcount').getComponent(cc.Label);
        this._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        this._gamecount = gameChild.getChildByName('gamecount').getComponent(cc.Label);
        this._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        var myselfChild = gameChild.getChildByName("myself");
        var myholds = myselfChild.getChildByName("holds");
        for (var i = 0; i < myholds.children.length; ++i) {
            var sprite = myholds.children[i].getComponent(cc.Sprite);
            this._myMJArr.push(sprite);
            this.onMjToUp(sprite.node);
            sprite.spriteFrame = null;
        }
        var realwidth = cc.director.getVisibleSize().width;
        myholds.scaleX *= realwidth / 1280;
        myholds.scaleY *= realwidth / 1280;
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var side = sides[i];
            var sideChild = gameChild.getChildByName(side);
            this._hupaiTips.push(sideChild.getChildByName("HuPai"));
            this._hupaiLists.push(sideChild.getChildByName("hupailist"));
            this._playEfxs.push(sideChild.getChildByName("play_efx").getComponent(cc.Animation));
            this._chupaiSprite.push(sideChild.getChildByName("ChuPai").children[0].getComponent(cc.Sprite));
            var opt = sideChild.getChildByName("opt");
            opt.active = false;
            var sprite = opt.getChildByName("pai").getComponent(cc.Sprite);
            var data = {
                node: opt,
                sprite: sprite
            };
            this._opts.push(data);
        }
        var opts = gameChild.getChildByName("ops");
        this._options = opts;
        var chiOpts = gameChild.getChildByName("chiops");
        this._chiOpts = chiOpts;
        this.hideOptions();
        this.hideChupai();
        this.hideChiOptions();
        if (this._myMJArr.length == 14) {
            this._canChupai = true;
        }
    },
    hideChupai: function hideChupai() {
        for (var i = 0; i < this._chupaiSprite.length; ++i) {
            this._chupaiSprite[i].node.active = false;
        }
    },
    checkHasCaiShen: function checkHasCaiShen() {
        // console.log('判断是否有财神');
        var hasCaiShen = false;
        if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                    if (type == 4) {
                        console.log("有财神");
                        hasCaiShen = true;
                        break;
                    }
                }
            }
        }
        return hasCaiShen;
    },
    // 每摸一次牌,判断一下是否是财神
    checkCaiShen: function checkCaiShen() {
        if (this.checkHasCaiShen()) {
            var self = this;
            //自动出花牌
            var fn = function fn(node) {
                var type = cc.vv.mahjongmgr.getMahjongType(node.mjId);
                node.active = false;
                self.shootCaiShen(node.mjId);
                node.y = 0;
                self.recordShootPos(node);
            };
            var node;
            for (var i = 0; i < self._myMJArr.length; ++i) {
                var sprite = self._myMJArr[i];
                if (sprite.node.mjId != null) {
                    var type = cc.vv.mahjongmgr.getMahjongType(sprite.node.mjId);
                    if (type != 4) {
                        sprite.node.getComponent(cc.Button).interactable = false;
                    } else {
                        cc.vv.global.touch_target = sprite.node;
                        // cc.vv.gameNetMgr.turn = sprite.node;
                        node = sprite.node;
                        break;
                    }
                }
            }
            var fun = fn(node);
            setTimeout(fun, 100);
            //遍历检查看是否有未打缺的牌 如果有，则需要将不是定缺的牌设置为不可用
            // console.log("检查是否有财神");
        } else {
            // console.log("没有财神");
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                // console.log("没有财神:", cc.vv.gameNetMgr.seatIndex, cc.vv.gameNetMgr.turn);
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            } else {
                // 没有轮到出牌顺序,不能点击麻将
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        // 出牌默认还是可以点击的
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    //如果玩家手上还有缺的牌没有打，则只能打缺牌
    initTingedHolds: function initTingedHolds() {
        // 如果有财神,当然不能显示听牌哎
        if (this.checkHasCaiShen()) {
            return;
        }
        if (cc.vv.gameNetMgr.conf == null || !cc.vv.gameNetMgr.getSelfData().tinged) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    sprite.node.getComponent(cc.Button).interactable = true;
                }
            }
        } else {
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = i == 13;
                    }
                }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    initExtraPaiHolds: function initExtraPaiHolds() {
        console.log("运行到这里哦extraPaiHolds");
        if (this.checkHasCaiShen()) {
            return;
        }
        var selfData = cc.vv.gameNetMgr.getSelfData();
        if (selfData.extraPais.length <= 0) {
            console.log("当前多余的牌不存在,不需要额外处理手牌");
            return;
        }
        if (cc.vv.gameNetMgr.conf == null || !selfData.tinged) {
            for (var i = 0; i < this._myMJArr.length; ++i) {
                var sprite = this._myMJArr[i];
                if (sprite.node.mjId != null) {
                    sprite.node.getComponent(cc.Button).interactable = true;
                }
            }
        } else {
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn) {
                console.log("判断是否是自己");
                for (var j = 0; j < 14; ++j) {
                    var sprite = this._myMJArr[j];
                    console.log(" 当前的麻将的id是", sprite.node.mjId);
                    if (sprite.node.active == true && sprite.node.mjId != null) {
                        if (selfData.extraPais.indexOf(sprite.node.mjId) > -1) {
                            console.log("准备选择哪些可用", sprite.node.mjId);
                            sprite.node.getComponent(cc.Button).interactable = true;
                        } else {
                            console.log("准备选择哪些可以禁用的", sprite.node.mjId);
                            sprite.node.getComponent(cc.Button).interactable = false;
                        }
                    }
                }
                //ly鉴定。这样写是错误的。因为这样始终是最后一个可操作，与需求不符
                // for (var i = 0; i < selfData.extraPais.length; i++) {
                //     console.log("当前牌是", selfData.extraPais[i]);
                //     var paiId = selfData.extraPais[i];
                //     for (var j = 0; j < 14; ++j) {
                //         var sprite = this._myMJArr[j];
                //         console.log(" 当前的麻将的id是", sprite.node.mjId);
                //         if ((sprite.node.active == true) && (sprite.node.mjId != null)) {
                //             if (sprite.node.mjId == paiId) {
                //                 console.log("准备选择哪些可用", sprite.node.mjId);
                //                 sprite.node.getComponent(cc.Button).interactable = true;
                //             } else {
                //                 console.log("准备选择哪些可以禁用的", sprite.node.mjId);
                //                 sprite.node.getComponent(cc.Button).interactable = false;
                //             }
                //         }
                //     }
                // }
            } else {
                for (var i = 0; i < 14; ++i) {
                    var sprite = this._myMJArr[i];
                    if (sprite.node.active == true) {
                        sprite.node.getComponent(cc.Button).interactable = true;
                    }
                }
            }
        }
    },
    showTingedFlag: function showTingedFlag() {
        console.log("showTingedFlag");
        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.tinged;
            if (seatData.tinged) {
                hupai.getChildByName("sprHu").active = !seatData.tinged;
                hupai.getChildByName("sprZimo").active = !seatData.tinged;
                hupai.getChildByName("sprTing").active = seatData.tinged;
            }
        }
    },
    resetPai: function resetPai(isShow) {
        //还原被拖动的牌的位置
        var touch_target = cc.vv.global.touch_target;
        if (touch_target) {
            touch_target.x = touch_target.old_node_x;
            touch_target.y = 0;
            if (isShow) {
                touch_target.active = true;
            }
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        //初始化事件监听器
        var self = this;
        this.node.on('game_holds', function (data) {
            self.initMahjongs();
            self.checkCaiShen();
            var selfData = cc.vv.gameNetMgr.getSelfData();
            console.log('------------------------------------');
            console.log("selfData", selfData.extraPais);
            console.log('------------------------------------');
            if (selfData != null && selfData.extraPais != null) {
                if (selfData.extraPais.length > 0) {
                    console.log("当前多余的牌存在,则需要额外处理手牌");
                    self.initExtraPaiHolds();
                    selfData.extraPais = [];
                } else {
                    self.initTingedHolds();
                }
            }
        });
        this.node.on('game_begin', function (data) {
            self.onGameBeign();
        });
        this.node.on('game_sync', function (data) {
            self.onGameBeign();
        });
        this.node.on('game_chupai', function (data) {
            data = data.detail;
            self.hideChupai();
            self.checkCaiShen();
            var selfData = cc.vv.gameNetMgr.getSelfData();
            console.log('------------------------------------');
            console.log("selfData", selfData.extraPais);
            console.log('------------------------------------');
            if (selfData != null && selfData.extraPais != null) {
                if (selfData.extraPais.length > 0) {
                    console.log("当前多余的牌存在,则需要额外处理手牌");
                    self.initExtraPaiHolds();
                    selfData.extraPais = [];
                } else {
                    self.initTingedHolds();
                }
            }
            if (data.last != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(data.last, null);
            }
            if (!cc.vv.replayMgr.isReplay() && data.turn != cc.vv.gameNetMgr.seatIndex) {
                self.initMopai(data.turn, -1);
            }
            //默认不可以出牌
            self._canChupai = false;
            if (!self.checkHasCaiShen() && data.turn == cc.vv.gameNetMgr.seatIndex) {
                //判断是否可以出牌,只有当玩家没有财神,且持有话语权才能出牌(因为'game_chupai' 是发给所有人的)。
                self._canChupai = true;
            }
        });
        this.node.on('game_mopai', function (data) {
            self.hideChupai();
            data = data.detail;
            var pai = data.pai;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(data.seatIndex);
            if (localIndex == 0) {
                var index = 13;
                var sprite = self._myMJArr[index];
                self.setSpriteFrameByMJID("M_", sprite, pai, index);
                sprite.node.active = true;
                sprite.node.mjId = pai;
                self._canChupai = true;
            } else if (cc.vv.replayMgr.isReplay()) {
                self.initMopai(data.seatIndex, pai);
                self._canChupai = false;
            }
            cc.vv.global.touch_target = null;
            cc.vv.global.shootPos = null;
        });
        this.node.on('game_action', function (data) {
            self._optionsData = data.detail;
            self.showAction(data.detail);
            // console.log("game_action-----是否可以吃牌", data);
            // if (data.detail && data.detail.chi) {
            //     console.log("可以吃牌");
            //     self.showChiAction(data.detail);
            // }
            // if (data.detail) {
            //     if (data.detail.peng || data.detail.gang || data.detail.hu) {
            //         console.log("碰杠胡");
            //         self.showAction(data.detail);
            //     }
            // }
        });
        this.node.on('hupai', function (data) {
            console.log("ly:有人胡牌了");
            self.hideChiOptions();
            var data = data.detail;
            //如果不是玩家自己，则将玩家的牌都放倒
            var seatIndex = data.seatindex;
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
            var hupai = self._hupaiTips[localIndex];
            hupai.active = true;
            if (localIndex == 0) {
                self.hideOptions();
            }
            var seatData = cc.vv.gameNetMgr.seats[seatIndex];
            seatData.hued = true;
            if (cc.vv.gameNetMgr.conf.type == "ykx") {
                hupai.getChildByName("sprHu").active = true;
                hupai.getChildByName("sprZimo").active = false;
                hupai.getChildByName("sprTing").active = false;
                self.initHupai(localIndex, data.hupai);
                if (data.iszimo) {
                    if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                        seatData.holds.pop();
                        self.initMahjongs();
                    } else {
                        self.initOtherMahjongs(seatData);
                    }
                }
            } else {
                hupai.getChildByName("sprHu").active = !data.iszimo;
                hupai.getChildByName("sprZimo").active = data.iszimo;
                if (!(data.iszimo && localIndex == 0)) {
                    //if(cc.vv.replayMgr.isReplay() == false && localIndex != 0){
                    //    self.initEmptySprites(seatIndex);                
                    //}
                    self.initMopai(seatIndex, data.hupai);
                }
            }
            // if (cc.vv.replayMgr.isReplay() == true && cc.vv.gameNetMgr.conf.type != "ykx") {
            //     var opt = self._opts[localIndex];
            //     opt.node.active = true;
            //     opt.sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", data.hupai);
            // }
            if (data.iszimo) {
                self.playEfx(localIndex, "play_zimo");
            } else {
                self.playEfx(localIndex, "play_hu");
            }
            cc.vv.audioMgr.playSFX("nv/hu.mp3");
        });
        this.node.on('mj_count', function (data) {
            self._mjcount.string = "剩余" + cc.vv.gameNetMgr.numOfMJ + "张";
        });
        this.node.on('game_num', function (data) {
            self._gamecount.string = "" + cc.vv.gameNetMgr.numOfGames + "/" + cc.vv.gameNetMgr.maxNumOfGames + "局";
        });
        this.node.on('game_over', function (data) {
            self.gameRoot.active = false;
            self.prepareRoot.active = true;
        });
        this.node.on('game_chupai_notify', function (data) {
            self.hideChupai();
            var seatData = data.detail.seatData;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self._canChupai = false;
                //还原被拖动的牌的位置
                self.resetPai();
                setTimeout(function () {
                    var touch_target = cc.vv.global.touch_target;
                    if (touch_target) {
                        touch_target.active = true;
                    }
                    self.initMahjongs();
                }, 500);
            } else {
                self.initOtherMahjongs(seatData);
            }
            self.showChupai();
            // 花牌没有对应的声音
            if (data.detail.pai < 34) {
                var audioUrl = cc.vv.mahjongmgr.getAudioURLByMJID(data.detail.pai);
                // console.log("audioUrl!!!" + audioUrl);
                cc.vv.audioMgr.playSFX(audioUrl);
            }
        });
        //财神处理
        this.node.on('game_caishen_notify', function (data) {
            // console.log("财神事件监听!!!!!!!!!!!!!", data);
            var seatData = data.detail;
            // console.log('财神事件监听', seatData);
            //如果是自己，则刷新手牌
            // if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
            //     setTimeout(function() {
            //         var touch_target = cc.vv.global.touch_target;
            //         if (touch_target) {
            //             touch_target.active = true;
            //         }
            //         self.initCaiShenList();
            //         self.initMahjongs();
            //     }, 500);
            // } else {
            //      self.initOtherMahjongs(seatData);
            //     self.initOtherCaiShenList(seatData);
            // }
            // self.showChupai();
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initCaiShenList();
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
                self.initOtherCaiShenList(seatData);
            }
        });
        this.node.on('match_exit_error', function (data) {
            //锦标赛不能退出游戏
            cc.vv.alert.show("提示", "锦标赛中不能退出游戏");
        });
        this.node.on('guo_notify', function (data) {
            self.hideChupai();
            self.hideOptions();
            self.hideChiOptions();
            var seatData = data.detail;
            //如果是自己，则刷新手牌
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            }
            cc.vv.audioMgr.playSFX("give.mp3");
        });
        this.node.on('guo_result', function (data) {
            self.hideOptions();
        });
        // 游戏
        this.node.on('game_playing', function (data) {
            self.initMahjongs();
        });
        this.node.on('peng_notify', function (data) {
            self.hideChiOptions();
            self.hideChupai();
            var seatData = data.detail;
            console.log("此时玩家的seatdate", seatData);
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/peng.mp3");
            self.hideOptions();
            seatData.tinged = true;
            self.showTingedFlag();
        });
        // 吃
        this.node.on("chi_notify", function (data) {
            var seatData = data.detail;
            var localIndex = self.getLocalIndex(seatData);
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            // TODO 吃牌特效有bug
            // self.playEfx(localIndex, "play_peng");
            cc.vv.audioMgr.playSFX("nv/chi.mp3");
            self.hideChiOptions();
            self.hideOptions();
            seatData.tinged = true;
            self.showTingedFlag();
        });
        this.node.on('gang_notify', function (data) {
            self.hideChiOptions();
            self.hideChupai();
            var data = data.detail;
            var seatData = data.seatData;
            var gangtype = data.gangtype;
            if (seatData.seatindex == cc.vv.gameNetMgr.seatIndex) {
                self.initMahjongs();
            } else {
                self.initOtherMahjongs(seatData);
            }
            var localIndex = self.getLocalIndex(seatData.seatindex);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            console.log("---------seatData------------->>", seatData.tinged, seatData);
            if (seatData.angangs.length == 0) {
                seatData.tinged = true;
            }
            self.showTingedFlag();
        });
        this.node.on("hangang_notify", function (data) {
            var data = data.detail;
            var localIndex = self.getLocalIndex(data);
            self.playEfx(localIndex, "play_gang");
            cc.vv.audioMgr.playSFX("nv/gang.mp3");
            self.hideOptions();
        });
    },
    showChupai: function showChupai() {
        var pai = cc.vv.gameNetMgr.chupai;
        if (pai >= 0) {
            var localIndex = this.getLocalIndex(cc.vv.gameNetMgr.turn);
            var sprite = this._chupaiSprite[localIndex];
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            var target_node = sprite.node;
            var old_x = target_node.x;
            var old_y = target_node.y;
            sprite.node.active = true;
            var pos = cc.vv.global.shootPos;
            switch (localIndex) {
                case 0:
                    if (pos) {
                        target_node.x = pos.x * 1.1; //移到出牌位置
                        target_node.y = pos.y * 1.1 - 158; //移到出牌位置
                    }
                    break;
                case 1:
                    target_node.x = cc.find("Canvas/game/right").x;
                    target_node.y = -150;
                    break;
                case 2:
                    target_node.x = -50;
                    target_node.y = 276;
                    break;
                case 3:
                    target_node.x = cc.find("Canvas/game/left").x;
                    target_node.y = 150;
                    break;
            }
            var action = cc.moveTo(0.05, cc.p(old_x, old_y));
            //动画需要隐藏自己出的牌
            if (cc.vv.gameNetMgr.seatIndex == cc.vv.gameNetMgr.turn && cc.vv.global.touch_target) {
                cc.vv.global.touch_target.active = false;
            }
            target_node.runAction(action);
        }
    },
    toChiActionPage: function toChiActionPage() {
        // console.log("to 吃 操作的页面");
        this.showChiAction(this._optionsData);
    },
    // 碰，杠，胡，过操作
    addOption: function addOption(btnName, pai) {
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op" && child.active == false) {
                child.active = true;
                var sprite = child.getChildByName("opTarget").getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
                var btn = child.getChildByName(btnName);
                btn.active = true;
                btn.pai = pai;
                return;
            }
        }
    },
    // 吃牌操作
    addChiOption: function addChiOption(btnName, data) {
        console.log("吃牌操作addchioption", data);
        // 显示全部
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            child.active = true;
            if (child.name == "btnChi") {
                if (data.pai != null) {
                    child.pai = data.pai;
                }
            }
        }
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            for (var j = 0; j < 3; j++) {
                var id = "op" + j;
                if (child.name == id) {
                    child.active = false;
                }
            }
        }
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var parentname = this._chiOpts.children[i];
            var info = data.chiArrayInfo;
            if (info.length <= 0) {
                return;
            }
            // 目标牌
            if (parentname.name == "opTarget") {
                if (data.pai != null) {
                    var sprite = parentname.getComponent(cc.Sprite);
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", data.pai);
                }
            }
            for (var k = 0; k < info.length; k++) {
                var name = "op" + k;
                if (parentname.name == name) {
                    parentname.active = true;
                    var childName = "pai" + k;
                    var paiInfo = info[k];
                    this._chiArrays.push(paiInfo);
                    console.log('this._chiArraysthis._chiArraysthis._chiArraysthis._chiArrays', this._chiArrays);
                    this.showChiPaiArray(parentname, paiInfo);
                }
            }
        }
    },
    // 显示吃牌的组合
    showChiPaiArray: function showChiPaiArray(parentname, data) {
        console.log("显示吃牌的组合", data, this._chiArrays);
        if (data != null && data.length > 0) {
            for (var index = 0; index < 2; index++) {
                var pai = data[index];
                var painame = "pai" + index;
                var sprite = parentname.getChildByName(painame).getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            }
        }
    },
    // 隐藏碰杠胡牌操作
    hideOptions: function hideOptions(data) {
        this._options.active = false;
        this.hideChiOptions();
        for (var i = 0; i < this._options.childrenCount; ++i) {
            var child = this._options.children[i];
            if (child.name == "op") {
                child.active = false;
                child.getChildByName("btnPeng").active = false;
                child.getChildByName("btnGang").active = false;
                child.getChildByName("btnHu").active = false;
                child.getChildByName("btnChi").active = false;
            }
        }
    },
    // 隐藏吃牌的操作
    hideChiOptions: function hideChiOptions() {
        console.log("隐藏hideChiOptions", this._chiOpts.childrenCount);
        this._chiOpts.active = false;
        for (var i = 0; i < this._chiOpts.childrenCount; ++i) {
            var child = this._chiOpts.children[i];
            child.active = false;
        }
    },
    showAction: function showAction(data) {
        if (this._options.active) {
            this.hideOptions();
        }
        if (data && (data.hu || data.gang || data.peng || data.chi)) {
            this._options.active = true;
            if (data.hu) {
                this.addOption("btnHu", data.pai);
            }
            if (data.peng) {
                this.addOption("btnPeng", data.pai);
            }
            if (data.gang) {
                for (var i = 0; i < data.gangpai.length; ++i) {
                    var gp = data.gangpai[i];
                    this.addOption("btnGang", gp);
                }
            }
            if (data.chi) {
                this.addOption("btnChi");
            }
        } else {
            var selfData = cc.vv.gameNetMgr.getSelfData();
            if (selfData.tinged) {
                return;
                //注1):2017 07 26 ly
                //下面自动出牌不在需要，由服务器端去完成
                //原因是： 下面语句执行后会产生一种牌不显示的bug。 
                //      bug是必现。原因不明。
                // //如果已经听牌，并且没有操作，则自动打牌
                // var sprite = this._myMJArr[this._myMJArr.length - 1];
                // var node = sprite.node;
                // cc.vv.global.touch_target = node;
                // node.active = false;
                // this.shoot(node.mjId);
                // node.y = 0;
                // this.recordShootPos(node);
            }
        }
    },
    // 吃牌的操作
    showChiAction: function showChiAction(data) {
        console.log("吃牌操作", data);
        // 如果碰牌的操作界面显示了,先隐藏,正常情况下这是不可能的
        if (this._options.active) {
            this.hideOptions();
        }
        if (this._chiOpts.active) {
            this.hideChiOptions();
        }
        if (data && data.chi) {
            this._chiOpts.active = true;
            this._chiArrays = [];
            this._chiOptionArray = [];
            this.addChiOption('btnChi', data);
        }
    },
    initWanfaLabel: function initWanfaLabel() {
        var wanfa = cc.find("Canvas/infobar/wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
    },
    initHupai: function initHupai(localIndex, pai) {
        if (cc.vv.gameNetMgr.conf.type == "ykx") {
            var hupailist = this._hupaiLists[localIndex];
            for (var i = 0; i < hupailist.children.length; ++i) {
                var hupainode = hupailist.children[i];
                if (hupainode.active == false) {
                    var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
                    hupainode.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
                    hupainode.active = true;
                    break;
                }
            }
        }
    },
    // 在胡牌堆里面处理财神显示
    initCaiShen: function initCaiShen(localIndex, pai) {
        var hupailist = this._hupaiLists[localIndex];
        for (var i = 0; i < hupailist.children.length; ++i) {
            var hupainode = hupailist.children[i];
            if (hupainode.active == false) {
                var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
                hupainode.getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
                hupainode.active = true;
                break;
            }
        }
    },
    playEfx: function playEfx(index, name) {
        this._playEfxs[index].node.active = true;
        this._playEfxs[index].play(name);
    },
    onGameBeign: function onGameBeign() {
        for (var i = 0; i < this._playEfxs.length; ++i) {
            this._playEfxs[i].node.active = false;
        }
        for (var i = 0; i < this._hupaiLists.length; ++i) {
            for (var j = 0; j < this._hupaiLists[i].childrenCount; ++j) {
                this._hupaiLists[i].children[j].active = false;
            }
        }
        for (var i = 0; i < cc.vv.gameNetMgr.seats.length; ++i) {
            var seatData = cc.vv.gameNetMgr.seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            var hupai = this._hupaiTips[localIndex];
            hupai.active = seatData.hued;
            if (seatData.hued) {
                // 如果胡牌了.肯定不显示听牌了
                hupai.getChildByName("sprHu").active = !seatData.iszimo;
                hupai.getChildByName("sprZimo").active = seatData.iszimo;
                hupai.getChildByName("sprTing").active = false;
            }
        }
        this.hideChupai();
        this.hideOptions();
        var sides = ["right", "up", "left"];
        var gameChild = this.node.getChildByName("game");
        for (var i = 0; i < sides.length; ++i) {
            var sideChild = gameChild.getChildByName(sides[i]);
            var holds = sideChild.getChildByName("holds");
            for (var j = 0; j < holds.childrenCount; ++j) {
                var nc = holds.children[j];
                nc.active = true;
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
                var sprite = nc.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.holdsEmpty[i + 1];
            }
        }
        if (cc.vv.gameNetMgr.gamestate == "" && cc.vv.replayMgr.isReplay() == false) {
            return;
        }
        this.gameRoot.active = true;
        this.prepareRoot.active = false;
        this.initMahjongs();
        this.initCaiShenList();
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            var seatData = seats[i];
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(i);
            if (localIndex != 0) {
                this.initOtherMahjongs(seatData);
                this.initOtherCaiShenList(seatData);
                if (i == cc.vv.gameNetMgr.turn) {
                    this.initMopai(i, -1);
                } else {
                    this.initMopai(i, null);
                }
            }
        }
        this.showChupai();
        if (cc.vv.gameNetMgr.curaction != null) {
            this._optionsData = cc.vv.gameNetMgr.curaction;
            this.showAction(cc.vv.gameNetMgr.curaction);
            cc.vv.gameNetMgr.curaction = null;
        }
        this.checkCaiShen();
        var selfData = cc.vv.gameNetMgr.getSelfData();
        console.log('------------------------------------');
        console.log("selfData", selfData);
        console.log('------------------------------------');
        if (!selfData.extraPais) {
            return;
        }
        if (selfData.extraPais.length > 0) {
            console.log("当前多余的牌存在,则需要额外处理手牌");
            this.initExtraPaiHolds();
            selfData.extraPais = [];
        } else {
            this.initTingedHolds();
        }
        this.showTingedFlag();
    },
    recordShootPos: function recordShootPos(node) {
        //记录出牌位置
        if (node) {
            var pos = {
                x: node.x,
                y: node.y
            };
            cc.vv.global.shootPos = pos;
        }
    },
    onMjToUp: function onMjToUp(nc) {
        var self = this;
        nc.on(cc.Node.EventType.TOUCH_START, function (touch) {
            if (!self._canChupai) {
                return;
            }
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            this.old_node_x = nc.x;
            this.old_node_y = nc.y;
            this.old_touch_x = touch.getLocation().x;
            this.old_touch_y = touch.getLocation().y;
            cc.vv.global.touch_target = nc;
        });
        nc.on(cc.Node.EventType.TOUCH_MOVE, function (touch) {
            if (!self._canChupai) {
                return;
            }
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchX_diff = touch.getLocation().x - this.old_touch_x;
            var touchY_diff = touch.getLocation().y - this.old_touch_y;
            if (touchY_diff > 0) {
                nc.x = this.old_node_x + touchX_diff;
                nc.y = this.old_node_y + touchY_diff;
            }
        });
        nc.on(cc.Node.EventType.TOUCH_END, function (touch) {
            if (!self._canChupai) {
                return;
            }
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchY_diff = touch.getLocation().y - this.old_touch_y;
            if (touchY_diff > nc.height / 2) {
                self.recordShootPos(nc);
                var type = cc.vv.mahjongmgr.getMahjongType(nc.mjId);
                if (type == 4) {
                    self.shootCaiShen(nc.mjId);
                } else {
                    self.shoot(nc.mjId);
                }
                // nc.active = false;
            }
            //还原到原始位置
            nc.x = this.old_node_x;
            nc.y = this.old_node_y;
        });
        nc.on(cc.Node.EventType.TOUCH_CANCEL, function (touch) {
            if (!self._canChupai) {
                return;
            }
            if (!nc.getComponent(cc.Button).interactable || cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
                return;
            }
            var touchCancel = touch.getLocation();
            var delta = touchCancel.y - this.old_touch_y;
            if (delta > nc.height / 2) {
                self.recordShootPos(nc);
                var type = cc.vv.mahjongmgr.getMahjongType(nc.mjId);
                if (type == 4) {
                    self.shootCaiShen(nc.mjId);
                } else {
                    self.shoot(nc.mjId);
                }
                nc.active = false;
            }
            //还原到原始位置
            nc.x = this.old_node_x;
            nc.y = this.old_node_y;
        });
    },
    onMJClicked: function onMJClicked(event) {
        var self = this;
        if (!self._canChupai) {
            return;
        }
        //如果不是自己的轮子，则忽略
        if (cc.vv.gameNetMgr.turn != cc.vv.gameNetMgr.seatIndex) {
            console.log("not your turn." + cc.vv.gameNetMgr.turn);
            return;
        }
        var self = this;
        for (var i = 0; i < this._myMJArr.length; ++i) {
            if (event.target == this._myMJArr[i].node) {
                //如果是再次点击，则出牌
                if (event.target == this._selectedMJ) {
                    // event.target.active = false;
                    var type = cc.vv.mahjongmgr.getMahjongType(this._selectedMJ.mjId);
                    if (type == 4) {
                        this.shootCaiShen(this._selectedMJ.mjId);
                    } else {
                        this.shoot(this._selectedMJ.mjId);
                    }
                    this._selectedMJ.y = 0;
                    this._selectedMJ = null;
                    self.recordShootPos(event.target);
                    return;
                }
                if (this._selectedMJ != null) {
                    this._selectedMJ.y = 0;
                }
                event.target.y = 15;
                this._selectedMJ = event.target;
                return;
            }
        }
    },
    //出牌
    shoot: function shoot(mjId) {
        if (mjId == null) {
            return;
        }
        cc.vv.net.send('chupai', mjId);
    },
    //出牌
    shootCaiShen: function shootCaiShen(mjId) {
        console.log("财神,换牌");
        if (mjId == null) {
            return;
        }
        // 一定要是财神才能进行此操作
        cc.vv.net.send('caishen', mjId);
    },
    getMJIndex: function getMJIndex(side, index) {
        if (side == "right" || side == "up") {
            return 13 - index;
        }
        return index;
    },
    initMopai: function initMopai(seatIndex, pai) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var lastIndex = this.getMJIndex(side, 13);
        var nc = holds.children[lastIndex];
        nc.scaleX = 1.0;
        nc.scaleY = 1.0;
        if (pai == null) {
            nc.active = false;
        } else if (pai >= 0) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 0.73;
                nc.scaleY = 0.73;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, pai);
        } else if (pai != null) {
            nc.active = true;
            if (side == "up") {
                nc.scaleX = 1.0;
                nc.scaleY = 1.0;
            }
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = cc.vv.mahjongmgr.getHoldsEmptySpriteFrame(side);
        }
    },
    initEmptySprites: function initEmptySprites(seatIndex) {
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var gameChild = this.node.getChildByName("game");
        var sideChild = gameChild.getChildByName(side);
        var holds = sideChild.getChildByName("holds");
        var spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
        for (var i = 0; i < holds.childrenCount; ++i) {
            var nc = holds.children[i];
            nc.scaleX = 1.0;
            nc.scaleY = 1.0;
            var sprite = nc.getComponent(cc.Sprite);
            sprite.spriteFrame = spriteFrame;
        }
    },
    initOtherMahjongs: function initOtherMahjongs(seatData) {
        console.log("seat:" + seatData.seatindex, seatData);
        var localIndex = this.getLocalIndex(seatData.seatindex);
        if (localIndex == 0 || seatData) {
            return;
        }
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var sideHolds = sideRoot.getChildByName("holds");
        console.log('sideholds', sideHolds);
        var num = seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length;
        num *= 3;
        for (var i = 0; i < num; ++i) {
            var idx = this.getMJIndex(side, i);
            sideHolds.children[idx].active = false;
        }
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var holds = this.sortHolds(seatData);
        if (holds != null && holds.length > 0) {
            for (var i = 0; i < holds.length; ++i) {
                var idx = this.getMJIndex(side, i + num);
                var sprite = sideHolds.children[idx].getComponent(cc.Sprite);
                if (side == "up") {
                    sprite.node.scaleX = 0.73;
                    sprite.node.scaleY = 0.73;
                }
                sprite.node.active = true;
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, holds[i]);
            }
            if (holds.length + num == 13) {
                var lasetIdx = this.getMJIndex(side, 13);
                sideHolds.children[lasetIdx].active = false;
            }
        }
    },
    sortHolds: function sortHolds(seatData) {
        var holds = seatData.holds;
        if (holds == null) {
            return null;
        }
        //如果手上的牌的数目是2,5,8,11,14，表示最后一张牌是刚摸到的牌
        var mopai = null;
        var l = holds.length;
        if (l == 2 || l == 5 || l == 8 || l == 11 || l == 14) {
            mopai = holds.pop();
        }
        cc.vv.mahjongmgr.sortMJ(holds);
        //将摸牌添加到最后
        if (mopai != null) {
            holds.push(mopai);
        }
        return holds;
    },
    initMahjongs: function initMahjongs() {
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var holds = this.sortHolds(seatData);
        if (holds == null) {
            return;
        }
        console.log("seatData.chis.length", seatData.chis.length);
        console.log("this._myMJArrthis._myMJArrthis._myMJArrthis._myMJArr", this._myMJArr);
        //初始化手牌
        var lackingNum = (seatData.pengs.length + seatData.angangs.length + seatData.diangangs.length + seatData.wangangs.length + seatData.chis.length) * 3;
        console.log("lackingNum", lackingNum);
        for (var i = 0; i < holds.length; ++i) {
            var mjid = holds[i];
            var sprite = this._myMJArr[i + lackingNum];
            if (sprite && sprite.node) {
                sprite.node.mjId = mjid;
                sprite.node.y = 0;
                sprite.node.active = true;
                this.setSpriteFrameByMJID("M_", sprite, mjid);
            }
        }
        for (var i = 0; i < lackingNum; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
        for (var i = lackingNum + holds.length; i < this._myMJArr.length; ++i) {
            var sprite = this._myMJArr[i];
            sprite.node.mjId = null;
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    setSpriteFrameByMJID: function setSpriteFrameByMJID(pre, sprite, mjid) {
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
        sprite.node.active = true;
    },
    getLocalIndex: function getLocalIndex(index) {
        var ret = (index - cc.vv.gameNetMgr.seatIndex + 4) % 4;
        console.log("old:" + index + ",base:" + cc.vv.gameNetMgr.seatIndex + ",new:" + ret);
        return ret;
    },
    onOptionClicked: function onOptionClicked(event) {
        console.log("吃碰杠牌操作");
        console.log(event.target.pai);
        if (event.target.name == "btnPeng") {
            cc.vv.net.send("peng");
        } else if (event.target.name == "btnGang") {
            cc.vv.net.send("gang", event.target.pai);
        } else if (event.target.name == "btnHu") {
            cc.vv.net.send("hu");
        } else if (event.target.name == "btnGuo") {
            cc.vv.net.send("guo");
        } else if (event.target.name == "btnChi") {
            console.log("吃牌操作按钮点击");
            cc.vv.net.send("chi", event.target.pai);
            console.log("向服务器发送吃牌操作--", {
                pai: event.target.pai,
                chiArray: this._chiOptionArray
            });
        }
    },
    // 吃牌操作
    onChiOptionClicked: function onChiOptionClicked(event) {
        console.log("吃牌操作事件绑定");
        // 用来存放玩家选中的吃的组合
        console.log(event.target.pai);
        if (event.target.name == "op0") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[0];
            }
            console.log("玩家选中了第一组组合", this._chiOptionArray);
        } else if (event.target.name == "op1") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[1];
            }
            console.log("选择了第二组组合", this._chiOptionArray);
        } else if (event.target.name == "op2") {
            if (this._chiArrays.length <= 0) {
                this._chiOptionArray = [];
            } else {
                this._chiOptionArray = this._chiArrays[2];
            }
            console.log("选择了第三组组合", this._chiOptionArray);
        } else if (event.target.name == "btnGuo") {
            cc.vv.net.send("guo");
        } else if (event.target.name == "btnChi") {
            console.log("吃牌操作按钮点击");
            if (this._chiOptionArray.length > 0) {
                console.log("可以吃的组合选中了,发送数据到服务器", this._chiOptionArray);
                var data = {
                    pai: event.target.pai,
                    chiOptioned: this._chiOptionArray
                };
                console.log("吃牌的组合是", data);
                cc.vv.net.send("chi", data);
            } else {
                cc.vv.alert.show("注意", "请选择一组吃牌的组合");
            }
            console.log("向服务器发送吃牌操作--", event.target.pai);
        }
    },
    initCaiShenList: function initCaiShenList() {
        // console.log('开始游戏,调用财神初始化信息');
        var seats = cc.vv.gameNetMgr.seats;
        var seatData = seats[cc.vv.gameNetMgr.seatIndex];
        var caishen = seatData.caiShen;
        // console.log('caiShen initCaiShenList', caishen);
        if (caishen == null) {
            return;
        }
        var gameChild = this.node.getChildByName("game");
        var myselfChild = gameChild.getChildByName("myself");
        var caishen_list = myselfChild.getChildByName("hupailist");
        for (var i = 0; i < caishen.length; ++i) {
            var mj_caishen_id = caishen[i];
            var sprite = caishen_list.children[i].getComponent(cc.Sprite);
            sprite.node.mjId = mj_caishen_id;
            this.setSpriteFrameByMJID("M_", sprite, mj_caishen_id);
        }
    },
    initOtherCaiShenList: function initOtherCaiShenList(seatData) {
        // console.log('初始化其他人的财神');
        var caishen = seatData.caiShen;
        // console.log('caiShen initOtherCaiShenList', caishen);
        if (caishen == null) {
            return;
        }
        var localIndex = this.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var game = this.node.getChildByName("game");
        var sideRoot = game.getChildByName(side);
        var side_caishen_list = sideRoot.getChildByName("hupailist");
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        for (var i = 0; i < caishen.length; ++i) {
            var mj_caishen_id = caishen[i];
            var sprite = side_caishen_list.children[i].getComponent(cc.Sprite);
            sprite.node.mjId = mj_caishen_id;
            this.setSpriteFrameByMJID(pre, sprite, mj_caishen_id);
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {},
    onDestroy: function onDestroy() {
        console.log("onDestroy");
        if (cc.vv) {
            cc.vv.gameNetMgr.clear();
        }
    }
});

cc._RFpop();