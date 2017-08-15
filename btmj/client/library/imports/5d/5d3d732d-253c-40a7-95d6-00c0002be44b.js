"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        lblRoomNo: {
            default: null,
            type: cc.Label
        },
        _seats: [],
        _timeLabel: null,
        _voiceMsgQueue: [],
        _lastPlayingSeat: null,
        _playingSeat: null,
        _lastPlayTime: null,
        _shareContent: null,
        paigroup: {
            default: null,
            type: cc.SpriteAtlas
        },
        back: cc.Node,
        fanhui: cc.Node,
        bg: cc.Node,
        backAlert: cc.Node,
        backAlert_no: cc.Node,
        fan: cc.Node,
        jinbi: cc.Node,
        countdown: cc.Label
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        for (var i = 0; i < 5; i++) {
            this._seats.push(cc.find("Canvas/seat" + i).getComponent("dnSeat"));
        }
        this._timeLabel = cc.find("Canvas/time").getComponent(cc.Label);
        this._tips = cc.find("Canvas/tips").getComponent(cc.Label);
        this._difen = cc.find("Canvas/difen").getComponent(cc.Label);
        this._qiangZhuTips = cc.find("Canvas/text1").getComponent(cc.Label);
        this._xiaBeiTips = cc.find("Canvas/text3").getComponent(cc.Label);
        this._lastResult = cc.find("Canvas/lastResult");
        this.addComponent("ReConnect");
        cc.vv.utils.addClickEvent(this.back, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fanhui, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.fan, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.bg, this.node, "dnAll", "onBtnClicked");
        cc.vv.utils.addClickEvent(this.backAlert_no, this.node, "dnAll", "onBtnClicked");
        this.initView();
        this.initSeats();
        this.initEventHandlers();
        cc.vv.net.send("ready");
        cc.vv.audioMgr.playBGM("back.mp3");
        this.qiangZhuLevel = [0, 1, 2, 3, 4]; //抢注的档次
        this.jinbi_node_arr = [];
    },
    initView: function initView() {
        this._tips.node.active = true;
        this._lastResult.active = false;
    },
    initSeats: function initSeats() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i = 0; i < seats.length; ++i) {
            this.initSingleSeat(seats[i]);
        }
    },
    initSingleSeat: function initSingleSeat(seat) {
        var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
        var isOffline = !seat.online;
        // var isZhuang = seat.seatindex == cc.vv.gameNetMgr.button;
        this._seats[index].setInfo(seat.name, seat.score);
        this._seats[index].setReady(seat.ready);
        this._seats[index].setOffline(isOffline);
        this._seats[index].setID(seat.userid);
        this._seats[index].voiceMsg(false);
    },
    onBtnSettingsClicked: function onBtnSettingsClicked() {
        cc.vv.popupMgr.showSettings();
    },
    // 点击分享按钮，使用微信分享
    onBtnWeichatClicked: function onBtnWeichatClicked() {
        cc.vv.share.show();
    },
    onBtnDissolveClicked: function onBtnDissolveClicked() {
        cc.vv.alert.show("解散房间", "解散房间不扣金币，是否确定解散？", function () {
            cc.vv.net.send("dispress");
        }, true);
    },
    onBtnClicked: function onBtnClicked(event) {
        if (event.target.name == "back") {
            this.fanhui.active = true;
        }
        if (event.target.name == "bg") {
            this.fanhui.active = false;
        }
        if (event.target.name == "fan") {
            this.fanhui.active = false;
            this.backAlert.active = true;
        }
        if (event.target.name == "no") {
            this.fanhui.active = false;
            this.backAlert.active = false;
        }
    },
    onBtnExit: function onBtnExit() {
        this.backAlert.active = false;
        cc.vv.net.send("exit");
    },
    onBtnExchange: function onBtnExchange() {
        this.backAlert.active = false;
        this.fanhui.active = false;
        cc.vv.userMgr.exchange = 1;
        cc.vv.net.send("exit");
    },
    playVoice: function playVoice() {
        if (this._playingSeat == null && this._voiceMsgQueue.length) {
            console.log("playVoice");
            var data = this._voiceMsgQueue.shift();
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            this._playingSeat = localIndex;
            this._seats[localIndex].voiceMsg(true);
            var msgInfo = JSON.parse(data.content);
            var msgfile = "voicemsg.amr";
            this._lastPlayTime = Date.now() + msgInfo.time;
            if (!cc.sys.isNative) {
                var serverid = msgInfo['msg'];
                window.downloadVoice(serverid);
                return;
            }
            cc.vv.voiceMgr.writeVoice(msgfile, msgInfo.msg);
            cc.vv.voiceMgr.play(msgfile);
        }
    },
    initEventHandlers: function initEventHandlers() {
        cc.vv.gameNetMgr.dataEventHandler = this.node;
        var self = this;
        this.node.on('new_user', function (data) {
            //新人加入房间
            self.initSingleSeat(data.detail);
        });
        this.node.on('user_state_changed', function (data) {
            var seat = data.detail;
            var index = cc.vv.gameNetMgr.getLocalIndexZJH(seat.seatindex);
            self._seats[index].seatHide();
        });
        this.node.on('game_init', function (data) {
            var gameInfo = data.detail;
            if (!gameInfo) return;
            self.showDiFen(gameInfo.baseFen);
            self._tips.node.active = false;
            var seatDatas = {};
            if (gameInfo['players']) {
                for (var i in gameInfo['players']) {
                    var seatData = gameInfo['players'][i];
                    seatDatas[seatData['userid']] = seatData;
                }
            }

            self.refreshSeats(seatDatas);
        });
        this.node.on('not_exit', function (data) {
            cc.vv.userMgr.exchange = 0;
            cc.vv.alert.show('提示', '游戏进行中，无法退出房间');
        });
        this.node.on('game_begin', function (data) {
            self.countdown.node.active = false;
            var data = data.detail;
            //游戏开始
            console.log('游戏开始', data);
            var holds = data.holds;
            var maxQiangZhuangBeiShu = data.maxQiangZhuangBeiShu;
            console.log('holds===>', holds);
            self.showSelfPai(holds); //展示自己手上的四张手牌
            self.showQiangZhu(maxQiangZhuangBeiShu); //展示抢庄倍数
            self.showOtherSeat();
            self.showQiangZhuTips();
        });
        this.node.on('voice_msg', function (data) {
            var data = data.detail;
            self._voiceMsgQueue.push(data);
            self.playVoice();
        });
        this.node.on('chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].chat(data.content);
        });
        this.node.on('quick_chat_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            var index = data.content;
            var info = cc.vv.zjhchat.getQuickChatInfo(index);
            self._seats[localIdx].chat(info.content);
            cc.vv.audioMgr.playSFX(info.sound);
        });
        this.node.on('emoji_push', function (data) {
            var data = data.detail;
            var idx = cc.vv.gameNetMgr.getSeatIndexByID(data.sender);
            var localIdx = cc.vv.gameNetMgr.getLocalIndexZJH(idx);
            self._seats[localIdx].emoji(data.content);
        });
        this.node.on('show_qiang', function (data) {
            //有人抢庄
            var data = data.detail;
            var userId = data.userid;
            var beishu = data.beiShu;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var seat = self._seats[localIndex];
            seat.showQiangZhuText(beishu);
        });
        this.node.on('count_down', function (data) {
            if (self._tips.node.active) {
                self._tips.node.active = false;
            }
            var data = data.detail;
            self.countdown.string = data.countDown;
            self.countdown.node.active = true;
            if (data.countDown <= 0) {
                self.countdown.node.active = false;
            }
        });
        this.node.on('game_zhuangSelected', function (data) {
            //抢庄结束
            self.hideQiangZhuTips();
            self._seats[0].hideQiangZhu();
            //定庄
            var userId = data.detail;
            for (var i in self._seats) {
                var seat = self._seats[i];
                seat.hideQiangZhuText();
            }
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var localSeat = self._seats[localIndex];
            localSeat.showZhuang();
            //定完庄后，激活服务器
            cc.vv.net.send('zhuangEndFromClient');
        });
        this.node.on('game_myXzBegin', function (data) {
            //下注
            self.showXiaZhuTips(); //显示下注提示
            var data = data.detail;
            var seat = self._seats[0];
            seat.showXiaBei(data);
        });
        this.node.on('game_myXzEnd', function (data) {
            //下注结束
            self.hideXiaZhuTips();
            self._seats[0].hideXiaBei();
        });
        this.node.on('show_beiShuText', function (data) {
            //显示下的倍数
            var data = data.detail;
            var userId = data.userid;
            var beiShu = data.beiShu;
            self.showBeiShuText(userId, beiShu);
        });
        this.node.on('game_myHoldsUpdate', function (data) {
            //发最后一张手牌
            var holds = data.detail;
            self.showSelfPai(holds); //展示手牌
            self.showYouShi();
            self.showCount();
        });
        this.node.on('game_b_OneSnEnd', function (data) {
            //算牛结束
            var userId = data.detail;
            var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
            var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
            var localSeat = self._seats[localIndex];
            localSeat.snEnd();
        });
        this.node.on('match_exit_error', function (data) {
            //锦标赛不能退出游戏
            cc.vv.alert.show("提示", "锦标赛中不能退出游戏");
        });
        this.node.on('game_showAllUser', function (data) {
            //游戏结束
            var data = data.detail;
            var moneyFlows = data.moneyFlows;
            var players = data.players;
            var zhuang_userId = null;
            var type = null;
            for (var i in players) {
                var player = players[i];
                if (player.isZhuang) {
                    zhuang_userId = player.userid;
                }
                if (cc.vv.userMgr.userId == player.userid) {
                    //判断自己的输赢
                    if (player.status == 'win') {
                        type = 1;
                    } else {
                        type = 2;
                    }
                }
            }
            var user_arr_toZhuang = []; //流向庄
            var user_arr_fromZhuang = []; //从庄来
            for (var j in moneyFlows) {
                var moneyFlow = moneyFlows[j];
                if (moneyFlow.to == zhuang_userId) {
                    user_arr_toZhuang.push(moneyFlow);
                }
                if (moneyFlow.from == zhuang_userId) {
                    user_arr_fromZhuang.push(moneyFlow);
                }
            }
            self.showLastPai(players, function () {
                self.showLastResult(type); //显示本人输赢
                setTimeout(function () {
                    self.hideLastResult();
                    self.hideLastPai();
                    if (self._tips) {
                        self._tips.node.active = true;
                    }
                    self.showMoneyFlowsAnim(user_arr_toZhuang, user_arr_fromZhuang, function () {
                        self.showMoneyChange(players);
                        setTimeout(function () {
                            //showMoneyChange执行时间为2秒
                            cc.vv.net.send('ready');
                        }, 2000);
                    });
                }, 1500); //显示输赢的时间
            });
        });
        this.node.on('exit_room', function (data) {
            //刷新用户钱币数量
            self.getGemsAndCoins();
        });
    },
    refreshSeats: function refreshSeats(seatDatas) {
        for (var i in this._seats) {
            var seat = this._seats[i];
            var seatData = seatDatas[seat._userId];
            if (seatData) {
                seat._score = seatData['money'];
            }
            seat.refresh();
        }
    },
    //设置金币钻石数量
    getGemsAndCoins: function getGemsAndCoins() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
    },
    showLastPai: function showLastPai(players, callback) {
        var self = this;
        //显示每个人的牌
        // var players_num = players.length;
        var player_index = 0;
        var fun = function fun() {
            if (player_index > players.length - 1) {
                clearInterval(interval);
                if (callback) {
                    callback();
                }
                return;
            }
            var player = players[player_index];
            var userId = player.userid;
            var holds = player.holds;
            var seat = self.getSeatByUserId(userId);
            var spriteFrames = [];
            for (var i in holds) {
                spriteFrames.push(self.getpaiRes(holds[i]));
            }
            seat.showLastPai(spriteFrames, player.score);
            player_index++;
        };
        var interval = setInterval(fun, 1000); //1秒显示一个
        fun();
    },
    hideLastPai: function hideLastPai() {
        for (var i in this._seats) {
            var seat = this._seats[i];
            seat.hideLastPai();
            seat.hideBeiShuText();
        }
    },
    showMoneyChange: function showMoneyChange(players) {
        var self = this;
        for (var i in players) {
            var player = players[i];
            var userId = player.userid;
            var seat = self.getSeatByUserId(userId);
            var money = player.money;
            if (seat) {
                seat.changeMoney(money);
            }
        }
    },
    getSeatByUserId: function getSeatByUserId(userId) {
        var self = this;
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        if (!self._seats) return null;
        var localSeat = self._seats[localIndex];
        return localSeat;
    },
    showMoneyFlowsAnim: function showMoneyFlowsAnim(user_arr_toZhuang, user_arr_fromZhuang, callback) {
        var self = this;
        //资金流动画
        //流向庄的金币动画
        self.buildMoneyFlowsAnimData(user_arr_toZhuang);
        self.execMoneyFlowsAnim(function () {
            //从庄流出的金币动画
            self.buildMoneyFlowsAnimData(user_arr_fromZhuang);
            self.execMoneyFlowsAnim(function () {
                if (callback) {
                    callback();
                }
            });
        });
    },
    buildMoneyFlowsAnimData: function buildMoneyFlowsAnimData(user_arr) {
        var self = this;
        //构造金币流数据
        for (var i in user_arr) {
            //起点
            var from_userId = user_arr[i].from;
            var fromSeat = self.getSeatByUserId(from_userId);
            var from_node = fromSeat.node;
            var start_x = from_node.x;
            var start_y = from_node.y;
            //终点
            var to_userId = user_arr[i].to;
            var toSeat = self.getSeatByUserId(to_userId);
            var to_node = toSeat.node;
            var end_x = to_node.x;
            var end_y = to_node.y;
            var dis_x = end_x - start_x;
            var dis_y = end_y - start_y;
            var jin_num = 15;
            var per_x = Math.floor(dis_x / jin_num);
            var per_y = Math.floor(dis_y / jin_num);
            var new_node_arr = [];
            // if (type == 1) {
            for (var j = 0; j <= jin_num; j++) {
                var new_x = start_x + j * per_x;
                var new_y = start_y + j * per_y;
                var new_node = cc.instantiate(self.jinbi);
                new_node.active = false;
                new_node.x = new_x;
                new_node.y = new_y;
                cc.find("Canvas").addChild(new_node);
                new_node_arr.push(new_node);
            }
            self.jinbi_node_arr.push(new_node_arr);
        }
    },
    execMoneyFlowsAnim: function execMoneyFlowsAnim(callback) {
        //执行金币流动画
        var self = this;
        if (!self.jinbi_node_arr) return;
        if (self.jinbi_node_arr.length == 0) {
            self.clearFlowAnim();
            if (callback) {
                callback();
            }
            return;
        }
        var interVal = setInterval(function () {
            if (!self.showJinbiIndex) {
                self.showJinbiIndex = 0;
            }
            for (var i in self.jinbi_node_arr) {
                var new_node_arr = self.jinbi_node_arr[i];
                new_node_arr[self.showJinbiIndex].active = true;
            }
            if (self.showJinbiIndex >= 10) {
                self.showJinbiIndex = 0;
                self.flowEndAnim(callback);
                clearInterval(interVal);
            } else {
                self.showJinbiIndex++;
            }
        }, 100);
    },
    flowEndAnim: function flowEndAnim(callback) {
        var self = this;
        var duration = 0.4;
        for (var i in self.jinbi_node_arr) {
            var node_arr = self.jinbi_node_arr[i];
            var endNode = node_arr[node_arr.length - 1];
            for (var j in node_arr) {
                var node = node_arr[j];
                var action = cc.moveTo(duration, cc.p(endNode.x, endNode.y));
                node.runAction(action);
            }
        }
        setTimeout(function () {
            //清理金币
            self.clearFlowAnim();
            if (callback) {
                callback();
            }
        }, duration * 1000);
    },
    clearFlowAnim: function clearFlowAnim() {
        var self = this;
        for (var i in self.jinbi_node_arr) {
            var node_arr = self.jinbi_node_arr[i];
            for (var j in node_arr) {
                var node = node_arr[j];
                cc.find("Canvas").removeChild(node);
            }
        }
        self.jinbi_node_arr = [];
    },
    showBeiShuText: function showBeiShuText(userId, beiShu) {
        var self = this;
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        var seat = self._seats[localIndex];
        seat.showBeiShuText(beiShu);
    },
    showCount: function showCount() {
        this._seats[0].showCount();
    },
    showYouShi: function showYouShi() {
        this._seats[0].showYouShi();
    },
    showQiangZhuTips: function showQiangZhuTips() {
        //显示抢主tips
        this._qiangZhuTips.node.active = true;
    },
    hideQiangZhuTips: function hideQiangZhuTips() {
        this._qiangZhuTips.node.active = false;
    },
    showXiaZhuTips: function showXiaZhuTips() {
        this._xiaBeiTips.node.active = true;
    },
    hideXiaZhuTips: function hideXiaZhuTips() {
        this._xiaBeiTips.node.active = false;
    },
    showOtherSeat: function showOtherSeat() {
        var self = this;
        for (var i = 1; i < 5; i++) {
            var seat = self._seats[i];
            seat.showBeiPai(4); //显示牌的背面
        }
    },
    showQiangZhu: function showQiangZhu(maxQiangZhuangBeiShu) {
        var self = this;
        var level = 0;
        for (var i in self.qiangZhuLevel) {
            if (self.qiangZhuLevel[i] <= maxQiangZhuangBeiShu) {
                level = i;
            }
        }
        var seat = self._seats[0];
        seat.showQiangZhu(level);
    },
    showSelfPai: function showSelfPai(holds) {
        var self = this;
        var seat = self._seats[0];
        var spriteFrames = [];
        for (var i in holds) {
            spriteFrames.push(self.getpaiRes(holds[i]));
        }
        seat.showSelfPai(spriteFrames);
    },
    getpaiRes: function getpaiRes(data) {
        var self = this;
        data = data + 1;
        var type, num, huase_big, huase_small;
        num = (data % 100).toString();
        if (data > 0 && data < 14) {
            type = '04'; //黑桃
            num = num + '-1'; //黑牌
        } else if (data > 100 && data < 114) {
            type = '03'; //红桃
            num = num + '-2'; //红牌
        } else if (data > 200 && data < 214) {
            type = '02'; //梅花
            num = num + '-1'; //黑牌
        } else if (data > 300 && data < 314) {
            type = '01'; //方块
            num = num + '-2'; //红牌
        }
        huase_big = "huase_big" + type;
        huase_small = "huase_small" + type;
        var hold = data - 1;
        var result = {
            num: self.paigroup.getSpriteFrame(num),
            huase_big: self.paigroup.getSpriteFrame(huase_big),
            huase_small: self.paigroup.getSpriteFrame(huase_small),
            hold: hold
        };
        return result;
    },
    showDiFen: function showDiFen(difen) {
        var self = this;
        self._difen.node.active = true;
        self._difen.string = "底分：" + difen;
    },
    showLastResult: function showLastResult(type) {
        var seatIndex = cc.vv.gameNetMgr.getSeatIndexByID(cc.vv.userMgr.userId);
        var localIndex = cc.vv.gameNetMgr.getLocalIndexZJH(seatIndex);
        if (!this._seats) return;
        var seat = this._seats[localIndex];
        if (this._lastResult && seat._lastpai.active) {
            this._lastResult.active = true;
        }
        if (type == 1) {
            this._lastResult.getChildByName('win').active = true;
            this._lastResult.getChildByName('lose').active = false;
        } else if (type == 2) {
            this._lastResult.getChildByName('win').active = false;
            this._lastResult.getChildByName('lose').active = true;
        }
    },
    hideLastResult: function hideLastResult() {
        if (this._lastResult) {
            this._lastResult.active = false;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (window.voice && window.voice.localId != null) {
            var localId = window.voice.localId;
            window.voice.localId = null;
            cc.vv.audioMgr.pauseAll();
            window.playVoice(localId);
        }
        var minutes = Math.floor(Date.now() / 1000 / 60);
        if (this._lastMinute != minutes) {
            this._lastMinute = minutes;
            var date = new Date();
            var h = date.getHours();
            h = h < 10 ? "0" + h : h;
            var m = date.getMinutes();
            m = m < 10 ? "0" + m : m;
            this._timeLabel.string = "" + h + ":" + m;
        }
        if (this._lastPlayTime != null) {
            if (Date.now() > this._lastPlayTime + 200) {
                this.onPlayerOver();
                this._lastPlayTime = null;
            }
        } else {
            this.playVoice();
        }
    },
    onPlayerOver: function onPlayerOver() {
        if (!cc.sys.isNative) {
            window.stopPlayVoice();
        };
        cc.vv.audioMgr.resumeAll();
        console.log("onPlayCallback:" + this._playingSeat);
        var localIndex = this._playingSeat;
        this._playingSeat = null;
        this._seats[localIndex].voiceMsg(false);
    },
    onDestroy: function onDestroy() {
        cc.vv.voiceMgr.stop();
        //        cc.vv.voiceMgr.onPlayCallback = null;
    },
    onQiangZhuangClick: function onQiangZhuangClick(e) {
        var self = this;
        var node = e.target;
        var opacity = node.opacity;
        if (opacity == 255) {
            var beishu = 0;
            var nodeName = node.name;
            beishu = nodeName.replace('qiang', '');
            cc.vv.net.send("qiang_zhuang", beishu);
            self.hideQiangZhuTips();
            self._seats[0].hideQiangZhu();
        }
    },
    onXiaZhuClick: function onXiaZhuClick(e) {
        var self = this;
        var node = e.target;
        var opacity = node.opacity;
        if (opacity == 255) {
            var beishu = 0;
            var str = node.getChildByName('num').getComponent(cc.Label).string;
            beishu = str.replace('倍', '');
            cc.vv.net.send("xia_zhu", beishu);
            self.hideXiaZhuTips();
            self._seats[0].hideXiaBei();
        }
    },
    onYouShiClick: function onYouShiClick(e) {
        console.log('有十', e.target);
        var niu_arr = this._seats[0].getNiuArr();
        console.log('niu_arr', niu_arr);
        cc.vv.net.send("you_shi", niu_arr);
    },
    onSanPaiClick: function onSanPaiClick(e) {
        console.log('散牌', e.target);
        cc.vv.net.send("san_pai");
    },
    onPaiClick: function onPaiClick(e) {
        if (!this._seats[0]._count.active) return;
        var node = e.target;
        var nodeName = node.name;
        var hold = node.hold;
        var num = hold % 100;
        console.log('hold', hold);
        if (node.isClicked) {
            node.isClicked = false;
            node.y -= 20;
            this._seats[0].unsetCount(nodeName);
        } else {
            node.isClicked = true;
            node.y += 20;
            this._seats[0].setCount(num, nodeName);
        }
    }
});