var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var mjutils = require('./mjutils');
var gameutils = require('./gameutils');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var http_service = require('./http_service');
var games = {};
var gamesIdBase = 0;
// 麻将总数144张 筒 万 条 各36张 风头28张（东西南北中发白）花牌8张 梅兰菊竹 春夏秋冬
var ALLMJCOUNT = 144;
var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;
var ACTION_CHI = 7;
var ACTION_CAISHEN = 8;
var gameSeatsOfUsers = {};
// 获得吃牌的多余手牌
function getExtraByChiArray(chiInfo, target) {
    if (target == null || target.length <= 0) {
        return null;
    }
    var targetInfo = JSON.stringify(target.sort());
    for (var i = 0; i < chiInfo.length; i++) {
        var obj = chiInfo[i];
        var chiArray = JSON.stringify(obj.chi.sort());
        if (targetInfo === chiArray) {
            return obj.extra;
        }
    }
}
//检查是否可以明杠
function checkCanDianGang(game, seatData, targetPai) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    // console.log("检查是否可以杠牌", seatData.holds, targetPai);
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 3) {
        var targetArray = [targetPai, targetPai, targetPai];
        //clone tingMap
        var tingMap_clone = {};
        for (var i in seatData.tingMap) {
            tingMap_clone[i] = seatData.tingMap[i];
        }
        // 先移除对应的目标手牌
        seatData.holds = mjutils.removeFromArray(seatData.holds, targetArray);
        seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
        seatData.tingMap = {};
        // checkCanTingPai(seatData);
        console.log('seatData.tingMap====>', seatData.tingMap);
        var flag = mjutils.judgeTingPai(seatData, 0, 34);
        if (flag) {
            seatData.canGang = true;
        }
        // 移除手牌后，一定要还原
        seatData.holds = mjutils.revertToOrigin(seatData.holds, targetArray);
        seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
        seatData.tingMap = tingMap_clone;
        console.log('after seatData.tingMap====>', seatData.tingMap);
        // 如果可以杠，不允许吃
        if (seatData.gangPai.indexOf(targetPai) == -1) {
            seatData.gangPai.push(targetPai);
        }
        return;
    }
}
//检查是否可以暗杠
function checkCanAnGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    if (seatData.tinged) {
        //已经听牌了,就不需要再进行判断了。
        return;
    }
    for (var key in seatData.countMap) {
        var pai = parseInt(key);
        var c = seatData.countMap[key];
        if (c != null && c == 4) {
            seatData.canGang = true;
            if (seatData.gangPai.indexOf(pai) == -1) {
                seatData.gangPai.push(pai);
            }
        }
    }
}
// 是否可以和牌 ,如果胡一张牌,单吊一张
function checkCanHu(game, seatData, targetPai) {
    // console.log('检查是否可以胡牌,');
    var huCnt = 0;
    seatData.canHu = false;
    for (var k in seatData.tingMap) {
        huCnt = huCnt + 1;
        if (targetPai == k) {
            seatData.canHu = true;
            // 如果胡的是五万,为捉五魁
            if (targetPai == 22 && Object.keys(seatData.tingMap).length == 1) {
                seatData.zhuoWuKui = true;
            }
            /*if (seatData.countMap[targetPai] == 3) {
                seatData.isFourOne = true;
            }*/
            if (mjutils.checkHuBigSevenParis(seatData, targetPai)) {
                seatData.isHaoQiDui = true;
            }
        }
    }
    seatData.huCnt = huCnt;
    console.log("玩家可以胡的牌的数量", seatData.huCnt);
}
// 清空所有操作
function clearAllOptions(game, seatData) {
    var fnClear = function(sd) {
        sd.canPeng = false;
        sd.canGang = false;
        sd.canChi = false;
        sd.gangPai = [];
        sd.canHu = false;
        sd.lastFangGangSeat = -1;
    }
    if (seatData) {
        fnClear(seatData);
    } else {
        game.qiangGangContext = null;
        for (var i = 0; i < game.gameSeats.length; ++i) {
            fnClear(game.gameSeats[i]);
        }
    }
}
//检查听牌
function checkCanTingPai(seatData) {
    // console.log("玩家的信息", seatData);
    console.log("checkcantingpai", seatData.holds);
    seatData.tingMap = {};
    //检查手上的牌是不是还有财神，如果有则不能胡牌
    if (mjutils.checkCaiShen(seatData)) {
        // console.log("还有财神,肯定不能听牌的");
        return;
    }
    // console.log('听七小对');
    // 听七小对
    if (mjutils.checkTingSevenParis(seatData)) {
        // console.log('checkTingSevenParis', seatData.tingMap);
        return;
    }
    // 听十三幺
    if (mjutils.checkTingThirty(seatData)) {
        // console.log('checkTingThirty', seatData.tingMap);
        return;
    }
    //检查是否是对对胡  由于四川麻将没有吃，所以只需要检查手上的牌
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    var singleCount = 0;
    var colCount = 0;
    var pairCount = 0;
    var arr = [];
    for (var k in seatData.countMap) {
        var c = seatData.countMap[k];
        if (c == 1) {
            singleCount++;
            arr.push(k);
        } else if (c == 2) {
            pairCount++;
            arr.push(k);
        } else if (c == 3) {
            colCount++;
        } else if (c == 4) {
            //手上有4个一样的牌，在四川麻将中是和不了对对胡的 随便加点东西
            singleCount++;
            pairCount += 2;
        }
    }
    if ((pairCount == 2 && singleCount == 0) || (pairCount == 0 && singleCount == 1)) {
        for (var i = 0; i < arr.length; ++i) {
            //对对胡1番
            var p = arr[i];
            if (seatData.tingMap[p] == null) {
                seatData.tingMap[p] = {
                    pattern: "duidui",
                    fan: 1
                };
            }
        }
    }
    //检查是不是平胡
    mjutils.checkTingPai(seatData, 0, 34);
}
//获取玩家座位id
function getSeatIndex(userId) {
    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }
    return seatIndex;
}
// 获取游戏对象根据玩家id
function getGameByUserID(userId) {
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return null;
    }
    var game = games[roomId];
    return game;
}
// 判断是否有操作
function hasOperations(seatData) {
    // console.log('hasOperations!--canGang', seatData.canGang);
    // console.log('hasOperations!--peng', seatData.canPeng);
    // console.log('hasOperations!--chi', seatData.canChi);
    // console.log('hasOperations!--hu', seatData.canHu);
    if (seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi) {
        return true;
    }
    return false;
}
// 发送操作
function sendOperations(game, seatData, pai) {
    // console.log('ly:***sendOperation ');
    if (hasOperations(seatData)) {
        if (pai == -1) {
            pai = seatData.holds[seatData.holds.length - 1];
        }
        var chiArrayInfo = [];
        var chiInfo = [];
        if (seatData.canChi) {
            chiInfo = gameutils.getChiExtraPai(seatData, pai);
            console.log('可以吃牌,吃牌的组合是', chiInfo);
        }
        if (chiInfo != null) {
            for (var obj of chiInfo) {
                console.log("玩家的吃牌的数据是", obj);
                chiArrayInfo.push(obj.chi);
            }
        };
        console.log("获得吃牌的组合是", chiArrayInfo);
        var data = {
            pai: pai,
            hu: seatData.canHu,
            peng: seatData.canPeng,
            gang: seatData.canGang,
            gangpai: seatData.gangPai,
            chi: seatData.canChi,
            chiArrayInfo: chiArrayInfo
        };
        //如果可以有操作，则进行操作
        userMgr.sendMsg(seatData.userId, 'game_action_push', data);
        data.si = seatData.seatIndex;
        _timerStart(game);
    } else {
        userMgr.sendMsg(seatData.userId, 'game_action_push');
        _timerStart(game, 1);
    }
}
//找到下一家
function moveToNextUser(game, nextSeat) {
    game.fangpaoshumu = 0;
    //找到下一个没有和牌的玩家
    if (nextSeat == null) {
        while (true) {
            game.turn++;
            game.turn %= 4;
            var turnSeat = game.gameSeats[game.turn];
            if (turnSeat.hued == false) {
                return;
            }
        }
    } else {
        game.turn = nextSeat;
    }
}
// 玩家摸牌操作
function doUserMoPai(game) {
    game.chuPai = -1;
    var turnSeat = game.gameSeats[game.turn];
    turnSeat.lastFangGangSeat = -1;
    turnSeat.guoHuFan = -1;
    var pai = gameutils.mopai(game, game.turn);
    //牌摸完了，结束
    var numOfMJ = game.mahjongs.length - game.currentIndex;
    // 还剩15张牌,判断为流局
    if (numOfMJ <= 15) {
        game.isLiuJu = true;
        doGameOver(game, turnSeat.userId);
        return;
    } else {
        userMgr.broacastInRoom('mj_count_push', numOfMJ, turnSeat.userId, true);
    }
    recordGameAction(game, game.turn, ACTION_MOPAI, pai);
    //通知前端新摸的牌
    userMgr.sendMsg(turnSeat.userId, 'game_mopai_push', pai);
    turnSeat.lastPai = pai;
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    checkCanAnGang(game, turnSeat);
    //检查看是否可以和
    checkCanHu(game, turnSeat, pai);
    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', turnSeat.userId, turnSeat.userId, true);
    //通知玩家做对应操作
    sendOperations(game, turnSeat, game.chuPai);
}

