"use strict";
cc._RFpush(module, 'c3d5fiQArFKY7H29sGP47FH', 'dzpkSeat');
// scripts/dzpk/dzpkSeat.js

"use strict";

var _properties;

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

cc.Class({
    extends: cc.Component,
    properties: (_properties = {
        _sprIcon: null,
        _ready: null,
        _lblName: null,
        _lblScore: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _isOffline: false,
        _userId: null,
        _time: -1,
        _op: null,
        _pai: null,
        _pais: [],
        _pai1: null,
        _pais1: [],
        _paimian: null,
        _timeLabel: null
    }, _defineProperty(_properties, "_time", -1), _defineProperty(_properties, "_toggle", null), _properties),
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("head").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("money").getComponent(cc.Label);
        this._op = this.node.getChildByName("text");
        this._xiazhu = this.node.getChildByName("xiazhu").getChildByName("money").getComponent(cc.Label);
        this._pai = this.node.getChildByName("pai");
        this._pai1 = this.node.getChildByName("jieguo");
        if (this._pai) {
            for (var i = 0; i < this._pai.childrenCount; i++) {
                this._pais[i] = this._pai.getChildByName("pai" + i);
            };
        }
        if (this._pai1) {
            for (var i = 0; i < this._pai1.childrenCount; i++) {
                this._pais1[i] = this._pai1.getChildByName("pai" + i);
            };
        }
        this._paimian = this.node.getChildByName("paimian");
        this._chatBubble = this.node.getChildByName("ChatBubble");
        this._emoji = this.node.getChildByName("emoji");
        this._count = this.node.getChildByName('count');
        this._op.active = false;
        this._xiazhu.string = 0;
        if (this._pai) this._pai.active = false;
        if (this._paimian) this._paimian.active = false;
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
        this._toggle = this.node.getChildByName("toggle");
        this._timeLabel = this.node.getChildByName("toggle").getChildByName("lblTime").getComponent(cc.Label);
        this._timeLabel.string = "00";
        this.refresh();
    },
    refresh: function refresh() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._chatBubble) {
            this._chatBubble.active = false;
        }
        if (this._emoji) {
            this._emoji.active = false;
        }
        if (this._paimian) this._paimian.active = false;
        if (this._pai) this._pai.active = false;
        if (this._pai1) this._pai1.active = false;
        this.node.active = this._userName != null && this._userName != "";
    },
    restart: function restart() {
        if (this._paimian) this._paimian.active = false;
        if (this._pai) this._pai.active = false;
        if (this._pai1) this._pai1.active = false;
        if (this._op) this._op.active = false;
        if (this._lblName) this._lblName.node.active = true;
        this.node.getChildByName("cover").active = false;
        this.node.getChildByName("xiazhu").active = false;
    },
    setInfo: function setInfo(name, score) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },
    hideScore: function hideScore() {
        this.node.getChildByName("xiazhu").active = false;
    },
    setZhu: function setZhu(data) {
        var self = this;
        var time = 0;
        if (data.money > 0) {
            time = 350;
        }
        var fn = function fn(n) {
            setTimeout(function () {
                n ? n.active = false : null;
                if (!self.node.getChildByName("xiazhu").active) self.node.getChildByName("xiazhu").active = true;
                if (data.money == 0) self.node.getChildByName("xiazhu").active = false;
                if (data.type == 1) {
                    self._xiazhu.string = data.money;
                } else {
                    self._xiazhu.string = parseInt(self._xiazhu.string) + data.money;
                }
            }, time);
        };
        if (data.money > 0) {
            this.showXiaZhuAnim(fn);
        } else {
            fn(null);
        }
    },
    seatHide: function seatHide() {
        this.node.active = false;
        this._xiazhu.string = 0;
        this.node.getChildByName("xiazhu").active = false;
        this._op.active = false;
        this._userName = "";
        for (var i = 0; i < this._op.childrenCount; i++) {
            this._op.children[i].active = false;
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
    getID: function getID() {
        return this._userId;
    },
    chat: function chat(content) {
        if (this._chatBubble == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function emoji(_emoji) {
        if (this._emoji == null) {
            return;
        }
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
    showXiaZhuAnim: function showXiaZhuAnim(callback) {
        var x = this._lblScore.node.x;
        var y = this._lblScore.node.y;
        var endX = this.node.getChildByName("xiazhu").x;
        var endY = this.node.getChildByName("xiazhu").y;
        var node = this.node.getChildByName('chips');
        var newNode = cc.instantiate(node);
        newNode.name = "chips";
        this.node.addChild(newNode);
        newNode.active = true;
        newNode.spriteFrame = node.getComponent(cc.Sprite).spriteFrame;
        newNode.x = x;
        newNode.y = y;
        var action = cc.moveTo(0.35, cc.p(endX, endY));
        newNode.runAction(action);
        callback(newNode);
    },
    showOps: function showOps(type) {
        if (!this._op) return;
        if (type) {
            this._op.active = true;
            for (var i = 0; i < this._op.childrenCount; i++) {
                if (this._op.children[i].name == type) {
                    this._op.children[i].active = true;
                } else {
                    this._op.children[i].active = false;
                }
            };
            if (type == "qipai") {
                this.node.getChildByName("cover").active = true;
            }
            this._lblName.node.active = false;
        } else {
            if (this._op.getChildByName("qipai").active) {
                this._lblName.node.active = false;
            } else {
                this._lblName.node.active = true;
                this._op.active = false;
            }
        }
    },
    setPai: function setPai(data, parent) {
        if (data.length == 2 && this._pais.length > 0) {
            for (var i = 0; i < data.length; i++) {
                var paiRes = parent.ConversionCardRes(parseInt(data[i]));
                this._pais[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            this._pai.active = true;
        }
    },
    showHoldsPai: function showHoldsPai(data, parent) {
        if (data.length == 2 && this._pais1) {
            for (var i = 0; i < data.length; i++) {
                var paiRes = parent.ConversionCardRes(parseInt(data[i]));
                this._pais1[i].getChildByName('num').getComponent(cc.Sprite).spriteFrame = paiRes['num'];
                this._pais1[i].getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = paiRes['h_s'];
                this._pais1[i].getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = paiRes['h_b'];
            };
            this._pai1.active = true;
            if (this._paimian) this._paimian.active = false;
            if (this._pai) this._pai.active = false;
        }
    },
    showWinText: function showWinText(type) {
        var title = "";
        switch (type) {
            case 9:
                title = "皇家同花顺赢";
                break;
            case 8:
                title = "同花顺赢";
                break;
            case 7:
                title = "金刚赢";
                break;
            case 6:
                title = "葫芦赢";
                break;
            case 5:
                title = "同花赢";
                break;
            case 4:
                title = "顺子赢";
                break;
            case 3:
                title = "三条赢";
                break;
            case 2:
                title = "双对赢";
                break;
            case 1:
                title = "一对赢";
                break;
            case 0:
                title = "高牌赢";
                break;
        }
        if (title == "") {
            this.node.getChildByName("cover").active = true;
            this._lblName.node.active = true;
        } else {
            if (this._pai1.active) {
                this._lblName.node.active = false;
            } else {
                this._lblName.node.active = true;
            }
        }
        this._pai1.getChildByName("text").getComponent(cc.Label).string = title;
        this.node.getChildByName("xiazhu").active = false;
    },
    showBeiPai: function showBeiPai(flag) {
        if (!this._paimian) return;
        this._paimian.active = flag;
    },
    setMoney: function setMoney(data) {
        //设置该玩家所拥有的的钱
        this._lblScore.string = data;
        this._score = data;
    },
    setTime: function setTime(o) {
        if (o) {
            this._time = o;
        } else {
            this._time = 30;
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
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    }
});

cc._RFpop();