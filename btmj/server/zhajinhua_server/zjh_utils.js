//***算法begin**************************************************************************************
//排序方法
function sortNumber(a, b) {
    return a - b;
}
// 获取牌的花色
function getSinglePaiType(id) {
    if (id >= 0 && id < 13) { //黑
        return 0;
    } else if (id >= 100 && id < 113) { //红
        return 1;
    } else if (id >= 200 && id < 213) { //梅
        return 2;
    } else if (id >= 300 && id < 313) { //方
        return 3;
    } else {
        return -1; //表示出错了
    }
}
// 获取牌的值
function getSinglePaiValue(id) {
    var value = -1;
    if (id >= 0 && id < 13) { //黑
        value = id;
    } else if (id >= 100 && id < 113) { //红
        value = id - 100;
    } else if (id >= 200 && id < 213) { //梅
        value = id - 200;
    } else if (id >= 300 && id < 313) { //方
        value = id - 300;
    } else {
        return -1;
    }
    return value;
}
//获取单张牌的分
function getPaiScoreArray() {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 0];
}
//用于类型判断完成后的排序
function sortHoldsByValue(holds) {
    var th = [];
    for (var i = 0; i < holds.length; i++) {
        var value = getSinglePaiValue(holds[i]);
        th.push(value);
    }
    th.sort(sortNumber);
    return th;
}

function paiStingFromValue(value, flag) {
    var rv = value.toString();
    if (flag && rv < 10 && rv > 0) {
        rv = (value + 1).toString();
    }
    switch (value) {
        case 0:
            rv = "A";
            break;
        case 10:
            rv = "J";
            break;
        case 11:
            rv = "Q";
            break;
        case 12:
            rv = "K";
            break;
    }
    return rv;
}

