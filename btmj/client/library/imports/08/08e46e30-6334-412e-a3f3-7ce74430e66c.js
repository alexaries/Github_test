"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
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
        helpshow: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        fan: cc.Node,
        jinbi: cc.Node,
        countdown: cc.Label,
        win: cc.Node,
        lose: cc.Node,
        _pai: null,
        _pais: [],
        _text: null,
        _zongzhu: null,
        _btnFirst: null,
        _btnSecond: null,
        _btnThird: null,
        _Checkbox: [],
        _secondLeft: [],
        _secondOther: [],
        _thirdLeft: [],
        _thirdOther: [],
        _thirdAllIn: null,
        _thirdJiazhu: null,
        _jiaZhu: null,
        _jiaZhu_cover: null,
        _timeout: null,
        timerCounter: 0
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.addComponent("ReConnect");
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("dzpkSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label);
        this._difen = cc.find("Canvas/difen").getComponent(cc.Label);
        this._zongzhu = cc.find("Canvas/zongxiazhu/label").getComponent(cc.Label);
        this._text = cc.find("Canvas/text0").getComponent(cc.Label);
        this._text.string = "白手起家(6人)：" + cc.vv.NetMgr.consume_num + "/" + 2 * cc.vv.NetMgr.consume_num + " 扑克牌：5-A 限注(1倍底池)";
        this._pai = cc.find("Canvas/pai");
        for (var i = 0; i < this._pai.childrenCount; i++) {
            this._pais[i] = this._pai.getChildByName("pai" + i);
        };
        this._pai.active = false;
        this._difen.node.active = true;
        this._btnFirst = cc.find("Canvas/buttons/first");
        this._btnSecond = cc.find("Canvas/buttons/second");
        this._btnThird = cc.find("Canvas/buttons/third");
        this._btnThird.active = false;
        this._btnSecond.active = false;
        this._btnFirst.active = false;
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            this._Checkbox[i] = this._btnFirst.children[i];
            this._Checkbox[i].getChildByName('button').index = i;
            cc.vv.utils.addClickEvent(this._Checkbox[i].getChildByName('button'), this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 3; i++) {
            this._secondLeft[i] = this._btnSecond.getChildByName('dichi' + i);
            this._secondLeft[i].index = i;
            cc.vv.utils.addClickEvent(this._secondLeft[i], this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 3; i++) {
            this._secondOther[i] = this._btnSecond.getChildByName('dichi_cover' + i);
            this._secondOther[i].index = i;
        };
        for (var i = 0; i < 5; i++) {
            this._thirdLeft[i] = this._btnThird.getChildByName('tnum' + i);
            this._thirdLeft[i].index = i;
            cc.vv.utils.addClickEvent(this._thirdLeft[i], this.node, "dzpkAll", "onBtnClicked");
        };
        for (var i = 0; i < 5; i++) {
            this._thirdOther[i] = this._btnThird.getChildByName('tnum_cover' + i);
            this._thirdOther[i].index = i;
        };
        this._thirdJiazhu = this._btnThird.getChildByName('tjiazhu');
        cc.vv.utils.addClickEvent(this._thirdJiazhu, this.node, "dzpkAll", "onBtnClicked");
        this._thirdAllIn = this._btnThird.getChildByName('select').getChildByName('quanxia');
        cc.vv.utils.addClickEvent(this._thirdAllIn, this.node, "dzpkAll", "onBtnClicked");
        this._genPai = this._btnSecond.getChildByName('genpai');
        this._rangPai = this._btnSecond.getChildByName('rangpai');
        this._qiPai = this._btnSecond.getChildByName('qipai');
        this._jiaZhu = this._btnSecond.getChildByName('jiazhu');
        this._jiaZhu_cover = this._btnSecond.getChildByName('jiazhu_cover');
        cc.vv.utils.addClickEvent(this._genPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._rangPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._qiPai, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this._jiaZhu, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.back, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "dzpkAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "dzpkAll", "onBtnClicked");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("ready");
        if (cc.vv.userMgr.reconnection == 1) {
            //断线重连
            cc.vv.userMgr.reconnection = 0;
            cc.vv.net.send("getGameInfoByUserid");
        }
        cc.vv.audioMgr.playBGM("back.mp3");
        cc.vv.net.send("getUserHolds");
    },
    initView: function initView() {
        this._tips.node.active = true;
        this._zongzhu.string = 0;
        this._difen.string = "底池：" + 0;
        this._difen.money = 0;
    },
    restart: function restart() {
        if (this._zongzhu) this._zongzhu.string = 0;
        if (this._difen) {
            this._difen.string = "底池：" + 0;
            this._difen.money = 0;
        }
        this.win.active = false;
        this.lose.active = false;
        this._pai.active = false;
        this._tips.node.active = true;
        var seats = cc.vv.NetMgr.seats;
        if (seats) {
            for (var i = 0; i < seats.length; ++i) {
                var index = cc.vv.NetMgr.getLocalIndexByUserId(seats[i].userid);
                this._seats[index].restart();
                this._seats[index].status = "";
            }
        }
        cc.vv.net.send("ready");
    },
    initSeats: function initSeats() {
        var seats = cc.vv.NetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.NetMgr.getLocalIndexByUserId(seat.userid);
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "back") {
            this.fanhui.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
            this.helpshow.active = false;
            if (this._btnThird.active) {
                this._btnThird.active = false;
                this._btnSecond.active = true;
            }
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.backAlert.active = true;
        }
        if (event.target.name == "pai") {
            this.fanhui.active = false;
            this.helpshow.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.backAlert.active = false;
        }
        if (event.target.name == "button") {
            for (var i = 0; i < this._Checkbox.length; i++) {
                if (event.target.index == i) {
                    continue;
                } else {
                    this._Checkbox[i].getComponent("CheckBox").checked = false;
                    this._Checkbox[i].getComponent("CheckBox").refresh();
                }
            };
        }
        if (event.target.name == "rangpai") {
            cc.vv.net.send("rangpai");
        }
        if (event.target.name == "qipai") {
            cc.vv.net.send("qipai");
        }
        if (event.target.name == "genpai") {
            cc.vv.net.send("genpai", event.target.money);
        }
        if (event.target.name == "jiazhu") {
            this._btnThird.active = true;
            this._btnSecond.active = false;
        }
        if (event.target.name.indexOf('dichi') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('tnum') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('tjiazhu') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
        if (event.target.name.indexOf('quanxia') > -1) {
            cc.vv.net.send("jiazhu", event.target.money);
        }
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        this.fanhui.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.NetMgr.getLocalIndex(idx);
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
    //转换对应的牌
    ConversionCardRes: function ConversionCardRes(n) {
        var type = 4;
        var color = 1;
        if (n >= 13 && n < 26) {
            type = 3;
            n = n - 13;
            color = 2;
        } else if (n >= 26 && n < 39) {
            type = 2;
            n = n - 26;
        } else if (n >= 39 && n < 52) {
            type = 1;
            n = n - 39;
            color = 2;
        } else {
            type = 4;
        }
        var num = 0;
        num = n + 2;
        if (num == 14) {
            num = 1;
        }
        var data = {
            num: this.paigroup.getSpriteFrame(num + "-" + color),
            h_s: this.paigroup.getSpriteFrame("huase_small0" + type),
            h_b: this.paigroup.getSpriteFrame("huase_big0" + type)
        };
        return data;
    },
    showOtherSeat: function showOtherSeat(type) {
        var seats = cc.vv.NetMgr.seats;
        for (var i = 0; i < seats.length; i++) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(seats[i].userid);
            if (type == 1) {
                this._seats[index].showBeiPai(true); //显示牌的背面
            }
            if (type == 2) {
                this._seats[index].showOps(); //隐藏其他桌子的操作icon
                this._seats[index].hideScore();
            }
        };
    },
    setBtnOps: function setBtnOps(type, obj) {
        if (type == 1) {
            this._btnFirst.active = false;
            this._btnThird.active = false;
            this._btnSecond.active = true;
            this._btnThird.getChildByName("select").getChildByName("slider").getChildByName("Handle").y = -172;
        }
        if (type == 2) {
            this._btnSecond.active = false;
            this._btnFirst.active = true;
            this._btnThird.active = false;
            this._Checkbox[1].active = true;
            this._Checkbox[2].active = false;
            this._Checkbox[3].active = true;
            this._Checkbox[4].active = false;
        }
        if (type == 3) {
            this._btnThird.active = true;
            this._btnSecond.active = false;
            this._btnFirst.active = false;
        }
        if (type == 4) {
            this._btnThird.active = false;
            this._btnSecond.active = false;
            this._btnFirst.active = false;
        }
        if (type == 5) {
            for (var i = 0; i < this._thirdLeft.length; i++) {
                this._thirdLeft[i].getChildByName('num').getComponent(cc.Label).string = obj[i];
                this._thirdLeft[i].money = obj[i];
                this._thirdOther[i].getChildByName('num').getComponent(cc.Label).string = obj[i];
            }
        }
        if (obj && type != 5) {
            if (obj.canGen) {
                this._genPai.active = true;
                this._rangPai.active = false;
                this._genPai.money = obj.GenMoney;
                this._genPai.getChildByName('num').getComponent(cc.Label).string = "跟" + obj.GenMoney;
                if (obj.needAllIn) {
                    this._genPai.getChildByName('num').getComponent(cc.Label).string = "全下";
                    this._jiaZhu.active = false;
                    this._jiaZhu_cover.active = true;
                } else {
                    this._jiaZhu.active = true;
                    this._jiaZhu_cover.active = false;
                }
            } else {
                this._genPai.active = false;
                this._rangPai.active = true;
                this._jiaZhu_cover.active = false;
            }
            for (var i = 0; i < 3; i++) {
                this._secondLeft[i].getChildByName('title').getComponent(cc.Label).string = obj.extraAddOps[i].desc;
                this._secondLeft[i].money = obj.extraAddOps[i].money;
                this._secondOther[i].getChildByName('title').getComponent(cc.Label).string = obj.extraAddOps[i].desc;
                if (obj.addMaxMoney >= obj.extraAddOps[i].money) {
                    this._secondLeft[i].active = true;
                    this._secondOther[i].active = false;
                } else {
                    this._secondLeft[i].active = false;
                    this._secondOther[i].active = true;
                }
                if (obj.needAllIn && this._genPai.money < obj.extraAddOps[i].money) {
                    this._secondLeft[i].active = false;
                    this._secondOther[i].active = true;
                }
            }
            for (var i = 0; i < 5; i++) {
                if (obj.addMaxMoney >= this._thirdLeft[i].money && obj.addMinMoney <= this._thirdLeft[i].money) {
                    this._thirdLeft[i].active = true;
                    this._thirdOther[i].active = false;
                } else {
                    this._thirdLeft[i].active = false;
                    this._thirdOther[i].active = true;
                }
            };
        }
    },
    refreshFirstBtn: function refreshFirstBtn(data) {
        if (parseInt(data.argStatus) == 1) {
            this._Checkbox[1].active = false;
            this._Checkbox[2].getChildByName("text").getComponent(cc.Label).string = "跟" + data.genMoney;
            this._Checkbox[1].getComponent("CheckBox").checked = false;
            this._Checkbox[1].getComponent("CheckBox").refresh();
            this._Checkbox[2].active = true;
        } else if (parseInt(data.argStatus) == 2) {
            this._Checkbox[1].active = false;
            this._Checkbox[2].active = true;
            this._Checkbox[2].getChildByName("text").getComponent(cc.Label).string = "全下";
            this._Checkbox[3].active = false;
            this._Checkbox[4].active = true;
            this._Checkbox[1].getComponent("CheckBox").checked = false;
            this._Checkbox[1].getComponent("CheckBox").refresh();
            this._Checkbox[3].getComponent("CheckBox").checked = false;
            this._Checkbox[3].getComponent("CheckBox").refresh();
        } else {
            this._Checkbox[1].active = true;
            this._Checkbox[2].active = false;
            this._Checkbox[3].active = true;
            this._Checkbox[4].active = false;
        }
        this._Checkbox[2].money = data.genMoney;
        this._Checkbox[2].getComponent("CheckBox").checked = false;
        this._Checkbox[2].getComponent("CheckBox").refresh();
    },
    prepOps: function prepOps(data) {
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            if (this._Checkbox[i].getComponent("CheckBox").checked) {
                if (i == 0 && data.canGuo) {
                    cc.vv.net.send("rangpai");
                } else if (i == 0 && !data.canGuo) {
                    cc.vv.net.send("qipai");
                }
                if (i == 1 && data.canGuo) {
                    cc.vv.net.send("rangpai");
                }
                if (i == 2 && data.canGen) {
                    cc.vv.net.send("genpai");
                    // cc.vv.net.send("jiazhu", this._Checkbox[i].money);
                }
                if (i == 3 && data.canGen) {
                    cc.vv.net.send("genpai", this._Checkbox[2].money);
                }
                this._Checkbox[i].getComponent("CheckBox").checked = false;
                this._Checkbox[i].getComponent("CheckBox").refresh();
            }
        }
    },
    unchecked: function unchecked() {
        for (var i = 0; i < this._btnFirst.childrenCount; i++) {
            this._Checkbox[i].getComponent("CheckBox").checked = false;
            this._Checkbox[i].getComponent("CheckBox").refresh();
        }
    },
    onSliderBack: function onSliderBack(event) {
        this._thirdAllIn.active = false;
        var num = 0;
        if (event.progress >= 0.1 && event.progress < 0.2) {
            num = 100;
        } else if (event.progress >= 0.2 && event.progress < 0.3) {
            num = 200;
        } else if (event.progress >= 0.3 && event.progress < 0.4) {
            num = 300;
        } else if (event.progress >= 0.4 && event.progress < 0.5) {
            num = 400;
        } else if (event.progress >= 0.5 && event.progress < 0.6) {
            num = 500;
        } else if (event.progress >= 0.6 && event.progress < 0.7) {
            num = 600;
        } else if (event.progress >= 0.7 && event.progress < 0.8) {
            num = 700;
        } else if (event.progress >= 0.8 && event.progress < 0.9) {
            num = 800;
        } else if (event.progress >= 0.9 && event.progress < 1) {
            num = 900;
        } else if (event.progress == 1) {
            if (this._seats[0]._score == this._thirdJiazhu.maxMoney) {
                this._thirdAllIn.active = true;
                this._thirdAllIn.money = this._thirdJiazhu.maxMoney;
            }
            num = 1000;
        }
        if (this._thirdJiazhu.firstMoney + num >= this._thirdJiazhu.maxMoney) {
            this._thirdJiazhu.money = this._thirdJiazhu.maxMoney;
        } else {
            this._thirdJiazhu.money = this._thirdJiazhu.firstMoney + num;
        }
        this._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = this._thirdJiazhu.money;
    },
    //断线重连刷新信息
    ReconnectionInfo: function ReconnectionInfo(data) {
        if (data.addOptions.length == 5) this.setBtnOps(5, data.addOptions);
        this._difen.string = "底池：" + data.diChi;
        this._difen.money = data.diChi;
        this._tips.node.active = false;
        if (data.circleHolds.length > 0) {
            for (var i = 0; i < data.circleHolds.length; i++) {
                var paiRes = this.ConversionCardRes(parseInt(data.circleHolds[i]));
                this._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            if (this._pais[data.circleHolds.length - 1]) this._pais[data.circleHolds.length - 1].active = true;
            if (this._pais[data.circleHolds.length]) this._pais[data.circleHolds.length].active = false;
            if (this._pais[data.circleHolds.length + 1]) this._pais[data.circleHolds.length + 1].active = false;
            this._pai.active = true;
        }
        for (var i = 0; i < data.players.length; i++) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.players[i].userid);
            if (data.players[i].canOps) {
                cc.find('Canvas/seat' + index + '/toggle').active = true;
                this._seats[index].setTime(data.timer_Counter);
            } else {
                cc.find('Canvas/seat' + index + '/toggle').active = false;
            }
            var zhu = {
                money: data.players[i].cZhu,
                type: 1
            };
            this._seats[index].setZhu(zhu);
            this._seats[index].setMoney(data.players[i].money);
        }
        this.showOtherSeat(1);
        cc.vv.net.send("getUserInfoByUserid");
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.NetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            //新人加入房间
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            var data = data.detail;
            self._tips.node.active = false;
            for (var i = 0; i < data.players.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data.players[i].userid);
                seat.score = data.players[i].money;
                var index = cc.vv.NetMgr.getLocalIndexByUserId(data.players[i].userid);
                var zhu = {
                    money: data.players[i].cZhu,
                    type: 1
                };
                self._seats[index].setZhu(zhu);
                self._seats[index].setMoney(seat.score);
            };
            if (data.gameInfo.addOptions.length == 5) self.setBtnOps(5, data.gameInfo.addOptions);
        });
        this.node.on('socket_MyHolds', function (data) {
            var data = data.detail;
            if (data) {
                if (!self._seats[0]._pai.active) {
                    self._tips.node.active = false;
                    self._seats[0].setPai(data, self);
                }
            }
        });
        this.node.on('game_diChiUpdate', function (data) {
            self._difen.string = "底池：" + data.detail;
            self._difen.money = data.detail;
        });
        this.node.on('game_myInfo', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].setPai(data.holds, self);
            self._seats[index].setMoney(data.money);
            self.showOtherSeat(1);
        });
        this.node.on('game_myTurn', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + index + '/toggle').active = true;
            self._seats[index].setTime();
            self.setBtnOps(1, data);
            self._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = data.addMinMoney;
            self._thirdJiazhu.money = data.addMinMoney;
            self._thirdJiazhu.firstMoney = data.addMinMoney;
            self._thirdJiazhu.maxMoney = data.addMaxMoney;
            self.prepOps(data);
        });
        this.node.on('game_turnChanged', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            for (var t = 0; t < 5; t++) {
                cc.find('Canvas/seat' + t + '/toggle').active = false;
            }
            cc.find('Canvas/seat' + index + '/toggle').active = true;
            self._seats[index].setTime();
            cc.find('Canvas/seat0/toggle').active = false;
            if (self._seats[0]._pai.active) {
                if (self._seats[0].status == "AllIn") {
                    self.setBtnOps(4);
                } else {
                    self.setBtnOps(2);
                }
            }
        });
        this.node.on('game_oneGuo', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            cc.find('Canvas/seat' + index + '/toggle').active = false;
            self._seats[index].showOps('rangpai');
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneGen', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('genpai');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneAdd', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('jiazhu');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            if (self._seats[0]._pai.active) {
                self.setBtnOps(2);
            }
        });
        this.node.on('game_oneAllIn', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].showOps('quanxia');
            var d = {
                money: data.cZhu,
                type: 1
            };
            self._seats[index].setMoney(data.money);
            self._seats[index].setZhu(d);
            self._seats[index].status = data.status;
            if (self._seats[0]._pai.active) {
                if (cc.vv.userMgr.userId == data.userid) {
                    self.setBtnOps(4);
                }
            }
        });
        this.node.on('game_oneQuit', function (data) {
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.detail);
            cc.find('Canvas/seat' + index + '/toggle').active = false;
            self._seats[index].showOps('qipai');
            self._seats[index].showBeiPai(false);
            if (cc.vv.userMgr.userId == data.detail) self.setBtnOps(4);
        });
        this.node.on('game_allGuo', function (data) {
            for (var i = 0; i < self._seats.length; i++) {
                if (self._seats[i].node.active) {
                    var d = {
                        money: 0,
                        type: 1
                    };
                    self._seats[i].setZhu(d);
                }
            };
        });
        this.node.on('game_playersInNewCircle', function (data) {
            var data = data.detail;
            for (var i = 0; i < data.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data[i].userid);
                if (seat) {
                    seat.score = data.money;
                    var index = cc.vv.NetMgr.getLocalIndexByUserId(data[i].userid);
                    cc.find('Canvas/seat' + index + '/toggle').active = false;
                    if (self._seats[index].status != "AllIn") self._seats[index].showOps();
                    self._seats[index].setMoney(data[i].money);
                    // var d = {
                    //     money: data[i].cZhu,
                    //     type: 1
                    // }
                    // self._seats[index].setZhu(d);
                    if (self._seats[index]._paimian && !self._seats[index]._paimian.active) {
                        self._seats[index].hideScore();
                    }
                    if (self._seats[0]._pai.active) {
                        if (self._seats[index].status == "AllIn") {
                            self.setBtnOps(4);
                        } else {
                            self.setBtnOps(2);
                        }
                    } else {
                        self._seats[0].hideScore();
                    }
                }
            };
        });
        this.node.on('game_newCircle', function (data) {
            self._zongzhu.string = self._difen.money;
            var data = data.detail;
            for (var i = 0; i < data.circleHolds.length; i++) {
                var paiRes = self.ConversionCardRes(parseInt(data.circleHolds[i]));
                self._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                self._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                self._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            if (self._pais[data.circleHolds.length - 1]) self._pais[data.circleHolds.length - 1].active = true;
            if (self._pais[data.circleHolds.length]) self._pais[data.circleHolds.length].active = false;
            if (self._pais[data.circleHolds.length + 1]) self._pais[data.circleHolds.length + 1].active = false;
            self._pai.active = true;
        });
        this.node.on('game_caculateResult', function (data) {
            cc.find('Canvas/seat0/toggle').active = false;
        });
        this.node.on('game_myARGStatusChanged', function (data) {
            self.refreshFirstBtn(data.detail);
        });
        this.node.on('game_gameInfoById', function (data) {
            self.ReconnectionInfo(data.detail);
        });
        this.node.on('game_userInfoById', function (data) {
            var data = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(data.userid);
            self._seats[index].setPai(data.holds, self);
            if (data.canOps) {
                self.setBtnOps(1, data);
            } else {
                self.setBtnOps(2, data);
            }
            self._thirdJiazhu.getChildByName('label').getComponent(cc.Label).string = data.addMinMoney;
            self._thirdJiazhu.money = data.addMinMoney;
            self._thirdJiazhu.firstMoney = data.addMinMoney;
            self._thirdJiazhu.maxMoney = data.addMaxMoney;
            self.prepOps(data);
        });
        this.node.on('game_winner', function (data) {
            self.win.active = true;
        });
        this.node.on('game_loser', function (data) {
            self.lose.active = true;
        });
        this.node.on('game_over', function (data) {
            var data = data.detail;
            self.showOtherSeat(2);
            for (var i = 0; i < data.length; i++) {
                var seat = cc.vv.NetMgr.getSeatByID(data[i].userid);
                if (seat) {
                    seat.score = data[i].money;
                    var index = cc.vv.NetMgr.getLocalIndexByUserId(data[i].userid);
                    self._seats[index].showHoldsPai(data[i].holds, self);
                    self._seats[index].setMoney(data[i].money);
                    if (data[i].isWinner) {
                        self._seats[index].showWinText(parseInt(data[i].score[0]));
                    } else {
                        self._seats[index].showWinText();
                    }
                }
            }
            self.setBtnOps(4);
            self._timeout = setTimeout(function () {
                self.restart();
            }, 3000);
        });
        this.node.on('user_state_changed', function (data) {
            var seat = data.detail;
            var index = cc.vv.NetMgr.getLocalIndexByUserId(seat.userid);
            self._seats[index].seatHide();
        });
        this.node.on('exit_result', function (data) {
            clearInterval(self._timeout);
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.NetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.NetMgr.getLocalIndex(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('count_down', function (data) {
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('exit_room', function (data) {
            clearInterval(self._timeout);
            //刷新用户钱币数量
            self.getGemsAndCoins();
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
    }
});