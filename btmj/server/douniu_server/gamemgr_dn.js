var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var NN = require('./douNiu_utils.js');
var db = require("../utils/db");
var http_service = require('./http_service');
/****Api_begin********Api_begin********Api_begin********Api_begin********Api_begin****/
//按钮:没有牛,在由系统计算出得分,传userid
exports.INoNiu = INoNiu;
//按钮:有牛, userid,牛数组(带牌型)
exports.IHaveNiu = IHaveNiu;
//抢庄,传userid,倍数;不抢为0
exports.qiangZhuang = qiangZhuang;
//下注,传userid,倍数
exports.xiaZhu = xiaZhu;
//选庄的动画结束后由客户端激活,传userid
//这里的userid 只是启动定时器使用,无其他意义
exports.zhuangEndFromClient = zhuangEndFromClient;
exports.getUserInfoByUserid = getUserInfoByUserid;
exports.getGameInfoByUserid = getGameInfoByUserid;
/****Api_end********Api_end********Api_end********Api_end********Api_end********Api_end****/
var games = {};
var gameSeatsOfUsers = {};
exports.setReady = function(userid) {
    if (!userid) {
        console.log("sr:userid invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (roomId == null) {
        console.log("sr:roomId invalid");
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        console.log("sr:roomInfo invalid");
        return;
    }
    roomMgr.setReady(userid, true);
    var game = games[roomId];
    if (game && !roomInfo.isWaiting) {
        //若game有效,且房间不是挂起状态(roomInfo.isWaiting == flase)
        //说明玩家是中途加入,此时不需要开始新的游戏
        console.log("sr:game running");
        return;
    }
    if (game != null) {
        game = null;
    }
    if (game == null) {
        // exports.begin(roomId);
        if (roomInfo.seats.length == 5) {
            var flag = 0;
            var x = 0;
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                // console.log('userMgr.isOnline(s.userid)', userMgr.isOnline(s.userId));
                if (s.ready == true) {
                    flag++;
                }
                if (s.userId > 0 && s.robot == 0) {
                    x++;
                }
            }
            if (x == 0) {
                _kickedOffRobot(roomInfo); //如果全是机器人就解散房间
            }
            //5个人到齐了,并且都准备好了,则开始新的一局
            var enough_num = 2;
            if (roomInfo.enough_num) {
                enough_num = roomInfo.enough_num;
                if (!roomInfo.jbs_room_num) roomInfo.jbs_room_num = roomInfo.enough_num; //锦标赛时房间的原始人数
            }
            if (flag >= enough_num) {
                _readySocketInvalid(roomInfo);
                if (roomInfo["begin_timer"] == null) {
                    roomInfo["begin_timer"] = setInterval(function() {
                        userMgr.broacastInfo('count_down_push', {
                            userid: userid,
                            countDown: roomInfo.num
                        }, roomInfo);
                        if (roomInfo.num == 0) {
                            exports.begin(roomId);
                            roomInfo.num = 3;
                            roomInfo.enough_num = 2; //该房间游戏开始后，则不再有人数限制
                            clearInterval(roomInfo["begin_timer"]);
                            roomInfo["begin_timer"] = null;
                        } else {
                            roomInfo.num--;
                        }
                    }, 1000);
                };
            }
        }
    }
};
// ready踢出所有socket断开的玩家。
function _readySocketInvalid(roomInfo) {
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        var uid = s.userId;
        if (!userMgr.socketIsValid(uid) && uid > 0) {
            //socket 无效
            console.log("检测到一个socket失效", uid);
            if (roomInfo.conf.creator == 'match') {
                if (uid && roomInfo.noMoneyArr.indexOf(uid) == -1) {
                    roomInfo.noMoneyArr.push(uid); //锦标赛里失败的人数是从noMoneyArr里取的，所以，踢出的时候要把他算在noMoneyArr里
                }
            }
            //注意此时不能调用 userMgr 因为此时socket已经不存在了。 只需退出房间即可
            roomMgr.exitRoom(uid);
            userMgr.broacastInfo("exit_notify_push", uid, roomInfo);
        }
    }
}
// 全是机器人解散房间
function _kickedOffRobot(roomInfo) {
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        var uid = s.userId;
        if (uid > 0) {
            var socket = userMgr.get(uid);
            if (socket) {
                socket.disconnect();
            }
            roomMgr.exitRoom(uid);
            userMgr.broacastInfo("exit_notify_push", uid, roomInfo);
        }
    }
}
//开始新的一局
exports.begin = function(roomid) {
    var roomInfo = roomMgr.getRoom(roomid);
    if (roomInfo == null) {
        console.log("未找到房间");
        return;
    }
    if (roomInfo["begin_timer"]) {
        clearInterval(roomInfo["begin_timer"]);
        roomInfo["begin_timer"] = null;
    }
    //从db中按顺序读取userid的值,来确定座位号
    db.get_seat_info_room(roomid, function(cdata) {
        var cseats = [];
        // console.log("get_seat_info_room", cdata);
        for (var skey in cdata) {
            // console.log("get_seat_info_room:Value:", cdata[skey]);
            var c_uid = cdata[skey];
            if (c_uid > 0) {
                cseats.push(c_uid);
            }
        }
        // console.log("get_seat_info_room:Array:", cseats);
        roomInfo.users = cseats;
        // console.log("get_seat_info_room:Array:", roomInfo.users);
        _begin(roomid);
    });
}
exports.isWaitingUsers = function(roomInfo, userId) {
    if (roomInfo.waitingUsers) {
        for (var i = 0; i < roomInfo.waitingUsers.length; i++) {
            var s = roomInfo.waitingUsers[i];
            if (userId == s.userid) {
                return true;
            }
        }
        return false;
    } else {
        return false;
    }
}

