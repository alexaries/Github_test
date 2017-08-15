//ly:炸金花游戏
var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var utils = require('./zjh_utils');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var http_service = require('./http_service');
//ly:炸金花游戏
var games = {};
var gamesIdBase = 0;
var gameSeatsOfUsers = {};
//开始新的一局
exports.begin = function(roomid) {
    console.log("开始新的一局");
    var roomInfo = roomMgr.getRoom(roomid);
    if (roomInfo == null) {
        console.log("未找到房间");
        return;
    }
    if (roomInfo["begin_timer"]) {
        clearInterval(roomInfo["begin_timer"]);
        roomInfo["begin_timer"] = null;
    }
    //从db中按顺序读取userid的值，来确定座位号
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
};

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
        //这一步不在需要，因为已经从数据库中重新读取了userid,若id号不对应
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
    var playerNum = roomInfo.users ? roomInfo.users.length : 0;
    // console.log('ly:playerNum', playerNum);
    if (playerNum < 1) {
        //TODO 挂起房间
        roomInfo.isWaiting = true;
        return;
    } else {
        roomInfo.isWaiting = false;
    }
    // console.log("ly:roomInfo.nextUid:", roomInfo.nextUid);
    var next = (roomInfo.nextUid && (roomInfo.nextUid > 0)) ? roomInfo.userDatas[roomInfo.nextUid].seatIndex : 0;
    if (next < 0) {
        next = 0;
    }
    roomInfo.nextButton = next;
    // console.log("ly:roomInfo.nextButton:", roomInfo.nextButton);
    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: 0,
        playerNum: playerNum,
        paiArr: new Array(52),
        currentIndex: 0,
        gamePlayers: new Array(roomInfo.playerNum),
        seats: new Array(5),
        turn: roomInfo.nextButton,
        preTurn: -1,
        actionList: [],
        moneyPool: 0,
        baseMoney: roomInfo.scene.consume_num,
        zhuang: 0,
        currentZhu: 0,
        anZhuFlag: false,
        pingZhuFlag: false,
        circleCount: 0,
        limitMoney: roomInfo.scene.limit_num, //如果玩家小于这个值踢出房间
        maxZhu: roomInfo.maxZhu,
        consumeType: roomInfo.scene.consume_type,
        addZhuOps: [roomInfo.scene.jiazhu1, roomInfo.scene.jiazhu2, roomInfo.scene.jiazhu3, roomInfo.scene.jiazhu4],
        maxCircle: roomInfo.maxCircle
    }
    roomInfo.numOfGames++;
    //思路 最多有5个玩家，创建5个座位。
    //若玩家已经分配好了座位，则按座位坐下。座位号不能重复
    //这样以后再统计轮数。 和 新的玩家加入时可以保证前面玩家的座位不动
    //玩家在加入的时候分配一个有效的座位号给玩家
    //
    //Q"
    //目的:解决断线重连的座位问题；
    //需要(非常重要):玩家socket失效后重新加入时。将userid 以 push 的方式压入roomInfo.users不能插入。
    //思路: 记录已经被占领的座位号，如果座位号被之前占领了。取和[0,1,2,3,4]的交集
    //取交集的最小值为座位号.
    // var occupyedArr = [];
    // 上面问题已通过读取数据库解决
    // console.log("begin:roomInfo.userDatas=>", roomInfo.userDatas);
    for (var i = 0; i < game.playerNum; ++i) {
        var data = game.gamePlayers[i] = {};
        data.game = game;
        //userid 需要数据库提供
        data.userid = roomInfo.users[i];
        //用户金钱。 TODO:实时存储
        data.money = roomInfo.userDatas[data.userid].money;
        // console.log("begin:data.userid", data.userid);
        //座位号，每个玩家加入的时候由系统分发一个座位号
        // var sindex = roomInfo.userDatas[data.userid].seatIndex;
        // // console.log("begin:data.seatIndex:", sindex);
        // if (sindex == -1) {
        //     sindex = i;
        // }
        // if (occupyedArr.indexOf(sindex) > -1) {
        //     //已经存在了
        //     var qa = [0, 1, 2, 3, 4];
        //     var ta = _arrayIntersection(occupyedArr, qa);
        //     if (ta && ta.length > 0) {
        //         console.log("begin:occupyedArr:", ta);
        //         ta.sort(function(a, b) {
        //             //从小到大排序
        //             return a > b;
        //         });
        //         sindex = ta[0];
        //     } else {
        //         console.log("Error:seatIndex is invalid");
        //         return;
        //     }
        // }
        // occupyedArr.push(sindex);
        // console.log("beigin:sindex:", sindex);
        var sindex = i;
        data.seatIndex = sindex;
        if (roomInfo.userDatas[data.userid].seatIndex == -1) {
            roomInfo.userDatas[data.userid].seatIndex = sindex;
        }
        //玩家轮询的顺序,依据座位号而定
        data.seatTurn = data.seatIndex;
        //当前已经支出的金额
        data.costMoney = 0;
        //已下暗柱的金额
        data.an_cost = 0;
        //已下明注的金额
        data.ming_cost = 0;
        //持有的牌
        data.holds = [];
        //持有的分数
        //依据牌算出得分。
        //得分最高的获胜.
        data.score = 0;
        //用户当前的状态
        //playing or losed
        //只有playing玩家才有话语权
        data.status = "playing";
        data.allInFlag = false;
        //是否已经看过牌
        data.hasCheckedPai = false;
        //是否可以比牌。 轮到自己，且金额至少是当前注*2
        data.canBiPai = false;
        //是否可以下注。 金额小于当前注为false
        //下注分为 100 200 500 1000 4个档次
        //因此传输数据时要告诉用户是不是可选，
        //以及可选几个档次
        //下注必须要大于当前注，否则按照跟注处理
        data.canAddZhu = false;
        //是否可以跟注。没有钱不能跟注,处于Allin状态
        data.canGenzhu = false;
        gameSeatsOfUsers[data.userid] = data;
    }
    //创建5个座位
    for (var i = 0; i < 5; i++) {
        var seat = game.seats[i] = {};
        seat.game = game;
        //如果seat.info 为 null 表示当前座位没有玩家，可以分配给新加入的玩家
        seat.info = null;
        for (var k = 0; k < game.gamePlayers.length; k++) {
            var ud = game.gamePlayers[k];
            if (ud.seatIndex == i) {
                seat.info = ud;
                break;
            }
        }
    }
    games[roomid] = game;
    //如果用户小于2人。通知玩家等待
    if (users.length < 2) {
        var s = users[0];
        //通知玩家手牌
        userMgr.sendMsg(s.userid, 'game_waitingOther');
        console.log('如果用户小于2人');
        _set_roomIsWaiting(game);
        return;
    }
    //检测玩家是否有钱下底
    //将余额不足的玩家挂起
    //提示充值or退出。
    //充值完成后，参加下一轮的比赛
    // checkSeatMoney(game);
    //当玩家的数量<=1的时候，挂起当前游戏  
    //不继续下面的操作。
    //如果游戏等待的时候，有玩家加入。重新开始游戏
    //因此玩家的操作不仅要考虑是否等待。还要考虑是否会激活游戏
    if (checkRoomWaiting(roomInfo)) {
        console.log('checkRoomWaiting');
        return;
    }
    //从有效的玩家中选择一个做庄
    selectZhuang(game);
    deduct_money(game); //扣除底钱
    //下底注 
    xiaDiZhu(game);
    //洗牌
    shuffle(game);
    //发牌
    deal(game);
    console.log("begin:开始游戏的人数:", game.gamePlayers.length);
    //发牌完成后通知玩家
    for (var i = 0; i < game.gamePlayers.length; ++i) {
        //开局时，通知前端必要的数据
        var s = game.gamePlayers[i];
        //玩家的状态
        s.status = "playing";
        //测试,指定牌
        // if (i == 0) {
        //     s.holds = [1, 101, 201];
        // }
        //通知游戏开始
        userMgr.sendMsg(s.userid, 'game_begin_push', {
            turn: game.turn,
            maxCircle: roomInfo.maxCircle,
            currentZhu: game.currentZhu,
            data: userInfo_filter(s)
        });
    }
    _broacast(game, 'game_circleCount_push', game.circleCount, game.gamePlayers[0].userid, true);
    nextUserCanOperation(game);
};
//检测玩家是否有钱下底
function checkSeatMoney(game) {
    //如果玩家金钱不足，要请出房间
    //改变game一些属性
    //或者提示充值。充值完成后等待，可以加入下一轮的比赛
    var roomInfo = game.roomInfo;
    for (var i = game.gamePlayers.length - 1; i >= 0; i--) {
        var ddd = game.gamePlayers[i];
        var uid = ddd.userid;
        var money = ddd.money;
        if (money < game.limitMoney) {
            //如果玩家不够底注，则将玩家挂起。
            //挂起的玩家有个充值页面的提示。或者其他路径获得金币的提示
            //因此需要将余额不足的用户单独放到room的一个数组中
            //用户充值完成后将其移动到waiting数组中等待下一局的游戏
            if (uid && roomInfo.noMoneyArr.indexOf(uid) == -1) {
                roomInfo.noMoneyArr.push(uid); //锦标赛里失败的人数是从noMoneyArr里取的，所以，踢出的时候要把他算在noMoneyArr里
            }
            if (game.conf.creator != 'match') {
                userMgr.sendMsg(uid, 'game_noMoney_exit', {
                    money: money
                });
                //两秒后退出房间
                _secondsExit(uid, 2);
            } else {
                var actionData = {
                    delay: 3,
                    msg: '该轮比赛结束，您已被淘汰!'
                }
                _secondsExit(uid, 0, actionData);
            }
        }
    }
}

