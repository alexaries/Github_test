"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _jushuxuanze: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        this._jushuxuanze = [];
        var t = this.node.getChildByName("xuanzejushu");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._jushuxuanze.push(n);
            }
        }
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    onBtnOK: function onBtnOK() {
        this.node.active = false;
        this.createRoom();
    },
    createRoom: function createRoom() {
        var self = this;
        var onCreate = function onCreate(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2222) {
                    cc.vv.alert.show("提示", "金币不足，创建房间失败!");
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = 5;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var difen = 0;
        var jushuxuanze = 0;
        for (var i = 0; i < self._jushuxuanze.length; ++i) {
            if (self._jushuxuanze[i].checked) {
                jushuxuanze = i;
                break;
            }
        }
        var conf = {
            room_type: 5, //0代表麻将房间
            difen: difen,
            type: "wh",
            jushuxuanze: jushuxuanze
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
    }
});