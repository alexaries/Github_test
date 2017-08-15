var chs = "23456789abcdef";
var Poker = function(n) {
    this.num = n % 13;
    this.ch = chs[this.num];
    //this.show = "2,3,4,5,6,7,8,9,10,J,Q,K,A".split(",")[this.num];
    this.color = n / 13 | 0;
    // this.color = "♠♥♣♦"[n / 13 | 0];
    this.toString = function() {
        return this.ch;
    };
    this.paiDesc = function() {
        var paiValue = "";
        switch (this.ch) {
            case "a":
                paiValue = "10";
                break;
            case "b":
                paiValue = "J";
                break;
            case "c":
                paiValue = "Q";
                break;
            case "d":
                paiValue = "K";
                break;
            case "e":
                paiValue = "A";
                break;
            default:
                paiValue = this.ch;
                break;
        }
        var colorStr = "";
        switch (this.color) {
            case 0:
                colorStr = "黑桃";
                break;
            case 1:
                colorStr = "红桃";
                break;
            case 2:
                colorStr = "梅花";
                break;
            case 3:
                colorStr = "方块";
                break;
        }
        var desc = "" + colorStr + ":" + paiValue;
        return desc;
    }
};
var pokers = [];
for (var i = 0; i < 52; i++) {
    pokers.push(new Poker(i));
};

function _paiNumberFromIC(index, color) {
    var p = index + color * 13;
    return p;
}
var z = function(a) { //同花顺
    if (a.mainColor > -1) {
        var nums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        arr = a.filter(function(p) {
            var ok = p.color === a.mainColor;
            if (ok) {
                nums[p.num]++;
            }
            return ok;
        });
        var index = nums.join("").lastIndexOf("11111");
        if (index < 0) {
            //没有找到
            return null;
        }
        if (index == 8) {
            //如果是8
            //皇家同花顺(Max)
            return "9M";
        } else {
            //其他同花顺
            //还原最后一张牌
            // var pn = _paiNumberFromIC(index + 4, a.mainColor);
            // var pok = new Poker(pn);
            // //是同花顺,最后一张牌是 pok.paiDesc;
            var result = ["8"];
            result.push(chs[index + 4]);
            var rs = result.join("");
            return rs;
        }
    }
};
var y = function(a) { //四条
    var index1 = a.lastIndex[4],
        index2;
    if (index1 != -1) {
        //有炸弹
        //找出除炸弹外最大的牌
        var mIndex = -1;
        for (var i = a.nums.length; i >= 0; i--) {
            var v = a.nums[i];
            if (v >= 1 && i != index1) {
                mIndex = i;
                break;
            }
        }
        // console.log("mIndex",mIndex);
        if (mIndex == -1) {
            return null;
        }
        index2 = mIndex;
        var result = ["7"];
        result.push(chs[index1]);
        result.push(chs[index2]);
        return result.join("");
    }
};
var x = function(a) { //葫芦
    var index1 = a.nums.lastIndexOf(3),
        index2 = -1;
    if (index1 > -1) {
        //葫芦
        for (var i = a.nums.length - 1; i >= 0; i--) {
            var c = a.nums[i];
            if (parseInt(c) >= 2 && i != index1) {
                index2 = i;
                break;
            }
        }
        if (index2 == -1) {
            return null;
        }
        var result = ["6"];
        result.push(chs[index1]);
        result.push(chs[index2]);
        return result.join("");
    }
};
var w = function(a) { //同花
    if (a.mainColor > -1) {
        //默认是从小到大
        //此处需要翻转
        a.reverse();
        return "5" + a.filter(function(p) {
            return a.mainColor === p.color;
        }).join("").substring(0, 5);
    }
};
var v = function(a) { //顺子
    //将不是0,1的其他数字替换为1
    var nums = a.nums.replace(/[^01]/g, "1");
    var index = nums.lastIndexOf("11111");
    if (index < 0) {
        //没有找到
        return null;
    }
    var result = ["4"];
    result.push(chs[index + 4]);
    var rs = result.join("");
    return rs;
};
var u = function(a) { //三条
    var index1 = a.lastIndex[3],
        index2 = -1,
        index3 = -1;
    if (index1 != -1) {
        var totalStr = a.nums;
        for (var i = totalStr.length - 1; i >= 0; i--) {
            var c = totalStr[i];
            if (parseInt(c) >= 1 && i != index1) {
                index2 = i;
                break;
            }
        }
        for (var i = totalStr.length - 1; i >= 0; i--) {
            var c = totalStr[i];
            if (parseInt(c) > 1 && i != index1) {
                index3 = i;
                break;
            } else if (parseInt(c) == 1 && i != index1 && i != index2) {
                index3 = i;
                break;
            }
        }
        var result = ["3"];
        result.push(chs[index1]);
        result.push(chs[index2]);
        result.push(chs[index3]);
        return result.join("");
    }
};
var t = function(a) { //两对
    var index1 = a.lastIndex[2],
        index2 = -1,
        index3 = -1;
    if (index1 != -1) {
        //找第二个对子
        for (var i = a.nums.length - 1; i >= 0; i--) {
            var c = a.nums[i];
            if (parseInt(c) == 2 && i != index1) {
                index2 = i;
                break;
            }
        }
        if (index2 != -1) {
            //第二个对子也找到了
            for (var i = a.nums.length - 1; i >= 0; i--) {
                var c = a.nums[i];
                if (parseInt(c) >= 1 && i != index1 && i != index2) {
                    index3 = i;
                    break;
                }
            }
            if (index3 != -1) {
                var result = ["2"];
                result.push(chs[index1]);
                result.push(chs[index2]);
                result.push(chs[index3]);
                return result.join("");
            }
        }
    }
};
var s = function(a) { //一对
    var index1 = a.lastIndex[2];
    if (index1 != -1) {
        var others = [];
        for (var i = a.nums.length - 1; i >= 0; i--) {
            var c = a.nums[i];
            if (parseInt(c) == 1 && i != index1 && others.indexOf(i) == -1) {
                if (others.length >= 3) {
                    break;
                } else {
                    others.push(i);
                }
            }
        }
        var result = ["1"];
        result.push(chs[index1]);
        for (var i = 0; i < others.length; i++) {
            var c = others[i];
            result.push(chs[c]);
        }
        return result.join("");
    }
};
var r = function(a) { //高牌
    return "0" + a.str.split("").reverse().join("").substring(0, 5);
};
var score = function(arg) {
    // var arg = arguments;
    // if( ({}).toString.call( arguments[0] ) === "[object Array]" ){
    //     arg = arguments[0];
    // }
    // console.log("arg", arg);
    var colors = [0, 0, 0, 0],
        nums = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        str = "",
        lastIndex = [-1, -1, -1, -1, -1],
        mainColor = -1,
        a = [].map.call(arg, function(p) {
            var poker = pokers[p];
            colors[poker.color]++;
            if (colors[poker.color] === 5) {
                mainColor = poker.color;
            }
            return poker;
        });
    // console.log("a", a);
    // return;
    a.sort(function(p1, p2) {
        return p1.num - p2.num;
    });
    for (var i = 0; i < a.length; i++) {
        var poker = a[i];
        var times = ++(nums[poker.num]);
        lastIndex[times] = poker.num;
    }
    a.colors = colors;
    a.mainColor = mainColor;
    a.nums = nums.join("");
    a.str = a.join("");
    a.lastIndex = lastIndex;
    console.log("a.str", a.str);
    return z(a) || y(a) || x(a) || w(a) || v(a) || u(a) || t(a) || s(a) || r(a);
};
exports.score = score;