function _secondsExit(userid, seconds, actionData) {
    setTimeout(function() {
        userMgr.exitRoom(userid, actionData);
    }, seconds * 1000);
}
//检查房间是否挂起
function checkRoomWaiting(roomInfo) {
    //TODO 有效玩家的数量
    return roomInfo.isWaiting;
}
//从玩家中选择一个庄家
function selectZhuang(game) {
    //如果存在roomInfo.preTurn,且roomInfo.preTurn>=0 
    //那么庄家由计算决定
    _nextCanZhuang(game);
    game.zhuang = game.turn;
}
//下一个可以坐庄的人
//如果找到可以坐庄的人返回true, else return false
function _nextCanZhuang(game) {
    var roomInfo = game.roomInfo;
    if (isNaN(roomInfo.preTurn) || roomInfo.preTurn < 0) {
        roomInfo.preTurn = game.turn;
        console.log("ly:roomInfo.preTurn is NaN or it`s value < 0;", roomInfo.preTurn);
        return false;
    }
    var turn = roomInfo.preTurn;
    var next = turn;
    console.log("ly:上一个坐庄的人:", next);
    while (true) {
        next++;
        next %= game.seats.length;
        var seat = game.seats[next];
        //可能当前位置有人等待，此时seat.info 为 null值。但是可以坐庄
        //因此需要在开始游戏的时候才可以决定是谁坐庄，此时只能判断当前有效的人
        if (!seat.info) {
            console.log("seat.Info is null");
            continue;
        }
        var turnSeat = seat.info;
        if (turnSeat.status == "playing" && next != turn) {
            roomInfo.nextUid = turnSeat.userid;
            game.turn = next;
            roomInfo.preTurn = game.turn;
            console.log("ly:下一个庄:", game.turn);
            return true;
        }
        if (next == turn) {
            console.log("没找到下一个有效的庄");
            return false;
        }
    }
}
//扣除桌子钱
function deduct_money(game) {
    var base = game.roomInfo.scene.consume_num;
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        dd.money -= base;
        _db_cost_money(dd.userid, base, game.consumeType);
    }
}
//下底注
function xiaDiZhu(game) {
    var base = game.baseMoney;
    var total = base * game.gamePlayers.length;
    game.moneyPool = total;
    game.currentZhu = base * 2;
    game.anFlag = false;
    var commonInfoDict = {};
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        dd.money -= base;
        dd.costMoney += base;
        _db_cost_money(dd.userid, base, game.consumeType);
        userMgr.sendMsg(dd.userid, "game_myMoney_push", {
            restMoney: dd.money
        });
        var userid = dd.userid;
        commonInfoDict[userid] = {};
        commonInfoDict[userid].costMoney = base;
        commonInfoDict[userid].money = dd.money;
        commonInfoDict[userid].isAllinFlag = dd.money <= 0;
        commonInfoDict[userid].status = dd.status;
    }
    //发送通知
    var b_user_id = _userFromGame(game);
    if (b_user_id) {
        _broacast(game, 'game_moneyPool_push', {
            moneyPool: game.moneyPool,
            commonInfo: commonInfoDict
        }, b_user_id, true);
    }
}

function _invalidPaiArray() {
    //踢出2,3,4,5
    //标号从0开始
    var array = [1, 2, 3, 4];
    return array;
}
//洗牌
function shuffle(game) {
    game.paiArr = [];
    var paiArr = game.paiArr;
    for (var i = 0; i < 13; i++) {
        if (_invalidPaiArray().indexOf(i) > -1) {
            continue;
        }
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
    // console.log("shuffle:done:game.paiArr=> ",game.paiArr);
}
//发牌
function deal(game) {
    // console.log('deal');
    game.currentIndex = 0;
    var index = game.turn;
    for (var i = 0; i < game.playerNum * 3; i++) {
        var ch = game.gamePlayers[index].holds;
        if (ch == null) {
            ch = [];
            game.gamePlayers[index].holds = ch;
        }
        mopai(game, index);
        index++;
        index %= game.playerNum;
    }
}
// 摸牌
function mopai(game, index) {
    // console.log('mopai1',game.currentIndex,game.paiArr.length);
    if (game.currentIndex == game.paiArr.length) {
        return -1;
    }
    var seatData = game.gamePlayers[index];
    var ch = seatData.holds;
    var pai = game.paiArr[game.currentIndex];
    ch.push(pai);
    game.currentIndex++;
    return pai;
}

function _oneHasCheckedPai(game) {
    //这个地方用来判断玩家是否可以比牌
    //玩家可以比牌的充分条件:两两比牌的玩家中一家看过牌
    //因此只要游戏中有一家看过牌，那么其他玩家都具有比牌条件之一(不考虑金钱)
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var player = game.gamePlayers[i];
        if (player.status == "playing" && player.hasCheckedPai) {
            return true;
        }
    }
    return false;
}
//取两个数组的交集，没有交集，返回空数组
function _arrayIntersection(a, b) {
    var ai = 0,
        bi = 0;
    var result = new Array();
    while (ai < a.length && bi < b.length) {
        if (a[ai] < b[bi]) {
            ai++;
        } else if (a[ai] > b[bi]) {
            bi++;
        } else {
            /* they're equal */
            result.push(a[ai]);
            ai++;
            bi++;
        }
    }
    return result;
}
//轮到下一个玩家去操作
function nextUserCanOperation(game) {
    console.log("nextUserCanOperation:game.turn:", game.turn);
    var seatData = game.seats[game.turn].info;
    var userid = seatData.userid;
    if (!seatData) {
        console.log("Error:nextUserCanOperation:");
        // moveToNextUser(game);
        return;
    }
    //TODO 检验信息的有效性
    //TODO 当前操作的用户是否有余额
    //如果余额<=0 则没有话语权
    //如果所有的玩家都没钱了。那么由系统逆时针判定最后赢家
    var count = 0;
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var ddd = game.gamePlayers[i];
        if (ddd.status == "playing") {
            //玩家不能跟注了
            count++;
        }
    }
    if (count < 2) {
        gameOver(game, userid);
        return;
    }
    // //差值表示有钱跟注的人数。 如果有钱跟注的人数>=2 则继续
    // //if < 2 且玩家有效的数目只有两人，则进行比牌
    // var deltaCount = game.gamePlayers.length - count;
    // if ((deltaCount < 2) && game.gamePlayers.length == 2) {
    //     //所有玩家都没钱了
    //     //结束下注。按逆时针两两比牌
    //     console.log("所有玩家都没钱了");
    //     Anti_clockwiseVS(game);
    //     return;
    // }
    // console.log("ly:game.turn3=>", game.turn);
    if (!_get_canGen_flag(game, seatData)) {
        // //没有钱就失去了话语权
        seatData.canGenzhu = false;
        seatData.canAddZhu = false;
        seatData.canBiPai = false;
        seatData.allInFlag = true;
        seatData.xiaZhuExtra = {};
        seatData.xiaZhuExtra.ops = [];
        _initCounter(game, userid);
        userMgr.sendMsg(userid, "game_myTurn_push", userInfo_filter(seatData));
        _broacast(game, 'game_turnChanged_push', userid, userid, true);
        //如果玩家不能跟注了,且不是最后的两家
        //将玩家踢出房间
        // if (game.gamePlayers.length > 2) {
        //     userMgr.sendMsg(seatData.userid, "game_noMoney_exit", null);
        //     setTimeout(function() {
        //         userMgr.exitRoom(seatData.userid);
        //     }, 5000);
        //     return;
        // }
        return;
    }
    //如果一个人连续做了两次庄,表示该局跟注下注结束
    //如果该玩家可以比牌则等待玩家操作，否则自动比牌,本局结束
    if (game.turn == game.preTurn) {
        console.log("一个玩家连续做了两次庄");
        seatData.canGenzhu = false;
        seatData.canAddZhu = false;
        if (!seatData.canBiPai) {
            //如果玩家不能比牌则自动比牌。
            //否则等待玩家操作
            Anti_clockwiseVS(game);
        }
        return;
    }
    game.preTurn = game.turn;
    seatData.allInFlag = false;
    checkCanBiPai(game, seatData);
    // if (!seatData.hasCheckedPai) {
    //     //只有看过牌的人才能比牌
    //     seatData.canBiPai = false;
    // }
    _set_gen_add_flag(game, seatData);
    //1. 只有playing 玩家才有话语权。 已经losed 或者已经AllIn的玩家没有话语权
    //2. 玩家的可操作有： 下注(最多有4个，最少有一个档位)，
    //   跟注，比牌，看牌，弃牌 
    //warning: 操作需要记录吗？
    seatData.currentZhu = _get_currentZhuNum(game);
    //通知前端操作
    //1)只通知当前玩家，唤起玩家的操作页面
    //2)通知所有玩家当前正在进行操作的玩家
    _initCounter(game, userid);
    userMgr.sendMsg(userid, "game_myTurn_push", userInfo_filter(seatData));
    _broacast(game, 'game_turnChanged_push', userid, userid, true);
}

