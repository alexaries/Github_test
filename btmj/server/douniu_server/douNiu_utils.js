//斗牛 
//和炸金花类似
//除去大小王共52张牌。
//每人5张牌
//炸弹>5小>5花>4花>双牛>牛>单
//注:A 是最小的牌
//依然采用计分法
/*********一些接口****************/
exports.n_pointedNiu = n_pointedNiu;
exports.n_caculateScore = n_caculateScore;
exports.compareHolds = compareHolds;
exports.logSinglePai = logSinglePai;
//***算法begin**************************************************************************************
/*********一些辅助方法****************/
//取两个数组的交集，没有交集，返回空数组
//不影响原数组a和b
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
//从数组中删除某个元素
function removeByValue(arr, val) {
    for (var i = 0; i < arr.length; i++) {
        if (arr[i] == val) {
            arr.splice(i, 1);
            break;
        }
    }
}

function deepCopy(source) {
    var result = {};
    for (var key in source) {
        if (typeof source[key] === 'object' || (source[key] instanceof Array)) {
            if (source[key] instanceof Array) {
                result[key] = arrDeepcopy(source[key]);
            } else {
                result[key] = deepCopy(source[key]);
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
};　
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
//排序方法,从大到小排序
function sortByDesc(a, b) {
    return b - a;
}

function sortByAsc(a, b) {
    return a - b;
}
/*******辅助方法end************/
//判断一张牌是否是花牌
function isHuaPai(id) {
    if (id > 13) {
        id = getSinglePaiValue(id);
    }
    if (id <= 12 && id >= 10) {
        return true;
    }
    return false;
}
//判断是不是小牌
function isLittlePai(id) {
    if (id > 13) {
        id = getSinglePaiValue(id);
    }
    if (id < 4) {
        return true;
    }
    return false;
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
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
}
//用于类型判断完成后的排序
//默认是ASC , flag 为 true 表示的ASC
//将带牌型的数组转换为不带牌型的数组
function sortHoldsByValue(holds, flag) {
    var th = [];
    for (var i = 0; i < holds.length; i++) {
        var value = getSinglePaiValue(holds[i]);
        th.push(value);
    }
    if (flag) {
        th.sort(sortByDesc);
    } else {
        th.sort(sortByAsc);
    }
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
//默认按照从大到小，
//炸弹情况特殊,bp表示炸弹的牌
function _stringFormHolds(th) {
    th.sort(sortByDesc);
    var _string = "";
    for (var i = 0; i < th.length; i++) {
        var pai = th[i];
        _string += paiStingFromValue(pai);
    }
    return _string;
}
//检查当前牌是否有效
function _holdsIsValid(holds) {
    if (holds.length != 5) {
        console.log("_holdsIsValid: holds length is invalid!");
        return false;
    }
    return true;
}
//炸弹 标志位是"6"
//不是炸弹 返回 null
function bomb(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    //将holds 排序
    var th = sortHoldsByValue(holds, true);
    var p0 = th[0];
    var p1 = th[1];
    var p2 = th[2];
    var p3 = th[3];
    var p4 = th[4];
    var score = null;
    var dan = -1;
    //排完序之后
    if (p0 == p1 && p0 == p2 && p0 == p3) {
        //有炸弹  
        dan = p4;
    }
    if (p1 == p2 && p1 == p3 && p1 == p4) {
        dan = p0;
    }
    if (dan > -1) {
        var danYuan = _paiWithTypeFromValue(holds, [dan]);
        var bo = _delSubArr(th, [dan]);
        var boYuan = _paiWithTypeFromValue(holds, bo);
        var result = [-1, danYuan, boYuan, "6"];
        console.log("原:", result);
        return result;
    }
    return null;
}
//五小 标志位8
//不是五小 返回 null
//五小指的是 5张小于5的数(标号是从0开始，所以代码中<4)
//相加之和<=10
function five_little(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    //将holds 排序
    var th = sortHoldsByValue(holds, true);
    var score = [];
    var sum = 0;
    for (var i = 0; i < th.length; i++) {
        var pai = th[i];
        if (isLittlePai(pai)) {
            score.push(pai);
            //因为下标是从0开始的
            sum += (pai + 1);
        }
    }
    if (score.length == th.length) {
        if (sum <= 10) {
            //五小
            // return "7" + _stringFormHolds(th);
            // 
            var yuan = _paiWithTypeFromValue(holds, th);
            var result = [-1, [], yuan, "8"];
            console.log("原:", result);
            return result;
        }
    }
    return null;
}
//标志位7
//不是五花 返回 null
function five_hua(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    //将holds 排序
    var th = sortHoldsByValue(holds, true);
    var score = null;
    var hua_count = 0;
    for (var i = 0; i < th.length; i++) {
        var type = isHuaPai(th[i]);
        if (!type) {
            break;
        }
        hua_count++;
    }
    if (hua_count == th.length) {
        // return "6" + _stringFormHolds(th);
        //如果是五花
        var yuan = _paiWithTypeFromValue(holds, th);
        var result = [-1, [], yuan, "7"];
        console.log("原:", result);
        return result;
    }
    return null;
}
//牛牛标志 "5-"
//不是牛牛 返回 null
function Niu_Niu(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    var fsn = _find_double_Niu(holds);
    if (fsn == null) {
        console.log("没有找到牛");
        return null;
    }
    var result = _niu_last_back(holds, fsn);
    // console.log("分数:", result[0]);
    // console.log("剩余:", result[1]);
    // console.log("牛:", result[2]);
    if (result.length != 3) {
        return null;
    }
    result.push("5");
    return result;
}
//返回值有两种可能
//1)返回null 表示没有单牛
//2)返回长度是3的数组,顺序: 0:分数(整形),1:最后的两张杂牌(数组),2:牛(数组)
//单牛标志"4"
function _single_Niu(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    //在加工，在这里主要是将牌值还原成带花色的id号
    var fsn = _find_single_Niu(holds);
    if (fsn == null) {
        console.log("没有找到牛");
        return null;
    }
    var result = _niu_last_back(holds, fsn);
    // console.log("分数:", result[0]);
    // console.log("剩余:", result[1]);
    // console.log("牛:", result[2]);
    if (result.length != 3) {
        return null;
    }
    result.push("4");
    return result;
}
//没有牛
//散搭
function dan_(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    var th = sortHoldsByValue(holds, true);
    var yuan = _paiWithTypeFromValue(holds, th);
    var result = [-1, yuan, [], "1"];
    // console.log("牌值大小", th);
    // console.log("原牌ID", yuan);
    // console.log("最后结果", result);
    return result;
}
//将数组由牌值还原成带牌型。
//并且将首张牌的牌型替换为最大值
//holds 表示带牌型的数组
//th 表示不带牌型只有牌值的数组
//返回值是带牌型的数组
function _paiWithTypeFromValue(holds, th) {
    if (!holds || !th) {
        return;
    }
    var countDict = deepCopy(_caculatePaiCount(holds));
    var yuan = [];
    for (var i = 0; i < th.length; i++) {
        var pai = th[i];
        var arr = countDict[pai];
        var t = arr[0];
        yuan.push(t);
        arr.splice(0, 1);
    }
    return yuan;
}
//找牛
//返回牛的数组
//若没有牛则返回空数组
//注意(必要):这里的holds指的是牌值的数组(不带牌型)
function _find_niu(holds) {
    var len = holds.length;
    var niuArrs = [];
    for (var i = 0; i < len - 2; i++) {
        for (var j = i + 1; j < len - 1; j++) {
            for (var k = j + 1; k < len; k++) {
                var p0 = _niu_fen_from_pai(holds[i]);
                var p1 = _niu_fen_from_pai(holds[j]);
                var p2 = _niu_fen_from_pai(holds[k]);
                var t_fen = p0 + p1 + p2;
                if (t_fen % 10 == 0) {
                    //有牛
                    var t = [holds[i], holds[j], holds[k]];
                    niuArrs.push(t);
                }
            }
        }
    }
    return niuArrs;
}
//返回一个长度为3的数组
//注意(必要):这里的holds指的是牌值的数组(不带牌型)
function _caculate_fen(holds, niuArrs) {
    var scores = [];
    for (var i = 0; i < niuArrs.length; i++) {
        var niu = niuArrs[i];
        var last = _delSubArr(holds, niu);
        var p0 = last[0];
        var p1 = last[1];
        var lv = _niu_fen_from_pai(p0) + _niu_fen_from_pai(p1);
        var fen = lv % 10;
        var fenArr = [fen, last.sort(sortByDesc), niu];
        scores.push(fenArr);
    }
    return scores;
}
//传入带牌型的数组
//返回对象eg{2:[2,102,202,302]...}
function _caculatePaiCount(holds) {
    var tCountArr = {};
    var h1 = sortHoldsByValue(holds.slice(0));
    for (var i = 0; i < h1.length; i++) {
        var a1 = h1[i];
        var a1_arr = [];
        for (var k = 0; k < holds.length; k++) {
            var a2 = getSinglePaiValue(holds[k]);
            if (a1 == a2) {
                a1_arr.push(holds[k]);
            }
        }
        a1_arr.sort(sortByAsc);
        tCountArr[a1] = a1_arr;
    }
    return tCountArr;
}
//确定牛,杂牌,分数之后
//区别牌类型性。保证杂牌中花色是最大的
//将牌还原成最初的id号
//返回长度是3的数组,顺序: 0:分数(整形),1:最后的两张杂牌(数组),2:牛(数组)
////注意(必要):这里的holds指的是带牌型的数组
function _niu_last_back(holds, fsn) {
    var fen = fsn[0];
    var last = fsn[1];
    var tCountArr = _caculatePaiCount(holds);
    var l0 = last[0];
    var l1 = last[1];
    var newLast = [];
    //将分转换为牌
    if (l0 == l1) {
        var key = l0;
        l0 = tCountArr[key][0];
        l1 = tCountArr[key][1];
    } else {
        l0 = tCountArr[l0][0];
        l1 = tCountArr[l1][0];
    }
    newLast = [l0, l1];
    //最后两张牌确定，holds中删除newLast就是牛了
    var niuArr = _delSubArr(holds, newLast);
    //返回这个对象
    //返回值的顺序: 0:分数(整形),1:最后的两张数组,2:牛数组
    var result = [fen, newLast, niuArr];
    return result;
}
//注意(必要):这里的holds指的是带牌型的数组
function _find_double_Niu(holds) {
    //找最优的牛牛
    //何为最优,最后的两张牌最大就是最优
    //将holds 排序
    var th = sortHoldsByValue(holds);
    var p0 = th[0];
    var p1 = th[1];
    var p2 = th[2];
    var p3 = th[3];
    var p4 = th[4];
    var sum = _niu_fen_from_pai(p0) + _niu_fen_from_pai(p1) + _niu_fen_from_pai(p2) + _niu_fen_from_pai(p3) + _niu_fen_from_pai(p4);
    //找牛牛
    //1)牛牛的第一个必要条件:5个数加起来必须是10的倍数
    if (sum % 10 != 0) {
        //不是10的倍数,那么必定不是牛
        return null;
    }
    //2)第二个必要条件:存在3张牌相加之和是10的倍数
    var nius = _find_niu(th);
    var scores = _caculate_fen(th, nius);
    //3)找出最优的牛牛
    //因为牛牛的分数肯定都是0(一样值);
    var mFens = scores;
    //找出第一张牌的最大值
    var mxPai = 0;
    for (var i = 0; i < mFens.length; i++) {
        var fenArr = mFens[i];
        //降序排序
        var lasts = fenArr[1];
        var p0 = lasts[0];
        if (p0 >= mxPai) {
            mxPai = p0;
        }
    }
    //取第一张牌的最大值
    var mxFenPais = [];
    for (var i = 0; i < mFens.length; i++) {
        var fenArr = mFens[i];
        //降序排序
        var lasts = fenArr[1];
        var p0 = lasts[0];
        if (p0 == mxPai) {
            mxFenPais.push(fenArr);
        }
    }
    // console.log("mxFenPais", mxFenPais);
    //mxFenPais 存放的是第一张牌最大的数组
    //找出第二张最大的值
    var mxPai_2 = 0;
    for (var i = 0; i < mxFenPais.length; i++) {
        var fenArr = mxFenPais[i];
        //降序排序
        var lasts = fenArr[1];
        var p1 = lasts[1];
        if (p1 >= mxPai_2) {
            mxPai_2 = p1;
        }
    }
    var mxFenPais2 = [];
    for (var i = 0; i < mxFenPais.length; i++) {
        var fenArr = mxFenPais[i];
        var lasts = fenArr[1];
        var p1 = lasts[1];
        if (p1 == mxPai_2) {
            mxFenPais2.push(fenArr);
        }
    }
    console.log("mxFenPais2", mxFenPais2);
    return mxFenPais2[0];
}
//找到最优的牛。
//思路:剩下的两张点数最大的为最优的牛,如果分数相同比较第一张牌，如果第一张牌相同则比较花色
//776 10 4 ; 2 8 10 6 6  
//找不到牛返回null
//注意(必要):这里的holds指的是带牌型的数组
function _find_single_Niu(tholds) {
    //升序
    var holds = sortHoldsByValue(tholds, true);
    var niuArrs = _find_niu(holds);
    if (niuArrs.length < 1) {
        //没有牛，返回null
        return null;
    } else {
        //有牛
        //找到最优牛(目前只考虑单牛的情况)
        //1.首先找到剩余点数最大的牛
        //2.如果剩余点数是一样大的
        //3.比较这两张牌最大的牌
        //4.如果最后两张牌是一样的值。
        //5.返回最大值对应花色最大的牌
        //6.返回最优
        // var maxValue = 0;
        // var maxFenArr = [];
        //计算每个牛对应的分数及剩下的牌
        var scores = _caculate_fen(holds, niuArrs);
        //找到最大的分数
        var maxFen = 0;
        for (var i = 0; i < scores.length; i++) {
            var fenArr = scores[i];
            var fen = fenArr[0];
            if (fen >= maxFen) {
                maxFen = fen;
            }
        }
        //取出最大的分，最大的分可能也有很多组
        var mFens = []
        for (var i = 0; i < scores.length; i++) {
            var fenArr = scores[i];
            var fen = fenArr[0];
            if (fen == maxFen) {
                mFens.push(fenArr);
            }
        }
        //最大分已经找出
        //如果只有一个最大分，不用再向下执行
        if (mFens.length == 1) {
            //已经找到最大的牛了。
            return mFens[0];
        }
        //否则比较剩余的两张牌
        // value 在[2,20]之间 
        // value = p0 + p1; p0,p1的取值范围都是[1,10]
        // 假设存在v0 = p0 + p1; v1 = p2+p3;
        // v0%10 == v1%10
        // 若此时p0 = p2 ,
        // Q: p1和p3 的值相等吗？
        // 1)假设v0 == v1 => p1=p3;
        // 2)假设v0 == v1+10 => p1 = p3+10; 因为 p1 在[1,10] 之间，所以假设不成立
        // 3)假设 v0+10 = v1 => p1+10 = p3; 同2)，假设不成立
        // 综上:p1一定等于p3;
        //因此若两个分数相同只需要比较剩下两张牌中最大的那张牌。若最大牌的值相同，则比较花色最大的那张牌
        var mxPai = 0;
        for (var i = 0; i < mFens.length; i++) {
            var fenArr = mFens[i];
            //降序排序
            var lasts = fenArr[1];
            var p0 = lasts[0];
            if (p0 >= mxPai) {
                mxPai = p0;
            }
        }
        //mxFenPais 的个数一定是<=3且一定>=1,4个是炸不会在这 (是不是<=2还需要论证)
        var mxFenPais = [];
        for (var i = 0; i < mFens.length; i++) {
            var fenArr = mFens[i];
            //降序排序
            var lasts = fenArr[1];
            var p0 = lasts[0];
            if (p0 == mxPai) {
                mxFenPais.push(fenArr);
            }
        }
        return mxFenPais[0];
        //如果是花色的问题不在此处判断了。在返回的时候将同值牌的花色较大始终放在最后两张牌中
    }
}

function _niu_fen_from_pai(id) {
    //当前牌的分数
    //如果是JQK则认为是10;
    var value = getSinglePaiValue(id) + 1; // +1 的原因是牌的标号是从0开始的
    if (isHuaPai(id)) {
        value = 10;
    }
    return value;
}

function compareHolds(score0, score1) {
    //比牌思路。每副牌都有一个分数,该分数的组成是[分数,杂牌数组,成型的数组,标志位]
    //注:杂牌数组可能为空,成型的数组也可能为空, -1表示分数位无效无需比较，空数组表示该数组位无效无需比较
    // eg：
    // 五小:[-1,[],[x,x,x,x,x],"8"] 若最大一张牌的大小一样则按照花色比较
    // 五花:[-1,[],[x,x,x,x,x],"7"] 若最大一张牌的大小一样则按照花色比较
    // 炸弹: [-1,[y],[x,x,x,x],"6"];若庄家闲家都是四炸牌型，则比较4张一样的牌的大小
    // 牛牛:[-1,[y,z],[a0,a1,a2],"5"] 其中分数 = 0
    // 单牛:[分数,[y,z],[a0,a1,a2],"4"]
    // 没有牛:[-1,[a,b,c,d,e],[空],"1"] 
    var B0 = score0[3];
    var B1 = score1[3];
    if (B0 > B1) {
        //表示0号玩家赢了
        return 0;
    } else if (B0 < B1) {
        //表示1号玩家赢了
        return 1;
    } else {
        //表示两家的标志位相同
        if (B0 == "8" || B0 == "7" || B0 == "6") {
            //都是炸弹or都是5小or都是5花,比较成型数组中第一个元素(唯一)
            var c0 = score0[2][0];
            var c1 = score1[2][0];
            return _compareByPai(c0, c1);
        }
        if (B0 == "5" || B0 == "4") {
            if (B0 == "4") {
                //如果是单牛,优先比较分数
                var fen0 = score0[0];
                var fen1 = score1[0];
                if (fen0 > fen1) {
                    return 0;
                } else if (fen0 < fen1) {
                    return 1;
                }
            }
            //如果分数一样和牛牛一样的比较
            //都有牛
            //比较杂牌区的首牌
            var z0 = score0[1][0];
            var z1 = score1[1][0];
            return _compareByPai(z0, z1);
        }
        if (B0 == "1") {
            //比较杂牌区的首牌
            var z0 = score0[1][0];
            var z1 = score1[1][0];
            return _compareByPai(z0, z1);
        }
    }
}
//两个牌之间的比较
function _compareByPai(c0, c1) {
    if (getSinglePaiValue(c0) > getSinglePaiValue(c1)) {
        return 0;
    } else if (getSinglePaiValue(c0) == getSinglePaiValue(c1)) {
        //不可能存在牌值相同，牌型也相同的情况
        var t0 = getSinglePaiType(c0);
        var t1 = getSinglePaiType(c1);
        if (t0 < t1) {
            //牌型值比较小的牌大
            return 0;
        }
    }
    return 1;
};
//传入带牌型的数组
function n_caculateScore(holds) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    var score = [];
    var funcArr = ["five_little", "five_hua", "bomb", "Niu_Niu", "_single_Niu", "dan_"];
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
//nius 带牌型的数组
//有效返回true值
//无效返回false
function _checkNiuIsValid(nius) {
    if (!nius || nius.length != 3) {
        return false;
    }
    var p0 = _niu_fen_from_pai(nius[0]);
    var p1 = _niu_fen_from_pai(nius[1]);
    var p2 = _niu_fen_from_pai(nius[2]);
    if ((p0 + p1 + p2) % 10 == 0) {
        //是牛
        return true;
    }
    return false;
}
//指定牛
//holds,nius 均为带牌型的数组
function n_pointedNiu(holds, nius) {
    if (!_holdsIsValid(holds)) {
        return null;
    }
    var score = n_caculateScore(holds);
    //检验牛是否有效
    if (!_checkNiuIsValid(nius)) {
        return score;
    }
    var b = score[3];
    var bArr = ["6", "7", "8"];
    if (bArr.indexOf(b) > -1) {
        //是五小,五花,炸弹类型的直接返回
        return score;
    }
    //取nius 在 holds 中的差集
    var lasts = _delSubArr(holds, nius);
    var th_lasts = sortHoldsByValue(lasts, true);
    var p0 = th_lasts[0];
    var p1 = th_lasts[1];
    var mark = "4";
    var fuyuan = _fuYuanPaiArr(lasts, th_lasts);
    var result = [];
    if ((p1 + p0) % 10 == 0) {
        mark = "5";
        //是牛牛
        result = [0, fuyuan, nius, mark];
    } else {
        var fen = (p1 + p0) % 10;
        mark = "4";
        result = [fen, fuyuan, nius, mark];
    }
    return result;
}
//toArr: 原来带牌型的数组
//needArr: 排完序之后带值的数组
function _fuYuanPaiArr(toArr, needArr) {
    needArr.sort(sortByDesc);
    var countDict = _caculatePaiCount(toArr);
    var p0 = needArr[0];
    var p1 = needArr[1];
    var finalArr = [];
    if (p0 == p1) {
        finalArr.push(countDict[p0][0]);
        finalArr.push(countDict[p0][1]);
    } else {
        finalArr.push(countDict[p0][0]);
        finalArr.push(countDict[p1][0]);
    }
    return finalArr;
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

function logSinglePai(pai) {
    var value = getSinglePaiValue(pai);
    var type = getSinglePaiType(pai);
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
    return sv;
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
//***算法END**************************************************************************************