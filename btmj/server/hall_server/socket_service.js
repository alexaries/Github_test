var tokenMgr = require('./tokenmgr');
var room_service = require('./room_service');
var http = require('../utils/http');
var db = require('../utils/db');
var io = null;
var userList = {};
var mjList = {};
var zjhList = {};
var dnList = {};
var matchtmp = {};
var matchlist = {};
var timetmp = {};
var config = null;
var redis = require('redis');
var client = null;
//第一轮各种游戏的人数
var NUM_PER_GROUP = {
    majiang: 4,
    zhajinhua: 5,
    douniu: 5
};
//第一轮
exports.start = function($config, mgr) {
    config = $config;
    client = redis.createClient(config.REDIS_PORT, config.REDIS_IP);
    client.select(config.REDIS_DB_NUM, function(err) {
        if (err) {
            return false;
        } else {
            console.log('connect success');
            init();
        }
    });
    io = require('socket.io')(config.CLIENT_PORT);
    io.sockets.on('connection', function(socket) {
        socket.on('login', function(data) {
            data = JSON.parse(data);
            var userId = data.userid;
            if (socket.userId != null) {
                //已经登陆过的就忽略
                return;
            }
            socket.userId = userId;
            userList[userId] = socket;
            timetmp[userId] = Date.now();
            if (matchlist[userId]) {
                return;
            };
            socket.emit('signup');
            var num_per_group; //每个房间的人数
            console.log('报名比赛id', data.id);
            switch (data.type) {
                case 3: //麻将
                    num_per_group = NUM_PER_GROUP['majiang'];
                    var enterLitst = function(userId) {
                        var queue;
                        if (mjList[data.id]) {
                            if (mjList[data.id].length == 0) {
                                queue = 0;
                                mjList[data.id][queue] = {};
                                mjList[data.id][queue].player = [];
                                mjList[data.id][queue].status = false;
                            } else {
                                if (mjList[data.id][mjList[data.id].length - 1].status) {
                                    queue = mjList[data.id].length;
                                    mjList[data.id][queue] = {};
                                    mjList[data.id][queue].status = false;
                                    mjList[data.id][queue].player = [];
                                } else {
                                    queue = mjList[data.id].length - 1;
                                }
                                // if(mjList[data.id][mjList[data.id].length - 1].length >= data.enterNum){
                                //     queue = mjList[data.id].length;
                                //     mjList[data.id][queue] = [];
                                // }else{
                                //     queue = mjList[data.id].length - 1;
                                // }
                            }
                            matchlist[userId] = matchtmp[userId] = [data.id, 1, queue, data.enterNum];
                            mjList[data.id][queue].player.push(userId);
                            setRedis('matchlist', matchlist);
                            setRedis('matchtmp', matchtmp);
                            setRedis('mjList', mjList);
                            console.log('当前报名的人', mjList[data.id]);
                            console.log('已报名人数', mjList[data.id].length);
                            if (mjList[data.id][queue].player.length == data.enterNum) { //人满即开
                                if (!checkList(mjList[data.id][queue].player)) return;
                                mjList[data.id][queue].status = true;
                                match_log(mjList[data.id][queue].player, data.id);
                                var tmp = slice_list(mjList[data.id][queue].player, num_per_group);
                                for (var i in tmp) {
                                    begin_match(tmp[i], 0);
                                }
                            }
                        } else {
                            mjList[data.id] = [];
                            enterLitst(userId);
                        }
                    }
                    enterLitst(userId);
                    break;
                case 1: //炸金花
                    num_per_group = NUM_PER_GROUP['zhajinhua'];
                    var enterLitst = function(userId) {
                        var queue;
                        if (zjhList[data.id]) {
                            if (zjhList[data.id].length == 0) {
                                queue = 0;
                                zjhList[data.id][queue] = {};
                                zjhList[data.id][queue].status = false;
                                zjhList[data.id][queue].player = [];
                            } else {
                                if (zjhList[data.id][zjhList[data.id].length - 1].status) {
                                    queue = zjhList[data.id].length;
                                    zjhList[data.id][queue] = {};
                                    zjhList[data.id][queue].status = false;
                                    zjhList[data.id][queue].player = [];
                                } else {
                                    queue = zjhList[data.id].length - 1;
                                }
                            }
                            matchlist[userId] = matchtmp[userId] = [data.id, 1, queue, data.enterNum];
                            zjhList[data.id][queue].player.push(userId);
                            setRedis('matchlist', matchlist);
                            setRedis('matchtmp', matchtmp);
                            setRedis('zjhList', zjhList);
                            if (zjhList[data.id][queue].player.length == data.enterNum) { //人满即开
                                if (!checkList(zjhList[data.id][queue].player)) return;
                                zjhList[data.id][queue].status = true;
                                match_log(zjhList[data.id][queue].player, data.id);
                                var tmp = slice_list(zjhList[data.id][queue].player, num_per_group);
                                for (var i in tmp) {
                                    begin_match(tmp[i], 2);
                                }
                            }
                        } else {
                            zjhList[data.id] = [];
                            enterLitst(userId);
                        }
                    }
                    enterLitst(userId);
                    break;
                case 2: //斗牛
                    num_per_group = NUM_PER_GROUP['douniu'];
                    var enterLitst = function(userId) {
                        var queue;
                        if (dnList[data.id]) {
                            if (dnList[data.id].length == 0) {
                                queue = 0;
                                dnList[data.id][queue] = {};
                                dnList[data.id][queue].status = false;
                                dnList[data.id][queue].player = [];
                            } else {
                                if (dnList[data.id][dnList[data.id].length - 1].status) {
                                    queue = dnList[data.id].length;
                                    dnList[data.id][queue] = {};
                                    dnList[data.id][queue].status = false;
                                    dnList[data.id][queue].player = [];
                                } else {
                                    queue = dnList[data.id].length - 1;
                                }
                                // if(dnList[data.id][dnList[data.id].length - 1].length >= data.enterNum){
                                //     queue = dnList[data.id].length;
                                //     dnList[data.id][queue] = [];
                                // }else{
                                //     queue = dnList[data.id].length - 1;
                                // }
                            }
                            matchlist[userId] = matchtmp[userId] = [data.id, 1, queue, data.enterNum];
                            dnList[data.id][queue].player.push(userId);
                            setRedis('matchlist', matchlist);
                            setRedis('matchtmp', matchtmp);
                            setRedis('dnList', dnList);
                            console.log('当前报名的人', dnList[data.id]);
                            console.log('已报名人数', dnList[data.id][queue].player.length);
                            if (dnList[data.id][queue].player.length == data.enterNum) { //人满即开
                                if (!checkList(dnList[data.id][queue].player)) return;
                                dnList[data.id][queue].status = true;
                                match_log(dnList[data.id][queue].player, data.id);
                                var tmp = slice_list(dnList[data.id][queue].player, num_per_group);
                                for (var i in tmp) {
                                    begin_match(tmp[i], 3);
                                }
                            }
                        } else {
                            dnList[data.id] = [];
                            enterLitst(userId);
                        }
                    }
                    enterLitst(userId);
                    break;
                default:
                    break;
            }
        });
        socket.on('reconnect', function(data) {
            data = JSON.parse(data);
            var userId = data.userid;
            socket.userId = userId;
            userList[userId] = socket;
            timetmp[userId] = Date.now();
            db.get_room_id_of_user(userId, function(roomid){
                if(roomid) {
                    sendMsg(userId, 'create_match_finish', {roomid: roomid});
                }
            })
        })
        socket.on('game_ping', function(data) {
            var userId = socket.userId;
            if (!userId) {
                return;
            }
            timetmp[userId] = Date.now();
            socket.emit('game_pong');
        });
    });
    console.log("game server is listening on " + 9090);
};