function _begin(roomid) {
    console.log("开始新的一局");
    var roomInfo = roomMgr.getRoom(roomid);
    if (roomInfo == null) {
        console.log("未找到房间");
        return;
    }
    var users = roomInfo.users;
    if (!roomInfo.waitingUsers) {
        roomInfo.waitingUsers = [];
    }
    //把上局中等待的人加到本局中来
    for (var i = 0; i < roomInfo.waitingUsers.length; i++) {
        var s = roomInfo.waitingUsers[i];
        var index = s.seatIndex;
        var userid = s.userid;
        var money = s.money;
        //这一步不在需要,因为已经从数据库中重新读取了userid,若id号不对应
        //说明前后数据库操作的数据不一致.将会产生一个bug
        // roomInfo.users.splice(index, 0, userid);
        if (!roomInfo.userDatas) {
            roomInfo.userDatas = {};
        }
        roomInfo.userDatas[userid] = {};
        roomInfo.userDatas[userid].money = money;
        roomInfo.userDatas[userid].seatIndex = index;
    }
    roomInfo.waitingUsers = [];
    console.log("begin:roomInfo.users:", roomInfo.users);
    var playerNum = roomInfo.users ? roomInfo.users.length : 0;
    // console.log('ly:playerNum', playerNum);
    if (playerNum < 2) {
        //TODO 挂起房间
        roomInfo.isWaiting = true;
        return;
    } else {
        roomInfo.isWaiting = false;
    }
    var next = (roomInfo.nextUid && (roomInfo.nextUid > 0)) ? roomInfo.userDatas[roomInfo.nextUid].seatIndex : 0;
    if (next < 0) {
        next = 0;
    }
    roomInfo.nextButton = next;
    console.log("游戏正式开始,参与游戏的人数有:", playerNum);
    var game = {
        roomInfo: roomInfo,
        gameIndex: 0,
        playerNum: playerNum,
        paiArr: new Array(52),
        players: [],
        currentIndex: 0,
        turn: roomInfo.nextButton,
        baseFen: roomInfo.scene.consume_num,
        limitMoney: roomInfo.scene.limit_num, //如果玩家小于这个值踢出房间
        zhuangBeiShu: -1,
        zhuangOps: [1, 2, 3, 4],
        xiaZhuOps: [5, 10, 15, 20, 25],
        specialBeiShu: {
            "n_7": 2,
            "n_8": 2,
            "n_9": 2,
            "n_n": 3,
            "bomb": 4,
            "wuHua": 5,
            "wuXiao": 6
        },
        timer: null,
        //4种状态:"qz"抢庄;"xz"下注;"sn"算牛;"end"结束
        status: "qz",
        opsRenShu: 0,
        zhuangUserid: null,
        consume_type: roomInfo.scene.consume_type,
    }
    games[roomid] = game;
    for (var i = 0; i < game.playerNum; ++i) {
        var data = game.players[i] = {};
        data.userid = users[i];
        data.seatIndex = i;
        data.money = roomInfo.userDatas[data.userid].money;
        data.isZhuang = false;
        //持有的牌
        data.holds = [];
        data.zhuangBeiShu = -1;
        data.xiaZhuBeiShu = -1;
        data.maxXiaZhuBeiShu = -1;
        var qiangZhuangArr = [];
        var maxQiangZhuangBeiShu = parseInt(data.money / (game.baseFen * game.xiaZhuOps[0]));
        // for (var k = 0; k < game.zhuangOps.length; k++) {
        //     if (baseZhuangFen >= game.zhuangOps[k]) {
        //         qiangZhuangArr.push(game.zhuangOps[k]);
        //     };
        // }
        data.maxQiangZhuangBeiShu = maxQiangZhuangBeiShu;
        data.isNeedTips = true;
        data.extraBeiShu = -1;
        data.desc = null;
        //两种状态,win or lose
        data.status = null;
        //持有的分数
        //依据牌算出得分。
        //得分最高的获胜.
        data.score = null;
        gameSeatsOfUsers[data.userid] = data;
    }
    //检查房间是否有效
    var roomValidFlag = checkRoomValid(game);
    if (!roomValidFlag) {
        console.log("checkRoomValid:", roomValidFlag);
        return;
    };
    _deduct_money(game);
    //房间等待状态置为false
    roomInfo.isWaiting = false;
    var gameInfoFilter = {};
    for (var key in game) {
        if (key == "roomInfo") {
            continue;
        }
        gameInfoFilter[key] = game[key];
    }
    // console.log("gameInfoFilter", gameInfoFilter);
    //通知玩家一些信息
    var _initInfo = {
        "gameInfo": gameInfoFilter
    };
    // "baseFen": game.baseFen,
    _broacast(game, "game_initInfo_push", _initInfo);
    //洗牌
    shuffle(game);
    //发牌
    deal(game);
    // console.log("gameBegin:", game.players);
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        _userSend("game_begin_push", sd.userid, sd);
    }
    qiangZhuangBegin(game);
}
//扣除桌子钱
function _deduct_money(game) {
    var base = game.baseFen;
    // console.log("ly:_deduct_money", base);
    for (var i = 0; i < game.players.length; i++) {
        var dd = game.players[i];
        dd.money -= base;
        // console.log("ly:_deduct_money:user", dd.userid, dd.money);
        _db_cost_money(dd.userid, base);
    }
}

