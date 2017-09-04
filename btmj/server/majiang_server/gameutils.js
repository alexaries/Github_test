var mjutils = require('./mjutils');
// 洗牌
// 传入一个数组用于存放一局游戏的初始牌
function shuffle(game) {
    if (!game.mahjongs instanceof Array) {
        return;
    };
    var mahjongs = game.mahjongs;
    //筒 (0 ~ 8 表示筒子
    var index = 0;
    for (var i = 0; i < 9; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    //条 9 ~ 17表示条子
    for (var i = 9; i < 18; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    // 18 ~ 26表示万
    for (var i = 18; i < 27; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    //字一（东西南北）
    for (var i = 27; i < 34; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    //花一（春夏秋冬）
    //花二（兰竹菊梅）
    for (var i = 34; i < 42; ++i) {
        mahjongs[index] = i;
        index++;
    }
    // 随机处理
    for (var i = 0; i < mahjongs.length; ++i) {
        var lastIndex = mahjongs.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[index];
        mahjongs[index] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
}
// 摸牌
function mopai(game, seatIndex) {
    if (game.currentIndex == game.mahjongs.length) {
        return -1;
    }
    var data = game.gameSeats[seatIndex];
    var mahjongs = data.holds;
    var pai = game.mahjongs[game.currentIndex];
    // //console.log("摸牌！" + pai);
    mahjongs.push(pai);
    //统计牌的数目 ，用于快速判定（空间换时间）
    // //console.log("玩家" + ":" + seatIndex + "的手牌是" + mahjongs);
    var c = data.countMap[pai];
    if (c == null) {
        c = 0;
    }
    data.countMap[pai] = c + 1;
    game.currentIndex++;
    // //console.log(" game.currentIndex" + game.currentIndex);
    return pai;
}
// 发牌
function deal(game) {
    //强制清0
    game.currentIndex = 0;
    //每人13张 一共 13*4 ＝ 52张 庄家多一张 53张
    var seatIndex = game.button;
    for (var i = 0; i < 52; ++i) {
        var mahjongs = game.gameSeats[seatIndex].holds;
        if (mahjongs == null) {
            mahjongs = [];
            game.gameSeats[seatIndex].holds = mahjongs;
        }
        mopai(game, seatIndex);
        seatIndex++;
        seatIndex %= 4;
    }
    //庄家多摸最后一张
    game.gameSeats[game.button].lastPai = mopai(game, game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}

function checkWillTing(seatData, targetArray) {
    //console.log("checkWillTing--1:", targetArray);
    // 吃碰都是三张牌,目标牌数组+目标牌
    // 移除的是两张手牌,一张来自其他玩家
    // 先移除对应的目标手牌
    seatData.holds = mjutils.removeFromArray(seatData.holds, targetArray);
    seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
    var extraPai = [];
    var holds = seatData.holds;
    var prePai = -1;
    // console.log("ly:cwt:手牌", holds);
    // 需要逐一移除一张手牌进行判断
    for (var i = 0; i < holds.length; i++) {
        //console.log('holds', holds[i]);
        if (holds[i] == prePai) {
            //已经判断过的牌不需要再次判断
            continue;
        }
        prePai = holds[i];
        var flag = checkChiPengTing(seatData, holds[i]);
        if (flag) {
            //console.log('可以听牌!', holds[i]);
            extraPai.push(holds[i]);
        }
    }
    // 移除手牌后，一定要还原
    seatData.holds = mjutils.revertToOrigin(holds, targetArray);
    seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
    // console.log("checkWillTing-多余的手牌:end", extraPai);
    return extraPai;
}
//检查吃碰之后能否听牌
function checkChiPengTing(seatData, extraPai) {
    // console.log("1,判断checkChiPengTing", extraPai, seatData.holds);
    //检查手上的牌是不是还有财神，如果有则不能胡牌
    var extraPaiArray = [extraPai];
    seatData.holds = mjutils.removeFromArray(seatData.holds, extraPaiArray);
    seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
    // 吃牌,碰之后一定不能听七小对和十三幺
    //对对胡叫牌有两种情况
    //1、N坎 + 1张单牌
    //2、N-1坎 + 两对牌
    // console.log("ly:checkChiPengTing => ", extraPai);
    // console.log('**ly:判断checkChiPengTing => ', seatData.holds);
    var singleCount = 0;
    var colCount = 0;
    var pairCount = 0;
    for (var k in seatData.countMap) {
        var c = seatData.countMap[k];
        if (c == 1) {
            singleCount++;
        } else if (c == 2) {
            pairCount++;
        } else if (c == 3) {
            colCount++;
        } else if (c == 4) {
            singleCount++;
            pairCount += 2;
        }
    }
    if ((pairCount == 2 && singleCount == 0) || (pairCount == 0 && singleCount == 1)) {
        seatData.holds = mjutils.revertToOrigin(seatData.holds, extraPaiArray);
        seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
        // console.log("ly:如果有两对,且么有单张,肯定可以听牌或者说单一张,肯定可以听牌哦");
        return true;
    }
    // 不满足那些特殊的模式,那就检查普通模式哦
    // //console.log("开始检查是否是普通的模式");
    //检查是不是平胡
    // 只要检查听牌数组中是否有数据
    var flag = false;
    flag = mjutils.judgeTingPai(seatData, 0, 34, true);
    // console.log("##ly:判断checkChiPengTing-----end", flag);
    seatData.holds = mjutils.revertToOrigin(seatData.holds, extraPaiArray);
    seatData.countMap = mjutils.setHoldsCountMap(seatData.holds);
    return flag;
}
//检查是否可以碰
function checkCanPeng(seatData, targetPai) {
    //console.log('checkCanPeng---1---', seatData.holds, targetPai);
    //如果目标牌是空,则不进行判断
    if (seatData == null || targetPai == null) {
        //console.log("seatdata or targetpai is null");
        seatData.canPeng = false;
        return;
    }
    // //console.log("目标牌存在--2");
    if (mjutils.checkCaiShen(seatData)) {
        // //console.log("都有财神,不需要再判断了--2");
        seatData.canPeng = false;
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count !== null && count >= 2) {
        // //console.log('当前牌存在至少两张', count);
        var targetArray = [targetPai, targetPai];
        // //console.log("当前目标牌是", targetArray);
        var extraPai = [];
        extraPai = checkWillTing(seatData, targetArray);
        if (extraPai.length === 0) {
            // //console.log("多余的牌是", extraPai);
            seatData.canPeng = false;
            return;
        }
        //console.log("checkCanPeng--多余的牌拿到了哦", extraPai);
        seatData.canPeng = true;
    }
}
//检查是否可以吃
function checkCanChi(seatData, targetPai) {
    // console.log("check can chi", seatData.holds, targetPai);
    if (seatData == null || targetPai == null) {
        // //console.log("targetPai是空值,不检查--1");
        seatData.canChi = false;
        return;
    }
    if (mjutils.checkCaiShen(seatData)) {
        // //console.log("都有财神,不需要再判断了--2");
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
    var extraPai = [];
    var chiArrs = mjutils.getChiArray(seatData, targetPai);
    // console.log("ly:吃Arrays", chiArrs);
    if (chiArrs.length !== 0) {
        // 讲吃牌的组合逐一进行判断
        for (var k in chiArrs) {
            var chiArr = chiArrs[k];
            // extraPai = checkWillTing(seatData, chiArr);
            var tChi = checkWillTing(seatData, chiArr);
            if (tChi && tChi.length > 0) {
                extraPai.push(tChi);
            }
        }
    }
    // console.log("得到吃牌多余的牌", extraPai);
    if (extraPai.length === 0) {
        // console.log("多余的牌是", extraPai);
        seatData.canChi = false;
        return;
    }
    //console.log("checkCanChi--多余的牌拿到了哦", extraPai);
    seatData.canChi = true;
}
//获得碰的多余牌
function getPengExtraPai(seatData, targetPai) {
    //console.log('checkCanPeng---1---', targetPai);
    var extraPai = [];
    //如果目标牌是空,则不进行判断
    if (seatData == null || targetPai == null) {
        //console.log("seatdata or targetpai is null");
        return extraPai;
    }
    // //console.log("目标牌存在--2");
    if (mjutils.checkCaiShen(seatData)) {
        // //console.log("都有财神,不需要再判断了--2");
        return extraPai;
    }
    var count = seatData.countMap[targetPai];
    if (count !== null && count >= 2) {
        // //console.log('当前牌存在至少两张', count);
        var targetArray = [targetPai, targetPai];
        // //console.log("当前目标牌是", targetArray);
        extraPai = checkWillTing(seatData, targetArray);
        //console.log("getPengExtraPai---多余的牌拿到了哦", extraPai);
        return extraPai;
    }
}
//获得吃的多余牌
function getChiExtraPai(seatData, targetPai) {
    // console.log("check can chi", seatData.holds, targetPai);
    var ret = [];
    if (seatData == null || targetPai == null) {
        // //console.log("targetPai是空值,不检查--1");
        return ret;
    }
    if (mjutils.checkCaiShen(seatData)) {
        // //console.log("都有财神,不需要再判断了--2");
        return ret;
    }
    var type = mjutils.getMJType(targetPai);
    // 如果不是条，万，同不需要判断
    var needToJudge = (type <= 2 && type >= 0);
    if (!needToJudge) {
        return ret;
    }
    // 如果少于两张牌不需要判断直接返回
    if (seatData.holds.length < 2) {
        return ret;
    }
    var chiArrays = mjutils.getChiArray(seatData, targetPai);
    if (chiArrays.length !== 0) {
        // 讲吃牌的组合逐一进行判断
        for (var i = 0; i < chiArrays.length; i++) {
            var chiArray = chiArrays[i];
            var extraPai = checkWillTing(seatData, chiArray);
            if (extraPai.length !== 0) {
                var obj = {};
                obj.chi = chiArray;
                obj.extra = extraPai;
                ret[i] = obj;
            }
        }
    }
    ret = delUndefindInObj(ret);
    return ret;
}
//删除对象中属性是undefind的key-value;
var delUndefindInObj = function(chiInfo) {
    var kRet = [];
    for (var obj of chiInfo) {
        if (typeof(obj) == "undefined") {
            //
        } else {
            kRet.push(obj);
        }
    }
    return kRet;
}
exports.checkCanChi = checkCanChi;
exports.checkCanPeng = checkCanPeng;
exports.checkChiPengTing = checkChiPengTing;
exports.checkWillTing = checkWillTing;
exports.getPengExtraPai = getPengExtraPai;
exports.getChiExtraPai = getChiExtraPai;
exports.shuffle = shuffle;
exports.mopai = mopai;
exports.deal = deal;