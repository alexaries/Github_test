"use strict";
cc._RFpush(module, 'f084a+6r9pFkpyzRb+cYNPH', 'MjNetMgr');
// scripts/MjNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log("login_result===>", data);
            if (data.errcode === 0) {
                var data = data.data;
                self.roomId = data.roomid;
                self.room_type = data.conf.room_type;
                self.conf = data.conf;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.director.loadScene("mjgame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("exit_notify_push", function (data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            if (self.roomId == null) {
                if (self.room_type == 0) {
                    cc.director.loadScene("newhall");
                    self.room_type = -1;
                } else {
                    cc.director.loadScene("newhall");
                }
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = self.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    self.roomId = null;
                    self.room_type = -1;
                }
            }
        });
        cc.vv.net.addHandler("match_exit_error", function (data) {
            self.dispatchEvent('match_exit_error');
        });
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            //console.log(data);
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
        cc.vv.net.addHandler("user_state_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            if (self.room_type == 0) {
                var seat = self.getSeatByID(userId);
                if (!seat) return;
                seat.online = data.online;
                self.dispatchEvent('user_state_changed', seat);
            }
        });
        cc.vv.net.addHandler("user_ready_push", function (data) {
            //console.log(data);
            var userId = data.userid;
            var seat = self.getSeatByID(userId);
            seat.ready = data.ready;
            self.dispatchEvent('user_state_changed', seat);
        });
        cc.vv.net.addHandler("game_holds_push", function (data) {
            var seat = self.seats[self.seatIndex];
            console.log(data);
            seat.holds = data;
            for (var i = 0; i < self.seats.length; ++i) {
                var s = self.seats[i];
                if (!s.folds) {
                    s.folds = [];
                }
                if (!s.pengs) {
                    s.pengs = [];
                }
                if (!s.extraPais) {
                    s.extraPais = [];
                }
                if (!s.caiShen) {
                    s.caiShen = [];
                }
                if (!s.chis) {
                    s.chis = [];
                }
                if (!s.angangs) {
                    s.angangs = [];
                }
                if (!s.diangangs) {
                    s.diangangs = [];
                }
                if (!s.wangangs) {
                    s.wangangs = [];
                }
                s.ready = false;
            }
            self.dispatchEvent('game_holds');
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            console.log('game_begin_push');
            console.log(data);
            self.button = data;
            self.turn = self.button;
            self.gamestate = "begin";
            self.dispatchEvent('game_begin');
        });
        cc.vv.net.addHandler("game_playing_push", function (data) {
            console.log('game_playing_push');
            self.gamestate = "playing";
            self.dispatchEvent('game_playing');
        });
        cc.vv.net.addHandler("game_sync_push", function (data) {
            console.log("game_sync_push");
            console.log(data);
            self.numOfMJ = data.numofmj;
            self.gamestate = data.state;
            self.turn = data.turn;
            self.button = data.button;
            self.chupai = data.chuPai;
            for (var i = 0; i < 4; ++i) {
                var seat = self.seats[i];
                var sd = data.seats[i];
                seat.holds = sd.holds;
                seat.folds = sd.folds;
                seat.angangs = sd.angangs;
                seat.diangangs = sd.diangangs;
                seat.wangangs = sd.wangangs;
                seat.pengs = sd.pengs;
                seat.extraPais = sd.extraPais;
                seat.caiShen = sd.caiShen;
                seat.chis = sd.chis;
                seat.hued = sd.hued;
                seat.tinged = sd.tinged;
                seat.iszimo = sd.iszimo;
                seat.huinfo = sd.huinfo;
            }
        });
        cc.vv.net.addHandler("game_action_push", function (data) {
            self.curaction = data;
            cc.vv.gameNetMgr.curaction = data;
            console.log("game_action_push---获得所以操作的数据", data);
            self.dispatchEvent('game_action', data);
        });

        cc.vv.net.addHandler("game_timerBegin_push", function (data) {
            self.dispatchEvent('game_timerBegin', data);
        });

        cc.vv.net.addHandler("game_chupai_push", function (data) {
            console.log('game_chupai_push');
            //console.log(data);
            var turnUserID = data;
            var si = self.getSeatIndexByID(turnUserID);
            self.doTurnChange(si);
        });
        cc.vv.net.addHandler("game_num_push", function (data) {
            self.numOfGames = data;
            self.dispatchEvent('game_num', data);
        });
        cc.vv.net.addHandler("game_over_push", function (data) {
            console.log('game_over_push');
            var results = data.results;
            for (var i = 0; i < self.seats.length; ++i) {
                self.seats[i].score = results.length == 0 ? 0 : results[i].totalscore;
            }
            self.dispatchEvent('game_over', results);
            if (data.endinfo) {
                self.isOver = true;
                self.dispatchEvent('game_end', data.endinfo);
            }
            self.reset();
            for (var i = 0; i < self.seats.length; ++i) {
                self.dispatchEvent('user_state_changed', self.seats[i]);
            }
        });
        cc.vv.net.addHandler("mj_count_push", function (data) {
            console.log('mj_count_push');
            self.numOfMJ = data;
            //console.log(data);
            self.dispatchEvent('mj_count', data);
        });
        cc.vv.net.addHandler("hu_push", function (data) {
            console.log('hu_push');
            console.log(data);
            self.doHu(data);
        });
        cc.vv.net.addHandler("hangang_notify_push", function (data) {
            self.dispatchEvent('hangang_notify', data);
        });
        cc.vv.net.addHandler("game_chupai_notify_push", function (data) {
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doChupai(si, pai);
        });
        cc.vv.net.addHandler("game_mopai_push", function (data) {
            console.log('game_mopai_push');
            self.doMopai(self.seatIndex, data);
        });
        cc.vv.net.addHandler("guo_notify_push", function (data) {
            console.log('guo_notify_push');
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doGuo(si, pai);
        });
        cc.vv.net.addHandler("guo_result", function (data) {
            console.log('guo_result');
            self.dispatchEvent('guo_result');
        });
        cc.vv.net.addHandler("guohu_push", function (data) {
            console.log('guohu_push');
            self.dispatchEvent("push_notice", {
                info: "过胡",
                time: 1.5
            });
        });
        cc.vv.net.addHandler("peng_notify_push", function (data) {
            console.log('peng_notify_push-------碰牌操作', data);
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            var extraPengPai = data.extraPengPai;
            self.doPeng(si, data.pai, extraPengPai);
        });
        //  吃牌操作
        cc.vv.net.addHandler("chi_notify_push", function (data) {
            console.log('chi_notify_push', data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            var extraChiPai = data.extraChiPai;
            var chiArray = data.chiArray;
            self.doChi(si, data.pai, chiArray, extraChiPai);
        });
        cc.vv.net.addHandler("gang_notify_push", function (data) {
            console.log('gang_notify_push');
            console.log(data);
            var userId = data.userid;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            self.doGang(si, pai, data.gangtype);
        });
        //  财神弃牌操作
        cc.vv.net.addHandler("game_caishen_notify_push", function (data) {
            console.log("财神弃牌操作");
            var userId = data.userId;
            var pai = data.pai;
            var si = self.getSeatIndexByID(userId);
            console.log('财神弃牌操作!!!!!!!!!!', data);
            self.doCaiShen(si, pai);
        });
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("dissolve_notice_push", function (data) {
            console.log("dissolve_notice_push");
            console.log(data);
            self.dissoveData = data;
            self.dispatchEvent("dissolve_notice", data);
        });
        cc.vv.net.addHandler("dissolve_cancel_push", function (data) {
            self.dissoveData = null;
            self.dispatchEvent("dissolve_cancel", data);
        });
        cc.vv.net.addHandler("voice_msg_push", function (data) {
            console.log("voice_msg_push");
            self.dispatchEvent("voice_msg", data);
        });
    }
});

cc._RFpop();