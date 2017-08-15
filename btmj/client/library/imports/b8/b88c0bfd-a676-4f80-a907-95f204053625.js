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
            cc.director.loadScene("dngame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            // self.seats = null;
            if (data) {
                //特殊情况下（锦标赛等）可以设置这里的data，在退出的时候进行操作
                self.actionData = data;
            }
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
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
        cc.vv.net.addHandler("not_exit_push", function (data) {
            self.dispatchEvent("not_exit", data);
        });
        cc.vv.net.addHandler("count_down_push", function (data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("match_exit_error", function (data) {
            self.dispatchEvent('match_exit_error');
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
            self.room_type = -1;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function (data) {
            var actionData = self.actionData;
            self.dispatchEvent("exit_room");
            if (self.roomId == null) {
                if (actionData) {
                    if (actionData.msg) {
                        cc.vv.alert.show("提示", actionData.msg);
                    }
                    setTimeout(function () {
                        self.actionData = null;
                        cc.director.loadScene("newhall");
                    }, actionData.delay * 1000);
                } else {
                    cc.director.loadScene("newhall");
                }
                self.room_type = -1;
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
        // 新人加入房间
        cc.vv.net.addHandler("new_user_comes_push", function (data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
        //游戏初始化 
        cc.vv.net.addHandler("game_initInfo_push", function (data) {
            var gameInfo = data.gameInfo;
            self.dispatchEvent('game_init', gameInfo);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            var data = data;
            self.dispatchEvent('game_begin', data);
        });
        cc.vv.net.addHandler("game_b_OneQzEnd", function (data) {
            var data = data;
            self.dispatchEvent('show_qiang', data);
        });
        cc.vv.net.addHandler("game_zhuangSelected_push", function (data) {
            var data = data;
            self.dispatchEvent('game_zhuangSelected', data);
        });
        cc.vv.net.addHandler("game_myXzBegin_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myXzBegin', data);
        });
        cc.vv.net.addHandler("game_myHoldsUpdate_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myHoldsUpdate', data);
        });
        cc.vv.net.addHandler("game_myXzEnd_push", function (data) {
            var data = data;
            self.dispatchEvent('game_myXzEnd', data);
        });
        cc.vv.net.addHandler("game_b_OneXzEnd", function (data) {
            var data = data;
            self.dispatchEvent('show_beiShuText', data);
        });
        cc.vv.net.addHandler("game_b_OneSnEnd", function (data) {
            var data = data;
            self.dispatchEvent('game_b_OneSnEnd', data);
        });
        cc.vv.net.addHandler("game_showAllUser_push", function (data) {
            var data = data;
            self.dispatchEvent('game_showAllUser', data);
        });
    }
});