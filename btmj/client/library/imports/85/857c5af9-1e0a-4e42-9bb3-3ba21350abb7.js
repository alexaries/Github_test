"use strict";

cc.Class({
    extends: cc.Component,
    properties: {},
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._btnClose = this.node.getChildByName("btnClose"); //返回按钮
        this._zjhmatch = this.node.getChildByName("zjhmatch"); //扎金花界面
        this._dnmatch = this.node.getChildByName("dnmatch"); //斗牛界面
        this._mjmatch = this.node.getChildByName("mjmatch"); //麻将界面
        this._detail = this.node.getChildByName('detail'); //比赛详情界面
        this._detail_rule = this._detail.getChildByName('rule'); //规则详情
        this._detail_reward = this._detail.getChildByName('reward'); //奖励详情
        this._detail_record = this._detail.getChildByName('record'); //战绩详情
        cc.vv.utils.addClickEvent(this._btnClose, this.node, "Jbs", "onBtnClose");
        this.initEventWanfa(this._zjhmatch);
        this.initEventWanfa(this._dnmatch);
        this.initEventWanfa(this._mjmatch);
        this.initEventDetail(this._detail_rule);
        this.initEventDetail(this._detail_reward);
        this.initEventDetail(this._detail_record);
    },
    onBtnClose: function onBtnClose() {
        this.node.active = false;
    },
    onBtnWanfa: function onBtnWanfa(event) {
        var name = event.target.name;
        name = name.replace("jbs_", "");
        if (name.indexOf("_") > -1) {
            //可点击
            name = name.replace("_", "");
            switch (name) {
                case 'dou':
                    //斗牛
                    this._dnmatch.active = true;
                    break;
                case 'ma':
                    //麻将
                    this._mjmatch.active = true;
                    break;
                case 'zha':
                    //扎金花
                    this._zjhmatch.active = true;
                    break;
            }
            //隐藏当前panel
            event.target.parent.parent.active = false;
        }
    },
    onBtnDetailChange: function onBtnDetailChange(event) {
        var name = event.target.name;
        name = name.replace("_button", "");
        this._detail_rule.active = false;
        this._detail_reward.active = false;
        this._detail_record.active = false;

        switch (name) {
            case 'rule':
                //规则
                this._detail_rule.active = true;
                break;
            case 'reward':
                //奖励
                this._detail_reward.active = true;
                break;
            case 'record':
                //战绩
                this._detail_record.active = true;
                break;
        }
    },
    onBtnBaoMing: function onBtnBaoMing(event) {
        var self = this;
        var btn = event.target;
        var match_data = btn.data;
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId,
            match_id: match_data['id']
        };
        cc.vv.http.sendRequest("/jinbiao_room", send_data, function (ret) {
            if (!ret || ret.errcode != 0) {
                if (ret.errmsg) {
                    cc.vv.alert.show('注意', ret.errmsg);
                } else {
                    cc.vv.alert.show('注意', '报名失败，不满足报名条件');
                }
                return;
            };
            //刷新客户端金币和钻石
            cc.vv.userMgr.getGemsAndCoins(function (data) {
                cc.vv.userMgr.gems = data.gems;
                cc.vv.userMgr.coins = data.coins;
            });
            var connect_data = {
                ip: ret.ip,
                port: ret.port
            };
            cc.vv.gameNetMgr.connectMatchServer(connect_data, match_data);
            self.node.active = false; //报名后，自动隐藏报名界面，用于再次打开的时候可以刷新数据
        });
    },
    //退赛按钮
    onBtnTuiSai: function onBtnTuiSai(event) {
        var self = this;
        var match_id = event.target.data['match_id'];
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId,
            match_id: match_id
        };
        cc.vv.http.sendRequest("/tuisai", send_data, function (ret) {
            if (!ret || ret.errcode != 0) {
                if (ret.errmsg) {
                    cc.vv.alert.show('注意', ret.errmsg);
                } else {
                    cc.vv.alert.show('注意', '退赛失败');
                }
                return;
            };

            //刷新客户端金币和钻石
            cc.vv.userMgr.getGemsAndCoins(function (data) {
                cc.vv.userMgr.gems = data.gems;
                cc.vv.userMgr.coins = data.coins;
            });
            var connect_data = {
                ip: ret.ip,
                port: ret.port
            };
            self._detail.active = false;
            self.node.active = false; //报名后，自动隐藏报名界面，用于再次打开的时候可以刷新数据
            cc.vv.alert.show('提示', '退赛成功，80%报名费已返还！');
        });
    },
    //顶部按钮切换页面
    initEventWanfa: function initEventWanfa(target) {
        var children = target.getChildByName('jbs_wanfa').children;
        var hasMaJiang = true;
        if (cc.vv.userMgr.modules && cc.vv.userMgr.modules.indexOf(2) == -1) {
            //没有麻将
            hasMaJiang = false;
        }
        for (var i in children) {
            var child = children[i];
            if (!hasMaJiang && child.name.indexOf('jbs_ma') > -1) {
                //如果不包含麻将，就隐藏麻将按钮
                child.active = false;
            }
            cc.vv.utils.addClickEvent(child, this.node, "Jbs", "onBtnWanfa", true);
        }
    },
    //详情顶部按钮切换
    initEventDetail: function initEventDetail(target) {
        var rule_button = target.getChildByName('rule_button');
        var reward_button = target.getChildByName('reward_button');
        var record_button = target.getChildByName('record_button');
        cc.vv.utils.addClickEvent(rule_button, this.node, "Jbs", "onBtnDetailChange", true);
        cc.vv.utils.addClickEvent(reward_button, this.node, "Jbs", "onBtnDetailChange", true);
        cc.vv.utils.addClickEvent(record_button, this.node, "Jbs", "onBtnDetailChange", true);
    },
    //刷新报名界面数据
    freshMatch: function freshMatch(matchDatas) {
        var self = this;
        if (!matchDatas) return;
        for (var i in matchDatas) {
            var matchData = matchDatas[i];
            var target = null;
            switch (i) {
                case 'zha':
                    target = self._zjhmatch;
                    break;
                case 'dou':
                    target = self._dnmatch;
                    break;
                case 'ma':
                    target = self._mjmatch;
                    break;
            }
            var content = target.getChildByName('scrollview').getChildByName('view').getChildByName('content');
            for (var j in matchData) {
                var data = matchData[j];
                var list = content.children[j];
                var info = list.getChildByName('info');
                info.getChildByName('label').getComponent(cc.Label).string = data.name; //比赛名称

                var layout = list.getChildByName('layout');
                layout.data = data;
                cc.vv.utils.addClickEvent(layout, self.node, "Jbs", "showBaoMingDetail", true); //给报名信息添加点击事件，显示详细信息

                var num_in_match = 13;
                if (data['num_in_match'] != null && typeof data['num_in_match'] != 'undefined') {
                    num_in_match = data['num_in_match'];
                    num_in_match = parseInt(num_in_match) % parseInt(data.enterNum);
                }
                info.getChildByName('hasEnter').getChildByName('num').getComponent(cc.Label).string = num_in_match + '人'; //已经加入的人数
                info.getChildByName('enough').getComponent(cc.Label).string = '满' + data.enterNum + '人开赛';

                var baoming_btn = list.getChildByName('button'); //报名按钮
                baoming_btn.data = data;
                cc.vv.utils.addClickEvent(baoming_btn, self.node, "Jbs", "onBtnBaoMing", true); //给报名按钮添加点击事件
                baoming_btn.getChildByName('label').getComponent(cc.Label).string = data.fee; //显示报名费

                var yibaoming_btn = list.getChildByName('yibaoming'); //已报名按钮
                yibaoming_btn.getChildByName('label').getComponent(cc.Label).string = data.fee; //显示报名费

                var is_ing = num_in_match == data.enterNum;
                var jbs_ing = list.getChildByName('jbs_ing');
                var is_bao_ming = data['is_bao_ming'];
                if (is_bao_ming) {
                    baoming_btn.active = false;
                    jbs_ing.active = false;
                    yibaoming_btn.active = true;
                } else {
                    baoming_btn.active = true;
                    yibaoming_btn.active = false;
                    jbs_ing.active = false;
                }
            }
        }
    },
    showMatchList: function showMatchList(matchData) {
        this.node.active = true;
        console.log('matchData', matchData);

        this.freshMatch(matchData);
    },
    showBaoMingDetail: function showBaoMingDetail(event) {
        var data = event.target.data;
        console.log('showDetails===>', data);
        if (data) {
            this._detail.active = true;
            var view = this._detail_rule.getChildByName('scrollview').getChildByName('view');
            var rule_content = view.getChildByName('rule_content');
            var num = rule_content.getChildByName('num');
            var fee = rule_content.getChildByName('fee');
            var description = rule_content.getChildByName('description');
            num.getComponent(cc.Label).string = "开赛人数：" + data.enterNum + "人";
            var fee_type;
            if (data.feeType == 2) {
                fee_type = "钻石";
            } else {
                fee_type = "金币";
            }
            fee.getComponent(cc.Label).string = "报名费用：" + data.fee + fee_type;
            // description.getComponent(cc.Label).string = 
            var reward_view = this._detail_reward.getChildByName('scrollview').getChildByName('view');
            var info = reward_view.getChildByName('content').getChildByName('info');
            var first = info.getChildByName('first').getChildByName('reward');
            first.getComponent(cc.Label).string = data.rewardFirst + fee_type;

            var second = info.getChildByName('second');
            if (data.rewardSecond) {
                second.active = true;
                var second_reward = second.getChildByName('reward');
                second_reward.getComponent(cc.Label).string = data.rewardSecond + fee_type;
            } else {
                second.active = false;
            }

            var third = info.getChildByName('third');
            if (data.rewardThird) {
                third.active = true;
                var third_award = third.getChildByName('reward');
                third_award.getComponent(cc.Label).string = data.rewardThird + fee_type;
            } else {
                third.active = false;
            }

            var tuisai_btn = this._detail_rule.getChildByName('jbs_tuisai');
            if (data.is_bao_ming && data.num_in_match != data.enterNum) {
                cc.vv.utils.addClickEvent(tuisai_btn, this.node, "Jbs", "onBtnTuiSai", true);
                tuisai_btn.active = true;
                tuisai_btn.data = {
                    match_id: data.id
                };
            } else {
                tuisai_btn.active = false;
            }
        }
    },
    hideBaoMingDetail: function hideBaoMingDetail() {
        this._detail.active = false;
    }
});