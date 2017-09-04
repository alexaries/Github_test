var _calBack = function() {
    console.log("_calBack");
};

function checkCanTingPai(game, seatData, callback) {
    callback = callback || _calBack;
    if (!seatData.allowTingFlag) {
        callback(null);
    }
    var huHolds = [];
    var h_holds = seatData.holds;
    for (var i = 0; i < h_holds.length; i++) {
        var pp = h_holds[i];
        pp = getMJ_BID(pp);
        huHolds.push(pp);
        if (pp >= 100) {
            var count = seatData.countMap[pp];
            if (!count) {
                count = 1;
            } else {
                count++;
            }
            seatData.countMap[pp] = count;
        }
    }
    seatData.huHolds = huHolds;
    var tM = [];
    seatData.hupaiDict = {};
    seatData.canChiDic = {};
    seatData.ctx = {};
    var checkConfig = {
        tM: tM
    };
    var b_ctx = {
        daPai: getMJ_SID(game.daPai)
    };
    if (isQingYiSe(seatData, b_ctx)) {
        //清一色,风一色都走这里
        //除癞子之外剩下的都是同一种颜色。
        //此副牌可能是:
        //          大胡:需要下一张摸到的是癞子。或者同一种类型的牌。
        //          屁胡:需要非同类型的2,5,8
        var reType = b_ctx.reType;
        var begin = reType * 9;
        var end = (reType + 1) * 9;
        end = end > 34 ? 34 : end;
        checkConfig.reType = reType;
        checkConfig.isWantQingYiSe = true;
        checkTinPaiRange(begin, end, game, seatData, checkConfig);
        if (getMJType(b_ctx.daPai) !== reType) {
            checkTinPaiRange(b_ctx.daPai, b_ctx.daPai + 1, game, seatData, checkConfig);
        }
        checkConfig.isWantQingYiSe = false;
        //计算屁胡
        var phs = [];
        for (var i = 0; i < 3; i++) {
            if (i != reType) {
                var p2 = i * 9 + 1;
                var p5 = i * 9 + 4;
                var p8 = i * 9 + 7;
                phs.push(p2);
                phs.push(p5);
                phs.push(p8);
            }
        }
        checkConfig.isWant258 = true;
        for (var i = 0; i < phs.length; i++) {
            var s_p = phs[i];
            checkTinPaiRange(s_p, s_p + 1, game, seatData, checkConfig);
        }
    } else {
        checkConfig.isWant258 = true;
        checkTinPaiRange(0, 34, game, seatData, checkConfig);
    }
    console.log("****seatData[" + seatData.seatIndex + "]*************");
    console.log("#CTX:", seatData.ctx.tingData);
    console.log("持牌:" + JSON.stringify(holdsLog(seatData)));
    console.log("#################################################");
    for (key in seatData.countMap) {
        if (key >= 100) {
            seatData.countMap[key] = 0;
        }
    }
    callback(seatData.ctx.tingData);
}

function checkTinPaiRange(startX, startY, game, seatData, checkConfig) {
    for (var i = startX; i < startY; i++) {
        var k = getMJ_BID(i);
        if (seatData.ctx && seatData.ctx.tingData) {
            if (seatData.ctx.tingData[getMJ_SID(k)]) {
                continue;
            }
        }
        var count = seatData.countMap[k];
        if (!count) {
            count = 1;
        } else {
            count++;
        }
        if (count > 4) {
            continue;
        }
        seatData.countMap[k] = count;
        seatData.huHolds.push(k);
        var tingData = {};
        if (seatData.ctx && seatData.ctx.tingData) {
            tingData = y_deepCopy(true, {}, seatData.ctx.tingData);
        }
        var hasConfirms = [];
        if (seatData.ctx && seatData.ctx.hasConfirms) {
            hasConfirms = seatData.ctx.hasConfirms;
        }
        var ctx = seatData.ctx = {
            key: getMJ_SID(k),
            daPai: getMJ_SID(game.daPai),
            tingData: tingData,
            hupaiCurrent: [],
            huHolds: seatData.huHolds.slice(0),
            currentPai: i,
            canHu: false,
            canChiDic: {},
            hasConfirms: hasConfirms,
            hasChi: (seatData.chis.length > 0),
            laizi_used: -1, //只有屁胡时这个值才有效
        };
        if (checkConfig.isWantQingYiSe) {
            var tempHo = ctx.huHolds.slice(0);
            var tempHo_str = tempHo.sort(sortNumber).join("");
            if (ctx.hasConfirms.indexOf(tempHo_str) == -1) {
                check_qingYiSe_single(game, seatData, ctx)
                if (ctx.canHu) {
                    if (checkConfig.reType == 3) {
                        ctx.tingData[ctx.key]["isFengYiSe"] = true;
                    } else {
                        ctx.tingData[ctx.key]["isQingYiSe"] = true;
                    }
                }
                ctx.hasConfirms.push(tempHo_str);
            }
        }
        if (checkConfig.isWant258) {
            var tempHo = ctx.huHolds.slice(0);
            var tempHo_str = tempHo.sort(sortNumber).join("");
            if (ctx.hasConfirms.indexOf(tempHo_str) == -1) {
                //先判断可能是碰碰胡吗
                var ppFlag = is_PP_hu(game, seatData, ctx);
                if (ppFlag) {
                    ctx.tingData[ctx.key]["isPengpengHu"] = true;
                } else {
                    check_258_Single(game, seatData, ctx);
                    if (ctx.canHu) {
                        var tempHolds = ctx.tingData[ctx.key]["hu"];
                        if (is_258_holds(tempHolds, {
                                daPai: getMJ_SID(game.daPai)
                            }, ctx)) {
                            ctx.tingData[ctx.key]["isJiangYiSe"] = true;
                        }
                    }
                }
                ctx.hasConfirms.push(tempHo_str);
            }
        }
        count--;
        seatData.countMap[k] = count;
        if (ctx.canHu) {
            var pk = getMJ_SID(k);
            // tM.push(pk);
        }
        seatData.ctx.hupaiCurrent = [];
        seatData.huHolds.pop();
        // console.log("countMap:--->>>"+JSON.stringify(seatData.countMap));
    }
}

function sortNumber(a, b) {
    return a - b;
}
//“样本方差”,numbers.length>1
var variance = function(numbers) {
    var mean = 0;
    var sum = 0;
    for (var i = 0; i < numbers.length; i++) {
        sum += numbers[i];
    }
    mean = sum / numbers.length;
    sum = 0;
    for (var i = 0; i < numbers.length; i++) {
        sum += Math.pow(numbers[i] - mean, 2);
    }
    return sum / (numbers.length - 1);
};

