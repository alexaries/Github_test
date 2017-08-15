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
                self.cq_data = data.data;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            console.log("login_finished");
            cc.director.loadScene("caiquan");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.cqDispatchEvent("disconnect");
        });
        cc.vv.net.addHandler("cq_begin_push", function (data) {
            console.log("cq_begin_push");
            self.cqDispatchEvent("cq_begin", data);
        });
        cc.vv.net.addHandler("cq_new_user_comes_push", function (data) {
            console.log("cq_new_user_comes_push", data);
            self.cq_data = data.data;
            self.cqDispatchEvent("cq_new_user", data);
        });
        cc.vv.net.addHandler("cq_game_over_push", function (data) {
            console.log("cq_game_over_push", data);
            self.cqDispatchEvent("cq_game_over", data);
        });
        cc.vv.net.addHandler("cq_game_time_push", function (data) {
            // console.log("cq_game_time_push", data);
            self.cqDispatchEvent("cq_game_time", data);
        });
        cc.vv.net.addHandler("cq_exit_notify_push", function (data) {
            var userId = data;
            self.cqDispatchEvent("cq_exit_notify", userId);
        });
        cc.vv.net.addHandler("cq_dispress_push", function (data) {
            var userId = data;
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
            self.cq_data = null;
            self.cqDispatchEvent("cq_dispress", userId);
        });
        cc.vv.net.addHandler("cq_loser_notify_push", function (data) {
            var userId = data;
            if (cc.vv.userMgr.userId == userId) {
                self.roomId = null;
                self.room_type = -1;
                self.turn = -1;
                self.seats = null;
                self.cq_data = null;
            }
            self.cqDispatchEvent("cq_loser_notify", userId);
        });
        cc.vv.net.addHandler("cq_winner_notify_push", function (data) {
            var userId = data;
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
            self.cq_data = null;
            self.cqDispatchEvent("cq_winner_notify", userId);
        });
        cc.vv.net.addHandler("cq_chuquan_notify_push", function (data) {
            self.cqDispatchEvent("cq_chuquan_notify", data);
        });
    }
});