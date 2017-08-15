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
    } else if (id >= 34 && id < 42) { //（春夏秋冬梅兰竹菊）
        return 4;
    } else {
        return 5; //5表示出错了
    }
}
// 判断有没有花牌，有花牌不能再判断
function checkCaiShen(seatData) {
    for (var k in seatData.holds) {
        if (getMJType(seatData.holds[k]) > 3) {
            return true;
        }
    }
    return false;
}
// 根据目标牌获取和目标牌同类的牌
function getHoldsByType(seatData, targetPai) {
    // //console.log('getHoldsByType:', targetPai);
    if (targetPai == null || seatData == null) {
        return [];
    }
    var paiType = getMJType(targetPai);
    //console.log("paiType--2", paiType, seatData.holds);
    var typeHolds = [];
    for (var i = 0; i < seatData.holds.length; ++i) {
        var pai = seatData.holds[i];
        if (getMJType(pai) === paiType) {
            typeHolds.push(pai);
        }
    }
    // //console.log("typeHolds!!!3", typeHolds);
    return typeHolds;
}
// 是否听七小队
function checkTingSevenParis(seatData) {
    // //console.log("检测是否听七小对");
    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if (seatData.holds.length == 13) {
        var danPai = -1;
        var pairCount = 0;
        for (var k in seatData.countMap) {
            var c = seatData.countMap[k];
            if (c == 2 || c == 3) {
                pairCount++;
            } else if (c == 4) {
                pairCount += 2;
            }
            if (c == 1 || c == 3) {
                //如果已经有单牌了，表示不止一张单牌，并没有下叫。直接闪
                if (danPai >= 0) {
                    return false;
                }
                danPai = k;
            }
        }
        //检查是否有6对 并且单牌是不是目标牌
        if (pairCount == 6) {
            //七对只能和一张，就是手上那张单牌
            seatData.tingMap[danPai] = {
                fan: 15,
                pattern: "7pairs"
            };
            //如果是，则直接返回咯
        }
    }
}
// 听十三幺
function checkTingThirty(seatData) {
    // //console.log("是否听十三幺!");
    if (seatData.holds.length == 13) {
        var standArr = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        var flag = false;
        for (var k in standArr) {
            flag = checkHuThirty(seatData, standArr[k]);
            if (flag) {
                // 如果能胡任何一张直接跳出
                seatData.tingMap[standArr[k]] = {
                    fan: 200,
                    pattern: "therity"
                };
            }
        }
    }
}
// 胡七小对
function checkHuSevenParis(seatData, targetPai) {
    // //console.log("检测是否听七小对", targetPai);
    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    var flag = false;
    if (seatData.holds.length == 13) {
        // //console.log("有13张牌");
        var old = seatData.countMap[targetPai];
        //console.log(old);
        if (old != 1 && old != 3) {
            return flag;
        }
        seatData.countMap[targetPai]++;
        // //console.log('seatData.countMap[targetPai]++;', seatData.countMap[targetPai]);
        var pairCount = 0;
        for (var k in seatData.countMap) {
            var c = seatData.countMap[k];
            if (c == 2 || c == 3) {
                pairCount++;
            } else if (c == 4) {
                pairCount += 2;
            }
        }
        //检查是否有7对
        if (pairCount == 7) {
            flag = true;
        }
        seatData.countMap[targetPai]--;
        return flag;
    }
    return flag;
}
// 胡豪七对
function checkHuBigSevenParis(seatData, targetPai) {
    //检查是否是七对 前提是没有碰，也没有杠 ，即手上拥有13张牌
    if (seatData.holds.length == 13) {
        // //console.log("有13张牌");
        var pairCount = 0;
        for (var k in seatData.countMap) {
            var c = seatData.countMap[k];
            if (c == 2 || c == 3) {
                pairCount++;
            } else if (c == 4) {
                pairCount += 2;
            }
        }
        //检查是否有6对 并且单牌是不是目标牌
        if (pairCount == 6) {
            if (seatData.countMap[targetPai] == 3) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }
}
// 胡十三幺
function checkHuThirty(seatData, targetPai) {
    // //console.log("目标牌是!" + targetPai);
    if (seatData.holds.length == 13) {
        var old = seatData.countMap[targetPai];
        if (old == null) {
            old = 0;
            seatData.countMap[targetPai] = 1;
        } else {
            seatData.countMap[targetPai]++;
        }
        seatData.holds.push(targetPai);
        // //console.log('手牌是多少:' + seatData.holds);
        // 筒 1-9 条1-9 万1-9 东西南北中发白白
        var standArr = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
        // 如果白板不是2张直接false
        if (seatData.countMap[33] != 2) {
            // 一定要还原啊
            seatData.countMap[targetPai] = seatData.countMap[targetPai] - 1;
            seatData.holds.pop(targetPai);
            return false;
        }
        var flag = false;
        for (var i = 0, length1 = standArr.length; i < length1; i++) {
            if (seatData.holds.indexOf(standArr[i]) == -1) {
                flag = false;
                //console.log('standArr[i]:' + standArr[i]);
                break;
            } else {
                //console.log('standArr[i]:' + standArr[i]);
                flag = true;
            }
        }
        seatData.countMap[targetPai] = seatData.countMap[targetPai] - 1;
        seatData.holds.pop(targetPai);
        return flag;
    }
    return false;
}
// 获取吃的组合
function getChiArray(seatData, targetPai) {
    // //console.log('getChiArray--1', targetPai);
    var chiHolds = getHoldsByType(seatData, targetPai);
    //console.log('chiHolds--2', chiHolds, targetPai);
    if (chiHolds.length < 2 || targetPai == null) {
        return [];
    }
    var tempArray = [];
    var outputArray = [];
    for (var i = 0; i < 3; i++) {
        tempArray[i] = [targetPai + i - 2, targetPai + i - 1, targetPai + i];
        tempArray[i].splice(tempArray[i].indexOf(targetPai), 1);
        var check = 0;
        for (var k = 0; k < tempArray[i].length; k++) {
            if (chiHolds.indexOf(tempArray[i][k]) > -1) {
                check += 1;
            }
        }
        if (check == 2) {
            outputArray.push(tempArray[i]);
        }
    }
    //console.log("getChiArray--吃牌的组合", outputArray);
    return outputArray;
}
var kanzi = [];
var record = false;

function debugRecord(pai) {
    if (record) {
        kanzi.push(pai);
    }
}

function matchSingle(seatData, selected) {
    //分开匹配 A-2,A-1,A
    var matched = true;
    var v = selected % 9;
    if (v < 2) {
        matched = false;
    } else {
        for (var i = 0; i < 3; ++i) {
            var t = selected - 2 + i;
            var cc = seatData.countMap[t];
            if (cc == null) {
                matched = false;
                break;
            }
            if (cc == 0) {
                matched = false;
                break;
            }
        }
    }
    //匹配成功，扣除相应数值
    if (matched) {
        seatData.countMap[selected - 2]--;
        seatData.countMap[selected - 1]--;
        seatData.countMap[selected]--;
        var ret = checkSingle(seatData);
        seatData.countMap[selected - 2]++;
        seatData.countMap[selected - 1]++;
        seatData.countMap[selected]++;
        if (ret == true) {
            debugRecord(selected - 2);
            debugRecord(selected - 1);
            debugRecord(selected);
            return true;
        }
    }
    //分开匹配 A-1,A,A + 1
    matched = true;
    if (v < 1 || v > 7) {
        matched = false;
    } else {
        for (var i = 0; i < 3; ++i) {
            var t = selected - 1 + i;
            var cc = seatData.countMap[t];
            if (cc == null) {
                matched = false;
                break;
            }
            if (cc == 0) {
                matched = false;
                break;
            }
        }
    }
    //匹配成功，扣除相应数值
    if (matched) {
        seatData.countMap[selected - 1]--;
        seatData.countMap[selected]--;
        seatData.countMap[selected + 1]--;
        var ret = checkSingle(seatData);
        seatData.countMap[selected - 1]++;
        seatData.countMap[selected]++;
        seatData.countMap[selected + 1]++;
        if (ret == true) {
            debugRecord(selected - 1);
            debugRecord(selected);
            debugRecord(selected + 1);
            return true;
        }
    }
    //分开匹配 A,A+1,A + 2
    matched = true;
    if (v > 6) {
        matched = false;
    } else {
        for (var i = 0; i < 3; ++i) {
            var t = selected + i;
            var cc = seatData.countMap[t];
            if (cc == null) {
                matched = false;
                break;
            }
            if (cc == 0) {
                matched = false;
                break;
            }
        }
    }
    //匹配成功，扣除相应数值
    if (matched) {
        seatData.countMap[selected]--;
        seatData.countMap[selected + 1]--;
        seatData.countMap[selected + 2]--;
        var ret = checkSingle(seatData);
        seatData.countMap[selected]++;
        seatData.countMap[selected + 1]++;
        seatData.countMap[selected + 2]++;
        if (ret == true) {
            debugRecord(selected);
            debugRecord(selected + 1);
            debugRecord(selected + 2);
            return true;
        }
    }
    return false;
}
//检查单张
function checkSingle(seatData) {
    var holds = seatData.holds;
    var selected = -1;
    var c = 0;
    for (var i = 0; i < holds.length; ++i) {
        var pai = holds[i];
        c = seatData.countMap[pai];
        if (c != 0) {
            selected = pai;
            break;
        }
    }
    //如果没有找到剩余牌，则表示匹配成功了
    if (selected == -1) {
        return true;
    }
    //如果是风牌，那么风牌必定是三张，否则不能胡
    if (getMJType(selected) == 3 && c != 3) {
        return false;
    }
    //否则，进行匹配
    if (c == 3) {
        //直接作为一坎
        seatData.countMap[selected] = 0;
        debugRecord(selected);
        debugRecord(selected);
        debugRecord(selected);
        var ret = checkSingle(seatData);
        //立即恢复对数据的修改
        seatData.countMap[selected] = c;
        if (ret == true) {
            return true;
        }
    } else if (c == 4) {
        //直接作为一坎
        seatData.countMap[selected] = 1;
        debugRecord(selected);
        debugRecord(selected);
        debugRecord(selected);
        var ret = checkSingle(seatData);
        //立即恢复对数据的修改
        seatData.countMap[selected] = c;
        //如果作为一坎能够把牌匹配完，直接返回TRUE。
        if (ret == true) {
            return true;
        }
    }
    //按单牌处理
    return matchSingle(seatData, selected);
}
// 检查是否可以和牌
function checkCanHu(seatData) {
    var flag = false;
    for (var k in seatData.countMap) {
        k = parseInt(k);
        var c = seatData.countMap[k];
        if (c < 2) {
            continue;
        }
        var fengParis = 0;
        if (k >= 27) {
            if (c == 1 || c == 4) {
                // //console.log("风牌出现单或者四个时不能胡牌");
                return false;
            }
            if (c == 2) {
                fengParis++;
            }
            // //console.log("风牌有多对!", fengParis);
        }
        //如果当前牌大于等于２，则将它选为将牌
        seatData.countMap[k] -= 2;
        //逐个判定剩下的牌是否满足　３Ｎ规则,一个牌会有以下几种情况
        //1、0张，则不做任何处理
        //2、2张，则只可能是与其它牌形成匹配关系
        //3、3张，则可能是单张形成 A-2,A-1,A  A-1,A,A+1  A,A+1,A+2，也可能是直接成为一坎
        //4、4张，则只可能是一坎+单张
        kanzi = [];
        var ret = checkSingle(seatData, 1);
        seatData.countMap[k] += 2;
        if (ret) {
            kanzi.push(k);
            kanzi.push(k);
            //console.log("checkCanHu--听的牌是", kanzi);
            flag = true;
        }
    }
    return flag;
}

function checkTingPai(seatData, begin, end) {
    // console.log("ly:检查是否能听牌", seatData.holds);
    for (var i = begin; i < end; ++i) {
        //如果这牌已经在和了，就不用检查了
        if (seatData.tingMap[i] != null) {
            continue;
        }
        //将牌加入到计数中
        var old = seatData.countMap[i];
        if (old == null) {
            old = 0;
            seatData.countMap[i] = 1;
        } else {
            seatData.countMap[i]++;
        }
        seatData.holds.push(i);
        //逐个判定手上的牌
        var ret = checkCanHu(seatData);
        if (ret) {
            seatData.tingMap[i] = {
                pattern: "normal",
                fan: 1
            };
            // console.log("ly: " + seatData.seatIndex + " 能胡了", seatData.tingMap);
        }
        //搞完以后，撤消刚刚加的牌
        seatData.countMap[i] = old;
        seatData.holds.pop();
    }
}
// 仅仅用来检查是否在吃碰,之后能够听牌,不对玩家的数据做处理,返回true或者false
function judgeTingPai(seatData, begin, end, chiPengFlag) {
    // //console.log("judgeTingPai--1");
    // 循环检查添加一张牌,是否能胡牌
    var flag = false;
    for (var i = begin; i < end; ++i) {
        if (!chiPengFlag) {
            // //console.log("judgeTingpai---------------", i);
            //如果这牌已经在和了，就不用检查了
            if (seatData.tingMap[i] != null) {
                // console.log("ly:可以胡牌(1)pai => ", i);
                // console.log("ly:可以胡牌(1)holds => ", seatData.holds);
                // console.log("ly:可以胡牌(1)tingMap => ", seatData.tingMap);
                return true;
            }
        }
        //将牌加入到计数中
        var old = seatData.countMap[i];
        if (old == null) {
            old = 0;
            seatData.countMap[i] = 1;
        } else {
            seatData.countMap[i]++;
        }
        seatData.holds.push(i);
        //逐个判定手上的牌
        flag = checkCanHu(seatData);
        //console.log('判断是否能胡牌', flag);
        //搞完以后，撤消刚刚加的牌
        seatData.countMap[i] = old;
        seatData.holds.pop();
        if (flag) {
            // //console.log("如果能胡牌,直接结束");
            // console.log("ly:可以胡牌(2)pai => ", i);
            // console.log("ly:可以胡牌(2)holds => ", seatData.holds);
            return flag;
        }
    }
    // 如果找到能听得牌,直接返回听牌,否则返回false;
    return flag;
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
exports.judgeTingPai = judgeTingPai;
// 检查是否可以听牌
exports.checkTingPai = checkTingPai;
// 判断是否可以吃
exports.getMJType = getMJType;
// 获得吃的组合
exports.getChiArray = getChiArray;
// 根据目标牌获得手牌
exports.getHoldsByType = getHoldsByType;
// 判断是否听七小对
exports.checkTingSevenParis = checkTingSevenParis;
exports.checkCaiShen = checkCaiShen;
exports.checkTingThirty = checkTingThirty;
exports.removeFromArray = removeFromArray;
exports.revertToOrigin = revertToOrigin;
exports.setHoldsCountMap = setHoldsCountMap;
exports.checkHuBigSevenParis = checkHuBigSevenParis;
exports.checkCanHu = checkCanHu;