function _piJiangs() {
    //下标从0开始
    return [1, 4, 7];
}

function _is258Valid(m_p) {
    if (m_p == null) {
        return false;
    }
    m_p = getMJ_Value(parseInt(m_p));
    var valid = m_p === _piJiangs()[0] || m_p === _piJiangs()[1] || m_p === _piJiangs()[2];
    return valid;
}

function dict_huifuMjValue(game, dict) {
    for (var key in dict) {
        var holds = dict[key];
        dict[key] = huifuMjValue(game, holds);
    }
}

function huifuMjValue(game, holds) {
    game.daPai = getMJ_SID(game.daPai);
    var hu = [];
    for (var i = 0; i < holds.length; i++) {
        var value = getMJ_SID(holds[i]);
        hu.push(value);
    }
    return hu;
}
//目的:把[9-17] [18-27] 转换成[100-108] [200-208]
function getMJ_BID(value) {
    if (value >= 9 && value <= 17) {
        //转换成 [100 108];
        value = value - 9 + 100;
    }
    if (value >= 18 && value <= 26) {
        //转换成 [200 208]
        value = value - 18 + 200;
    }
    if (value >= 27 && value <= 34) {
        value = 20 * (value - 27) + 300;
    }
    return value;
}

function getMJ_SID(value) {
    if (value >= 100 && value <= 108) {
        value = value - 100 + 9;
    }
    if (value >= 200 && value <= 208) {
        value = value - 200 + 18;
    }
    if (value >= 300 && value <= 500) {
        value = (value - 300) / 20 + 27;
    }
    return value;
}

function getMJ_Value(id) {
    var value = id = getMJ_SID(id);
    value = getMJType(id) < 3 ? value % 9 : value;
    return value;
}

function getMJType(value) {
    var id = getMJ_SID(value);
    if (id >= 0 && id < 9) {
        //筒
        return 0;
    } else if (id >= 9 && id < 18) {
        //条
        return 1;
    } else if (id >= 18 && id < 27) {
        //万
        return 2;
    } else {
        //风
        return 3;
    }
}

function holdsLog(seatData) {
    var h = ["1筒", "2筒", "3筒", "4筒", "5筒", "6筒", "7筒", "8筒", "9筒", "1条", "2条", "3条", "4条", "5条", "6条", "7条", "8条", "9条", "1万", "2万", "3万", "4万", "5万", "6万", "7万", "8万", "9万", "东风", "南风", "西风", "北风", "红中", "发财", "白板"];
    var hu = [];
    var th = seatData.holds.slice(0).sort(sortNumber);
    for (var i = 0; i < th.length; i++) {
        var value = th[i];
        var pai = h[value];
        hu.push(pai);
    }
    return hu;
}

function huifuMjValue(game, holds) {
    game.daPai = getMJ_SID(game.daPai);
    var hu = [];
    for (var i = 0; i < holds.length; i++) {
        var value = getMJ_SID(holds[i]);
        hu.push(value);
    }
    return hu;
}

function check_qing_onlyLaizi(game, seatData, ctx) {
    ctx = ctx || {};
    //3)两个癞子做将
    ctx.pointedJiangDict = {};
    ctx.onePointed = {};
    ctx.canHu = false;
    ctx.hasPointedJiang = false;
    game.daPai = getMJ_BID(game.daPai);
    ctx.daPai = game.daPai;
    var m = 0;
    var r = ctx.huHolds.slice(0);
    var n = r.length;
    var a = [];
    for (var i = 0; i < n; i++) {
        if (r[i] != game.daPai) {
            //如果不是百搭
            a[m++] = r[i];
        }
    }
    var old_a = a.sort(sortNumber);
    var daPaiCount = ctx.daPaiCount = n - m;
    for (var pai in seatData.countMap) {
        if ((pai >= 100 || (pai <= 8 && pai >= 0)) && (pai != getMJ_BID(game.daPai))) {
            if (seatData.countMap[pai] >= 1) {
                ctx.onePointed[pai] = 1;
            }
        }
    }
    if (daPaiCount >= 2) {
        a = old_a.slice(0);
        ctx.hupaiCurrent = [];
        ctx.hasPointedJiang = true;
        ctx.pointedPai = game.daPai;
        ctx.twoLai2Jiang = true;
        LiPai(a.sort(), 0, a.length, 0, daPaiCount - 2, seatData, game, ctx);
        ctx.twoLai2Jiang = false;
        if (ctx.canHu) {
            return;
        }
    }
    //2) 一张癞子配将
    for (var key in ctx.onePointed) {
        if (!isNaN(key)) {
            a = old_a.slice(0);
            ctx.hupaiCurrent = [];
            ctx.hasPointedJiang = true;
            ctx.pointedPai = key;
            removeByValue(a, key);
            ctx.oneLai2Jiang = true;
            LiPai(a.sort(), 0, a.length, 0, daPaiCount - 1, seatData, game, ctx);
            ctx.oneLaiToJiang = false;
            if (ctx.canHu) {
                return;
            }
        }
    }
}

