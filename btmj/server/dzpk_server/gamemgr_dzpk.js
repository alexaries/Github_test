var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var DZ = require('./deZhouPuKe.js');
var db = require("../utils/db");
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
                _readySocketInvalid(roomInfo);
                var flag = 0;
                var x = 0;
                for (var i = 0; i < roomInfo.seats.length; ++i) {
                    var s = roomInfo.seats[i];
                    // console.log('userMgr.isOnline(s.userid)', userMgr.isOnline(s.userId));
                    if (s.ready == true) {
                        flag++;
                    }
                    if (s.userId > 0 && s.robot == 0) {
                        console.log("---------dddd");
                        x++;
                    }
                }
                console.log("======",roomInfo.seats)
                if (x == 0) {
                    _kickedOffRobot(roomInfo); //如果全是机器人就解散房间
                }
                //5个人到齐了,并且都准备好了,则开始新的一局
                if (flag >= 2) {
                    if (roomInfo["begin_timer"] == null) {
                        roomInfo["begin_timer"] = setInterval(function() {
                            userMgr.broacastInRoom('count_down_push', {
                                userid: userid,
                                countDown: roomInfo.num
                            }, userid, true);
                            if (roomInfo.num == 0) {
                                roomInfo.isWaiting = false;
                                exports.begin(roomId);
                                roomInfo.num = 3;
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
    }
    // ready踢出所有socket断开的玩家。
function _readySocketInvalid(roomInfo) {
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        var uid = s.userId;
        if (!userMgr.socketIsValid(uid) && uid > 0) {
            //socket 无效
            //注意此时不能调用 userMgr 因为此时socket已经不存在了。 只需退出房间即可
            roomMgr.exitRoom(uid);
            userMgr.broacastInfo("exit_notify_push", uid, roomInfo);
        }
    }
}
// ready踢出所有socket断开的玩家。
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
    //开始新的一局
function _begin(roomid) {
    var baseMoney = 100; // 此处数据无效，所有game信息都会在_gameInfoFromRoom方法中初始化
    var game = {
        roomid: roomid,
        gameIndex: 0,
        playerNum: 2,
        seatNum: 5,
        paiArr: new Array(52),
        seats: [],
        players: [],
        turn: 0, //初始化时大盲注的座位号;第二轮开始对应小盲注的座位号
        gcCircle: 0, //当前的轮数
        maxCircle: 10000, //最大轮数 , 目前无效
        pubHolds: [], //公共的牌组,在洗牌完成的时候就已确定
        circleHolds: [], //每轮发送给玩家的牌
        gcPool: 0, //当前现金池
        diChi: 0, //底池
        pools: [], //数组:对应每轮的现金池
        Bb: "", //大盲注
        Sb: "", //小盲注
        Db: "", //庄
        gcZhu: 0, //gameCurrentZhu
        gcMaxZhu: baseMoney * 2000000, //玩家可以加注的最大钱
        pzNum: 0, //平注的人数,只有当平注的人数达到活着的人数才会发牌
        plNum: 0, //正在游戏的人数,和pzNum组合使用,判断是否下一轮发牌是否开始 
        allInNum: 0, //AllIn的人数，用来判断是否连续发牌,和plNum组合使用判断游戏是否结束
        baseMoney: baseMoney, //底分,指小盲注的钱
        limitMoney: baseMoney,
        addOptions: [baseMoney * 10, baseMoney * 20, baseMoney * 50, baseMoney * 100, baseMoney * 200],
        ranks: [], //长度为2的二维数组,第一个数组是第一名的所有人选,第二个是第二名数组
        consume_type: 0, //房间类型
        opsNum: 0,
        timer: null, //定时器
        timer_Counter: 0, // 定时器剩余的秒数(目的是断线重连后方便前端显示)
        counter1: 30, //玩家正常的倒计时
        counter2: 5, //玩家主动退出房间的倒计时
        canNextCircle: false,
        gcBianChiArr: [{
            //A主池,所有玩家都加入
            name: "A",
            users: [],
            money: 0
        }, {
            //B池,除上一轮allIn的所有人
            name: "B",
            users: [],
            money: 0
        }, {
            //C池
            name: "C",
            users: [],
            money: 0
        }, {
            //D池
            name: "D",
            users: [],
            money: 0
        }, {
            //E池
            name: "E",
            users: [],
            money: 0
        }],
    }
    games[roomid] = game;
    var roomInfo = _roomInfo(game);
    if (!roomInfo) {
        consol.log("Error:roomInfo null");
        return;
    }
    _gameInfoFromRoom(game, roomInfo);
    if (roomInfo.isWaiting) {
        console.log("房间挂起了");
        return;
    }
    for (var i = 0; i < game.playerNum; ++i) {
        var data = game.players[i] = {};
        data.roomid = roomid;
        data.userid = roomInfo.users[i]; //用户id
        //座位标号,游戏内部维护的属性,客户端禁止使用
        data.seatIndex = i;
        //持有的牌
        data.holds = [];
        data.money = roomInfo.userDatas[data.userid].money;
        data.keepStatus = null; //字符串 3种格式: "ROG"(让or弃);"ARG"(自动让牌(跟XX，全下));"GAZ"(跟任何注); 
        data.canOps = false;
        data.canAdd = false;
        data.canGen = false;
        data.canGuo = false;
        data.canQuit = true;
        data.isD = false;
        data.addMaxMoney = 0; //最大加注
        data.addMinMoney = 0; //最小加注 
        data.GenMoney = 0;
        data.currentGameCzhu = 0;
        //花出去的钱
        data.cost = 0;
        //当前下注的钱
        data.cZhu = 0;
        //持有的分数
        //依据牌算出得分。
        //得分最高的获胜.
        data.score = "0";
        //玩家在第几轮AllIn,便于计算金额
        data.allInCircle = 0;
        data.bid = ""; //身份状态 "Bb":大盲注 "Sb":小盲注 "":没有身份
        //只有在"playing" 状态下的玩家才有话语权
        data.status = "playing"; //4种状态, playing,quited,losed,AllIn
        data.isPlaying = true;
        data.hadOpsFlag = false; //玩家在本轮中是否已经操作过了
        data.isExitRoom = false; //是否退出房间
        gameSeatsOfUsers[data.userid] = data;
    }
    for (var i = 0; i < game.seatNum; i++) {
        var seat = game.seats[i] = {};
        seat.info = null;
        for (var k = 0; k < game.players.length; k++) {
            var player = game.players[k];
            if (player.seatIndex == i) {
                seat.info = player;
                break;
            }
        }
    }
    if (!_gameCanBeigin(game)) {
        console.log("游戏参数非法,无法开始");
        return;
    }
    if (!_selectBbAndSb(game)) {
        console.log("Error,无法确定大小盲注");
        return;
    };
    //扣除房间的钱
    _deduct_money(game);
    _xiaZhuBeforeShuffle(game);
    _gameBegin(game);
    //洗牌
    shuffle(game);
    //发牌
    deal(game);
    //测试,做牌
    // for (var i = 0; i < game.players.length; i++) {
    //     var sd = game.players[i];
    //     if (sd.userid == "49") {
    //         sd.holds = [12, 12];
    //     }
    // }
    _pushInfoToPlayer(game);
    _moveToNext(game, true);
};
//扣除桌子钱
function _deduct_money(game) {
    var base = game.baseMoney;
    for (var i = 0; i < game.players.length; i++) {
        var dd = game.players[i];
        dd.money -= base;
        _db_cost_money(dd.userid, base);
    }
}
/**开门三板斧:洗牌,发牌,摸牌**/
//洗牌
//[0,51] 0 对应黑桃2 
//game.pubHolds挑出前五张牌作为公共牌
function shuffle(game) {
    game.paiArr = [];
    var paiArr = game.paiArr;
    for (var i = 0; i < 52; i++) {
        var hei = i;
        paiArr.push(hei);
    }
    for (var i = 0; i < paiArr.length; i++) {
        var lastIndex = paiArr.length - i - 1;
        var randIndex = Math.floor(Math.random() * lastIndex);
        var t = paiArr[randIndex];
        paiArr[randIndex] = paiArr[lastIndex];
        paiArr[lastIndex] = t;
    }
    game.pubHolds = paiArr.slice(0, 5);
}
//发牌
function deal(game) {
    game.currentIndex = 5;
    var index = game.turn;
    for (var i = 0; i < game.playerNum * 2; i++) {
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
/**一些辅助方法**/
function _gameByUserid(userid) {
    //game不存在返回null
    var sd = _userByUserid(userid);
    if (!sd) {
        return null;
    }
    var game = games[sd.roomid];
    if (game) {
        return game;
    }
    var roomid = roomMgr.getUserRoom(userid);
    if (!roomid) {
        return null;
    }
    game = games[roomid];
    if (!game) {
        return null;
    }
    return game;
}

function _userByUserid(userid) {
    return gameSeatsOfUsers[userid];
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
    console.log(string);
    userMgr.broacastInRoom(string, data, userid, flag);
}

function _userSend(eventStr, data, userid) {
    if (!userid) {
        return;
    }
    // console.log(eventStr);
    userMgr.sendMsg(userid, eventStr, data);
}
//对象的深拷贝
function deepCopy(source, level) {
    var result = {};
    for (var key in source) {
        if (typeof source[key] === 'object' || (source[key] instanceof Array)) {
            if (source[key] instanceof Array) {
                if (level == 1) {
                    result[key] = [];
                } else {
                    result[key] = arrDeepcopy(source[key]);
                }
            } else {
                if (level == 1) {
                    result[key] = {};
                } else {
                    result[key] = deepCopy(source[key]);
                }
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
};　
//数组的深拷贝
function arrDeepcopy(obj) {
    var out = [],
        i = 0,
        len = obj.length;
    for (; i < len; i++) {
        if (obj[i] instanceof Array) {
            out[i] = arrDeepcopy(obj[i]);
        } else out[i] = obj[i];
    }
    return out;
}

function _filterGame(game) {
    if (!game) {
        console.log("Error:game invalid");
        return {};
    }
    var data = deepCopy(game, 1);
    data.addOptions = game.addOptions;
    data.circleHolds = game.circleHolds;
    delete data.paiArr;
    delete data.pubHolds;
    delete data.players;
    delete data.seats;
    delete data.pools;
    delete data.roomid;
    return data;
}

function _filterUser(sd) {
    if (!sd) {
        console.log("Error:sd invalid");
        return sd;
    }
    //以下用户信息非本人不透明
    var data = deepCopy(sd, 1);
    delete data.holds;
    delete data.score;
    delete data.allInCircle;
    return data;
}

function _userIsValid(userid) {
    if (!userid) {
        return false;
    }
    var roomid = roomMgr.getUserRoom(userid);
    if (!roomid) {
        return false;
    }
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd && sd.userid == userid) {
            return true;
        }
    };
    return false;
}

function _roomInfo(game) {
    var roomid = game.roomid;
    if (!roomid) {
        return null;
    }
    var roomInfo = roomMgr.getRoom(roomid);
    if (!roomInfo) {
        return null;
    }
    return roomInfo;
}

function _intFromNum(num) {
    //这个地方没有处理好。包括其他地方的金钱处理,不全面
    return num;
}
/**一些辅助方法End**/
function _gameInfoFromRoom(game, roomInfo) {
    if (!game || !roomInfo) {
        console.log("Error: game or room invalid");
        return;
    }
    var users = roomInfo.users;
    if (!roomInfo.waitingUsers) {
        roomInfo.waitingUsers = [];
    }
    //把上局中等待的人加到本局中来
    for (var i = 0; i < roomInfo.waitingUsers.length; i++) {
        var s = roomInfo.waitingUsers[i];
        var userid = s.userid;
        var money = s.money;
        //这一步不在需要,因为已经从数据库中重新读取了userid,若id号不对应
        //说明前后数据库操作的数据不一致.将会产生一个异常
        // roomInfo.users.splice(index, 0, userid);
        if (!roomInfo.userDatas) {
            roomInfo.userDatas = {};
        }
        roomInfo.userDatas[userid] = {};
        roomInfo.userDatas[userid].money = money;
    }
    roomInfo.waitingUsers = [];
    var playerNum = roomInfo.users ? roomInfo.users.length : 0;
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
    if (roomInfo.nextButton == null || roomInfo.nextButton == "undefind" || isNaN(roomInfo.nextButton)) {
        roomInfo.nextButton = next;
    }
    game.playerNum = playerNum;
    game.turn = roomInfo.nextButton;
    game.baseMoney = roomInfo.scene.consume_num;
    var baseMoney = game.baseMoney;
    game.addOptions = [baseMoney * 10, baseMoney * 20, baseMoney * 50, baseMoney * 100, baseMoney * 200];
    game.limitMoney = roomInfo.scene.limit_num;
    game.consume_type = (roomInfo.consume_type == null || roomInfo.consume_type == "undefind") ? 0 : roomInfo.consume_type;
}

function _gameCanBeigin(game) {
    if (game.playerNum < 2) {
        _setRoomWaiting(game);
        //游戏人数不足不能启动游戏
        return false;
    }
    return true;
}

function _gameBegin(game) {
    console.log("游戏开始了");
    //游戏开始将一部分game信息广播所有玩家
    //此时每个玩家的信息透明
    var data = {
        "gameInfo": _filterGame(game),
        "players": game.players
    };
    _broacast(game, "game_begin_push", data);
    var BbMoney = _intFromNum(game.baseMoney * 2);
    var SbMoney = _intFromNum(game.baseMoney);
    _broacast(game, "game_xiaZhuBeforeShuffle_push", {
        "Bb": game.Bb,
        "Sb": game.Sb,
        "Bb_money": BbMoney,
        "Sb_money": SbMoney,
        "gcPool": game.gcPool
    });
}
//挑选大盲注、小盲注
//返回:true 表示找到了大小盲注
function _selectBbAndSb(game) {
    //思路:game.turn表示大盲注
    //game.turn 上一个有效玩家是小盲注
    var Bb = null;
    var Sb = null;
    var Db = null;
    var cTurn = oTurn = game.turn;
    var sNum = game.seatNum;
    while (true) {
        var seat = game.seats[cTurn];
        if (seat.info) {
            Bb = seat.info.userid;
            break;
        }
        cTurn = (cTurn + 1) % sNum;
        if (cTurn == oTurn) {
            //经过一轮依然没有找到合适的玩家
            cTurn = -1;
            break;
        }
    }
    if (cTurn < 0) {
        console.log("Bb:没有找到合适的玩家");
        return false;
    }
    //找到了合适的玩家
    if (oTurn != cTurn) {
        console.log("修正game.turn");
        game.turn = cTurn;
    }
    //确定大盲注Done
    game.Bb = Bb;
    //to确定小盲注
    var vCount = sNum - 1;
    while (vCount >= 0) {
        var seat = game.seats[(cTurn + vCount) % sNum];
        if (seat.info) {
            Sb = seat.info.userid;
            break;
        }
        vCount--;
    }
    if (!Sb) {
        console.log("Sb:没有找到合适的玩家");
        return false;
    }
    //小盲注done
    game.Sb = Sb;
    var bbSd = _userByUserid(game.Bb);
    bbSd.bid = "Bb";
    var sbSd = _userByUserid(game.Sb);
    sbSd.bid = "Sb";
    var dCount = vCount - 1;
    while (dCount >= 0) {
        var seat = game.seats[(cTurn + dCount) % sNum];
        if (seat.info) {
            Db = seat.info.userid;
            break;
        }
        dCount--;
    }
    if (!Db) {
        console.log("Db:没有找到合适的玩家");
        return false;
    }
    game.Db = Db;
    var sbSd = _userByUserid(game.Db);
    sbSd.isD = true;
    //将大小盲注的人广播所有人
    _broacast(game, "game_BbSbDone_push", {
        "Bb": game.Bb,
        "Sb": game.Sb
    });
    return true;
}

function _moneyOps(sd, money, type) {
    //type=1 表示用户增加钱 否则表示用户扣钱
    //type 可省略,默认为0
    if (!sd) {
        console.log("Error,_moneyOps", sd, type);
        return;
    }
    type = type ? type : 0;
    if (type == 1) {
        //加钱
        sd.money += money;
        _db_win_money(sd.userid, money);
    } else {
        //扣钱
        if (money >= sd.money) {
            money = sd.money;
            _oneAllInStatus(sd);
        }
        sd.money -= money;
        sd.cost += money;
        sd.cZhu += money;
        var game = _gameByUserid(sd.userid);
        game.diChi += money;
        _broacast(game, "game_diChiUpdate_push", game.diChi);
        _db_cost_money(sd.userid, money);
    }
}
//洗牌前下注
function _xiaZhuBeforeShuffle(game) {
    //大小盲注扣除金币
    var BbMoney = _intFromNum(game.baseMoney * 2);
    var SbMoney = _intFromNum(game.baseMoney);
    game.gcZhu = BbMoney;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.bid == "Bb") {
            _moneyOps(sd, BbMoney);
        } else if (sd.bid == "Sb") {
            _moneyOps(sd, SbMoney);
        }
    }
    // _broacast(game, "game_xiaZhuBeforeShuffle_push", {
    //     "Bb": game.Bb,
    //     "Sb": game.Sb,
    //     "Bb_money": BbMoney,
    //     "Sb_money": SbMoney,
    //     "gcPool": game.gcPool
    // });
    // _playersARG(game, game.Bb);
}

function _pushInfoToPlayer(game) {
    //3板斧完成后,推送每个玩家的消息
    //玩家自己的消息对自己是完全透明的
    //从此时起,玩家的部分信息对所有玩家透明
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        _userSend("game_myInfo_push", sd, sd.userid);
    }
}

function _userInOps(game, seatIndex) {
    //当前用户正在说话
    //首先判断当前用户是否可以说话
    var sd = game.seats[seatIndex].info;
    if (!_userCanOps(sd)) {
        //如果用户失去了话语权
        console.log("去下一个用户");
        _moveToNext(game);
        return;
    }
    var BbMoney = _intFromNum(game.baseMoney * 2);
    var diChi = game.diChi;
    var extras_1 = [{
        money: 3 * BbMoney,
        desc: "3*大盲"
    }, {
        money: 4 * BbMoney,
        desc: "4*大盲"
    }, {
        money: diChi,
        desc: "1*底池"
    }];
    var extras_2 = [{
        money: Math.floor(0.5 * diChi),
        desc: "1/2底池"
    }, {
        money: Math.floor(0.67 * diChi),
        desc: "2/3底池"
    }, {
        money: diChi,
        desc: "1*底池"
    }];
    sd.extraAddOps = extras_1;
    if (game.gcCircle > 0) {
        sd.extraAddOps = extras_2;
    }
    // console.log("_userInOps", sd);
    //用户拥有话语权
    //玩家定时器启动
    //发送消息给玩家
    _userSend("game_myTurn_push", sd, sd.userid);
    //广播消息给其他玩家
    _broacast(game, "game_turnChanged_push", sd.userid, sd.userid, false);
    _playersARG(game);
    _initCounter(game, _getTimerCounter(game, sd));
}

function _checkUserInRoom(game, sd) {
    //是否踢出房间
    if (!sd || !game) {
        console.log("_userInRoom Error");
        return false;
    }
    var roomid = roomMgr.getUserRoom(sd.userid);
    if (roomid) {
        return true;
    }
    return false;
}

function oneUserSockedIsInvalid(userid) {
    if (!userid) {
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd && !game) {
        console.log("sd||game 不存在");
        return;
    }
}
exports.oneUserSockedIsInvalid = oneUserSockedIsInvalid;

function _checkUserSocketIsInvalid(game, sd, isLogout) {
    //检测socket是否非法
    var uid = sd.userid;
    //检测用户的socket 是否有效
    //若无效则踢出游戏
    if (!userMgr.socketIsValid(uid)) {
        _changeStatus(sd, "quited");
        if (isLogout) {
            // console.log("检测到一个socket失效", uid);
            //socket 无效
            roomMgr.exitRoom(sd.userid);
            _broacast(game, 'exit_notify_push', uid, uid, false);
        }
        return true;
    }
    return false;
}

function _clearOps(sd) {
    if (!sd) {
        return;
    }
    sd.canOps = false;
    sd.canGuo = false;
    sd.canGen = false;
    sd.canQuit = false;
    sd.addMaxMoney = 0;
    sd.addMinMoney = 0;
    sd.genMoney = 0;
    sd.currentGameCzhu = 0;
}
//true 拥有话语权
//false 没有话语权
function _userCanOps(sd) {
    var game = _gameByUserid(sd.userid);
    if (!sd || !sd.isPlaying || !game) {
        console.log("_userCanOps:invalid", sd.userid);
        return false;
    }
    var money = sd.money;
    if (money <= 0) {
        //没钱,没钱没有话语权  
        console.log("_userCanOps:没钱,没钱没有话语权 ");
        return false;
    }
    sd.canOps = true;
    sd.canAdd = true;
    sd.canQuit = true;
    //判断用户是否能过
    var gcZhu = _gameCurrentZhu(game);
    sd.currentGameCzhu = gcZhu;
    if (sd.cZhu >= gcZhu) {
        sd.canGuo = true;
        sd.canGen = false;
    } else {
        sd.canGuo = false;
        sd.canGen = true;
    }
    var opsMoney = money > game.gcMaxZhu ? game.gcMaxZhu : money;
    opsMoney = _intFromNum(opsMoney);
    sd.addMaxMoney = opsMoney;
    var GenMoney = gcZhu - sd.cZhu;
    GenMoney = money > GenMoney ? GenMoney : money;
    GenMoney = _intFromNum(GenMoney);
    sd.GenMoney = GenMoney;
    sd.addMinMoney = GenMoney;
    var BbMoney = _intFromNum(game.baseMoney * 2);
    var minAdd = GenMoney > BbMoney ? GenMoney : BbMoney;
    sd.addMinMoney = minAdd;
    if ((sd.money - sd.addMinMoney) < 0) {
        sd.canAdd = false;
    }
    if (GenMoney >= sd.money || GenMoney < 0) {
        sd.needAllIn = true;
        GenMoney = sd.money;
    } else {
        sd.needAllIn = false;
    }
    if (sd.needAllIn) {
        sd.canAdd = false;
    }
    return true;
}

function _moveToNext(game, noNeedSend) {
    //轮询下一个
    var turn = game.turn;
    if (!noNeedSend) {
        var t_userid = game.seats[turn].info.userid;
        _clearOps(game.seats[turn].info);
        // _userSend("game_myGuo_push", t_userid, t_userid);
        _broacast(game, "game_oneGuo_push", t_userid, t_userid, true);
    }
    var index = 1;
    while (true) {
        if (index++ == game.seatNum) {
            console.log("没有找到有效的玩家");
            _deferedToNextCircle(game);
            break;
        }
        turn = (turn + 1) % game.seatNum;
        var seat = game.seats[turn];
        if (!seat) {
            continue;
        }
        var player = seat.info;
        if (!player) {
            continue;
        }
        if (!player.isPlaying) {
            continue;
        }
        //找到了合适的玩家
        game.turn = player.seatIndex;
        _userInOps(game, player.seatIndex);
        break;
    }
}

function _circleBeginFromSb(game) {
    //轮询下一个
    var bsd = _userByUserid(game.Sb);
    var bTurn = bsd.seatIndex;
    var turn = bTurn;
    var index = 0;
    while (true) {
        if (index++ == game.seatNum) {
            console.log("没有找到有效的玩家");
            break;
        }
        var seat = game.seats[turn];
        turn = (turn + 1) % game.seatNum;
        if (!seat) {
            continue;
        }
        var player = seat.info;
        if (!player) {
            continue;
        }
        if (!player.isPlaying) {
            continue;
        }
        //找到了合适的玩家
        game.turn = player.seatIndex;
        _userInOps(game, player.seatIndex);
        break;
    }
}

function _gameCurrentZhu(game) {
    return game.gcZhu;
}

function _updateGameCZhu(game) {
    if (!game) {
        console.log("Error _updateGCZhu");
        return;
    }
    var sd = game.seats[game.turn].info;
    if (!sd) {
        console.log("Error _updateGCZhu 2");
        return;
    }
    if (sd.cZhu > _gameCurrentZhu(game)) {
        game.gcZhu = sd.cZhu;
        _broacast(game, "game_GCZhuUpdate_push", game.gcZhu);
    }
}

function _changeStatus(sd, status) {
    if (!sd || !status) {
        return;
    }
    sd.status = status;
    sd.isPlaying = false;
    // switch (status) {
    //     case "AllIn":
    //         _oneAllInStatus(sd);
    //         break;
    // }
}

function _oneAllInStatus(sd) {
    //玩家的状态变成了AllIn状态
    //计算AllIn状态下边池的金额
    //玩家若赢牌最大只能赢取边池里面的钱
    //目前的算法是之前所有的钱
    if (!sd) {
        return;
    }
    var game = _gameByUserid(sd.userid);
    if (!game) {
        return;
    }
    _clearOps(sd);
    _changeStatus(sd, "AllIn");
    sd.allInCircle = game.gcCircle;
    var userid = sd.userid;
    _userSend("game_myAllIn_push", sd, userid);
    _broacast(game, "game_oneInAllIn_push", userid, userid, false);
}

function _checkUserTurn(sd) {
    if (!sd) {
        return false;
    }
    var game = _gameByUserid(sd.userid);
    if (!game) {
        return false;
    }
    if (game.turn == sd.seatIndex) {
        return true;
    }
    return false;
}
//用户操作
//str : "doGen","doAdd","doQuit","doGuo"
//data:对应的参数
function userOps(userid, str, data) {
    if (!userid || !str) {
        console.log("uop: arguments invalid");
        return;
    }
    switch (str) {
        case "doGen":
            _doGen(userid);
            break;
        case "doAdd":
            _doAdd(userid, data);
            break;
        case "doQuit":
            _doQuit(userid);
            break;
        case "doGuo":
            _doGuo(userid);
            break;
        case "keepStatus":
            _doKeepStatus(userid, data);
            break;
    }
}
exports.userOps = userOps;

function _doGen(userid) {
    //跟注
    //此处需要注意的是玩家的钱
    //  1)如果钱足够,那么money不能小于当前注
    //  2)如果钱不够,玩家变成AllIn状态,失去话语权
    if (!userid) {
        console.log("_doGen userid invalid");
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("_doGen player invalid");
        return;
    }
    if (!_checkUserTurn(sd)) {
        console.log("_doGen not you turn");
        return;
    }
    if (!sd.canOps) {
        console.log("_doGen 玩家不能操作");
        return;
    }
    if (!sd.canGen) {
        console.log("_doGen 玩家不能跟注");
        return;
    }
    var sMoney = sd.money;
    var gcZhu = _gameCurrentZhu(game);
    var sum = sMoney + sd.cZhu;
    var delta = gcZhu - sum;
    var gen = gcZhu - sd.cZhu;
    if (delta >= 0) {
        //玩家AllIn了
        gen = sd.money;
    }
    game.opsNum++;
    sd.hadOpsFlag = true;
    _moneyOps(sd, gen);
    var data = {
        userid: userid,
        status: sd.status,
        cZhu: sd.cZhu,
        genMoney: gen,
        money: sd.money
    };
    // _userSend("game_myGen_push", data, userid);
    if (sd.money == 0) {
        _broacast(game, "game_oneAllIn_push", data, userid, true);
    } else {
        _broacast(game, "game_oneGen_push", data, userid, true);
    }
    // 判断是否会进入下一轮
    if (_checkCanNextCircle(game)) {
        //进入下一轮
        _deferedToNextCircle(game);
    } else {
        _moveToNext(game);
    }
}

function _doAdd(userid, data) {
    //加注
    //data 就是 money
    if (!userid || !data) {
        console.log("_doAdd arguments invalid");
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("_doAdd info invalid");
        return;
    }
    if (!_checkUserTurn(sd)) {
        console.log("_doAdd not you turn");
        return;
    }
    if (!sd.canOps) {
        console.log("_doAdd 玩家不能操作");
        return;
    }
    if (!sd.canAdd) {
        console.log("_doAdd 玩家不能加注");
        return;
    }
    var money = data;
    var moneyValidFlag = money <= sd.addMaxMoney && money >= sd.addMinMoney;
    if (!moneyValidFlag) {
        //money超出所拥有的钱
        console.log("_doAdd money invalid");
        return;
    }
    if (money > sd.money) {
        //money超出所拥有的钱
        console.log("_doAdd money overflow");
        return;
    }
    sd.hadOpsFlag = true;
    //玩家下注
    // 1)玩家当前的注cZhu改变,怎么变,在原来基础上相加即可
    // 2)有可能改变了最大注,当money>game.gcZhu的时候改变
    //先扣钱
    _moneyOps(sd, money);
    if (sd.cZhu > _gameCurrentZhu(game)) {
        _updateGameCZhu(game);
    }
    var data = {
        userid: userid,
        status: sd.status,
        cZhu: sd.cZhu,
        addMoney: money,
        money: sd.money
    };
    // _userSend("game_myAdd_push", data, userid);
    game.opsNum++;
    // _broacast(game, "game_oneAdd_push", data, userid, true);
    if (sd.money == 0) {
        _broacast(game, "game_oneAllIn_push", data, userid, true);
    } else {
        _broacast(game, "game_oneGen_push", data, userid, true);
    }
    // _playersARG(game, userid);
    //首先判断加注的钱是否等于跟注的钱
    if (money == sd.GenMoney) {
        // 判断是否会进入下一轮
        if (_checkCanNextCircle(game)) {
            //进入下一轮
            _deferedToNextCircle(game);
            return;
        }
    }
    _moveToNext(game);
}
//exitFlag 如果是退出房间直接弃牌
function _doQuit(userid, exitFlag) {
    //弃牌
    //可能引起的操作有
    //1.游戏结束,
    //2.进入下一轮
    //3.下一个玩家说话
    if (!userid) {
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("quit user invalid", sd, game);
        return;
    }
    if (!exitFlag) {
        if (sd.seatIndex != game.turn) {
            console.log("quit not your turn");
            return;
        }
        if (!sd.canQuit) {
            console.log("you cannot quit");
            return;
        }
    } else {
        if (sd.seatIndex == game.turn) {
            deleteSetTimeOut(game);
        }
    }
    game.opsNum++;
    sd.hadOpsFlag = true;
    _changeStatus(sd, "quited");
    // _userSend("game_myQuit_push", userid, userid);
    _broacast(game, "game_oneQuit_push", userid, userid, true);
    if (_checkGameWillOver(game)) {
        // _gameOver(game);
        _quitToOver(game);
        return;
    }
    if (sd.seatIndex == game.turn) {
        if (_checkUserSocketIsInvalid(game, sd)) {
            _checkUserSocketIsInvalid(game, sd, true);
            sd.exitFlag = true;
        }
        if (_checkCanNextCircle(game)) {
            //进入下一轮
            _deferedToNextCircle(game);
        } else {
            _moveToNext(game);
        }
    }
}

function _doGuo(userid) {
    //点击过
    if (!userid) {
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("_doGuo user invalid");
        return;
    }
    if (sd.seatIndex != game.turn) {
        console.log("_doGuo not your turn");
        return;
    }
    if (!sd.canGuo) {
        console.log("you cannot _doGuo");
        return;
    }
    game.opsNum++;
    sd.hadOpsFlag = true;
    _broacast(game, "game_oneClickGuo_push", userid, userid, true);
    if (_checkCanNextCircle(game)) {
        //进入下一轮
        _deferedToNextCircle(game);
    } else {
        _moveToNext(game);
    }
}

function _doKeepStatus(userid, data) {
    if (!userid) {
        console.log("_doKeepStatus userid invalid");
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("_doKeepStatus player invalid");
        return;
    }
    if (data === sd.keepStatus) {
        sd.keepStatus = null;
        _userSend("game_myKeepStatusCancel_push", sd, sd.userid);
    } else {
        sd.keepStatus = data;
        _userSend("game_myKeepStatusChanged_push", sd, sd.userid);
    }
}

function _playersARG(game, userid) {
    userid = userid ? userid : null;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.userid != userid) {
            _ARGStatusChanged(game, sd);
        }
    }
}

function _ARGStatusChanged(game, sd) {
    if (!sd || sd.status !== "playing") {
        sd.keepStatus = null;
        return;
    }
    var genMoney = game.gcZhu - sd.cZhu;
    var sheng = sd.money - genMoney;
    var status = "0";
    if (genMoney <= 0) {
        status = "0";
        genMoney = 0;
    } else if (sheng > 0) {
        status = "1";
    } else {
        genMoney = sd.money;
        status = "2";
    }
    var data = {
        argStatus: status,
        genMoney: genMoney
    }
    sd.yuShe = data;
    _userSend("game_myARGStatusChanged_push", data, sd.userid);
}

function _fNameFromKeepStatus(sd) {
    if (!sd.keepStatus) {
        return null;
    }
    var game = _gameByUserid(sd.userid);
    var fArrs = ["_doGuo", "_doQuit"];
    var sArrs = ["_doGuo", "_doGen"];
    var tArrs = ["_doGuo", "_doGen"];
    var ms = "";
    // 3种格式: "ROG"(让or弃);"ARG"(自动让牌(跟XX，全下));"GAZ"(
    switch (sd.keepStatus) {
        case "ROG":
            if (sd.canGuo) {
                return fArrs[0];
            } else {
                return fArrs[1];
            }
            break;
        case "ARG":
            if (sd.canGuo) {
                return sArrs[0];
            } else if (sd.canGen) {
                return sArrs[1];
            }
            break;
        case "GAZ":
            if (sd.canGuo) {
                return tArrs[0];
            } else {
                return tArrs[1];
            }
            break;
    }
    return null;
}

function _checkCanNextCircle(game) {
    //补充
    _UpdateGamePlNum(game);
    _UpdateGameAllInNum(game);
    if (game.plNum < 1) {
        return true;
    }
    if (game.plNum < 2) {
        //如果此时playing玩家的数目小于2,且判断有钱的人一定是平注了,直接进入下一轮
        console.log("玩家的人数小于2");
        var gcZhu = game.gcZhu;
        for (var i = 0; i < game.players.length; i++) {
            var sd = game.players[i];
            if (sd.isPlaying) {
                if (sd.cZhu == gcZhu) {
                    return true;
                }
            }
        }
        return false;
    }
    //1.第一准则:确保playing状态的所有人有一次说话的机会
    //  例如第一轮下注(此时大盲注的注是最大的)。由 大盲注的下一家开始说话, 如果所有玩家都跟注操作。那么
    //  大盲注还有一次说话的机会。若中途有人A高于大盲注,所有人都选择了跟,那么到A的上一家平注后本轮结束
    //2.第二准则: 确保playing状态下所有用户下的钱都是一样的。
    if (!_checkAllUsersOP(game)) {
        // console.log("不是所有玩家都操作了");
        return false;
    }
    if (!_checkAllUsersPZ(game)) {
        return false;
    }
    game.canNextCircle = true;
    // console.log("***需要进入下一轮了***");
    return true;
}

function _checkAllUsersOP(game) {
    //确保每个玩家都操作过一次了
    //  方法:每个玩家的任何操作sd.hadOpsFlag都会置为true,当新的一轮开始的时候置为false;
    //      统计hadOpsFlag为true的对象,若玩家操作的总数相等那么认为所有玩家都操作过了,返回true值
    //      注意:统计的是所有玩家包括弃牌,AllIn等各种状态的玩家
    var gcZhu = game.gcZhu;
    var pCount = 0;
    var zCount = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd && sd.isPlaying) {
            pCount++;
            if (sd.hadOpsFlag) {
                zCount++;
            }
        }
    }
    if (pCount == zCount) {
        return true;
    }
    return false;
}

