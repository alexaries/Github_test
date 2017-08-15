cc.Class({
    extends: cc.Component,
    properties: {
        _sprIcon: null,
        _zhuang: null,
        _ready: null,
        _offline: null,
        _lblName: null,
        _lblScore: null,
        _scoreBg: null,
        _voicemsg: null,
        _chatBubble: null,
        _emoji: null,
        _lastChatTime: -1,
        _userName: "",
        _score: 0,
        _isOffline: false,
        _isReady: false,
        _isZhuang: false,
        _userId: null,
        _isKanPai: false,
        _isQiPai: false,
        _isShu: false,
        // _timeLabel: null,
        _time: -1,
    },
    // use this for initialization
    onLoad: function() {
        if (cc.vv == null) {
            return;
        }
        this._sprIcon = this.node.getChildByName("head").getComponent("ImageLoader");
        this._lblName = this.node.getChildByName("name").getComponent(cc.Label);
        this._lblScore = this.node.getChildByName("money").getComponent(cc.Label);
        this._diff_money = this.node.getChildByName("diff_money").getComponent(cc.Label);
        this._chatBubble = this.node.getChildByName("ChatBubble");
        this._lastpai = this.node.getChildByName("lastpai");
        this._complete = this.node.getChildByName("complete");
        this._qiangzhu = this.node.getChildByName("qiangzhu");
        this._qiangzhuText = this.node.getChildByName("qiangzhuText");
        this._douniu_zhu = this.node.getChildByName("douniu_zhu");
        this._pai = this.node.getChildByName("pai"); //只有seat0才会有
        this._emoji = this.node.getChildByName("emoji");
        this._xiabei = this.node.getChildByName('xiabei');
        this._beishuText = this.node.getChildByName("beishuText");
        this._youshi = this.node.getChildByName('youshi');
        this._count = this.node.getChildByName('count');
        this.refresh();
        if (this._sprIcon && this._userId) {
            this._sprIcon.setUserID(this._userId);
        }
    },
    onIconClicked: function() {
        var iconSprite = this._sprIcon.node.getComponent(cc.Sprite);
        if (this._userId != null && this._userId > 0) {
            var seat = cc.vv.gameNetMgr.getSeatByID(this._userId);
            var sex = 0;
            if (cc.vv.baseInfoMap) {
                var info = cc.vv.baseInfoMap[this._userId];
                if (info) {
                    sex = info.sex;
                }
            }
        }
    },
    refresh: function() {
        if (this._lblName != null) {
            this._lblName.string = this._userName;
        }
        if (this._lblScore != null) {
            this._lblScore.string = this._score;
        }
        if (this._diff_money != null) {
            this._diff_money.node.active = false;
        }
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
        if (this._ready) {
            this._ready.active = this._isReady && (cc.vv.gameNetMgr.numOfGames > 0);
        }
        if (this._zhuang) {
            this._zhuang.active = false;
        }
        this.node.active = this._userName != null && this._userName != "";
        if (this._chatBubble) {
            this._chatBubble.active = false;
        }
        if (this._emoji) {
            this._emoji.active = false;
        }
        if (this._lastpai) {
            this._lastpai.active = false;
        }
        if (this._complete) {
            // this._complete.getChildByName('douniu_bg1').active = false;
            // this._complete.getChildByName('wancheng').active = false;
            this._complete.active = false;
        }
        if (this._beishuText) {
            this._beishuText.active = false;
        }
        if (this._qiangzhu) {
            this._qiangzhu.active = false;
        }
        if (this._qiangzhuText) {
            this._qiangzhuText.active = false;
        }
        if (this._douniu_zhu) {
            this._douniu_zhu.active = false;
        }
        if (this._pai) {
            this._pai.active = false;
        }
        if (this._xiabei) {
            this._xiabei.active = false;
        }
        if (this._youshi) {
            this._youshi.active = false;
        }
    },
    setInfo: function(name, score) {
        this._userName = name;
        this._score = score;
        if (this._score == null) {
            this._score = 0;
        }
        if (this._scoreBg != null) {
            this._scoreBg.active = this._score != null;
        }
        if (this._lblScore != null) {
            this._lblScore.node.active = this._score != null;
        }
        this.refresh();
    },
    seatHide: function() {
        this.node.active = false;
        this._userName = "";
        this._userId = 0;
    },
    setZhuang: function(value) {
        this._isZhuang = value;
        if (this._zhuang) {
            this._zhuang.active = value;
        } else {
            this._zhuang = this.node.getChildByName("zhuang");
            this._zhuang.active = value;
        }
    },
    setReady: function(isReady) {
        this._isReady = isReady;
        if (this._ready) {
            this._ready.active = this._isReady && (cc.vv.gameNetMgr.numOfGames > 0);
        }
    },
    setID: function(id) {
        var idNode = this.node.getChildByName("id");
        if (idNode) {
            var lbl = idNode.getComponent(cc.Label);
            lbl.string = "ID:" + id;
        }
        this._userId = id;
        if (this._sprIcon) {
            this._sprIcon.setUserID(id);
        }
    },
    getID: function() {
        return this._userId;
    },
    setOffline: function(isOffline) {
        this._isOffline = isOffline;
        if (this._offline) {
            this._offline.active = this._isOffline && this._userName != "";
        }
    },
    chat: function(content) {
        if (this._chatBubble == null) {
            return;
        }
        this._emoji.active = false;
        this._chatBubble.active = true;
        this._chatBubble.getComponent(cc.Label).string = content;
        this._chatBubble.getChildByName("New Label").getComponent(cc.Label).string = content;
        this._lastChatTime = 3;
    },
    emoji: function(emoji) {
        //emoji = JSON.parse(emoji);
        if (this._emoji == null) {
            return;
        }
        console.log(emoji);
        this._chatBubble.active = false;
        this._emoji.active = true;
        this._emoji.getComponent(cc.Animation).play(emoji);
        this._lastChatTime = 3;
    },
    voiceMsg: function(show) {
        if (this._voicemsg) {
            this._voicemsg.active = show;
        }
    },
    setMoney: function(data) {
        //设置该玩家所拥有的的钱
        this._lblScore.string = data;
        this._score = data;
    },
    setTime: function(o) {
        if (o) {
            this._time = 0;
        } else {
            this._time = 30;
        }
    },
    showQiangZhu: function(level) {
        var self = this;
        if (!self._qiangzhu) return;
        self._qiangzhu.active = true;
        for (var i in self._qiangzhu.children) {
            if (level < i) {
                self._qiangzhu.children[i].opacity = 128;
            } else {
                self._qiangzhu.children[i].opacity = 255;
            }
        }
    },
    hideQiangZhu: function() {
        this._qiangzhu.active = false;
    },
    showSelfPai: function(spriteFrames) {
        var self = this;
        if (self._pai) {
            self._pai.active = true;
            for (var i in self._pai.children) {
                var pai = self._pai.children[i];
                var paiObj = spriteFrames[i];
                if (paiObj) {
                    //如果有资源则显示，没有则隐藏
                    pai.active = true;
                    self.setPai(pai, paiObj)
                } else {
                    pai.active = false;
                }
            }
        }
    },
    /**
     * [setPai description]
     * @param {[type]} pai    [牌的node]
     * @param {[type]} paiObj [牌的资源]
     */
    setPai: function(pai, paiObj) {
        var numRes = paiObj['num'];
        var huase_bigRes = paiObj['huase_big'];
        var huase_smallRes = paiObj['huase_small'];
        var hold = paiObj['hold'];
        pai.getChildByName('num').getComponent(cc.Sprite).spriteFrame = numRes;
        pai.getChildByName('hua2').getComponent(cc.Sprite).spriteFrame = huase_bigRes;
        pai.getChildByName('hua1').getComponent(cc.Sprite).spriteFrame = huase_smallRes;
        pai.hold = hold;
    },
    showBeiPai: function(num) {
        var self = this;
        if (!self._complete) return;
        self._complete.active = true;
        for (var i in self._complete.children) {
            if (i < num) {
                self._complete.children[i].active = true;
            } else {
                self._complete.children[i].active = false;
            }
        }
    },
    showQiangZhuText: function(beishu) {
        var self = this;
        if (!self._qiangzhuText) return;
        self._qiangzhuText.active = true;
        for (var i in self._qiangzhuText.children) {
            if (i == beishu) {
                self._qiangzhuText.children[i].active = true;
            } else {
                self._qiangzhuText.children[i].active = false;
            }
        }
    },
    hideQiangZhuText: function() {
        var self = this;
        if (!self._qiangzhuText) return;
        self._qiangzhuText.active = false;
    },
    showZhuang: function() {
        //庄的显示
        var self = this;
        if (!self._douniu_zhu) return;
        self._douniu_zhu.active = true;
    },
    hideZhuang: function() {
        //隐藏庄
        var self = this;
        if (!self._douniu_zhu) return;
        self._douniu_zhu.active = false;
    },
    showXiaBei: function(data) {
        //下注
        var self = this;
        if (!self._xiabei) return;
        self._xiabei.active = true;
        var maxBeishu = data.maxXiaZhuBeiShu;
        var xiaZhuOps = data.xiaZhuOps;
        for (var i in self._xiabei.children) {
            var temp = self._xiabei.children[i];
            if (xiaZhuOps[i] <= maxBeishu) {
                temp.opacity = 255;
            } else {
                temp.opacity = 128;
            }
            temp.getChildByName('num').getComponent(cc.Label).string = xiaZhuOps[i] + "倍";
        }
    },
    hideXiaBei: function() {
        var self = this;
        if (!self._xiabei) return;
        self._xiabei.active = false;
    },
    showYouShi: function() {
        var self = this;
        if (!self._youshi) return;
        self._youshi.active = true;
    },
    hideYouShi: function() {
        var self = this;
        if (!self._youshi) return;
        self._youshi.active = false;
    },
    showCount: function() {
        var self = this;
        if (!self._count) return;
        self._count.active = true;
        for (var i in self._count.children) {
            self._count.children[i].active = false;
        }
    },
    hideCount: function() {
        var self = this;
        if (!self._count) return;
        self._count.active = false;
    },
    setCount: function(num, nodeName) {
        var self = this;
        if (!self._count) return;
        var index = null;
        for (var i in self._count.children) {
            if (i > 2) continue;
            var temp = self._count.children[i];
            if (temp.active == false) {
                index = i;
                break;
            }
        }
        if (index == null) return;
        var child = self._count.children[index];
        child.active = true;
        child.nodeName = nodeName;
        if (num > 9) {
            num = 9;
        }
        child.num = num;
        for (var i in child.children) {
            var temp = child.children[i];
            if (i == num) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
        if (index == 2) {
            //如果前三个填满了，则在第四格算出
            var num0 = parseInt(self._count.children[0].num);
            var num1 = parseInt(self._count.children[1].num);
            var num2 = parseInt(self._count.children[2].num);
            var total_num = num0 + num1 + num2 + 3; //+3算出真实的值
            var total_num_shi = Math.floor(total_num / 10); //十位数
            var total_num_ge = total_num % 10; //个位数
            self._count.getChildByName('result').active = true;
            //子元素先全部隐藏
            var result = self._count.getChildByName('result').children;
            for (var i in result) {
                result[i].active = false;
            }
            //分类显示
            if (total_num > 9) {
                var index_shi = total_num_shi - 1;
                var index_ge = total_num_ge;
                var n9 = result[9];
                n9.active = true;
                //n9的子元素
                for (var j in n9.children) {
                    var child_n9 = n9.children[j];
                    for (var k in child_n9.children) {
                        if (j == 0 && k == index_shi) {
                            //显示十位数
                            child_n9.children[k].active = true;
                        } else if (j == 1 && k == index_ge) {
                            //显示个位数
                            child_n9.children[k].active = true;
                        } else {
                            child_n9.children[k].active = false;
                        }
                    }
                }
            } else {
                var index_ge = total_num_ge - 1;
                result[index_ge].active = true;
            }
        }
    },
    unsetCount: function(nodeName) {
        var self = this;
        if (!self._count) return;
        var index = null;
        for (var i in self._count.children) {
            var temp = self._count.children[i];
            if (temp.nodeName == nodeName) {
                index = i;
            }
        }
        if (index == null) return;
        self._count.children[index].active = false;
        self._count.getChildByName('result').active = false;
    },
    showBeiShuText: function(beishu) {
        var self = this;
        if (!self._beishuText || !beishu) return;
        self._beishuText.active = true;
        var num0 = Math.floor(parseInt(beishu) / 10);
        var num1 = parseInt(beishu) % 10;
        var num0_arr = self._beishuText.getChildByName('num0').children;
        var num1_arr = self._beishuText.getChildByName('num1').children;
        for (var i in num0_arr) {
            var temp = num0_arr[i];
            if (i == num0) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
        for (var i in num1_arr) {
            var temp = num1_arr[i];
            if (i == num1) {
                temp.active = true;
            } else {
                temp.active = false;
            }
        }
    },
    hideBeiShuText: function() {
        var self = this;
        if (!self._beishuText) return;
        self._beishuText.active = false;
    },
    getNiuArr: function() {
        var self = this;
        if (!self._count) return;
        var niu_arr = [];
        for (var i in self._count.children) {
            var niu = self._count.children[i].num;
            if (i > 2 || !niu) return;
            niu_arr.push(niu);
        }
        return niu_arr;
    },
    snEnd: function() {
        //算牛结束，隐藏count界面，显示已完成
        var self = this;
        if (self._count) {
            self._count.active = false;
        }
        if (self._pai) {
            self._pai.active = false;
            for (var i in self._pai.children) {
                var child = self._pai.children[i];
                child.isClicked = false;
                child.y = -9;
            }
        }
        if (self._youshi) {
            self._youshi.active = false;
        }
        self._complete.active = true;
        for (var i in self._complete.children) {
            self._complete.children[i].active = true;
        }
    },
    changeMoney: function(money) {
        if (!this._diff_money) return;
        var old_money = this._score;
        var diff_money = parseInt(money) - parseInt(old_money);
        if (diff_money > 0) {
            diff_money = "+" + diff_money;
        }
        this._diff_money.string = diff_money;
        this._diff_money.node.active = true;
        this._diff_money.node.opacity = 255;
        this.setMoney(money);
        var action = cc.fadeOut(2);
        this._diff_money.node.runAction(action);
    },
    showLastPai: function(spriteFrames, score) {
        var self = this;
        if (self._lastpai) {
            self._lastpai.active = true;
            for (var i in self._lastpai.children) {
                if (i <= 4) {
                    //牌
                    var pai = self._lastpai.children[i];
                    var paiObj = spriteFrames[i];
                    if (paiObj) {
                        //如果有资源则显示，没有则隐藏
                        pai.active = true;
                        self.setPai(pai, paiObj)
                    } else {
                        pai.active = false;
                    }
                } else if (i == 6) {
                    //结果，“十带一”之类
                    var jieguo = self._lastpai.children[i];
                    if (score) {
                        jieguo.active = true;
                        for (var j in jieguo.children) {
                            var temp = jieguo.children[j];
                            temp.active = false;
                        }
                        if (score[3] == '1') {
                            //没有牛
                            jieguo.getChildByName('san').active = true;
                        } else if (score[3] == '4') {
                            //单牛
                            var index = parseInt(score[0]);
                            jieguo.getChildByName('jg' + index).active = true;
                        } else if (score[3] == '5') {
                            //双牛
                            jieguo.getChildByName('jg0').active = true;
                        } else if (score[3] == '6') {
                            //炸弹
                            jieguo.getChildByName('zhadan').active = true;
                        } else if (score[3] == '7') {
                            //五花
                            jieguo.getChildByName('wuhua').active = true;
                        } else if (score[3] == '8') {
                            //五小
                            jieguo.getChildByName('wuxiao').active = true;
                        }
                    } else {
                        jieguo.active = false;
                    }
                }
            }
        }
        if (this._complete) {
            this._complete.active = false;
        }
    },
    hideLastPai: function() {
        if (this._lastpai) {
            this._lastpai.active = false;
        }
    },
    // called every frame, uncomment this function to activate update callback
    update: function(dt) {
        if (this._lastChatTime > 0) {
            this._lastChatTime -= dt;
            if (this._lastChatTime < 0) {
                this._chatBubble.active = false;
                this._emoji.active = false;
                this._emoji.getComponent(cc.Animation).stop();
            }
        }
        if (this._time > 0) {
            this._time -= dt;
            var pre = "";
            if (this._time < 0) {
                this._time = 0;
            }
            var t = Math.ceil(this._time);
            if (t < 10) {
                pre = "0";
            }
            this._timeLabel.string = pre + t;
        }
    },
});