function check_qingYiSe_single(game, seatData, ctx) {
    ctx = ctx || {};
    //任意牌可以做将
    //癞子可以被当做任意牌
    //目的: 给了一张牌。判断这张牌能不能胡
    //1)个数>=2,
    //2)个数==1, //拿一个癞子配合作为将
    //3)两个癞子做将
    ctx.pointedJiangDict = {};
    ctx.onePointed = {};
    ctx.canHu = false;
    ctx.hasPointedJiang = false;
    game.daPai = getMJ_BID(game.daPai);
    ctx.daPai = game.daPai;
    var m = 0;
    var r = ctx.huHolds.slice(0);
    var n = r.length;
    var a = [];
    for (var i = 0; i < n; i++) {
        if (r[i] != game.daPai) {
            //如果不是百搭
            a[m++] = r[i];
        }
    }
    var old_a = a.sort(sortNumber);
    var daPaiCount = ctx.daPaiCount = n - m;
    //取当前牌中所有>=2的牌做一次将头
    for (var pai in seatData.countMap) {
        if ((pai >= 100 || (pai <= 8 && pai >= 0)) && (pai != getMJ_BID(game.daPai))) {
            if (seatData.countMap[pai] >= 2) {
                ctx.pointedJiangDict[pai] = 1;
            } else if (seatData.countMap[pai] >= 1) {
                ctx.onePointed[pai] = 1;
            }
        }
    }
    //理牌完成后,在进行一次指定将牌
    //1) 不需癞子配将
    for (var key in ctx.pointedJiangDict) {
        if (!isNaN(key)) {
            a = old_a.slice(0);
            ctx.hupaiCurrent = [];
            ctx.hasPointedJiang = true;
            ctx.pointedPai = key;
            removeByValue(a, key);
            removeByValue(a, key);
            LiPai(a.sort(), 0, a.length, 0, daPaiCount, seatData, game, ctx);
            if (ctx.canHu) {
                return;
            }
        }
    }
    if (daPaiCount < 1) {
        return;
    }
    //2) 一张癞子配将
    for (var key in ctx.onePointed) {
        if (!isNaN(key)) {
            a = old_a.slice(0);
            ctx.hupaiCurrent = [];
            ctx.hasPointedJiang = true;
            ctx.pointedPai = key;
            removeByValue(a, key);
            ctx.oneLai2Jiang = true;
            LiPai(a.sort(), 0, a.length, 0, daPaiCount - 1, seatData, game, ctx);
            ctx.oneLaiToJiang = false;
            if (ctx.canHu) {
                return;
            }
        }
    }
    //3)4) 两张癞子做将
    if (daPaiCount >= 2) {
        a = old_a.slice(0);
        ctx.hupaiCurrent = [];
        ctx.hasPointedJiang = true;
        ctx.pointedPai = game.daPai;
        ctx.twoLai2Jiang = true;
        LiPai(a.sort(), 0, a.length, 0, daPaiCount - 2, seatData, game, ctx);
        ctx.twoLai2Jiang = false;
        if (ctx.canHu) {
            return;
        }
    }
}

function isSameType(type, arr) {
    if (typeof arr == 'undefined') {
        return false;
    }
    for (var i = 0; i < arr.length; ++i) {
        var t = getMJType(arr[i]);
        if (type != -1 && type != t) {
            return false;
        }
        type = t;
    }
    return true;
}

function isFengYiSe(sd, config) {
    config = config || {};
    config.type = 3;
    return isQingYiSe(sd, config);
}
// 清一色 --X分
function isQingYiSe(sd, config) {
    //清一色，也可以判断是否是风一色。风一色type值需要传3
    var type = getMJType(sd.holds[0]);
    var daPai = -1;
    if (config) {
        type = (config.type != null && config.type == 3) ? config.type : type;
        daPai = config.daPai;
    }
    var huHolds = [];
    sd.holds.forEach(function(val) {
        if (val != config.daPai) {
            huHolds.push(val);
        }
    });
    //检查手上的牌
    if (isSameType(type, huHolds) == false) {
        return false;
    }
    //检查杠下的牌
    if (isSameType(type, sd.angangs) == false) {
        return false;
    }
    if (isSameType(type, sd.wangangs) == false) {
        return false;
    }
    if (isSameType(type, sd.diangangs) == false) {
        return false;
    }
    //检查碰牌
    if (isSameType(type, sd.pengs) == false) {
        return false;
    }
    //检查吃
    if (isSameType(type, sd.chis) == false) {
        return false;
    }
    config.reType = type;
    return true;
}

function is_258_holds(arr, config) {
    if (arr == null) {
        return false;
    }
    var huHolds = [];
    arr.forEach(function(val) {
        if (val != config.daPai) {
            huHolds.push(val);
        }
    });
    //是否有牌不是2,5,8
    var r_flag = huHolds.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 4;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    //最后返回的结果取反。(some取反)
    return !r_flag;
}

function is_PP_hu(game, seatData, ctx) {
    var arr = ctx.huHolds;
    if (arr == null) {
        return false;
    }
    if (ctx.hasChi) {
        return false;
    }
    var huHolds = [];
    arr.forEach(function(val) {
        if (getMJ_SID(val) != ctx.daPai) {
            huHolds.push(val);
        }
    });
    var bCount = arr.length - huHolds.length;
    var countDict = eleCountInArr(huHolds);
    var okArr = [];
    var paisArr = [];
    //把刻字当成成型的牌。不是刻子当成杂牌
    for (var key in countDict) {
        var tp = parseInt(key);
        var value = countDict[key];
        if (value >= 3) {
            okArr.push(tp);
            okArr.push(tp);
            okArr.push(tp);
        } else if (value == 2) {
            paisArr.push(tp);
            paisArr.push(tp);
        }
    }
    var zaArr = _delSubArr(huHolds, okArr);
    var s_zaArr = _delSubArr(zaArr, paisArr);
    //第一种情况单牌的数目*2+paisArr.length/2 - 1 正好是百搭的个数
    //将头是对子中的一个
    //第二种情况将是 单+癞子
    //第三种是癞子做将
    var isPengPenghu_1 = false;
    var isPengPenghu_2 = false;
    var isPengPenghu_3 = false;
    if (paisArr.length >= 2) {
        var tmp = (s_zaArr.length * 2 + paisArr.length / 2 - 1);
        isPengPenghu_1 = tmp == bCount;
        if (tmp == 0 && bCount == 3) {
            isPengPenghu_1 = true;
        }
        if (isPengPenghu_1) {
            ctx.hupaiCurrent = [];
            ctx.pointedPai = paisArr[0];
            removeByValue(arr, paisArr[0]);
            removeByValue(arr, paisArr[0]);
            var isHard = false;
            if (s_zaArr.length == 0 && paisArr.length == 2) {
                isHard = true;
            }
            canHuCtxConfig(ctx, arr, {
                isHard: isHard,
                CountOfBaiDa: bCount
            });
            return true;
        }
    }
    if (bCount >= 1 && s_zaArr.length >= 1) {
        tmp = ((s_zaArr.length - 1) * 2 + paisArr.length / 2);
        isPengPenghu_2 = tmp == bCount - 1;
        if (tmp == 0 && bCount - 1 == 3) {
            isPengPenghu_2 = true;
        }
    }
    if (isPengPenghu_2) {
        ctx.hupaiCurrent = [];
        ctx.hasPointedJiang = true;
        ctx.pointedPai = s_zaArr[0];
        removeByValue(arr, s_zaArr[0]);
        ctx.oneLai2Jiang = true;
        canHuCtxConfig(ctx, arr, {
            isHard: false,
            CountOfBaiDa: bCount
        });
        ctx.oneLai2Jiang = false;
        return true;
    }
    if (bCount >= 2) {
        var tmp = (s_zaArr.length * 2 + paisArr.length / 2);
        isPengPenghu_3 = tmp == bCount - 2;
    }
    if (isPengPenghu_3) {
        ctx.hupaiCurrent = [];
        ctx.hasPointedJiang = true;
        ctx.pointedPai = ctx.daPai;
        ctx.twoLai2Jiang = true;
        canHuCtxConfig(ctx, arr, {
            isHard: true,
            CountOfBaiDa: bCount
        });
        ctx.twoLai2Jiang = false;
        return true;
    }
    return false;
}