function isSameType(type, arr) {
    if (typeof arr == 'undefined') {
        return false;
    }
    for (var i = 0; i < arr.length; ++i) {
        var t = mjutils.getMJType(arr[i]);
        if (type != -1 && type != t) {
            return false;
        }
        type = t;
    }
    return true;
}
// 清一色 --15分
function isQingYiSe(gameSeatData) {
    var type = mjutils.getMJType(gameSeatData.holds[0]);
    //检查手上的牌
    if (isSameType(type, gameSeatData.holds) == false) {
        return false;
    }
    //检查杠下的牌
    if (isSameType(type, gameSeatData.angangs) == false) {
        return false;
    }
    if (isSameType(type, gameSeatData.wangangs) == false) {
        return false;
    }
    if (isSameType(type, gameSeatData.diangangs) == false) {
        return false;
    }
    //检查碰牌
    if (isSameType(type, gameSeatData.pengs) == false) {
        return false;
    }
    //检查吃 只能吃一次,因此chis的数组中只有一个数据
    if (gameSeatData.chis.length > 0 && isSameType(type, gameSeatData.chis[0]) == false) {
        return false;
    }
    return true;
}
// 混一色 --5分缺两门
function isHunYiSe(gameSeatData) {
    var allHolds = [];
    var fengHolds = [];
    allHolds = getAllHolds(gameSeatData);
    for (var index = 0; index < allHolds.length; index++) {
        var element = allHolds[index];
        if (mjutils.getMJType(element) == 3) {
            fengHolds.push(element);
            var idx = allHolds.indexOf(element);
            if (idx > -1) {
                allHolds.splice(idx, 1);
            }
        }
    }
    if (fengHolds.length <= 0) {
        return false;
    }
    var cnt = calcTypeCnt(allHolds, true);
    return cnt === 1;
}
// 门清 翻倍 * 2
function isMenQing(gameSeatData) {
    return (gameSeatData.pengs.length + gameSeatData.wangangs.length + gameSeatData.diangangs.length + gameSeatData.chis.length) == 0;
}
// 判断门的数量
function calcTypeCnt(holds, isExceptFengHua) {
    var typeSet = new Set();
    for (var index = 0; index < holds.length; index++) {
        var element = holds[index];
        var type = mjutils.getMJType(element);
        if (isExceptFengHua && type >= 3) {
            //风和花不算
            continue;
        };
        typeSet.add(type);
    }
    console.log(typeSet);
    console.log(typeSet.size);
    return typeSet.size;
}
// 获得玩家包括吃碰在内的所有手牌
function getAllHolds(gameSeatData) {
    var holds = gameSeatData.holds;
    var pengs = gameSeatData.pengs;
    var chis = gameSeatData.chis;
    var angangs = gameSeatData.angangs;
    var wangangs = gameSeatData.wangangs;
    var diangangs = gameSeatData.diangangs;
    var allHolds = [];
    var fn = function(holds, arr, num) {
        for (var i = 0; i < arr.length; ++i) {
            var pai = arr[i];
            for (var j = 0; j < num; j++) {
                holds.push(pai);
            }
        }
        return holds.sort(function(a, b) {
            return a - b;
        });
    }
    holds = fn(allHolds, gameSeatData.holds, 1);
    holds = fn(allHolds, gameSeatData.pengs, 3);
    holds = fn(allHolds, gameSeatData.angangs, 4);
    holds = fn(allHolds, gameSeatData.wangangs, 4);
    holds = fn(allHolds, gameSeatData.diangangs, 4);
    for (var k of chis) {
        holds = fn(allHolds, k, 1);
    }
    return allHolds;
}
// 判断缺几门的数量
function getQueCnt(gameSeatData) {
    var queCnt = 0;
    // 风和花不算在内
    var mahjongType = 3;
    var holds = [];
    holds = getAllHolds(gameSeatData);
    queCnt = mahjongType - calcTypeCnt(holds, true);
    console.log("缺的数量计算", queCnt);
    return queCnt;
}
// 是否是碰碰胡
function isPengPengHu(gameSeatData) {
    var pengsCnt = 0;
    var duiCnt = 0;
    /*if (gameSeatData.pengs.length == 0) {
        return false;
    }*/
    var huPai = gameSeatData.hupai;
    var holds = getAllHolds(gameSeatData);
    var pengSet = new Set();
    var duigSet = new Set();
    var countMap = mjutils.setHoldsCountMap(holds);
    for (var id = 0; id < holds.length; id++) {
        var cnt = countMap[holds[id]];
        if (cnt == 3) {
            pengSet.add(holds[id]);
        } else if (cnt == 2) {
            duigSet.add(holds[id]);
        }
    }
    pengsCnt += pengSet.size;
    duiCnt = duigSet.size;
    console.log('pengSet', pengSet, pengSet.size);
    console.log('duigSet', duigSet, duigSet.size);
    //console.log('huPai===>',huPai);
    if (pengsCnt == 4 && duiCnt == 1 && countMap[huPai] == 3) {
        return true;
    } else {
        return false;
    }
}