function _checkAllUsersPZ(game) {
    //检测是否平注
    //  方法: playing 状态下 玩家的下注和游戏中的最大注相等的人数;
    //      若相等,则所有人平注 返回true;否则return false;表示尚有人没有平注
    var gcZhu = game.gcZhu;
    var pCount = 0;
    var zCount = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.isPlaying) {
            pCount++;
            if (sd.cZhu == gcZhu) {
                zCount++;
            }
        }
    }
    if (pCount == zCount) {
        return true;
    }
    return false;
}

function _checkAllInNumForGCCircle(game, users) {
    //计算本轮是否有人AllIn了,
    //并取出本轮allIn的所有玩家,存入users返回
    users = users ? users : [];
    var count = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.status == "AllIn" && sd.allInCircle == game.gcCircle) {
            count++;
            users.push(sd);
        }
    }
    if (count > 0) {
        return true;
    }
    return false;
}

function _gameBianChi(game) {
    var users = [];
    game.gcBianChiArr = [];
    var bcArr = game.gcBianChiArr;
    var nameArr = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N"];
    users = [].map.call(game.players, function(sd) {
        return {
            userid: sd.userid,
            costMoney: sd.cost
        };
    });
    //从小到大排序
    users.sort(function(sd0, sd1) {
        return sd0.costMoney - sd1.costMoney;
    });
    var preMoney = 0;
    for (var i = 0; i < users.length; i++) {
        var dd = users[i];
        var name = nameArr[i];
        //1)找出空闲的边池
        var index = -1;
        for (var k = 0; k < bcArr.length; k++) {
            var od = bcArr[k];
            if (od) {
                if (od.name === name) {
                    index = k;
                    break;
                }
            }
        }
        var plObj = null;
        if (index == -1) {
            //没有找到合适的池子。
            //建造一个池子
            var chiName = nameArr[bcArr.length];
            var chiObj = {
                name: chiName,
                users: [],
                money: 0
            };
            plObj = chiObj;
            game.gcBianChiArr.push(plObj);
        } else {
            plObj = bcArr[index];
        }
        plObj.money = (dd.costMoney - preMoney) * (users.length - i);
        plObj.users = [].map.call(users.slice(i), function(p) {
            return p.userid;
        });
        preMoney = dd.costMoney;
    }
    // console.log("game.gcBianChiArr", game.gcBianChiArr);
}