function check_258_Single(game, seatData, ctx) {
    ctx = ctx || {};
    //专门用来计算2,5,8为将的听牌
    //屁胡,杠开,抢杠,海底捞月都必须以2,5,8为将,
    //癞子可以被当做任意牌
    //目的: 给了一张牌。判断这张牌能不能胡
    //1)个数>=2,
    //2)个数==1, //拿一个癞子配合作为将
    //3)个数==0  //拿两个癞子作为将。屁胡只能用一个癞子作为将
    //4)癞子就是2,5,8中的一种 //情况同1)个数必须是>=2
    //
    ctx.pointedJiangDict = {};
    ctx.onePointed = {};
    ctx.canHu = false;
    ctx.hasPointedJiang = false;
    game.daPai = getMJ_BID(game.daPai);
    ctx.daPai = game.daPai;
    var m = 0;
    var r = ctx.huHolds.slice(0);
    var n = r.length;
    var a = [];
    for (var i = 0; i < n; i++) {
        if (r[i] != game.daPai) {
            //如果不是百搭
            a[m++] = r[i];
        }
    }
    var old_a = a.sort(sortNumber);
    var daPaiCount = ctx.daPaiCount = n - m;
    //取当前牌中所有>=2的牌做一次将头
    for (var pai in seatData.countMap) {
        //牌的取值范围[0 8] or >=100
        if ((pai >= 100 || (pai <= 8 && pai >= 0)) && (pai != getMJ_BID(game.daPai))) {
            //当牌有3张以上时尝试将其作为一次将牌
            var m_p = getMJ_SID(pai);
            var is_258_valid = _is258Valid(m_p);
            if (is_258_valid) {
                if (seatData.countMap[pai] >= 2) {
                    ctx.pointedJiangDict[pai] = 1;
                } else if (seatData.countMap[pai] >= 1) {
                    ctx.onePointed[pai] = 1;
                }
            }
        }
    }
    //理牌完成后,在进行一次指定将牌
    //1) 不需癞子配将
    for (var key in ctx.pointedJiangDict) {
        if (!isNaN(key)) {
            a = old_a.slice(0);
            ctx.hupaiCurrent = [];
            ctx.hasPointedJiang = true;
            ctx.pointedPai = key;
            removeByValue(a, key);
            removeByValue(a, key);
            LiPai(a.sort(), 0, a.length, 0, daPaiCount, seatData, game, ctx);
            if (ctx.canHu) {
                return;
            }
        }
    }
    if (daPaiCount < 1) {
        return;
    }
    //3)4) 两张癞子做将
    //先配2张癞子做将，因为屁胡癞子使用的个数有限制
    if (daPaiCount >= 2) {
        a = old_a.slice(0);
        ctx.hupaiCurrent = [];
        ctx.hasPointedJiang = true;
        ctx.pointedPai = game.daPai;
        ctx.twoLai2Jiang = true;
        LiPai(a.sort(), 0, a.length, 0, daPaiCount - 2, seatData, game, ctx);
        ctx.twoLai2Jiang = false;
        if (ctx.canHu) {
            return;
        }
    }
    //2) 一张癞子配将
    for (var key in ctx.onePointed) {
        if (!isNaN(key)) {
            a = old_a.slice(0);
            ctx.hupaiCurrent = [];
            ctx.hasPointedJiang = true;
            ctx.pointedPai = key;
            removeByValue(a, key);
            ctx.oneLai2Jiang = true;
            LiPai(a.sort(), 0, a.length, 0, daPaiCount - 1, seatData, game, ctx);
            ctx.oneLaiToJiang = false;
            if (ctx.canHu) {
                return;
            }
        }
    }
}

function removeByValue(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}
//数组的某个区间是否包含obj
function arrContains(arr, startX, endX, obj) {
    for (var i = startX; i < endX; i++) {
        if (arr[i] === obj) {
            return i;
        }
    }
    return -1;
}

function elementAtArray(arr, obj) {
    return arrContains(arr, 0, arr.length, obj);
}
//数组中某个元素的个数
function valueInArrNum(arr, value) {
    var num = 0;
    var map = {};
    for (var i = 0; i < arr.length; i++) {
        var ai = arr[i];
        if (!map[ai]) {
            map[ai] = 1;
        } else {
            map[ai]++;
        }
    }
    if (map[value]) {
        num = map[value];
    }
    return num;
}
// 数组中间部分实现左移一位
// [1,2,3,4,5,] （2,3,4）=> [1,3,4,2,5] （3,4,2）
function _PartToLeft(arr, startX, endX) {
    var ta = arr.slice(startX, endX);
    var v1 = ta.shift();
    ta.push(v1);
    for (var i = 0; i < ta.length; i++) {
        arr[startX + i] = ta[i];
    }
}
// 数组中间部分实现右移一位
// [1,2,3,4,5,] （2,3,4）=> [1,4,2,3,5] （4,2,3）
function _PartToRight(arr, startX, endX) {
    var ta = arr.slice(startX, endX);
    var v1 = ta.pop();
    // 拼接函数(索引位置, 要删除元素的数量, 元素)
    ta.splice(0, 0, v1);
    for (var i = 0; i < ta.length; i++) {
        arr[startX + i] = ta[i];
    }
}

