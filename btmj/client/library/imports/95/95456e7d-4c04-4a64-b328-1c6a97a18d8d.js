"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        dataEventHandler: null,
        cqEventHandler: null,
        roomId: null,
        maxNumOfGames: 0,
        numOfGames: 0,
        numOfMJ: 0,
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chupai: -1,
        gamestate: "",
        isOver: false,
        dissoveData: null,
        room_type: -1,
        cq_data: null
    },
    reset: function reset() {
        this.turn = -1;
        this.chupai = -1;
        this.button = -1;
        this.gamestate = "";
        this.curaction = null;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].holds = [];
            this.seats[i].folds = [];
            this.seats[i].pengs = [];
            this.seats[i].caiShen = [];
            this.seats[i].chis = [];
            this.seats[i].angangs = [];
            this.seats[i].diangangs = [];
            this.seats[i].wangangs = [];
            this.seats[i].ready = false;
            this.seats[i].hued = false;
            this.seats[i].tinged = false;
        }
    },
    clear: function clear() {
        this.dataEventHandler = null;
        this.cqEventHandler = null;
        if (this.isOver == null) {
            this.seats = null;
            this.roomId = null;
            this.room_type = -1;
            this.maxNumOfGames = 0;
            this.numOfGames = 0;
        }
    },
    dispatchEvent: function dispatchEvent(event, data) {
        if (event == 'test') console.log(this.dataEventHandler);
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },
    cqDispatchEvent: function cqDispatchEvent(event, data) {
        if (this.cqEventHandler) {
            // console.log('cqDispatchEvent',data);
            this.cqEventHandler.emit(event, data);
        }
    },

    getSeatIndexByID: function getSeatIndexByID(userId) {
        if (this.seats) {
            for (var i = 0; i < this.seats.length; ++i) {
                var s = this.seats[i];
                if (s.userid == userId) {
                    return i;
                }
            }
        }

        return -1;
    },
    isOwner: function isOwner() {
        return this.seatIndex == 0;
    },
    getSeatByID: function getSeatByID(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },
    getSelfData: function getSelfData() {
        return this.seats[this.seatIndex];
    },
    getLocalIndex: function getLocalIndex(index) {
        var ret = (index - this.seatIndex + 4) % 4;
        return ret;
    },
    getLocalIndexZJH: function getLocalIndexZJH(index) {
        var ret = (index - this.seatIndex + 5) % 5;
        return ret;
    },
    getLocalIndexByUserIdZJH: function getLocalIndexByUserIdZJH(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var ret = this.getLocalIndexZJH(seatIndex);
        return ret;
    },
    prepareReplay: function prepareReplay(roomInfo, detailOfGame) {
        this.roomId = roomInfo.id;
        this.seats = roomInfo.seats;
        this.turn = detailOfGame.base_info.button;
        this.room_type = 0;
        var baseInfo = detailOfGame.base_info;
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            s.seatindex = i;
            s.score = null;
            s.holds = baseInfo.game_seats[i];
            s.pengs = [];
            s.caiShen = [];
            s.chis = [];
            s.extraPais = [];
            s.angangs = [];
            s.diangangs = [];
            s.wangangs = [];
            s.folds = [];
            console.log(s);
            if (cc.vv.userMgr.userId == s.userid) {
                this.seatIndex = i;
            }
        }
        this.conf = {
            type: baseInfo.type
        };
        if (this.conf.type == null) {
            this.conf.type == "ykx";
        }
    },
    getWanfa: function getWanfa() {
        var conf = this.conf;
        if (conf) {
            var strArr = [];
            if (conf.maxGames) {
                strArr.push(conf.maxGames + "局");
            }
            if (conf.baseScore) {
                strArr.push(" 底分:" + conf.baseScore);
            }
            if (conf.yipaoduoxiang == true) {
                strArr.push(" 一炮多响");
            }
            return strArr.join(" ");
        }
        return "";
    },
    requireByGame: function requireByGame() {
        // var gameHandler = require('');
        // gameHandler.initEvents();
    },
    initHandlers: function initHandlers(type) {
        cc.vv.net.handlers = {};
        var self = this;
        var t;
        if (type == 2) {
            t = require('ZjhNetMgr');
        } else if (type == 1) {
            t = require('CqNetMgr');
        } else if (type == 0) {
            t = require('MjNetMgr');
        } else if (type == 3) {
            t = require('DnNetMgr');
        } else if (type == 4) {
            t = require('DzpkNetMgr');
        } else if (type == 100) {
            t = require('JbsNetMgr');
        }
        cc.vv.NetMgr = new t();
        cc.vv.NetMgr.initHandlers(self);
    },
    doGuo: function doGuo(seatIndex, pai) {
        var seatData = this.seats[seatIndex];
        var folds = seatData.folds;
        if (folds) {
            folds.push(pai);
        }
        this.dispatchEvent('guo_notify', seatData);
    },
    doMopai: function doMopai(seatIndex, pai) {
        var seatData = this.seats[seatIndex];
        if (seatData.holds) {
            seatData.holds.push(pai);
            this.dispatchEvent('game_mopai', {
                seatIndex: seatIndex,
                pai: pai
            });
        }
    },
    doChupai: function doChupai(seatIndex, pai) {
        this.chupai = pai;
        var seatData = this.seats[seatIndex];
        if (seatData.holds) {
            var idx = seatData.holds.indexOf(pai);
            seatData.holds.splice(idx, 1);
        }
        this.dispatchEvent('game_chupai_notify', {
            seatData: seatData,
            pai: pai
        });
    },
    doPeng: function doPeng(seatIndex, pai, extraPengPai) {
        console.log("doPeng", extraPengPai);
        var seatData = this.seats[seatIndex];
        //移除手牌
        if (seatData.holds) {
            for (var i = 0; i < 2; ++i) {
                var idx = seatData.holds.indexOf(pai);
                seatData.holds.splice(idx, 1);
            }
        }
        //更新碰牌数据
        var pengs = seatData.pengs;
        pengs.push(pai);
        if (extraPengPai != null && extraPengPai.length > 0) {
            seatData.extraPais = extraPengPai;
        }
        // console.log('------------------------------------');
        // console.log("玩家的手中多余的牌是", seatData.extraPais);
        // console.log('------------------------------------');
        this.dispatchEvent('peng_notify', seatData);
    },
    doChi: function doChi(seatIndex, pai, chiArray, extraPai) {
        var seatData = this.seats[seatIndex];
        //移除手牌
        // console.log("吃牌回掉函数");
        if (seatData.holds) {
            for (var i = 0; i < 2; ++i) {
                var idx = seatData.holds.indexOf(chiArray[i]);
                if (idx != -1) {
                    seatData.holds.splice(idx, 1);
                }
            }
            var chis = seatData.chis;
            chiArray.push(pai);
            chiArray.sort(function (a, b) {
                return a - b;
            });
            chis.push(chiArray);
        }
        if (extraPai != null && extraPai.length > 0) {
            seatData.extraPais = extraPai;
        }
        this.dispatchEvent('chi_notify', seatData);
    },
    getGangType: function getGangType(seatData, pai) {
        if (seatData.pengs.indexOf(pai) != -1) {
            return "wangang";
        } else {
            var cnt = 0;
            for (var i = 0; i < seatData.holds.length; ++i) {
                if (seatData.holds[i] == pai) {
                    cnt++;
                }
            }
            if (cnt == 3) {
                return "diangang";
            } else {
                return "angang";
            }
        }
    },
    doGang: function doGang(seatIndex, pai, gangtype) {
        var seatData = this.seats[seatIndex];
        if (!gangtype) {
            gangtype = this.getGangType(seatData, pai);
        }
        if (gangtype == "wangang") {
            if (seatData.pengs.indexOf(pai) != -1) {
                var idx = seatData.pengs.indexOf(pai);
                if (idx != -1) {
                    seatData.pengs.splice(idx, 1);
                }
            }
            seatData.wangangs.push(pai);
        }
        if (seatData.holds) {
            for (var i = 0; i <= 4; ++i) {
                var idx = seatData.holds.indexOf(pai);
                if (idx == -1) {
                    //如果没有找到，表示移完了，直接跳出循环
                    break;
                }
                seatData.holds.splice(idx, 1);
            }
        }
        if (gangtype == "angang") {
            if (!seatData.angangs) {
                seatData.angangs = [];
            }
            seatData.angangs.push(pai);
        } else if (gangtype == "diangang") {
            if (!seatData.diangangs) {
                seatData.diangangs = [];
            }
            seatData.diangangs.push(pai);
        }
        this.dispatchEvent('gang_notify', {
            seatData: seatData,
            gangtype: gangtype
        });
    },
    // 财神
    doCaiShen: function doCaiShen(seatIndex, pai) {
        console.log("财神!docaishen", seatIndex, pai);
        var seatData = this.seats[seatIndex];
        // 移除手牌
        if (seatData.holds) {
            var idx = seatData.holds.indexOf(pai);
            seatData.holds.splice(idx, 1);
        }
        var caiShen = seatData.caiShen;
        caiShen.push(pai);
        this.dispatchEvent('game_caishen_notify', seatData);
    },
    doHu: function doHu(data) {
        this.dispatchEvent('hupai', data);
    },
    doTurnChange: function doTurnChange(si) {
        var data = {
            last: this.turn,
            turn: si
        };
        this.turn = si;
        this.dispatchEvent('game_chupai', data);
    },
    connectGameServer: function connectGameServer(data) {
        this.initHandlers(cc.vv.userMgr.room_type);
        this.dissoveData = null;
        cc.vv.net.ip = data.ip + ":" + data.port;
        console.log(cc.vv.net.ip);
        var self = this;
        var onConnectOK = function onConnectOK() {
            console.log("onConnectOK");
            var sd = {
                token: data.token,
                roomid: data.roomid,
                time: data.time,
                sign: data.sign
            };
            console.log("login============");
            cc.vv.net.send("login", sd);
        };
        var onConnectFailed = function onConnectFailed() {
            console.log("failed.");
            cc.vv.wc.hide();
        };
        cc.vv.wc.show("正在进入房间");
        cc.vv.net.connect(onConnectOK, onConnectFailed);
    },
    connectMatchServer: function connectMatchServer(connect_data, match_data) {
        this.initHandlers(100); //锦标赛的type设为100
        cc.vv.match_net.ip = connect_data.ip + ":" + connect_data.port;
        var self = this;
        var onConnectOK = function onConnectOK() {
            if (match_data) {
                match_data.userid = cc.vv.userMgr.userId;
            }
            cc.vv.match_net.send("login", match_data);
            cc.vv.wc.hide();
        };
        var onConnectFailed = function onConnectFailed() {
            cc.vv.wc.hide();
            cc.vv.alert.show("注意", "进入比赛队列失败！");
        };

        cc.vv.wc.show("正在进入比赛队列");
        cc.vv.match_net.connect(onConnectOK, onConnectFailed);
    }
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});