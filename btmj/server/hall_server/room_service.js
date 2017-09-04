var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require('../utils/http');
var app = express();
var hallIp = null;
var config = null;
var rooms = {};
var serverMap = {};
var roomIdOfUsers = {};
var socket = require("./socket_service");
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.get('/register_gs', function(req, res) {
    var ip = req.ip;
    var clientip = req.query.clientip;
    var clientport = req.query.clientport;
    var httpPort = req.query.httpPort;
    var load = req.query.load;
    var id = clientip + ":" + clientport;
    var userOnline = parseInt(req.query.userOnline);
    if (serverMap[id]) {
        serverMap[id]['userOnline'] = userOnline;
        var info = serverMap[id];
        if (info.clientport != clientport || info.httpPort != httpPort || info.ip != ip) {
            console.log("duplicate gsid:" + id + ",addr:" + ip + "(" + httpPort + ")");
            http.send(res, 1, "duplicate gsid:" + id);
            return;
        }
        info.load = load;
        http.send(res, 0, "ok", {
            ip: ip
        });
        return;
    }
    serverMap[id] = {
        ip: ip,
        id: id,
        clientip: clientip,
        clientport: clientport,
        httpPort: httpPort,
        load: load,
        room_type: req.query.room_type,
        userOnline: userOnline
    };
    http.send(res, 0, "ok", {
        ip: ip
    });
    console.log("game server registered.\n\tid:" + id + "\n\taddr:" + ip + "\n\thttp port:" + httpPort + "\n\tsocket clientport:" + clientport);
    var reqdata = {
        serverid: id,
        sign: crypto.md5(id + config.ROOM_PRI_KEY)
    };
    //获取服务器信息
    http.get(ip, httpPort, "/get_server_info", reqdata, function(ret, data) {
        if (ret && data.errcode == 0) {
            for (var i = 0; i < data.userroominfo.length; i += 2) {
                var userId = data.userroominfo[i];
                var roomId = data.userroominfo[i + 1];
            }
        } else {
            console.log(data.errmsg);
        }
    });
});

