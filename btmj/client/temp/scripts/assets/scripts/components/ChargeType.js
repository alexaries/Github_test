"use strict";
cc._RFpush(module, '13f26e/5eVFWbY53112nuHF', 'ChargeType');
// scripts/components/ChargeType.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _charge: null,
        // 标题
        _title: null,
        // 确认按钮
        _btnOK: null,
        // 取消按钮
        _btnCancel: null,
        // 输入框
        _editbox: null,
        // 显示输入的金币数量
        _content: null,
        // 显示兑换率
        _rateTxt: null,
        _chargeCnt: null,
        _rate: 1,
        _costRMB: 0,
        // 最少充值数量
        _MINCOST: 1,
        _MAXCOSTRMB: 99999,
        _payParam: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initUI();
        //FIXME:  当前的兑换率是
        this.refreshInfo();
        cc.vv.chargeType = this;
    },
    initUI: function initUI() {
        this._charge = cc.find("Canvas/zuanshiChange");
        this._btnOK = cc.find("Canvas/zuanshiChange/yes").getComponent(cc.Button);
        this._btnCancel = cc.find("Canvas/zuanshiChange/no").getComponent(cc.Button);
        this._editbox = cc.find("Canvas/zuanshiChange/editbox").getComponent(cc.EditBox);
    },
    onCloseBtnClicked: function onCloseBtnClicked() {
        console.log("关闭界面");
        this._editbox.string = "";
        this._charge.active = false;
        cc.vv.wc.hide();
    },
    onConfirmBtnClicked: function onConfirmBtnClicked() {
        this.refreshInfo();
        // 验证是不是整数，不是整数要求重新输入
        console.log("金额是", this._costRMB);
        var flag = this.validateIntNum(this._costRMB);
        if (!flag) {
            var str = "请输入整数金额,且最小充值金额" + this._MINCOST + "元";
            cc.vv.alert.show("注意", str);
        } else {
            var fn = function fn(ret) {
                cc.vv.wc.hide();
                if (ret == null) {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    return;
                }
                this.sendChargeRequest(ret);
                cc.vv.wc.show("正在充值，请稍后");
                cc.vv.userMgr.refreshTime = 2000;
            };
            var data = {
                account: cc.vv.userMgr.account,
                sign: cc.vv.userMgr.sign,
                userid: cc.vv.userMgr.userId,
                costRMB: this._costRMB,
                ship_type: 1
            };
            cc.vv.wc.show("正在充值，请稍后");
            cc.vv.http.sendRequest("/go_to_charge", data, fn.bind(this));
        }
    },
    show: function show() {
        this._charge.active = true;
    },
    refreshInfo: function refreshInfo() {
        this._rate = 1 || cc.vv.userMgr.chargerate;
        this._costRMB = Number(this._editbox.string);
        console.log('this.cost', this._costRMB);
        // this._chargeCnt = (this._chargeCnt * this._rate).toFixed(0);
        // if (!this._costRMB) {
        //     this._content.string = "您当前未输入充值金额";
        // } else {
        //     this._content.string = "您输入的金额是:" + this._costRMB;
        // }
    },
    // 判断是不是输入的正确的金额
    validateIntNum: function validateIntNum(val) {
        var patten = /^[1-9]\d*$/;
        var flag = patten.test(val);
        if (!flag) {
            return false;
        } else {
            console.log("当前输入的数字是正整数", val, this._MINCOST);
            return val >= this._MINCOST;
        }
    },
    // 发送申请充值请求
    sendChargeRequest: function sendChargeRequest(data) {
        if (data == null) {
            cc.vv.alert.show("注意", "充值失败请稍后重试");
            return;
        }
        console.log("发送 充值请求");
        var url = data.url;
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("POST", url, true);
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <= 207) {
                var httpStatus = xhr.statusText;
                var response = JSON.parse(xhr.responseText);
                console.log("返回！！！！！" + response.errmsg + "response.errcode:" + response.errcode);
                if (response.errcode == 0) {
                    var ret = response.errmsg;
                    console.log("返回的结果是!!!!!!" + ret);
                    this._payParam = ret;
                    if (!cc.sys.isNative) {
                        console.log("是H5游戏");
                        window.pay(this._payParam);
                    }
                    // 接收完后，隐藏充值窗口
                    this.onCloseBtnClicked();
                } else {
                    cc.vv.alert.show("注意", "充值失败请稍后重试");
                    cc.vv.wc.hide();
                    console.log("返回的结果出错");
                }
            } else {
                console.log("无结果返回");
            }
        }.bind(this);
        xhr.timeout = 5000; // 5 seconds for timeout
        var req = JSON.stringify(data);
        xhr.send(req);
    }
});

cc._RFpop();