function isPeng(mjid, gameSeatData) {
    if (mjid && gameSeatData.pengs.length > 0 && gameSeatData.pengs.indexOf(mjid) > -1) {
        return true;
    } else {
        return false;
    }
}
// 计算有多少个刻子 每个刻子1一分
function calKeZiCnt(gameSeatData) {
    var holds = gameSeatData.holds;
    // console.log('calKeZiCnt1',holds);
    var huPai = gameSeatData.hupai;
    if (holds == null || holds.length < 2) {
        return 0;
    };
    var keziSet = new Set();
    var countMap = mjutils.setHoldsCountMap(holds);
    for (var id = 0; id < holds.length; id++) {
        var cnt = countMap[holds[id]];
        if (cnt == 3 && holds[id] != huPai && checkCanHuExcept(holds, [holds[id], holds[id], holds[id]], gameSeatData) && !isPeng(holds[id], gameSeatData)) {
            keziSet.add(holds[id]);
        }
    }
    return keziSet.size;
}
// 根据类型取到牌的组合
function getHoldByType(holds, ttype) {
    var hold = [];
    if (holds == null || holds.length <= 0) {
        return hold;
    }
    for (var j = 0; j < holds.length; j++) {
        var element = holds[j];
        if (mjutils.getMJType(element) == ttype) {
            hold.push(element);
        }
    }
    return hold;
}
//大高   jervis   2017.4.18
function isBigHigh(gameSeatData) { //是否是大高   112233，445566，778899   2分
    //查找两个字符串的最长公共子串
    var fn1 = function(s1, s2) {
        var S = sstr = "",
            L1 = s1.length,
            L2 = s2.length;
        if (L1 > L2) {
            var s3 = s1;
            s1 = s2, s2 = s3, L1 = s2.length;
        }
        for (var j = L1; j > 0; j--)
            for (var i = 0; i <= L1 - j; i++) {
                sstr = s1.substr(i, j);
                if (s2.indexOf(sstr) >= 0) return sstr;
            }
        return "";
    }
    var fn = function(arr) {
        parr = arr.sort(function(a, b) {
            return a - b;
        });
        pstr = parr.join("");
        //0:筒     1:条    2:万   3:字（东西南北）  4:字（红发白）  5:（春夏秋冬）   6:（兰竹菊梅）
        val = 0;
        //-----筒
        str = "112233";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "445566";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "778899";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        //-----条
        str = "9910101111";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "121213131414";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "151516161717";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        //-----万
        str = "181819192020";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "212122222323";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        str = "242425252626";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 2;
        if (val > 0) return val;
        else return false;
    }
    //--------------------------
    var rs = fn(gameSeatData.holds);
    return rs;
}
//小高   jervis   2017.4.18
function isLittleHigh(gameSeatData) { //是否是小高  223344 334455 556677 667788 1分
    //查找两个字符串的最长公共子串
    var fn1 = function(s1, s2) {
        var S = sstr = "",
            L1 = s1.length,
            L2 = s2.length;
        if (L1 > L2) {
            var s3 = s1;
            s1 = s2, s2 = s3, L1 = s2.length;
        }
        for (var j = L1; j > 0; j--)
            for (var i = 0; i <= L1 - j; i++) {
                sstr = s1.substr(i, j);
                if (s2.indexOf(sstr) >= 0) return sstr;
            }
        return "";
    }
    var fn = function(arr) {
        parr = arr.sort(function(a, b) {
            return a - b;
        });
        pstr = parr.join("");
        //0:筒(0-8)     1:条(9-17)    2:万(18-26)   3:字（东西南北）  4:字（红发白）  5:（春夏秋冬）   6:（兰竹菊梅）
        val = 0;
        //-----筒
        str = "223344";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "334455";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "556677";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "667788";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        //-----条
        str = "101011111212";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "111112121313";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "131314141515";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "141415141616";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        //-----万
        str = "191920202121";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "202021212222";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "222223232424";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        str = "232324242525";
        pp = fn1(pstr, str);
        if (str == pp) val = val + 1;
        if (val > 0) return val;
        else return false;
    }
    //--------------------------
    var rs = fn(gameSeatData.holds);
    return rs;
}
//八张    1分
function isEightSheet(gameSeatData) {
    var holds = getAllHolds(gameSeatData);
    console.log("isEightSheet", holds);
    holds.sort(function(a, b) {
        return a - b
    });
    var tongHolds = [];
    var wanHolds = [];
    var tiaoHolds = [];
    var fengHolds = [];
    tongHolds = getHoldByType(holds, 0);
    tiaoHolds = getHoldByType(holds, 1);
    wanHolds = getHoldByType(holds, 2);
    fengHolds = getHoldByType(holds, 3);
    var flag = tongHolds.length >= 8 || tiaoHolds.length >= 8 || wanHolds.length >= 8 || fengHolds.length >= 8;
    return flag;
}
//获取大小高数量
function getGaoNum(gameSeatData) {
    var holds = getAllHolds(gameSeatData);

    function isContained(a, b) {
        var aStr = a.toString();
        var bStr = b.toString();
        if (aStr.indexOf(bStr) > -1) {
            return true;
        } else {
            return false;
        }
    }
    //小高：除了大高之外的连张形式,223344,334455,556677,667788
    var xiaoGaoArr = ['1,1,2,2,3,3', '2,2,3,3,4,4', '4,4,5,5,6,6', '5,5,6,6,7,7', '10,10,11,11,12,12', '11,11,12,12,13,13', '13,13,14,14,15,15', '14,14,15,15,16,16', '19,19,20,20,21,21', '20,20,21,21,22,22', '22,22,23,23,24,24', '23,23,24,24,25,25'];
    //大高：112233,445566,778899的连张形式
    var daGaoArr = ['0,0,1,1,2,2', '3,3,4,4,5,5', '6,6,7,7,8,8', '9,9,10,10,11,11', '12,12,13,13,14,14', '15,15,16,16,17,17', '18,18,19,19,20,20', '21,21,22,22,23,23', '24,24,25,25,26,26'];
    var xiaoGaoNum = 0;
    for (var i in xiaoGaoArr) {
        var temp = xiaoGaoArr[i];
        if (isContained(holds, temp)) {
            xiaoGaoNum++;
        }
    }
    var daGaoNum = 0;
    for (var i in daGaoArr) {
        var temp = daGaoArr[i];
        if (isContained(holds, temp)) {
            daGaoNum++;
        }
    }
    return {
        xiaoGaoNum: xiaoGaoNum,
        daGaoNum: daGaoNum
    };
}
//检查剔除某些牌以后是否可以胡
function checkCanHuExcept(holds, except, seatData) {
    var holds_clone = [];
    for (var i in holds) {
        holds_clone.push(holds[i]);
    }
    console.log('checkCanHuExcept===>');
    console.log(holds, except, holds_clone);
    var old = {
        holds: seatData.holds,
        countMap: seatData.countMap
    };
    //剔除
    if (typeof except == 'string') {
        except = except.split(',');
    }
    for (var i in except) {
        var temp = except[i]; //被剔除的牌
        var index = holds_clone.indexOf(parseInt(temp));
        holds_clone.splice(index, 1);
    }
    console.log('剔除以后的牌', holds_clone);
    seatData.holds = holds_clone;
    seatData.countMap = mjutils.setHoldsCountMap(holds_clone);
    var ret = mjutils.checkCanHu(seatData);
    //还原
    seatData.holds = old.holds;
    seatData.countMap = old.countMap;
    return ret;
}
//获取大小连数量
function getLianNum(gameSeatData) {
    var holds = getAllHolds(gameSeatData);

    function isContained(a, b) {
        //去重
        var obj = {};
        for (var i in a) {
            var t = a[i];
            if (obj[t]) {
                obj[t] = 1;
            } else {
                obj[t] += 1;
            }
        }
        var aStr = Object.keys(obj).toString();
        var bStr = b.toString();
        if (aStr.indexOf(bStr) > -1) {
            return true;
        } else {
            return false;
        }
    }
    //小连：同一花色的234567或345678有6种
    var xiaoLianArr = ['1,2,3,4,5,6', '2,3,4,5,6,7', '10,11,12,13,14,15', '11,12,13,14,15,16', '19,20,21,22,23,24', '20,21,22,23,24,25'];
    //大连：同一花色的123456或456789有6种
    var daLianArr = ['0,1,2,3,4,5', '3,4,5,6,7,8', '9,10,11,12,13,14', '12,13,14,15,16,17', '18,19,20,21,22,23', '21,22,23,24,25,26'];
    var xiaoLianNum = 0;
    for (var i in xiaoLianArr) {
        var temp = xiaoLianArr[i];
        if (isContained(holds, temp) && checkCanHuExcept(holds, temp, gameSeatData)) {
            xiaoLianNum++;
        }
    }
    var daLianNum = 0;
    for (var i in daLianArr) {
        var temp = daLianArr[i];
        if (isContained(holds, temp) && checkCanHuExcept(holds, temp, gameSeatData)) {
            daLianNum++;
        }
    }
    return {
        xiaoLianNum: xiaoLianNum,
        daLianNum: daLianNum
    };
}
//四归一  顺子当中有一个杠未被当杠用，如122223，每个1分；
function getFourOneNum(gameSeatData) {
    var num = 0;
    var holds = getAllHolds(gameSeatData);
    var countMap = mjutils.setHoldsCountMap(holds);
    for (var i in countMap) {
        var temp = countMap[i]; //牌i的数量
        var pai = parseInt(i);
        //首先得是个杠
        if (temp == 4) {
            //三种顺的情况:pai,pai+1,pai+2;pai-1,pai,pai+1;pai-2,pai-1,pai
            var shun_arr = [];
            if (pai >= 0 && pai <= 26) {
                if (pai != 7 && pai != 8 && pai != 16 && pai != 17 && pai != 25 && pai != 26) {
                    shun_arr.push([pai, pai, pai, pai, pai + 1, pai + 2]);
                }
                if (pai != 0 && pai != 8 && pai != 9 && pai != 17 && pai != 18 && pai != 26) {
                    shun_arr.push([pai - 1, pai, pai, pai, pai, pai + 1]);
                }
                if (pai != 0 && pai != 1 && pai != 9 && pai != 10 && pai != 18 && pai != 19) {
                    shun_arr.push([pai - 2, pai - 1, pai, pai, pai, pai]);
                }
            }
            for (var j in shun_arr) {
                if (holds.toString().indexOf(shun_arr[j].toString()) > -1) {
                    num += 1;
                    break;
                }
            }
        }
    }
    return num;
}
//老少 每个1分
function isOldChild(gameSeatData) {
    var holds = getAllHolds(gameSeatData);
    console.log("isOldChild", holds);
    holds.sort(function(a, b) {
        return a - b
    });
    var tongHolds = [];
    var wanHolds = [];
    var tiaoHolds = [];
    tongHolds = getHoldByType(holds, 0);
    tiaoHolds = getHoldByType(holds, 1);
    wanHolds = getHoldByType(holds, 2);
    var cnt = 0;
    var fn = function(hold, ttype) {
        if (hold.length < 6) {
            return false;
        }
        var start = ttype * 9;
        var end = (ttype + 1) * 9;
        var score = 0;
        var cnt = 0;
        var doubleCnt = 0;
        var countMap = mjutils.setHoldsCountMap(hold);
        for (var k = start; k < end; k++) {
            if (k < start + 3 || k > end - 4) {
                var idx = hold.indexOf(k);
                if (idx == -1) {
                    return 0;
                } else {
                    cnt += 1;
                    if (countMap[k] == 2) {
                        doubleCnt += 1;
                    };
                }
            }
        }
        if (cnt == 6) {
            score = 1;
        } else if (doubleCnt == 6) {
            score = 2;
        }
        return score;
    };
    var tongFlag = fn(tongHolds, 0);
    var tiaoFlag = fn(tiaoHolds, 1);
    var wanFlag = fn(wanHolds, 2);
    cnt = tongFlag + tiaoFlag + wanFlag;
    console.log('cntccc', cnt);
    return cnt;
}
//一条龙 15分
function isOneDragon(gameSeatData) {
    var holds = gameSeatData.holds
    holds.sort(function(a, b) {
        return a - b
    });
    var tongHolds = [];
    var wanHolds = [];
    var tiaoHolds = [];
    tongHolds = getHoldByType(holds, 0);
    tiaoHolds = getHoldByType(holds, 1);
    wanHolds = getHoldByType(holds, 2);
    var fn = function(hold, ttype) {
        if (hold.length < 9) {
            return false;
        }
        var countMap = {};
        countMap = mjutils.setHoldsCountMap(hold);
        var pairCnt = 0;
        for (var index = 0; index < hold.length; index++) {
            var pai = hold[index];
            if (countMap[pai] == 2) {
                pairCnt += 1;
            }
        }
        if (pairCnt == 1 || pairCnt == 2 || pairCnt == 4) {
            return false;
        }
        var cnt = 0;
        var start = ttype * 9;
        var end = (ttype + 1) * 9;
        for (var j = start; j < end; j++) {
            var idx = hold.indexOf(j);
            if (idx == -1) {
                return false;
            } else if (idx >= 0) {
                cnt += 1;
            }
        }
        if (cnt == 9) {
            return true;
        }
    };
    var tongFlag = fn(tongHolds, 0);
    var tiaoFlag = fn(tiaoHolds, 1);
    var wanFlag = fn(wanHolds, 2);
    console.log("tong1:", tongFlag);
    console.log("tiao2:", tiaoFlag);
    console.log("wanHolds3:", wanFlag);
    var flag = tongFlag || tiaoFlag || wanFlag;
    return flag;
}

function isJiangDui(gameSeatData) {
    var fn = function(arr) {
        for (var i = 0; i < arr.length; ++i) {
            var pai = arr[i];
            if (pai != 1 && pai != 4 && pai != 7 && pai != 9 && pai != 13 && pai != 16 && pai != 18 && pai != 21 && pai != 25) {
                return false;
            }
        }
        return true;
    }
    if (fn(gameSeatData.pengs) == false) {
        return false;
    }
    if (fn(gameSeatData.angangs) == false) {
        return false;
    }
    if (fn(gameSeatData.diangangs) == false) {
        return false;
    }
    if (fn(gameSeatData.wangangs) == false) {
        return false;
    }
    if (fn(gameSeatData.holds) == false) {
        return false;
    }
    return true;
}

function isTinged(seatData) {
    for (var k in seatData.tingMap) {
        return true;
    }
    return false;
}

function computeFanScore(game, fan) {
    if (fan > game.conf.maxFan) {
        fan = game.conf.maxFan;
    }
    return (1 << fan) * game.conf.baseScore;
}