function sendMsg(userId, event, msgdata) {
    var userInfo = userList[userId];
    if (userInfo == null) {
        return;
    }
    console.log("sendMsg=====>", userId, event, msgdata);
    var socket = userInfo;
    if (socket == null) {
        return;
    }
    socket.emit(event, msgdata);
};
exports.sendMsg = sendMsg;

function begin_match(group, type) {
    var serverMap = room_service.getServerMap();
    var game_server = null;
    for (var id in serverMap) {
        var server = serverMap[id];
        if (server.room_type == type) {
            game_server = server;
        }
    }
    // console.log(game_server);
    http.get(game_server.ip, game_server.httpPort, "/create_match_room", {
        num: group.length
    }, function(ret, data) {
        if (ret) {
            //延迟5秒进入房间，给予最后一个出线的人以反应时间，最后一个人会在4秒中的时候执行退出房间方法，所以得在4秒以后执行开始这一局游戏，不然刚开始又会退出了
            var delay = 5000;
            setTimeout(function() {
                if (data.errcode == 0) {
                    group = checkNextList(group);
                    db.set_room_id_of_user(group[i], data.roomid);
                    console.log('通知前端这些人开始比赛', group);
                    for (var i in group) {
                        sendMsg(group[i], 'create_match_finish', data);
                    }
                } else {}
            }, delay);
            // return;
        }
    });
};
//下一轮
exports.next = function(type, winner, loser) {
    console.log("next in ===>");
    console.log("比赛类型", type);
    console.log("出线的人", winner);
    console.log("淘汰的人", loser);
    console.log(type, winner, loser);
    var num_per_group;
    var ret = {
        exit_users: []
    }
    switch (type) {
        case '1':
            console.log('炸金花锦标赛进入下一轮');
            num_per_group = NUM_PER_GROUP['zhajinhua'];
            var info = matchlist[winner];
            if (!info) return ret;
            var match_id = info[0],
                queue = info[2];
            console.log('锦标赛id', match_id);
            var list = zjhList[match_id][queue].player;
            for (var i in loser) {
                removeByValue(list, loser[i]);
                removePlayer(loser[i]);
                sendMsg(loser[i], 'match_result', {
                    isWin: false
                });
            }
            setRedis('zjhList', zjhList);
            if (list.length == 1) {
                console.log('冠军是', winner);
                sendMsg(winner, 'match_over', {
                    ranking: 1
                });
                db.update_match_log(winner, 1);
                var users = {
                    first: winner,
                };
                give_award(users, match_id);
                clean_user(match_id, type, queue);
                ret.exit_users.push(winner);
                console.log('这些人需要退出房间', ret);
                return ret;
            } else {
                //推送该轮的结果消息
                sendMsg(winner, 'match_result', {
                    isWin: true
                });
                ret.exit_users.push(winner);
                var num_full = info[3] / Math.pow(num_per_group, info[1]);
                console.log('满多少人开？', num_full);
                console.log('当前多少人了？', list.length);
                if (list.length == num_full) {
                    for (var t in list) {
                        var mes = matchlist[list[t]];
                        matchlist[list[t]][1] = mes[1] + 1;
                    }
                    setRedis('matchlist', matchlist);
                    var tmp = slice_list(list, num_per_group);
                    for (var i in tmp) {
                        begin_match(tmp[i], 2);
                    }
                }
            }
            break;
        case '2':
            console.log('斗牛锦标赛进入下一轮');
            num_per_group = NUM_PER_GROUP['douniu'];
            var info = matchlist[winner];
            if (!info) return ret;
            var match_id = info[0],
                queue = info[2];
            console.log('锦标赛id', match_id);
            var list = dnList[match_id][queue].player;
            //移除被淘汰者
            for (var i in loser) {
                removeByValue(list, loser[i]);
                removePlayer(loser[i]);
                sendMsg(loser[i], 'match_result', {
                    isWin: false
                });
            }
            setRedis('dnList', dnList);
            if (list.length == 1) {
                //如果所剩下的人数只有1个，那么就是冠军
                console.log('冠军是', winner);
                sendMsg(winner, 'match_over', {
                    ranking: 1
                });
                db.update_match_log(winner, 1);
                var users = {
                    first: winner,
                };
                //发放奖励
                give_award(users, match_id);
                clean_user(match_id, type, queue);
                ret.exit_users.push(winner);
                console.log('这些人需要退出房间', ret);
                return ret;
            } else {
                sendMsg(winner, 'match_result', {
                    isWin: true
                });
                ret.exit_users.push(winner);
                var num_full = info[3] / Math.pow(num_per_group, info[1]);
                console.log('满多少人开？', num_full);
                console.log('当前多少人了？', list.length);
                if (list.length == num_full) {
                    for (var t in list) {
                        var mes = matchlist[list[t]];
                        matchlist[list[t]][1] = mes[1] + 1;
                    }
                    setRedis('matchlist', matchlist);
                    var tmp = slice_list(list, num_per_group);
                    console.log('tmp===>', tmp);
                    for (var i in tmp) {
                        begin_match(tmp[i], 3);
                    }
                }
            }
            break;
        case '3':
            console.log('麻将锦标赛进入下一轮');
            num_per_group = NUM_PER_GROUP['majiang'];
            var winner_id;
            var loser_id1, loser_id2;
            for (var i in winner) {
                winner_id = i;
            }
            loser_id1 = loser[0].userId; //第二名
            loser_id2 = loser[1].userId; //第三名
            var info = matchlist[winner_id];
            var match_id = info[0],
                queue = info[2];
            var list = mjList[match_id][queue].player;
            if (list.length == 4) {
                db.update_match_log(winner_id, 1);
                db.update_match_log(loser_id1, 2);
                db.update_match_log(loser_id2, 3);
                var users = {
                    first: winner_id,
                    second: loser_id1,
                    third: loser_id2,
                };
                give_award(users, match_id);
                //锦标赛结束，给前三名推送消息
                clean_user(match_id, type, queue);
                ret.exit_users.push(winner_id);
                ret.exit_users.push(loser_id1);
                ret.exit_users.push(loser_id2);
                return ret;
            } else {
                //推送该轮的结果消息
                sendMsg(winner_id, 'match_result', {
                    isWin: true
                });
                for (var l in loser) {
                    sendMsg(loser[l].userId, 'match_result', {
                        isWin: false
                    });
                }
            }
            for (var i in loser) {
                removeByValue(list, loser[i].userId);
                removePlayer(loser[i].userId);
            }
            setRedis('mjList', mjList);
            if (list.length == info[3] / Math.pow(num_per_group, info[1])) {
                for (var t in list) {
                    var mes = matchlist[list[t]];
                    matchlist[list[t]][1] = mes[1] + 1;
                }
                setRedis('matchlist', matchlist);
                var tmp = slice_list(list, num_per_group);
                for (var i in tmp) {
                    begin_match(tmp[i], 0);
                }
            }
            break;
        default:
            break;
    }
    console.log('ret2', ret);
    return ret;
};
//发放奖励
function give_award(users, match_id) {
    console.log('锦标赛奖励发放');
    console.log(users, match_id);
    db.get_match_by_id(match_id, function(data) {
        var feeType = data['feeType'];
        var ship_type = (feeType == 2) ? 1 : 0; //1是钻石 0是金币
        if (users['first']) {
            db.add_user_gems(users['first'], data['rewardFirst'], ship_type, function() {
                sendMsg(users['first'], 'match_over', {
                    ranking: 1
                });
            });
        };
        if (users['second']) {
            db.add_user_gems(users['second'], data['rewardSecond'], ship_type, function() {
                sendMsg(users['second'], 'match_over', {
                    ranking: 2
                });
            });
        };
        if (users['third']) {
            db.add_user_gems(users['third'], data['rewardThird'], ship_type, function() {
                sendMsg(users['third'], 'match_over', {
                    ranking: 3
                });
            });
        };
    });
}

