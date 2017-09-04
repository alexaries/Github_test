var roomMgr = require("./roommgr");
var userMgr = require("./usermgr");
var mjutils = require('./mjutils');
var gameutils = require('./gameutils');
var db = require("../utils/db");
var crypto = require("../utils/crypto");
var http_service = require('./http_service');
var games = {};
var gamesIdBase = 0;
// 麻将总数136张 筒 万 条 各36张 风头28张（东西南北中发白）
var ALLMJCOUNT = 136;
var ACTION_CHUPAI = 1;
var ACTION_MOPAI = 2;
var ACTION_PENG = 3;
var ACTION_GANG = 4;
var ACTION_HU = 5;
var ACTION_ZIMO = 6;
var ACTION_CHI = 7;
var ACTION_S_GANG = 8;
var ACTION_NotAn_GANG = 9;
var gameSeatsOfUsers = {};
var GLOBAL_Min_Fan = 6;
//检查是否可以明杠
function checkCanDianGang(game, seatData, targetPai) {
    //检查玩家手上的牌
    //如果没有牌了，则不能再杠
    // console.log("检查是否可以杠牌", seatData.holds, targetPai);
    seatData.canGang = false;
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    var count = seatData.countMap[targetPai];
    if (count != null && count >= 3) {
        seatData.canGang = true;
        seatData.gangPai.push(targetPai);
        return;
    }
}

function checkCanChi(game, seatData, pai) {
    seatData.chiArray = [];
    seatData.canChi = false;
    if (pai > 26) {
        return false;
    }
    var _holds = seatData.holds;
    if (_holds.length < 2) {
        return false;
    }
    var next = (game.turn + 1) % 4;
    if (next != seatData.seatIndex) {
        return false;
    }
    var _value = mjutils.getMJValue(pai);
    var _type = mjutils.getMJType(pai);
    var v0_0 = _value - 2;
    var v0_1 = _value - 1;
    var v0_2 = _value;
    var res0 = [v0_0, v0_1, v0_2];
    var v1_0 = _value - 1;
    var v1_1 = _value;
    var v1_2 = _value + 1;
    var res1 = [v1_0, v1_1, v1_2];
    var v2_0 = _value;
    var v2_1 = _value + 1;
    var v2_2 = _value + 2;
    var res2 = [v2_0, v2_1, v2_2];
    var totals = [];

    function resIsValid(tempArr) {
        //if temp 中存在<0或>8 返回false; 
        // 如果不存在则返回true
        var invalidFlag = tempArr.some(function(val) {
            if (val < 0 || val > 8) {
                return true;
            }
            return false;
        });
        return !invalidFlag;
    }

    function restorePai(val, type) {
        var p = type * 9 + val;
        return p;
    }

    function restoreArr(tarr) {
        var rarr = tarr.map(function(ele) {
            return restorePai(ele, _type);
        });
        return rarr;
    }
    if (resIsValid(res0)) {
        totals.push(restoreArr(res0));
    }
    if (resIsValid(res1)) {
        totals.push(restoreArr(res1));
    }
    if (resIsValid(res2)) {
        totals.push(restoreArr(res2));
    }
    if (totals.length < 1) {
        return false;
    }
    var frs = [];
    totals.map(function(ta) {
        mjutils.arrRemoveByValue(ta, pai);
        var invalid = ta.some(function(ele) {
            if (_holds.indexOf(ele) == -1 || game.singles.indexOf(ele) != -1) {
                return true;
            }
            return false;
        });
        if (!invalid) {
            frs.push(ta);
        }
    });
    if (frs.length < 1) {
        return false;
    }
    seatData.chiArray = frs;
    seatData.canChi = true;
    return true;
}