function checkRoomValid(game) {
    var roomInfo = game.roomInfo;
    if (roomInfo && roomInfo.isWaiting) {
        return false;
    }
    return true;
}
//洗牌
function shuffle(game) {
    game.paiArr = [];
    var paiArr = game.paiArr;
    for (var i = 0; i < 13; i++) {
        var hei = i;
        var hong = i + 100;
        var mei = i + 200;
        var fang = i + 300;
        paiArr.push(hei);
        paiArr.push(hong);
        paiArr.push(mei);
        paiArr.push(fang);
    }
    for (var i = 0; i < paiArr.length; i++) {
        var lastIndex = paiArr.length - i - 1;
        var randIndex = Math.floor(Math.random() * lastIndex);
        var t = paiArr[randIndex];
        paiArr[randIndex] = paiArr[lastIndex];
        paiArr[lastIndex] = t;
    }
}
//发牌
function deal(game, count) {
    game.currentIndex = 0;
    var index = game.turn;
    count = count ? count : 4;
    for (var i = 0; i < game.playerNum * count; i++) {
        var ch = game.players[index].holds;
        if (ch == null) {
            ch = [];
            game.players[index].holds = ch;
        }
        mopai(game, index);
        index++;
        index %= game.playerNum;
    }
}
// 摸牌
function mopai(game, index) {
    if (game.currentIndex == game.paiArr.length) {
        return -1;
    }
    var seatData = game.players[index];
    var ch = seatData.holds;
    var pai = game.paiArr[game.currentIndex];
    ch.push(pai);
    game.currentIndex++;
    return pai;
}

function _gameByUserid(userid) {
    //game不存在返回null
    var roomid = roomMgr.getUserRoom(userid);
    if (!roomid) {
        return null;
    }
    var game = games[roomid];
    if (!game) {
        return null;
    }
    return game;
}

function _userByUserid(userid) {
    return gameSeatsOfUsers[userid];
}

function qiangZhuangBegin(game) {
    //第一轮发牌结束通知所有玩家抢庄
    game.status = "qz";
    _broacast(game, "game_qiangZhuang_push", game.zhuangOps);
    initCounter(game);
}