function findMaxFanTingPai(ts) {
    //找出最大番
    var cur = null;
    for (var k in ts.tingMap) {
        var tpai = ts.tingMap[k];
        if (cur == null || tpai.fan > cur.fan) {
            cur = tpai;
        }
    }
    return cur;
}
// 计算番数
function getFans(seatData) {
    var fan = 0;
    seatData.isMenQing = isMenQing(seatData);
    if (seatData.isMenQing) {
        fan += 1;
    }
    console.log("当前算了门清后番数是", fan);
    if (seatData.iszimo) {
        fan += 1;
        console.log("玩家自摸,分数翻倍");
    }
    fan = Math.pow(2, parseInt(fan));
    return fan;
}
// 计算所有的牌型的得分
function calcAllScore(seatData) {
    var calculateScore = 0
    // v.十三幺算分
    if (seatData.pattern == "therity") {
        calculateScore = 200;
        console.log("十三幺得分", 200);
        console.log("此时的calculateScore", calculateScore);
        return calculateScore;
    };
    // w豪华七对
    var haoQiScore = 0;
    if (seatData.isHaoQiDui) {
        calculateScore = 200;
        console.log("豪七对得分", 200);
        console.log("此时的calculateScore", calculateScore);
        return calculateScore;
    }
    // a.缺少的门数量
    // 清一色的分数
    if (isQingYiSe(seatData)) {
        console.log('isQingYiSe');
        seatData.qingyise = true;
        calculateScore += 15;
        console.log("清一色得分", 15);
    } else if (isHunYiSe(seatData)) {
        // 混一色
        console.log('isHunYiSe');
        seatData.hunyise = true;
        calculateScore += 5;
        console.log("混一色得分", 5);
    } else {
        var queCnt = getQueCnt(seatData)
        console.log("玩家缺少的门数:", queCnt);
        if (queCnt > 0) {
            seatData.queMen = true;
        }
        calculateScore += queCnt;
        console.log("缺门得分", queCnt);
    }
    console.log("此时的calculateScore", calculateScore);
    // b.单吊一张
    if (seatData.huCnt == 1) {
        console.log("玩家单调一张牌", seatData.huCnt);
        calculateScore += 1;
        console.log("单吊得分", 1);
        console.log("此时的calculateScore", calculateScore);
    };
    //d
    var gaoNumObj = getGaoNum(seatData);
    //大高 2分
    var daGaoNum = gaoNumObj.daGaoNum;
    if (daGaoNum > 0) {
        seatData.daGao = true;
        calculateScore += daGaoNum * 2;
        console.log("大高得分", daGaoNum);
        console.log("此时的calculateScore", calculateScore);
    }
    //小高 1分
    var xiaoGaoNum = gaoNumObj.xiaoGaoNum;
    if (xiaoGaoNum > 0) {
        seatData.xiaoGao = true;
        calculateScore += xiaoGaoNum * 1;
        console.log("小高得分", xiaoGaoNum);
        console.log("此时的calculateScore", calculateScore);
    }
    //f.八张
    if (isEightSheet(seatData)) {
        seatData.baZhang = true;
        calculateScore += 1;
        console.log("八张得分", 1);
        console.log("此时的calculateScore", calculateScore);
    }
    //i.老少
    var isOldChildScore = isOldChild(seatData);
    if (isOldChildScore != null && isOldChildScore > 0) {
        seatData.laoShao = true;
        calculateScore += isOldChildScore;
        console.log("老少得分", isOldChildScore);
        console.log("此时的calculateScore", calculateScore);
    };
    // j.四归一
    /*if (seatData.isFourOne) {
        calculateScore += 1;
        console.log("四归一得分", 1);
        console.log("此时的calculateScore", calculateScore);
    }*/
    var fourOneNum = getFourOneNum(seatData);
    if (fourOneNum > 0) {
        calculateScore += fourOneNum;
        console.log("四归一得分", fourOneNum);
        console.log("此时的calculateScore", calculateScore);
    }
    //k.一条龙 不再数连
    if (isOneDragon(seatData)) {
        seatData.yiTiaoLong = true;
        calculateScore += 15;
        console.log("一条龙得分", 15);
        console.log("此时的calculateScore", calculateScore);
    } else {
        var lianNumObj = getLianNum(seatData);
        //g.小连  同一花色满足6张连线的牌，且没有幺九的，每个1分
        var xiaoLianNum = lianNumObj.xiaoLianNum;
        if (xiaoLianNum > 0) {
            seatData.xiaoLian = true;
            calculateScore += xiaoLianNum * 1;
            console.log("小连得分", xiaoLianNum);
            console.log("此时的calculateScore", calculateScore);
        }
        //h.大连  同一花色满足6张连线的牌，且有幺九的，每个2分
        var daLianNum = lianNumObj.daLianNum;
        if (daLianNum > 0) {
            seatData.daLian = true;
            calculateScore += daLianNum * 2;
            console.log("大连得分", daLianNum * 2);
            console.log("此时的calculateScore", calculateScore);
        }
    }
    // I.胡七小对
    if (seatData.pattern == "7pairs") {
        console.log("玩家胡七小对");
        calculateScore += 15;
        console.log("七小对得分", 15);
        console.log("此时的calculateScore", calculateScore);
    }
    if (isPengPengHu(seatData)) {
        console.log("碰碰胡得分", 5);
        seatData.pengpenghu = true;
        calculateScore += 5;
        console.log("此时的calculateScore", calculateScore);
    } else {
        // s.刻子
        var kezicnt = calKeZiCnt(seatData);
        if (kezicnt != null && kezicnt > 0) {
            seatData.kezi = true;
            calculateScore += kezicnt;
            console.log("刻子得分", kezicnt);
            console.log("此时的calculateScore", calculateScore);
        };
    }
    // p捉五魁
    if (seatData.zhuoWuKui) {
        calculateScore += 5;
        console.log("捉五魁得分", 5);
        console.log("此时的calculateScore", calculateScore);
    }
    // q.海底胡
    if (seatData.isHaiDiHu) {
        calculateScore += 1;
        console.log("海底胡得分", 1);
        console.log("此时的calculateScore", calculateScore);
    }
    // r.杠上花
    if (seatData.isGangHu) {
        calculateScore += 1;
        console.log("杠上花得分", 1);
        console.log("此时的calculateScore", calculateScore);
    }
    // t杠牌算分
    seatData.numAnGang = seatData.angangs.length;
    seatData.numMingGang = seatData.wangangs.length + seatData.diangangs.length;
    if (seatData.numAnGang != null && seatData.numAnGang > 0) {
        var anGangScore = seatData.numAnGang * 2;
        calculateScore += anGangScore;
        console.log("暗杠得分", anGangScore);
        console.log("此时的calculateScore", calculateScore);
    }
    if (seatData.numMingGang != null && seatData.numMingGang > 0) {
        calculateScore += seatData.numMingGang;
        console.log("明杠得分", seatData.numMingGang);
        console.log("此时的calculateScore", calculateScore);
    }
    // u.财神算分
    var caiShenScore = seatData.caiShen.length;
    if (caiShenScore != null && caiShenScore > 0) {
        calculateScore += caiShenScore;
        console.log("财神得分", caiShenScore);
        console.log("此时的calculateScore", calculateScore);
    }
    return calculateScore;
}
// 计算分数
function calculateResult(game, roomInfo) {
    // 基础分数
    var baseScore = game.conf.baseScore;
    console.log('基础分数为--1', baseScore);
    var numOfHued = 0;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        if (game.gameSeats[i].hued == true) {
            numOfHued++;
        }
    }
    console.log('胡牌的玩家有几家--2', numOfHued);
    // 循环计算每个玩家的分数
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var sd = game.gameSeats[i];
        //对所有胡牌的玩家进行统计
        if (sd.hued) {
            console.log("计算分数,玩家是胡牌了");
            var fan = getFans(sd);
            var totalScores = calcAllScore(sd);
            console.log("getFans:", fan);
            sd.fan = fan;
            console.log("totalScores:", totalScores);
            for (var a = 0; a < sd.actions.length; ++a) {
                var ac = sd.actions[a];
                // console.log('action ',ac);
                if (ac.type != 'hu' && ac.type != 'zimo') continue;
                var allScores = 0;
                if (totalScores != 200) {
                    // 基础分
                    console.log("基础分数是", game.conf.baseScore);
                    //底胡+1
                    totalScores += 1;
                    //庄胡+1
                    // if (i == roomInfo.nextButton) {
                    //     console.log('庄胡得分',1);
                    //     totalScores += 1;
                    /*roomInfo.lianZhuangNum为1，表示庄家第一次胡，
                    前端显示的时候连庄次数是roomInfo.lianZhuangNum-1*/
                    if (roomInfo.lianZhuangNum && parseInt(roomInfo.lianZhuangNum) > 0) {
                        totalScores += parseInt(roomInfo.lianZhuangNum);
                        console.log('连庄得分', roomInfo.lianZhuangNum);
                    }
                    // }
                    allScores = fan * (game.conf.baseScore + totalScores);
                } else {
                    //豪七对和十三幺的计算
                    sd.fan = 1;
                    allScores = totalScores;
                }
                console.log("allScores", allScores);
                sd.score += allScores * ac.targets.length;
                for (var t = 0; t < ac.targets.length; ++t) {
                    var six = ac.targets[t];
                    var td = game.gameSeats[six];
                    td.score -= allScores;
                    if (td != sd) {
                        if (!ac.iszimo) {
                            td.numDianPao++;
                        }
                    }
                }
            }
        }
    }
}