function _initCounter(game, userid) {
    _broacast(game, 'game_timerInitCounter_push', userid, userid, true);
    roomMgr.initCounter(game, userid);
}
//判断用户是否能跟注
//返回值:true 表示能跟注,false 表示不能跟注
function _get_canGen_flag(game, seatData) {
    var p_money = _get_currentZhuNum(game);
    var delta = seatData.money - p_money;
    if (!seatData.hasCheckedPai) {
        //假如是暗注        
        delta = seatData.money - p_money * 0.5;
    }
    if (delta > 0) {
        return true;
    }
    return false;
}
//判断用户是否有跟注，加注的权限
function _set_gen_add_flag(game, seatData, sendflag) {
    var p_money = _get_currentZhuNum(game);
    var delta = seatData.money - p_money;
    if (!seatData.hasCheckedPai) {
        //假如是暗注        
        delta = seatData.money - p_money * 0.5;
    }
    if (delta >= 0) {
        //可以下注 也可以跟注
        seatData.canGenzhu = true;
        var ga = game.addZhuOps.sort(function(a, b) {
            return a - b;
        });
        var m0 = ga[0];
        var m1 = ga[1];
        var m2 = ga[2];
        var m3 = ga[3];
        var t1 = [];
        var cZhu = _get_currentZhuNum(game) * 0.5;
        if (seatData.hasCheckedPai) {
            var scale = 2;
            cZhu *= scale;
            m0 *= scale;
            m1 *= scale;
            m2 *= scale;
            m3 *= scale;
            ga = [m0, m1, m2, m3];
        }
        // console.log("ly:delta:cZhu"+cZhu);
        // console.log("ly:delta:addZhuOps=>" + game.addZhuOps);
        if (cZhu <= m0) {
            t1 = [m0, m1, m2, m3];
        } else if (cZhu > m0 && cZhu <= m1) {
            t1 = [m1, m2, m3];
        } else if (cZhu > m1 && cZhu <= m2) {
            t1 = [m2, m3];
        } else if (cZhu > m2 && cZhu <= m3) {
            t1 = [m3];
        }
        var t2 = [];
        if (seatData.money >= m3) {
            t2 = [m0, m1, m2, m3];
        } else if (seatData.money >= m2) {
            t2 = [m0, m1, m2];
        } else if (seatData.money >= m1) {
            t2 = [m0, m1];
        } else if (seatData.money >= m0) {
            t2 = [m0];
        }
        var ops = _arrayIntersection(t1, t2);
        // console.log("ly:delta:t1"+t1);
        // console.log("ly:delta:t2"+t2);
        // console.log("ly.delta:ops"+ops);
        var opDict = {};
        if (ops.length > 0) {
            //说明是可以加注的。
            opDict.ops = ops;
            seatData.canAddZhu = true;
        } else {
            seatData.canAddZhu = false;
            opDict.ops = [];
        }
        seatData.xiaZhuExtra = opDict;
        seatData.xiaZhuOptions = ga;
        // console.log("ly:seatData.xiaZhuOptions:",seatData.xiaZhuOptions);
    }
    if (delta <= 0 && seatData.money > 0) {
        //如果用户不够一注的钱则只能allIn。
        //不能下注，只能跟注
        seatData.canGenzhu = true;
        seatData.canAddZhu = false;
    }
    if (p_money >= game.maxZhu) {
        seatData.canAddZhu = false;
    }
    if (!seatData.canAddZhu) {
        // opDict.ops = [];
        seatData.xiaZhuExtra = {};
        seatData.xiaZhuExtra.ops = [];
    }
    if (sendflag) {
        if (seatData.seatTurn == game.turn) {
            userMgr.sendMsg(seatData.userid, "game_actionChanged_push", userInfo_filter(seatData));
        }
    }
}

function checkCanBiPai(game, seatData, sendflag) {
    var oldFlag = seatData.canBiPai;
    //改变比牌资格
    //金额充足则可以比牌
    var b_money = _get_currentZhuNum(game);
    var b_d = seatData.money - b_money;
    if (b_d >= 0) {
        seatData.canBiPai = true;
    } else {
        seatData.canBiPai = false;
    }
    seatData.canBiPai = _oneHasCheckedPai(game) && seatData.canBiPai;
    //第一轮不能比牌
    if (game.circleCount < 1) {
        seatData.canBiPai = false;
    }
    if (seatData.canBiPai != oldFlag && sendflag) {
        //如果轮到自己了则发送推送信息
        if (seatData.seatTurn == game.turn) {
            // console.log("ly:看牌导致比牌的变化1111:", seatData.seatTurn);
            // console.log("ly:看牌导致比牌的变化2222:", seatData.seatTurn);
            userMgr.sendMsg(seatData.userid, "game_actionChanged_push", userInfo_filter(seatData));
        }
        //客户端可自行判断某人是否看过牌
        // _broacast(game, "game_biPaiStatusChanged_push", seatData.userid, seatData.userid, false);
    }
}