function removePlayer(id) {
    if (matchlist[id]) delete(matchlist[id]);
    setRedis('matchlist', matchlist);
}

function clean_user(match_id, type, queue) {
    for (var i in matchtmp) {
        if (matchtmp[i][0] == match_id && matchtmp[i][2] == queue) {
            delete(matchtmp[i]);
            delete(timetmp[i]);
        }
    }
    setRedis('matchtmp', matchtmp);
    for (var i in matchlist) {
        if (matchlist[i][0] == match_id && matchlist[i][2] == queue) {
            delete(matchlist[i]);
        }
    }
    setRedis('matchlist', matchlist);
    switch (type) {
        case '1':
            zjhList[match_id][queue].player = [];
            setRedis('zjhList', zjhList);
            break;
        case '2':
            dnList[match_id][queue].player = [];
            setRedis('dnList', dnList);
            break;
        case '3':
            mjList[match_id][queue].player = [];
            setRedis('mjList', mjList);
            break;
        default:
            break;
    }
};
//退赛
exports.exit_match = function(userId) {
    var info = matchtmp[userId];
    var match_id = info[0];
    if (match_id > 0 && match_id <= 3) {
        if (zjhList[match_id][info[2]].status) return false;
        removeByValue(zjhList[match_id][info[2]].player, userId);
        setRedis('zjhList', zjhList);
    } else if (match_id >= 4 && match_id <= 6) {
        if (dnList[match_id][info[2]].status) return false;
        removeByValue(dnList[match_id][info[2]].player, userId);
        setRedis('dnList', mjList);
    } else if (match_id >= 7 && match_id <= 9) {
        if (mjList[match_id][info[2]].status) return false;
        removeByValue(mjList[match_id][info[2]].player, userId);
        setRedis('mjList', dnList);
    }
    delete(matchtmp[userId]);
    delete(matchlist[userId]);
    delete(timetmp[userId]);
    setRedis('matchlist', matchlist);
    setRedis('matchtmp', matchtmp);
    userList[userId].emit('exit_match');
    return true;
}
exports.ising = function(userId, match_id) {
    var info = matchlist[userId];
    if (!info) return ['false'];
    if (match_id > 0 && match_id <= 3) {
        if (zjhList[match_id] && zjhList[match_id][info[2]] && zjhList[match_id][info[2]].status) {
            return ['true', zjhList[match_id][info[2]].player.length];
        } else {
            return ['false'];
        };
    } else if (match_id >= 4 && match_id <= 6) {
        if (dnList[match_id] && dnList[match_id][info[2]] && dnList[match_id][info[2]].status) {
            return ['true', dnList[match_id][info[2]].player.length];
        } else {
            return ['false'];
        };
    } else if (match_id >= 7 && match_id <= 9) {
        if (mjList[match_id] && mjList[match_id][info[2]] && mjList[match_id][info[2]].status) {
            return ['true', mjList[match_id][info[2]].player.length];
        } else {
            return ['false'];
        };
    }
}