function _excuteTimeTest() {
    // var c = [
    // ];
    // // console.log("begin random:");
    // // for (var i = 0; i < 1; i++) {
    // //     var temp = [];
    // //     for (var j = 0; j < 7; j++) {
    // //         temp[j] = Math.random() * 52 | 0;
    // //     };
    // //     c.push(temp);
    // // };
    // var d = +new Date;
    // // console.log("begin execute:");
    // for (var i = 0; i < c.length; i++) {;
    //     console.log(score(c[i]));
    // };
    // console.log(+new Date - d);
}

function _compare(s0, s1) {
    console.log("dz:_compare", s0, s1);
    var b0 = s0[0];
    var b1 = s1[0];
    if (b0 > b1) {
        return 0;
    } else if (b0 < b1) {
        return 1;
    } else {
        //不比较花色
        //皇家同花顺:"9M"
        //同花顺: "8" + "起脚牌";eg"87" =>"76543"0r"20,19,18,17,16"
        //四条:"7"+"炸弹"+起脚牌            :72d  7d2
        //葫芦:"6"+"3张"+"2张"              :6d3
        //同花: "5"+"5张牌"                  5d7542
        //顺子: "4"+ "起脚牌"                47
        //三条: "3"+"3张"+"起脚牌"*2         3376
        //两队: "2"+"2张"*2 + "起脚牌"       2d75
        //一对: "1"+"2"张 + "起脚牌"         1dc87
        //散牌" "0"+"起脚牌"*5               0ecb92
        // 'd'>'2'
        var sub0 = s0.substring(1);
        var sub1 = s1.substring(1);
        if (sub0 > sub1) {
            return 0;
        } else if (sub0 < sub1) {
            return 1;
        }
    }
    return 2;
}
exports.compare = _compare;

function _logsArr(holds) {
    var log = "";
    for (var i = 0; i < holds.length; i++) {
        var p = new Poker(holds[i]);
        log += p.paiDesc() + " ";
    }
    return log;
}

function _logChar(chars, holds) {
    var c = "";
    var char = chars[0];
    switch (char) {
        case "a":
            c = 8;
            break;
        case "b":
            c = 9;
            break;
        case "c":
            c = 10;
            break;
        case "d":
            c = 11;
            break;
        case "e":
            c = 12;
            break;
        default:
            c = parseInt(char) - 2;
            break;
    }
    holds.sort(function(a, b) {
        return a - b;
    });
    for (var i = 0; i < holds.length; i++) {
        var n = parseInt(holds[i]);
        if (n % 13 == c) {
            return _logsArr([n]);
        }
    }
}