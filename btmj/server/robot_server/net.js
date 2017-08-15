var userMgr = require("./usermgr");
exports.addHandler = function(socket, event, fn) {
    var handler = function(data) {
        if (event != "disconnect" && typeof(data) == "string") {
            data = JSON.parse(data);
        }
        fn(data);
    };
    if (socket) {
        socket.on(event, handler);
    }
};
exports.send = function(socket, event, data) {
    if (socket.connected) {
        if (data != null && (typeof(data) == "object")) {
            data = JSON.stringify(data);
        }
        socket.emit(event, data);
    }
};
exports.ping = function(socket) {
    send(socket, 'game_ping');
};
exports.close = function(socket) {
    console.log('close');
    if (socket && socket.connected) {
        userMgr.del(socket.userId);
        socket.connected = false;
        socket.disconnect();
        socket = null;
    }
};