function ocount(obj) {
    var objLen = 0;
    for (var i in obj) {
        objLen++;
    }
    return objLen;
};

function get_num(t) {
    var n = 0;
    for (var i in matchlist) {
        if (matchlist[i][0] == t) n++;
    }
    return n;
};

function removeByValue(arr, val) {
    if (arr) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == val) {
                arr.splice(i, 1);
                break;
            }
        }
    }
}

function slice_list(arr, num) {
    var tmp = [];
    for (var i = 0, len = arr.length; i < len; i += num) {
        tmp.push(arr.slice(i, i + num));
    }
    return tmp;
}
//根据比赛id获得比赛报名人数 todo
exports.getNumInMatch = function(match_id) {
    var num = 0;
    if (match_id > 0 && match_id <= 3) {
        var list = zjhList[match_id];
        if (list && list[list.length - 1]) {
            if (!list[list.length - 1].status) {
                num = list[list.length - 1].player.length;
            } else {
                num = 0;
            }
        } else {
            num = 0;
        }
    } else if (match_id >= 4 && match_id <= 6) {
        var list = dnList[match_id];
        if (list && list[list.length - 1]) {
            if (!list[list.length - 1].status) {
                num = list[list.length - 1].player.length;
            } else {
                num = 0;
            }
        } else {
            num = 0
        }
    } else if (match_id >= 7 && match_id <= 9) {
        var list = mjList[match_id];
        if (list && list[list.length - 1]) {
            if (!list[list.length - 1].status) {
                num = list[list.length - 1].player.length;
            } else {
                num = 0;
            }
        } else {
            num = 0;
        }
    }
    // for (var i in matchlist) {
    //     if (matchlist[i][0] == match_id) num++;
    // }
    return num;
};
//是否已报名 todo
exports.isBaoMing = function(userId, match_id) {
    var flag = false;
    if (match_id) {
        if (matchlist[userId] && matchlist[userId][0] == match_id) {
            flag = true;
        }
    } else {
        if (matchlist[userId]) flag = true;
    }
    return flag;
};

