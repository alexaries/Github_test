cc.Class({
    extends: cc.Component,
    properties: {
        seatIndex: -1,
        seats: null,
        turn: -1,
        button: -1,
        chu: -1,
        maxNumOfGames: 0,
        numOfGames: 0,
        isOver: false,
        consume_num: 0,
    },
    reset: function() {
        this.turn = -1;
        this.chu = -1;
        this.button = -1;
        this.curaction = null;
        for (var i = 0; i < this.seats.length; ++i) {
            this.seats[i].op = null;
            this.seats[i].ready = false;
        }
    },
    clear: function() {},
    getSeatIndexByID: function(userId) {
        for (var i = 0; i < this.seats.length; ++i) {
            var s = this.seats[i];
            if (s.userid == userId) {
                return i;
            }
        }
        return -1;
    },
    isOwner: function() {
        return this.seatIndex == 0;
    },
    getSeatByID: function(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var seat = this.seats[seatIndex];
        return seat;
    },
    getSelfData: function() {
        return this.seats[this.seatIndex];
    },
    getLocalIndex: function(index) {
        var ret = (index - this.seatIndex + 5) % 5;
        return ret;
    },
    getLocalIndexByUserId: function(userId) {
        var seatIndex = this.getSeatIndexByID(userId);
        var ret = this.getLocalIndex(seatIndex);
        return ret;
    },
    dispatchEvent: function(event, data) {
        if (this.dataEventHandler) {
            this.dataEventHandler.emit(event, data);
        }
    },
    initHandlers: function(GameNet) {
        var self = this;
        cc.vv.net.addHandler("login_result", function(data) {
            if (data.errcode === 0) {
                var data = data.data;
                cc.vv.gameNetMgr.roomId = data.roomid;
                cc.vv.gameNetMgr.room_type = data.conf.room_type;
                self.maxNumOfGames = data.conf.maxGames;
                self.numOfGames = data.numofgames;
                self.seats = data.seats;
                self.seatIndex = self.getSeatIndexByID(cc.vv.userMgr.userId);
                self.isOver = false;
                self.consume_num = data.scene.consume_num ? data.scene.consume_num : 50;
            } else {
                console.log(data.errmsg);
            }
        });
        cc.vv.net.addHandler("login_finished", function(data) {
            cc.director.loadScene("dzpkgame");
        });
        cc.vv.net.addHandler("socket_MyHolds", function(data) {
            if (data && data.length > 0) {
                self.dispatchEvent("socket_MyHolds", data);
            }
        });
        cc.vv.net.addHandler("count_down_push", function(data) {
            self.dispatchEvent("count_down", data);
        });
        cc.vv.net.addHandler("game_begin_push", function(data) {
            self.dispatchEvent("game_begin", data);
        });
        cc.vv.net.addHandler("game_diChiUpdate_push", function(data) {
            self.dispatchEvent("game_diChiUpdate", data);
        });
        cc.vv.net.addHandler("game_myInfo_push", function(data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_myInfo", data);
        });
        cc.vv.net.addHandler("game_myTurn_push", function(data) {
            self.dispatchEvent("game_myTurn", data);
        });
        cc.vv.net.addHandler("game_oneClickGuo_push", function(data) {
            self.dispatchEvent("game_oneGuo", data);
        });
        cc.vv.net.addHandler("game_oneGen_push", function(data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_oneGen", data);
        });
        cc.vv.net.addHandler("game_oneAllIn_push", function(data) {
            var seat = self.getSeatByID(data.userid);
            seat.score = data.money;
            self.dispatchEvent("game_oneAllIn", data);
        });
        cc.vv.net.addHandler("game_oneQuit_push", function(data) {
            self.dispatchEvent("game_oneQuit", data);
        });
        cc.vv.net.addHandler("game_playersInNewCircle_push", function(data) {
            self.dispatchEvent("game_playersInNewCircle", data);
        });
        cc.vv.net.addHandler("game_newCircle_push", function(data) {
            self.dispatchEvent("game_newCircle", data);
        });
        cc.vv.net.addHandler("game_turnChanged_push", function(data) {
            if (cc.vv.userMgr.userId != data) {
                self.dispatchEvent("game_turnChanged", data);
            }
        });
        cc.vv.net.addHandler("game_caculateResult_push", function(data) {
            for (var i = 0; i < data.length; i++) {
                if (cc.vv.userMgr.userId == data[i].userid && data[i].isWinner) {
                    self.dispatchEvent("game_winner", data);
                } else if (cc.vv.userMgr.userId == data[i].userid && !data[i].isWinner) {
                    self.dispatchEvent("game_loser", data);
                }
            };
            self.dispatchEvent("game_caculateResult", data);
        });
        cc.vv.net.addHandler("game_myARGStatusChanged_push", function(data) {
            self.dispatchEvent("game_myARGStatusChanged", data);
        });
        cc.vv.net.addHandler("game_over", function(data) {
            self.dispatchEvent("game_over", data);
        });
        cc.vv.net.addHandler("game_gameInfoById_push", function(data) {
            if (data) self.dispatchEvent("game_gameInfoById", data);
        });
        cc.vv.net.addHandler("game_userInfoById_push", function(data) {
            self.dispatchEvent("game_userInfoById", data);
        });
        cc.vv.net.addHandler("game_allGuo_push", function(data) {
            self.dispatchEvent("game_allGuo", data);
        });
        cc.vv.net.addHandler("exit_result", function(data) {
            cc.vv.gameNetMgr.roomId = null;
            self.turn = -1;
            self.seats = null;
            self.dispatchEvent("exit_result", data);
        });
        cc.vv.net.addHandler("exit_notify_push", function(data) {
            var userId = data;
            var s = self.getSeatByID(userId);
            if (s != null) {
                s.userid = 0;
                s.name = "";
                self.dispatchEvent("user_state_changed", s);
            }
        });
        cc.vv.net.addHandler("dispress_push", function(data) {
            cc.vv.gameNetMgr.roomId = null;
            self.turn = -1;
            self.seats = null;
        });
        cc.vv.net.addHandler("disconnect", function(data) {
            self.dispatchEvent("exit_room");
            if (cc.vv.gameNetMgr.roomId == null) {
                cc.director.loadScene("newhall");
                cc.vv.gameNetMgr.room_type = -1;
            } else {
                if (self.isOver == false) {
                    cc.vv.userMgr.oldRoomId = cc.vv.gameNetMgr.roomId;
                    self.dispatchEvent("disconnect");
                } else {
                    cc.vv.gameNetMgr.roomId = null;
                    cc.vv.gameNetMgr.room_type = -1;
                }
            }
        });
        cc.vv.net.addHandler("chat_push", function(data) {
            self.dispatchEvent("chat_push", data);
        });
        cc.vv.net.addHandler("quick_chat_push", function(data) {
            self.dispatchEvent("quick_chat_push", data);
        });
        cc.vv.net.addHandler("emoji_push", function(data) {
            self.dispatchEvent("emoji_push", data);
        });
        // 新人加入房间
        cc.vv.net.addHandler("new_user_comes_push", function(data) {
            var seatIndex = data.seatindex;
            if (self.seats[seatIndex].userid > 0) {
                self.seats[seatIndex].online = true;
                self.seats[seatIndex].ready = data.ready;
                self.seats[seatIndex].score = data.score;
                self.seats[seatIndex].status = data.status;
            } else {
                data.online = true;
                self.seats[seatIndex] = data;
            }
            self.dispatchEvent('new_user', self.seats[seatIndex]);
        });
    }
})