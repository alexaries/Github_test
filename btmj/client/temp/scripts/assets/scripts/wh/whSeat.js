"use strict";
cc._RFpush(module, 'c09abMB5jFARJ4//LF7WpKU', 'whSeat');
// scripts/wh/whSeat.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _sprIcon: null,
        _zhuang: null,
        _ready: null,
        _offline: null,
        _lblName: null,
        _lblScore: null,
        _scoreBg: null,
        _nddayingjia: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _dayingjia: false,
        _isOffline: false,
        _isReady: false,
        _isZhuang: false,
        _userId: null,
        _fan: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("icon").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("score").getComponent(cc.Label);
        this._voicemsg = this.node.getChildByName("voicemsg");
        if (this._voicemsg) {
            this._voicemsg.active = false;
        }
        if (this._sprIcon && this._sprIcon.getComponent(cc.Button)) {
            cc.vv.utils.addClickEvent(this._sprIcon, this.node, "whSeat", "onIconClicked");
        }
        this._offline = this.node.getChildByName("offline");
        this._fan = this.node.getChildByName("fan") ? this.node.getChildByName("fan").getComponent(cc.Label) : null;
        this._ready = this.node.getChildByName("ready");
        this._zhuang = this.node.getChildByName("zhuang");
        this._scoreBg = this.node.getChildByName("Z_money_frame");
        this._nddayingjia = this.node.getChildByName("dayingjia");
        this._chatBubble = this.node.getChildByName("ChatBubble");
        if (this._chatBubble != null) {
            this._chatBubble.active = false;
        }
        this._emoji = this.node.getChildByName("emoji");
        if (this._emoji != null) {
            this._emoji.active = false;
        }
        this.refresh();
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
    },
    onIconClicked: function onIconClicked() {
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if (this._userId != null && this._userId > 0) {
            var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if (cc.vv.baseInfoMap) {
                var info = cc.vv.baseInfoMap[this._userId];
                if (info) {
                    sex = info.sex;
                }
            }
        }
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._nddayingjia != null) {
            this._nddayingjia.active = this._dayingjia == true;
        }
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
        if (this._zhuang) {
            this._zhuang.active = this._isZhuang;
        }
        this.node.active = this._userName != null && this._userName != "";
    },
    setInfo: function setInfo(name, score, fan) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._scoreBg != null) {
            this._scoreBg.active = this._score != null;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        if (this._fan) {
            this._fan.string = fan ? fan + "番" : "0番";
        }
        this.refresh();
    },
    setZhuang: function setZhuang(value) {
        this._isZhuang = value;
        if (this._zhuang) {
            this._zhuang.active = value;
        } else {
            this._zhuang = this.node.getChildByName("zhuang");
            this._zhuang.active = value;
        }
    },
    setReady: function setReady(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && cc.vv.gameNetMgr.numOfGames > 0;
        }
    },
    setID: function setID(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    setOffline: function setOffline(isOffline) {
        this._isOffline = isOffline;
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    chat: function chat(content) {
        if (this._chatBubble == null || this._emoji == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        //emoji = JSON.parse(emoji);
        if (this._emoji == null || this._emoji == null) {
            return;
        }
        console.log(_emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(_emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function voiceMsg(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
    }
});

cc._RFpop();