function doGameOver(game, userId, forceEnd) {
    _timerDel(game);
    console.log("doGameOver------doGameOver");
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    console.log("roomInfo", roomInfo);
    var results = [];
    var dbresult = [0, 0, 0, 0];
    // 结束后发送通知到客户端
    var fnNoticeResult = function(isEnd) {
        var endinfo = null;
        if (isEnd) {
            endinfo = [];
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var rs = roomInfo.seats[i];
                endinfo.push({
                    numzimo: rs.numZiMo,
                    numjiepao: rs.numJiePao,
                    numdianpao: rs.numDianPao,
                    numangang: rs.numAnGang,
                    numminggang: rs.numMingGang,
                });
            }
        }
        console.log("-------game_over_push------->>>", results, endinfo);
        userMgr.broacastInRoom('game_over_push', {
            results: results,
            endinfo: endinfo
        }, userId, true);
        //如果局数已够，则进行整体结算，并关闭房间
        if (isEnd) {
            console.log("局数已够，则进行整体结算，并关闭房间");
            if (roomInfo.conf.creator == 'match') {
                userMgr.kickAllInRoom(roomId);
                roomMgr.destroy(roomId);
                var loser = [],
                    winer = {},
                    aller = [];
                for (var i in roomInfo.seats) {
                    aller.push({
                        userId: roomInfo.seats[i].userId,
                        score: roomInfo.seats[i].score
                    });
                };

                function comp(v1, v2) {
                    if (v1.score < v2.score) {
                        return 1;
                    } else if (v1.score > v2.score) {
                        return -1;
                    } else {
                        return 0;
                    }
                };
                aller.sort(comp); //从大到小排序
                for (var j in aller) {
                    var val = aller[j];
                    if (j == 0) {
                        winer[val.userId] = val.score;
                    } else {
                        loser.push(val);
                    }
                }
                console.log('next_trun_match', {
                    winer: JSON.stringify(winer),
                    loser: JSON.stringify(loser),
                    type: '3'
                });
                http_service.sendToHall("/next_trun_match", {
                    winer: JSON.stringify(winer),
                    loser: JSON.stringify(loser),
                    type: '3'
                }, function() {});
            } else {
                setTimeout(function() {
                    if (roomInfo.numOfGames > 1) {
                        store_history(roomInfo);
                    }
                    userMgr.kickAllInRoom(roomId);
                    roomMgr.destroy(roomId);
                    db.archive_games(roomInfo.uuid);
                }, 1500);
            }
        }
    }
    if (game != null) {
        var old = roomInfo.nextButton;
        console.log('本局的庄家是;', old);
        console.log('第一个胡牌的人是', game.firstHupai);
        if ((game.firstHupai >= 0 && (old != game.firstHupai)) || roomInfo.conf.creator == 'match') {
            roomInfo.nextButton = (old + 1) % 4;
        }
        if (old != roomInfo.nextButton) {
            db.update_next_button(roomId, roomInfo.nextButton);
            roomInfo.lianZhuangNum = 0;
        } else {
            roomInfo.lianZhuangNum += 1;
        }
        if (!forceEnd) {
            calculateResult(game, roomInfo);
        }
        for (var i = 0; i < roomInfo.seats.length; ++i) {
            var rs = roomInfo.seats[i];
            var sd = game.gameSeats[i];
            rs.ready = false;
            rs.score += sd.score;
            rs.numZiMo += sd.numZiMo;
            rs.numJiePao += sd.numJiePao;
            rs.numDianPao += sd.numDianPao;
            rs.numAnGang += sd.numAnGang;
            rs.numMingGang += sd.numMingGang;
            var userRT = {
                userId: sd.userId,
                isLiuJu: game.isLiuJu,
                pengs: sd.pengs,
                extraPais: sd.extraPais,
                chis: sd.chis,
                caiShen: sd.caiShen,
                actions: [],
                wangangs: sd.wangangs,
                diangangs: sd.diangangs,
                angangs: sd.angangs,
                numofgen: sd.numofgen,
                holds: sd.holds,
                fan: sd.fan,
                score: sd.score,
                totalscore: rs.score,
                qingyise: sd.qingyise,
                hunyise: sd.hunyise,
                pattern: sd.pattern,
                isganghu: sd.isGangHu,
                menqing: sd.isMenQing,
                haidihu: sd.isHaiDiHu,
                //huCnt == 1 说明单调一张 1分
                huCnt: sd.huCnt,
                // 捉五魁 -- 5分
                zhuoWuKui: sd.zhuoWuKui,
                // 四归一 --1分
                isFourOne: sd.isFourOne,
                isHaoQiDui: sd.isHaoQiDui,
                huorder: game.hupaiList.indexOf(i),
                hupai: sd.hupai,
                baZhang: sd.baZhang,
                laoShao: sd.laoShao,
                yiTiaoLong: sd.yiTiaoLong,
                xiaoLian: sd.xiaoLian,
                daLian: sd.daLian,
                xiaoGao: sd.xiaoGao,
                daGao: sd.daGao,
                queMen: sd.queMen,
                kezi: sd.kezi,
                pengpenghu: sd.pengpenghu,
                lianZhuangNum: roomInfo.lianZhuangNum
            };
            for (var k in sd.actions) {
                userRT.actions[k] = {
                    type: sd.actions[k].type,
                };
            }
            results.push(userRT);
            dbresult[i] = sd.score;
            delete gameSeatsOfUsers[sd.userId];
        }
        delete games[roomId];
    }
    if (forceEnd || game == null) {
        fnNoticeResult(true);
    } else {
        //保存游戏
        if (roomInfo.conf.creator != 'match') {
            store_game(game, function(ret) {
                db.update_game_result(roomInfo.uuid, game.gameIndex, dbresult);
                //记录打牌信息
                var str = JSON.stringify(game.actionList);
                db.update_game_action_records(roomInfo.uuid, game.gameIndex, str);
                //保存游戏局数
                db.update_num_of_turns(roomId, roomInfo.numOfGames);
                //如果是第一次，并且不是强制解散 则扣除房卡
                if (roomInfo.numOfGames == 1) {
                    var cost = 30000;
                    if (roomInfo.conf.maxGames > 6) {
                        cost = 60000;
                    }
                    db.cost_gems_or_coins(game.gameSeats[0].userId, cost, 0, function(e) {
                        if (e) use_money_logs(game.gameSeats[0].userId, cost, 0, 'mj');
                    });
                }
                var isEnd = (roomInfo.numOfGames >= roomInfo.conf.maxGames);
                fnNoticeResult(isEnd);
            });
        } else {
            console.log('isEnd===>', roomInfo.numOfGames);
            var isEnd = (roomInfo.numOfGames == 4);
            fnNoticeResult(isEnd);
        }
    }
}

function recordUserAction(game, seatData, type, target) {
    var d = {
        type: type,
        targets: []
    };
    if (target != null) {
        if (typeof(target) == 'number') {
            d.targets.push(target);
        } else {
            d.targets = target;
        }
    } else {
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var s = game.gameSeats[i];
            if (i != seatData.seatIndex && s.hued == false) {
                d.targets.push(i);
            }
        }
    }
    seatData.actions.push(d);
    return d;
}

function recordGameAction(game, si, action, pai) {
    game.actionList.push(si);
    game.actionList.push(action);
    if (pai != null) {
        game.actionList.push(pai);
    }
}
exports.setReady = function(userId, callback) {
    console.log('setReady--准备完毕');
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    roomMgr.setReady(userId, true);
    var game = games[roomId];
    if (game == null) {
        if (roomInfo.seats.length == 4) {
            for (var i = 0; i < roomInfo.seats.length; ++i) {
                var s = roomInfo.seats[i];
                if (s.ready == false || userMgr.isOnline(s.userId) == false) {
                    return;
                }
            }
            //4个人到齐了，并且都准备好了，则开始新的一局
            exports.begin(roomId);
        }
    } else {
        var numOfMJ = game.mahjongs.length - game.currentIndex;
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
        sendOperations(game, seatData, game.chuPai);
    }
}

function store_single_history(userId, history) {
    db.get_user_history(userId, function(data) {
        if (data == null) {
            data = [];
        }
        while (data.length >= 10) {
            data.shift();
        }
        data.push(history);
        db.update_user_history(userId, data);
    });
}

function store_history(roomInfo) {
    var seats = roomInfo.seats;
    var history = {
        uuid: roomInfo.uuid,
        id: roomInfo.id,
        time: roomInfo.createTime,
        seats: new Array(4)
    };
    for (var i = 0; i < seats.length; ++i) {
        var rs = seats[i];
        var hs = history.seats[i] = {};
        hs.userid = rs.userId;
        hs.name = crypto.toBase64(rs.name);
        hs.score = rs.score;
    }
    for (var i = 0; i < seats.length; ++i) {
        var s = seats[i];
        store_single_history(s.userId, history);
    }
}

function construct_game_base_info(game) {
    var baseInfo = {
        type: game.conf.type,
        button: game.button,
        index: game.gameIndex,
        mahjongs: game.mahjongs,
        game_seats: new Array(4)
    }
    for (var i = 0; i < 4; ++i) {
        baseInfo.game_seats[i] = game.gameSeats[i].holds;
    }
    game.baseInfoJson = JSON.stringify(baseInfo);
}

function store_game(game, callback) {
    db.create_game(game.roomInfo.uuid, game.gameIndex, game.baseInfoJson, callback);
}
// 开始出牌
function startPlaying(userId) {
    console.log("开始出牌");
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    //检查玩家可以做的动作
    //如果4个人都定缺了，通知庄家出牌
    construct_game_base_info(game);
    var arr = [1, 1, 1, 1];
    for (var i = 0; i < game.gameSeats.length; ++i) {
        arr[i] = game.gameSeats[i].que;
    }
    userMgr.broacastInRoom('game_playing_push', null, seatData.userId, true);
    //进行听牌检查
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var duoyu = -1;
        var gs = game.gameSeats[i];
        if (gs.holds.length == 14) {
            duoyu = gs.holds.pop();
            gs.countMap[duoyu] -= 1;
        }
        checkCanTingPai(gs);
        if (duoyu >= 0) {
            gs.holds.push(duoyu);
            gs.countMap[duoyu]++;
        }
    }
    var turnSeat = game.gameSeats[game.turn];
    game.state = "playing";
    //通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', turnSeat.userId, turnSeat.userId, true);
    //检查是否可以暗杠或者胡
    //直杠
    checkCanAnGang(game, turnSeat);
    //检查胡 用最后一张来检查
    checkCanHu(game, turnSeat, turnSeat.holds[turnSeat.holds.length - 1]);
    //通知前端
    sendOperations(game, turnSeat, game.chuPai);
};
//开始新的一局
exports.begin = function(roomId) {
    console.log('开始新的一局');
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    var game = {
        // 房间配置信息
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,
        button: roomInfo.nextButton,
        // 麻将总数
        mahjongs: new Array(ALLMJCOUNT),
        currentIndex: 0,
        gameSeats: new Array(4),
        numOfQue: 0,
        turn: 0,
        chuPai: -1,
        state: "idle",
        firstHupai: -1,
        yipaoduoxiang: -1,
        fangpaoshumu: -1,
        actionList: [],
        hupaiList: [],
        chupaiCnt: 0,
        timer: null,
        timerCounter: 10
    };
    roomInfo.numOfGames++;
    for (var i = 0; i < 4; ++i) {
        var data = game.gameSeats[i] = {};
        data.game = game;
        data.seatIndex = i;
        data.userId = seats[i].userId;
        //持有的牌
        data.holds = [];
        //打出的牌
        data.folds = [];
        //暗杠的牌
        data.angangs = [];
        //点杠的牌
        data.diangangs = [];
        //弯杠的牌
        data.wangangs = [];
        //碰了的牌
        data.pengs = [];
        data.extraPais = [];
        //缺一门
        data.que = -1;
        //财神,花牌
        data.caiShen = [];
        data.chis = [];
        //换三张的牌
        data.huanpais = null;
        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.tingMap = {};
        data.pattern = "";
        //是否可以杠
        data.canGang = false;
        //用于记录玩家可以杠的牌
        data.gangPai = [];
        //是否可以碰
        data.canPeng = false;
        // 是否可以吃
        data.canChi = false;
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;
        //如果guoHuFan >=0 表示处于过胡状态，
        //如果过胡状态，那么只能胡大于过胡番数的牌
        data.guoHuFan = -1;
        //是否胡了
        data.hued = false;
        //是否正在等待胡牌
        data.waitHuFlag = false;
        //是否正在等待碰
        data.waitPengFlag = false;
        //是否等待杠
        data.waitGangFlag = false;
        //是否等待碰
        data.waitChiFlag = false;
        //等待吃的数据
        data.waitChiData = {};
        data.tinged = false;
        //是否是自摸
        data.iszimo = false;
        data.isGangHu = false;
        data.actions = [];
        data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;
        data.zhuoWuKui = false;
        // data.isFourOne = false;
        data.huCnt = 0;
        //统计信息
        data.numZiMo = 0;
        data.numJiePao = 0;
        data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;
        gameSeatsOfUsers[data.userId] = data;
    }
    games[roomId] = game;
    //洗牌
    gameutils.shuffle(game);
    //发牌
    gameutils.deal(game);
    var numOfMJ = game.mahjongs.length - game.currentIndex;
    var huansanzhang = roomInfo.conf.hsz;
    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        //通知玩家手牌
        userMgr.sendMsg(s.userId, 'game_holds_push', game.gameSeats[i].holds);
        //通知还剩多少张牌
        userMgr.sendMsg(s.userId, 'mj_count_push', numOfMJ);
        //通知还剩多少局
        userMgr.sendMsg(s.userId, 'game_num_push', roomInfo.numOfGames);
        //通知游戏开始
        userMgr.sendMsg(s.userId, 'game_begin_push', game.button);
        // 游戏开始
        console.log('人到齐了');
        startPlaying(s.userId);
    }
};