function _deferedToNextCircle(game) {
    var second = 0.5;
    var tt = setTimeout(function() {
        clearTimeout(tt);
        _toNextCircle(game);
    }, second * 1000);
}

function _toNextCircle(game) {
    // 可能触发这个方法的几种可能
    // 1)过/让牌 2)弃牌 3)跟注 4)当加注的数目等于跟注的数目
    if (!game) {
        return;
    }
    if (!game.canNextCircle) {
        if (!_checkCanNextCircle(game)) {
            console.log("_tnc: 不能进入下一轮");
            return;
        }
    }
    //需要判断是否是最后一轮
    //方法:判断已发数组和持有公共牌数组是否相等,若想等,是最后一轮,两两比牌开始    
    if (game.circleHolds.length == game.pubHolds.length) {
        _gameCaculate(game);
        return;
    }
    _broacast(game, "game_allGuo_push");
    console.log("可以进入下一轮");
    //计算本轮的边池
    _gameBianChi(game);
    //获取小盲注的位置坐标    
    var bsd = _userByUserid(game.Sb);
    var bTurn = bsd.seatIndex;
    //搜取所有玩家下的注,包括弃牌非弃牌的
    var allCZhu = _allUsersZhu(game);
    var allCZhuNum = 0;
    for (var i = 0; i < allCZhu.length; i++) {
        var cData = allCZhu[i];
        allCZhuNum += cData.cZhu;
    }
    // if (game.gcCircle == 0) {
    //     var BbMoney = _intFromNum(game.baseMoney * 2);
    //     var SbMoney = _intFromNum(game.baseMoney);
    //     allCZhuNum -= (BbMoney + SbMoney);
    // }
    //1.将游戏的一些信息初始化
    // 1)游戏的轮数加1
    game.gcCircle++;
    // 2)当前最大注设置为0
    game.gcZhu = 0;
    // 3)设置game.turn 为小盲注的位置。从此轮之后,每一轮都是小盲注开始说话
    game.turn = bTurn;
    // 4)设置现金池,将上一轮所有玩家下的注放到现金池中
    game.gcPool += allCZhuNum;
    // 5)平注人数设置为0
    game.pzNum = 0;
    // 6)游戏的人数更新
    _UpdateGamePlNum(game);
    // 7)操作的人数更新
    game.opsNum = 0;
    // 8)每轮结束时的底池压入pools保存
    //    副作用(good):每轮下注的总钱数相减可获得
    game.pools.push(game.gcPool);
    // 9)其他
    game.canNextCircle = false;
    //2.将每个玩家的信息初始化
    _toNextCircleUserSetting(game);
    //所有信息初始化完成后通知前台
    //  因为用户的信息已经在_toNextUserSetting()中通知完成了
    //  so,接下来只需要广播game的部分信息就可以了
    // 首先发公共牌
    var chIndex = 0;
    console.log("nc,下一轮开始", game.gcCircle);
    if (game.gcCircle == 1) {
        chIndex = 3;
    } else {
        chIndex = game.circleHolds.length + 1;
    }
    game.circleHolds = game.pubHolds.slice(0, chIndex);
    _broacast(game, "game_newCircle_push", _filterGame(game));
    //参数设置done;消息发送done;
    //此处有个注意点若playing人数小于2,且playing 和 AllIn 人数 之和>=2;那么自动进入下一轮直至游戏结束
    //注此时不会出现playing<2 且 和也小于2的情况
    if (game.plNum < 2 && (game.plNum + game.allInNum) >= 2) {
        _deferedToNextCircle(game);
    } else {
        //接下来从小盲注开始搜寻有效的玩家说话
        //延迟1秒
        var tter = setTimeout(function() {
            clearTimeout(tter);
            _circleBeginFromSb(game);
        }, 500);
    }
}

