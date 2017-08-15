cc.Class({
    extends: cc.Component,
    properties: {
        _gameover: null,
        _gameresult: null,
        _seats: [],
        _isGameEnd: false,
        _pingju: null,
        _win: null,
        _lose: null,
    },
    // use this for initialization
    onLoad: function() {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.gameNetMgr.conf == null) {
            return;
        }
        this._gameover = this.node.getChildByName("game_over");
        this._gameover.active = false;
        this._pingju = this._gameover.getChildByName("pingju");
        this._win = this._gameover.getChildByName("win");
        this._lose = this._gameover.getChildByName("lose");
        this._liuju = this._gameover.getChildByName("huangzhuang");
        this._gameresult = this.node.getChildByName("game_result");
        var wanfa = this._gameover.getChildByName("wanfa").getComponent(cc.Label);
        wanfa.string = cc.vv.gameNetMgr.getWanfa();
        var listRoot = this._gameover.getChildByName("result_list");
        for (var i = 1; i <= 4; ++i) {
            var s = "s" + i;
            var sn = listRoot.getChildByName(s);
            var viewdata = {};
            viewdata.username = sn.getChildByName('username').getComponent(cc.Label);
            viewdata.reason = sn.getChildByName('reason').getComponent(cc.Label);
            var f = sn.getChildByName('fan');
            if (f != null) {
                viewdata.fan = f.getComponent(cc.Label);
            }
            viewdata.score = sn.getChildByName('score').getComponent(cc.Label);
            viewdata.hu = sn.getChildByName('hu');
            viewdata.mahjongs = sn.getChildByName('pai');
            viewdata.zhuang = sn.getChildByName('zhuang');
            viewdata.hupai = sn.getChildByName('hupai');
            viewdata.hua = sn.getChildByName('hua');
            viewdata._pengandgang = [];
            this._seats.push(viewdata);
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_over', function(data) {
            self.onGameOver(data.detail);
        });
        this.node.on('game_end', function(data) {
            self._isGameEnd = true;
        });
    },
    onGameOver(data) {
        console.log(data);
        if (data.length == 0) {
            this._gameresult.active = true;
            return;
        }
        this._gameover.active = true;
        this._pingju.active = false;
        this._win.active = false;
        this._lose.active = false;
        this._liuju.active = false;
        var myscore = data[cc.vv.gameNetMgr.seatIndex].score;
        var isLiuJu = data[cc.vv.gameNetMgr.seatIndex].isLiuJu;
        if(isLiuJu) {
            this._liuju.active = true;
        } else {
            if (myscore > 0) {
                this._win.active = true;
            } else if (myscore < 0) {
                this._lose.active = true;
            } else {
                this._pingju.active = true;
            }
        }
        //显示玩家信息
        for (var i = 0; i < 4; ++i) {
            var seatView = this._seats[i];
            var userData = data[i];
            var hued = false;
            //胡牌的玩家才显示 是否清一色 根xn的字样
            var numOfGangs = userData.angangs.length + userData.wangangs.length + userData.diangangs.length;
            var numOfGen = userData.numofgen;
            var actionArr = [];
            var is7pairs = false;
            var ischadajiao = false;
            for (var j = 0; j < userData.actions.length; ++j) {
                var ac = userData.actions[j];
                if (ac.type == "zimo" || ac.type == "ganghua" || ac.type == "dianganghua" || ac.type == "hu" || ac.type == "gangpaohu" || ac.type == "qiangganghu" || ac.type == "chadajiao") {
                    if (ac.type == "zimo") {
                        actionArr.push("自摸");
                    } else if (ac.type == "ganghua") {
                        actionArr.push("杠上花");
                    }
                    hued = true;
                } else if (ac.type == "fangpao") {
                    actionArr.push("放炮");
                } else if (ac.type == "angang") {
                    actionArr.push("暗杠");
                } else if (ac.type == "diangang") {
                    actionArr.push("明杠");
                }
            }
            if (hued) {
                if (userData.isHaoQiDui) {
                    actionArr.push("豪七对");
                } else if (userData.pattern == "therity") {
                    actionArr.push("十三幺");
                } else {
                    if (userData.pattern == "7pairs") {
                        actionArr.push("七对");
                    }
                    if (userData.qingyise) {
                        actionArr.push("清一色");
                    }
                    if (userData.menqing) {
                        actionArr.push("门清");
                    }
                    if (userData.haidihu) {
                        actionArr.push("海底捞月");
                    }
                    if (userData.isFourOne) {
                        actionArr.push("四归一");
                    }
                    if (userData.zhuoWuKui) {
                        actionArr.push("捉五魁");
                    }
                    if (userData.hunyise) {
                        actionArr.push("混一色");
                    }
                    if (userData.baZhang) {
                        actionArr.push("八张");
                    }
                    if (userData.laoShao) {
                        actionArr.push("老少");
                    }
                    if (userData.yiTiaoLong) {
                        actionArr.push("一条龙");
                    }
                    if (userData.xiaoLian) {
                        actionArr.push("小连");
                    }
                    if (userData.daLian) {
                        actionArr.push("大连");
                    }
                    if (userData.huCnt == 1) {
                        actionArr.push("单吊");
                    }
                    if (userData.xiaoGao) {
                        actionArr.push("小高");
                    }
                    if (userData.daGao) {
                        actionArr.push("大高");
                    }
                    if (userData.queMen) {
                        actionArr.push("缺门");
                    }
                    if (userData.kezi) {
                        actionArr.push("刻");
                    }
                    if (userData.pengpenghu) {
                        actionArr.push("碰碰胡");
                    }
                    var lianZhuangNum = parseInt(userData.lianZhuangNum) - 1;
                    if (lianZhuangNum > 0) {
                        actionArr.push("连庄" + lianZhuangNum + "次");
                    }
                }
            }
            for (var o = 0; o < 3; ++o) {
                seatView.hu.children[o].active = false;
            }
            //FIXME 隐藏第几个胡牌的
            if (userData.huorder >= 0) {
                seatView.hu.children[userData.huorder].active = true;
            }
            seatView.username.string = cc.vv.gameNetMgr.seats[i].name;
            seatView.zhuang.active = cc.vv.gameNetMgr.button == i;
            seatView.reason.string = actionArr.join("、");
            //胡牌的玩家才有番
            var fan = 0;
            if (hued) {
                fan = userData.fan;
            }
            seatView.fan.string = fan + "番";
            //
            if (userData.score > 0) {
                seatView.score.string = "+" + userData.score;
            } else {
                seatView.score.string = userData.score;
            }
            var hupai = -1;
            if (hued) {
                hupai = userData.hupai;
                //从手牌中剔除胡的那张牌 
                var hu_index = userData.holds.indexOf(hupai);
                userData.holds.splice(hu_index, 1);
            }
            cc.vv.mahjongmgr.sortMJ(userData.holds);
            //胡牌不参与排序
            if (hued) {
                userData.holds.push(hupai);
            }
            //隐藏所有牌
            for (var k = 0; k < seatView.mahjongs.childrenCount; ++k) {
                var n = seatView.mahjongs.children[k];
                n.active = false;
            }
            var lackingNum = (userData.pengs.length + numOfGangs + userData.chis.length) * 3;
            //显示相关的牌
            for (var k = 0; k < userData.holds.length; ++k) {
                var pai = userData.holds[k];
                var n = seatView.mahjongs.children[k + lackingNum];
                n.active = true;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("M_", pai);
            }
            for (var k = 0; k < seatView._pengandgang.length; ++k) {
                seatView._pengandgang[k].active = false;
            }
            //初始化杠牌
            var index = 0;
            var gangs = userData.angangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "angang");
                index++;
            }
            var gangs = userData.diangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "diangang");
                index++;
            }
            var gangs = userData.wangangs;
            for (var k = 0; k < gangs.length; ++k) {
                var mjid = gangs[k];
                this.initPengAndGangs(seatView, index, mjid, "wangang");
                index++;
            }
            //初始化碰牌
            var pengs = userData.pengs;
            if (pengs) {
                for (var k = 0; k < pengs.length; ++k) {
                    var mjid = pengs[k];
                    this.initPengAndGangs(seatView, index, mjid, "peng");
                    index++;
                }
            }
            //初始化吃牌
            var chis = userData.chis;
            if (chis) {
                for (var k = 0; k < chis.length; ++k) {
                    var mjids = chis[k];
                    if (mjids) {
                        this.initPengAndGangs(seatView, index, mjids, "chi");
                        index++;
                    }
                }
            }
            //初始化花牌
            var hua = userData.caiShen;
            this.initHua(seatView, hua);
        }
    },
    initHua: function(seatView, mjids) {
        for (var i = 0; i < seatView.hua.children.length; i++) {
            seatView.hua.children[i].active = false;
        }
        if (mjids) {
            for (var i = 0; i < mjids.length; i++) {
                seatView.hua.children[i].active = true;
                seatView.hua.children[i].getComponent(cc.Sprite).spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjids[i]);
            }
        }
    },
    initPengAndGangs: function(seatView, index, mjid, flag) {
        var pgroot = null;
        if (seatView._pengandgang.length <= index) {
            pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            seatView._pengandgang.push(pgroot);
            seatView.mahjongs.addChild(pgroot);
        } else {
            pgroot = seatView._pengandgang[index];
            pgroot.active = true;
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                var isGang = (flag != "peng" && flag != "chi");
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if (flag == "angang") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame("myself");
                    sprite.node.scaleX = 1.4;
                    sprite.node.scaleY = 1.4;
                } else {
                    if (flag == "chi") {
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid[s]);
                    } else {
                        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid);
                    }
                }
            } else {
                if (flag == "chi") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid[s]);
                } else {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID("B_", mjid);
                }
            }
        }
        pgroot.x = index * 55 * 3 + index * 10;
    },
    onBtnReadyClicked: function() {
        console.log("onBtnReadyClicked");
        if (this._isGameEnd) {
            this._gameresult.active = true;
        } else {
            cc.vv.net.send('ready');
        }
        this._gameover.active = false;
    },
    onBtnShareClicked: function() {
        console.log("onBtnShareClicked");
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});