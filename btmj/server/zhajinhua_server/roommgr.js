var db = require('../utils/db');
var userMgr = require('./usermgr');
var rooms = {};
var creatingRooms = {};
var userLocation = {};
var totalRooms = 0;
//定时器集合
var timerList = {};
//计时30秒
var timeSeconds = 30;
var playerTimers = {};

function generateRoomId() {
    var roomId = "";
    for (var i = 0; i < 6; ++i) {
        roomId += Math.floor(Math.random() * 10);
    }
    return roomId;
    //return '000000';
}

function constructRoomFromDb(dbdata, usersData, callback) {
    var roomInfo = {
        uuid: dbdata.uuid,
        id: dbdata.id,
        numOfGames: dbdata.num_of_turns,
        createTime: dbdata.create_time,
        nextButton: dbdata.next_button,
        onlineCount: 0,
        lianZhuangNum: 1,
        seats: new Array(5),
        waitingUsers: [],
        users: [],
        conf: JSON.parse(dbdata.base_info),
        noMoneyArr: [],
        nextUid: 0,
        userDatas: {},
        maxCircle: 15,
        isWaiting: false, //房间是否挂起,
        num: 3,
        enough_num: dbdata.enough_num, //满多少人才开始
        
    };
    var roomId = roomInfo.id;
    roomInfo.gameMgr = require("./game_zjh");
    db.select_scene(dbdata.room_type, dbdata.scene, function(data) {
        roomInfo.scene = {
            consume_num: data.consume_num,
            limit_danzhu: data.limit_danzhu,
            jiazhu1: data.jiazhu1,
            jiazhu2: data.jiazhu2,
            jiazhu3: data.jiazhu3,
            jiazhu4: data.jiazhu4,
            consume_type: data.consume_type,
            limit_num: data.limit_num,
        };
        roomInfo.maxZhu = Number(data.limit_danzhu) * 2;
        rooms[roomId] = roomInfo;
        totalRooms++;
        for (var i = 0; i < 5; ++i) {
            var s = roomInfo.seats[i] = {};
            s.userId = dbdata["user_id" + i];
            s.name = dbdata["user_name" + i];
            s.ready = false;
            s.seatIndex = i;
            if (s.userId > 0) {
                userLocation[s.userId] = {
                    roomId: roomId,
                    seatIndex: i
                };
                if (usersData && usersData[s.userId]) {
                    if (roomInfo.scene.consume_type == 1) {
                        s.score = usersData[s.userId].coins;
                    } else {
                        s.score = usersData[s.userId].gems;
                    }
                    s.robot = usersData[s.userId].robot;
                    //加入等待对列
                    var waitDict = {};
                    waitDict.userid = s.userId;
                    waitDict.seatIndex = -1;
                    //这个地方需要初始化一些新加入的用户信息
                    waitDict.money = s.score;
                    //TODO 判断玩家的资格,玩家是否能加入游戏
                    //**暂时未完成**
                    //新加的玩家等待下一局游戏
                    if (!roomInfo.waitingUsers) {
                        roomInfo.waitingUsers = [];
                    }
                    roomInfo.waitingUsers.push(waitDict);
                } else {
                    s.robot = 0;
                    s.score = dbdata["user_score" + i];
                }
            }
        }
        callback(roomInfo);
    });
}
exports.createRoom = function(creator, roomConf, gems, ip, port, callback) {
    if (roomConf.room_type == null) {
        callback(1, null);
        return;
    }
    if (roomConf.scene == null) {
        callback(1, null);
        return;
    }
    if (roomConf.genre == 0) {
        if (cost > gems) {
            callback(2222, null);
            return;
        }
    }
    var fnCreate = function() {
        var roomId = generateRoomId();
        if (rooms[roomId] != null || creatingRooms[roomId] != null) {
            fnCreate();
        } else {
            creatingRooms[roomId] = true;
            db.is_room_exist(roomId, function(ret) {
                if (ret) {
                    delete creatingRooms[roomId];
                    fnCreate();
                } else {
                    var createTime = Math.ceil(Date.now() / 1000);
                    var roomInfo = {
                        uuid: "",
                        id: roomId,
                        createTime: createTime,
                        nextButton: 0,
                        onlineCount: 0,
                        seats: [],
                        conf: {
                            room_type: roomConf.room_type,
                            type: roomConf.type,
                            creator: 'admin',
                            scene: roomConf.scene,
                        },
                        scene: {
                            scene: roomConf.scene,
                            limit_num: roomConf.limit_num,
                            consume_num: roomConf.consume_num,
                            limit_danzhu: roomConf.limit_danzhu,
                            jiazhu1: roomConf.jiazhu1,
                            jiazhu2: roomConf.jiazhu2,
                            jiazhu3: roomConf.jiazhu3,
                            jiazhu4: roomConf.jiazhu4,
                            consume_type: roomConf.consume_type,
                        },
                        nextUid: 0,
                        users: [],
                        userDatas: {},
                        waitingUsers: [],
                        noMoneyArr: [],
                        maxCircle: 15,
                        isWaiting: false, //房间是否挂起
                        //这个是明注的价格
                        maxZhu: Number(roomConf.limit_danzhu) * 2,
                        num: 3,
                    };
                    roomInfo.gameMgr = require("./game_zjh");
                    for (var i = 0; i < 5; ++i) {
                        roomInfo.seats.push({
                            userId: 0,
                            score: 0,
                            name: "",
                            ready: false,
                            seatIndex: i
                        });
                    }
                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, roomConf, function(uuid) {
                        delete creatingRooms[roomId];
                        if (uuid != null) {
                            roomInfo.uuid = uuid;
                            // console.log(uuid);
                            rooms[roomId] = roomInfo;
                            totalRooms++;
                            callback(0, roomId);
                        } else {
                            callback(3, null);
                        }
                    });
                }
            });
        }
    }
    fnCreate();
};
exports.destroy = function(roomId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return;
    }
    for (var i = 0; i < 5; ++i) {
        var userId = roomInfo.seats[i].userId;
        if (userId > 0) {
            delete userLocation[userId];
            // console.log("ddddddddddddd32==========", roomId, i);
            db.set_room_id_of_user(userId, null);
            // db.update_seat_info(roomId, i, 0, '', null, null, null);
        }
    }
    delete rooms[roomId];
    totalRooms--;
    db.delete_room(roomId);
}
exports.getTotalRooms = function() {
    return totalRooms;
}
exports.getRoom = function(roomId) {
    return rooms[roomId];
};
exports.addOnlineCount = function(roomId) {
    if (!rooms[roomId]) {
        return;
    }
    rooms[roomId].onlineCount++;
    if (timerList[roomId] && timerList[roomId] != null) {
        clearTimeout(timerList[roomId]);
        timerList[roomId] = null;
    }
};
exports.delOnlineCount = function(roomId, socket) {
    return;
    // if (!rooms[roomId]) {
    //     return;
    // }
    // rooms[roomId].onlineCount--;
    // if (rooms[roomId].onlineCount <= 0) {
    //     if (timerList[roomId] && timerList[roomId] != null) {
    //         return;
    //     }
    //     var time = function() {
    //             userMgr.broacastInRoom('dispress_push', {}, rooms[roomId].conf.creator, true);
    //             userMgr.kickAllInRoom(roomId);
    //             exports.destroy(roomId);
    //             socket.disconnect();
    //             console.log("我把房间关闭了");
    //             //time是指本身,延时递归调用自己,100为间隔调用时间,单位毫秒  
    //         }
    //         //没有玩家在线
    //     var tmid = setTimeout(time, 1000 * 60 * 30);
    //     timerList[roomId] = tmid;
    // }
};
exports.isCreator = function(roomId, userId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return false;
    }
    return roomInfo.conf.creator == userId;
};
exports.enterRoom = function(roomId, userId, userName, callback) {
    var fnTakeSeat = function(room) {
        if (exports.getUserRoom(userId) == roomId) {
            //已存在
            return 0;
        }
        console.log(userId,'will enter room',roomId);
        db.get_user_data_by_userid(userId, function(userData) {
            var seatcont = 5;
            for (var i = 0; i < seatcont; ++i) {
                var seat = room.seats[i];
                if (seat.userId <= 0) {
                    seat.userId = userId;
                    seat.name = userName;
                    if (room.scene.consume_type == 1) {
                        seat.score = userData.coins;
                    } else if (room.scene.consume_type == 'score') {
                        seat.score = 10000;
                    } else {
                        seat.score = userData.gems;
                    }
                    seat.robot = userData.robot;
                    userLocation[userId] = {
                        roomId: roomId,
                        seatIndex: i
                    };
                    //加入等待对列
                    var waitDict = {};
                    waitDict.userid = userId;
                    waitDict.seatIndex = i;
                    //这个地方需要初始化一些新加入的用户信息
                    waitDict.money = seat.score;
                    //TODO 判断玩家的资格,玩家是否能加入游戏
                    //**暂时未完成**
                    //新加的玩家等待下一局游戏
                    if (!room.waitingUsers) {
                        room.waitingUsers = [];
                    }
                    room.waitingUsers.push(waitDict);
                    //console.log(userLocation[userId]);
                    db.update_seat_info(roomId, i, seat.userId, "", seat.name, userData);
                    //正常
                    return 0;
                }
            }
        });
        //因为上面的return在回调里无法及时返回，所以在这里再判断一次
        var seatcont = 5;
        for (var i = 0; i < seatcont; ++i) {
            var seat = room.seats[i];
            if (seat.userId <= 0) {
                return 0;
            }
        }
        //房间已满
        return 1;
    }
    var room = rooms[roomId];
    if (room) {
        var ret = fnTakeSeat(room);
        callback(ret);
    } else {
        db.get_users_in_room(roomId, function(usersData) {
            db.get_room_data(roomId, function(dbdata) {
                if (dbdata == null) {
                    //找不到房间
                    callback(2);
                } else {
                    //construct room.
                    constructRoomFromDb(dbdata, usersData, function(room) {
                        var ret = fnTakeSeat(room);
                        callback(ret);
                    });
                }
            });
        });
    }
};
exports.setReady = function(userId, value) {
    var roomId = exports.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var room = exports.getRoom(roomId);
    if (room == null) {
        return;
    }
    var seatIndex = exports.getUserSeat(userId);
    if (seatIndex == null) {
        return;
    }
    var s = room.seats[seatIndex];
    s.ready = value;
}
exports.isReady = function(userId) {
    var roomId = exports.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var room = exports.getRoom(roomId);
    if (room == null) {
        return;
    }
    var seatIndex = exports.getUserSeat(userId);
    if (seatIndex == null) {
        return;
    }
    var s = room.seats[seatIndex];
    return s.ready;
}
exports.getUserRoom = function(userId) {
    var location = userLocation[userId];
    if (location != null) {
        return location.roomId;
    }
    return null;
};
exports.getUserSeat = function(userId) {
    var location = userLocation[userId];
    //console.log(userLocation[userId]);
    if (location != null) {
        return location.seatIndex;
    }
    return null;
};
exports.getUserLocations = function() {
    return userLocation;
};
exports.exitRoom = function(userId) {
    var location = userLocation[userId];
    if (location == null) return;
    var roomId = location.roomId;
    var seatIndex = location.seatIndex;
    var room = rooms[roomId];
    delete userLocation[userId];
    if (room == null || seatIndex == null) {
        return;
    }
    var seat = room.seats[seatIndex];
    seat.userId = 0;
    seat.name = "";
    var numOfPlayers = 0;
    for (var i = 0; i < room.seats.length; ++i) {
        if (room.seats[i].userId > 0) {
            numOfPlayers++;
        }
    }
    db.set_room_id_of_user(userId, null);
    db.update_seat_info(roomId, seatIndex, 0, '', null, null, null);
    if (numOfPlayers == 0) {
        exports.destroy(roomId);
    }
};
//********定时器*********
//1表示过
exports.initCounter = function(game, userid) {
    deleteSetTimeOut(game);
    var roomInfo = game.roomInfo;
    rooms[roomInfo.id]['counter'] = timeSeconds;
    countDown(game, userid, rooms[roomInfo.id]['counter']);
}