function _allUsersZhu(game) {
    //搜集所有玩家下过的注,以数组的形式返回
    var alls = [];
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd) {
            var data = {
                userid: sd.userid,
                cZhu: sd.cZhu
            };
            alls.push(data);
        }
    }
    return alls;
}

function _clearAllUserOps(game) {
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd) {
            _clearOps(sd);
        }
    }
}

function _UpdateGamePlNum(game) {
    var plCount = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.isPlaying) {
            plCount++;
        }
    }
    game.plNum = plCount;
}

function _UpdateGameAllInNum(game) {
    var plCount = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.status == "AllIn") {
            plCount++;
        }
    }
    game.allInNum = plCount;
}

function _toNextCircleUserSetting(game) {
    //将每个玩家的部分信息初始化
    //此处不需要考虑玩家的状态
    var py = [];
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (!sd) {
            continue;
        }
        _clearOps(sd);
        sd.cZhu = 0;
        sd.hadOpsFlag = false;
        //玩家的信息初始化完成后推送给前台
        //玩家的信息对玩家是透明的。对其他玩家部分透明
        _userSend("game_myNewCircle_push", sd, sd.userid);
        py.push(_filterUser(sd));
    }
    _broacast(game, "game_playersInNewCircle_push", py);
}

function _getRanks(game) {
    // 目的:决出排名 
    var allFens = [];
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        var _holds = sd.holds.concat(game.pubHolds);
        sd.score = DZ.score(_holds);
        var data = {
            userid: sd.userid,
            score: sd.score
        };
        allFens.push(data);
    }
    allFens.sort(function(d0, d1) {
        //经验证排序是正确的
        var score0 = d0.score;
        var score1 = d1.score;
        var value = DZ.compare(score0, score1);
        if (value == 0) {
            return false;
        } else {
            return true;
        }
    });
    //allFens 从大到小排序done
    var ws = null;
    var wins = [];
    var ranks = []; // 长度是game.seatNum的二维数组
    for (var i = 0; i < allFens.length; i++) {
        var fen = allFens[i];
        if (!ws) {
            ws = fen.score;
            wins.push(fen.userid);
            if (i === allFens.length - 1) {
                ranks.push(wins);
            }
        } else if (fen.score === ws) {
            wins.push(fen.userid);
            if (i === allFens.length - 1) {
                ranks.push(wins);
            }
        } else {
            ranks.push(wins);
            wins = [];
            ws = fen.score;
            wins.push(fen.userid);
            if (i === allFens.length - 1) {
                ranks.push(wins);
            }
        }
    }
    //排名done
    game.ranks = ranks;
}

