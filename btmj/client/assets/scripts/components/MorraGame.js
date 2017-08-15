cc.Class({
    extends: cc.Component,
    properties: {
        // _hallGemsV: null,
        // _hallCoinsV: null,
        _alertV: null, //提示框
        _alertContentV: null,
        _morraHallV: null, //大厅view
        _roomIdV: null,
        _seatsV: [], //座位view
        _caiquanV: [],
        //动画相关
        _leftAnimation: null,
        _rightAnimation: null,
        _leftOpenAnim: null,
        _rightOpenAnim: null,
        _animTime: 3000,
        _resultsV: null, //结果显示view
        _currentQuanV: null, //当前选择手势的view
        _winlabelV: null,
        _winBgV: null,
        currentQuan: -1, //当前选择的手势
        isRandom: false, //是否随机手势
        gameEndData: null, //对局结束数据
        jianzi: 0,
        shitou: 1,
        bu: 2,
        seatindex: 0, //当前位置 0左1右
        seats: null,
        canAgain: false, //能否继续游戏（当有人掉线或退出）
        guize: null,
    },
    // use this for initialization
    onLoad: function() {
        // this._hallGemsV = cc.find("Canvas/header/jinbi/gems").getComponent(cc.Label);
        // this._hallCoinsV = cc.find("Canvas/header/zuanshi/coins").getComponent(cc.Label);
        this.guize = cc.find("Canvas/guessbox/guize");
        this._alertV = cc.find("Canvas/guessboxAlert");
        this._alertContentV = this._alertV.getChildByName("content").getComponent(cc.Label);
        this._morraHallV = cc.find("Canvas/guessbox");
        this._roomIdV = this._morraHallV.getChildByName("roomId").getComponent(cc.Label);
        this.initSeatsView();
        this.showWinCount(false);
        this.initCaiquanView();
        this.initEventHandlers();
        this.setGemsAndCoins(cc.vv.userMgr.gems, cc.vv.userMgr.coins);
        if (cc.vv.gameNetMgr.cq_data) {
            console.log("------cq_data----", cc.vv.gameNetMgr.cq_data);
            this.seats = cc.vv.gameNetMgr.cq_data.seats;
            this.initSeatsData(cc.vv.gameNetMgr.cq_data);
        }
        cc.vv.net.send('ready');
    },
    initSeatsView: function() {
        var seat = [];
        seat[0] = this._morraHallV.getChildByName("seat").children[0].getComponent(cc.Label);
        seat[1] = this._morraHallV.getChildByName("seat").children[1].getComponent(cc.Label);
        this._seatsV.seat = seat;
        this._seatsV.difen = this._morraHallV.getChildByName("difen").getComponent(cc.Label);
        this._seatsV.gems = this._morraHallV.getChildByName("gemsBg").getChildByName("gems").getComponent(cc.Label);
        this._seatsV.coins = this._morraHallV.getChildByName("coinsBg").getChildByName("coins").getComponent(cc.Label);
        this._seatsV.wincont = this._morraHallV.getChildByName("winBg").getChildByName("wincont").getComponent(cc.Label);
        this._winlabelV = this._morraHallV.getChildByName("winlabel");
        this._winBgV = this._morraHallV.getChildByName("winBg");
        this._seatsV.lastTime = this._morraHallV.getChildByName("lastTimeBg").getChildByName("lastTime").getComponent(cc.Label);
    },
    initCaiquanView: function() {
        var layout = this._morraHallV.getChildByName("content").getChildByName("layout");
        this._caiquanV.left = layout.getChildByName("left");
        this._caiquanV.left.active = false;
        this._caiquanV.right = layout.getChildByName("right");
        this._caiquanV.right.active = false;
        this._leftAnimation = layout.getChildByName("l_anim");
        this._rightAnimation = layout.getChildByName("r_anim");
        this._leftOpenAnim = this._leftAnimation.getComponent(cc.Animation);
        this._rightOpenAnim = this._rightAnimation.getComponent(cc.Animation);
        this._leftXuanding = this._caiquanV.left.getChildByName('xuanding');
        this._rightXuanding = this._caiquanV.right.getChildByName('xuanding');
        this._resultsV = new Array();
        this._resultsV.push(layout.getChildByName("result1"));
        this._resultsV.push(layout.getChildByName("result2"));
        this._resultsV.push(layout.getChildByName("result3"));
    },
    initEventHandlers: function() {
        cc.vv.gameNetMgr.cqEventHandler = this.node;
        var self = this;
        //游戏开始
        this.node.on('cq_begin', function(data) {
            console.log('cq_begin====================>', data);
            self.playOpenAnim();
        });
        //新增用户
        this.node.on('cq_new_user', function(res) {
            var data = res.detail.data;
            cc.vv.gameNetMgr.cq_data = data;
            self.seats = data.seats;
            self.initSeatsData(data);
        });
        //游戏结束
        this.node.on('cq_game_over', function(res) {
            var data = res.detail.data;
            self.gameEndData = data;
            // self.playOpenAnim();
            self.gameEnd();
            var s = self;
            var again = function() {
                if (s.seatindex == 0 && s.canAgain) { //如果是房主
                    cc.vv.net.send('cq_again');
                }
                s.clearCq();
            }
            setTimeout(again, 2000);
            // var data = data.detail.data;
        });
        //攻擂退出房间
        this.node.on('cq_exit_notify', function(res) {
            var userid = res.detail;
            self.canAgain = false;
            if (userid == cc.vv.userMgr.userId) {
                self.clearCq();
                self.seats = null;
                self.seatindex = 0;
            } else {
                if (self.seats) {
                    self.seats.pop();
                    console.log("-------------self.seats--------->>", self.seats);
                    self._seatsV.seat[1].string = "";
                    self.showWinCount(false);
                }
            }
            self.getGemsAndCoins();
        });
        //房主解散房间
        this.node.on('cq_dispress', function(res) {
            var context = self;
            var userid = res.detail;
            if (userid == cc.vv.userMgr.userId) {} else {
                cc.vv.alert.show("提示", "擂主逃跑了！,并赠送了你全部奖金！", function() {
                    context.loadHomeHall();
                });
            }
            self.canAgain = false;
            self.clearCq();
            self.seats = null;
            self.seatindex = 0;
            self.getGemsAndCoins();
        });
        //倒计时
        this.node.on('cq_game_time', function(res) {
            var data = res.detail.data;
            self._seatsV.lastTime.string = data;
            if (data == 0) {
                if (self.currentQuan == -1) {
                    //倒计时结束随机选择手势
                    self.isRandom = true;
                    var num = Math.floor(Math.random() * 10) % 3;
                    if (num == 0) {
                        self.chuJianzi();
                    } else if (num == 1) {
                        self.chuShitou();
                    } else {
                        self.chuBu();
                    }
                }
            }
        });
        //攻擂失败
        this.node.on('cq_loser_notify', function(res) {
            var context = self;
            var userid = res.detail;
            self.canAgain = false;
            if (userid == cc.vv.userMgr.userId) {
                self.clearCq();
                self.seats = null;
                self.seatindex = 0;
                cc.vv.alert.show("提示", "您挑战失败！自动退出房间", function() {
                    context.loadHomeHall();
                });
            } else {
                if (self.seats) {
                    self.seats.pop();
                    console.log("-------------cq_loser_notify--------->>", self.seats);
                    self._seatsV.seat[1].string = "";
                }
                self.showWinCount(false);
            }
            self.getGemsAndCoins();
        });
        //攻擂成功
        this.node.on('cq_winner_notify', function(res) {
            var context = self;
            var userid = res.detail;
            var str = "";
            if (userid == cc.vv.userMgr.userId) {
                cc.vv.alert.show("提示", "攻擂成功！并获得了全部奖金！", function() {
                    context.loadHomeHall();
                });
            } else {
                cc.vv.alert.show("提示", "您被打败了！并将奖金赠送给了对手！", function() {
                    context.loadHomeHall();
                });
            }
            self.canAgain = false;
            self.clearCq();
            self.seats = null;
            self.seatindex = 0;
            self.getGemsAndCoins();
        });
        //出拳通知
        this.node.on('cq_chuquan_notify', function(data) {
            //停止动画，显示已出拳
            var userId = data.detail;
            if (self.seats[0].userid == userId) {
                // 擂主出拳
                self._leftOpenAnim.stop();
                self._leftAnimation.active = false;
                self._caiquanV.left.active = true;
                if (cc.vv.userMgr.userId != userId) {
                    //不是本人的时候，显示已选定
                    self._leftXuanding.active = true;
                }
            } else {
                //userid
                self._rightOpenAnim.stop();
                self._rightAnimation.active = false;
                self._caiquanV.right.active = true;
                if (cc.vv.userMgr.userId != userId) {
                    //不是本人的时候，显示已选定
                    self._rightXuanding.active = true;
                }
            }
        })
        this.node.on('disconnect', function(res) {
            var context = self;
            self.canAgain = false;
            self.seats = null;
            self.seatindex = 0;
        });
    },
    initSeatsData: function(data) {
        var self = this;
        var consu = data.conf.consu;
        if (consu == 0) {
            //金币
            self._seatsV.difen.string = cc.vv.utils.showJinbi(data.conf.baseScore) + "金币";
        } else {
            //钻石
            self._seatsV.difen.string = cc.vv.utils.showJinbi(data.conf.baseScore) + "钻石";
        }
        if (self.seats) {
            self._roomIdV.string = "房间号：" + cc.vv.gameNetMgr.roomId;
            for (var i = 0; i < self.seats.length; i++) {
                self._seatsV.seat[i].string = self.seats[i].name;
                if (self.seats[i].userid == cc.vv.userMgr.userId) {
                    self._seatsV.wincont.string = self.seats[i].score;
                    self.seatindex = self.seats[i].seatindex;
                    self.getGemsAndCoins();
                }
            }
            if (self.seats.length == 2 && self.seats[1].userid != 0) {
                if (self.seats[0].userid == cc.vv.userMgr.userId) { //房主提示有人进入房间
                    self._alertContentV.string = self.seats[1].name + "进入了房间";
                    self._alertV.active = true;
                    var context = self;
                    setTimeout(function() {
                        context._alertV.active = false;
                    }, 3000);
                }
                this.showWinCount(true);
            } else {
                this.showWinCount(false);
            }
        }
        self.canAgain = (self.seats.length == 2 && self.seats[1].userid != 0);
        self.clearCq();
    },
    gameEnd: function() {
        if (!this.gameEndData || this.gameEndData == null) {
            return;
        }
        this._rightXuanding.active = false;
        this._leftXuanding.active = false;
        for (var i = 0; i < this.gameEndData.length; i++) {
            if (this.gameEndData[i].seatIndex == this.seatindex) { //如果是自己
                // this._resultsV[this.gameEndData[i].wined].active = true;
                this._resultsV[this.gameEndData[1].wined].active = true;//只显示攻擂者的输赢
            } else {
                this.gameOverShowGesture(this.gameEndData[i].chuQuan, i);
            }
            this._seatsV.wincont.string = (i == 0 ? 0 : this.gameEndData[i].winCount); //显示攻擂者得分
        }
    },
    clearCq: function() {
        if (this._caiquanV) {
            var left = this._caiquanV.left.children;
            var right = this._caiquanV.right.children;
            for (var i = 0; i < left.length; i++) {
                for (var j = 0; j < left[i].children.length; j++) {
                    left[i].children[j].active = false;
                }
            }
            for (var i = 0; i < right.length; i++) {
                for (var j = 0; j < right[i].children.length; j++) {
                    right[i].children[j].active = false;
                }
            }
        }
        if (this._resultsV) {
            for (var i = 0; i < this._resultsV.length; i++) {
                this._resultsV[i].active = false;
            }
        }
        this._currentQuanV = null;
        this.currentQuan = -1;
        this.isRandom = false;
        this.gameEndData = null;
        if (this._caiquanV) {
            this._caiquanV.left.active = false;
        }
        if (this._caiquanV) {
            this._caiquanV.right.active = false;
        }
    },
    // 猜拳动画播放
    playOpenAnim: function() {
        var self = this;
        this._caiquanV.left.active = false;
        this._caiquanV.right.active = false;
        var leftAnim = function() {
            self._leftAnimation.active = true;
            var animState1 = self._leftOpenAnim.play('caiquan2');
            animState1.wrapMode = cc.WrapMode.Loop;
        }
        var rightAnim = function() {
            self._rightAnimation.active = true;
            var animState2 = self._rightOpenAnim.play('caiquan1');
            animState2.wrapMode = cc.WrapMode.Loop;
        }
        if (self.isRandom) {
            leftAnim();
            rightAnim();
            return;
        }
        leftAnim();
        rightAnim();
    },
    showGesture: function(type) { //手势显示
        if (this._currentQuanV && this._currentQuanV != null) {
            this._currentQuanV.active = false;
        }
        var left = this._caiquanV.left.children;
        var right = this._caiquanV.right.children;
        for (var i in left) {
            left[i].active = false;
        }
        for (var i in right) {
            right[i].active = false;
        }
        if (this.seatindex == 0) { //左边
            left[0].active = true;
            this._currentQuanV = left[0].children[type];
        } else {
            right[1].active = true;
            this._currentQuanV = right[1].children[type];
        }
        this._currentQuanV.active = true;
        this.currentQuan = type;
        this._caiquanV.left.active = true;
        this._caiquanV.right.active = true;
    },
    gameOverShowGesture: function(type, index) {
        var left = this._caiquanV.left.children;
        var right = this._caiquanV.right.children;
        if (index == 0) {
            left[0].active = true;
            left[0].children[type].active = true;
        } else {
            right[1].active = true;
            right[1].children[type].active = true;
        }
        return;
    },
    //是否显示赢句次数
    showWinCount: function(flag) {
        this._winlabelV.active = flag;
        this._winBgV.active = flag;
    },
    //设置金币钻石数量
    getGemsAndCoins: function() {
        var self = this;
        cc.vv.userMgr.getGemsAndCoins(function(data) {
            console.log("------getGemsAndCoins-------->", data);
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
            // self._hallGemsV.string = data.gems;
            // self._hallCoinsV.string = data.coins;
            self.setGemsAndCoins(data.gems, data.coins);
        });
    },
    setGemsAndCoins: function(gems, coins) {
        if (this._seatsV && this._seatsV.gems && this._seatsV.coins) {
            this._seatsV.gems.string = cc.vv.utils.showJinbi(gems);
            this._seatsV.coins.string = coins;
        }
    },
    //出剪子
    chuJianzi: function() {
        if (this.currentQuan == -1) {
            this.showGesture(this.jianzi);
            cc.vv.net.send('cq_shot', this.jianzi);
        }
    },
    //出石头
    chuShitou: function() {
        if (this.currentQuan == -1) {
            this.showGesture(this.shitou);
            cc.vv.net.send('cq_shot', this.shitou);
        }
    },
    //出布
    chuBu: function() {
        if (this.currentQuan == -1) {
            this.showGesture(this.bu);
            cc.vv.net.send('cq_shot', this.bu);
        }
    },
    //关闭弹框通知
    onBtnCloseAlert: function() {
        this._alertV.active = false;
        this.loadHomeHall();
        // this._morraHallV.active = false;
    },
    //关闭猜拳大厅
    onBtnCloseRoom: function() {
        var context = this;
        var str = "";
        if (this.seatindex == 0) { //房主
            if (this.seats.length == 2 && this.seats[1].userid != 0) {
                str = "您确定要放弃守擂！并将奖金赠送给了对手？";
            } else {
                str = "您确定要离开擂台？";
            }
            cc.vv.alert.show("提示", str, function() {
                cc.vv.net.send('cq_dispress');
                context.loadHomeHall();
            }, true);
        } else {
            str = "您手续费已扣除！您确定放弃攻擂？";
            cc.vv.alert.show("提示", str, function() {
                cc.vv.net.send('cq_exit');
                context.loadHomeHall();
            }, true);
        }
    },
    //加载首页大厅
    loadHomeHall: function() {
        cc.director.loadScene("newhall");
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
    //打开猜拳规则
    onOpenguize: function() {
        this.guize.active = true;
    },
    //打开猜拳规则
    onCloseguize: function() {
        this.guize.active = false;
    },
});