function circleCountEquelMax(game, next) {
    //反例：0,1,2,3 game.zhuang = 3; 假如zhuang退出，则playerNum = 3 next 取值范围只能是[0-2]
    //那么玩家可以无限次的比较了
    //引入座位号之后已解决上述问题
    if (next == game.zhuang) {
        game.circleCount++;
        var b_user_id = _userFromGame(game);
        if (b_user_id) {
            // console.log("ly:circleCount.push=>", game.circleCount);
            _broacast(game, 'game_circleCount_push', game.circleCount, b_user_id, true);
        }
    }
    var roomInfo = game.roomInfo;
    if (game.circleCount >= roomInfo.maxCircle) {
        //开始逆时针比牌
        Anti_clockwiseVS(game);
        return true;
    }
    return false;
}
//看牌
function checkPai(userid) {
    if (!userid) {
        console.log("checkPai:参数错误");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    //任何玩家在playing状态任何时刻都可以看牌
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("checkPai: seatData is invalid");
        return;
    }
    if (seatData.status != "playing") {
        //非法玩家的状态不能看牌
        console.log("checkPai: status is invalid");
        return;
    }
    if (seatData.hasCheckedPai) {
        console.log("checkPai: have checked");
        return;
    }
    seatData.hasCheckedPai = true;
    var userid = seatData.userid;
    //通知自己把手牌发给玩家。
    //注意只有在玩家check牌之后才将牌发给玩家
    //通知所有玩家
    // console.log(seatData.holds);
    userMgr.sendMsg(userid, 'game_checkPai_push', {
        holds: seatData.holds,
        currentZhu: seatData.currentZhu
    });
    _broacast(games[roomId], 'game_oneInCheckPai_push', userid, userid, true);
    checkCanBiPai(games[roomId], seatData, false); // false 表示同一组信息不发送两次
    _set_gen_add_flag(games[roomId], seatData, true)
}
//加注. 主需要传递增加的钱,但总和不能超过maxZhu
function addZhu(userid, money) {
    if (!userid) {
        return;
    }
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("genZhu: user is not in room");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (game.turn != seatData.seatTurn) {
        console.log("addZhu: not your turn.");
        return;
    }
    if (!seatData.canAddZhu) {
        console.log("addZhu: 不能加注");
        userMgr.sendMsg(userid, 'message_notify_push', {
            message: "不能加注"
        });
        return;
    }
    if (money > seatData.money) {
        return;
    }
    var addMoney = money * 1;
    var finalMoney = money;
    finalMoney = Math.floor(finalMoney);
    var flag_num = 1;
    if (!seatData.hasCheckedPai) {
        flag_num = 2;
    }
    if (finalMoney * flag_num < _get_currentZhuNum(game)) {
        console.log("加注的钱不够");
        return;
    }
    var scale = seatData.hasCheckedPai ? 1 : 0.5;
    var c_max = Math.floor(game.maxZhu * scale);
    finalMoney = finalMoney > c_max ? c_max : finalMoney;
    doAddMoney(userid, finalMoney, 1);
    var addZhuOps = game.addZhuOps; //暗注，加注的档次
    var addMoneyLevel = 0;
    for (var key in seatData.xiaZhuOptions) {
        var tv = seatData.xiaZhuOptions[key];
        if (tv >= money) {
            addMoneyLevel = key;
            break;
        }
    }
    _broacast(game, 'jiaZhu_notify_push', {
        userid: userid,
        currentZhu: finalMoney,
        hasCheckedPai: seatData.hasCheckedPai,
        addMoney: finalMoney,
        addMoneyLevel: addMoneyLevel,
    }, userid, true);
    //当一个玩家下完注之后
    //通知下一个可以下注的玩家
    _broacast(game, 'guo_notify_push', {
        userid: seatData.userid
    }, userid, true);
    moveToNextUser(game);
}

function doAllIn(userid) {
    if (!userid) {
        return;
    }
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("doAllIn: user is not in room");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (game.turn != seatData.seatTurn) {
        console.log("doAllIn: not your turn.");
        return;
    }
    //不能跟注的人，投入所有钱。
    //然后与所有人比牌
    //若牌最大，本局结束，否则本局弃牌
    doAddMoney(seatData.userid, seatData.money, 0);
    var winId = _getWinnerID(game);
    var others = _getPlayingUsers(game, seatData.userid);
    var data = {
        userid: seatData.userid,
        status: 0, //0是输了,1 赢了
        others: others
    };
    if (seatData.userid === winId) {
        for (var i = 0; i < game.gamePlayers.length; i++) {
            var dd = game.gamePlayers[i];
            if (dd.status == "playing" && dd.userid != winId) {
                doBeaten(dd.userid, true);
            }
        }
        data.status = 1;
    }
    _broacast(game, "game_sbInAllIn_push", data);
    game.sbInAllIn = null;
    game.sbInAllIn = data;
}
exports.doAllIn = doAllIn;

function _getPlayingUsers(game, userid) {
    var canBiUsers = [];
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var sd = game.gamePlayers[i];
        if (sd.status == "playing" && sd.userid != userid) {
            canBiUsers.push(sd.userid);
        }
    }
    return canBiUsers;
}

function allInActiveFromClient(userid) {
    // console.log('allInActiveFromClient',userid);
    if (!userid) {
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (!game) {
        console.log("_allInActiveFromClient: game invalid.");
        return;
    }
    if (!game.sbInAllIn) {
        return;
    }
    if (game.sbInAllIn.status == 0) {
        doBeaten(game.sbInAllIn.userid, true);
        moveToNextUser(game);
    } else {
        gameOver(game, game.sbInAllIn.userid);
    }
    game.sbInAllIn = null;
}
exports.allInActiveFromClient = allInActiveFromClient;

function genZhu(userid) {
    if (!userid) {
        return;
    }
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("genZhu: user is not in room");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (game.turn != seatData.seatTurn) {
        console.log("genZhu: not your turn.");
        return;
    }
    if (!seatData.canGenzhu) {
        console.log("genZhu: can not genZhu.");
        return;
    }
    var money = _get_currentZhuNum(game);
    if (!seatData.hasCheckedPai) {
        //暗跟 只需要跟一半的钱
        money = money * 0.5;
    }
    money = Math.floor(money);
    doAddMoney(userid, money, 0);
    var addZhuOps = game.addZhuOps; //暗注，加注的档次
    var addMoneyLevel = 0;
    for (var key in seatData.xiaZhuOptions) {
        var tv = seatData.xiaZhuOptions[key];
        if (tv >= money) {
            addMoneyLevel = key;
            break;
        }
    }
    var currentZhu = _get_currentZhuNum(game);
    _broacast(game, 'genZhu_notify_push', {
        userid: userid,
        currentZhu: currentZhu,
        hasCheckedPai: seatData.hasCheckedPai,
        addMoney: money,
        addMoneyLevel: addMoneyLevel,
    }, userid, true);
    //当一个玩家下完注之后
    //通知下一个可以下注的玩家
    _broacast(game, 'guo_notify_push', {
        userid: seatData.userid
    }, userid, true);
    moveToNextUser(game);
}
//获取当前最大注的明注价格
//注:获取当前最大注的唯一方法，通过game.currentZhu获取的最大注是不准确的
function _get_currentZhuNum(game) {
    //注意：这个方法返回的是明注的价格
    var money = game.currentZhu;
    if (game.anZhuFlag) {
        money *= 2;
    }
    return money;
}
//money 是明注的值
function _set_currentZhuNum(game, money, anFlag) {
    //比较的都是明注的价格
    var c_num = _get_currentZhuNum(game);
    if (money > c_num) {
        var scale = anFlag ? 0.5 : 1;
        game.currentZhu = Math.floor(money * scale);
        game.anZhuFlag = anFlag;
    }
}
//玩家加注
//type 0 , 1, 2
// 0: 跟注
// 1: 加注
// 2: 2是比牌花费 
function doAddMoney(userid, money, type) {
    if (type == 1) {
        console.log("ly:加注的钱:" + money);
    }
    //1)TODO 信息是否有效
    // 1.1  userid 是否有效
    // 1.1.1 当前用户的状态。 只有playing状态可以下注、加注、比牌
    // 1.1.2 是否轮到当前用户下注
    // 1.2  money 是否有效，是否超出玩家最大值。或者毎注最大值
    //      当玩家余额充足是否>=game.currentZhu
    // 1.3  如果玩家信息无效 直接return; 
    if (!userid || !money) {
        console.log("doAddMoney:Error: invalid arguments!");
        return;
    }
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("doAddMoney:Error. bad user info in current game!");
        return;
    }
    if (seatData.status != "playing") {
        console.log("doAddMoney: user cannot doAddMoney!");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (game.turn != seatData.seatTurn) {
        console.log("doAddMoney: not your turn.");
        return;
    }
    // if (money < game.currentZhu && money <= seatData.money) {
    //     console.log("doAddMoney: money is not enough");
    //     return;
    // }
    if (seatData.money <= 0) {
        //没钱了
        console.log("doAddMoney: money is not enough");
        return;
    }
    //这个地方不修改任何属性
    if (money >= seatData.money) {
        money = seatData.money;
    }
    //2)信息校验完成
    // 2.1 扣除玩家的金币
    seatData.money -= money;
    seatData.costMoney += money;
    _db_cost_money(userid, money, game.consumeType);
    if (!seatData.hasCheckedPai) {
        seatData.an_cost += money;
    } else {
        seatData.ming_cost += money;
    }
    if (type && type == 1) {
        var scale = seatData.hasCheckedPai ? 1 : 2;
        var z_m = money * scale;
        _set_currentZhuNum(game, z_m, !seatData.hasCheckedPai);
    }
    //将注加入到现金池
    game.moneyPool += money;
    //ly:测试
    var roomInfo = roomMgr.getRoom(roomId);
    roomInfo.userDatas[userid].money = seatData.money;
    //记录当前操作
    //通知各个玩家当前游戏人员池子中的金额
    // a. 搜集玩家可以知道的公共信息
    var commonInfoDict = {};
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var ddd = game.gamePlayers[i];
        var userid = ddd.userid;
        commonInfoDict[userid] = {};
        commonInfoDict[userid].costMoney = ddd.costMoney;
        commonInfoDict[userid].money = ddd.money;
        commonInfoDict[userid].status = ddd.status;
        commonInfoDict[userid].allInFlag = ddd.allInFlag;
    }
    userMgr.sendMsg(seatData.userid, "game_myMoney_push", {
        restMoney: seatData.money
    });
    _broacast(game, 'game_moneyPool_push', {
        moneyPool: game.moneyPool,
        commonInfo: commonInfoDict
    }, userid, true);
}
//判断是否正在游戏
exports.isPlaying = function(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (!seatData) {
        return false;
    }
    if (seatData.status == "playing") {
        return true;
    }
    return false
}