function _gameCaculate(game) {
    deleteSetTimeOut(game);
    if (!game) {
        console.log("Error:gcl:game invalid");
        return;
    }
    //比牌开始
    _getRanks(game);
    var winDict = _gameWinUsersInfo(game);
    var winUs = [];
    var tps = [];
    for (var key in winDict) {
        var money = winDict[key].money;
        if (money > 0) {
            tps.push(parseInt(key));
            var wData = {
                userid: key,
                winMoney: money,
                money: _userByUserid(key).money,
                isWinner: (game.ranks[0].indexOf(parseInt(key)) > -1)
            };
            winUs.push(wData);
        }
    }
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        sd.isWinner = game.ranks[0].indexOf(sd.userid) > -1;
        if (winDict[sd.userid] && winDict[sd.userid].money > 0) {
            _moneyOps(sd, winDict[sd.userid].money, 1);
        }
        var uid = parseInt(sd.userid);
        if (tps.indexOf(uid) == -1) {
            var wData = {
                userid: sd.userid,
                winMoney: 0,
                money: sd.money,
                isWinner: sd.isWinner
            };
            winUs.push(wData);
        }
    }
    _broacast(game, "game_caculateResult_push", winUs);
    var tter = setTimeout(function() {
        clearTimeout(tter);
        _gameOver(game);
    }, 100);
}