function canHuCtxConfig(ctx, ha, config) {
    var isHard = config ? (config.isHard == null ? true : config.isHard) : true;
    var laizi_s = config ? (config.CountOfBaiDa == null ? 0 : config.CountOfBaiDa) : 0;
    var laizi_usedNum = config ? (config.usedLaiNum ? config.usedLaiNum : 0) : 0;
    if (!isHard && laizi_usedNum == 0) {
        laizi_usedNum = -1;
    }
    ctx.hupaiCurrent = ha;
    ctx.canChiDic[ctx.currentPai] = ctx.hupaiCurrent;
    ctx.canHu = true;
    var ctx_last1 = ctx.pointedPai;
    var ctx_last2 = ctx.pointedPai;
    var tingData = ctx.tingData;
    var tkD = tingData[ctx.key] = {};
    var jiang_s = [];
    var L2JCount = 0;
    if (ctx.oneLai2Jiang) {
        ctx_last1 = ctx.pointedPai;
        ctx_last2 = ctx.daPai;
        L2JCount = 1;
        laizi_usedNum >= 0 ? laizi_usedNum++ : 1;
    }
    if (ctx.twoLai2Jiang) {
        ctx_last1 = ctx.daPai;
        ctx_last2 = ctx.daPai;
        L2JCount = 2;
    }
    isHard = laizi_usedNum == 0 ? true : false;
    jiang_s = [getMJ_SID(parseInt(ctx_last1)), getMJ_SID(parseInt(ctx_last2))];
    ha = ha.concat(jiang_s.slice(0));
    var hu = ha.map(function(ele) {
        return getMJ_SID(parseInt(ele));
    });
    tkD["hu"] = hu;
    tkD["jiang_s"] = jiang_s;
    tkD["L2JCount"] = L2JCount;
    tkD["isHard"] = isHard;
    tkD["laizi_s"] = laizi_s;
    tkD['laizi_arr'] = [];
    tkD['laizi_usedNum'] = laizi_usedNum;
    var j_p = ctx.pointedPai;
    var j_value = getMJ_SID(j_p);
    var j_type = getMJType(j_p);
    if (j_type === 3) {
        tkD["is_258"] = false;
        tkD["is_feng"] = true;
    } else if (_is258Valid(j_value)) {
        //屁胡的时候。抢杠,杠开,海捞 必然是258做将
        tkD["is_258"] = true;
        tkD["is_feng"] = false;
    } else {
        //既不是2,5,8 做将也不是风做将,只能是碰碰胡或者清一色
        tkD["is_258"] = false;
        tkD["is_feng"] = false;
    }
}