function _timerStart(game, type) {
    //当type == 1 的时候需要判断当前的用户是否处于听牌状态
    console.log("ly:_timerStart");
    userMgr.broacastInRoom('game_timerBegin_push', game.turn, game.gameSeats[game.turn].userId, true);
    _timerDel(game);
    var counter = game.timerCounter;
    if (type && type === 1) {
        var sd = game.gameSeats[game.turn];
        if (sd.tinged && !hasOperations(sd)) {
            counter = 1;
        }
    }
    game.timer = setInterval(function() {
        counter--;
        if (counter == 0) {
            _timerDone(game);
        }
    }, 1000);
}

function _timerDone(game) {
    _timerDel(game);
    console.log("ly:_timerDone");
    var needWait = false;
    //如果还有人可以操作，则等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        if (hasOperations(ddd)) {
            needWait = true;
            break;
        }
    }
    if (!needWait) {
        var sd = game.gameSeats[game.turn];
        if (sd.canChuPai) {
            var pai = sd.lastPai;
            exports.chuPai(sd.userId, pai);
            return;
        }
    }
    var i = game.turn;
    //先遍历房间里面所有的胡，
    //找到最近胡的位置并返回
    while (true) {
        var i = (i + 1) % 4;
        var ddd = game.gameSeats[i];
        if (i == game.turn) {
            guoFunc(ddd.userId, 1);
            break;
        } else {
            if (ddd.canHu) {
                guoFunc(ddd.userId, 1);
            }
        }
    }
    //遍历碰，杠
    //找到最近的操作并返回
    //注意i值需要重新初始化
    i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        var ddd = game.gameSeats[i];
        if (i == game.turn) {
            break;
        } else {
            if (ddd.canPeng || ddd.canGang || ddd.canChi) {
                if (ddd.waitGangFlag) {
                    gangFunc(ddd.userId, game.chuPai);
                } else if (ddd.waitPengFlag) {
                    pengFunc(ddd.userId);
                } else if (ddd.waitChiFlag) {} else {
                    //过
                    guoFunc(ddd.userId, 1);
                }
            }
        }
    }
}

function _timerDel(game) {
    if (game && game.timer) {
        clearInterval(game.timer);
        game.timer = null;
    }
}

function _timerCounter(game) {
    game.timerCounter = 10;
}

function _updateLastPai(sd) {
    if (sd && sd.extraPais.length > 0) {
        sd.lastPai = sd.extraPais[0];
        console.log("ly:可以出的牌:sd.extraPais::", sd.extraPais);
    }
}

function checkCanPeng(seatData, pai) {
    var count = seatData.countMap[pai];
    if (count != null && count >= 2) {
        seatData.canPeng = true;
    }
}

function checkCanChi(seatData, targetPai) {
    console.log("check can chi", targetPai);
    if (seatData == null || targetPai == null) {
        console.log("targetPai是空值,不检查--1");
        seatData.canChi = false;
        return;
    }
    if (mjutils.checkCaiShen(seatData)) {
        console.log("都有财神,不需要再判断了--2");
        seatData.canChi = false;
        return;
    }
    var type = mjutils.getMJType(targetPai);
    // 如果不是条，万，同不需要判断
    var needToJudge = (type <= 2 && type >= 0);
    if (!needToJudge) {
        seatData.canChi = false;
        return;
    }
    // 如果少于两张牌不需要判断直接返回
    if (seatData.holds.length < 2) {
        seatData.canChi = false;
        return;
    }
    var chiArrs = mjutils.getChiArray(seatData, targetPai);
    console.log("得到吃牌多余的牌", chiArrs);
    if (chiArrs.length === 0) {
        console.log("多余的牌是", chiArrs);
        seatData.canChi = false;
        return;
    }
    console.log("多余的牌拿到了哦", chiArrs);
    seatData.canChi = true;
}
exports.chuPai = function(userId, pai) {
    pai = parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    //测试锦标赛用
    // if (game.conf.creator == 'match') {
    //     doGameOver(game, userId);
    //     return;
    // }
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }
    if (seatData.hued) {
        console.log('you have already hued. no kidding please.');
        return;
    }
    if (seatData.canChuPai == false) {
        console.log('no need chupai.');
        return;
    }
    if (hasOperations(seatData)) {
        console.log('plz guo before you chupai.');
        return;
    }
    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if (index == -1) {
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }
    seatData.canChuPai = false;
    game.chupaiCnt++;
    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;
    game.chuPai = pai;
    recordGameAction(game, seatData.seatIndex, ACTION_CHUPAI, pai);
    // seatData表示玩家自己
    // 检查是否可以听牌了
    // 将所有能听的牌放入到听牌数组中,用于快速判断
    checkCanTingPai(seatData);
    console.log('听牌的数组是:', seatData.tingMap);
    userMgr.broacastInRoom('game_chupai_notify_push', {
        userId: seatData.userId,
        pai: pai
    }, seatData.userId, true);
    seatData.extraPais = []; //清空多余的牌，出牌后，必然已打出了多余的牌
    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //玩家自己不检查
        if (game.turn == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        console.log("玩家是否听牌或者胡牌牌", ddd.hued, ddd.tinged);
        //已经和牌的不再检查
        if ((!ddd.hued) && (!ddd.tinged)) {
            console.log("听牌或者胡牌后都不能吃碰杠了");
            checkCanDianGang(game, ddd, pai);
            // 不能杠牌再判断是否能碰
            if (!ddd.canGang) {
                console.log('表示不能杠牌');
                gameutils.checkCanPeng(ddd, pai);
                // TODO just for debug
                // checkCanPeng(ddd, pai);
                if (!seatData.canPeng) {
                    console.log('不能碰牌,才检查是否能吃');
                    var tempTurn = (game.turn + 1) % 4;
                    console.log('检查下一家能否吃', tempTurn);
                    // 只能吃上一家的牌,因此只检查下一家能不能吃牌
                    if (i == tempTurn) {
                        gameutils.checkCanChi(ddd, pai);
                        console.log("是否能吃--------", ddd.canChi);
                    }
                }
                // // TODO just debug
                // checkCanChi(ddd, pai);
            }
        }
        checkCanHu(game, ddd, pai);
        console.log('开始检查是否有吃碰杠的操作');
        if (hasOperations(ddd)) {
            sendOperations(game, ddd, game.chuPai);
            hasActions = true;
        }
    }
    //如果没有人有操作，则向下一家发牌，并通知他出牌
    if (!hasActions) {
        setTimeout(function() {
            userMgr.broacastInRoom('guo_notify_push', {
                userId: seatData.userId,
                pai: game.chuPai
            }, seatData.userId, true);
            seatData.folds.push(game.chuPai);
            game.chuPai = -1;
            moveToNextUser(game);
            doUserMoPai(game);
        }, 500);
    }
};
// 碰牌
var pengFunc = function(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it's your turn.");
        return;
    }
    //如果没有碰的机会，则不能再碰
    if (seatData.canPeng == false) {
        console.log("seatData.peng == false");
        return;
    }
    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                clearAllWait(seatData);
                seatData.waitPengFlag = true;
                return;
            }
        }
    }
    clearAllOptions(game);
    //验证手上的牌的数目
    var pai = game.chuPai;
    var c = seatData.countMap[pai];
    if (c == null || c < 2) {
        console.log("pai:" + pai + ",count:" + c);
        console.log(seatData.holds);
        console.log("lack of mj.");
        return;
    }
    var extraPengPai = gameutils.getPengExtraPai(seatData, pai);
    console.log('计算出来的多余的牌是', extraPengPai);
    seatData.extraPais = [];
    seatData.extraPais = extraPengPai;
    _updateLastPai(seatData);
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < 2; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
    }
    seatData.pengs.push(pai);
    game.chuPai = -1;
    recordGameAction(game, seatData.seatIndex, ACTION_PENG, pai);
    //广播通知其它玩家
    userMgr.broacastInRoom('peng_notify_push', {
        userid: seatData.userId,
        pai: pai,
        extraPengPai: extraPengPai
    }, seatData.userId, true);
    seatData.tinged = true;
    // 标注为听牌
    //碰的玩家打牌
    moveToNextUser(game, seatData.seatIndex);
    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', seatData.userId, seatData.userId, true);
};
exports.peng = pengFunc;
// 吃牌
var chiFunc = function(userId, pai, chiArray) {
    console.log("吃牌操作", userId, chiArray);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    //如果是他出的牌，则忽略
    if (game.turn == seatData.seatIndex) {
        console.log("it's your turn.");
        return;
    }
    //如果没有吃的机会，则不能吃
    if (seatData.canChi == false) {
        console.log("seatData.canChi == false");
        return;
    }
    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            //凡其他人能胡，能杠，能碰，均需要等待
            var noChiFlag = ddd.canHu || ddd.canGang || ddd.canPeng;
            if (noChiFlag && i != seatData.seatIndex) {
                clearAllWait(seatData);
                seatData.waitChiFlag = true;
                seatData.waitChiData.pai = pai;
                seatData.waitChiData.chiArray = chiArray;
                return;
            }
        }
    }
    // 先获得可以吃的组合
    var extraChiPaiInfo = gameutils.getChiExtraPai(seatData, pai);
    console.log("extraChiPaiInfo-----1", extraChiPaiInfo);
    if (extraChiPaiInfo == null || extraChiPaiInfo.length <= 0) {
        console.log("出错了,没有获取到多余的吃牌组合");
        return;
    }
    // 吃牌的话是将两张目标手牌都丢出去
    var chiArray = chiArray;
    for (k of chiArray) {
        console.log("chiarray,", k);
        var index = seatData.holds.indexOf(k);
        if (index == -1) {
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[k]--;
    }
    // 吃牌的记录放在后面。因为不仅要记录吃的牌，还要记录吃牌的数组
    // recordGameAction(game, seatData.seatIndex, ACTION_CHI, pai);
    game.chuPai = -1;
    var temp = getExtraByChiArray(extraChiPaiInfo, chiArray)
    if (temp == null) {
        console.log("getExtraByChiArray---null");
        return;
    }
    //TODO 还需要进一步处理,要根据玩家选择的牌的组合来处理
    var extraChiPai = [];
    if (temp != null && temp.length > 0) {
        extraChiPai = temp;
    }
    seatData.extraPais = [];
    seatData.extraPais = extraChiPai;
    _updateLastPai(seatData);
    //广播通知其它玩家
    console.log('计算出来的多余的牌是', extraChiPai);
    userMgr.broacastInRoom('chi_notify_push', {
        userid: seatData.userId,
        pai: pai,
        extraChiPai: extraChiPai,
        chiArray: chiArray
    }, seatData.userId, true);
    seatData.tinged = true;
    console.log("玩家选择的吃牌的组合是--1", chiArray);
    chiArray.push(pai);
    //此处记录玩家吃牌的操作,注意，此处记录的是吃牌的对象。不是单张牌。解析的时候要判断类型
    var pd = {
        "pai": pai,
        "chiArray": chiArray
    };
    recordGameAction(game, seatData.seatIndex, ACTION_CHI, pd);
    console.log("玩家选择的吃牌的组合是--2", chiArray);
    chiArray.sort(function(a, b) {
        return a - b;
    });
    console.log("玩家选择的吃牌的组合是--3", chiArray);
    seatData.chis.push(chiArray);
    clearAllOptions(game);
    //吃的玩家打牌
    moveToNextUser(game, seatData.seatIndex);
    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', seatData.userId, seatData.userId, true);
};
exports.chi = chiFunc;
exports.isPlaying = function(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        return false;
    }
    var game = seatData.game;
    if (game.state == "idle") {
        return false;
    }
    return true;
}