function _checkGameWillOver(game) {
    //检测game是否即将结束
    //触发的可能有:弃牌,最后的比牌(触发的条件是:5张公共牌发完)
    var count = 0;
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd) {
            if (sd.isPlaying || sd.status == "AllIn") {
                count++;
            }
        }
    }
    if (count < 2) {
        return true;
    }
    return false;
}

function _quitToOver(game) {
    var winUs = [];
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        sd.isWinner = false;
        if (sd.status == "playing" || sd.status == "AllIn") {
            var userid = sd.userid;
            var money = game.diChi;
            sd.isWinner = true;
            sd.holds = [];
            var data = {
                userid: userid,
                winMoney: money,
                money: sd.money,
                isWinner: sd.isWinner
            };
            _moneyOps(sd, money, 1);
            // _userSend("game_myWin_push", data, userid);
            // _broacast(game, "game_oneWin_push", data, userid, false);
            // var winUs = [data];
            winUs.push(data);
        } else {
            var data = {
                userid: sd.userid,
                winMoney: 0,
                money: sd.money,
                isWinner: sd.isWinner
            };
            winUs.push(data);
        }
    }
    _broacast(game, "game_caculateResult_push", winUs);
    _gameOver(game);
}

function _gameWinUsersInfo(game) {
    //返回winDict,格式如下。money 为0。或者userid不在keys中的为输
    // winDict[fd.userid] = {};
    // winDict[fd.userid].money = 0;
    // winDict[fd.userid].bNames = [];
    var ranks = game.ranks;
    _gameBianChi(game);
    var bArr = game.gcBianChiArr;
    var winDict = {};
    var bNameWins = {};
    for (var i = 0; i < bArr.length; i++) {
        var b = bArr[i];
        if (b.money == 0 || i == bArr.length - 1) {
            continue;
        }
        var wins = _findWinner(ranks, b.users);
        console.log(b.name, wins);
        bNameWins[b.name] = wins;
        var pm = b.money / wins.length;
        for (var k = 0; k < wins.length; k++) {
            var w = wins[k];
            if (!winDict[w]) {
                winDict[w] = {};
                winDict[w].money = 0;
                winDict[w].bNames = [];
            }
            winDict[w].money += pm;
            winDict[w].bNames.push(b.name);
        }
    }
    var fb = bArr[bArr.length - 1];
    if (fb.money > 0) {
        var fd = _userByUserid(fb.users[0]);
        if (fd.status == "AllIn") {
            if (!winDict[fd.userid]) {
                winDict[fd.userid] = {};
                winDict[fd.userid].money = 0;
                winDict[fd.userid].bNames = [];
            }
            winDict[fd.userid].money += fb.money;
            winDict[fd.userid].bNames = [fb.name];
        } else {
            var tMoney = fb.money;
            var tD = {};
            //1,2,3,4
            var la = bNameWins["A"] ? bNameWins["A"].length : 1;
            var lb = bNameWins["B"] ? bNameWins["B"].length : 1;
            var lc = bNameWins["C"] ? bNameWins["C"].length : 1;
            var ld = bNameWins["D"] ? bNameWins["D"].length : 1;
            tD["A"] = 0.1 * tMoney / la;
            tD["B"] = 0.2 * tMoney / lb;
            tD["C"] = 0.3 * tMoney / lc;
            tD["D"] = 0.4 * tMoney / ld;
            for (var key in winDict) {
                var u = winDict[key];
                for (var m = 0; m < u.bNames.length; m++) {
                    u.money += tD[u.bNames[m]];
                }
            }
        }
    }
    // console.log("winDict", winDict);
    return winDict;
}