function countDown(game, userid, counter) {
    playerTimers[game.roomInfo.id] = setTimeout(function() {
        counter--;
        counter = counter < 0 ? 0 : counter;
        if (counter == 0) {
            var roomInfo = game.roomInfo;
            roomInfo.gameMgr.allActionsGuo(userid);
        } else {
            countDown(game, userid, counter);
        }
    }, 1000);
}
var deleteSetTimeOut = function(game) {
    var timeCounter = playerTimers[game.roomInfo.id];
    if (timeCounter != null) {
        clearTimeout(timeCounter);
        timeCounter = null;
    }
}
exports.deleteSetTimeOut = deleteSetTimeOut;
exports.createMatchRoom = function(roomConf, callback) {
    var fnCreate = function() {
        var roomId = generateRoomId();
        if (rooms[roomId] != null || creatingRooms[roomId] != null) {
            fnCreate();
        } else {
            creatingRooms[roomId] = true;
            db.is_room_exist(roomId, function(ret) {
                if (ret) {
                    delete creatingRooms[roomId];
                    fnCreate();
                } else {
                    var createTime = Math.ceil(Date.now() / 1000);
                    var roomInfo = {
                        uuid: "",
                        id: roomId,
                        createTime: createTime,
                        nextButton: 0,
                        onlineCount: 0,
                        seats: [],
                        conf: {
                            room_type: 2,
                            type: 'zjh',
                            creator: 'match',
                        },
                        scene: {
                            limit_num: 200,
                            consume_num: roomConf.consume_num,
                            limit_danzhu: roomConf.limit_danzhu,
                            jiazhu1: roomConf.jiazhu1,
                            jiazhu2: roomConf.jiazhu2,
                            jiazhu3: roomConf.jiazhu3,
                            jiazhu4: roomConf.jiazhu4,
                            consume_type: 'score',
                        },
                        nextUid: 0,
                        users: [],
                        userDatas: {},
                        waitingUsers: [],
                        noMoneyArr: [],
                        maxCircle: 15,
                        isWaiting: false, //房间是否挂起
                        //这个是明注的价格
                        maxZhu: roomConf.limit_danzhu * 2,
                        num: 3,
                        enough_num: roomConf.enough_num, //满多少人才开始
                    };
                    console.log('roomId',roomId);
                    console.log('enough_num',roomConf.enough_num);
                    roomInfo.gameMgr = require("./game_zjh");
                    for (var i = 0; i < 5; ++i) {
                        roomInfo.seats.push({
                            userId: 0,
                            score: 0,
                            name: "",
                            ready: false,
                            seatIndex: i
                        });
                    }
                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id, roomInfo.conf, '127.0.0.1', 19010, createTime, roomConf, function(uuid) {
                        delete creatingRooms[roomId];
                        if (uuid != null) {
                            roomInfo.uuid = uuid;
                            // console.log(uuid);
                            rooms[roomId] = roomInfo;
                            totalRooms++;
                            callback(0, roomId);
                        } else {
                            callback(3, null);
                        }
                    });
                }
            });
        }
    }
    fnCreate();
};