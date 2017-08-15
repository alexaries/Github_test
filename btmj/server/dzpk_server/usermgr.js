var roomMgr = require('./roommgr');
var userList = {};
var userOnline = 0;
exports.bind = function(userId, socket) {
    userList[userId] = socket;
    userOnline++;
};
exports.del = function(userId, socket) {
    socket = socket ? socket : userList[userId];
    socket.gameMgr.oneUserSockedIsInvalid(userId);
    delete userList[userId];
    userOnline--;
};
exports.get = function(userId) {
    return userList[userId];
};
exports.isOnline = function(userId) {
    var data = userList[userId];
    if (data != null) {
        return true;
    }
    return false;
};
exports.getOnlineCount = function() {
    return userOnline;
}
exports.sendMsg = function(userId, event, msgdata) {
    var userInfo = userList[userId];
    if (userInfo == null) {
        return;
    }
    var socket = userInfo;
    if (socket == null) {
        return;
    }
    socket.emit(event, msgdata);
};
exports.kickAllInRoom = function(roomId) {
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        if (rs.userId > 0) {
            var socket = userList[rs.userId];
            if (socket != null) {
                exports.del(rs.userId);
                socket.disconnect();
            }
        }
    }
};
exports.broacastInRoom = function(event, data, sender, includingSender) {
    var roomId = roomMgr.getUserRoom(sender);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];
        //如果不需要发给发送方，则跳过
        if (rs.userId == sender && includingSender != true) {
            continue;
        }
        var socket = userList[rs.userId];
        if (socket != null) {
            socket.emit(event, data);
        }
    }
};

function _broacastInfo(event, data, roomInfo) {
    if (!roomInfo) {
        return;
    }
    if (!roomInfo.seats) {
        return;
    }
    var userid = null;
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var rs = roomInfo.seats[i];
        if (rs && rs.userId) {
            userid = rs.userId;
            break;
        }
    }
    if (!userid) {
        return;
    }
    exports.broacastInRoom(event, data, userid, true);
}
exports.broacastInfo = _broacastInfo;
exports.kickConnect = function(userId) {
    if (userId == null) {
        return;
    }
    var socket = userList[userId];
    if (socket != null) {
        exports.del(userId);
        socket.disconnect();
    }
};

function exitRoom(userId, noGameFlag) {
    if (userId == null) {
        return;
    }
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var socket = userList[userId];
    //退出
    // socket.gameMgr.giveUp_game(userId);
    //通知其它玩家，有人退出了房间
    this.broacastInRoom('exit_notify_push', userId, userId, false);
    if (!noGameFlag) {
        socket.gameMgr.exitGame(userId);
    }
    roomMgr.exitRoom(userId);
    socket.emit('exit_result');
    socket.disconnect();
};
exports.exitRoom = exitRoom;
//检查用户的socket是否有效。
//有效返回true, 无效返回false;
function socketIsValid(userid) {
    if (!userid) {
        //userid非法则退出游戏
        return false;
    }
    var socket = userList[userid];
    if (socket) {
        return true;
    }
    return false;
}
exports.socketIsValid = socketIsValid;