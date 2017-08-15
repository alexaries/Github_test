"use strict";
cc._RFpush(module, '21606/vy7RDk4aiixV6lpY1', 'Morra');
// scripts/components/Morra.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _guessV: null,
        _createboxV: null,
        _create_gemsV: null,
        _create_coinsV: null,
        _create_tagV: null,
        _seekboxV: null,
        _alertV: null,
        _alertContentV: null,
        consu: 0 },
    // use this for initialization
    onLoad: function onLoad() {
        this._guessV = cc.find("Canvas/guess");
        this._createboxV = this._guessV.getChildByName("createbox");
        this._create_gemsV = this._createboxV.getChildByName("create_gems");
        this._create_coinsV = this._createboxV.getChildByName("create_coins");
        this._create_tagV = this._createboxV.getChildByName("create_tag");
        this._seekboxV = this._guessV.getChildByName("seekbox");
        this._alertV = cc.find("Canvas/guessboxAlert");
        this._alertContentV = this._alertV.getChildByName("content").getComponent(cc.Label);
    },
    //显示创建猜拳页面
    onBtnShowMorra: function onBtnShowMorra() {
        this._guessV.active = true;
    },
    //关闭猜拳页面
    onBtnCloseMorra: function onBtnCloseMorra() {
        this._guessV.active = false;
    },
    onBtnSetConsu: function onBtnSetConsu(ev, data) {
        if (data == 1) {
            this.consu = 1;
            this._create_tagV.getChildByName("gems_n").active = false;
            this._create_tagV.getChildByName("coins_n").active = true;
            this._create_gemsV.active = false;
            this._create_coinsV.active = true;
        } else {
            this.consu = 0;
            this._create_tagV.getChildByName("gems_n").active = true;
            this._create_tagV.getChildByName("coins_n").active = false;
            this._create_gemsV.active = true;
            this._create_coinsV.active = false;
        }
    },
    //显示创建房间页面
    onBtnShowCreat: function onBtnShowCreat() {
        this._createboxV.active = true;
        this._create_tagV.getChildByName("gems_n").active = true;
        this._create_tagV.getChildByName("coins_n").active = false;
        this._create_gemsV.active = true;
        this._create_coinsV.active = false;
        this.consu = 0;
    },
    //关闭创建房间页面
    onBtnCloseCreat: function onBtnCloseCreat() {
        this._createboxV.active = false;
        this._create_gemsV.active = false;
        this._create_coinsV.active = false;
        this.consu = 0;
    },
    //显示加入房间页面
    onBtnShowJoin: function onBtnShowJoin() {
        this._seekboxV.active = true;
    },
    //关闭加入房间页面
    onBtnCloseJoin: function onBtnCloseJoin() {
        this._seekboxV.active = false;
    },
    //关闭弹框通知
    onBtnCloseAlert: function onBtnCloseAlert() {
        this._alertV.active = false;
    },
    onBtnSetBonus: function onBtnSetBonus(ev, data) {
        if (this.consu == 0) {
            this._create_gemsV.getChildByName("editbox").getComponent(cc.EditBox).string = data;
        } else {
            this._create_coinsV.getChildByName("editbox").getComponent(cc.EditBox).string = data;
        }
    },
    //创建房间
    creatMorraRoom: function creatMorraRoom() {
        var self = this;
        var difen;
        if (this.consu == 0) {
            difen = self._create_gemsV.getChildByName("editbox").getComponent(cc.EditBox).string;
        } else {
            difen = self._create_coinsV.getChildByName("editbox").getComponent(cc.EditBox).string;
        }
        console.log("--------difen------->>", difen);
        if (!cc.vv.utils.checkRate(difen) || parseInt(difen) <= 0) {
            cc.vv.alert.show("提示", "请设置奖金数量！(只限整数)");
            // self._alertContentV.string = "请设置奖金数量！(只限整数)";
            // self._alertV.active = true;
            return;
        }
        var seiriNum = function seiriNum() {
            if (difen.charAt(0) == '0') {
                difen = difen.substr(1);
                seiriNum();
            }
        };
        seiriNum();
        if (this.consu == 0) {
            difen += "0000";
        }
        var onCreate = function onCreate(ret) {
            if (ret.errcode !== 0) {
                //console.log(ret.errmsg);
                cc.vv.wc.hide();
                var content = "";
                if (ret.errcode == 2222) {
                    content = "金币不足，创建房间失败!";
                    console.log("金币不足，创建房间失败!");
                    // cc.vv.alert.show("提示", "金币不足，创建房间失败!");
                } else {
                    content = "创建房间失败,错误码" + ret.errcode;
                    console.log("创建房间失败,错误码" + ret.errcode);
                    // cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                }
                cc.vv.alert.show("提示", content);
                // self._alertContentV.string = content;
                // self._alertV.active = true;
            } else {
                console.log('创建房间成功！！！！！！');
                //显示猜拳大厅
                // self._morraHallV.active = true;
                self.loadMorraHall();
                cc.vv.userMgr.room_type = 1;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var conf = {
            room_type: 1, //1代表猜拳房间
            difen: difen,
            consu: self.consu };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        console.log(data);
        cc.vv.wc.show("正在创建房间");
        cc.vv.http.sendRequest("/create_private_room", data, onCreate);
    },
    //加入房间
    joinMorraRoom: function joinMorraRoom() {
        var self = this;
        var roomId = self._seekboxV.getChildByName("editbox").getComponent(cc.EditBox).string;
        if (!cc.vv.utils.checkRate(roomId)) {
            // self._alertContentV.string = "请输入正确的房间号";
            // self._alertV.active = true;
            cc.vv.alert.show("提示", "请输入正确的房间号");
            return;
        }
        var content = null;
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            room_type: 1,
            roomId: roomId
        };
        var fn = function fn(ret) {
            if (ret.errcode == 0) {
                self.join(roomId);
            } else if (ret.errcode == 1) {
                content = "猜拳房间[" + roomId + "]不存在，请重新输入!";
            }
            if (content) cc.vv.alert.show("提示", content);
        };
        cc.vv.http.sendRequest("/judge_room", data, fn);
    },
    join: function join(roomId) {
        var self = this;
        console.log("----roomId---->>", roomId);
        cc.vv.wc.show("正在进入房间");
        cc.vv.userMgr.enterRoom(roomId, function (ret) {
            cc.vv.wc.hide();
            console.log("----ret.errcode---->>", ret);
            if (ret.errcode == 0) {
                //显示猜拳大厅
                // self._morraHallV.active = true;
                cc.vv.gameNetMgr.initHandlers(1);
                self.loadMorraHall();
            } else {
                var content = "猜拳房间[" + roomId + "]不存在，请重新输入!";
                if (ret.errcode == 4) {
                    content = "房间[" + roomId + "]已满!";
                } else if (ret.errcode == 5) {
                    content = "钻石或金币不足！";
                }
                // self._alertContentV.string = content;
                // self._alertV.active = true;
                cc.vv.alert.show("提示", content);
            }
        });
    },
    //加载猜拳大厅
    loadMorraHall: function loadMorraHall() {
        cc.director.loadScene("caiquan");
    }
});

cc._RFpop();