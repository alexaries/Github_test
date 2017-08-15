cc.Class({
    extends: cc.Component,
    properties: {
        bthLQ1: cc.Node,
        bthLQ2: cc.Node,
        bthLQ3: cc.Node,
        bthLQ4: cc.Node,
        bthSC1: cc.Node,
        bthSC2: cc.Node,
        left_content: cc.Node,
        right_content: cc.Node,
        ima1: {
            type: cc.SpriteFrame,
            default: null
        },
        ima2: {
            type: cc.SpriteFrame,
            default: null
        },
    },
    // use this for initialization
    onLoad: function() {
        cc.vv.utils.addClickEvent(this.bthLQ1, this.node, "Collapse", "onBtnLq");
        cc.vv.utils.addClickEvent(this.bthLQ3, this.node, "Collapse", "onBtnLq");
        for (var i = 0; i < this.left_content.children.length; i++) {
            cc.vv.utils.addClickEvent(this.left_content.children[i], this.node, "Collapse", "onBtnSwitch");
        };
    },
    onBtnSwitch: function(event) {
        for (var i = 0; i < this.left_content.children.length; i++) {
            if (i == event.target.getSiblingIndex()) {
                this.left_content.children[i].getComponent("cc.Sprite").spriteFrame = this.ima1;
                this.right_content.children[i].active = true;
            } else {
                this.left_content.children[i].getComponent("cc.Sprite").spriteFrame = this.ima2;
                this.right_content.children[i].active = false;
            }
        }
    },
    refreshBtns: function() {
        if (cc.vv.userMgr.collapse_prise >= 2) {
            this.bthLQ1.active = false;
            this.bthLQ2.active = true;
            this.bthLQ3.active = false;
            this.bthLQ4.active = true;
        } else {
            if (cc.vv.userMgr.collapse_prise == 1) {
                if (parseInt(cc.vv.userMgr.gems) < 10000) {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = true;
                    this.bthLQ4.active = false;
                } else {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                }
            }
            if (cc.vv.userMgr.collapse_prise <= 0) {
                if (parseInt(cc.vv.userMgr.gems) < 10000) {
                    this.bthLQ1.active = true;
                    this.bthLQ2.active = false;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                } else {
                    this.bthLQ1.active = false;
                    this.bthLQ2.active = true;
                    this.bthLQ3.active = false;
                    this.bthLQ4.active = true;
                }
            }
        }
        if(cc.vv.userMgr.is_first_charge == 1){
            this.bthSC1.active = true;
            this.bthSC2.active = false;
        }else{
            this.bthSC1.active = false;
            this.bthSC2.active = true;
        }
    },
    onBtnLq: function() {
        var self = this;
        var fn = function(ret) {
            if (ret.errcode == 0) {
                cc.vv.userMgr.gems = ret.gems;
                cc.vv.userMgr.coins = ret.coins;
                cc.vv.userMgr.collapse_prise = ret.collapse_prise;
            }
            self.refreshBtns();
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_collapse", data, fn);
    },
    onBtnSC: function() {
        var self = this;
        var fn = function(ret) {
            if (ret.errcode == 0) {
                cc.vv.userMgr.gems = ret.gems;
                cc.vv.userMgr.coins = ret.coins;
                cc.vv.userMgr.is_first_charge = ret.is_first_charge;
            }
            self.refreshBtns();
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_first_charge", data, fn);
    },
    update: function(dt) {},
});