function LiPai(a, LeftCount, MidCount, RightCount, CountOfBaiDa, seatData, game, ctx) {
    if (_debug) {
        console.log("**********************************************************");
        console.log("userId:" + seatData.userId);
        console.log("a:" + JSON.stringify(a));
        console.log("MidCount:" + MidCount);
        console.log("LeftCount:" + LeftCount);
        console.log("CountOfBaiDa:" + CountOfBaiDa);
        console.log("huHolds:" + JSON.stringify(seatData.huHolds.slice(0).sort(sortNumber)));
        console.log("daPai:" + game.daPai);
        console.log("**********************************************************");
    }
    if (MidCount < 3) { // 试探区已不足 3 张，理牌过程结束，进入“理杂牌”阶段
        var zaPaiNum = MidCount + RightCount; // 不足 2 张的中段，实际上也是杂牌
        if (CountOfBaiDa == 0) // 如果没有百搭
        {
            if (ctx.hasPointedJiang) {
                if (zaPaiNum > 0) {
                    //如果已经点过将,且没有搭牌
                    //不能胡牌
                    ctx.hupaiCurrent = [];
                    ctx.canHu = false;
                    return;
                } else if (zaPaiNum == 0) {
                    //杂牌数目为0，可以胡牌
                    var ha = [];
                    for (var i = 0; i < LeftCount; i++) {
                        ha[i] = a[i];
                    }
                    canHuCtxConfig(ctx, ha, {
                        CountOfBaiDa: CountOfBaiDa
                    });
                    return;
                }
            }
            return;
        } else // 如果有百搭, 让一张百搭配2张杂牌
        {
            if (ctx.hasPointedJiang) {
                //如果已经点过将，
                //且杂牌的数目为0
                if (zaPaiNum == 0) {
                    var ha = [];
                    //杂牌数量为0,百搭的数量必定是三张否则不能成
                    if (CountOfBaiDa == 3) {
                        for (var i = 0; i < LeftCount; i++) {
                            ha[i] = a[i];
                        }
                        ha.push(game.daPai);
                        ha.push(game.daPai);
                        ha.push(game.daPai);
                        canHuCtxConfig(ctx, ha, {
                            CountOfBaiDa: CountOfBaiDa
                        });
                    }
                    ctx.hupaiCurrent = ha;
                    return;
                }
                //杂牌的数目为1
                if (zaPaiNum == 1) {
                    var ha = [];
                    //杂牌数量为1,百搭的数量必定是2张否则不能成
                    if (CountOfBaiDa == 2) {
                        for (var i = 0; i < LeftCount; i++) {
                            ha[i] = a[i];
                        }
                        ha.push(a[a.length - 1]);
                        ha.push(game.daPai);
                        ha.push(game.daPai);
                        canHuCtxConfig(ctx, ha, {
                            CountOfBaiDa: CountOfBaiDa,
                            usedLaiNum: 2
                        });
                    }
                    seatData.hupaiCurrent = ha;
                    return;
                }
                //杂牌的数目是2倍搭牌的数量
                if (zaPaiNum - 2 * CountOfBaiDa == 0) {
                    var b = [];
                    var endM = a.length;
                    var startM = LeftCount;
                    for (var i = startM, j = 0; i < endM; i++) {
                        b[j++] = a[i];
                    }
                    b.sort(sortNumber);
                    var th = [];
                    var bHuFlag = true;
                    for (var i = 0; i < b.length; i = i + 2) {
                        var v0 = b[i];
                        var v1 = b[i + 1];
                        if (v1 - v0 <= 1) {
                            th.push(v1);
                            th.push(v0);
                            th.push(ctx.daPai);
                        } else if (v1 - v0 == 2) {
                            th.push(v1);
                            th.push(ctx.daPai);
                            th.push(v0);
                        } else {
                            bHuFlag = false;
                            break;
                        }
                    }
                    if (bHuFlag) {
                        var ha = [];
                        for (var i = 0; i < LeftCount; i++) {
                            ha[i] = a[i];
                        }
                        for (var i = 0; i < th.length; i++) {
                            ha.push(th[i]);
                        }
                        var usedLaiSConfig = {
                            count: 0
                        };
                        var canChiFlag = judge3Type(game, seatData, b.slice(0), usedLaiSConfig);
                        canHuCtxConfig(ctx, ha, {
                            isHard: canChiFlag,
                            CountOfBaiDa: CountOfBaiDa,
                            usedLaiNum: usedLaiSConfig.count
                        });
                        return;
                    }
                    //若 count = CountOfBaiDa -zaPaiNum/2 
                    //如果count == 3也有可能吃别人的牌此时必定满足 zaPaiNum==2，CountOfBaiDa == 4
                    //且zaPaiNum[1]-zaPaiNum[0]<=2
                    if (zaPaiNum == 2 && CountOfBaiDa == 4) {
                        var b = [];
                        var endM = a.length;
                        var startM = LeftCount;
                        for (var i = startM, j = 0; i < endM; i++) {
                            b[j++] = a[i];
                        }
                        b.sort(sortNumber);
                        var ha = [];
                        for (var i = 0; i < a.length; i++) {
                            ha.push(a[i]);
                        }
                        for (var i = 0; i < CountOfBaiDa; i++) {
                            ha.push(game.daPai);
                        }
                        var usedLaiSConfig = {
                            count: 0
                        };
                        var canChiFlag = judge3Type(game, seatData, b.slice(0), usedLaiSConfig);
                        canHuCtxConfig(ctx, ha, {
                            isHard: canChiFlag,
                            CountOfBaiDa: CountOfBaiDa,
                            usedLaiNum: usedLaiSConfig.count
                        });
                        return;
                    }
                }
            }
            if (zaPaiNum - 2 * CountOfBaiDa <= 2) // 配完之后，剩下的牌数若不超过 2，则有希望胡牌,需要进一步探测
            {
                //申请数组 b[];
                //  把 a[LeftCount],a[LeftCount+1],...,a[m-1] 放入 b[0],b[1],...,b[MidCount+RightCount-1] 中；
                var b = [];
                var endM = a.length;
                var startM = LeftCount;
                for (var i = startM, j = 0; i < endM; i++) {
                    b[j++] = a[i];
                }
                if (_debug) {
                    console.log("进入理杂牌阶段--->", JSON.stringify(b));
                }
                // 把b[]排序；
                b.sort(sortNumber);
                LiZaPai(a, LeftCount, b, 0, MidCount + RightCount, 0, CountOfBaiDa, seatData, game, ctx); // 总杂牌区也被划分成 3 段：左段 中段 右段，见下文
                // 释放b[]; js中不用考虑。
            }
        }
        return;
    } else {
        //分组出筒条万
        var tong = [];
        var tongResult = [];
        var tiao = [];
        var tiaoResult = [];
        var wan = [];
        var wanResult = [];
        var others = [];
        var othersResult = [];
        for (var key in a) {
            var pai = a[key];
            var type = getMJType(pai);
            if (type == 0) {
                tong.push(pai);
            } else if (type == 1) {
                tiao.push(pai);
            } else if (type == 2) {
                wan.push(pai);
            } else {
                others.push(pai);
            }
        }
        var zaArr = [];
        for (var i = 0; i < 4; i++) {
            var arr = [];
            var result = [];
            switch (i) {
                case 0:
                    arr = tong;
                    result = tongResult;
                    break;
                case 1:
                    arr = tiao;
                    result = tiaoResult;
                    break;
                case 2:
                    arr = wan;
                    result = wanResult;
                    break;
                case 3:
                    arr = others;
                    result = othersResult;
                    break;
                default:
                    arr = [];
                    result = [];
                    break;
            }
            if (arr.length < 1) {
                continue;
            }
            var maxValue = arr.length;
            var count = 0;
            var zaPai = arr.slice(0);
            LiShunZi(zaPai, result, maxValue, count, false);
            //console.log("##zaPai:" + JSON.stringify(zaPai));
            //console.log("##result:" + JSON.stringify(result));
            //理顺之后若杂牌数组长度<=1,则认为是最优理顺 
            //百搭个数为0的时候也不进行最优匹配( 这个方案不成立，没有百搭是也需要匹配最优顺，但是若尝
            //                                   试将对子放入seatData.pointedJiangDict
            //                                   中，那么此处加上这个条件就会成立)
            //理顺之后若杂牌数组长度<=1,则认为是最优理顺 
            if (zaPai.length > 1) {
                var zaPai2 = arr.slice(0);
                var result2 = [];
                count = 0;
                LiShunZi(zaPai2, result2, maxValue, count, true);
                if (zaPai2.length > 1) {
                    var tempS = _betterZaPai(zaPai, zaPai2, result, result2);
                    zaPai = tempS[0];
                    result = tempS[1];
                    // //匹配两头顺，中间缺的理顺方式
                    if (arr.length > 6 && zaPai.length > 1) {
                        var zaPai3 = arr.slice(0);
                        var result3 = [];
                        var rArr = LiShunZiSide(zaPai3, result3);
                        zaPai3 = rArr[0];
                        result3 = rArr[1];
                        //当匹配后的结果满足 杂牌区数目>1 
                        if (zaPai3.length > 1) {
                            var tempS = _betterZaPai(zaPai, zaPai3, result, result3);
                            zaPai = tempS[0];
                            result = tempS[1];
                        } else {
                            zaPai = zaPai3;
                            result = result3;
                        }
                    }
                } else {
                    zaPai = zaPai2;
                    result = result2;
                }
                //console.log("**zaPai2:" + JSON.stringify(zaPai2));
                //console.log("**result2:" + JSON.stringify(result2));
            }
            if (_debug) {
                console.log("最优理顺zaPai:" + JSON.stringify(zaPai));
                console.log("最优理顺result:" + JSON.stringify(result));
            }
            zaArr = zaArr.concat(zaPai);
        }
        //经过上面理牌计算后,理好的牌都在各自的result数组中，杂牌都在
        //tong[],tiao[],wan[],others[]数组中,
        tongResult.sort(sortNumber);
        tiaoResult.sort(sortNumber);
        wanResult.sort(sortNumber);
        var okArr = tongResult.concat(tiaoResult, wanResult, othersResult);
        var p = okArr.concat(zaArr);
        LiPai(p, okArr.length, 0, zaArr.length, CountOfBaiDa, seatData, game, ctx)
    }
}
// “理杂牌”算法，与普通理牌算法类似，不过，它的目标是理出对子或搭子。它也把待理区划分成 3 段：
// 左段：成对/搭区
// 中段：待测区
// 右段：杂牌区
function LiZaPai(a, OKCount, b, LeftCount, MidCount, RightCount, CountOfBaiDa, seatData, game, ctx) // OKCount 是刻子/顺子的张数，在 a 的最左侧
{
    if (_debug) {
        console.log("############################################");
        console.log("a:" + JSON.stringify(a));
        console.log("b:" + JSON.stringify(b));
        console.log("OKCount:" + OKCount);
        console.log("LeftCount:" + LeftCount);
        console.log("MidCount:" + MidCount);
        console.log("RightCount:" + RightCount);
        console.log("CountOfBaiDa:" + CountOfBaiDa);
        console.log("############################################");
    }
    if (MidCount < 2) // 待测区不足 2 张，
    {
        var zaPaiNum = MidCount + RightCount; // 此时，试探区成了杂牌区
        if (zaPaiNum == 0) // 全是对子/搭子
        {
            //若指定了麻将头。
            if (ctx.hasPointedJiang) {
                //那么若 count = CountOfBaiDa - LeftCount / 2;  
                //则必须满足count == 0 || count == 3才能胡牌否则不能胡
                var count = CountOfBaiDa - LeftCount / 2;
                if (count == 0 || count == 3) {
                    var ha = [];
                    for (var i = 0; i < a.length; i++) {
                        ha.push(a[i]);
                    }
                    for (var i = 0; i < CountOfBaiDa; i++) {
                        ha.push(game.daPai);
                    }
                    var usedLaiNum = LeftCount / 2;
                    canHuCtxConfig(ctx, ha, {
                        isHard: false,
                        CountOfBaiDa: CountOfBaiDa,
                        usedLaiNum: usedLaiNum
                    });
                    return;
                } else {
                    //不能胡牌
                    ctx.canHu = false;
                    return;
                }
            }
        } else if (zaPaiNum == 1) {
            //若指定了麻将头。
            if (ctx.hasPointedJiang) {
                //必定有2张搭子和zaPai做刻字
                var count = CountOfBaiDa - 2 - LeftCount / 2;
                if (count == 0) {
                    var ha = [];
                    for (var i = 0; i < a.length; i++) {
                        ha.push(a[i]);
                    }
                    for (var i = 0; i < CountOfBaiDa; i++) {
                        ha.push(game.daPai);
                    }
                    canHuCtxConfig(ctx, ha, {
                        isHard: false,
                        CountOfBaiDa: CountOfBaiDa,
                        usedLaiNum: CountOfBaiDa
                    });
                    return;
                }
            }
        } else {
            ctx.canHu = false;
            return;
        }
    } else {
        // int * p=&b[LeftCount];   // 让 p 指向试探区；
        var p = b;
        var x = p[LeftCount + 0]; // 取出首张
        if (x == p[LeftCount + 1]) // 找到一个对子
        {
            LiZaPai(a, OKCount, b, LeftCount + 2, MidCount - 2, RightCount, CountOfBaiDa, seatData, game, ctx); // 递归地求解
            return;
        }
        // 在 p[1],p[2],...p[MidCount-1] 中寻找 x+1;
        var t1 = arrContains(p, LeftCount + 0, LeftCount + MidCount, x + 1);
        var t2 = arrContains(p, LeftCount + 0, LeftCount + MidCount, x + 2);
        if (t1 != -1) {
            // 把 x,x+1 放入 p[0],p[1];
            // 把剩下的牌放入 p[2],p[3],...,p[MidCount-1];
            var sa = [];
            sa.push(x);
            sa.push(x + 1);
            for (var i = LeftCount + 1, k = 2; i < LeftCount + MidCount; i++) {
                if (i != t1) {
                    sa[k++] = p[i];
                }
            }
            for (var i = 0; i < sa.length; i++) {
                p[i + LeftCount] = sa[i];
            }
            LiZaPai(a, OKCount, b, LeftCount + 2, MidCount - 2, RightCount, CountOfBaiDa, seatData, game, ctx); // 递归地求解
            // 把 p[0],p[1],...,p[MidCount-1] 排序；
            var ya = p.slice(LeftCount, MidCount);
            ya.sort(sortNumber);
            for (var i = 0; i < ya.length; i++) {
                p[i + LeftCount] = ya[i];
            }
            return;
        }
        // 在 p[1],p[2],...p[MidCount-1] 中寻找 x+2;
        if (t2 != -1) {
            // 把 x,x+2 放入 p[0],p[1];
            // 把剩下的牌放入 p[2],p[3],...,p[MidCount-1];
            var sa = [];
            sa.push(x);
            sa.push(x + 2);
            for (var i = LeftCount + 1, k = 2; i < LeftCount + MidCount; i++) {
                if (i != t2) {
                    sa[k++] = p[i];
                }
            }
            for (var i = 0; i < sa.length; i++) {
                p[i + LeftCount] = sa[i];
            }
            LiZaPai(a, OKCount, b, LeftCount + 2, MidCount - 2, RightCount, CountOfBaiDa, seatData, game, ctx); // 递归地求解
            // 把 p[0],p[1],...,p[MidCount-1] 排序；
            var ya = p.slice(LeftCount, MidCount);
            ya.sort(sortNumber);
            for (var i = 0; i < ya.length; i++) {
                p[i + LeftCount] = ya[i];
            }
            return;
        }
        // 让 p[0],p[1]....,p[MidCount-1] 循环左移；   // x 称到杂牌区；
        _PartToLeft(p, LeftCount, p.length);
        LiZaPai(a, OKCount, b, LeftCount, MidCount - 1, RightCount + 1, CountOfBaiDa, seatData, game, ctx); // 递归地求解
        return;
    }
}
//把同类型的牌丢进来（不考虑其中的牌为将头） 匹配顺子、刻子
//arr：传入数据数组,计算完成后成为返回的杂牌数组
//result: 计算完成后顺子or刻子的数组
//maxValue: 元数据数组的长度和count 配合使用形成递归的终止条件
//lFlag:找到长顺后是否匹配id号较大的顺子；true是匹配，false是匹配id号较小的顺子
function LiShunZi(arr, result, maxValue, count, lFlag) {
    // 试探区至少 3 张，可以试着从中取出刻子和顺子
    if (!result) {
        result = [];
    }
    if (_debug) {
        console.log("arr:" + JSON.stringify(arr));
        console.log("result:" + JSON.stringify(result));
    }
    if (arr.length <= 2) {
        return;
    }
    if (count >= maxValue) {
        return;
    }
    var p = arr;
    var x = p[0];
    if (p[1] == x && p[2] == x) { // 发现一个刻子
        result.push(x);
        result.push(x);
        result.push(x);
        removeByValue(p, x);
        removeByValue(p, x);
        removeByValue(p, x);
        LiShunZi(p, result, maxValue, count, lFlag);
        return;
    }
    var t1 = arrContains(p, 0, p.length, x + 1);
    var t2 = arrContains(p, 0, p.length, x + 2);
    var t3 = arrContains(p, 0, p.length, x + 3);
    var foundFlag = (t1 != -1) && (t2 != -1);
    if (foundFlag) {
        var t3Flag = (t3 > -1) && lFlag;
        if (!t3Flag) {
            result.push(x);
            result.push(x + 1);
            result.push(x + 2);
            removeByValue(p, x);
            removeByValue(p, x + 1);
            removeByValue(p, x + 2);
            LiShunZi(p, result, maxValue, count, lFlag);
            return;
        }
    }
    _PartToLeft(p, 0, p.length);
    count++;
    LiShunZi(p, result, maxValue, count, lFlag);
    return;
}
//作用：以中间的某个点为中间点将数组分割成两个部分
//左边的部分从最小id号开始匹配
//右边的部分从最大id号开始匹配
//返回的结果放在arr和result中,arr表示杂牌区，result表示成牌区
//注意:arr的长度必须>=7调用这个方法才有意义,更具体的是同色牌中必须至少有7中不同的id号才有意义
function LiShunZiSide(arr, result) {
    if (!result) {
        result = [];
    }
    var a = arr.slice(0);
    //从小到大排列
    a.sort(sortNumber);
    var k = 0;
    var v0 = a[0];
    var fenGeValue = -1;
    for (var i = 0; i < 9; i++) {
        var vi = v0 + i;
        var index = arrContains(a, 0, a.length, vi);
        if (index < 0) {
            fenGeValue = vi - 1;
            break;
        }
    }
    if (fenGeValue == -1 || fenGeValue == a[0] || fenGeValue == a[a.length - 1]) {
        //找不到分割点，
        //或者分割点是第一个或最后一个元素
        //直接return
        return [arr, result];
    }
    //找到了分割点
    //注意:分割点在左边数组中，其值可能有多个
    var fenCount = valueInArrNum(a, fenGeValue);
    var fenIndex = arrContains(a, 0, a.length, fenGeValue);
    var leftArr = a.slice(0, fenIndex + fenCount);
    var rightArr = a.slice(fenIndex + fenCount, a.length);
    //此时已经将数组分割成两个部分
    //调用LiShunZi分别对两个数组排序
    var zaPaiLeft = leftArr.slice(0);
    var resultLeft = [];
    var countLeft = 0;
    var maxValueLeft = leftArr.length;
    LiShunZi(zaPaiLeft, resultLeft, maxValueLeft, countLeft, false);
    var zaPaiRight = rightArr.slice(0);
    var resultRight = [];
    var countRight = 0;
    var maxValueRight = rightArr.length;
    LiShunZi(zaPaiRight, resultRight, maxValueRight, countRight, true);
    if (_debug) {
        console.log("ly:partLeft:zaPai " + JSON.stringify(zaPaiLeft));
        console.log("ly:partLeft:result " + JSON.stringify(resultLeft));
        console.log("ly:partRight:zaPai " + JSON.stringify(zaPaiRight));
        console.log("ly:partRight:result " + JSON.stringify(resultRight));
    }
    var zaPaiTotal = zaPaiLeft.concat(zaPaiRight);
    var resultAll = resultLeft.concat(resultRight);
    arr = zaPaiTotal;
    result = resultAll;
    return [arr, result];
}