function qiangZhuang(userid, beiShu) {
    if (!userid) {
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("qz:user is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("qz:game is invalid");
        return;
    }
    game.opsRenShu++;
    sd.qiangZhuangBeiShu = beiShu;
    _userSend("game_myQzEnd_push", userid, beiShu);
    var b_d = {
        userid: userid,
        beiShu: beiShu
    };
    _broacast(game, "game_b_OneQzEnd", b_d, userid, false);
    _userSend("game_qzGuo_push", userid);
    if (beiShu > game.zhuangBeiShu) {
        game.zhuangBeiShu = beiShu;
    }
    if (game.opsRenShu == game.players.length) {
        qiangZhuangEnd(game);
    }
}
//抢庄倒计时结束
function qiangZhuangEnd(game) {
    //将没有抢庄(值为-1,表示没有操作),置为默认值
    if (game.opsRenShu < game.players.length) {
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            if (sd.qiangZhuangBeiShu < 0) {
                sd.qiangZhuangBeiShu = 0;
                _userSend("game_qzGuo_push", sd.userid);
                var b_d = {
                    userid: sd.userid,
                    beiShu: sd.qiangZhuangBeiShu
                };
                _broacast(game, "game_b_OneQzEnd", b_d, sd.userid, false);
            }
        }
    }
    deleteSetTimeOut(game);
    var maxZhuangs = [];
    if (game.zhuangBeiShu <= 0) {
        game.zhuangBeiShu = 1;
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            maxZhuangs.push(sd);
        }
    } else {
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            if (sd.qiangZhuangBeiShu == game.zhuangBeiShu) {
                maxZhuangs.push(sd);
            }
        }
    }
    var zhuangIndex = Math.floor(Math.random() * maxZhuangs.length);
    var zhuangSD = maxZhuangs[zhuangIndex];
    zhuangSD.qiangZhuangBeiShu = game.zhuangBeiShu;
    zhuangSD.isZhuang = true;
    game.zhuangUserid = zhuangSD.userid;
    //选定庄了。通知所有玩家
    _broacast(game, "game_zhuangSelected_push", game.zhuangUserid, game.zhuangUserid, true);
    //取出抢庄倍数最大的玩家作为庄主.
    //删除定时器
    game.status = "xz";
    //如果想从客户端激活。注释此段代码。否则500 毫秒之后,服务器选择一个有效玩家激活
    _deferredExcute(0.5, function() {
        var userid = _userFromGame(game);
        zhuangEndFromClient(userid);
    });
}

function _deferredExcute(second, callback) {
    //延时操作
    callback = callback ? callback : function() {
        console.log("deferred but no callback")
    };
    second = second == null ? 1 : second;
    var tt = setTimeout(function() {
        clearTimeout(tt);
        callback();
    }, second * 1000);
}

function lastPai(userid) {
    //抢庄结束后,开始发最后一张牌
    if (!userid) {
        console.log("lp: userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("lp:game is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("lp: user is invalid");
        return;
    }
    if (sd.holds.length != 4) {
        console.log("lp:不满足摸最后一张牌的条件");
        return;
    }
    mopai(game, sd.seatIndex);
    _userSend("game_myHoldsUpdate_push", userid, sd.holds)
}
//选庄的动画结束后由客户端激活
//这里的userid 只是启动定时器使用,无其他意义
function zhuangEndFromClient(userid) {
    if (!userid) {
        console.log("zefc:userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("zefc:game is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("zefc:sd is invalid");
        return;
    }
    if (game.timer) {
        //定时器已经启动,无需再启动
        console.log("zefc:定时器已经启动了");
        return;
    }
    xiaZhuBegin(game);
}

function xiaZhuBegin(game) {
    //通知非庄家的人开始下注
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.userid != game.zhuangUserid) {
            var b_f = game.baseFen * game.zhuangBeiShu;
            var maxXiaZhuBeiShu = Math.floor(sd.money / b_f);
            sd.maxXiaZhuBeiShu = maxXiaZhuBeiShu;
            var dict = {
                maxXiaZhuBeiShu: maxXiaZhuBeiShu,
                xiaZhuOps: game.xiaZhuOps
            };
            _userSend("game_myXzBegin_push", sd.userid, dict);
        }
    }
    initCounter(game);
}

function xiaZhu(userid, beiShu) {
    if (!userid || !beiShu) {
        console.log("xz:userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("xz:game is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("xz:user is invalid");
        return;
    }
    if (beiShu > sd.maxXiaZhuBeiShu) {
        //钱不够
        console.log("xz:钱不够");
        return;
    }
    sd.xiaZhuBeiShu = beiShu;
    // _userSend("game_myXzEnd_push", userid, beiShu);
    _userSend("game_xzGuo_push", sd.userid);
    var b_d = {
        userid: sd.userid,
        beiShu: sd.xiaZhuBeiShu
    };
    _broacast(game, "game_b_OneXzEnd", b_d, sd.userid, true);
    game.opsRenShu++;
    if (game.opsRenShu == (game.players.length - 1)) {
        xiaZhuEnd(game);
    }
}
//下注倒计时结束
function xiaZhuEnd(game) {
    if (game.opsRenShu < (game.players.length - 1)) {
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            if (sd.xiaZhuBeiShu < 0 && !sd.isZhuang) {
                //庄家不需要选择倍数
                var op0 = game.xiaZhuOps[0];
                var beiShu = sd.maxXiaZhuBeiShu > op0 ? op0 : sd.maxXiaZhuBeiShu;
                sd.xiaZhuBeiShu = beiShu;
                _userSend("game_myXzEnd_push", sd.userid, beiShu);
                _userSend("game_xzGuo_push", sd.userid);
                var b_d = {
                    userid: sd.userid,
                    beiShu: sd.xiaZhuBeiShu
                };
                _broacast(game, "game_b_OneXzEnd", b_d, sd.userid, false);
            }
        }
    }
    //将没有下注的玩家置为默认倍数
    //删除定时器
    deleteSetTimeOut(game);
    game.status = "sn";
    //摸最后一张牌
    for (var i = 0; i < game.players.length; i++) {
        var td = game.players[i];
        if (td.holds.length == 4) {
            lastPai(td.userid);
        }
    }
    //此时下注结束
    //是否需要提示玩家
    //调用算牛定时器
    suanNiuBegin(game);
}
//获取提示信息
function _tipUserScore(userid) {
    if (!userid) {
        console.log("tus:userid is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("tus: user is invalid");
        return;
    }
    score = NN.n_caculateScore(sd.holds);
    _userSend("game_sn_myTips_push", userid, score);
}

function suanNiuBegin(game) {
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.isNeedTips) {
            _tipUserScore(sd.userid);
        }
    }
    initCounter(game);
}

