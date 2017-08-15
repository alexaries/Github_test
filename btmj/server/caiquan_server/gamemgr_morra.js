var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var db = require("../utils/db");
var ALLMORRACOUNT = 3;
var gameSeatsOfUsers = {};
var games = {};
var winCount = {};
exports.setReady = function(userId, callback) {
        console.log('setReady--准备完毕');
        var roomId = roomMgr.getUserRoom(userId);
        if (roomId == null) {
            return;
        }
        var roomInfo = roomMgr.getRoom(roomId);
        if (roomInfo == null) {
            return;
        }
        roomMgr.setReady(userId, true);
        if (roomInfo.seats.length == 2) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                console.log('------roomInfo------->>', s);
                if (s.ready == false || userMgr.isOnline(s.userId) == false) {
                    console.log('还不开始？？');
                    return;
                }
            }
            //2个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    }
    //开始新的一局
exports.begin = function(roomId) {
    console.log('开始新的一局');
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    var game = {
        // 房间配置信息
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,
        gameSeats: new Array(2),
        morras: new Array(ALLMORRACOUNT),
        currentIndex: 0,
    };
    roomInfo.numOfGames++;
    for (var i = 0; i < 2; ++i) {
        var data = game.gameSeats[i] = {};
        data.game = game;
        data.seatIndex = i;
        data.userId = seats[i].userId;
        //结果
        data.wined = -1; //0:赢 1：平 2：输
        data.numOfGames = roomInfo.numOfGames;
        data.conf = roomInfo.conf;
        //统计信息
        data.chuQuan = -1; //-1没出拳 0 剪子 1 石头 2布
        gameSeatsOfUsers[data.userId] = data;
        if (winCount[data.userId] == null) {
            winCount[data.userId] = 0;
        }
    }
    games[roomId] = game;
    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知游戏开始
        userMgr.sendMsg(s.userId, 'cq_begin_push');
    }
    // 游戏开始
    console.log('---猜拳人到齐了--------->', game);
    lastTime(seats[0].userId, true);
}

function lastTime(userId, flag) {
    var time = 30; //倒计时30秒自动出拳
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var tm = function() {
        if (time >= 0) {
            var ret = {
                errcode: 0,
                errmsg: "ok",
                data: time
            };
            userMgr.broacastInRoom("cq_game_time_push", ret, userId, true);
            time--;
            roomInfo.timeout = setTimeout(tm, 1000);
            return;
        }
    }
    if (flag) {
        tm();
    } else {
        clearTimeout(roomInfo.timeout);
    }
}
exports.chuQuan = function(userId, quan, socket) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    seatData.chuQuan = quan;
    userMgr.broacastInRoom("cq_chuquan_notify_push", userId, userId, true); //通知前端对方已出拳
    for (var i = 0; i < 2; i++) {
        var data = gameSeatsOfUsers[seats[i].userId];
        console.log("-----------gameSeatsOfUsers[i]------->>>", data);
        if (!data) {
            lastTime(userId, false);
            return;
        }
        if (data.chuQuan == -1) {
            return;
        }
    }
    // 结算
    lastTime(userId, false);
    gameEnd(userId, seats, socket);
}

function wined(q1, q2) {
    if (q1 == -1 || q2 == -1) {
        console.log("errow: not find q1 or q2", q1, q2);
        return -1;
    }
    // 0 剪子 1 石头 2布
    if (q1 == q2) {
        return 1;
    }
    var value = -1;
    if (q1 == 0) {
        value = q2 == 1 ? 2 : 0;
    } else if (q1 == 1) {
        value = q2 == 0 ? 0 : 2;
    } else if (q1 == 2) {
        value = q2 == 0 ? 2 : 0;
    } else {
        value = -1;
    }
    return value;
}

function gameEnd(userId, seats, socket) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var userId1 = seats[0].userId;
    var userId2 = seats[1].userId;
    var d1 = gameSeatsOfUsers[userId1];
    var d2 = gameSeatsOfUsers[userId2];
    var w = wined(d1.chuQuan, d2.chuQuan);
    if (w == 0) {
        d1.wined = 0;
        d2.wined = 2;
        winCount[userId1]++;
        roomInfo.seats[0].score = winCount[userId1];
    } else if (w == 1) {
        d1.wined = 1;
        d2.wined = 1;
    } else if (w == 2) {
        d1.wined = 2;
        d2.wined = 0;
        winCount[userId2]++;
    }
    var data = new Array();
    var user1 = {
        seatIndex: 0,
        userId: userId1,
        wined: d1.wined,
        numOfGames: d1.numOfGames,
        conf: d1.conf,
        chuQuan: d1.chuQuan,
        winCount: winCount[userId1]
    };
    var user2 = {
        seatIndex: 1,
        userId: userId2,
        wined: d2.wined,
        numOfGames: d2.numOfGames,
        conf: d2.conf,
        chuQuan: d2.chuQuan,
        winCount: winCount[userId2]
    };
    data.push(user1);
    data.push(user2);
    var ret = {
        errcode: 0,
        errmsg: "ok",
        data: data
    };
    userMgr.broacastInRoom("cq_game_over_push", ret, userId, true);
    if (w == 0) { //挑战者输了
        // 如果挑战者输了的话，扣取1%的手续费，返给擂主
        var baseScore = d1.conf.baseScore * 0.01;
        db.fail_gonglei(userId1, userId2, baseScore, d1.conf.consu, function(data) {
            userMgr.broacastInRoom('cq_loser_notify_push', userId2, userId2, true);
            winCount[userId2] = null;
            roomMgr.exitRoom(userId2);
            exports.clearInfo(userId2);
            userMgr.kickConnect(userId2);
            use_money_logs(userId1, (-1) * baseScore, d1.conf.consu, 'morra');
            use_money_logs(userId2, baseScore, d1.conf.consu, 'morra');
        });
    }
    if (winCount[userId2] == 5) { //挑战者赢了
        var baseScore = d1.conf.baseScore;
        db.success_gonglei(userId1, userId2, baseScore, d1.conf.consu, function(data) {
            winCount[userId2] = null;
            userMgr.broacastInRoom('cq_winner_notify_push', userId2, userId2, true);
            userMgr.kickAllInRoom(roomId);
            roomMgr.destroy(roomId);
            use_money_logs(userId1, baseScore, d1.conf.consu, 'morra');
            use_money_logs(userId2, (-1) * baseScore, d1.conf.consu, 'morra');
        });
    }
}
exports.clearInfo = function(userId, roomId) {
    delete gameSeatsOfUsers[userId];
    if (userId == null) {
        return;
    }
    if (winCount[userId] == null) {
        return;
    }
    winCount[userId] = null;
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    lastTime(seats[0].userId, false);
}
exports.setGameOver = function(roomId, userId, callback) {
    var roomInfo = roomMgr.getRoom(roomId);
    var conf = roomInfo.conf;
    var userId1 = roomInfo.seats[0].userId;
    var userId2 = roomInfo.seats[1].userId;
    if (userId1 && userId2) {
        db.success_gonglei(userId1, userId2, conf.baseScore, conf.consu, function(r) {
            callback();
            if (r) {
                use_money_logs(userId1, conf.baseScore, conf.consu, 'morra');
                use_money_logs(userId2, (-1) * conf.baseScore, conf.consu, 'morra');
            }
        });
    } else {
        callback();
    }
};
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}