function _testString(game, winDict) {
    //测试方法,release状态下不要使用
    //返回p标签的html字符串
    var bianchi = [];
    for (var i = 0; i < game.gcBianChiArr.length; i++) {
        var b = game.gcBianChiArr[i];
        var s = "<br/>" + "边池名字: " + b.name + "; 金额: " + b.money + "; 玩家数组: " + JSON.stringify(b.users);
        // s += "<br/>";
        bianchi.push(s);
    }
    var wins = [];
    for (var key in winDict) {
        var s = "<br/>" + "玩家: " + key + " 下注 " + _userByUserid(key).cost + " ; 赢得金钱: " + winDict[key].money;
        wins.push(s);
    }
    var s_b = "***结果********************";
    var totalS = "<p id='p_id'>";
    var tArr_ = [s_b].concat(bianchi).concat(["*******"]).concat(wins);
    for (var i = 0; i < tArr_.length; i++) {
        totalS += tArr_[i] + "<br/>";
    }
    totalS += "<br/>" + "</p>";
    return totalS;
}

function _findWinner(ranks, users) {
    var uD = {};
    for (var i = 0; i < ranks.length; i++) {
        var ua = ranks[i];
        for (var k = 0; k < ua.length; k++) {
            uD[ua[k]] = i;
        }
    }
    var wins = [];
    uR = [].map.call(users.slice(0), function(id) {
        return {
            userid: id,
            rank: uD[id]
        };
    });
    uR.sort(function(r0, r1) {
        return r0.rank - r1.rank;
    });
    var minRank = uR[0].rank;
    var uMaxs = [];
    uMaxs.push(uR[0].userid);
    for (var i = 1; i < uR.length; i++) {
        var u = uR[i];
        if (u.rank == minRank) {
            uMaxs.push(u.userid);
        }
    }
    return uMaxs;
}

