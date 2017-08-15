var db = require('../utils/db');
var userMgr = require('./usermgr');
var rooms = {};
var creatingRooms = {};
var userLocation = {};
var totalRooms = 0;
//定时器集合
var timerList = {};

function generateRoomId() {
    var roomId = "";
    for (var i = 0; i < 6; ++i) {
        roomId += Math.floor(Math.random() * 10);
    }
    return roomId;
    // return '000000';
}

function constructRoomFromDb(dbdata) {
    var roomInfo = {
        uuid: dbdata.uuid,
        id: dbdata.id,
        numOfGames: dbdata.num_of_turns,
        createTime: dbdata.create_time,
        nextButton: dbdata.next_button,
        onlineCount: 0,
        lianZhuangNum: 0,
        seats: new Array(2),
        conf: JSON.parse(dbdata.base_info)
    };
    roomInfo.gameMgr = require("./gamemgr_morra");
    var roomId = roomInfo.id;
    for (var i = 0; i < 2; ++i) {
        var s = roomInfo.seats[i] = {};
        s.userId = dbdata["user_id" + i];
        s.score = dbdata["user_score" + i];
        s.name = dbdata["user_name" + i];
        s.ready = false;
        s.seatIndex = i;
        s.numShitou = 0;
        s.numJianzi = 0;
        s.numBu = 0;
        if (s.userId > 0) {
            userLocation[s.userId] = {
                roomId: roomId,
                seatIndex: i
            };
        }
    }
    rooms[roomId] = roomInfo;
    totalRooms++;
    return roomInfo;
}
exports.createRoom = function(creator, roomConf, gems, coins, ip, port, callback) {
    console.log("createRoom", roomConf);
    if (roomConf.room_type == null) {
        callback(1, null);
        return;
    }
    if (roomConf.consu == 1) {
        if (parseInt(roomConf.difen) > parseInt(coins)) {
            callback(2222, null);
            return;
        }
    } else {
        if (parseInt(roomConf.difen) > parseInt(gems)) {
            callback(2222, null);
            return;
        }
    }
    // console.log("-------gems------->>",roomConf.difen+"----"+gems+"-----"+(roomConf.difen > gems));
    var cqCreate = function() {
        var roomId = generateRoomId();
        console.log("-----cqCreate---->>");
        if (rooms[roomId] != null || creatingRooms[roomId] != null) {
            creatingRooms[roomId] = null;
            delete creatingRooms[roomId];
            console.log("-----rooms[roomId] != null || creatingRooms[roomId] != null---->>");
            cqCreate();
        } else {
            creatingRooms[roomId] = true;
            db.is_room_exist(roomId, function(ret) {
                console.log("-----is_room_exist---->>", ret);
                if (ret) {
                    delete creatingRooms[roomId];
                    cqCreate();
                } else {
                    var createTime = Math.ceil(Date.now() / 1000);
                    var roomInfo = {
                        uuid: "",
                        id: roomId,
                        numOfGames: 0,
                        createTime: createTime,
                        onlineCount: 0,
                        seats: [],
                        conf: {
                            room_type: roomConf.room_type,
                            baseScore: roomConf.difen, //奖金
                            creator: creator,
                            consu: roomConf.consu,
                        }
                    };
                    console.log("-----require---->>");
                    roomInfo.gameMgr = require("./gamemgr_morra");
                    console.log("创建的房间的配置是" + roomInfo.conf);
                    for (var i = 0; i < 2; ++i) {
                        roomInfo.seats.push({
                            userId: 0,
                            score: 0,
                            name: "",
                            ready: false,
                            seatIndex: i,
                            numShitou: 0,
                            numJianzi: 0,
                            numBu: 0,
                        });
                    }
                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime,conf, function(uuid) {
                        console.log("-----create_room---->>", uuid);
                        delete creatingRooms[roomId];
                        if (uuid != null) {
                            roomInfo.uuid = uuid;
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
    cqCreate();
};
exports.destroy = function(roomId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return;
    }
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var userId = roomInfo.seats[i].userId;
        if (userId > 0) {
            delete userLocation[userId];
            db.set_room_id_of_user(userId, null);
            db.update_seat_info(roomId, i, 0, '', null, null, null);
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
    if (!rooms[roomId]) {
        return;
    }
    rooms[roomId].onlineCount--;
    if (rooms[roomId].onlineCount <= 0) {
        if (timerList[roomId] && timerList[roomId] != null) {
            return;
        }
        var time = function() {
            if (rooms[roomId]) {
                userMgr.broacastInRoom('dispress_push', {}, rooms[roomId].conf.creator, true);
                userMgr.kickAllInRoom(roomId);
                exports.destroy(roomId);
                socket.disconnect();
                console.log("我把房间关闭了");
                //time是指本身,延时递归调用自己,100为间隔调用时间,单位毫秒  
            }
        }
        //没有玩家在线
        var tmid = setTimeout(time, 1000 * 60 * 30);
        timerList[roomId] = tmid;
    }
};
exports.isCreator = function(roomId, userId) {
    var roomInfo = rooms[roomId];
    if (roomInfo == null) {
        return false;
    }
    return roomInfo.conf.creator == userId;
};
exports.enterRoom = function(roomId, userId, userName, callback) {
    var room = rooms[roomId];
    if (room) {
        cq_enough_fee(roomId, userId, userName, room, function(ret) {
            callback(ret);
        });
    } else {
        db.get_room_data(roomId, function(dbdata) {
            if (dbdata == null) {
                //找不到房间
                callback(2);
            } else {
                //construct room.
                room = constructRoomFromDb(dbdata);
                cq_enough_fee(roomId, userId, userName, room, function(ret) {
                    callback(ret);
                });
            }
        });
    }
};

function cq_enough_fee(roomId, userId, userName, room, call) {
    if (exports.getUserRoom(userId) == roomId) {
        //已存在
        call(0);
        return;
    }
    for (var i = 0; i < 2; i++) {
        var index = i;
        var seat = room.seats[i];
        if (seat.userId <= 0) {
            if (i == 1) {
                //如果是攻擂者，扣取10000金币的开房费（固定）。
                var leiZhu = room.seats[0].userId;
                var gongLei = userId;
                var fixed = 10000; //10000金币的开房费
                var feeNum = 0;
                // 如果赢了的话，再扣取1%得手续费，返给擂主，这里就先不扣了
                // if (room.conf.baseScore) {
                //     feeNum = parseInt(room.conf.baseScore) / 100;
                // }
                var feeType = room.conf.consu;
                if (!feeType) {
                    feeType = 0; //0-金币，1-钻石
                }
                console.log(leiZhu, gongLei, fixed, feeNum, feeType);
                db.has_enough_fee(gongLei, fixed, feeNum, feeType, function(data) {
                    if (data) {
                        if (feeType == 0 && parseInt(data.gems) < (fixed + feeNum)) {
                            call(2222); //金币不足
                            return;
                        } else if (feeType == 1) {
                            if (parseInt(data.gems) < fixed || parseInt(data.coins) < feeNum) {
                                call(2222); //金币或钻石不足
                                return;
                            }
                        }
                        db.enter_lei(leiZhu, gongLei, fixed, feeNum, feeType, function(data) {
                            if (!data) {
                                call(2); //查询信息错误
                                return;
                            } else {
                                seat.userId = userId;
                                seat.name = userName;
                                userLocation[userId] = {
                                    roomId: roomId,
                                    seatIndex: index
                                };
                                db.update_seat_info(roomId, i, seat.userId, "", seat.name);
                                //正常
                                call(0);
                                return;
                            }
                        });
                    } else {
                        call(2); //查询信息错误
                        return;
                    }
                });
            } else {
                console.log("----000000----seat------>>", seat);
                seat.userId = userId;
                seat.name = userName;
                userLocation[userId] = {
                    roomId: roomId,
                    seatIndex: index
                };
                db.update_seat_info(roomId, i, seat.userId, "", seat.name);
                call(0);
                return;
            }
        } else {
            if (i == 1) {
                //房间已满
                call(1);
                return;
            }
        }
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