function checkCanPeng(seatData, pai) {
    var count = seatData.countMap[pai];
    if (count != null && count >= 2) {
        seatData.canPeng = true;
    }
}
//检查是否可以暗杠
function checkCanAnGang(game, seatData) {
    //如果没有牌了，则不能再杠
    if (game.mahjongs.length <= game.currentIndex) {
        return;
    }
    for (var key in seatData.countMap) {
        var pai = parseInt(key);
        var c = seatData.countMap[key];
        if (c != null && c == 4 && game.singles.indexOf(pai) == -1) {
            seatData.canGang = true;
            if (seatData.gangPai.indexOf(pai) == -1) {
                seatData.gangPai.push(pai);
            }
        }
    }
}
// 是否可以和牌
function checkCanHu(game, seatData, targetPai, ctx) {
    //console.log('检查是否可以胡牌,');
    ctx = ctx || {};
    seatData.canHu = false;
    if (!seatData.hasKaiKou) {
        seatData.allTings = {};
        return;
    }

    function _minFan() {
        if (ctx.needHard) {
            var cd_fan = game.gameSeats[game.turn].sCtx.fan;
            var m_fan = cd_fan + seatData.sCtx.fan;
            return m_fan;
        } else {
            var max_fan = 0;
            game.gameSeats.map(function(td) {
                if (td.userId != seatData.userId) {
                    if (td.sCtx.fan && td.sCtx.fan > max_fan) {
                        max_fan = td.sCtx.fan;
                    }
                }
            });
            var m_fan = max_fan + seatData.sCtx.fan;
            return m_fan;
        }
    }
    if (_minFan() < game.minFan) {
        //番数小于6不做胡牌判断
        return;
    }
    for (var k in seatData.allTings) {
        if (targetPai == parseInt(k)) {
            var temp_dict = seatData.allTings[k];
            var laiziMax = 1;
            var isGangKai = seatData.preOpIsGang;
            var isNeedQiangGang = ctx.type == null ? false : (ctx.type == "needQiangGang" ? true : false);
            var isQuanQiuRen = seatData.holds.length == 2;
            var isBigHu = !!temp_dict.isPengpengHu || !!temp_dict.isJiangYiSe || !!temp_dict.isFengYiSe || !!temp_dict.isQingYiSe || isQuanQiuRen;
            var isHaiLao = (ALLMJCOUNT - 7) == game.currentIndex;
            var otherFlag = isHaiLao || isGangKai || isNeedQiangGang;
            if (!!seatData.preOpIsGang || isBigHu || otherFlag) {
                laiziMax = 4;
            }
            var usedLaizi_s = temp_dict.laizi_usedNum;
            var L2JCount = temp_dict.L2JCount;
            var need258Flag = laiziMax == 1 || (laiziMax == 4 && !isBigHu);
            if (temp_dict.isHard) {
                if (need258Flag) {
                    var is_258 = temp_dict.is_258;
                    if (is_258) {
                        seatData.canHu = usedLaizi_s <= laiziMax;
                    } else if (laiziMax == 4) {
                        //也有可能是两个赖子做将
                        seatData.canHu = L2JCount == 2;
                    }
                } else {
                    seatData.canHu = true;
                }
                break;
            } else {
                if (!!ctx.needHard) {
                    continue;
                }
                if (need258Flag) {
                    var is_258 = temp_dict.is_258;
                    seatData.canHu = is_258;
                    if (is_258) {
                        seatData.canHu = usedLaizi_s <= laiziMax;
                    } else if (laiziMax == 4) {
                        //也有可能是两个赖子做将
                        seatData.canHu = L2JCount == 2;
                    }
                } else {
                    seatData.canHu = true;
                }
                break;
            }
        }
    }
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
        if (seatData.canChi) {
            chiArrayInfo = seatData.chiArray;
            console.log("ly:chiArrayInfo:", chiArrayInfo);
        }
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
        _timerStart(game);
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
            return;
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
    if (numOfMJ <= 5) {
        game.isLiuJu = true;
        doGameOver(game, turnSeat.userId);
        return;
    } else {
        userMgr.broacastInRoom('mj_count_push', numOfMJ, turnSeat.userId, true);
    }
    recordGameAction(game, game.turn, ACTION_MOPAI, pai);
    //通知前端新摸的牌
    userMgr.sendMsg(turnSeat.userId, 'game_mopai_push', pai);
    // userMgr.sendMsg(turnSeat.userId, 'game_mopaiDone_push', turnSeat);
    var tipsData = {
        sd: turnSeat,
        tip: _subCountMapInGame(game, turnSeat)
    };
    _userSend("game_refreshTips_push", tipsData, turnSeat.userId);
    turnSeat.lastPai = pai;
    //检查是否可以暗杠或者胡
    //检查胡，直杠，弯杠
    checkCanAnGang(game, turnSeat);
    //检查看是否可以和
    checkCanHu(game, turnSeat, pai);
    //广播通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', turnSeat.userId, turnSeat.userId, true);
    _updateLastPai(turnSeat);
    //通知玩家做对应操作
    sendOperations(game, turnSeat, game.chuPai);
}
// 计算番数
function getFans(game, seatData) {
    var isBigHu = false;
    var huedDict = seatData.currentHuedDict;
    var isPengpengHu = !!huedDict.isPengpengHu;
    var isQingYiSe = !!huedDict.isQingYiSe;
    var isFengYiSe = !!huedDict.isFengYiSe;
    isQingYiSe = isQingYiSe || isFengYiSe;
    var isJiangYiSe = !!huedDict.isJiangYiSe;
    var isHard = huedDict.isHard;
    var isHaiLao = (ALLMJCOUNT - 7) == game.currentIndex;
    var isQuanQiuRen = false;
    var isQiangGangHu = !!seatData.isQiangGangHu;
    var isGangHua = !!seatData.isGangHua;
    var isZimo = seatData.isZimo;
    var fpSD = null;
    var ctx = seatData.sCtx;
    var cMap = ctx.fanCountMap;
    var bigCount = 0;
    if (seatData.seatIndex != game.turn && !isZimo && !isQiangGangHu) {
        //抢杠不属于放炮
        fpSD = game.gameSeats[game.turn];
        isQuanQiuRen = huedDict.hu.length == 2;
    }
    if (isHard) {
        cMap["hardHu"] = 1;
    }
    // huTypes: [], //玩家胡牌的方式 -1非法;0屁胡;1是抢杠;2是杠开;3是清一色;4是风一色;5是将一色;6是碰碰胡;7是海底捞月;8是全求人
    if (isQiangGangHu) {
        bigCount++;
        isBigHu = true;
        cMap["qiangGang"] = 1;
        ctx.huTypes.push(1);
    }
    if (isGangHua) {
        bigCount++;
        isBigHu = true;
        cMap["gangKai"] = 1;
        ctx.huTypes.push(2);
    }
    if (isHaiLao) {
        bigCount++;
        isBigHu = true;
        cMap["haiDiLaoYue"] = 1;
        ctx.huTypes.push(7);
    }
    if (isQuanQiuRen) {
        bigCount++;
        isBigHu = true;
        cMap["quanQiuRen"] = 1;
        if (!isZimo && fpSD) {
            fpSD.sCtx.fanCountMap["quanQiuRen_fangPao"] = 1;
            //判断玩家是否需要包牌.
            var fp_tinFlag = mjutils.checkIsTingd(fpSD);
            var fp_is258Flag = mjutils.is_258_holds(fpSD, game.laizi);
            console.log("ly:fp_tinFlag:", fp_tinFlag, fp_is258Flag);
            fpSD.needBaoPai = !(fp_tinFlag || fp_is258Flag);
        }
        ctx.isQuanQiuRen = true;
        ctx.huTypes.push(8);
    }
    if (isPengpengHu) {
        bigCount++;
        isBigHu = true;
        cMap["pengPengHu"] = 1;
        if (!isZimo && fpSD) {
            fpSD.sCtx.fanCountMap["pengPeng_fangPao"] = 1;
        } else {
            cMap["pengPeng_zimo"] = 1;
        }
        ctx.huTypes.push(6);
    }
    if (isQingYiSe || isFengYiSe || isJiangYiSe) {
        isBigHu = true;
        if (!isZimo && fpSD) {
            fpSD.sCtx.fanCountMap["yiSe_fangPao"] = 1;
        } else {
            cMap["yiSe_zimo"] = 1;
        }
    }
    if (isQingYiSe) {
        bigCount++;
        cMap["qingYiSe"] = 1;
        ctx.huTypes.push(3);
    }
    if (isFengYiSe) {
        bigCount++;
        cMap["fengYiSe"] = 1;
        ctx.huTypes.push(4);
    }
    if (isJiangYiSe) {
        bigCount++;
        cMap["jiangYiSe"] = 1;
        ctx.huTypes.push(5);
    }
    ctx.isBigHu = isBigHu;
    ctx.baseFen = 10 * bigCount;
    if (!isBigHu) {
        ctx.baseFen = 1;
        cMap["piHu"] = 1;
        if (!isZimo && fpSD) {
            fpSD.sCtx.fanCountMap["piHu_fangPao"] = 1;
        } else {
            cMap["piHu_ziMo"] = 1;
        }
        ctx.huTypes.push(0);
    }
    _get_singleEvery_fan(game, seatData);
    return seatData.fan;
}

