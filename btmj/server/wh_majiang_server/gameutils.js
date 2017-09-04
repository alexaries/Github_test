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
    // 随机处理
    for (var i = 0; i < mahjongs.length; ++i) {
        var lastIndex = mahjongs.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[index];
        mahjongs[index] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
    game.tipCountMap = {};
    for (var i = 0; i < 34; i++) {
        game.tipCountMap[i] = 4;
    }
    return;
    //测试用
    // var a1 = [5, 4, 11, 11, 13, 27, 15, 24, 15, 16, 21, 25, 25];
    var a1 = [18, 18, 19, 20, 21, 21, 22, 23, 24, 25, 25, 25, 31];
    var a2 = [9, 18, 21, 29, 29, 27, 21, 23, 32, 5, 6, 27, 16];
    var a3 = [0, 1, 2, 4, 4, 4, 6, 7, 8, 13, 13, 22, 23];
    var a4 = [12, 12, 12, 4, 4, 4, 15, 15, 15, 19, 19, 20, 21];
    var ta = [];
    for (var i = 0; i < a1.length; i++) {
        ta.push(a1[i]);
        ta.push(a2[i]);
        ta.push(a3[i]);
        ta.push(a4[i]);
    }
    ta.push(30);
    mahjongs = ta.concat(mahjongs);
    game.mahjongs = mahjongs;
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
    var pai = game.mahjongs[game.currentIndex];
    game.currentIndex++;
    _laizi(game, pai);
    //庄家多摸最后一张
    game.gameSeats[game.button].lastPai = mopai(game, game.button);
    //当前轮设置为庄家
    game.turn = game.button;
    if (game.pre_pizi != 31) {
        game.tipCountMap[game.pre_pizi] = 3;
    }
}

function _laizi(game, pai) {
    var results = _laiziPi(pai);
    game.laizi = results[1];
    game.pre_pizi = results[2];
    game.sub_pizi = results[3];
    console.log("_laizi:", game.laizi);
    console.log("_pre_pizi:", game.pre_pizi);
    console.log("_sub_pizi:", game.sub_pizi);
}

function _pai_sub_1(id) {
    return _pai_as(id, -1);
}

function _pai_Add_1(id) {
    return _pai_as(id, 1);
}

function _pai_as(id, num) {
    //牌的加减运算。相当于+运算符重载
    //num<0表示减。 >=0 表示加
    var end = 8;
    var begin = 0;
    if (id > 26) {
        end = 33;
        begin = 27;
    }
    var type = mjutils.getMJType(id);
    var base = type == 3 ? 0 : type;
    var value = mjutils.getMJValue(id) + num;
    if (value > end) {
        value = begin;
    }
    if (value < begin) {
        value = end;
    }
    return value + base * (end + 1);
}

function _laiziPi(pai) {
    var pre = pai;
    var sub = _pai_sub_1(pai);
    var laizi = _pai_Add_1(pai);
    console.log("ly:_laiziPi:", pai);
    switch (pai) {
        case 30:
            laizi = 32;
            pre = 29;
            sub = 30;
            break;
        case 31:
            laizi = 32;
            pre = 29;
            sub = 30;
            break;
        case 32:
            sub = 30;
            break;
    }
    //顺序为:pai, 癞子, 前癞子皮, 后癞子皮
    var result = [pai, laizi, pre, sub];
    return result;
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
exports.shuffle = shuffle;
exports.mopai = mopai;
exports.deal = deal;