function eleCountInArr(arr) {
    var dict = {};
    arr.forEach(function(ele) {
        if (dict[ele] == null) {
            dict[ele] = 0;
        }
        dict[ele]++;
    });
    return dict;
}

function differentElements_InArr(arr) {
    var dict = eleCountInArr(arr);
    return Object.keys(dict).length;
}

function _betterZaPai(z1, z2, result, result2) {
    var l = z1.length - z2.length;
    var dl = differentElements_InArr(z1) - differentElements_InArr(z2);
    //优先判断数组长度
    //数组短的为最优理顺  
    if (l > 0) {
        z1 = z2;
        result = result2;
    } else if (l == 0) {
        //实验
        //1)先比较两组中,不同元素的长度。对子多的优先级高。
        if (dl > 0) {
            //说明z2的对子较多
            z1 = z2;
            result = result2;
        } else if (dl == 0) {
            //说明对子一样多,取方差小的值
            //若两个数组长度相同则计算两个数组的方差值
            //方差值小的为最优理顺
            var f1 = variance(z1);
            var f2 = variance(z2);
            // console.log("f1:" + f1);
            // console.log("f2:" + f2);
            if (f1 > f2) {
                z1 = z2;
                result = result2;
            }
        }
    }
    return [z1, result];
}
//判断杂牌数组中形成的刻和顺子是否和搭牌同类型且ABC 
//b是除去将头的杂牌数组
function judge3Type(game, seatData, b, config) {
    config = config || {};
    config.count = 0;
    b.sort(sortNumber);
    //b 必定是2的整数倍 
    //注:此时的b 加上搭之后必定是可胡的。否则不需判断
    if (b.length < 1) {
        return true;
    }
    var canChiArr = [];
    var daPai = game.daPai;
    for (var i = 0; i < b.length; i = i + 2) {
        var v0 = b[i];
        var v1 = b[i + 1];
        var canChi = -1;
        if (v1 - v0 == 1) {
            //差值<=1说明是同种类型。
            if (v0 >= daPai && (v0 - daPai) <= 1) {
                canChi = 1;
            }
            if (daPai >= v1 && (daPai - v1) <= 1) {
                canChi = 1;
            }
            canChiArr.push(canChi);
        } else if (v1 - v0 == 2) {
            //此处说明v1 v0 是同种类型
            //因此只需满足 v1 - daPai === 1 即可
            if (v1 - daPai === 1) {
                canChi = 1;
            }
            canChiArr.push(canChi);
        } else if (v1 - v0 == 0) {
            if (v1 == daPai) {
                canChi = 1;
            }
            canChiArr.push(canChi);
        } else {
            canChi = -1;
            canChiArr.push(canChi);
            // break;
        }
    }
    canChiArr.forEach(function(vle) {
        if (vle == -1) {
            config.count++;
        }
    });
    if (!(canChiArr.indexOf(-1) > -1)) {
        return true;
    }
    // if (!(arrContains(canChiArr, 0, canChiArr.length, -1) > -1)) {
    //     return true;
    // }
    return false;
}
//删除子数组
//返回一个新的数组
function _delSubArr(totalArr, subArr) {
    var t = totalArr.slice(0);
    for (var i = 0; i < subArr.length; i++) {
        var value = subArr[i];
        var index = t.indexOf(value);
        if (index > -1) {
            //如果value值存在，删除对应的value
            t.splice(index, 1);
        }
    }
    return t;
}