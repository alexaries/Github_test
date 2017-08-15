"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null,
        paigroup: {
            default: null,
            type: cc.SpriteAtlas
        },
        back: cc.Node,
        fanhui: cc.Node,
        bg: cc.Node,
        helpbtn: cc.Node,
        helpshow: cc.Node,
        addzhudetail: null,
        ops: null,
        zhuobj: null,
        fan: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        countdown: cc.Label,
        _time: -1
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("zjhSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this.addComponent("ReConnect");
        this._zhuomian = cc.find("Canvas/zhuomian");
        this.zhuobj = ['zhu0', 'zhu1', 'zhu2', 'zhu3', 'zhu0_hui', 'zhu1_hui', 'zhu2_hui', 'zhu3_hui'];
        this._edit = cc.find("Canvas/edit");
        this._graykanpai = this._edit.getChildByName('graykanpai');
        this._kanpai = this._edit.getChildByName('kanpai');
        this._graygenzhu = this._edit.getChildByName('graygenzhu');
        this._genzhu = this._edit.getChildByName('genzhu');
        this._grayjiazhu = this._edit.getChildByName('grayjiazhu');
        this._jiazhu = this._edit.getChildByName('jiazhu');
        this._grayqipai = this._edit.getChildByName('grayqipai');
        this._qipai = this._edit.getChildByName('qipai');
        this._graybipai = this._edit.getChildByName('graybipai');
        this._bipai = this._edit.getChildByName('bipai');
        this._allin = this._edit.getChildByName('allin');
        this._allZhuLabel = cc.find("Canvas/zongxiazhu/label").getComponent(cc.Label); //牌桌上所有的注
        this._zhu = cc.find("Canvas/zhu"); //加注界面
        this._danzhu = cc.find("Canvas/danzhu").getComponent(cc.Label); //单注显示
        this._lunshu = cc.find("Canvas/lunshu").getComponent(cc.Label); //轮数显示
        this._pkPanel = cc.find("Canvas/pk"); //pk界面
        this._flashAnim = cc.find("Canvas/pk/shandian/pk_shandian").getComponent(cc.Animation); //闪电动画
        this._bipaiAnim = cc.find("Canvas/pk/bipai").getComponent(cc.Animation); //比牌动画
        this._leftLie = this._pkPanel.getChildByName('leftLie');
        this._rightLie = this._pkPanel.getChildByName('rightLie');
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label); //tips显示
        cc.vv.utils.addClickEvent(this._kanpai, this.node, "all", "kanpai");
        cc.vv.utils.addClickEvent(this.back, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.helpbtn, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.helpshow, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "all", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._qipai, this.node, "all", "qipai");
        cc.vv.utils.addClickEvent(this._bipai, this.node, "all", "bipai");
        cc.vv.utils.addClickEvent(this._genzhu, this.node, "all", "genzhu");
        cc.vv.utils.addClickEvent(this._jiazhu, this.node, "all", "jiazhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu0'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu1'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu2'), this.node, "all", "addzhu");
        cc.vv.utils.addClickEvent(cc.find('Canvas/zhu/zhu3'), this.node, "all", "addzhu");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("getUserInfoByUserid");
        cc.vv.net.send("getGameInfoByUserid");
        cc.vv.net.send("ready");
        cc.vv.audioMgr.playBGM("back.mp3");
    },
    initView: function initView() {
        this._kanpai.active = false;
        this._qipai.active = false;
        this._genzhu.active = false;
        this._allin.active = false;
        this._jiazhu.active = false;
        this._bipai.active = false;
        this._pkPanel.active = false;
        this._zhuomian.active = false;
        this._tips.node.active = true;
    },
    freshUserInfo: function freshUserInfo(data) {
        console.log('获取断线重连后的用户信息', data);
        var self = this;
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            for (var t = 0; t < 3; t++) {
                cc.find('Canvas/seat' + i + '/fupai' + t).active = true;
            }
        }
        cc.find("Canvas/danzhu").active = true;
        cc.find("Canvas/lunshu").active = true;
        cc.find("Canvas/zongxiazhu").active = true;
        self._tips.node.active = false;
        self.countdown.node.active = false;
        self._kanpai.active = true;
        self._qipai.active = true;
        self._genzhu.active = data.canGenzhu;
        self._jiazhu.active = data.canAddZhu;
        self._bipai.active = data.canBiPai;
        self.ops = data.xiaZhuOptions;
        var holds = data.holds;
        if (holds && holds.length > 0) {
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
        }
    },
    freshGameInfo: function freshGameInfo(data) {
        console.log('获取断线重连后的游戏信息', data);
        if (this.ops) {
            var self = this;
            this.freshCurrentZhu(data.currentZhu);
            this.freshCircleCount(data.circleCount);
            this._zhuomian.active = true;
            var total = data.moneyPool;
            self._allZhuLabel.string = total; //总数
            //fresh其他人的数据
            var commonInfo = data.players;
            var allZhu = [];
            for (var i in commonInfo) {
                var temp = commonInfo[i];
                var userid = temp.userid;
                var costMoney = temp.costMoney; //下的注
                var money = temp.money; //所有用的钱
                //刷新这个人的信息
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seat = self._seats[localIndex];
                seat.setCostMoney(costMoney);
                seat.setMoney(money);
                var costArr = temp.costArr;
                for (var j in costArr) {
                    allZhu.push(costArr[j]);
                }
            }
            //添加桌面上的注
            for (var i in allZhu) {
                var zhu = allZhu[i];
                var node = self._zhuomian.children[0];
                var newNode = cc.instantiate(node);
                self._zhuomian.addChild(newNode);
                newNode.getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(zhu, 'W');
                var zhuLevel = self.getZhuLevel(zhu);
                var zhuObj = cc.find('Canvas/zhu/' + self.zhuobj[zhuLevel]);
                var zhuFrameCopy = zhuObj.getComponent(cc.Sprite).spriteFrame;
                newNode.getComponent(cc.Sprite).spriteFrame = zhuFrameCopy;
                newNode.x = Math.random() * 200;
                newNode.y = Math.random() * 200;
                newNode.active = true;
            }
        }
    },
    getZhuLevel: function getZhuLevel(zhu) {
        var ops = this.ops;
        var zhuLevel = null;
        for (var i in ops) {
            if (parseInt(ops[i]) == parseInt(zhu)) {
                zhuLevel = i;
                break;
            }
        }
        if (zhuLevel == null) {
            for (var i in ops) {
                if (parseInt(ops[i]) == parseInt(zhu) * 0.5) {
                    zhuLevel = i;
                    break;
                }
            }
        }
        if (zhuLevel == null) {
            for (var i in ops) {
                if (parseInt(ops[i]) == parseInt(zhu) * 2) {
                    zhuLevel = i;
                    break;
                }
            }
        }
        return zhuLevel;
    },
    refreshBtns: function refreshBtns(data) {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            for (var t = 0; t < 3; t++) {
                cc.find('Canvas/seat' + i + '/fupai' + t).active = true;
            }
        }
        cc.find("Canvas/danzhu").active = true;
        cc.find("Canvas/lunshu").active = true;
        cc.find("Canvas/zongxiazhu").active = true;
        this._tips.node.active = false;
        this.countdown.node.active = false;
        this.freshCurrentZhu(data.currentZhu);
        this.freshCircleCount(data.turn);
        this._kanpai.active = true;
        this._qipai.active = true;
        this._genzhu.active = false;
        this._jiazhu.active = false;
        this._bipai.active = false;
        this.showXiaDiZhuAnim(data.currentZhu); //下底注动画
    },
    showXiaDiZhuAnim: function showXiaDiZhuAnim(currentZhu) {
        var children_baoliu = [];
        for (var i in this._zhuomian.children) {
            if (i < 5) {
                //只留5个底注的筹码
                children_baoliu.push(this._zhuomian.children[i]);
            }
            this._zhuomian.children[i].active = false;
        }
        this._zhuomian.removeAllChildren();
        for (var j in children_baoliu) {
            this._zhuomian.addChild(children_baoliu[j]);
        }
        this._zhuomian.active = true;
        var addMoney = 100;
        if (currentZhu) {
            addMoney = parseInt(currentZhu) * 0.5;
        }
        for (var k in this._seats) {
            if (!this._seats[k]._userName) {
                continue;
            };
            var data = {
                x: this._seats[k].node.x,
                y: this._seats[k].node.y,
                addMoney: addMoney,
                addMoneyLevel: 0
            };
            this.showZhuAnim(data, k);
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            self.refreshBtns(data.detail);
            // self.initSeats();
        });
        this.node.on('game_num', function (data) {
            // self.refreshBtns();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('kanpai', function (event) {
            var data = event.detail;
            var holds = data.holds;
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
            var currentZhu = data.currentZhu;
            self._genzhu.getChildByName('num').getComponent(cc.Label).string = cc.vv.utils.showJinbi(currentZhu, 'W');
        });
        this.node.on('qipai', function (event) {
            var data = event.detail;
            if (data.status == 'shu') {
                cc.find('Canvas/seat0/shuicon').active = true;
            } else {
                cc.find('Canvas/seat0/qiicon').active = true;
            }
            self._grayqipai.active = true;
            self._qipai.active = false;
            var holds = data.holds;
            var seat = self._seats[0];
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
        });
        this.node.on('game_myTurn_push', function (event) {
            var data = event.detail;
            self.addzhudetail = data.xiaZhuOptions;
            self.ops = data.xiaZhuExtra.ops;
            //可操作按钮
            if (data.canAddZhu) {
                self._jiazhu.active = true;
            }
            if (data.canGenzhu) {
                self._genzhu.active = true;
                var currentZhu = data.currentZhu;
                if (!data.hasCheckedPai) {
                    //暗注
                    currentZhu = currentZhu * 0.5;
                }
                self._genzhu.getChildByName('num').getComponent(cc.Label).string = cc.vv.utils.showJinbi(currentZhu, 'W');
            }
            if (data.canBiPai) {
                //满足比牌条件
                self._bipai.active = true;
            }
            if (data.allInFlag) {
                self._allin.active = true;
                // self._graygenzhu.active = false;
            } else {
                self._allin.active = false;
            }
        });
        this.node.on('gameOver_notify_push', function (event) {
            var i = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(event.detail));
            cc.find('Canvas/seat' + i + '/toggle').active = false;
        });
        this.node.on('game_turnChanged_push', function (event) {
            var i = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(event.detail));
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + i + '/toggle').active = true;
            self._seats[i].setTime();
            if (i != 0) {
                //如果没有轮到自己操作
                self._genzhu.active = false;
                self._jiazhu.active = false;
                self._bipai.active = false;
                self._zhu.active = false;
            }
        });
        this.node.on('game_timerInitCounter_push', function (event) {
            // console.log("ly:timer counter begin");
            var i = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(event.detail));
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + i + '/toggle').active = true;
            self._seats[i].setTime();
        });
        this.node.on('game_actionChanged_push', function (event) {
            var bp = cc.find('Canvas/edit/bipai');
            var data = event.detail;
            if (data.xiaZhuOptions) self.addzhudetail = data.xiaZhuOptions;
            if (data.xiaZhuExtra.ops) self.ops = data.xiaZhuExtra.ops;
            if (event.detail.canBiPai) {
                bp.active = true;
            } else {
                bp.active = false;
            }
        });
        this.node.on('guo_notify_push', function (event) {
            cc.find('Canvas/seat0/toggle').active = false;
        });
        this.node.on('genZhu_notify', function (event) {
            var userid = event.detail.userid;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var seat = self._seats[localIndex];
            seat.showGenZhu();
            var currentZhu = event.detail.currentZhu;
            var hasCheckedPai = event.detail.hasCheckedPai;
            var addMoney = event.detail.addMoney;
            var addMoneyLevel = event.detail.addMoneyLevel;
            self.freshCurrentZhu(currentZhu);
            var data = {
                x: seat.node.x,
                y: seat.node.y,
                addMoney: addMoney,
                addMoneyLevel: addMoneyLevel,
                hasCheckedPai: hasCheckedPai
            };
            self.showZhuAnim(data);
        });
        this.node.on('kanPai_notify', function (event) {
            var userid = event.detail;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showKanPai();
        });
        this.node.on('jiaZhu_notify', function (event) {
            var userid = event.detail.userid;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showJiaZhu();
            var currentZhu = event.detail.currentZhu;
            var hasCheckedPai = event.detail.hasCheckedPai;
            var addMoney = event.detail.addMoney;
            var addMoneyLevel = event.detail.addMoneyLevel;
            self.freshCurrentZhu(currentZhu);
            var data = {
                x: seat.node.x,
                y: seat.node.y,
                addMoney: addMoney,
                addMoneyLevel: addMoneyLevel,
                hasCheckedPai: hasCheckedPai
            };
            self.showZhuAnim(data);
        });
        this.node.on('qiPai_notify', function (event) {
            var data = event.detail;
            var userid = data.userId;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            seat.showQiPai(data.status);
        });
        this.node.on('win', function (data) {
            //赢了一局
            var data = data.detail;
            console.log('赢了一局', data);
            //赢的人显示手牌
            var userid = data.winer;
            var localIndex = cc.vv.gameNetMgr.getLocalIndexByUserIdZJH(userid);
            var seat = self._seats[localIndex];
            var holds = data.holds;
            var spriteFrames = [];
            for (var i = 0; i < 3; i++) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.fanPai(spriteFrames);
            //赢了的动画
            self.endData = data;
            self.isEnd = true;
            if (!self._pkPanel.active) {
                self.showEndAnim();
            }
        });
        this.node.on('game_moneyPool', function (data) {
            //刷新总注
            data = data.detail;
            var total = data.moneyPool;
            self._allZhuLabel.string = total; //总数
            //fresh其他人的数据
            var commonInfo = data.commonInfo;
            for (var i in commonInfo) {
                var userid = i;
                var temp = commonInfo[i];
                var costMoney = temp.costMoney; //下的注
                var money = temp.money; //所有用的钱
                //刷新这个人的信息
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seats = cc.vv.gameNetMgr.seats;
                seats[seatIndex].score = money;
                var seat = self._seats[localIndex];
                seat.setCostMoney(costMoney);
                seat.setMoney(money);
            }
        });
        this.node.on('message_notify', function (data) {
            //消息显示
            data = data.detail;
            var message = data.message;
            cc.vv.alert.show("注意", message);
        });
        this.node.on('game_circleCount', function (data) {
            //刷新轮数
            var circleCount = data.detail;
            self.freshCircleCount(circleCount);
        });
        this.node.on('clickPkButton', function (data) {
            var userId2 = data.detail;
            self.clickPkButton(userId2);
        });
        this.node.on('game_userInBipai_result', function (data) {
            data = data.detail;
            var winer = data.winer;
            var loser = data.loser;
            self.bipaiAnimQueue = [{
                winer: winer,
                loser: loser
            }]; //比牌队列
            self.bipaiAnimIndex = 0;
            self.showBipaiAnim();
        });
        this.node.on('game_wannaToCompare_push', function (data) {
            data = data.detail;
            if (!data || data.length < 1) {
                self._tips.node.active = false;
                return;
            }
            self._tips.string = "请选择比牌玩家";
            self._tips.node.active = true;
            for (var i in data) {
                var userid = data[i].userid;
                var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userid);
                var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
                var seat = self._seats[localIndex];
                seat.showPkButton();
            }
        });
        this.node.on('count_down', function (data) {
            if (self._tips.node.active) {
                self._tips.node.active = false;
            }
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('game_AntiResults', function (data) {
            //最后一轮的比牌
            data = data.detail;
            self.bipaiAnimQueue = [];
            for (var i in data) {
                var bipaiData = data[i];
                var winer = bipaiData['winUserid'];
                var loser = bipaiData['loseUserid'];
                self.bipaiAnimQueue.push({
                    winer: winer,
                    loser: loser
                }); //比牌队列
            }
            self.bipaiAnimIndex = 0;
            self.showBipaiAnim();
        });
        this.node.on('game_userInfoById', function (data) {
            //获取断线重连后的用户信息
            data = data.detail;
            self.freshUserInfo(data);
        });
        this.node.on('game_gameInfoById', function (data) {
            //获取断线重连后的游戏信息
            data = data.detail;
            self.freshGameInfo(data);
        });
        this.node.on('exit_room', function (data) {
            //刷新用户钱币数量
            self.getGemsAndCoins();
        });
        this.node.on('noMoney_exit', function (data) {
            //提示金钱不足
            cc.vv.alert.show("提示", "金钱不足，您将退出房间，请在活动领取每日金币补助");
        });
        this.node.on('match_exit_error', function (data) {
            //锦标赛不能退出游戏
            cc.vv.alert.show("提示", "锦标赛中不能退出游戏");
        });
        this.node.on('game_sbInAllIn', function (data) {
            //有人allin了
            console.log('game_sbInAllIn=====>', data.detail);
            data = data.detail;
            self.doAllin(data, function () {
                cc.vv.net.send('allInActiveFromClient'); //触发下一步
            });
        });
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        if (!seats) return;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
        var isOffline = !seat.online;
        // var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    onBtnBackClicked: function onBtnBackClicked() {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.director.loadScene("hall");
        }, true);
    },
    onBtnChatClicked: function onBtnChatClicked() {},
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnDissolveClicked: function onBtnDissolveClicked() {
        cc.vv.alert.show("解散房间", "解散房间不扣金币，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    },
    //点击看牌按钮
    kanpai: function kanpai() {
        cc.vv.net.send('kanpai');
    },
    //点击加注按钮，打开加注界面
    jiazhu: function jiazhu() {
        var self = this;
        for (var d in self.zhuobj) {
            cc.find('Canvas/zhu/' + self.zhuobj[d]).active = false;
        }
        self._zhu.active = true;
        for (var i in self.addzhudetail) {
            if (self.inObject(self.addzhudetail[i], self.ops)) {
                self._zhu.getChildByName('zhu' + i).active = true;
                self._zhu.getChildByName('zhu' + i).getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(self.addzhudetail[i], 'W');
            } else {
                self._zhu.getChildByName('zhu' + i + '_hui').active = true;
                self._zhu.getChildByName('zhu' + i + '_hui').getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(self.addzhudetail[i], 'W');
            };
        }
    },
    //点击比牌按钮
    bipai: function bipai() {
        cc.vv.net.send('wannaToComparePai');
        //显示其他人的pk按钮，选择和谁比牌
        // this.showOthersPkButton();
    },
    clickPkButton: function clickPkButton(userId2) {
        this.hideOhersPkButton();
        var userId1 = cc.vv.userMgr.userId; //自己
        cc.vv.net.send('bipai', {
            userId1: userId1,
            userId2: userId2
        });
    },
    //点击弃牌按钮
    qipai: function qipai() {
        cc.vv.net.send('qipai');
    },
    //点击跟注按钮
    genzhu: function genzhu() {
        cc.vv.net.send('genzhu');
    },
    addzhu: function addzhu(e) {
        var self = this,
            num;
        var index = e.target.name.split('zhu')[1];
        num = self.addzhudetail[index];
        console.log(num);
        cc.vv.net.send('addzhu', num);
        this._zhu.active = false;
    },
    getpaiRes: function getpaiRes(data) {
        var self = this;
        data = data + 1;
        var type, num, huase_big, huase_small;
        num = (data % 100).toString();
        if (data > 0 && data < 14) {
            type = '04'; //黑桃
            num = num + '-1'; //黑牌
        } else if (data > 100 && data < 114) {
            type = '03'; //红桃
            num = num + '-2'; //红牌
        } else if (data > 200 && data < 214) {
            type = '02'; //梅花
            num = num + '-1'; //黑牌
        } else if (data > 300 && data < 314) {
            type = '01'; //方块
            num = num + '-2'; //红牌
        }
        huase_big = "huase_big" + type;
        huase_small = "huase_small" + type;
        var result = {
            num: self.paigroup.getSpriteFrame(num),
            huase_big: self.paigroup.getSpriteFrame(huase_big),
            huase_small: self.paigroup.getSpriteFrame(huase_small)
        };
        // if (num == '1') num = 'A';
        // if (num == '11') num = 'J';
        // if (num == '12') num = 'Q';
        // if (num == '13') num = 'K';
        return result;
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name != "zhu") {
            cc.find('Canvas/zhu').active = false;
        }
        if (event.target.name == "back") {
            this.fanhui.active = true;
            this.helpshow.active = false;
            this.helpbtn.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
        }
        if (event.target.name == "helpbtn") {
            this.helpshow.active = true;
            this.helpbtn.active = false;
            this.fanhui.active = false;
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
            this.backAlert.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            this.helpbtn.active = true;
            this.backAlert.active = false;
        }
    },
    freshCurrentZhu: function freshCurrentZhu(current_zhu) {
        this._danzhu.string = "单注：" + current_zhu;
    },
    freshNumOfLun: function freshNumOfLun(num) {},
    restart: function restart() {
        this.clearEnd();
        this.initView();
        this.initSeats();
    },
    freshCircleCount: function freshCircleCount(circleCount) {
        this._lunshu.string = "轮数：" + (circleCount + 1) + "/15";
    },
    showPk: function showPk() {
        this._leftLie.active = false;
        this._rightLie.active = false;
        this._pkPanel.active = true;
        //播放比牌动画
        this._flashAnim.play('pk_shandian');
        this._bipaiAnim.play('bipai');
    },
    hidePk: function hidePk(data) {
        var self = this;
        setTimeout(function () {
            self.showLie(data);
            setTimeout(function () {
                self._pkPanel.active = false;
                self.bipaiAnimIndex++; //下一个比牌动画
                if (self.bipaiAnimIndex >= self.bipaiAnimQueue.length) {
                    //没有下一个动画了
                    if (self.isEnd) {
                        //如果标识为游戏结束
                        self.showEndAnim();
                    } else {
                        //如果没有结束,执行比牌系列动画结束后的回调函数
                        if (self.bipaiAnimCallback) {
                            self.bipaiAnimCallback();
                        }
                    }
                } else {
                    self.showBipaiAnim(); //执行下一个比牌动画
                }
            }, 1000);
        }, 1000);
    },
    showLie: function showLie(data) {
        //0-显示左边裂牌 1-显示右边裂牌
        if (data == 1) {
            this._rightLie.active = true;
        } else {
            this._leftLie.active = true;
        }
    },
    hideLie: function hideLie() {
        this._leftLie.active = false;
        this._rightLie.active = false;
    },
    showOthersPkButton: function showOthersPkButton() {
        for (var i in this._seats) {
            if (i == 0) continue;
            var seat = this._seats[i];
            seat.showPkButton();
        }
    },
    showZhuAnim: function showZhuAnim(data, dizhuLevel) {
        //下注动画
        if (!data) return;
        var x = data.x; //起始点X
        var y = data.y; //起始点Y
        var random_diff = Math.random() * 50;
        var endX = x * 0.2 + random_diff;
        var endY = y * 0.2 + random_diff;
        var addMoney = data.addMoney;
        var addMoneyLevel = data.addMoneyLevel;
        var node = this._zhuomian.children[0];
        var newNode = cc.instantiate(node);
        if (typeof dizhuLevel != 'undefined') {
            //如果是底注本身
            newNode = this._zhuomian.children[dizhuLevel];
            endX = newNode.x;
            endY = newNode.y;
        } else {
            this._zhuomian.addChild(newNode);
        }
        newNode.getChildByName('label').getComponent(cc.Label).string = cc.vv.utils.showJinbi(addMoney, 'W');
        var zhuObj = cc.find('Canvas/zhu/' + this.zhuobj[addMoneyLevel]);
        var zhuFrameCopy = zhuObj.getComponent(cc.Sprite).spriteFrame;
        newNode.getComponent(cc.Sprite).spriteFrame = zhuFrameCopy;
        newNode.x = x;
        newNode.y = y;
        newNode.active = true;
        var action = cc.moveTo(0.4, cc.p(endX, endY));
        newNode.runAction(action);
    },
    hideOhersPkButton: function hideOhersPkButton() {
        var self = this;
        self._tips.node.active = false;
        for (var i in this._seats) {
            if (i == 0) continue;
            var seat = this._seats[i];
            seat.hidePkButton();
        }
    },
    inObject: function inObject(data, obj) {
        var f = false;
        for (var i in obj) {
            if (data == obj[i]) {
                f = true;
                break;
            }
        }
        return f;
    },
    //结束动画
    showEndAnim: function showEndAnim() {
        var self = this;
        var data = self.endData;
        if (data) {
            var win_userid = data.winer;
            var holds = data.holds;
            var win_seatIndex = cc.vv.gameNetMgr.getLocalIndexZJH(cc.vv.gameNetMgr.getSeatIndexByID(win_userid));
            //取得座位
            var win_seat = self._seats[win_seatIndex];
            win_seat.showYanhua(); //放烟花
            //筹码移动动画
            // self._zhuomian.active = true;
            for (var i in self._zhuomian.children) {
                var node = self._zhuomian.children[i];
                var action = cc.moveTo(2, cc.p(win_seat.node.x, win_seat.node.y));
                node.oldX = node.x;
                node.oldY = node.y;
                node.runAction(action);
            }
            setTimeout(function () {
                // self._zhuomian.active = false;
                if (self._zhuomian) {
                    for (var i in self._zhuomian.children) {
                        var node = self._zhuomian.children[i];
                        if (node.oldX) {
                            node.x = node.oldX;
                        }
                        if (node.oldY) {
                            node.y = node.oldY;
                        }
                    }
                    //重新开始一局
                    self.restart();
                }
            }, 1500);
        }
    },
    clearEnd: function clearEnd() {
        var self = this;
        self.isEnd = false;
        self.endData = null;
        self._tips.string = "正在等待下一局游戏";
        self._tips.node.active = true;
        setTimeout(function () {
            cc.vv.net.send('ready');
        }, 1000);
    },
    //比牌动画
    showBipaiAnim: function showBipaiAnim() {
        var self = this;
        var bipaiData = self.bipaiAnimQueue[self.bipaiAnimIndex];
        var winer = bipaiData['winer'];
        var loser = bipaiData['loser'];
        var lpx = cc.find('Canvas/pk/leftPai').x,
            lpy = cc.find('Canvas/pk/leftPai').y,
            rpx = cc.find('Canvas/pk/rightPai').x,
            rpy = cc.find('Canvas/pk/rightPai').y;
        var WseatIndex = cc.vv.gameNetMgr.getSeatIndexByID(winer),
            LseatIndex = cc.vv.gameNetMgr.getSeatIndexByID(loser);
        var WlocalIndex = cc.vv.gameNetMgr.getLocalIndexZJH(WseatIndex),
            LlocalIndex = cc.vv.gameNetMgr.getLocalIndexZJH(LseatIndex);
        var b1 = cc.find('Canvas/seat' + WlocalIndex),
            b2 = cc.find('Canvas/seat' + LlocalIndex);
        cc.find('Canvas/pk/leftPai').x = b1.x;
        cc.find('Canvas/pk/leftPai').y = b1.y;
        cc.find('Canvas/pk').active = true;
        cc.find('Canvas/pk/leftPai').active = true;
        cc.find('Canvas/pk/rightPai').x = b2.x;
        cc.find('Canvas/pk/rightPai').y = b2.y;
        cc.find('Canvas/pk/rightPai').active = true;
        var action1 = cc.moveTo(0.4, cc.p(lpx, lpy)),
            action2 = cc.moveTo(0.4, cc.p(rpx, rpy));
        cc.find('Canvas/pk/leftPai').runAction(action1);
        cc.find('Canvas/pk/rightPai').runAction(action2);
        self.hideLie();
        setTimeout(function () {
            self.showPk();
            self.hidePk(1);
        }, 400);
    },
    //孤注一掷
    allin: function allin() {
        cc.vv.net.send('all_in');
    },
    //孤注一掷动画
    doAllin: function doAllin(data, callback) {
        var userid = data.userid; //发起孤注一掷的那个人
        var status = data.status; //0-输了 1-赢了
        var self = this;
        self.bipaiAnimQueue = [];
        for (var i in self._seats) {
            var seatData = self._seats[i];
            var seatUserId = seatData['_userId'];
            if (!seatUserId || seatUserId == userid) continue;
            var winer, loser;
            if (status == 0) {
                winer = seatUserId;
                loser = userid;
            } else {
                winer = userid;
                loser = seatUserId;
            }
            self.bipaiAnimQueue.push({
                winer: winer,
                loser: loser
            }); //比牌队列
        }
        self.bipaiAnimIndex = 0;
        self.showBipaiAnim();
        if (callback) {
            self.bipaiAnimCallback = callback;
        }
    }
});