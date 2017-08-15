"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.net.addHandler("login_result", function (data) {
            console.log(data);
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
            } else if (data.errcode === 4) {
                //重新login
                var data = data.data;
                cc.vv.net.send('login', data);
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function (data) {
            cc.director.loadScene("zjhgame");
        });
        cc.vv.net.addHandler("exit_result", function (data) {
            self.roomId = null;
            self.turn = -1;
            self.seats = null;
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
        cc.vv.net.addHandler("count_down_push", function (data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("dispress_push", function (data) {
            self.roomId = null;
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
        cc.vv.net.addHandler("chat_push", function (data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function (data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function (data) {
            self.dispatchEvent("emoji_push", data);
        });
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
        cc.vv.net.addHandler("game_checkPai_push", function (data) {
            console.log(data);
            self.dispatchEvent('kanpai', data);
        });
        cc.vv.net.addHandler("game_losed_push", function (data) {
            self.dispatchEvent('qipai', data);
        });
        cc.vv.net.addHandler("game_wannaToCompare_push", function (data) {
            self.dispatchEvent('game_wannaToCompare_push', data);
        });
        //弃牌通知 game_userInlosed_push
        cc.vv.net.addHandler("game_userInlosed_push", function (data) {
            self.dispatchEvent('qiPai_notify', data);
        });
        cc.vv.net.addHandler("game_myTurn_push", function (data) {
            self.dispatchEvent('game_myTurn_push', data);
        });
        cc.vv.net.addHandler("game_turnChanged_push", function (data) {
            self.dispatchEvent('game_turnChanged_push', data);
        });
        cc.vv.net.addHandler("game_timerInitCounter_push", function (data) {
            self.dispatchEvent('game_timerInitCounter_push', data);
        });
        cc.vv.net.addHandler("guo_notify_push", function (data) {
            self.dispatchEvent('guo_notify_push', data);
        });
        cc.vv.net.addHandler("game_myWin_push", function (data) {
            //我赢了
            // self.dispatchEvent('win', data);
        });
        cc.vv.net.addHandler("gameOver_notify_push", function (data) {
            //游戏结束清除定时器
            self.dispatchEvent('gameOver_notify_push', data);
        });
        cc.vv.net.addHandler("game_oneInWin_push", function (data) {
            //赢了
            self.dispatchEvent('win', data);
        });
        cc.vv.net.addHandler("game_begin_push", function (data) {
            self.button = data;
            self.turn = self.button;
            self.gamestate = "begin";
            self.dispatchEvent('game_begin', {
                currentZhu: data.currentZhu,
                turn: data.turn
            });
        });
        cc.vv.net.addHandler("game_myMoney_push", function (data) {
            console.log('game_myMoney_push');
            console.log(data);
            self.dispatchEvent('game_myMoney', data);
        });
        //没钱了通知前端，让其退出
        cc.vv.net.addHandler("game_noMoney_exit", function (data) {
            self.dispatchEvent('noMoney_exit', data);
        });
        //总注通知
        cc.vv.net.addHandler("game_moneyPool_push", function (data) {
            console.log('game_moneyPool_push');
            console.log(data);
            self.dispatchEvent('game_moneyPool', data);
        });
        //跟注通知
        cc.vv.net.addHandler("genZhu_notify_push", function (data) {
            console.log('genZhu_notify_push');
            console.log(data);
            self.dispatchEvent('genZhu_notify', data);
        });
        //看牌通知 game_oneInCheckPai_push
        cc.vv.net.addHandler("game_oneInCheckPai_push", function (data) {
            console.log('game_oneInCheckPai_push');
            console.log(data);
            self.dispatchEvent('kanPai_notify', data);
        });
        //加注通知 jiaZhu_notify_push
        cc.vv.net.addHandler("jiaZhu_notify_push", function (data) {
            console.log('jiaZhu_notify_push');
            console.log(data);
            self.dispatchEvent('jiaZhu_notify', data);
        });
        //提示消息通知
        cc.vv.net.addHandler("message_notify_push", function (data) {
            console.log('message_notify_push');
            console.log(data);
            self.dispatchEvent('message_notify', data);
        });
        //轮数通知
        cc.vv.net.addHandler("game_circleCount_push", function (data) {
            console.log('game_circleCount_push');
            console.log(data);
            self.dispatchEvent('game_circleCount', data);
        });
        //比牌结果通知 game_userInBipai_result_push
        cc.vv.net.addHandler("game_userInBipai_result_push", function (data) {
            console.log('game_userInBipai_result_push');
            console.log(data);
            self.dispatchEvent('game_userInBipai_result', data);
        });
        cc.vv.net.addHandler("game_actionChanged_push", function (data) {
            self.dispatchEvent('game_actionChanged_push', data);
        });
        cc.vv.net.addHandler("game_AntiResults_push", function (data) {
            self.dispatchEvent('game_AntiResults', data);
        });
        cc.vv.net.addHandler("game_userInfoById_push", function (data) {
            if (data) {
                self.dispatchEvent('game_userInfoById', data);
            }
        });
        cc.vv.net.addHandler("match_exit_error", function (data) {
            self.dispatchEvent('match_exit_error');
        });
        cc.vv.net.addHandler("game_gameInfoById_push", function (data) {
            if (data) {
                self.dispatchEvent('game_gameInfoById', data);
            }
        });
        cc.vv.net.addHandler("game_sbInAllIn_push", function (data) {
            if (data) {
                self.dispatchEvent('game_sbInAllIn', data);
            }
        });
    }
});