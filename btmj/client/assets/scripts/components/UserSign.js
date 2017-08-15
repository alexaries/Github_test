cc.Class({
    extends: cc.Component,
    properties: {
        _DayListV: null,
        _sign: null,
        _btn_sign: null,
        _btn_signed: null,
        _isShowView: false,
        _time: null,
    },
    // use this for initialization
    onLoad: function() {
        this._sign = cc.find("Canvas/sign");
        this._btn_sign = this._sign.getChildByName("btn_sign");
        this._btn_signed = this._sign.getChildByName("btn_signed");
        this._time = this._sign.getChildByName("time");
        this._DayListV = new Array();
        for (var i = 0; i < 7; i++) {
            var path = "day" + (i + 1);
            this._DayListV.push(this._sign.getChildByName(path));
        }
        this._isShowView = (cc.vv.userMgr.is_sign == 0);
        this.initSignData();
    },
    initSignData: function() {
         var self = this;
        if (this._isShowView) {
            //签到按钮不可点击
            this._time.getComponent(cc.Label).string = "已登录" + cc.vv.userMgr.sign_days + "天";
            this._btn_sign.active = (cc.vv.userMgr.sign_days < 6 && cc.vv.userMgr.is_sign == 0);
            this._btn_signed.active = (cc.vv.userMgr.sign_days < 6 && cc.vv.userMgr.is_sign == 1);
            // this._btn_sign.getComponent(cc.Button).interactable = (cc.vv.userMgr.is_sign == 0);
            cc.vv.userMgr.getSignList(function(data) {
                console.log("------initSignData------->>", data);
                if (data) {
                    for (var i = 0; i < data.length; i++) {
                        var d = data[i];
                        var view = self._DayListV[i];
                        if (view) {
                            var name = view.getChildByName("name").getComponent(cc.Label);
                            name.string = d.name + "×" + d.amount;
                            var signed = view.getChildByName("signed");
                            if (signed) {
                                if (cc.vv.userMgr.sign_days > i) {
                                    signed.active = true;
                                    if(i == data.length - 1 && cc.vv.userMgr.sign_days > 6 && cc.vv.userMgr.is_sign == 0){
                                        signed.active = false;
                                    }
                                }
                            }
                            var btn_sign = view.getChildByName("btn_sign");
                            if (btn_sign) {
                                btn_sign.active = (cc.vv.userMgr.sign_days >= 6 && cc.vv.userMgr.is_sign == 0);
                                // btn_sign.getComponent(cc.Button).interactable = (cc.vv.userMgr.is_sign == 0);
                            }
                        }
                    }
                    self._sign.active = self._isShowView;
                }
            });
        }else{
            self._sign.active = self._isShowView;
        }
    },
    //签到
    onSignBtnClicked: function() {
        if (cc.vv.userMgr.is_sign == 0) {
            var self = this;
            cc.vv.userMgr.setUserSign(function(data) {
                if (data) {
                    cc.vv.userMgr.is_sign = 1;
                    cc.vv.userMgr.sign_days++;
                    if (data.type == 1) {
                        cc.vv.userMgr.gems += data.amount;
                    }
                    self.initSignData();
                }
            });
        } else {
            cc.vv.alert.show("提示", "今日已签到!");
        }
    },
    onCloseBtnClicked: function() {
        this._sign.active = false;
        this._isShowView = false;
    },
});