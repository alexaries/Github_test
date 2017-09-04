// 获取麻将类别
function getMJType(id) {
    if (id >= 0 && id < 9) { //筒
        return 0;
    } else if (id >= 9 && id < 18) { //条
        return 1;
    } else if (id >= 18 && id < 27) { //万
        return 2;
    } else if (id >= 27 && id < 34) { //字一（东西南北中发白）
        return 3;
    }
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

function getMJValue(id) {
    var value = id;
    if (id < 27) {
        value = id % 9;
    }
    return value;
}
exports.getMJValue = getMJValue;
var kanzi = [];
var record = false;

function debugRecord(pai) {
    if (record) {
        kanzi.push(pai);
    }
}
// 移除手牌中的某些特定的牌
function removeFromArray(orginalArray, targetArray) {
    var array = orginalArray;
    // //console.log("remove from array", orginalArray, targetArray);
    for (var i = 0; i < targetArray.length; i++) {
        var idx = array.indexOf(targetArray[i]);
        if (idx > -1) {
            array.splice(idx, 1);
        }
    }
    // console.info("removeFromArray:执行完毕", array);
    return array.sort();
}
// 恢复一移除掉的手牌
function revertToOrigin(arr, val) {
    // //console.log('revertToOrigin');
    // //console.log("源数组是", arr);
    // //console.log("目标数组是", val);
    var temp = arr;
    for (var i = 0; i < val.length; i++) {
        if (val[i] !== null && val[i] !== undefined) {
            temp.push(val[i]);
        }
    }
    // //console.log("revertToOrigin:回复到原来的数组", temp);
    return temp.sort();
}
// 根据手牌,统计手牌数量
function setHoldsCountMap(holds) {
    // //console.log("setHoldsCountMap", holds);
    var countMap = {};
    for (k in holds) {
        if (countMap[holds[k]] == null) {
            countMap[holds[k]] = 0;
        }
        countMap[holds[k]] = countMap[holds[k]] + 1;
    }
    // //console.log('统计手牌数量', countMap);
    return countMap;
}

function arrRemoveByValue(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}

function _bigHuType(game, sd) {
    if (!sd.hued) {
        return;
    }
    var huedDict = sd.currentHuedDict;
    var laizi = game.laizi;
    var config = {};
    config.daPai = laizi;
    var isQingYiSe = _isQingYiSe(sd, config);
    config.type = 3;
    var isFengYiSe = _isQingYiSe(sd, config);
    var isJiangYiSe = is_258_holds(sd, laizi);
    var ctx = {
        huHolds: sd.currentHuedDict.hu,
        daPai: laizi,
        hasChi: sd.chis.length > 0,
        jiang_s: huedDict.jiang_s
    };
    var isPengpengHu = is_PP_hu(ctx);
    huedDict.isPengpengHu = isPengpengHu;
    huedDict.isQingYiSe = isQingYiSe;
    huedDict.isFengYiSe = isFengYiSe;
    huedDict.isJiangYiSe = isJiangYiSe;
    huedDict.isQingYiSe = huedDict.isQingYiSe || isFengYiSe;
    console.log("ly:_bigHuType:", isQingYiSe, isFengYiSe, isJiangYiSe, isPengpengHu);
}
//是否是碰碰胡
function is_PP_hu(ctx) {
    var arr = ctx.huHolds;
    if (arr == null) {
        return false;
    }
    if (ctx.hasChi) {
        return false;
    }
    console.log("ly:is_PP_hu:111:", arr, ctx.jiang_s);
    arr = _delSubArr(ctx.huHolds, ctx.jiang_s);
    console.log("ly:is_PP_hu:222:", arr);
    var huHolds = [];
    arr.forEach(function(val) {
        if (getMJ_SID(val) != ctx.daPai) {
            huHolds.push(val);
        }
    });
    var laiziCount = arr.length - huHolds.length;
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
    console.log("ly:zaArr:", zaArr);
    console.log("ly:s_zaArr:", s_zaArr);
    console.log("ly:laiziCount:", laiziCount);
    var needLaziCount = s_zaArr.length * 2 + paisArr.length / 2;
    if (needLaziCount == laiziCount) {
        return true;
    }
    return false;
}
//获得玩家包括吃碰在内的所有手牌
function getAllHolds(sd) {
    var holds = sd.holds;
    var pengs = sd.pengs;
    var chis = sd.chis;
    var angangs = sd.angangs;
    var wangangs = sd.wangangs;
    var diangangs = sd.diangangs;
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
    holds = fn(allHolds, sd.holds, 1);
    holds = fn(allHolds, sd.pengs, 3);
    holds = fn(allHolds, sd.angangs, 4);
    holds = fn(allHolds, sd.wangangs, 4);
    holds = fn(allHolds, sd.diangangs, 4);
    for (var k of chis) {
        holds = fn(allHolds, k, 1);
    }
    return allHolds;
}

function _isQingYiSe(sd, config) {
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
    if (isSameType(type, sd.chiedPais) == false) {
        return false;
    }
    config.reType = type;
    return true;
}

function _checkIsTingd(sd) {
    //需求:4大胡除外。 屁胡听牌要求:必须以258将,癞子使用的数目<2
    var sdDict = sd.allTings;
    for (var key in sdDict) {
        var tmp = sdDict[key];
        var isPengpengHu = !!tmp.isPengpengHu;
        var isQingYiSe = !!tmp.isQingYiSe;
        var isFengYiSe = !!tmp.isFengYiSe;
        var isJiangYiSe = !!tmp.isJiangYiSe;
        var isQuanQiuRen = false;
        if (sd.holds.length == 1) {
            isQuanQiuRen = true;
        }
        if (tmp.isBigHu == null) {
            tmp.isBigHu = isPengpengHu || isQingYiSe || isFengYiSe || isJiangYiSe || isQuanQiuRen;
        }
        if (tmp.isBigHu) {
            return true;
        }
        if (tmp.is_258 && tmp.laizi_usedNum < 2) {
            return true;
        }
    }
    return false;
}

function is_258_holds(sd, laizi) {
    var arr = sd.holds;
    if (arr == null) {
        return false;
    }
    if (sd.chis.length > 0) {
        return false;
    }
    var huHolds = [];
    arr.forEach(function(val) {
        if (val != laizi) {
            huHolds.push(val);
        }
    });
    //是否有牌不是2,5,8
    var r_flag = huHolds.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 3;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    var r_flag_anGang = sd.angangs.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 3;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    var r_flag_diangang = sd.diangangs.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 3;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    var r_flag_wangangs = sd.wangangs.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 3;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    var r_flag_pengs = sd.pengs.some(function(id) {
        var value = id % 9 + 1;
        var validFlag = (value === 2 || value === 5 || value === 8) && getMJType(id) < 3;
        if (!validFlag) {
            return true;
        }
        return false;
    });
    //最后返回的结果取反。(some取反)
    var isValid = !r_flag && !r_flag_anGang && !r_flag_diangang && !r_flag_wangangs && !r_flag_pengs;
    return isValid;
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
exports.arrRemoveByValue = arrRemoveByValue;
// 判断是否可以吃
exports.getMJType = getMJType;
exports.removeFromArray = removeFromArray;
exports.setHoldsCountMap = setHoldsCountMap;
exports.checkIsTingd = _checkIsTingd;
exports.is_258_holds = is_258_holds;
exports.bigHuType = _bigHuType;