function _get_singleEvery_fan(game, sd) {
    var sd_dict = sd.sCtx.fanCountMap;
    var game_dict = game.gCtx.fansDesc;
    var total = 0;
    for (var key in sd_dict) {
        var count = sd_dict[key];
        var baseFan = game_dict[key];
        total += count * baseFan;
    }
    sd.sCtx.fan = total;
}

function _set_sCtx(sd, huDict) {
    if (sd == null) {
        return;
    }
    var ctx = sd.sCtx;
    for (var key in huDict) {
        if (key != "fan" && key != "desc") {
            ctx.key = huDict.key;
        } else {
            ctx.key += huDict.key;
        }
    }
}

function _fan_added(sd, num) {
    sd.sCtx.fan += num;
    var game = _gameByUserid(sd.userId);
    var data = {
        userId: sd.userId,
        fan: sd.sCtx.fan
    }
    _broacast(game, "game_fanChanged_push", data);
}
// 计算赢家得分,并计算出其他玩家失去的分数
function calcAllScore(game, seatData) {
    _get_singleEvery_fan(game, seatData);
    var totalFans = 0;
    var winFans = seatData.sCtx.fan;
    var baseFen = seatData.sCtx.baseFen;
    var noKaiKou_s = [];
    var fengDing_s = [];
    var bpSD = null;
    game.gameSeats.map(function(td) {
        if (!td.hued) {
            _get_singleEvery_fan(game, td);
            var losedFan = winFans + td.sCtx.fan;
            totalFans += td.sCtx.fan;
            if (!td.hasKaiKou) {
                noKaiKou_s.push(td);
                losedFan += 1;
                td.sCtx.fan += 1;
            }
            if (game.laizi > 26) {
                losedFan += 1;
                td.sCtx.fan += 1;
            }
            var tdScoreFanShu = 1;
            for (var ti = 0; ti < losedFan; ti++) {
                tdScoreFanShu *= 2;
            }
            td.sCtx.losedScore = tdScoreFanShu * baseFen;
            if (td.sCtx.losedScore >= 1024) {
                td.sCtx.isFengDing = true;
                losedFan = 10;
                fengDing_s.push(td);
                td.sCtx.losedScore = 1024;
            }
            td.sCtx.losedFan = losedFan;
            if (td.needBaoPai) {
                bpSD = td;
            }
        }
    });
    var guangMingDing_s = [];
    if (fengDing_s.length == 3) {
        fengDing_s.map(function(fd) {
            fd.sCtx.losedScore = 1500;
            fd.sCtx.isJinDing = true;
            if (!fd.hasKaiKou) {
                fd.sCtx.losedScore = 3000;
                fd.sCtx.isGuangMingDing = true;
                guangMingDing_s.push(fd);
            }
        });
    }
    if (guangMingDing_s.length == 3) {
        guangMingDing_s.map(function(gd) {
            gd.sCtx.losedScore = 6000;
            gd.sCtx.isSanYangKaiTai = true;
        });
    }
    var allScore = 0;
    game.gameSeats.map(function(td) {
        if (!td.hued) {
            allScore += td.sCtx.losedScore;
            if (bpSD && td.userId != bpSD.userId) {
                bpSD.sCtx.losedScore += td.sCtx.losedScore;
                td.sCtx.losedScore = 0;
            }
        }
    });
    if (bpSD) {
        bpSD.isBaoPai = true;
    }
    var winScore = 0;
    game.gameSeats.map(function(td) {
        if (!td.hued) {
            winScore += td.sCtx.losedScore;
            td.score = td.sCtx.losedScore * (-1);
            console.log("ly:td.losedScore:", td.sCtx.losedScore);
        }
    });
    console.log("ly:baseFen:", baseFen);
    console.log("ly:winScore:", winScore);
    seatData.sCtx.winScore = winScore;
    seatData.score = winScore;
    return winScore;
}
// 计算分数
function calculateResult(game, roomInfo) {
    var numOfHued = 0;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        var sd = game.gameSeats[i];
        //对所有胡牌的玩家进行统计
        if (sd.hued) {
            var fan = getFans(game, sd);
            var totalScores = calcAllScore(game, sd);
            break;
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
        roomInfo.pre_laizi = game.laizi;
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
            var userRT = sd;
            userRT['totalscore'] = rs.score;
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
    switch (action) {
        case ACTION_CHUPAI:
            _game_tipCountMap_sub1(game, pai);
            break;
        case ACTION_CHI:
            var chiArray = pai.chiArray;
            var pk = pai.pai;
            chiArray.map(function(tpai) {
                if (tpai != pk) {
                    _game_tipCountMap_sub1(game, tpai);
                }
            });
            break;
        case ACTION_PENG:
            _game_tipCountMap_sub1(game, pai);
            _game_tipCountMap_sub1(game, pai);
            break;
        case ACTION_NotAn_GANG:
            _game_tipCountMap_sub1(game, pai);
            _game_tipCountMap_sub1(game, pai);
            _game_tipCountMap_sub1(game, pai);
            break;
        case ACTION_S_GANG:
            _game_tipCountMap_sub1(game, pai);
            break;
    }
    if (pai != null) {
        game.actionList.push(pai);
    }
}

function _game_tipCountMap_sub1(game, pai) {
    var count = game.tipCountMap[pai];
    if (count == 0) {
        return;
    }
    game.tipCountMap[pai]--;
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
                diangangs: sd.diangangs,
                wangangs: sd.wangangs,
                pengs: sd.pengs,
                extraPais: sd.extraPais,
                chis: sd.chis,
                que: sd.que,
                hued: sd.hued,
                iszimo: sd.iszimo,
                fan: sd.sCtx.fan,
                singleGangs: sd.singleGangs
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
        userMgr.sendMsg(userId, 'game_config_push', {
            laizi: game.laizi,
            sgArr: game.singles,
            gCtx: game.gCtx
        });
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
function startPlaying(game) {
    console.log("开始出牌");
    //检查玩家可以做的动作
    //如果4个人都定缺了，通知庄家出牌
    var turnSeat = game.gameSeats[game.turn];
    construct_game_base_info(game);
    userMgr.broacastInRoom('game_playing_push', null, turnSeat.userId, true);
    game.state = "playing";
    //通知玩家出牌方
    turnSeat.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', turnSeat.userId, turnSeat.userId, true);
    //检查是否可以暗杠或者胡
    //直杠
    checkCanAnGang(game, turnSeat);
    _updateLastPai(turnSeat);
    //检查胡 用最后一张来检查
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
        timerCounter: 10,
        minFan: GLOBAL_Min_Fan,
        singles: [], //需要单杠牌
        tipCountMap: {},
        gCtx: {
            fan: 0,
            isLianLai: false,
            fansDesc: {
                "zhuang": 1,
                "laizi_single_gang": 2,
                "pizi_single_gang": 1,
                "lian_laiZi": 1,
                "hongZhong_single_gang": 1,
                "peng": 1,
                "ming_gang": 1,
                "an_gang": 2,
                "chi": 1,
                "qingYiSe": 0,
                "fengYiSe": 0,
                "jiangYiSe": 0,
                "yiSe_zimo": 0,
                "yiSe_fangPao": 0,
                "pengPengHu": 0,
                "pengPeng_zimo": 0,
                "pengPeng_fangPao": 0,
                "gangKai": 0,
                "qiangGang": 0,
                "quanQiuRen": 0,
                "quanQiuRen_fangPao": 0,
                "haiDiLaoYue": 0,
                "piHu": 0,
                "piHu_fangPao": 0,
                "piHu_ziMo": 0,
                "hardHu": 0,
                "hasKaiKou": 0
            }
        } //此处存放公共的番数;eg:如果连续2局都是同一张赖子,所有玩家翻番
    };
    roomInfo.numOfGames++;
    for (var i = 0; i < 4; ++i) {
        var data = game.gameSeats[i] = {};
        data.roomid = roomId;
        data.seatIndex = i;
        data.userId = seats[i].userId;
        data.hasKaiKou = false;
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
        data.chis = []; //这是个二维数组,用于前端显示
        data.chiedPais = []; //吃过的牌,用来快速判断是否是清一色
        data.singleGangs = [];
        //换三张的牌
        data.huanpais = null;
        //玩家手上的牌的数目，用于快速判定碰杠
        data.countMap = {};
        //玩家听牌，用于快速判定胡了的番数
        data.allTings = {};
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
        //是否是自
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
        data.currentHuedDict = []; //当前胡牌的方案
        data.sCtx = {
            fan: game.gCtx.fan, //玩家的番数
            desc: "", //弃用
            losedScore: 0, //输的分数
            winScore: 0, //赢的分数
            scoreScale: 0, //所有输家中所占的比例
            huTypes: [], //弃用//玩家胡牌的方式 -1非法;0屁胡;1是抢杠;2是杠开;3是清一色;4是风一色;5是将一色;6是碰碰胡;7是海底捞月0
            fanCountMap: {
                "zhuang": 0,
                "laizi_single_gang": 0,
                "pizi_single_gang": 0,
                "lian_laiZi": 0,
                "hongZhong_single_gang": 0,
                "peng": 0,
                "ming_gang": 0,
                "an_gang": 0,
                "chi": 0,
                "qingYiSe": 0,
                "fengYiSe": 0,
                "jiangYiSe": 0,
                "yiSe_zimo": 0,
                "yiSe_fangPao": 0,
                "pengPengHu": 0,
                "pengPeng_zimo": 0,
                "pengPeng_fangPao": 0,
                "gangKai": 0,
                "qiangGang": 0,
                "quanQiuRen": 0,
                "quanQiuRen_fangPao": 0,
                "haiDiLaoYue": 0,
                "piHu": 0,
                "piHu_fangPao": 0,
                "piHu_ziMo": 0,
                "hardHu": 0,
                "hasKaiKou": 0
            }
        };
        gameSeatsOfUsers[data.userId] = data;
    }
    games[roomId] = game;
    //洗牌
    gameutils.shuffle(game);
    //发牌
    gameutils.deal(game);
    if (roomInfo.pre_laizi != null) {
        if (roomInfo.pre_laizi === game.laizi) {
            game.gCtx.fan = 1;
            game.gameSeats.map(function(dd) {
                dd.sCtx.fanCountMap["lian_laiZi"] = 1;
                _fan_added(dd, 1);
            });
        }
    }
    var zhuangSD = game.gameSeats[game.button];
    _fan_added(zhuangSD, 1);
    zhuangSD.sCtx.fanCountMap["zhuang"] = 1;
    var numOfMJ = game.mahjongs.length - game.currentIndex;
    game.singles = [game.laizi, game.pre_pizi, game.sub_pizi, 31];
    for (var i = 0; i < seats.length; ++i) {
        //开局时，通知前端必要的数据
        var s = seats[i];
        userMgr.sendMsg(s.userId, 'game_config_push', {
            laizi: game.laizi,
            sgArr: game.singles,
            gCtx: game.gCtx
        });
        //通知玩家手牌
        userMgr.sendMsg(s.userId, 'game_holds_push', game.gameSeats[i].holds);
        //通知还剩多少张牌
        userMgr.sendMsg(s.userId, 'mj_count_push', numOfMJ);
        //通知还剩多少局
        userMgr.sendMsg(s.userId, 'game_num_push', roomInfo.numOfGames);
        //通知游戏开始
        userMgr.sendMsg(s.userId, 'game_begin_push', game.button);
    }
    // 游戏开始
    startPlaying(game);
};

function _gameByUserid(userid) {
    //game不存在返回null
    var sd = _userByUserid(userid);
    if (!sd) {
        return null;
    }
    var game = games[sd.roomid];
    if (game) {
        return game;
    }
    var roomid = roomMgr.getUserRoom(userid);
    if (!roomid) {
        return null;
    }
    game = games[roomid];
    if (!game) {
        return null;
    }
    return game;
}
exports.chuPai = function(userId, pai) {
    var game = _gameByUserid(userId);
    if (game == null) {
        return;
    }
    pai = parseInt(pai);
    var _singles = game.singles;
    if (_singles.indexOf(pai) != -1) {
        singleGang(userId, pai);
        return;
    }
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }
    if (seatData.canChuPai == false) {
        console.log('no need chupai.');
        return;
    }
    if (hasOperations(seatData)) {
        console.log('please guo before you chupai.');
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
    _hasPiziHongZhong(game, seatData);
    console.log("ly:allowTingFlag:", seatData.allowTingFlag);
    var chupaiDone = {
        sd: seatData,
        laizi: game.laizi
    };
    _userSend("game_refreshAllTings_push", chupaiDone, seatData.userId);
    userMgr.broacastInRoom('game_chupai_notify_push', {
        userId: seatData.userId,
        pai: pai,
    }, seatData.userId, true);
    //检查是否有人要胡，要碰 要杠
    var hasActions = false;
    for (var i = 0; i < game.gameSeats.length; ++i) {
        //玩家自己不检查
        if (game.turn == i) {
            continue;
        }
        var ddd = game.gameSeats[i];
        checkCanDianGang(game, ddd, pai);
        // 不能杠牌再判断是否能碰
        checkCanPeng(ddd, pai);
        checkCanChi(game, ddd, pai);
        checkCanHu(game, ddd, pai, {
            needHard: true
        });
        if (hasOperations(ddd)) {
            sendOperations(game, ddd, game.chuPai);
            hasActions = true;
        }
    }
    console.log("ly:出牌结束");
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

function singleGang(userId, pai) {
    pai = parseInt(pai);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = _gameByUserid(userId);
    var seatIndex = seatData.seatIndex;
    //如果不该他出，则忽略
    if (game.turn != seatData.seatIndex) {
        console.log("not your turn.");
        return;
    }
    if (hasOperations(seatData)) {
        console.log('please guo before you chupai.');
        return;
    }
    //从此人牌中扣除
    var index = seatData.holds.indexOf(pai);
    if (index == -1) {
        console.log("holds:" + seatData.holds);
        console.log("can't find mj." + pai);
        return;
    }
    //算开口
    _sd_hasKaiKou(seatData);
    if (pai == game.laizi) {
        // seatData.sCtx.fan += 2;
        _fan_added(seatData, 2);
        seatData.sCtx.fanCountMap["laizi_single_gang"]++;
    } else {
        // seatData.sCtx.fan += 1;
        _fan_added(seatData, 1);
        if (pai == 31) {
            seatData.sCtx.fanCountMap["hongZhong_single_gang"]++;
        } else {
            seatData.sCtx.fanCountMap["pizi_single_gang"]++;
        }
    }
    seatData.holds.splice(index, 1);
    seatData.countMap[pai]--;
    recordGameAction(game, seatData.seatIndex, ACTION_S_GANG, pai);
    seatData.singleGangs.push(pai);
    var chupaiDone = {
        sd: seatData,
        laizi: game.laizi
    };
    _userSend("game_refreshAllTings_push", chupaiDone, seatData.userId);
    userMgr.broacastInRoom('game_single_gang_push', {
        sd: seatData,
        pai: pai
    }, seatData.userId, true);
    _deferredExcute(0.2, function() {
        doUserMoPai(game);
    });
}

function _sd_hasKaiKou(sd) {
    if (!sd.hasKaiKou) {
        sd.sCtx.fanCountMap["hasKaiKou"] = 1;
        sd.hasKaiKou = true;
    }
}

function _userByUserid(userid) {
    return gameSeatsOfUsers[userid];
}

function _setAllTings(userid, data) {
    var sd = _userByUserid(userid);
    if (sd == null) {
        return;
    }
    sd.allTings = {};
    if (data == null) {
        return;
    }
    //这里传过来后变成了字符串，需要解析成json，原因尚不明确
    data = JSON.parse(data);
    sd.allTings = data;
}
exports.setAllTings = _setAllTings;

function _hasPiziHongZhong(game, seatData) {
    seatData.allowTingFlag = false;
    var others = [game.pre_pizi, game.sub_pizi, 31];
    var sFlag = others.some(function(ele) {
        var count = seatData.countMap[ele];
        if (count != null && count >= 1) {
            return true;
        }
        return false;
    });
    if (!sFlag && !!seatData.hasKaiKou) {
        seatData.allowTingFlag = true;
        return true;
    }
    seatData.allowTingFlag = false;
    seatData.allTings = {};
    return false;
}
// 碰牌
var pengFunc = function(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = _gameByUserid(userId);
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
    // seatData.sCtx.fan += 1;
    _fan_added(seatData, 1);
    seatData.sCtx.fanCountMap["peng"]++;
    _sd_hasKaiKou(seatData);
    recordGameAction(game, seatData.seatIndex, ACTION_PENG, pai);
    var chupaiDone = {
        sd: seatData,
        laizi: game.laizi
    };
    _userSend("game_refreshAllTings_push", chupaiDone, seatData.userId);
    //广播通知其它玩家
    userMgr.broacastInRoom('peng_notify_push', {
        userid: seatData.userId,
        pai: pai,
        extraPengPai: []
    }, seatData.userId, true);
    var tipsData = {
        sd: seatData,
        tip: _subCountMapInGame(game, seatData)
    };
    _userSend("game_refreshTips_push", tipsData, seatData.userId);
    // 标注为听牌
    //碰的玩家打牌
    moveToNextUser(game, seatData.seatIndex);
    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', seatData.userId, seatData.userId, true);
    _updateLastPai(seatData, true);
};
exports.peng = pengFunc;

function _subCountMapInGame(game, sd) {
    var gDict = game.tipCountMap;
    var sDict = sd.countMap;
    var result = {};
    for (var key in gDict) {
        result[key] = gDict[key];
    }
    // console.log("*ly:tipMapCount111=>", gDict);
    // console.log("*ly:tipMapCount222=>", sDict);
    for (var key in sDict) {
        result[key] = gDict[key] - sDict[key];
        if (sd.angangs.indexOf(key) > -1) {
            result[key] = 0;
        }
    }
    // console.log("*ly:tipMapCount333=>", result);
    // console.log("*ly:tipMapCount=>", gDict, sDict, result);
    return result;
}
// 吃牌
var chiFunc = function(userId, pai, chiArray) {
    //暂时不做吃
    console.log("吃牌操作", userId, chiArray);
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var game = _gameByUserid(userId);
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
    // seatData.sCtx.fan += 1;
    _fan_added(seatData, 1);
    seatData.sCtx.fanCountMap["chi"]++;
    _sd_hasKaiKou(seatData);
    // 吃牌的记录放在后面。因为不仅要记录吃的牌，还要记录吃牌的数组
    // recordGameAction(game, seatData.seatIndex, ACTION_CHI, pai);
    game.chuPai = -1;
    //广播通知其它玩家
    userMgr.broacastInRoom('chi_notify_push', {
        userid: seatData.userId,
        pai: pai,
        extraChiPai: [],
        chiArray: chiArray
    }, seatData.userId, true);
    chiArray.push(pai);
    //此处记录玩家吃牌的操作,注意，此处记录的是吃牌的对象。不是单张牌。解析的时候要判断类型
    var pd = {
        "pai": pai,
        "chiArray": chiArray
    };
    recordGameAction(game, seatData.seatIndex, ACTION_CHI, pd);
    var chupaiDone = {
        sd: seatData,
        laizi: game.laizi
    };
    _userSend("game_refreshAllTings_push", chupaiDone, seatData.userId);
    var tipsData = {
        sd: seatData,
        tip: _subCountMapInGame(game, seatData)
    };
    _userSend("game_refreshTips_push", tipsData, seatData.userId);
    chiArray.sort(function(a, b) {
        return a - b;
    });
    seatData.chis.push(chiArray);
    seatData.chiedPais.push(pai);
    clearAllOptions(game);
    //吃的玩家打牌
    moveToNextUser(game, seatData.seatIndex);
    //广播通知玩家出牌方
    seatData.canChuPai = true;
    userMgr.broacastInRoom('game_chupai_push', seatData.userId, seatData.userId, true);
    _updateLastPai(seatData, true);
};
exports.chi = chiFunc;
exports.isPlaying = function(userId) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        return false;
    }
    var game = _gameByUserid(userId);
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
        checkCanHu(game, ddd, pai, {
            needHard: true,
            type: "needQiangGang"
        });
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
    seatData.preOpIsGang = true;
    recordGameAction(game, seatData.seatIndex, ACTION_GANG, pai);
    //记录下玩家的杠牌
    if (gangtype == "angang") {
        seatData.angangs.push(pai);
        var ac = recordUserAction(game, seatData, "angang");
        ac.score = game.conf.baseScore * 2;
        // seatData.sCtx.fan += 2;
        _fan_added(seatData, 2);
        seatData.sCtx.fanCountMap["an_gang"]++;
    } else if (gangtype == "diangang") {
        //已经开口
        _sd_hasKaiKou(seatData);
        seatData.diangangs.push(pai);
        var ac = recordUserAction(game, seatData, "diangang", gameTurn);
        ac.score = game.conf.baseScore * 2;
        var fs = turnSeat;
        recordUserAction(game, fs, "fanggang", seatIndex);
        // seatData.sCtx.fan += 1;
        _fan_added(seatData, 1);
        seatData.sCtx.fanCountMap["ming_gang"]++;
    }
    if (gangtype != "angang") {
        recordGameAction(game, seatData.seatIndex, ACTION_NotAn_GANG, pai);
    }
    //通知其他玩家，有人杠了牌
    userMgr.broacastInRoom('gang_notify_push', {
        userid: seatData.userId,
        pai: pai,
        gangtype: gangtype,
        extraPai: []
    }, seatData.userId, true);
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
    var game = _gameByUserid(userId);
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
    var game = _gameByUserid(userId);
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
    var hupai_key = game.chuPai;
    if (game.chuPai == -1) {
        hupai_key = seatData.holds[seatData.holds.length - 1];
    }
    seatData.currentHuedDict = seatData.allTings[hupai_key];
    console.log("ly:huFunc:currentHuedDict:", seatData.currentHuedDict);
    console.log("ly:huFunc:allTings:", seatData.allTings);
    if (!seatData.currentHuedDict) {
        return;
    }
    //标记为和牌
    seatData.hued = true;
    mjutils.bigHuType(game, seatData);
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
        if (turnSeat.lastFangGangSeat == seatIndex) {
            var ac = recordUserAction(game, seatData, "ganghua");
            seatData.isGangHua = true;
        } else {
            var ac = recordUserAction(game, seatData, "zimo");
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
    }
    if (game.firstHupai < 0) {
        game.firstHupai = seatIndex;
    }
    //记录胡哪张牌
    seatData.hupai = notify;
    //保存番数
    seatData.pattern = "";
    seatData.iszimo = isZimo;
    if (isZimo) {
        seatData.numZiMo++;
    } else {
        seatData.numJiePao++;
    }
    //如果是最后一张牌，则认为是海底胡
    // 莫到最后一张牌胡牌
    seatData.isHaiDiHu = game.currentIndex == game.mahjongs.length - 5;
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
    seatData.preOpIsGang = false;
};
var guoFunc = function(userId, guoType) {
    var seatData = gameSeatsOfUsers[userId];
    if (seatData == null) {
        console.log("can't find user game data.");
        return;
    }
    var seatIndex = seatData.seatIndex;
    var game = _gameByUserid(userId);
    //如果玩家没有对应的操作，则也认为是非法消息
    if ((seatData.canGang || seatData.canPeng || seatData.canHu || seatData.canChi) == false) {
        console.log("no need guo.", userId);
        return;
    }
    //如果是玩家自己的轮子，不是接牌，则不需要额外操作
    var doNothing = game.chuPai == -1 && game.turn == seatIndex;
    userMgr.sendMsg(seatData.userId, "guo_result");
    clearAllOptions(game, seatData);
    //这里还要处理过胡的情况
    if (game.chuPai >= 0 && seatData.canHu) {}
    if (doNothing) {
        //并且出掉自己手中的牌
        if (seatData.canChuPai) {
            exports.chuPai(seatData.userId, seatData.lastPai);
            return;
        }
        return;
    }
    if (guoType == 1) {
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
    console.log("ly:opWaitingFunc:1111:");
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
    return;
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
// setInterval(update, 1000);
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}

function _deferredExcute(second, callback) {
    //延时操作
    callback = callback ? callback : function() {
        console.log("deferred but no callback");
    };
    second = second ? second : 1;
    var tt = setTimeout(function() {
        clearTimeout(tt);
        callback();
    }, second * 1000);
}
//从game中获取有效的user_id 如果没有 返回 null
function _userFromGame(game) {
    if (!game) {
        console.log("game null");
        return null;
    }
    for (var i = 0; i < game.gameSeats.length; i++) {
        var dd = game.gameSeats[i];
        if (dd) {
            var roomId = roomMgr.getUserRoom(dd.userId);
            if (roomId) {
                return dd.userId;
            }
        }
    }
    return null;
}
//消息发送
//string 消息字符串
//data 包含的数据
//flag 是否包含自己,只有当第3个参数有效,该参数才是有效的
function _broacast(game, string, data, userid, flag) {
    var roomId = null;
    if (userid) {
        roomId = roomMgr.getUserRoom(userid);
    }
    if (!roomId) {
        //如果可以依据当前的userid 找到roomId
        //则视为userid 有效,否则视为无效
        //此时roomId非法=>userid非法,flag强制为true
        userid = _userFromGame(game);
        flag = true;
    }
    if (userid == null) {
        //找不到有效的信息return;
        //表示该房间没有活着的用户,无需再广播消息
        console.log("没有活着的用户");
        return;
    }
    console.log(string);
    userMgr.broacastInRoom(string, data, userid, flag);
}

function _userSend(eventStr, data, userid) {
    if (!userid) {
        return;
    }
    // console.log(eventStr);
    userMgr.sendMsg(userid, eventStr, data);
}

function _timerStart(game, type) {
    //为方便测试,定时器功能先return
    return;
    console.log("ly:_timer_Start");
    userMgr.broacastInRoom('game_timerBegin_push', game.turn, game.gameSeats[game.turn].userId, true);
    _timerDel(game);
    var counter = game.timerCounter;
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
            var tempFlag = ddd.canPeng || ddd.canGang || ddd.canChi;
            console.log("ly:tempFlag:${ddd.userId}:", ddd.userId, tempFlag);
            if (ddd.canPeng || ddd.canGang || ddd.canChi) {
                if (ddd.waitGangFlag) {
                    gangFunc(ddd.userId, game.chuPai);
                } else if (ddd.waitPengFlag) {
                    pengFunc(ddd.userId);
                } else if (ddd.waitChiFlag) {
                    // var pai = ddd.waitChiData.pai;
                    // var chiArray = ddd.waitChiData.chiArray;
                    // chiFunc(ddd.userId, pai, chiArray);
                } else {
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

function _updateLastPai(sd, needTimer) {
    var game = _gameByUserid(sd.userId);
    if (!game) {
        console.log('BAD_ERROR:2283');
        return;
    }
    var singles = game.singles;
    if (!sd.lastPai || singles.indexOf(sd.lastPai) != -1) {
        var tempHolds = [];
        var f_holds = sd.holds.slice(0);
        f_holds.forEach(function(pai) {
            if (singles.indexOf(pai) == -1) {
                tempHolds.push(pai);
            }
        });
        //降序排序
        tempHolds.sort(function(a, b) {
            return b - a;
        });
        sd.lastPai = tempHolds[0];
    }
    console.log('ly:sd.lastPai:', sd.lastPai);
    if (needTimer) {
        _timerStart(game);
    }
}