function paiArrString(p0, p1, p2) {
    var bs1 = paiStingFromValue(p2) + paiStingFromValue(p1) + paiStingFromValue(p0);
    if (p0 == 0) {
        bs1 = paiStingFromValue(p0) + paiStingFromValue(p2) + paiStingFromValue(p1);
    }
    return bs1;
}
//豹子分数 "8AAA" - "8222"
//不是豹子 返回 null
function leopard(holds) {
    if (holds.length != 3) {
        console.log("isleopard: holds length is invalid!");
        return null;
    }
    var p0 = getSinglePaiValue(holds[0]);
    var p1 = getSinglePaiValue(holds[1]);
    var p2 = getSinglePaiValue(holds[2]);
    if (p0 == p1 && p0 == p2) {
        //是豹子
        var bs0 = '8';
        var bs1 = paiArrString(p0, p1, p2);
        var score = bs0 + bs1;
        return score;
    }
    return null;
}
//同花顺分数 "7AKQ" - "732A"
//不是同花顺 返回 null
function tonghuaShun(holds) {
    if (holds.length != 3) {
        console.log("tonghuaShun: holds length is invalid");
        return null;
    }
    var t0 = getSinglePaiType(holds[0]);
    var t1 = getSinglePaiType(holds[1]);
    var t2 = getSinglePaiType(holds[2]);
    if (t0 == t1 && t0 == t2) {
        //是同花
        //判断是不是顺子
        var th = sortHoldsByValue(holds);
        var p0 = th[0];
        var p1 = th[1];
        var p2 = th[2];
        var index0 = getPaiScoreArray().indexOf(p0);
        var index1 = getPaiScoreArray().indexOf(p1);
        var index2 = getPaiScoreArray().indexOf(p2);
        var t_a = [index0, index1, index2].sort(sortNumber);
        index0 = t_a[0];
        index1 = t_a[1];
        index2 = t_a[2];
        if (Math.abs((index1 - index0)) == 1 && Math.abs((index2 - index1)) == 1) {
            //是同花顺子
            var bs0 = "7";
            var bs1 = paiArrString(p0, p1, p2);
            var score = bs0 + bs1;
            return score;
        }
        //A23
        if (p0 == 0 && p1 == 1 && p2 == 2) {
            var bs0 = "7";
            var bs1 = paiStingFromValue(p2) + paiStingFromValue(p1) + paiStingFromValue(p0);
            var score = bs0 + bs1;
            return score;
        }
    }
    return null;
}
//同花分数 "6AKJ" - "6352"
//不是同花 返回 null
function tong_hua(holds) {
    if (holds.length != 3) {
        console.log("tong_hua: holds length is invalid");
        return 0;
    }
    var t0 = getSinglePaiType(holds[0]);
    var t1 = getSinglePaiType(holds[1]);
    var t2 = getSinglePaiType(holds[2]);
    if (t0 == t1 && t0 == t2) {
        //是同花
        //判断是不是顺子
        var th = sortHoldsByValue(holds);
        var p0 = th[0];
        var p1 = th[1];
        var p2 = th[2];
        var bs0 = "6";
        var bs1 = paiArrString(p0, p1, p2);
        var score = bs0 + bs1;
        return score;
    }
    return null;
}
//顺子分数 "5AKQ" - "532A"
//不是顺子 返回 null
function shun_zi(holds) {
    if (holds.length != 3) {
        console.log("shun_zi: holds length is invalid");
        return null;
    }
    //判断是不是顺子
    var th = sortHoldsByValue(holds);
    var p0 = th[0];
    var p1 = th[1];
    var p2 = th[2];
    var index0 = getPaiScoreArray().indexOf(p0);
    var index1 = getPaiScoreArray().indexOf(p1);
    var index2 = getPaiScoreArray().indexOf(p2);
    var t_a = [index0, index1, index2].sort(sortNumber);
    index0 = t_a[0];
    index1 = t_a[1];
    index2 = t_a[2];
    if (Math.abs((index1 - index0)) == 1 && Math.abs((index2 - index1)) == 1) {
        //是同花顺子
        var bs0 = "5";
        var bs1 = paiArrString(p0, p1, p2);
        var score = bs0 + bs1;
        return score;
    }
    //A23
    if (p0 == 0 && p1 == 1 && p2 == 2) {
        var bs0 = "5";
        var bs1 = paiStingFromValue(p2) + paiStingFromValue(p1) + paiStingFromValue(p0);
        var score = bs0 + bs1;
        return score;
    }
    return null;
}
//对子分数 "4AAK" - '4223'
//不是对子 返回 null
function dui_zi(holds) {
    if (holds.length != 3) {
        console.log("dui_zi: holds length is invalid");
        return null;
    }
    var th = sortHoldsByValue(holds);
    var p0 = th[0];
    var p1 = th[1];
    var p2 = th[2];
    if ((p1 - p0 == 0) || (p2 - p1 == 0)) {
        //是对子
        var index0 = getPaiScoreArray().indexOf(p0);
        var index1 = getPaiScoreArray().indexOf(p1);
        var index2 = getPaiScoreArray().indexOf(p2);
        var bs0 = "4";
        var bs1 = paiStingFromValue(p2) + paiStingFromValue(p1) + paiStingFromValue(p0);
        if (p1 - p0 == 0) {
            bs1 = paiStingFromValue(p0) + paiStingFromValue(p1) + paiStingFromValue(p2);
        }
        var score = bs0 + bs1;
        return score;
    }
    return null;
}
//单牌分数 "3AKJ" - '3532'
function dan_(holds) {
    if (holds.length != 3) {
        console.log("dui_zi: holds length is invalid");
        return null;
    }
    var th = sortHoldsByValue(holds);
    var p0 = th[0];
    var p1 = th[1];
    var p2 = th[2];
    var bs0 = "3";
    var bs1 = paiArrString(p0, p1, p2);
    var score = bs0 + bs1;
    return score;
}
//花色不同的"2,3,5" 记为"2235"
function teshu_(holds) {
    if (holds.length != 3) {
        console.log("dui_zi: holds length is invalid");
        return null;
    }
    var t0 = getSinglePaiType(holds[0]);
    var t1 = getSinglePaiType(holds[1]);
    var t2 = getSinglePaiType(holds[2]);
    if (t0 != t1 && t2 != t1 && t2 != t0) {
        var th = sortHoldsByValue(holds);
        var p0 = th[0];
        var p1 = th[1];
        var p2 = th[2];
        if (p0 == 2 && p1 == 3 && p2 == 5) {
            var bs0 = "2";
            var bs1 = paiArrString(p0, p1, p2);
            var score = bs0 + bs1;
            return score;
        }
    }
    return null;
}

function compareHolds(score0, score1) {
    if (!score0 || !score1) {
        return -1;
    }
    var s0_0 = score0.charAt(0);
    var s1_0 = score1.charAt(0);
    if (s0_0 == "8" && s1_0 == "2") {
        return 1;
    } else if (s0_0 == "2" && s1_0 == "8") {
        return 0;
    }
    if (s0_0 > s1_0) {
        //score0 比较大
        return 0;
    } else if (s0_0 == s1_0) {
        //相同
        if (s0_0 == "7" || s0_0 == "5") {
            //都是顺子,那么只需要比较第二个字符就可以。
            //如果第二个字符也相等。 那么比较第二个字符的花色
            var s0_1 = score0.charAt(1);
            var s1_1 = score1.charAt(1);
            if (compareChar(s0_1, s1_1) == 0) {
                //第0个位置大
                return 0;
            } else if (compareChar(s0_1, s1_1) == 2) {
                //相等,主动比较的那家为负
                return 1;
                //下面代码有缺陷。根据score 字符串是没有办法还原牌花色的
                // var t0 = getSinglePaiType(charToValue(s0_1));
                // var t1 = getSinglePaiType(charToValue(s1_1));
                // if (t1 > t0) {
                //     return 0;
                // } else {
                //     return 1;
                // }
            } else {
                return 1;
            }
        } else {
            //逐个判断其值
            var cv = -1;
            for (var i = 1; i < score0.length; i++) {
                var char0 = score0.charAt(i);
                var char1 = score1.charAt(i);
                cv = compareChar(char0, char1)
                if (cv == 2) {
                    continue;
                } else {
                    break;
                }
            }
            if (cv == 2) {
                return 1;
                //下面代码有缺陷。根据score 字符串是没有办法还原牌花色的
                // // 比较第二个数的花色
                // var s0_1 = score0.charAt(1);
                // var s1_1 = score1.charAt(1);
                // //相等
                // var t0 = getSinglePaiType(charToValue(s0_1));
                // var t1 = getSinglePaiType(charToValue(s1_1));
                // if (t1 > t0) {
                //     return 0;
                // } else {
                //     return 1;
                // }
            } else {
                return cv;
            }
        }
    } else {
        //score1 比较大
        return 1;
    }
}

