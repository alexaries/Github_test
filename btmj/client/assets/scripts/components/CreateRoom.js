cc.Class({
    extends: cc.Component,
    properties: {
        _difenxuanze: null,
        _zimo: null,
        _wanfaxuanze: null,
        _jushuxuanze: null,
        _dianganghua: null,
    },
    // use this for initialization
    onLoad: function() {
        this._difenxuanze = [];
        var t = this.node.getChildByName("difenxuanze");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._difenxuanze.push(n);
            }
        }
        console.log(this._difenxuanze);
        this._wanfaxuanze = [];
        var t = this.node.getChildByName("wanfaxuanze");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("CheckBox");
            if (n != null) {
                this._wanfaxuanze.push(n);
            }
        }
        console.log(this._wanfaxuanze);
        this._jushuxuanze = [];
        var t = this.node.getChildByName("xuanzejushu");
        for (var i = 0; i < t.childrenCount; ++i) {
            var n = t.children[i].getComponent("RadioButton");
            if (n != null) {
                this._jushuxuanze.push(n);
            }
        }
    },
    onBtnBack: function() {
        this.node.active = false;
    },
    onBtnOK: function() {
        this.node.active = false;
        this.createRoom();
    },
    createRoom: function() {
        var self = this;
        var onCreate = function(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                if (ret.errcode == 2222) {
                    cc.vv.alert.show("提示", "金币不足，创建房间失败!");
                } else {
                    cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
            } else {
                cc.vv.userMgr.room_type = 0;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var difen = 0;
        for (var i = 0; i < self._difenxuanze.length; ++i) {
            if (self._difenxuanze[i].checked) {
                difen = i;
                break;
            }
        }
        var yikouxiang = self._wanfaxuanze[0].checked;
        var yipaoduoxiang = self._wanfaxuanze[1].checked;
        // 类型选择一口香，默认设置不可修改
        var type = "ykx";
        var jushuxuanze = 0;
        for (var i = 0; i < self._jushuxuanze.length; ++i) {
            if (self._jushuxuanze[i].checked) {
                jushuxuanze = i;
                break;
            }
        }
        var conf = {
            room_type: 0, //0代表麻将房间
            type: type,
            difen: difen,
            jushuxuanze: jushuxuanze,
            yipaoduoxiang: yipaoduoxiang
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});