function checkCanQiangGang(game, turnSeat, seatData, pai) {
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //杠牌者不检查
        if (seatData.seatIndex == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        //已经和牌的不再检查
        if (ddd.hued) {
            continue;
        }
        checkCanHu(game, ddd, pai);
        if (ddd.canHu) {
            sendOperations(game, ddd, pai);
            hasActions = true;
        }
    }
    if (hasActions) {
        game.qiangGangContext = {
            turnSeat: turnSeat,
            seatData: seatData,
            pai: pai,
            isValid: true,
        }
    } else {
        game.qiangGangContext = null;
    }
    return game.qiangGangContext != null;
}

function doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai) {
    var seatIndex = seatData.seatIndex;
    var gameTurn = turnSeat.seatIndex;
    var isZhuanShouGang = false;
    if (gangtype == "wangang") {
        var idx = seatData.pengs.indexOf(pai);
        if (idx >= 0) {
            seatData.pengs.splice(idx, 1);
        }
        //如果最后一张牌不是杠的牌，则认为是转手杠
        if (seatData.holds[seatData.holds.length - 1] != pai) {
            isZhuanShouGang = true;
        }
    }
    //进行碰牌处理
    //扣掉手上的牌
    //从此人牌中扣除
    for (var i = 0; i < numOfCnt; ++i) {
        var index = seatData.holds.indexOf(pai);
        if (index == -1) {
            console.log(seatData.holds);
            console.log("can't find mj.");
            return;
        }
        seatData.holds.splice(index, 1);
        seatData.countMap[pai]--;
    }
    recordGameAction(game, seatData.seatIndex, ACTION_GANG, pai);
    //记录下玩家的杠牌
    if (gangtype == "angang") {
        seatData.angangs.push(pai);
        var ac = recordUserAction(game, seatData, "angang");
        ac.score = game.conf.baseScore * 2;
    } else if (gangtype == "diangang") {
        seatData.diangangs.push(pai);
        var ac = recordUserAction(game, seatData, "diangang", gameTurn);
        ac.score = game.conf.baseScore * 2;
        var fs = turnSeat;
        recordUserAction(game, fs, "fanggang", seatIndex);
    } else if (gangtype == "wangang") {
        seatData.wangangs.push(pai);
        if (isZhuanShouGang == false) {
            var ac = recordUserAction(game, seatData, "wangang");
            ac.score = game.conf.baseScore;
        } else {
            recordUserAction(game, seatData, "zhuanshougang");
        }
    }
    checkCanTingPai(seatData);
    // TODO 多余的牌
    var extraPai = 1;
    //通知其他玩家，有人杠了牌
    userMgr.broacastInRoom('gang_notify_push', {
        userid: seatData.userId,
        pai: pai,
        gangtype: gangtype,
        extraPai: extraPai
    }, seatData.userId, true);
    // 标注为听牌
    if (gangtype != "angang") {
        seatData.tinged = true;
    }
    //变成自己的轮子
    moveToNextUser(game, seatIndex);
    //再次摸牌
    doUserMoPai(game);
    //只能放在这里。因为过手就会清除杠牌标记
    seatData.lastFangGangSeat = gameTurn;
}
var gangFunc = function(userId, pai) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    var game = seatData.game;
    //如果没有杠的机会，则不能再杠
    if (seatData.canGang == false) {
        console.log("seatData.gang == false");
        return;
    }
    //和的了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    if (seatData.gangPai.indexOf(pai) == -1) {
        console.log("the given pai can't be ganged.");
        return;
    }
    //如果有人可以胡牌，则需要等待
    var i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        if (i == game.turn) {
            break;
        } else {
            var ddd = game.gameSeats[i];
            if (ddd.canHu && i != seatData.seatIndex) {
                clearAllWait(seatData);
                seatData.waitGangFlag = true;
                return;
            }
        }
    }
    var numOfCnt = seatData.countMap[pai];
    var gangtype = ""
    //弯杠 去掉碰牌
    if (numOfCnt == 1) {
        console.log('numOfCnt==1,弯杠');
        gangtype = "wangang"
    } else if (numOfCnt == 3) {
        console.log("numOfCnt==3,点杠");
        gangtype = "diangang"
    } else if (numOfCnt == 4) {
        console.log("numOfCnt==4,暗杠");;
        gangtype = "angang";
    } else {
        console.log("invalid pai count.");
        return;
    }
    game.chuPai = -1;
    clearAllOptions(game);
    seatData.canChuPai = false;
    userMgr.broacastInRoom('hangang_notify_push', seatIndex, seatData.userId, true);
    //如果是弯杠，则需要检查是否可以抢杠
    var turnSeat = game.gameSeats[game.turn];
    if (numOfCnt == 1) {
        var canQiangGang = checkCanQiangGang(game, turnSeat, seatData, pai);
        if (canQiangGang) {
            return;
        }
    }
    doGang(game, turnSeat, seatData, gangtype, numOfCnt, pai);
};
exports.gang = gangFunc;
var huFunc = function(userId, waitHu_index) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    var game = seatData.game;
    //如果他不能和牌，那和个啥啊
    if (seatData.canHu == false) {
        console.log("invalid request.");
        return;
    }
    //和过了，就不要再来了
    if (seatData.hued) {
        console.log('you have already hued. no kidding plz.');
        return;
    }
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    // var manyHuFlag = roomInfo.conf.yipaoduoxiang > 0;
    // //只有在不是一炮多响的情况下，才去判断是否等待胡牌
    // if (!manyHuFlag) {
    //     //如果是解除等待状态的胡,则不需要再进行等待判断直接胡
    //     if (!waitHu_index) {
    //         //判断前面的人是否有人有胡牌操作
    //         var noNeedWait = func_canPostWaitHu(game, seatData.seatIndex);
    //         if (!noNeedWait) {
    //             //需要等待
    //             // console.log("ly:需要等待的胡：" + seatIndex);
    //             clearAllWait(seatData);
    //             seatData.waitHuFlag = true;
    //             return;
    //         }
    //     }
    // }
    //标记为和牌
    seatData.hued = true;
    var hupai = game.chuPai;
    var isZimo = false;
    var turnSeat = game.gameSeats[game.turn];
    seatData.isGangHu = turnSeat.lastFangGangSeat >= 0;
    var notify = -1;
    if (game.qiangGangContext != null) {
        var gangSeat = game.qiangGangContext.seatData;
        hupai = game.qiangGangContext.pai;
        notify = hupai;
        var ac = recordUserAction(game, seatData, "qiangganghu", gangSeat.seatIndex);
        ac.iszimo = false;
        recordGameAction(game, seatIndex, ACTION_HU, hupai);
        seatData.isQiangGangHu = true;
        game.qiangGangContext.isValid = false;
        var idx = gangSeat.holds.indexOf(hupai);
        if (idx != -1) {
            gangSeat.holds.splice(idx, 1);
            gangSeat.countMap[hupai]--;
            userMgr.sendMsg(gangSeat.userId, 'game_holds_push', gangSeat.holds);
        }
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(hupai);
        if (seatData.countMap[hupai]) {
            seatData.countMap[hupai]++;
        } else {
            seatData.countMap[hupai] = 1;
        }
        recordUserAction(game, gangSeat, "beiqianggang", seatIndex);
    } else if (game.chuPai == -1) {
        hupai = seatData.holds[seatData.holds.length - 1];
        notify = hupai;
        if (seatData.isGangHu) {
            if (turnSeat.lastFangGangSeat == seatIndex) {
                var ac = recordUserAction(game, seatData, "ganghua");
                ac.iszimo = true;
            } else {
                var diangganghua_zimo = game.conf.dianganghua == 1;
                if (diangganghua_zimo) {
                    var ac = recordUserAction(game, seatData, "dianganghua");
                    ac.iszimo = true;
                } else {
                    var ac = recordUserAction(game, seatData, "dianganghua", turnSeat.lastFangGangSeat);
                    ac.iszimo = false;
                }
            }
        } else {
            var ac = recordUserAction(game, seatData, "zimo");
            ac.iszimo = true;
        }
        isZimo = true;
        recordGameAction(game, seatIndex, ACTION_ZIMO, hupai);
    } else {
        notify = game.chuPai;
        //将牌添加到玩家的手牌列表，供前端显示
        seatData.holds.push(game.chuPai);
        if (seatData.countMap[game.chuPai]) {
            seatData.countMap[game.chuPai]++;
        } else {
            seatData.countMap[game.chuPai] = 1;
        }
        console.log(seatData.holds);
        var at = "hu";
        //炮胡
        if (turnSeat.lastFangGangSeat >= 0) {
            at = "gangpaohu";
        }
        var ac = recordUserAction(game, seatData, at, game.turn);
        ac.iszimo = false;
        //记录玩家放炮信息
        var fs = game.gameSeats[game.turn];
        recordUserAction(game, fs, "fangpao", seatIndex);
        recordGameAction(game, seatIndex, ACTION_HU, hupai);
        game.fangpaoshumu++;
        if (game.fangpaoshumu > 1) {
            game.yipaoduoxiang = seatIndex;
        }
    }
    if (game.firstHupai < 0) {
        game.firstHupai = seatIndex;
    }
    //记录胡哪张牌
    seatData.hupai = notify;
    //保存番数
    var ti = seatData.tingMap[hupai];
    seatData.fan = ti.fan;
    seatData.pattern = ti.pattern;
    seatData.iszimo = isZimo;
    if (isZimo) {
        seatData.numZiMo++;
    } else {
        seatData.numJiePao++;
    }
    //如果是最后一张牌，则认为是海底胡
    // 莫到最后一张牌胡牌
    seatData.isHaiDiHu = game.currentIndex == game.mahjongs.length - 15;
    game.hupaiList.push(seatData.seatIndex);
    clearAllOptions(game, seatData);
    //通知前端，有人和牌了
    userMgr.broacastInRoom('hu_push', {
        seatindex: seatIndex,
        iszimo: isZimo,
        hupai: notify
    }, seatData.userId, true);
    //清空所有非胡牌操作
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        ddd.canPeng = false;
        ddd.canGang = false;
        ddd.canChuPai = false;
        ddd.canChi = false;
        sendOperations(game, ddd, hupai);
    }
    //如果还有人可以胡牌，则等待
    // 如果是一炮多响
    console.log("game.yipaoduoxiang", game.yipaoduoxiang);
    var roomId = roomMgr.getUserRoom(userId);
    if (roomId == null) {
        return;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return;
    }
    console.log("roominfo.conf", roomInfo.conf);
    if (roomInfo.conf.yipaoduoxiang > 0) {
        console.log('一炮多响!!!!!!!!!!!!');
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var ddd = game.gameSeats[i];
            if (ddd.canHu) {
                return;
            }
        }
    }
    doGameOver(game, seatData.userId);
};
exports.hu = huFunc;
var clearAllWait = function(seatData) {
    if (!seatData) {
        console.log("ly:clearAllWait func error, seatData is null or undefined");
        return;
    }
    seatData.waitHuFlag = false;
    seatData.waitGangFlag = false;
    seatData.waitPengFlag = false;
    seatData.waitChiFlag = false;
    seatData.waitChiData = {};
};
var func_canPostWaitHu = function(game, seatIndex) {
    //console.log("ly:func_canPostWaitHu:game.turn: " + game.turn);
    //console.log("ly:func_canPostWaitHu:seatIndex: " + seatIndex);
    var canPostWaitHu = false;
    if (seatIndex == game.turn || seatIndex == (game.turn + 1) % 4) {
        canPostWaitHu = true;
    }
    if (seatIndex == (game.turn + 2) % 4) {
        var ddd1 = game.gameSeats[(game.turn + 1) % 4];
        var ddd0 = game.gameSeats[(game.turn + 0) % 4];
        if (!ddd1.canHu && !ddd0.canHu) {
            canPostWaitHu = true;
        }
    }
    if (seatIndex == (game.turn + 3) % 4) {
        var ddd2 = game.gameSeats[(game.turn + 2) % 4];
        var ddd1 = game.gameSeats[(game.turn + 1) % 4];
        var ddd0 = game.gameSeats[(game.turn + 0) % 4];
        if (!ddd2.canHu && !ddd1.canHu && !ddd0.canHu) {
            canPostWaitHu = true;
        }
    }
    return canPostWaitHu;
};
var guoFunc = function(userId, guoType) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    var game = seatData.game;
    //如果玩家没有对应的操作，则也认为是非法消息
    if ((seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi) == false) {
        console.log("no need guo.");
        return;
    }
    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;
    userMgr.sendMsg(seatData.userId, "guo_result");
    clearAllOptions(game, seatData);
    //这里还要处理过胡的情况
    if (game.chuPai >= 0 && seatData.canHu) {
        seatData.guoHuFan = seatData.tingMap[game.chuPai].fan;
    }
    if (doNothing) {
        //并且出掉自己手中的牌
        if (seatData.canChuPai) {
            exports.chuPai(seatData.userId, seatData.lastPai);
            return;
        }
        return;
    }
    if (!guoType) {
        //操作等待的操作
        if (opWaitingFunc(game)) {
            return;
        }
    }
    //如果还有人可以操作，则等待
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var ddd = game.gameSeats[i];
        if (hasOperations(ddd)) {
            return;
        }
    }
    //已经没有玩家可以操作了
    //删除定时器
    _timerDel(game);
    //如果是一炮多响检查是否已经有人胡过牌了,如果胡过牌了则游戏结束
    if (game.conf.yipaoduoxiang > 0) {
        for (var i = 0; i < game.gameSeats.length; ++i) {
            var ddd = game.gameSeats[i];
            if (ddd.hued) {
                doGameOver(game, ddd.userId);
                return;
            }
        }
    }
    //如果是已打出的牌，则需要通知。
    if (game.chuPai >= 0) {
        var uid = game.gameSeats[game.turn].userId;
        userMgr.broacastInRoom('guo_notify_push', {
            userId: uid,
            pai: game.chuPai
        }, seatData.userId, true);
        seatData.folds.push(game.chuPai);
        game.chuPai = -1;
    }
    var qiangGangContext = game.qiangGangContext;
    //清除所有的操作
    clearAllOptions(game);
    if (qiangGangContext != null && qiangGangContext.isValid) {
        doGang(game, qiangGangContext.turnSeat, qiangGangContext.seatData, "wangang", 1, qiangGangContext.pai);
    } else {
        //下家摸牌
        moveToNextUser(game);
        doUserMoPai(game);
    }
};
exports.guo = guoFunc;
//处理等待的操作
var opWaitingFunc = function(game) {
    var i = game.turn;
    //遍历碰，杠
    //注意i值需要重新初始化
    i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        var ddd = game.gameSeats[i];
        if (i == game.turn) {
            break;
        } else {
            if (ddd.canPeng || ddd.canGang) {
                if (ddd.waitGangFlag) {
                    gangFunc(ddd.userId, game.chuPai);
                    return true;
                } else if (ddd.waitPengFlag) {
                    pengFunc(ddd.userId);
                    return true;
                }
            }
        }
    }
    //遍历吃
    //注意i值需要重新初始化
    i = game.turn;
    while (true) {
        var i = (i + 1) % 4;
        var ddd = game.gameSeats[i];
        if (i == game.turn) {
            break;
        } else {
            if (ddd.canChi) {
                if (ddd.waitChiFlag) {
                    if (!ddd.waitChiData.pai) {
                        console.log("Error:in : can not find chi Pai when I can chi ");
                        return false;
                    }
                    chiFunc(ddd.userId, ddd.waitChiData.pai, ddd.waitChiData.chiArray);
                    return true;
                }
            }
        }
    }
    return false;
};
exports.hasBegan = function(roomId) {
    var game = games[roomId];
    if (game != null) {
        return true;
    }
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo != null) {
        return roomInfo.numOfGames > 0;
    }
    return false;
};
var dissolvingList = [];
exports.doDissolve = function(roomId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }
    var game = games[roomId];
    doGameOver(game, roomInfo.seats[0].userId, true);
};
exports.dissolveRequest = function(roomId, userId) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }
    if (roomInfo.dr != null) {
        return null;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }
    roomInfo.dr = {
        endTime: Date.now() + 30000,
        states: [false, false, false, false]
    };
    roomInfo.dr.states[seatIndex] = true;
    dissolvingList.push(roomId);
    return roomInfo;
};
exports.dissolveAgree = function(roomId, userId, agree) {
    var roomInfo = roomMgr.getRoom(roomId);
    if (roomInfo == null) {
        return null;
    }
    if (roomInfo.dr == null) {
        return null;
    }
    var seatIndex = roomMgr.getUserSeat(userId);
    if (seatIndex == null) {
        return null;
    }
    if (agree) {
        roomInfo.dr.states[seatIndex] = true;
    } else {
        roomInfo.dr = null;
        var idx = dissolvingList.indexOf(roomId);
        if (idx != -1) {
            dissolvingList.splice(idx, 1);
        }
    }
    return roomInfo;
};