function moveToNextUser(game, nextSeat) {
    //找到下一个正在playing的玩家
    if (nextSeat == null) {
        var next = game.turn;
        // console.log("ly:game.turn=>", game.turn);
        // console.log("ly:game.turn2=>", game.seats);
        while (true) {
            next++;
            next %= game.seats.length;
            if (circleCountEquelMax(game, next)) {
                return;
            }
            var seat = game.seats[next];
            if (!seat.info) {
                continue;
            }
            var turnSeat = seat.info;
            //也要有足够的金钱才有话语权
            if (turnSeat.status == "playing" && next != game.turn) {
                game.turn = next;
                nextUserCanOperation(game);
                return;
            }
            if (next == game.turn) {
                //循环一圈没有找到满座条件的下一家。 
                //结束，逆时针比牌
                Anti_clockwiseVS(game);
                return;
            }
        }
    } else {
        game.turn = nextSeat;
    }
}

function _getWinnerID(game) {
    //先删除定时器
    roomMgr.deleteSetTimeOut(game);
    var taa = [];
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var ts = game.gamePlayers[i];
        if (ts.status == "playing") {
            taa.push(ts);
        }
    }
    if (taa.length >= 2) {
        var winner_uid = null;
        var b_total = [];
        for (var i = 0; i < taa.length; i++) {
            var t0 = taa[i];
            if (t0.status != "playing") {
                continue;
            }
            var t1 = null;
            if (!winner_uid && (i + 1) < taa.length) {
                t1 = taa[i + 1];
            } else if (winner_uid) {
                t1 = gameSeatsOfUsers[winner_uid];
            }
            if (!t1 || !t0) {
                continue;
            }
            if (t0.userid == t1.userid) {
                continue;
            }
            var s0 = utils.holds_score(t0.holds);
            var s1 = utils.holds_score(t1.holds);
            var value = utils.compareHolds(s0, s1);
            if (value == 0) {
                //s0赢了
                winner_uid = t0.userid;
            } else {
                //s1 赢了
                winner_uid = t1.userid;
            }
            var loser_uid = winner_uid == t0.userid ? t1.userid : t0.userid;
            var dict = {
                fromUserid: t0.userid,
                toUserid: t1.userid,
                winUserid: winner_uid,
                loseUserid: loser_uid
            };
            b_total.push(dict);
        };
        // console.log("ly:自动比牌结束:", b_total);
        return winner_uid;
    }
}
//逆时针比牌
function Anti_clockwiseVS(game) {
    //先删除定时器
    roomMgr.deleteSetTimeOut(game);
    var taa = [];
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var ts = game.gamePlayers[i];
        if (ts.status == "playing") {
            taa.push(ts);
        }
    }
    if (taa.length >= 2) {
        var winner_uid = null;
        var b_total = [];
        for (var i = 0; i < taa.length; i++) {
            var t0 = taa[i];
            if (t0.status != "playing") {
                continue;
            }
            var t1 = null;
            if (!winner_uid && (i + 1) < taa.length) {
                t1 = taa[i + 1];
            } else if (winner_uid) {
                t1 = gameSeatsOfUsers[winner_uid];
            }
            if (!t1 || !t0) {
                continue;
            }
            if (t0.userid == t1.userid) {
                continue;
            }
            var s0 = utils.holds_score(t0.holds);
            var s1 = utils.holds_score(t1.holds);
            var value = utils.compareHolds(s0, s1);
            if (value == 0) {
                //s0赢了
                winner_uid = t0.userid;
                doBeaten(t1.userid, true);
            } else {
                //s1 赢了
                winner_uid = t1.userid;
                doBeaten(t0.userid, true);
            }
            var loser_uid = winner_uid == t0.userid ? t1.userid : t0.userid;
            var dict = {
                fromUserid: t0.userid,
                toUserid: t1.userid,
                winUserid: winner_uid,
                loseUserid: loser_uid
            };
            b_total.push(dict);
        };
        // console.log("ly:自动比牌结束:", b_total);
        _broacast(game, "game_AntiResults_push", b_total, winner_uid, true);
    }
    if (gameWillOver(game)) {
        return;
    };
}
//两两比牌
function userVSuser(userid1, userid2) {
    if (!userid1 || !userid2) {
        console.log("userVSuser:Error:arguments is invalid!");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid1);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    var sd0 = gameSeatsOfUsers[userid1];
    if (!sd0 || game.turn != sd0.seatTurn) {
        console.log("userVSuser: not your turn.");
        return;
    }
    var sd1 = gameSeatsOfUsers[userid2];
    if (!(sd0.canBiPai) || !sd1) {
        console.log("userVSuser: cannot satisfy the condition");
        return;
    }
    if (!(sd0.status == "playing" && sd1.status == "playing")) {
        console.log("uVu: one or two not in playing");
        return;
    }
    //扣除两倍的金钱
    //当前注保持不变
    var needMoney = _get_currentZhuNum(game);
    needMoney = Math.floor(needMoney);
    doAddMoney(userid1, needMoney, 2);
    //通知玩家比牌开始
    userMgr.sendMsg(userid1, "game_bipai_push");
    _broacast(game, 'game_userInBipai_push', {
        from: userid1,
        to: userid2
    }, userid1, true);
    sd0.score = utils.holds_score(sd0.holds);
    sd1.score = utils.holds_score(sd1.holds);
    var value = utils.compareHolds(sd0.score, sd1.score);
    var loser_userid = userid1;
    var winer = userid2;
    if (value == 0) {
        winer = userid1;
        loser_userid = userid2;
    }
    var loseSeat = gameSeatsOfUsers[loser_userid];
    //出结果了。通知自己，通知对手
    //通知其他人
    _broacast(game, 'game_userInBipai_result_push', {
        from: userid1,
        to: userid2,
        winer: winer,
        loser: loser_userid,
        currentCircle: game.circleCount,
        loser_holds: loseSeat.holds
    }, userid1, true);
    //将输的玩家status设置为losed;
    doBeaten(loser_userid);
    var winSD = gameSeatsOfUsers[winer];
    if (winSD) {
        checkCanBiPai(game, winSD, true);
    }
    //如果是当前玩家输了 
    //移动到下一家
    if (loser_userid == userid1) {
        moveToNextUser(game);
    } else {
        //如果是当前玩家赢了
        _initCounter(game, userid1);
    }
}
exports.userVSuser = userVSuser;

