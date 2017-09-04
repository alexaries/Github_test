//说明: 武汉麻将用来判断是否能胡牌
var _holds = [0, 0, 12, 13, 14, 20, 20, 23, 24, 25, 26, 26, 26];
var _daPai = 27;
var _debug = true;
var games = {};
var gamesIdBase = 0;
var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;
var gameSeatsOfUsers = {};
var _preIndex = -1;
var _calBack = function() {
    console.log("_calBack");
};
//开始新的一局
function begin(config, callback) {
    callback = callback || _calBack;
    if (config) {
        _holds = config._holds;
        _daPai = config._daPai;
        _debug = config._debug;
    }
    var roomInfo = {
        gameIndex: 4,
        nextButton: 0
    };
    if (roomInfo == null) {
        return;
    }
    var seats = roomInfo.seats;
    var game = {
        conf: roomInfo.conf,
        roomInfo: roomInfo,
        gameIndex: roomInfo.numOfGames,
        button: roomInfo.nextButton,
        mahjongs: new Array(108),
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
        daPai: -1
    };
    roomInfo.numOfGames++;
    for (var i = 0; i < 4; ++i) {
        var data = game.gameSeats[i] = {};
        data.game = game;
        data.seatIndex = i;
        data.userId = 0;
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
        data.chis = [];
        //碰了的牌
        data.pengs = [];
        //缺一门
        data.que = -1;
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
        //是否可以胡
        data.canHu = false;
        //是否可以出牌
        data.canChuPai = false;
        //如果guoHuFan >=0 表示处于过胡状态，
        //如果过胡状态，那么只能胡大于过胡番数的牌
        data.guoHuFan = -1;
        //是否胡了
        data.hued = false;
        //是否是自摸
        data.iszimo = false;
        data.isGangHu = false;
        //
        data.actions = [];
        //当前的胡牌方案
        data.hupaiCurrent = [];
        //格式见下
        /*
        {"0"://听的牌
            {
              "hu": [0,0,0,103,104,105,205,206,207,208,208,208,202,202], //胡牌的方案
              "jiang":202  //胡牌方案中将是哪一个
              "isHard":true, //是否是硬胡,癞子全部作为"原牌"使用
              "laizi_s":3,  //癞子个数  
              "laizi_arr":[], //癞子当成"其他牌"的数组。若isHard为true,则该数组长度必定是0
              "is_258":true,//true表示258做将;否则只能胡清一色,风一色,碰碰胡
              "is_feng":false  //如果是风做将,只能是风一色或者碰碰胡 
            },
        }
        */
        //
        data.tingData = {};
        //所有的胡牌方案
        data.hupaiDict = {};
        data.fan = 0;
        data.score = 0;
        data.lastFangGangSeat = -1;
        //搭牌的数量
        data.daPais = [];
        data.pointedJiangDict = {};
        data.hasPointedJiang = false;
        data.pointedPai = -1;
        //能吃的胡牌方案
        data.canChiDic = {};
        //听牌算法中记录当前牌
        data.currentPai = -1;
        //统计信息
        data.numZiMo = 0;
        data.numJiePao = 0;
        data.numDianPao = 0;
        data.numAnGang = 0;
        data.numMingGang = 0;
        data.numChaJiao = 0;
        gameSeatsOfUsers[data.userId] = data;
    }
    games[0] = game;
    // //洗牌
    // shuffle(game);
    // //发牌
    // deal(game);
    var numOfMJ = game.mahjongs.length - game.currentIndex;
    var huansanzhang = false;
    //测试用
    game.state = "playing";
    var seatData = game.gameSeats[0];
    // seatData.holds = [0, 0, 9, 10, 11, 23, 23];
    // game.daPai = 0;
    // seatData.holds = [25, 25, 25, 6, 7, 8, 19, 20, 21, 21];
    // seatData.holds = [0, 1, 2, 21, 22, 31, 31];
    // seatData.holds = [7, 21, 22, 23];
    // seatData.holds = [1,2,3,4,4,5,6,7,19,20];
    // seatData.holds = [15, 5, 6, 7, 18, 19, 21];
    // game.daPai = 15;
    seatData.holds = _holds;
    game.daPai = _daPai;
    for (var i = 0; i < seatData.holds.length; i++) {
        var pp = seatData.holds[i];
        var count = seatData.countMap[pp];
        if (!count) {
            count = 1;
        } else {
            count++;
        }
        seatData.countMap[pp] = count;
    }
    seatData.allowTingFlag = true;
    checkCanTingPai(game, seatData, callback);
};

function shuffle(game) {
    var mahjongs = game.mahjongs;
    //筒 (0 ~ 8 表示筒子
    var index = 0;
    for (var i = 0; i < 9; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    //条 100 ~ 108表示条子
    for (var i = 9; i < 18; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    for (var i = 18; i < 27; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    //东南西北中发白
    for (var i = 27; i < 34; ++i) {
        for (var c = 0; c < 4; ++c) {
            mahjongs[index] = i;
            index++;
        }
    }
    for (var i = 0; i < mahjongs.length; ++i) {
        var lastIndex = mahjongs.length - 1 - i;
        var index = Math.floor(Math.random() * lastIndex);
        var t = mahjongs[index];
        mahjongs[index] = mahjongs[lastIndex];
        mahjongs[lastIndex] = t;
    }
}

function mopai(game, seatIndex) {
    if (game.currentIndex == game.mahjongs.length) {
        return -1;
    }
    var data = game.gameSeats[seatIndex];
    var mahjongs = data.holds;
    var pai = game.mahjongs[game.currentIndex];
    mahjongs.push(pai);
    if (pai === game.daPai) {
        //如果是搭牌
        data.daPais.push(pai);
    }
    //统计牌的数目 ，用于快速判定（空间换时间）
    var c = data.countMap[pai];
    if (c == null) {
        c = 0;
    }
    data.countMap[pai] = c + 1;
    game.currentIndex++;
    return pai;
}

function deal(game) {
    //强制清0
    game.currentIndex = 0;
    //从27牌中随机取出一张牌为搭牌
    //0-107随机整数，从0开始
    game.daPai = 0;
    //每人13张 一共 13*4 ＝ 25张 庄家多一张 53张
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
    mopai(game, game.button);
    //当前轮设置为庄家
    game.turn = game.button;
}