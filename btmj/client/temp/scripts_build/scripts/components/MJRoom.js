"use strict";
cc._RFpush(module, '921dfQJZddJ+5GFUXqxmMmT', 'MJRoom');
// scripts/components/MJRoom.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _seats2: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initView();
        this.initSeats();
        this.initEventHandlers();
    },
    initView: function initView() {
        var prepare = this.node.getChildByName("prepare");
        var seats = prepare.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }
        this.refreshBtns();
        this.lblRoomNo = cc.find("Canvas/infobar/Z_room_txt/New Label").getComponent(cc.Label);
        this._timeLabel = cc.find("Canvas/infobar/time").getComponent(cc.Label);
        this.lblRoomNo.string = cc.vv.gameNetMgr.roomId;
        var gameChild = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideNode = gameChild.getChildByName(sides[i]);
            var seat = sideNode.getChildByName("seat");
            this._seats2.push(seat.getComponent("Seat"));
        }
        var btnWechat = cc.find("Canvas/prepare/btnWeichat");
        if (btnWechat) {
            cc.vv.utils.addClickEvent(btnWechat, this.node, "MJRoom", "onBtnWeichatClicked");
        }
    },
    refreshBtns: function refreshBtns() {
        var prepare = this.node.getChildByName("prepare");
        var btnExit = prepare.getChildByName("btnExit");
        var btnDispress = prepare.getChildByName("btnDissolve");
        var btnWeichat = prepare.getChildByName("btnWeichat");
        var btnBack = prepare.getChildByName("btnBack");
        var isIdle = cc.vv.gameNetMgr.numOfGames == 0;
        btnExit.active = !cc.vv.gameNetMgr.isOwner() && isIdle;
        btnDispress.active = cc.vv.gameNetMgr.isOwner() && isIdle;
        btnWeichat.active = isIdle;
        btnBack.active = isIdle;
    },
    initEventHandlers: function initEventHandlers() {
        var self = this;
        this.node.on('new_user', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            self.initSingleSeat(data.detail);
        });
        this.node.on('game_begin', function (data) {
            self.refreshBtns();
            self.initSeats();
        });
        this.node.on('game_num', function (data) {
            self.refreshBtns();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            self._seats[localIdx].chat(data.content);
            self._seats2[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            var index = data.content;
            var info = cc.vv.chat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            self._seats2[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndex(idx);
            console.log(data);
            self._seats[localIdx].emoji(data.content);
            self._seats2[localIdx].emoji(data.content);
        });
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndex(seat.seatindex);
        var isOffline = !seat.online;
        var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        console.log("isOffline:" + isOffline);
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
        this._seats2[index].setInfo(seat.name, seat.score);
        this._seats2[index].setZhuang(isZhuang);
        this._seats2[index].setOffline(isOffline);
        this._seats2[index].setID(seat.userid);
        this._seats2[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    onBtnBackClicked: function onBtnBackClicked() {
        cc.vv.alert.show("返回大厅", "返回大厅房间仍会保留，快去邀请大伙来玩吧！", function () {
            cc.director.loadScene("newhall");
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
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndex(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            this._seats2[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            console.log(msgInfo.msg.length);
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
        this._seats2[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    }
});

cc._RFpop();