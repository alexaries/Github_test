"use strict";
cc._RFpush(module, '74d78JBqHdDKY6hckY2YuL+', 'UserMgr');
// scripts/UserMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        account: null,
        userId: null,
        userName: null,
        lv: 0,
        exp: 0,
        coins: 0,
        gems: 0,
        sign: 0,
        ip: "",
        sex: 0,
        roomData: null,
        oldRoomId: null,
        yaoqingUrl: null,
        headimg: null,
        shareRoomId: null,
        yaoqing_key: null,
        chargerate: null,
        is_sign: 0,
        sign_days: 0,
        room_type: -1,
        collapse_prise: 0,
        is_first_charge: 0,
        scene: -1,
        e_roomid: 0,
        exchange: 0,
        reconnection: 0,
        refreshTime: 30000
    },
    guestAuth: function guestAuth(param) {
        this.loadSceneName = param;
        var account = cc.args["account"];
        if (account == null) {
            account = cc.sys.localStorage.getItem("account");
        }
        if (account == null) {
            account = Date.now();
            cc.sys.localStorage.setItem("account", account);
        }
        cc.vv.http.sendRequest("/guest", {
            account: account
        }, this.onAuth);
    },
    onAuth: function onAuth(ret) {
        var self = cc.vv.userMgr;
        if (ret.errcode !== 0) {
            console.log(ret.errmsg);
        } else {
            self.account = ret.account;
            self.sign = ret.sign;
            self.shareRoomId = ret.shareRoomId;
            cc.vv.http.url = "http://" + cc.vv.SI.hall;
            self.login();
        }
    },
    // 登录
    login: function login() {
        var self = this;
        var onLogin = function onLogin(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                self.account = ret.account;
                self.userId = ret.userid;
                self.userName = ret.name;
                self.lv = ret.lv;
                self.exp = ret.exp;
                self.coins = ret.coins;
                self.gems = ret.gems;
                self.roomData = ret.roomid;
                self.room_type = ret.room_type;
                self.sex = ret.sex;
                self.ip = ret.ip;
                self.headimg = ret.headimg;
                self.yaoqingUrl = ret.yaoqingUrl;
                self.yaoqing_key = ret.yaoqing_key;
                self.is_sign = ret.is_sign;
                self.sign_days = ret.sign_days;
                self.collapse_prise = ret.collapse_prise;
                self.is_first_charge = ret.is_first_charge;
                self.modules = ret.modules; //显示模块
                self.is_open_jbs = ret.is_open_jbs; //是否开放锦标赛
                // TODO  充值兑换率
                // self.chargerate = ret.chargerate;
                var shareUrl = self.yaoqingUrl;
                if (!cc.sys.isNative) {
                    var roomvalid = self.shareRoomId || cc.vv.gameNetMgr.roomId || self.roomData;
                    if (roomvalid) {
                        shareUrl = shareUrl + roomvalid;
                    } else {
                        shareUrl = shareUrl + "000000";
                    }
                    if (window.wxFriend) {
                        window.wxFriend.link = shareUrl;
                        window.wxFriend.desc = self.userName + window.wxFriend.desc;
                        window.shareMessage();
                    }
                }
                if (self.loadSceneName) {
                    cc.director.loadScene(self.loadSceneName);
                } else {
                    cc.director.loadScene("newhall");
                    cc.vv.http.sendRequest("/injinbiao", {
                        userId: self.userId
                    }, function (data) {
                        if (data.ip) {
                            cc.vv.match_net.ip = data.ip + ":" + data.port;
                            console.log("?????", cc.vv.match_net.ip);
                            cc.vv.match_net.connect(function () {
                                cc.vv.gameNetMgr.initHandlers(100);
                                cc.vv.match_net.send("login", { userid: self.userId });
                            }, function () {});
                        };
                    });
                }
            }
        };
        // cc.vv.wc.show("正在登录游戏");
        cc.vv.http.sendRequest("/login", {
            account: this.account,
            sign: this.sign
        }, onLogin);
    },
    // 进入房间
    enterRoom: function enterRoom(roomId, callback) {
        var self = this;
        var onEnter = function onEnter(ret) {
            console.log('进入房间onEnter====>', ret);
            if (ret.errcode !== 0) {
                if (ret.errcode == -1) {
                    setTimeout(function () {
                        self.enterRoom(roomId, callback);
                    }, 5000);
                } else {
                    cc.vv.wc.hide();
                    if (callback != null) {
                        callback(ret);
                    }
                }
            } else {
                if (callback != null) {
                    callback(ret);
                }
                self.room_type = ret.room_type;
                self.scene = ret.scene;
                self.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            roomid: roomId
        };
        cc.vv.wc.show("正在进入房间 " + roomId);
        cc.vv.http.sendRequest("/enter_private_room", data, onEnter);
    },
    // 获取历史战斗记录
    getHistoryList: function getHistoryList(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.history);
                if (callback != null) {
                    callback(ret.history);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_history_list", data, onGet);
    },
    // 获取金币和钻石数量
    getGemsAndCoins: function getGemsAndCoins(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret);
                if (callback != null) {
                    callback(ret);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_gems_and_coins", data, onGet);
    },
    // 用户签到
    setUserSign: function setUserSign(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (callback != null) {
                    callback(ret.data);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/set_user_sign", data, onGet);
    },
    // 获取签到礼物列表
    getSignList: function getSignList(callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (callback != null) {
                    callback(ret.data);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_sign_list", data, onGet);
    },
    getGamesOfRoom: function getGamesOfRoom(uuid, callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid
        };
        cc.vv.http.sendRequest("/get_games_of_room", data, onGet);
    },
    getDetailOfGame: function getDetailOfGame(uuid, index, callback) {
        var self = this;
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                console.log(ret.data);
                callback(ret.data);
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            uuid: uuid,
            index: index
        };
        cc.vv.http.sendRequest("/get_detail_of_game", data, onGet);
    }
});

cc._RFpop();