function compareChar(char0, char1) {
    var value = parseInt(charToValue(char0) ? charToValue(char0) : 13) - parseInt(charToValue(char1) ? charToValue(char1) : 13);
    if (value > 0) {
        return 0;
    } else if (value == 0) {
        return 2;
    } else {
        return 1;
    }
}

function charToValue(char) {
    var value = char;
    switch (char) {
        case "A":
            value = 0;
            break;
        case "K":
            value = 12;
            break;
        case "Q":
            value = 11;
            break;
        case "J":
            value = 10;
            break;
    }
    return value;
}

function holds_score(holds) {
    if (!holds || holds.length != 3) {
        console.log("holdsScore: holds is invalid!");
        return;
    }
    var score = '';
    var funcArr = ["leopard", "tonghuaShun", "tong_hua", "shun_zi", "dui_zi", "teshu_", "dan_"];
    for (var i = 0; i < funcArr.length; i++) {
        var fuc = funcArr[i];
        var fuc_argument = fuc + "([" + holds + "])";
        var rv = eval(fuc_argument);
        if (rv) {
            score = rv;
            break;
        }
    }
    return score;
}

function _testByLy() {
    var sd0 = game.gameSeats[0];
    var sd1 = game.gameSeats[1];
    //说明 
    // //  8 - 豹子
    // //  7 - 同花顺
    // //  6 -  同花
    // //  5 - 顺子    
    // //  4 - 对子
    // //  3 - 单张
    // //  2 - 特殊
    // sd0.holds = [204,108,302];
    // sd1.holds = [208,109,210];
    sd0.score = holds_score(sd0.holds);
    sd1.score = holds_score(sd1.holds);
    var sf = "** 第 " + gIndex + " 次比较 ***************************";
    var s0_1 = "s0:holds:=> " + logValueToDirectlyPai(sd0.holds) + "     " + "(" + sd0.score + ")";
    var s0_2 = "s0:score:=> " + sd0.score;
    var fengGe = "###";
    var s1_1 = "s1:holds:=> " + logValueToDirectlyPai(sd1.holds) + "     " + "(" + sd1.score + ")";
    var s1_2 = "s1:score:=> " + sd1.score;
    var sr_0 = "###:比较结果: ";
    var sr_1 = "S1 赢了";
    var rv = compareHolds(sd0.score, sd1.score);
    if (rv == 0) {
        sr_1 = "S0 赢了";
    }
    sr_0 = sr_0 + "   " + sr_1;
    var se = "** 结束 **********************************";
    var totalS = "<p id='p_id'>";
    var tArr_ = [sf, s0_1, s1_1, sr_0, se];
    for (var i = 0; i < tArr_.length; i++) {
        totalS += tArr_[i] + "<br/>";
    }
    totalS += "<br/>" + "</p>";
    return totalS;
    // console.log("** 第 " + gIndex + " 次比较 ***************************");
    // console.log("s0:holds:=> " + sd0.holds);
    // sd0.score = holds_score(sd0.holds);
    // console.log("s0:score:=> " + sd0.score);
    // console.log("========");
    // console.log("s1:holds:=> " + sd1.holds);
    // sd1.score = holds_score(sd1.holds);
    // console.log("s1:score:=> " + sd1.score);
    // console.log(":比较结果: ");
    // var rv = compareHolds(sd0.score, sd1.score);
    // if (rv == 0) {
    //     console.log("sd0 赢了");
    // } else {
    //     console.log("sd1 赢了");
    // }
    // console.log("** 结束 **********************************");
}

function logValueToDirectlyPai(holds) {
    var totalS = "";
    for (var i = 0; i < holds.length; i++) {
        var value = getSinglePaiValue(holds[i]);
        var type = getSinglePaiType(holds[i]);
        var st = "";
        switch (type) {
            case 0:
                st = "黑桃";
                break;
            case 1:
                st = "红桃";
                break;
            case 2:
                st = "梅花";
                break;
            case 3:
                st = "方块";
                break;
        }
        var vs = paiStingFromValue(value, true);
        var sv = st + vs;
        totalS += sv;
        if (i < holds.length - 1) {
            totalS += ",";
        }
    }
    return totalS;
}
exports.holds_score = holds_score;
exports.compareHolds = compareHolds;
//***算法END**************************************************************************************