"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        btmj: cc.Node,
        whmj: cc.Node,
        jrfj: cc.Node,
        fhfj: cc.Node
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.btmj);
        this.initButtonHandler(this.whmj);
        this.initButtonHandler(this.jrfj);
        this.initButtonHandler(this.fhfj);
        if (cc.vv.gameNetMgr.roomId) {
            this.jrfj.active = false;
            this.fhfj.active = true;
        } else {
            this.jrfj.active = true;
            this.fhfj.active = false;
        }
    },
    initView: function initView() {},
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectMj", "onClickBtn");
    },
    onClickBtn: function onClickBtn(event) {
        switch (event.target.name) {
            case 'mj_join':
                cc.vv.mjType_joinGame = 0;
                cc.find("Canvas/JoinGame").active = true;
                break;
            case 'mj_back':
                this.onReturnGameClicked();
                break;
            case 'baotou':
                if (cc.vv.gameNetMgr.roomId) {
                    this.onReturnGameClicked();
                } else {
                    cc.find("Canvas/CreateRoom").active = true;
                }
                break;
            case 'wuhan':
                // cc.find("Canvas/JoinGame").active = true;
                break;
        }
    },
    onReturnGameClicked: function onReturnGameClicked() {
        cc.director.loadScene("mjgame");
    }
});