function IHaveNiu(userid, niuArr, noNeedCount) {
    console.log("IHaveNiu:1111");
    //有牛,按照玩家选择的牛重新算分
    if (!userid) {
        console.log("ihn:userid is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("ihn: user is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("ihn:game is invalid");
        return;
    }
    var score = NN.n_pointedNiu(sd.holds, niuArr);
    sd.score = score;
    if (!noNeedCount) {
        suanNiu(userid);
    }
    console.log("IHaveNiu2222:", game.roomInfo.id, sd.userid, sd.holds, sd.score);
    // _userSend("game_mySnEnd_push", userid, sd.score);
    _userSend("game_SnGuo_push", userid);
    _broacast(game, "game_b_OneSnEnd", userid, userid, true);
}

function INoNiu(userid, noNeedCount) {
    console.log("INoNiu:1111");
    //没有牛,在由系统计算出得分
    if (!userid) {
        console.log("inn:userid is invalid");
        return;
    }
    var sd = _userByUserid(userid);
    if (!sd) {
        console.log("inn: user is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("inn:game is invalid");
        return;
    }
    sd.score = NN.n_caculateScore(sd.holds);
    console.log("INoNiu2222:", game.roomInfo.id, sd.userid, sd.holds, sd.score);
    // _userSend("game_mySnEnd_push", userid, sd.score);
    _userSend("game_SnGuo_push", userid);
    _broacast(game, "game_b_OneSnEnd", userid, userid, true);
    if (!noNeedCount) {
        suanNiu(userid);
    }
}

function suanNiu(userid) {
    if (!userid) {
        console.log("sn:userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    var sd = _userByUserid(userid);
    if (!game || !sd) {
        console.log("sn: game or user is invalid");
        return;
    }
    game.opsRenShu++;
    if (game.opsRenShu == game.players.length) {
        suanNiuEnd(game);
    }
}
//算牛定时器结束
function suanNiuEnd(game) {
    //若玩家没有选择,则由系统计算出选择
    if (game.opsRenShu < game.players.length) {
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            if (!sd.score) {
                var score = NN.n_caculateScore(sd.holds);
                sd.score = score;
                console.log("suanNiuEnd2222:", game.roomInfo.id, sd.userid, sd.holds, sd.score);
                // _userSend("game_mySnEnd_push", userid, sd.score);
                _userSend("game_SnGuo_push", sd.userid);
                _broacast(game, "game_b_OneSnEnd", sd.userid, sd.userid, true);
            }
        }
    }
    deleteSetTimeOut(game);
    //删除定时器
    game.status = "end";
    //结算
    _gameAccount(game);
}
//结算
function _gameAccount(game) {
    //玩家与庄家进行比牌。
    //将最后的结果形成一个对象
    //目的是:庄家先把赢的钱收回,再把钱给赢的玩家
    //若庄家的钱不足。逆时针,靠近庄家的人优先获得金额
    //结算完成后,gameOver,将所有玩家的牌展示
    var moneyFlow = [];
    var zhuangSD = _userByUserid(game.zhuangUserid);
    var zhuangScore = zhuangSD.score;
    _extraBeiShu(game, zhuangSD);
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.userid != zhuangSD.userid) {
            _extraBeiShu(game, sd);
            var dict = uuAccount(game, zhuangSD, sd);
            moneyFlow.push(dict);
        }
    }
    //先把钱流向庄家
    var flowToZhuang = [];
    for (var i = 0; i < moneyFlow.length; i++) {
        var flow = moneyFlow[i];
        if (flow.to == zhuangSD.userid) {
            flowToZhuang.push(flow);
        }
    }
    moneyFlowToWin(flowToZhuang);
    //完成流向庄的操作后,再完成流向闲家的操作
    var flowToXian = [];
    for (var i = 0; i < moneyFlow.length; i++) {
        var flow = moneyFlow[i];
        if (flow.from == zhuangSD.userid) {
            flowToXian.push(flow);
        }
    }
    moneyFlowToWin(flowToXian);
    //取两个数组的并集
    var result = flowToZhuang.concat(flowToXian);
    console.log("游戏结果:", result);
    var sendData = {
        "players": game.players,
        "moneyFlows": result
    }
    //玩家展示有的牌
    _broacast(game, "game_showAllUser_push", sendData);
    // console.log("gameShowAll:", game.players);
    gameOver(game);
}

function moneyFlowToWin(flows) {
    for (var i = 0; i < flows.length; i++) {
        var dict = flows[i];
        var money = dict.money;
        var fromSD = _userByUserid(dict.from);
        if (money >= fromSD.money) {
            money = fromSD.money;
        }
        var toSD = _userByUserid(dict.to);
        toSD.money += money;
        fromSD.money -= money;
        dict.money = money;
        //数据库操作
        _db_cost_money(dict.from, money);
        _db_win_money(dict.to, money);
    }
}

function uuAccount(game, zhuang, xian) {
    var compareResult = NN.compareHolds(zhuang.score, xian.score);
    var totalMoney = 0;
    var beiShu = 1;
    var fromUserid = null;
    var toUserid = null;
    if (compareResult == 0) {
        //"庄赢"
        beiShu = game.zhuangBeiShu * xian.xiaZhuBeiShu * zhuang.extraBeiShu;
        zhuang.status = "win";
        xian.status = "lose";
        fromUserid = xian.userid;
        toUserid = zhuang.userid;
    } else {
        //闲赢
        beiShu = game.zhuangBeiShu * xian.xiaZhuBeiShu * xian.extraBeiShu;
        zhuang.status = "lose";
        xian.status = "win";
        fromUserid = zhuang.userid;
        toUserid = xian.userid;
    }
    totalMoney = beiShu * game.baseFen;
    var dict = {
        from: fromUserid,
        to: toUserid,
        money: totalMoney
    }
    return dict;
}

function _extraBeiShu(game, sd) {
    var extraDict = game.specialBeiShu;
    // if (!sd.score) 
    // {
    //     sd.score = NN.n_caculateScore(sd.holds);
    // }
    // 
    if (!sd || !sd.score || sd.score.length != 4) {
        console.log("ly:报错了:_extraBeiShu:", game.roomInfo, game, sd);
    }
    var score = sd.score;
    var mark = score[3];
    var beiShu = 1;
    switch (mark) {
        case "1":
            {
                var maxPai = score[1][0];
                var paiString = NN.logSinglePai(maxPai);
                sd.desc = "散牌:最大单:" + paiString;
            }
            break;
        case "4":
            {
                //单牛   
                var fen = score[0];
                if (fen <= 9 && fen >= 7) {
                    beiShu = extraDict["n_9"];
                }
                sd.desc = "牛:" + score[0];
            }
            break;
        case "5":
            {
                //牛牛
                beiShu = extraDict["n_n"];
                sd.desc = "牛牛";
            }
            break;
        case "6":
            {
                //炸弹
                beiShu = extraDict["bomb"];
                sd.desc = "炸弹";
            }
            break;
        case "7":
            {
                //五花
                beiShu = extraDict["wuHua"];
                sd.desc = "五花";
            }
            break;
        case "8":
            {
                //五小
                beiShu = extraDict["wuXiao"];
                sd.desc = "五小";
            }
            break;
    }
    sd.extraBeiShu = beiShu;
}

function gameOver(game) {
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd) {
            console.log("ly:gameOver:sd:", sd.userid, sd);
        }
    }
    console.log("ly:gameOver:game:", game);
    //游戏结束
    _broacast(game, "game_over");
    _checkExitedUsers(game);
    //一些额外的操作
    //1)检查在座的是否有钱
    _checkMoneyIsEnough(game);
    //2)将房间挂起   
    _setRoomIsWaiting(game);
    _checkJbsNextTurn(game);
    //3)修改roomInfo的金钱
    _setRoomInfo(game);
    //....)ready 为false game = null
    _setGameConfig(game);
}