function gameWillOver(game) {
    //为什么要在这个地方删除定时器。在这个地方删除应该是不对的。
    // roomMgr.deleteSetTimeOut(game);
    var count = 0;
    var final_userid = null;
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var ddd = game.gamePlayers[i];
        if (ddd.status == "playing") {
            count++;
            final_userid = ddd.userid;
        }
    }
    if (count < 2) {
        //只剩下一个玩家
        //或者
        //没有玩家了
        //没有玩家了指的是所有玩家突然掉线
        gameOver(game, final_userid);
        return true;
    }
    return false;
}

function gameOver(game, f_userid) {
    var roomid = roomMgr.getUserRoom(f_userid);
    var roomInfo = roomMgr.getRoom(roomid);
    if (f_userid) {
        if (game.circleCount == roomInfo.maxCircle) {
            // console.log("ly:游戏结束,且达到最大輪数");
            _broacast(game, 'game_lastCircle_push', {
                circleCount: game.circleCount,
                maxCircle: roomInfo.maxCircle
            }, f_userid, true);
        }
        //通知自己赢了
        //通知所有玩家谁赢了。并向他们 展示我的牌
        var w_sd = gameSeatsOfUsers[f_userid];
        console.log("ly:winUser_*", w_sd.userid, w_sd.holds);
        w_sd.money += game.moneyPool;
        _db_win_money(f_userid, game.moneyPool, game.consumeType);
        roomInfo.userDatas[f_userid].money = w_sd.money;
        userMgr.sendMsg(f_userid, "game_myWin_push", {
            winer: f_userid,
            holds: w_sd.holds
        });
        _broacast(game, 'game_oneInWin_push', {
            moneyPool: game.moneyPool,
            winer: f_userid,
            holds: w_sd.holds
        }, f_userid, true);
        roomInfo.nextUid = f_userid;
        game.turn = w_sd.seatTurn;
        game.moneyPool = 0;
        // //当前游戏结束，选择下一个人坐庄
        // if (!_nextCanZhuang(game)) {
        //     roomInfo.nextUid = f_userid;
        //     game.turn = w_sd.seatTurn;
        // }
    }
    if (roomInfo) {
        for (var i = 0; i < game.gamePlayers.length; i++) {
            var player = game.gamePlayers[i];
            roomInfo.userDatas[player.userid].money = player.money;
        }
    }
    game.moneyPool = 0;
    var commonInfoDict = {};
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        var userid = dd.userid;
        commonInfoDict[userid] = {};
        commonInfoDict[userid].costMoney = 0;
        commonInfoDict[userid].money = dd.money;
        commonInfoDict[userid].isAllinFlag = dd.money <= 0;
        commonInfoDict[userid].status = dd.status;
    }
    //发送通知
    var b_user_id = _userFromGame(game);
    if (b_user_id) {
        _broacast(game, 'game_moneyPool_push', {
            moneyPool: game.moneyPool,
            commonInfo: commonInfoDict
        }, b_user_id, true);
    }
    //踢出掉线的玩家
    _checkSocketValid(game);
    //剔除没钱的玩家
    checkSeatMoney(game);
    _set_roomIsWaiting(game);
    _broacast(game, 'gameOver_notify_push', f_userid, f_userid, true);
    if (game.playerNum < 2) {
        //TODO 
        // 等待足够的玩家>=2
        // roomInfo.isWaiting = true;
        _broacast(game, "game_waitForRoom_push", f_userid, f_userid, true);
    } else if (game.playerNum < 1) {
        //TODO 
        //解散房间
        // roomInfo.isWaiting = true;
    }
    if (!roomInfo || !roomInfo.seats) {
        return;
    }
    //玩家的等待状态设置为false
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        if (s.ready == true) {
            s.ready = false;
        }
    }
}

function _checkSocketValid(game) {
    var roomInfo = game.roomInfo;
    for (var i = game.gamePlayers.length - 1; i >= 0; i--) {
        var ddd = game.gamePlayers[i];
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
            giveUp_game(uid);
            roomMgr.exitRoom(uid);
            _broacast(game, 'exit_notify_push', uid, uid, false);
        }
    }
}