function _exitGame(userid) {
    var game = _gameByUserid(userid);
    var sd = _userByUserid(userid);
    if (!sd || !game) {
        console.log("_exitGame user invalid", sd, game);
        return;
    }
    if (sd.exitFlag) {
        return;
    }
    sd.exitFlag = true;
    _doQuit(userid, true);
}
exports.exitGame = _exitGame;

function _gameOver(game) {
    deleteSetTimeOut(game);
    //本局游戏结束
    console.log("本局游戏结束");
    //游戏结束
    var gData = game.players.filter(function(sd) {
        return sd.status != "quited";
    });
    _broacast(game, "game_over", gData);
    _clearAllHolds(game);
    _checkExitedUsers(game);
    //一些额外的操作
    //1)检查在座的是否有钱
    _checkMoneyIsEnough(game);
    //2)将房间挂起   
    _setRoomWaiting(game);
    //3)修改roomInfo的金钱
    _setRoomInfo(game);
    //....)ready 为false game = null
    _setGameConfig(game);
    _clearGame(game);
}

function _clearAllHolds(game) {
    for (var i = 0; i < game.players.length; i++) {
        var player = game.players[i];
        player.holds = null;
        player.score = "0";
    }
}

function _clearGame(game) {
    game = null;
}

function _checkExitedUsers(game) {
    var roomInfo = _roomInfo(game);
    if (!roomInfo) {
        return;
    }
    roomInfo.nextButton = (roomInfo.nextButton + 1) % game.seatNum;
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
            //socket 无效
            //注意此时不能调用 userMgr 因为此时socket已经不存在了。 只需退出房间即可
            roomMgr.exitRoom(uid);
            _broacast(game, 'exit_notify_push', uid, uid, false);
        }
    }
}

function _setRoomInfo(game) {
    if (!game) {
        return;
    }
    var roomInfo = _roomInfo(game);
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
    var roomInfo = _roomInfo(game);
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
    for (var i = 0; i < game.players.length; i++) {
        var sd = game.players[i];
        if (sd.money < game.limitMoney) {
            //钱不够底分了
            _secondsExit(sd.userid, 2, true);
        }
    }
}

function _secondsExit(userid, seconds, flag) {
    flag = flag ? flag : false;
    var tt = setTimeout(function() {
        clearTimeout(tt);
        userMgr.exitRoom(userid, flag);
    }, seconds * 1000);
}

function _setRoomWaiting(game) {
    var roomInfo = _roomInfo(game);
    if (!roomInfo) {
        console.log("roomInfo invalid");
        return;
    }
    roomInfo.isWaiting = true;
}

function exitRoom(userid) {
    //调用_exitGame方法,这个方法不在使用
    if (!userid) {
        return;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        console.log("exitRoom info invalid");
        return;
    }
    sd.isExitRoom = true;
}
//********定时器*********
function _getTimerCounter(game, sd) {
    if (!game || !sd) {
        console.log("_getTimerCounter:Big Error");
        return 30;
    }
    var counter = game.counter1;
    // //如果玩家,且已经退出了且没在房间里
    if (_checkUserSocketIsInvalid(game, sd)) {
        counter = game.counter1;
    }
    // if (sd.keepStatus) {
    //     counter = game.counter2;
    // }
    return counter;
}

function _initCounter(game, counter) {
    console.log("定时器:", counter);
    deleteSetTimeOut(game);
    countDown(game, counter);
}

function countDown(game, counter) {
    // console.log("开始计数");
    game.timer = setInterval(function() {
        counter--;
        game.timer_Counter = counter;
        // console.log("定时器正在运行", counter);
        // counter = counter < 0 ? 0 : counter;
        if (counter == 0) {
            deleteSetTimeOut(game);
            _timerDone(game);
        }
    }, 1000);
}

function deleteSetTimeOut(game) {
    if (game.timer != null) {
        clearInterval(game.timer);
        // clearTimeout(timeCounter);
        game.timer = null;
    }
}

function _timerDone(game) {
    if (!game) {
        return;
    }
    var turn = game.turn;
    var sd = game.seats[turn].info;
    if (!sd) {
        return;
    }
    console.log("_timerDone doQuit");
    _doQuit(sd.userid);
    // var fName = _fNameFromKeepStatus(sd);
    // if (sd.keepStatus && fName) {
    //     eval(fName);
    //     return;
    // }
    //测试用begin
    // if (game.gcCircle == 0 && sd.userid == "47" && !sd.hadOpsFlag) {
    //     sd.canGuo = false;
    // }
    //测试用end
    // if (sd.canGuo) {
    //     console.log("_timerDone doGuo");
    //     _doGuo(sd.userid);
    // } else {
    //     console.log("_timerDone doQuit");
    //     _doQuit(sd.userid);
    //     //测试用begin
    //     // if (game.gcCircle == 0 && sd.userid == "47" && !sd.hadOpsFlag) {
    //     //     console.log("_timerDone doAdd");
    //     //     _doAdd(sd.userid, 200);
    //     // } else {
    //     //     console.log("_timerDone doGen");
    //     //     _doGen(sd.userid);
    //     // }
    //     //测试用end
    // }
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

function _isUserInGame(userid) {
    //检测用户是否在游戏中,
    //如果在则返回true,否则返回false
    if (!userid) {
        return false;
    }
    var sd = _userByUserid(userid);
    var game = _gameByUserid(userid);
    if (!sd || !game) {
        return false;
    }
    if (!game.players || game.players.length < 2) {
        return false;
    }
    var roomInfo = _roomInfo(game);
    if (!roomInfo || roomInfo.isWaiting) {
        return false;
    }
    for (var i = 0; i < game.players.length; i++) {
        var player = game.players[i];
        if (player.userid == userid) {
            return true;
        }
    }
    return false;
}
exports.isUserInGame = _isUserInGame;

function _getUserHolds(userid) {
    if (!_isUserInGame(userid)) {
        return null;
    }
    var sd = _userByUserid(userid);
    var flag = sd.isPlaying || (sd.status == "AllIn");
    if (!flag) {
        return null;
    }
    return sd.holds;
}
exports.getUserHolds = _getUserHolds;
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
    if (!_isUserInGame(userid)) {
        return;
    }
    var data = _userFromGameByID(game, userid);
    _userSend('game_userInfoById_push', data, userid);
}
exports.getUserInfoByUserid = getUserInfoByUserid;
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
    if (!_isUserInGame(userid)) {
        return;
    }
    var infos = _filterGame(game);
    infos.players = game.players.map(function(sd) {
        return _filterUser(sd);
    });
    _userSend('game_gameInfoById_push', infos, userid);
}
exports.getGameInfoByUserid = getGameInfoByUserid;
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
    var type = 0;
    if (game && game.consume_type) {
        type = game.consume_type;
    }
    db.cost_gems_or_coins(userid, money, type, function(o) {
        if (o) {
            use_money_logs(userid, money, type, 'dzpk');
        }
    });
}
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}