function _checkJbsNextTurn(game) {
    //检测锦标赛是否可以进下一轮
    var roomInfo = game.roomInfo;
    var jbs_room_num = roomInfo.jbs_room_num;
    var exit_num = roomInfo.noMoneyArr.length;
    var left_num = jbs_room_num - exit_num;
    console.log('jbs_room_num', jbs_room_num);
    console.log('exit_num', exit_num);
    console.log('left_num', left_num);
    if (left_num == 1 && roomInfo.conf.creator == 'match') {
        //如果房间里只剩下一个人，并且是锦标赛房间的话，则进入下一轮
        setTimeout(function() {
            _next_turn_match(roomInfo);
        }, 4000); //等客户端动画放完
    }
}

function _checkExitedUsers(game) {
    var roomInfo = game.roomInfo;
    for (var i = game.players.length - 1; i >= 0; i--) {
        var ddd = game.players[i];
        if (!ddd) {
            continue;
        }
        var uid = ddd.userid;
        //检测用户的socket 是否有效
        //若无效则踢出游戏
        if (!userMgr.socketIsValid(uid)) {
            console.log("检测到一个socket失效", uid);
            if (roomInfo.conf.creator == 'match') {
                if (uid && roomInfo.noMoneyArr.indexOf(uid) == -1) {
                    roomInfo.noMoneyArr.push(uid); //锦标赛里失败的人数是从noMoneyArr里取的，所以，踢出的时候要把他算在noMoneyArr里
                }
            }
            //socket 无效
            // userMgr.exitRoom(uid);
            roomMgr.exitRoom(uid);
            // _broacast(game, 'exit_notify_push', uid, uid, false);
        }
    }
}