function allActionsGuo(userid) {
    console.log("ly:时间到了", userid);
    if (!userid) {
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    if (!game) {
        return;
    }
    qiPai(userid);
}
exports.allActionsGuo = allActionsGuo;
//弃牌
function qiPai(userid) {
    //任何人在任何时候(除了比牌的时候)都可以认输
    if (!userid) {
        console.log("doBeaten:Error: arguments is invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData) {
        console.log("doBeaten:Error: user is invalid");
        return;
    }
    doBeaten(userid, true, true);
    if (gameWillOver(game)) {
        return;
    };
    //如果弃牌的是当前用户
    if (game.turn == seatData.seatTurn) {
        //如果是轮询玩家弃牌，则通知下一家操作
        _broacast(game, 'guo_notify_push', {
            userid: seatData.userid
        }, seatData.userid, true);
        moveToNextUser(game);
    }
}
//认输
//参数1:
//参数2：是否需要检验游戏是否结束
//参数3:是否是主动弃牌
function doBeaten(userid, noNeedFlag, isZhuDong) {
    //任何人在任何时候(除了比牌的时候)都可以认输
    if (!userid) {
        console.log("doBeaten:Error: arguments is invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    var seatData = gameSeatsOfUsers[userid];
    //认输之后不能比牌，不能下注
    seatData.canBiPai = false;
    seatData.canAddZhu = false;
    seatData.canGenzhu = false;
    seatData.status = "losed";
    //通知自己。将某些操作隐藏
    //通知其他玩家告知状态;
    var status = isZhuDong ? "qi" : "shu";
    var sdict = {
        holds: seatData.holds,
        status: status,
        userId: userid
    };
    userMgr.sendMsg(userid, "game_losed_push", sdict);
    console.log("ly:doBeaten_*", userid, seatData.holds);
    seatData.holds = [];
    _broacast(game, 'game_userInlosed_push', sdict, userid, false);
    if (!noNeedFlag) {
        //检测活着的玩家的数量，若玩家的数量为1
        //则gameOver 剩下的一家是赢家
        if (gameWillOver(game)) {
            return;
        };
    }
}
//点击比牌按钮
function wannaToComparePai(userid) {
    //任何人在任何时候(除了比牌的时候)都可以认输
    if (!userid) {
        console.log("wannaToComparePai:Error: arguments is invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var game = games[roomId];
    var seatData = gameSeatsOfUsers[userid];
    if (!seatData || !seatData.canBiPai) {
        return;
    }
    if (game.turn != seatData.seatTurn) {
        console.log("wannaToComparePai: not your turn.");
        return;
    }
    // console.log("ly:dd.status000:main=>", seatData.status);
    // console.log("ly:dd.seatTurn000:main=>", seatData.seatTurn);
    if (seatData.hasCheckedPai) {
        //如果玩家看过牌了。那么其他playing状态的玩家均可以作为他的对手
        //挑选可供比牌的对手
        var enemies = [];
        for (var i = 0; i < game.gamePlayers.length; i++) {
            var dd = game.gamePlayers[i];
            // console.log("ly:dd.status111=>", dd.status);
            // console.log("ly:dd.seatTurn111=>", dd.seatTurn);
            if (dd.status == "playing") {
                if (dd.seatTurn != seatData.seatTurn) {
                    enemies.push(userInfo_filter(dd));
                }
            }
        }
        if (enemies.length < 1) {
            //没有满足条件的对手
            console.log("没有满足条件的对手");
        }
        //通知自己我想要比牌了
        //唤醒前端比牌UI
        userMgr.sendMsg(userid, "game_wannaToCompare_push", enemies);
    } else {
        //如果玩家没有看过牌，挑选已经看过牌的选手作为对手
        //挑选可供比牌的对手
        var enemies = [];
        for (var i = 0; i < game.gamePlayers.length; i++) {
            var dd = game.gamePlayers[i];
            // console.log("ly:dd.status222=>", dd.status);
            // console.log("ly:dd.seatTurn222=>", dd.seatTurn);
            if (dd.status == "playing" && dd.hasCheckedPai) {
                if (dd.seatTurn != seatData.seatTurn) {
                    // console.log("ly****");
                    enemies.push(userInfo_filter(dd));
                    // console.log("ly****=>", userInfo_filter(dd));
                }
            }
        }
        if (enemies.length < 1) {
            //没有满足条件的对手
            console.log("没有满足条件的对手");
        }
        //通知自己我想要比牌了
        //唤醒前端比牌UI
        userMgr.sendMsg(userid, "game_wannaToCompare_push", enemies);
    }
}

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

function userInfo_filter(dd) {
    var tt = deepCopy(dd);
    delete tt.holds;
    delete tt.score;
    delete tt.game;
    return tt;
}

function exit_room(userid) {
    //退出房间
    //如果玩家在房间中等待退出房间
    if (!userid) {
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo.waitingUsers[userid]) {
        delete roomInfo.waitingUsers[userid];
    }
    console.log("exit_room:", roomInfo.userDatas[userid]);
}
// function removeByValue(arr, val) {
//   for(var i=0; i<arr.length; i++) {
//     if(arr[i] == val) {
//       arr.splice(i, 1);
//       break;
//     }
//   }
// }
function exit_game(userid) {
    //如果当前用户已经在游戏中
    //如果玩家状态是playing 那么调用弃牌的方法
    if (!userid) {
        return;
    }
    console.log("exit_game.beigin", userid);
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        console.log("exit_game:roomId:", userid);
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    var index = roomInfo.users.indexOf(userid);
    if (index > -1) {
        roomInfo.users.splice(index, 1);
    }
    console.log("exit_game:roomInfo.users:", roomInfo.users);
    var sd = gameSeatsOfUsers[userid];
    if (!sd) {
        return;
    }
    var game = games[roomId];
    //如果玩家不在游戏中return
    if (game) {
        var index = -1;
        for (var i = game.gamePlayers.length - 1; i >= 0; i--) {
            var dd = game.gamePlayers[i];
            if (dd.userid == userid) {
                index = i;
                break;
            }
        }
        if (index > -1 && sd.seatIndex > -1) {
            //用户退出之后，将座位上的信息清空
            var seat = game.seats[sd.seatIndex];
            if (!seat) {
                return;
            }
            seat.info = null;
            // console.log("ly:sd",sd);
            if (sd.status == "playing") {
                // console.log("ly:hahahahh");
                qiPai(userid);
            }
            game.gamePlayers.splice(index, 1);
            //玩家的数目-1
            game.playerNum--;
            //如果退出的玩家是轮询的玩家，且当前游戏的人数>=2 移到下一家
            if (game.turn == sd.seatTurn && game.playerNum >= 2) {
                // console.log("ly:我退出了：", game.turn);
                moveToNextUser(game);
            }
            if (game.playerNum <= 1) {
                _set_roomIsWaiting(game);
            }
        }
    }
    delete gameSeatsOfUsers[userid];
}

function _set_roomIsWaiting(game) {
    var roomInfo = game.roomInfo;
    console.log("ly:_set_roomIsWaiting");
    // console.log('game.gamePlayers', game.gamePlayers);
    // console.log('roomInfo', roomInfo);
    if (game.gamePlayers.length == 1 && game.conf.creator == 'match') {
        // setTimeout(function() {
        var losers = [];
        if (roomInfo.noMoneyArr) {
            for (var i in roomInfo.noMoneyArr) {
                var temp = roomInfo.noMoneyArr[i];
                if (losers.indexOf(temp) == -1) {
                    losers.push(temp);
                }
            }
        }
        console.log('loser', losers);
        var winer_id = null;
        var userDatas = roomInfo.userDatas;
        if (userDatas) {
            for (var i in userDatas) {
                var userid = parseInt(i);
                if (losers.indexOf(userid) == -1) {
                    //如果不在没钱的数组里,则是胜利者
                    winer_id = userid;
                }
            }
        }
        var sendData = {
            winer: JSON.stringify(winer_id),
            loser: JSON.stringify(losers),
            type: '1'
        };
        console.log('sendData====>', sendData);
        roomInfo.sendData = sendData;
        _dealJbsToNext(roomInfo);
        return;
    }
    //删除倒计时定时器
    roomMgr.deleteSetTimeOut(game);
    roomInfo.isWaiting = true;
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        dd.status = "isWaiting";
    }
}

function giveUp_game(userid) {
    var roomId = roomMgr.getUserRoom(userid);
    //系统踢出或者主动放弃当前游戏
    //三个地方需要删除
    //room 信息中。下一局开始时不再有这个用户
    //gameSeatsOfUsers 中。
    //game.gamePlayers 对应的index,
    //玩家的数目-1;
    //当玩家的数量<2, 解散当前房间 
    if (!userid) {
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (!roomId) {
        return;
    }
    exit_game(userid);
    exit_room(userid);
    var game = games[roomId];
    _broacast(game, "game_someOneGiveUp_push", userid, userid, true);
}
exports.giveUp_game = giveUp_game;
exports.kanpai = function(userid) {
    checkPai(userid);
}
exports.qiPai = function(userid) {
    qiPai(userid);
};
exports.genzhu = function(userid) {
    genZhu(userid);
};
exports.addzhu = function(userId, num) {
    addZhu(userId, num);
}
// ready踢出所有socket断开的玩家。
function _readySocketInvalid(roomInfo) {
    for (var i = 0; i < roomInfo.seats.length; ++i) {
        var s = roomInfo.seats[i];
        var uid = s.userId;
        if (!userMgr.socketIsValid(uid) && uid > 0) {
            //socket 无效
            console.log("检测到一个socket失效", uid);
            if (roomInfo.conf.creator == 'match' && roomInfo.noMoneyArr.indexOf(uid) == -1) {
                roomInfo.noMoneyArr.push(uid); //锦标赛里失败的人数是从noMoneyArr里取的，所以，踢出的时候要把他算在noMoneyArr里
            }
            //注意此时不能调用 userMgr 因为此时socket已经不存在了。 只需退出房间即可
            roomMgr.exitRoom(uid);
            userMgr.broacastInfo("exit_notify_push", uid, roomInfo);
        }
    }
}
exports.setReady = function(userId, callback) {
    console.log('setReady--准备完毕，userId', userId);
    var roomId = roomMgr.getUserRoom(userId);
    console.log('扎金花准备，roomId=', roomId);
    if (roomId == null) {
        return;
    };
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    };
    roomMgr.setReady(userId, true);
    var game = games[roomId];
    if (game && !roomInfo.isWaiting) {
        //若game有效，且房间不是挂起状态(roomInfo.isWaiting == flase)
        //说明玩家是中途加入，此时不需要开始新的游戏
        return;
    };
    if (game != null) {
        game = null;
    };
    if (game == null) {
        // console.log('roomInfo.seats', roomInfo.seats);
        if (roomInfo.seats.length == 5) {
            var flag = 0;
            var x = 0;
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                console.log('userMgr.isOnline(s.userId)', userMgr.isOnline(s.userId));
                /*if (s.ready == false || userMgr.isOnline(s.userId) == false) {
                    return;
                }*/
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
            //5个人到齐了，并且都准备好了，则开始新的一局
            console.log('roomInfo.enough_num===>', roomInfo.enough_num);
            var enough_num = 2;
            if (roomInfo.enough_num) {
                //锦标赛设置人数满了才开始
                enough_num = roomInfo.enough_num;
            }
            console.log('flag >= enough_num', (flag >= enough_num));
            if (flag >= enough_num) {
                _readySocketInvalid(roomInfo);
                if (roomInfo["begin_timer"] == null) {
                    roomInfo["begin_timer"] = setInterval(function() {
                        userMgr.broacastInRoom('count_down_push', {
                            userid: userId,
                            countDown: roomInfo.num
                        }, userId, true);
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
    } else {
        //TODO 断线重连后的数据对接
        /*var numOfMJ = game.mahjongs.length - game.currentIndex;
        var remainingGames = roomInfo.conf.maxGames - roomInfo.numOfGames;
        var data = {
            state: game.state,
            numofmj: numOfMJ,
            button: game.button,
            turn: game.turn,
            chuPai: game.chuPai,
            huanpaimethod: game.huanpaiMethod
        };
        data.seats = [];
        var seatData = null;
        for (var i = 0; i < 4; ++i) {
            var sd = game.gameSeats[i];
            var s = {
                userid: sd.userId,
                folds: sd.folds,
                angangs: sd.angangs,
                caiShen: sd.caiShen,
                diangangs: sd.diangangs,
                wangangs: sd.wangangs,
                pengs: sd.pengs,
                extraPais: sd.extraPais,
                chis: sd.chis,
                que: sd.que,
                hued: sd.hued,
                iszimo: sd.iszimo,
                tinged: sd.tinged
            }
            if (sd.userId == userId) {
                s.holds = sd.holds;
                s.huanpais = sd.huanpais;
                seatData = sd;
            }
            data.seats.push(s);
        }
        //同步整个信息给客户端
        userMgr.sendMsg(userId, 'game_sync_push', data);
        sendOperations(game, seatData, game.chuPai);*/
    }
};
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
//处理锦标赛进入下一轮
function _dealJbsToNext(roomInfo) {
    console.log('_dealJbsToNext');
    console.log('roomInfo', roomInfo);
    // setTimeout(function() {
    if (roomInfo && roomInfo.sendData && roomInfo.conf.creator == 'match') {
        var sendData = roomInfo.sendData;
        console.log('sendData', sendData);
        http_service.sendToHall("/next_trun_match", sendData, function(ret, data) {
            console.log('next_trun_match callback', data);
            if (data && data.exit_users) {
                for (var i in data.exit_users) {
                    _secondsExit(data.exit_users[i], 4); //4秒钟后退出
                }
            }
        });
    }
    // }, 3100); //得在踢完人之后判断
};
//从game中获取有效的user_id 如果没有 返回 null
function _userFromGame(game) {
    if (!game) {
        return null;
    }
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        if (dd) {
            return dd.userid;
        }
    }
    return null;
};
//消息发送
//string 消息字符串
//data 包含的数据
//flag 是否包含自己,只有当第3个参数有效，该参数才是有效的
function _broacast(game, string, data, userid, flag) {
    var roomId = null;
    if (userid) {
        roomId = roomMgr.getUserRoom(userid);
    }
    if (!roomId) {
        //如果可以依据当前的userid 找到roomId
        //则视为userid 有效，否则视为无效
        //此时roomId非法=>userid非法,flag强制为true
        userid = _userFromGame(game);
        flag = true;
    }
    if (userid == null) {
        //找不到有效的信息return;
        //表示该房间没有活着的用户，无需再广播消息
        return;
    }
    userMgr.broacastInRoom(string, data, userid, flag);
    // userMgr.broacastInfo(string, data, game.roomInfo);
}
//使用userid获取用户的信息，主要用于断线重连
function getUserInfoByUserid(userid) {
    if (!userid) {
        console.log("_getUserInfoByUserid: userid is invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (roomId == null) {
        console.log("_getUserInfoByUserid: roomId is invalid");
        return;
    }
    var game = games[roomId];
    if (!game) {
        console.log("_getUserInfoByUserid: game is invalid");
        return;
    }
    var data = _userFromGameByID(game, userid);
    if (data) {
        if (data.seatTurn != game.turn) {
            //若断线重连后不该我说话，则将一些属性置为false;
            data.canAddZhu = false;
            data.canBiPai = false;
            data.canGenzhu = false;
        }
    }
    // console.log("getUserInfoByUserid:data:", data);
    userMgr.sendMsg(userid, 'game_userInfoById_push', data);
}
exports.getUserInfoByUserid = getUserInfoByUserid;
//使用userid获取当前游戏的信息，主要用于断线重连
function getGameInfoByUserid(userid) {
    if (!userid) {
        console.log("getGameInfo: userid is invalid");
        return;
    }
    var roomId = roomMgr.getUserRoom(userid);
    if (roomId == null) {
        console.log("getGameInfo: roomId is invalid");
        return;
    }
    var game = games[roomId];
    if (!game) {
        console.log("getGameInfo: game is invalid");
        return;
    }
    var infos = {};
    infos.players = [];
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        if (dd) {
            infos.players.push(userInfo_filter(dd));
        }
    }
    infos.moneyPool = game.moneyPool;
    infos.circleCount = game.circleCount;
    infos.gameIndex = game.gameIndex;
    infos.playerNum = game.playerNum;
    infos.currentIndex = game.currentIndex;
    infos.turn = game.turn;
    infos.actionList = game.actionList;
    infos.baseMoney = game.baseMoney;
    infos.zhuang = game.zhuang;
    infos.currentZhu = game.currentZhu;
    infos.anZhuFlag = game.anZhuFlag;
    infos.pingZhuFlag = game.pingZhuFlag;
    infos.maxZhu = game.maxZhu;
    infos.maxCircle = game.maxCircle;
    infos.waitingUsers = game.roomInfo.waitingUsers;
    infos.consumeType = game.consumeType;
    // console.log("getGameInfoByUserid:infos:", infos);
    userMgr.sendMsg(userid, 'game_gameInfoById_push', infos);
}
exports.getGameInfoByUserid = getGameInfoByUserid;

function _userFromGameByID(game, userid) {
    if (!game || !userid) {
        return null;
    }
    for (var i = 0; i < game.gamePlayers.length; i++) {
        var dd = game.gamePlayers[i];
        if (dd.userid == userid) {
            var data = userInfo_filter(dd);
            if (dd.hasCheckedPai) {
                data.holds = dd.holds;
            }
            return data;
        }
    }
    return null;
}
//数据库操作
//花掉的钱
function _db_cost_money(userid, money, consume_type) {
    if (!money || !userid) {
        return;
    }
    money = Math.floor(money);
    var sd = gameSeatsOfUsers[userid];
    if (sd) {
        if (!sd.costArr) {
            sd.costArr = [];
        }
        sd.costArr.push(money);
    }
    _db_money_op(userid, money, consume_type);
}
//赢取的钱
function _db_win_money(userid, money, consume_type) {
    if (!money || !userid) {
        return;
    }
    money = Math.floor(money);
    money *= -1;
    _db_money_op(userid, money, consume_type);
}

function _db_money_op(userid, money, consume_type) {
    if (consume_type == 'score') return;
    db.cost_gems_or_coins(userid, money, consume_type, function(o) {
        if (o) {
            use_money_logs(userid, money, consume_type, 'zjh');
        }
    });
}
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}
exports.wannaToComparePai = function(userid) {
    wannaToComparePai(userid);
}