var db = require('../utils/db');
var userMgr = require('./usermgr');
var rooms = {};
var creatingRooms = {};
var userLocation = {};
var totalRooms = 0;
// 低分设置
var DI_FEN = [5, 10];
// 番数量
var MAX_FAN = [3, 4, 5];
// 局数设置
var JU_SHU = [6, 12];
// 创建房间消耗的金币数量
var JU_SHU_COST = [30000, 60000];
//定时器集合
var timerList = {};

function generateRoomId() {
    var roomId = "";
    for (var i = 0; i < 6; ++i) {
        roomId += Math.floor(Math.random() * 10);
    }
    return roomId;
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
        seats: new Array(4),
        conf: JSON.parse(dbdata.base_info)
    };
    roomInfo.gameMgr = require("./gamemgr_wh");
    var roomId = roomInfo.id;
    for (var i = 0; i < 4; ++i) {
        var s = roomInfo.seats[i] = {};
        s.userId = dbdata["user_id" + i];
        s.score = dbdata["user_score" + i];
        s.name = dbdata["user_name" + i];
        s.ready = false;
        s.seatIndex = i;
        s.numZiMo = 0;
        // 收炮和牌
        s.numJiePao = 0;
        // 放炮
        s.numDianPao = 0;
        // 暗杠
        s.numAnGang = 0;
        // 明杠
        s.numMingGang = 0;
        // s.numChaJiao = 0;
        // 手里的财神的数量
        s.numCaiShen = 0;
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
    console.log("createRoom=============", roomConf);
    if (roomConf.room_type == null) {
        callback(1, null);
        return;
    }
    if (roomConf.type == null || roomConf.difen == null || roomConf.jushuxuanze == null) {
        callback(1, null);
        return;
    }
    if (roomConf.difen < 0 || roomConf.difen > DI_FEN.length) {
        callback(1, null);
        return;
    }
    if (roomConf.jushuxuanze < 0 || roomConf.jushuxuanze > JU_SHU.length) {
        callback(1, null);
        return;
    }
    var cost = JU_SHU_COST[roomConf.jushuxuanze];
    if (cost > gems) {
        callback(2222, null);
        return;
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
                        numOfGames: 0,
                        createTime: createTime,
                        nextButton: 0,
                        onlineCount: 0,
                        seats: [],
                        lianZhuangNum: 0,
                        conf: {
                            room_type: roomConf.room_type,
                            type: roomConf.type,
                            baseScore: DI_FEN[roomConf.difen],
                            maxGames: JU_SHU[roomConf.jushuxuanze],
                            yipaoduoxiang: roomConf.yipaoduoxiang,
                            creator: creator,
                        }
                    };
                    roomInfo.gameMgr = require("./gamemgr_wh");
                    console.log("创建的房间的配置是" + roomInfo.conf);
                    for (var i = 0; i < 4; ++i) {
                        roomInfo.seats.push({
                            userId: 0,
                            score: 0,
                            name: "",
                            ready: false,
                            seatIndex: i,
                            numZiMo: 0,
                            numJiePao: 0,
                            numDianPao: 0,
                            numAnGang: 0,
                            numMingGang: 0,
                            // numChaJiao: 0,
                            numCaiShen: 0
                        });
                    }
                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id, roomInfo.conf, ip, port, createTime, conf, function(uuid) {
                        delete creatingRooms[roomId];
                        if (uuid != null) {
                            roomInfo.uuid = uuid;
                            console.log(uuid);
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
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var userId = roomInfo.seats[i].userId;
        if (userId > 0) {
            delete userLocation[userId];
            // db.update_seat_info(roomId, i, 0, '', null, null, null);
            db.set_room_id_of_user(userId, null);
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
                    userMgr.kickAllInRoom(roomId);
                    exports.destroy(roomId);
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
    var fnTakeSeat = function(room) {
        // console.log(userId,"enter room=========", room)
        if (exports.getUserRoom(userId) == roomId) {
            //已存在
            return 0;
        }
        for (var i = 0; i < 4; ++i) {
            var seat = room.seats[i];
            if (seat.userId <= 0) {
                seat.userId = userId;
                seat.name = userName;
                userLocation[userId] = {
                    roomId: roomId,
                    seatIndex: i
                };
                console.log(userLocation[userId]);
                db.update_seat_info(roomId, i, seat.userId, "", seat.name);
                //正常
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
        db.get_room_data(roomId, function(dbdata) {
            if (dbdata == null) {
                //找不到房间
                callback(2);
            } else {
                //construct room.
                room = constructRoomFromDb(dbdata);
                var ret = fnTakeSeat(room);
                callback(ret);
            }
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
exports.createMatchRoom = function(callback) {
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
                        numOfGames: 0,
                        createTime: createTime,
                        nextButton: 0,
                        onlineCount: 0,
                        seats: [],
                        lianZhuangNum: 0,
                        conf: {
                            room_type: 5,
                            type: 0,
                            baseScore: DI_FEN[1],
                            maxGames: 4,
                            creator: 'match',
                        }
                    };
                    roomInfo.gameMgr = require("./gamemgr_wh");
                    console.log("创建的房间的配置是" + roomInfo.conf);
                    for (var i = 0; i < 4; ++i) {
                        roomInfo.seats.push({
                            userId: 0,
                            score: 0,
                            name: "",
                            ready: false,
                            seatIndex: i,
                            numZiMo: 0,
                            numJiePao: 0,
                            numDianPao: 0,
                            numAnGang: 0,
                            numMingGang: 0,
                            // numChaJiao: 0,
                            numCaiShen: 0
                        });
                    }
                    //写入数据库
                    var conf = roomInfo.conf;
                    db.create_room(roomInfo.id, roomInfo.conf, '127.0.0.1', '19000', createTime, conf, function(uuid) {
                        delete creatingRooms[roomId];
                        if (uuid != null) {
                            roomInfo.uuid = uuid;
                            console.log(uuid);
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

//检查是否可以碰
function checkCanPeng(game, seatData, targetPai) {
    if (getMJType(targetPai) == seatData.que) {
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 2) {
        seatData.canPeng = true;
    }
}
//检查是否可以点杠
function checkCanDianGang(game, seatData, targetPai) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    if (getMJType(targetPai) == seatData.que) {
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 3) {
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
}
//检查是否可以暗杠
function checkCanAnGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    for (var key in seatData.countMap) {
        var pai = parseInt(key);
        if (getMJType(pai) != seatData.que) {
            var c = seatData.countMap[key];
            if (c != null && c == 4) {
                seatData.canGang = true;
                seatData.gangPai.push(pai);
            }
        }
    }
}
//检查是否可以弯杠(自己摸起来的时候)
function checkCanWanGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    //从碰过的牌中选
    for (var i = 0; i < seatData.pengs.length; ++i) {
        var pai = seatData.pengs[i];
        if (seatData.countMap[pai] == 1) {
            seatData.canGang = true;
            seatData.gangPai.push(pai);
        }
    }
}

function checkCanHu(game, seatData, targetPai) {
    game.lastHuPaiSeat = -1;
    if (getMJType(targetPai) == seatData.que) {
        return;
    }
    seatData.canHu = false;
    for (var k in seatData.tingMap) {
        if (targetPai == k) {
            seatData.canHu = true;
        }
    }
}