function _setRoomInfo(game) {
    if (!game) {
        return;
    }
    var roomInfo = game.roomInfo;
    if (!roomInfo) {
        return;
    }
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd) {
            roomInfo.userDatas[sd.userid].money = sd.money;
        }
    }
}

function _setGameConfig(game) {
    if (!game) {
        return;
    }
    var roomInfo = game.roomInfo;
    if (!roomInfo) {
        game = null;
        return;
    }
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        if (s) {
            s.ready = false;
        }
    }
    game = null;
}

function _checkMoneyIsEnough(game) {
    var roomInfo = game.roomInfo;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        console.log('sd.money', sd.money);
        console.log('limitMoney', game.limitMoney);
        if (sd.money < game.limitMoney) {
            //钱不够底分了
            if (sd.userid && roomInfo.noMoneyArr.indexOf(sd.userid) == -1) {
                roomInfo.noMoneyArr.push(sd.userid);
            }
            //两秒后退出房间
            console.log('_secondsExit');
            if (roomInfo.conf.creator == 'match') {
                var actionData = {
                    delay: 4,
                    msg: '该轮比赛结束，您已被淘汰!'
                }
                _secondsExit(sd.userid, 4, actionData, function() {
                    // _next_turn_match(roomInfo);
                });
            } else {
                _secondsExit(sd.userid, 4, null, function() {});
            }
        }
    }
}

function _secondsExit(userid, seconds, actionData, callback) {
    var tt = setTimeout(function() {
        clearTimeout(tt);
        userMgr.exitRoom(userid, actionData);
        if (callback) {
            callback();
        }
    }, seconds * 1000);
}

function _next_turn_match(roomInfo) {
    if (roomInfo.conf.creator == 'match') {
        var winer;
        for (var i in roomInfo.seats) {
            var userId = roomInfo.seats[i].userId;
            if (userId > 0 && roomInfo.noMoneyArr.indexOf(userId) == -1) winer = roomInfo.seats[i].userId;
        }
        var sendData = {
            winer: JSON.stringify(winer),
            loser: JSON.stringify(roomInfo.noMoneyArr),
            type: '2'
        };
        console.log('发送next_trun_match请求，参数为', sendData);
        http_service.sendToHall("/next_trun_match", sendData, function(ret, data) {
            console.log('next_trun_match callback', data);
            if (data && data.exit_users) {
                for (var i in data.exit_users) {
                    _secondsExit(data.exit_users[i], 4); //4秒钟后退出
                }
            }
        });
    }
}

function _setRoomIsWaiting(game) {
    var roomInfo = game.roomInfo;
    roomInfo.isWaiting = true;
}
//从game中获取有效的user_id 如果没有 返回 null
function _userFromGame(game) {
    if (!game) {
        console.log("game null");
        return null;
    }
    for (var i = 0; i < game.players.length; i++) {
        var dd = game.players[i];
        if (dd) {
            var roomId = roomMgr.getUserRoom(dd.userid);
            if (roomId) {
                return dd.userid;
            }
        }
    }
    return null;
}
//消息发送
//string 消息字符串
//data 包含的数据
//flag 是否包含自己,只有当第3个参数有效,该参数才是有效的
function _broacast(game, string, data, userid, flag) {
    var roomId = null;
    if (userid) {
        roomId = roomMgr.getUserRoom(userid);
    }
    if (!roomId) {
        //如果可以依据当前的userid 找到roomId
        //则视为userid 有效,否则视为无效
        //此时roomId非法=>userid非法,flag强制为true
        userid = _userFromGame(game);
        flag = true;
    }
    if (userid == null) {
        //找不到有效的信息return;
        //表示该房间没有活着的用户,无需再广播消息
        console.log("没有活着的用户");
        return;
    }
    console.log("_broacast====",string);
    userMgr.broacastInRoom(string, data, userid, flag);
    // userMgr.broacastInfo(string, data, game.roomInfo);
}