function chooseServer(type) {
    // if (parseInt(type) == 1) {
    //     //猜拳和麻将是一个服务器
    //     type = 0;
    // }
    var serverinfo = null;
    for (var s in serverMap) {
        var info = serverMap[s];
        if (info.room_type == type) {
            if (serverinfo == null) {
                serverinfo = info;
            } else {
                if (serverinfo.load > info.load) {
                    serverinfo = info;
                }
            }
        }
    }
    return serverinfo;
}
exports.createRoom = function(account, userId, roomConf, fnCallback) {
    console.log("创建房间roomConf:", roomConf);
    var serverinfo = chooseServer(roomConf.room_type);
    if (serverinfo == null) {
        fnCallback(101, null);
        return;
    }
    if (roomConf.genre == 1) {
        var reqdata = {
            userid: userId,
            conf: JSON.stringify(roomConf),
            gems: 0,
            coins: 0
        };
        reqdata.sign = crypto.md5(userId + reqdata.conf + 0 + config.ROOM_PRI_KEY);
        http.get(serverinfo.ip, serverinfo.httpPort, "/create_room", reqdata, function(ret, data) {
            console.log("系统房间", data);
            if (ret) {
                if (data.errcode == 0) {
                    fnCallback(0, data.roomid);
                } else {
                    fnCallback(data.errcode, null);
                }
                return;
            }
            fnCallback(102, null);
        });
    } else {
        db.get_gems_coins(account, function(data) {
            if (data != null) {
                //2、请求创建房间
                var reqdata = {
                    userid: userId,
                    gems: data.gems,
                    coins: data.coins,
                    conf: JSON.stringify(roomConf)
                };
                reqdata.sign = crypto.md5(userId + reqdata.conf + data.gems + config.ROOM_PRI_KEY);
                http.get(serverinfo.ip, serverinfo.httpPort, "/create_room", reqdata, function(ret, data) {
                    console.log("2、请求创建房间", data);
                    if (ret) {
                        if (data.errcode == 0) {
                            fnCallback(0, data.roomid);
                        } else {
                            fnCallback(data.errcode, null);
                        }
                        return;
                    }
                    fnCallback(102, null);
                });
            } else {
                fnCallback(103, null);
            }
        });
    }
};
exports.enterRoom = function(userId, name, roomId, fnCallback) {
    var reqdata = {
        userid: userId,
        name: name,
        roomid: roomId
    };
    reqdata.sign = crypto.md5(userId + name + roomId + config.ROOM_PRI_KEY);
    var checkRoomIsRuning = function(serverinfo, roomId, callback) {
        var sign = crypto.md5(roomId + config.ROOM_PRI_KEY);
        http.get(serverinfo.ip, serverinfo.httpPort, "/is_room_runing", {
            roomid: roomId,
            sign: sign
        }, function(ret, data) {
            if (ret) {
                if (data.errcode == 0 && data.runing == true) {
                    callback(true);
                } else {
                    callback(false);
                }
            } else {
                callback(false);
            }
        });
    }
    var enterRoomReq = function(serverinfo) {
        http.get(serverinfo.ip, serverinfo.httpPort, "/enter_room", reqdata, function(ret, data) {
            if (ret) {
                if (data.errcode == 0) {
                    db.set_room_id_of_user(userId, roomId, function(ret) {
                        fnCallback(0, {
                            ip: serverinfo.clientip,
                            port: serverinfo.clientport,
                            token: data.token
                        });
                    });
                } else {
                    console.log(data.errmsg);
                    fnCallback(data.errcode, null);
                }
            } else {
                fnCallback(-1, null);
            }
        });
    };
    var chooseServerAndEnter = function(serverinfo, room_type) {
        serverinfo = chooseServer(room_type);
        if (serverinfo != null) {
            enterRoomReq(serverinfo);
        } else {
            fnCallback(-1, null);
        }
    }
    db.get_room_addr(roomId, function(ret, ip, port, room_type) {
        if (ret) {
            var id = ip + ":" + port;
            var serverinfo = serverMap[id];
            if (serverinfo != null) {
                checkRoomIsRuning(serverinfo, roomId, function(isRuning) {
                    if (isRuning) {
                        enterRoomReq(serverinfo);
                    } else {
                        chooseServerAndEnter(serverinfo, room_type);
                    }
                });
            } else {
                chooseServerAndEnter(serverinfo, room_type);
            }
        } else {
            fnCallback(-2, null);
        }
    });
};
exports.isServerOnline = function(ip, port, callback) {
    var id = ip + ":" + port;
    var serverInfo = serverMap[id];
    if (!serverInfo) {
        callback(false);
        return;
    }
    var sign = crypto.md5(config.ROOM_PRI_KEY);
    http.get(serverInfo.ip, serverInfo.httpPort, "/ping", {
        sign: sign
    }, function(ret, data) {
        if (ret) {
            callback(true);
        } else {
            callback(false);
        }
    });
};
exports.checkCondition = function(userInfo, room_type, scene, callback) {
    db.select_scene(room_type, scene, function(ret) {
        if (ret) {
            if (ret.limit_type == 1) {
                if ((userInfo.coins - ret.limit_num) >= 0) {
                    callback(ret);
                } else {
                    callback(-1);
                }
            } else {
                if ((userInfo.gems - ret.limit_num) >= 0) {
                    callback(ret);
                } else {
                    callback(-2);
                }
            }
        } else {
            callback(0);
        }
    })
};
exports.userOnlineNum = function(callback) {
    var mj_userNum = 0;
    var zjh_userNum = 0;
    var dn_userNum = 0;
    var dzpk_userNum = 0;
    var wh_userNum = 0;
    for (var s in serverMap) {
        var info = serverMap[s];
        if (info.room_type == 0) {
            mj_userNum = mj_userNum + info.userOnline;
        }
        if (info.room_type == 2) {
            zjh_userNum = zjh_userNum + info.userOnline;
        }
        if (info.room_type == 3) {
            dn_userNum = dn_userNum + info.userOnline;
        }
        if (info.room_type == 4) {
            dzpk_userNum = dzpk_userNum + info.userOnline;
        }
        if (info.room_type == 5) {
            wh_userNum = wh_userNum + info.userOnline;
        }
    }
    var online = {
        0: mj_userNum,
        2: zjh_userNum,
        3: dn_userNum,
        4: dzpk_userNum,
        5: wh_userNum,
    }
    callback(online);
};
exports.getServerMap = function() {
    return serverMap;
};
app.get('/socket_message', function(req, res) {
    var userid = req.query.userid,
        event = req.query.event,
        isWin = req.query.isWin;
    if (isWin == 'false') {
        isWin = false;
    }
    var data = {
        isWin: isWin
    };
    socket.sendMsg(userid, event, data);
    http.send(res, 0, "ok");
});
app.get('/next_trun_match', function(req, res) {
    var type = req.query.type,
        winer = req.query.winer ? JSON.parse(req.query.winer) : 0,
        loser = req.query.loser ? JSON.parse(req.query.loser) : 0;
    var ret = socket.next(type, winer, loser);
    console.log('next_trun_match', ret);
    http.send(res, 0, "ok", ret);
});
exports.start = function($config) {
    config = $config;
    app.listen(config.ROOM_PORT, config.FOR_ROOM_IP);
    console.log("room service is listening on " + config.FOR_ROOM_IP + ":" + config.ROOM_PORT);
};