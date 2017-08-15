var userList = {};
var userOnline = 0;
exports.bind = function(userId, socket) {
    userList[userId].socket = socket;
    userOnline++;
};
exports.del = function(userId, socket) {
    socket = socket ? socket : userList[userId].socket;
    delete userList[userId];
    userOnline--;
};
exports.get = function(userId) {
    return userList[userId];
};
exports.set = function(userId, data) {
    userList[userId] = userList[userId] ? userList[userId] : {};
    for (var i in data) {
        if(i == 'errcode' || i == 'errmsg'){
            continue;
        }
        userList[userId][i] = data[i];
    }
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
    var socket = userInfo.socket;
    if (socket == null) {
        return;
    }
    socket.emit(event, msgdata);
};
//检查用户的socket是否有效。
//有效返回true, 无效返回false;
function socketIsValid(userid) {
    if (!userid) {
        //userid非法则退出游戏
        return false;
    }
    var socket = userList[userid].socket;
    if (socket) {
        return true;
    }
    return false;
}
exports.socketIsValid = socketIsValid;