function _userSend(eventStr, userid, data) {
    if (!userid) {
        return;
    }
    // console.log(eventStr);
    userMgr.sendMsg(userid, eventStr, data);
}
//用户敏感消息过滤
function userInfo_filter(dd) {
    var tt = deepCopy(dd);
    delete tt.holds;
    delete tt.score;
    delete tt.game;
    return tt;
}
//********定时器*********
//1表示过
function initCounter(game) {
    deleteSetTimeOut(game);
    game.opsRenShu = 0;
    var counter = 10;
    switch (game.status) {
        case "qz":
            counter = 5;
            break;
        case "xz":
            counter = 5;
            break;
        default:
            counter = 10;
            break;
    }
    countDown(game, counter);
}

function countDown(game, counter) {
    // console.log("开始计数");
    game.timer = setInterval(function() {
        counter--;
        // console.log("定时器正在运行", counter);
        counter = counter < 0 ? 0 : counter;
        if (counter == 0) {
            if (game.status == "qz") {
                //抢庄
                qiangZhuangEnd(game);
            } else if (game.status == "xz") {
                //下注
                xiaZhuEnd(game);
            } else if (game.status == "sn") {
                suanNiuEnd(game);
            } else {
                deleteSetTimeOut(game);
            }
        }
    }, 1000);
}
var deleteSetTimeOut = function(game) {
    if (game.timer != null) {
        clearInterval(game.timer);
        // clearTimeout(timeCounter);
        game.timer = null;
    }
}
/*****断线重连 api ********/
function _userFromGameByID(game, userid) {
    if (!game || !userid) {
        return null;
    }
    for (var i = 0; i < game.players.length; i++) {
        var dd = game.players[i];
        if (dd.userid == userid) {
            return dd;
        }
    }
    return null;
}
//使用userid获取用户的信息,主要用于断线重连
function getUserInfoByUserid(userid) {
    if (!userid) {
        console.log("_getUserInfoByUserid: userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("_getUserInfoByUserid: game is invalid");
        return;
    }
    var data = _userFromGameByID(game, userid);
    _userSend('game_userInfoById_push', userid, data);
}
//使用userid获取当前游戏的信息,主要用于断线重连
function getGameInfoByUserid(userid) {
    if (!userid) {
        console.log("getGameInfo: userid is invalid");
        return;
    }
    var game = _gameByUserid(userid);
    if (!game) {
        console.log("getGameInfo: game is invalid");
        return;
    }
    var infos = _gameLightCopy(game);
    _userSend('game_gameInfoById_push', userid, infos);
}

function _gameLightCopy(game) {
    if (!game) {
        return null;
    }
    var infos = {};
    infos.players = [];
    for (var i = 0; i < game.players.length; i++) {
        var dd = game.players[i];
        if (dd) {
            infos.players.push(dd);
        }
    }
    infos.gameIndex = game.gameIndex;
    infos.paiArr = null;
    infos.currentIndex = game.currentIndex;
    infos.turn = game.turn;
    infos.baseFen = game.baseFen;
    infos.zhuangBeiShu = game.zhuangBeiShu;
    infos.zhuangOps = game.zhuangOps;
    infos.xiaZhuOps = game.xiaZhuOps;
    infos.specialBeiShu = game.specialBeiShu;
    infos.timer = null;
    infos.status = game.status;
    infos.opsRenShu = game.opsRenShu;
    infos.zhuangUserid = game.zhuangUserid;
    infos.consume_type = game.consume_type;
    return infos;
}
/*一些辅助的方法*/
function deepCopy(source) {
    var result = {};
    for (var key in source) {
        if (key == "game") {
            result[key] = null;
            continue;
        };
        result[key] = typeof source[key] === 'object' ? deepCopy(source[key]) : source[key];
    }
    return result;
}
/**数据库操作**数据库操作**数据库操作**数据库操作**数据库操作***数据库操作*************************/
//花掉的钱
function _db_cost_money(userid, money) {
    if (!money || !userid) {
        return;
    }
    // money = Math.round(money);
    var sd = gameSeatsOfUsers[userid];
    if (sd) {
        if (!sd.costArr) {
            sd.costArr = [];
        }
        sd.costArr.push(money);
    }
    _db_money_op(userid, money);
}
//赢取的钱
function _db_win_money(userid, money) {
    if (!money || !userid) {
        return;
    }
    // money = Math.round(money);
    money *= -1;
    _db_money_op(userid, money);
}

function _db_money_op(userid, money) {
    // db.cost_gems(userid, money);
    var game = _gameByUserid(userid);
    if (game.consume_type == 'score') return;
    var type = 0;
    if (game && game.consume_type) {
        type = game.consume_type;
    }
    db.cost_gems_or_coins(userid, money, type, function(o) {
        if (o) {
            use_money_logs(userid, money, type, 'dn');
        }
    });
}
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}