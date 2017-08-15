var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var userMgr = require("./usermgr");
var gameNet = require("./game_net");
var io = require('socket.io-client');
var app = express();
var config = null;
var serverIp = "";
//测试
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.get('/get_match_room', function(req, res) {
    var userId = req.query.userId;
    var type = req.query.type;
    var d = {
        userId: userId,
        name: req.query.name,
        roomId: req.query.roomId
    };
    console.log("=====get_match_room")
    http.get(config.HALL_IP, config.HALL_CLIENT_PORT, "/robot_enter_room", d, function(ret, data) {
        console.log("=====robot_enter_room")
        if (ret && data.errcode == 0) {
            var sd = {
                token: data.token,
                roomid: data.roomid,
                time: data.time,
                sign: data.sign,
            };
            userMgr.set(userId, data);
            var socket = io.connect("http://" + data.ip + ":" + data.port);
            socket.on('connect', function() {
                socket.emit("login", JSON.stringify(sd));
                socket.connected = true;
                socket.userId = userId;
                gameNet.initHandlers(socket, type);
                userMgr.bind(userId, socket);
            });
            socket.on('disconnect', function(data) {
                socket.connected = false;
                userMgr.del(userId);
                console.log("-------disconnect", userId);
            });
        } else {
            console.log("enter room error", data.errmsg)
        }
    });
});
exports.start = function($config) {
    config = $config;
    app.listen(config.HTTP_PORT);
    console.log("game server is listening on " + config.FOR_HALL_IP + ":" + config.HTTP_PORT);
};