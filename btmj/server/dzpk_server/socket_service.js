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
            data = JSON.parse(data);
            if (socket.userId != null) {
                //已经登陆过的就忽略
                return;
            }
            console.log('login socket', data);
            var token = data.token;
            var roomId = data.roomid;
            var time = data.time;
            var sign = data.sign;
            //检查参数合法性
            if (token == null || roomId == null || sign == null || time == null) {
                console.log(1);
                socket.emit('login_result', {
                    errcode: 1,
                    errmsg: "invalid parameters"
                });
                return;
            }
            //检查参数是否被篡改
            var md5 = crypto.md5(roomId + token + time + config.ROOM_PRI_KEY);
            if (md5 != sign) {
                console.log(2);
                socket.emit('login_result', {
                    errcode: 2,
                    errmsg: "login failed. invalid sign!"
                });
                return;
            }
            //检查token是否有效
            if (tokenMgr.isTokenValid(token) == false) {
                console.log(3);
                socket.emit('login_result', {
                    errcode: 3,
                    errmsg: "token out of time."
                });
                return;
            }
            //检查房间合法性
            var userId = tokenMgr.getUserID(token);
            var roomId = roomMgr.getUserRoom(userId);
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
                    scene: roomInfo.scene,
                    seats: seats
                }
            };
            socket.emit('login_result', ret);
            socket.gameMgr = roomInfo.gameMgr;
            roomMgr.addOnlineCount(roomId); //在线玩家+1
            userMgr.broacastInRoom('new_user_comes_push', userData, userId, true);
            socket.emit('login_finished');
            //玩家上线，强制设置为TRUE
            // socket.gameMgr.setReady(userId);
            //通知其它客户端
        });
        socket.on('ready', function(data) {
            var userId = socket.userId;
            if (userId == null) {
                return;
            }
            socket.gameMgr.setReady(userId);
            userMgr.broacastInRoom('user_ready_push', {
                userid: userId,
                ready: true
            }, userId, true);
        });
        socket.on('rangpai', function(data) {
            var userId = socket.userId;
            socket.gameMgr.userOps(userId, 'doGuo');
        });
        socket.on('qipai', function(data) {
            var userId = socket.userId;
            socket.gameMgr.userOps(userId, 'doQuit');
        });
        socket.on('genpai', function(data) {
            var userId = socket.userId;
            socket.gameMgr.userOps(userId, 'doGen');
        });
        socket.on('jiazhu', function(data) {
            var userId = socket.userId;
            socket.gameMgr.userOps(userId, 'doAdd', data);
        });
        socket.on('exit', function(data) {
            var userId = socket.userId;
            var roomId = roomMgr.getUserRoom(userId);
            var roomInfo = roomMgr.getRoom(roomId);
            userMgr.exitRoom(userId);
        });
        socket.on('isUserInGame', function(data) {
            var userId = socket.userId;
            socket.gameMgr.isUserInGame(userId);
        });
        socket.on('getUserHolds', function(data) {
            var userId = socket.userId;
            var data = socket.gameMgr.getUserHolds(userId);
            socket.emit('socket_MyHolds', data);
        });
        socket.on('getUserInfoByUserid', function(data) {
            var userId = socket.userId;
            socket.gameMgr.getUserInfoByUserid(userId);
        });
        socket.on('getGameInfoByUserid', function(data) {
            var userId = socket.userId;
            socket.gameMgr.getGameInfoByUserid(userId);
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
                online: false,
            };
            //通知房间内其它玩家
            userMgr.broacastInRoom('user_state_push', data, userId);
            //清除玩家的在线信息
            userMgr.del(userId);
            socket.userId = null;
            //如果没有玩家在线 设置定时器30分钟后解散房间
            roomMgr.delOnlineCount(roomId, socket); //在线玩家-1
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
        socket.on('game_ping', function(data) {
            var userId = socket.userId;
            if (!userId) {
                return;
            }
            socket.emit('game_pong');
        });
    });
    console.log("game server is listening on " + config.CLIENT_PORT);
};