function match_log(data, id) {
    for (var i in data) {
        db.match_log(data[i], id);
    }
};
exports.begin_match = begin_match;

function setRedis(key, value) {
    client.set(key, JSON.stringify(value), function(err, res) {});
}

function getRedis(key, cb) {
    client.get(key, function(err, res) {
        cb(JSON.parse(res));
    });
}

function init() {
    getRedis('mjList', function(data) {
        if (data) mjList = data;
    })
    getRedis('zjhList', function(data) {
        if (data) zjhList = data;
    })
    getRedis('dnList', function(data) {
        if (data) dnList = data;
    })
    getRedis('matchtmp', function(data) {
        if (data) matchtmp = data;
    })
    getRedis('matchlist', function(data) {
        if (data) matchlist = data;
    })
}

function checkList(obj) {
    var flag = true;
    for (var i in obj) {
        var userId = obj[i];
        if ((Date.now() - timetmp[userId]) > 10000) {
            console.log('checkList flag==false userId', userId);
            flag = false;
            removeByValue(obj, userId);
            delete(matchtmp[userId]);
            delete(matchlist[userId]);
            delete(userList[userId]);
            delete(timetmp[userId]);
        }
    }
    return flag;
}

function checkNextList(obj) {
    for (var i in obj) {
        var userId = obj[i];
        if ((Date.now() - timetmp[userId]) > 10000) {
            console.log('checkList flag==false userId', userId);
            removeByValue(obj, userId);
            delete(matchtmp[userId]);
            delete(matchlist[userId]);
            delete(userList[userId]);
            delete(timetmp[userId]);
        }
    }
    return obj;
}
exports.flushall = function() {
    for (var i in userList) {
        userList[i].emit('exit_match');
    }
    userList = {};
    mjList = {};
    zjhList = {};
    dnList = {};
    matchtmp = {};
    matchlist = {};
    timetmp = {};
};