function update() {
    for (var i = dissolvingList.length - 1; i >= 0; --i) {
        var roomId = dissolvingList[i];
        var roomInfo = roomMgr.getRoom(roomId);
        if (roomInfo != null && roomInfo.dr != null) {
            if (Date.now() > roomInfo.dr.endTime) {
                console.log("delete room and games");
                exports.doDissolve(roomId);
                dissolvingList.splice(i, 1);
            }
        } else {
            dissolvingList.splice(i, 1);
        }
    }
}
setInterval(update, 1000);
// 财神操作
function caiShen(userId, pai) {
    console.log("财神操作", userId, pai);
    pai = parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = seatData.game;
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }
    if (mjutils.getMJType(pai) != 4) {
        console.log("不是财神不能换牌");
        return;
    };
    console.log("当前玩家的手牌是");
    console.log("seatData.holds:", seatData.holds);
    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if (index == -1) {
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }
    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;
    seatData.caiShen.push(pai);
    console.log("玩家的信息seatData.caiShen", seatData.caiShen);
    game.caiShenPai = pai;
    recordGameAction(game, seatData.seatIndex, ACTION_CAISHEN, pai);
    userMgr.broacastInRoom('game_caishen_notify_push', {
        userId: seatData.userId,
        pai: pai
    }, seatData.userId, true);
    doUserMoPai(game);
};
exports.caiShen = caiShen;
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}