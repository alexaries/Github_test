var crypto = require('../utils/crypto');
var db = require('../utils/db');
var tokenMgr = require('./tokenmgr');
var roomMgr = require('./roommgr');
var userMgr = require('./usermgr');
var io = null;
exports.start = function(config, mgr) {
    io = require('socket.io')(config.CLIENT_PORT);
    io.sockets.on('connection', function(socket) {
        socket.on('login', function(data) {
            if (!socket.loginNum) {
                socket.loginNum = 1; //初始化登录次数
            }
            data = JSON.parse(data);
            if (socket.userId != null) {
                //已经登陆过的就忽略
                return;
            }
            var token = data.token;
            var roomId = data.roomid;
            var time = data.time;
            var sign = data.sign;
            //检查参数合法性
            if (token == null || roomId == null || sign == null || time == null) {
                socket.emit('login_result', {
                    errcode: 1,
                    errmsg: "invalid parameters"
                });
                return;
            }
            //检查参数是否被篡改
            var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
            if (md5 != sign) {
                socket.emit('login_result', {
                    errcode: 2,
                    errmsg: "login failed. invalid sign!"
                });
                return;
            }
            //检查token是否有效
            if (tokenMgr.isTokenValid(token) == false) {
                socket.emit('login_result', {
                    errcode: 3,
                    errmsg: "token out of time."
                });
                return;
            }
            //检查房间合法性
            var userId = tokenMgr.getUserID(token);
            var roomId = roomMgr.getUserRoom(userId);
            if (!roomId) {
                //如果查不到roomId，说明还roommgr没有处理完，需要重新login一次
                if (socket.loginNum && socket.loginNum < 4) {
                    //重新login不得超过3次
                    socket.emit('login_result', {
                        errcode: 4,
                        errmsg: "你需要再调一次login.",
                        data: data
                    });
                    socket.loginNum++;
                }
                return;
            }
            userMgr.bind(userId, socket);
            socket.userId = userId;
            //返回房间信息
            var roomInfo = roomMgr.getRoom(roomId);
            var seatIndex = roomMgr.getUserSeat(userId);
            roomInfo.seats[seatIndex].ip = socket.handshake.address;
            var userData = null;
            var seats = [];
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var rs = roomInfo.seats[i];
                var online = false;
                if (rs.userId > 0) {
                    online = userMgr.isOnline(rs.userId);
                }
                seats.push({
                    userid: rs.userId,
                    ip: rs.ip,
                    score: rs.score,
                    name: rs.name,
                    online: online,
                    ready: rs.ready,
                    seatindex: i,
                });
                if (userId == rs.userId) {
                    userData = seats[i];
                }
            }
            //通知前端
            var ret = {
                errcode: 0,
                errmsg: "ok",
                data: {
                    roomid: roomInfo.id,
                    conf: roomInfo.conf,
                    numofgames: roomInfo.numOfGames,
                    seats: seats,
                    seatindex: seatIndex
                }
            };
            // console.log('login_result');
            // console.log(ret.data.roomid);
            // console.log(ret.data.conf);
            // console.log(ret.data.numofgames);
            // console.log("--------seats------>>>", ret.data.seats);
            socket.emit('login_result', ret);
            socket.gameMgr = roomInfo.gameMgr;
            roomMgr.addOnlineCount(roomId); //在线玩家+1
            //玩家上线，强制设置为TRUE
            socket.emit('login_finished');
            // socket.gameMgr.setReady(userId);
            userMgr.broacastInRoom('new_user_comes_push', userData, userId, true);
            if (roomInfo.dr != null) {
                var dr = roomInfo.dr;
                var ramaingTime = (dr.endTime - Date.now()) / 1000;
                var data = {
                    time: ramaingTime,
                    states: dr.states
                }
                userMgr.sendMsg(userId, 'dissolve_notice_push', data);
            }
        });
        socket.on('kanpai', function() {
            var userId = socket.userId;
            socket.gameMgr.kanpai(userId);
        });
        socket.on('qipai', function() {
            var userId = socket.userId;
            socket.gameMgr.qiPai(userId);
        });
        socket.on('genzhu', function() {
            var userId = socket.userId;
            socket.gameMgr.genzhu(userId);
        });
        socket.on('addzhu', function(data) {
            var userId = socket.userId;
            socket.gameMgr.addzhu(userId, data);
        });
        socket.on('bipai', function(data) {
            data = JSON.parse(data);
            var userId1 = data.userId1;
            var userId2 = data.userId2;
            socket.gameMgr.userVSuser(userId1, userId2);
        });
        socket.on('ready', function(data) {
            var userId = socket.userId;
            console.log("ready" + userId);
            if (userId == null) {
                return;
            }
            socket.gameMgr.setReady(userId);
            // userMgr.broacastInRoom('user_ready_push', {
            //     userid: userId,
            //     ready: true
            // }, userId, true);
        });
        socket.on('wannaToComparePai', function() {
            var userId = socket.userId;
            socket.gameMgr.wannaToComparePai(userId);
        });
        socket.on('getUserInfoByUserid', function() {
            //获取用户信息，用于断线重连的时候调用
            var userId = socket.userId;
            socket.gameMgr.getUserInfoByUserid(userId);
        });
        socket.on('getGameInfoByUserid', function() {
            //获取游戏信息，用于断线重连的时候调用
            var userId = socket.userId;
            socket.gameMgr.getGameInfoByUserid(userId);
        });
        //聊天
        socket.on('chat', function(data) {
            if (socket.userId == null) {
                return;
            }
            var chatContent = data;
            userMgr.broacastInRoom('chat_push', {
                sender: socket.userId,
                content: chatContent
            }, socket.userId, true);
        });
        //快速聊天
        socket.on('quick_chat', function(data) {
            if (socket.userId == null) {
                return;
            }
            var chatId = data;
            userMgr.broacastInRoom('quick_chat_push', {
                sender: socket.userId,
                content: chatId
            }, socket.userId, true);
        });
        //语音聊天
        socket.on('voice_msg', function(data) {
            if (socket.userId == null) {
                return;
            }
            console.log(data.length);
            userMgr.broacastInRoom('voice_msg_push', {
                sender: socket.userId,
                content: data
            }, socket.userId, true);
        });
        //表情
        socket.on('emoji', function(data) {
            if (socket.userId == null) {
                return;
            }
            var phizId = data;
            userMgr.broacastInRoom('emoji_push', {
                sender: socket.userId,
                content: phizId
            }, socket.userId, true);
        });
        //语音使用SDK不出现在这里
        //退出房间
        socket.on('exit', function(data) {
            //退出
            var userId = socket.userId;
            var roomId = roomMgr.getUserRoom(userId);
            var roomInfo = roomMgr.getRoom(roomId);
            if (roomInfo.conf && roomInfo.conf.creator == 'match') {
                socket.emit('match_exit_error');
                return;
            }
            userMgr.exitRoom(userId);
            // if (userId == null) {
            //     return;
            // }
            // var roomId = roomMgr.getUserRoom(userId);
            // if (roomId == null) {
            //     return;
            // }
            // socket.gameMgr.giveUp_game(userId);
            // //通知其它玩家，有人退出了房间
            // userMgr.broacastInRoom('exit_notify_push', userId, userId, false);
            // roomMgr.exitRoom(userId);
            // socket.emit('exit_result');
            // socket.disconnect();
        });
        //解散房间
        socket.on('dispress', function(data) {
            var userId = socket.userId;
            if (userId == null) {
                return;
            }
            var roomId = roomMgr.getUserRoom(userId);
            if (roomId == null) {
                return;
            }
            //如果游戏已经开始，则不可以
            if (socket.gameMgr.hasBegan(roomId)) {
                return;
            }
            //如果不是房主，则不能解散房间
            if (roomMgr.isCreator(roomId, userId) == false) {
                return;
            }
            userMgr.broacastInRoom('dispress_push', {}, userId, true);
            userMgr.kickAllInRoom(roomId);
            roomMgr.destroy(roomId);
            socket.disconnect();
        });
        socket.on('dissolve_request', function(data) {
            var userId = socket.userId;
            console.log(1);
            if (userId == null) {
                console.log(2);
                return;
            }
            var roomId = roomMgr.getUserRoom(userId);
            if (roomId == null) {
                console.log(3);
                return;
            }
            //如果游戏未开始，则不可以
            if (socket.gameMgr.hasBegan(roomId) == false) {
                console.log(4);
                return;
            }
            var ret = socket.gameMgr.dissolveRequest(roomId, userId);
            if (ret != null) {
                var dr = ret.dr;
                var ramaingTime = (dr.endTime - Date.now()) / 1000;
                var data = {
                    time: ramaingTime,
                    states: dr.states
                }
                console.log(5);
                userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
            }
            console.log(6);
        });
        socket.on('dissolve_agree', function(data) {
            var userId = socket.userId;
            if (userId == null) {
                return;
            }
            var roomId = roomMgr.getUserRoom(userId);
            if (roomId == null) {
                return;
            }
            var ret = socket.gameMgr.dissolveAgree(roomId, userId, true);
            if (ret != null) {
                var dr = ret.dr;
                var ramaingTime = (dr.endTime - Date.now()) / 1000;
                var data = {
                    time: ramaingTime,
                    states: dr.states
                }
                userMgr.broacastInRoom('dissolve_notice_push', data, userId, true);
                var doAllAgree = true;
                for (var i = 0; i < dr.states.length; ++i) {
                    if (dr.states[i] == false) {
                        doAllAgree = false;
                        break;
                    }
                }
                if (doAllAgree) {
                    socket.gameMgr.doDissolve(roomId);
                }
            }
        });
        socket.on('dissolve_reject', function(data) {
            var userId = socket.userId;
            if (userId == null) {
                return;
            }
            var roomId = roomMgr.getUserRoom(userId);
            if (roomId == null) {
                return;
            }
            var ret = socket.gameMgr.dissolveAgree(roomId, userId, false);
            if (ret != null) {
                userMgr.broacastInRoom('dissolve_cancel_push', {}, userId, true);
            }
        });
        //断开链接
        socket.on('disconnect', function(data) {
            var userId = socket.userId;
            var roomId = roomMgr.getUserRoom(userId);
            if (!userId) {
                return;
            }
            var data = {
                userid: userId,
                online: false
            };
            //通知房间内其它玩家
            var roomInfo = roomMgr.getRoom(roomId);
            userMgr.broacastInfo('user_state_push', data, roomInfo);
            //清除玩家的在线信息
            userMgr.del(userId);
            socket.userId = null;
            //如果没有玩家在线 设置定时器30分钟后解散房间
            roomMgr.delOnlineCount(roomId, socket); //在线玩家-1
        });
        socket.on('game_ping', function(data) {
            var userId = socket.userId;
            if (!userId) {
                return;
            }
            // console.log('game_ping');
            socket.emit('game_pong');
        });
        socket.on('all_in', function(data) {
            var userId = socket.userId;
            if (!userId) {
                return;
            }
            socket.gameMgr.doAllIn(userId);
        });
        // allin完继续,用于前端执行完allin动画后触发进行下一步
        socket.on('allInActiveFromClient', function(data) {
            var userId = socket.userId;
            if (!userId) {
                return;
            }
            socket.gameMgr.allInActiveFromClient(userId);
        });
    });
    console.log("game server is listening on " + config.CLIENT_PORT);
};