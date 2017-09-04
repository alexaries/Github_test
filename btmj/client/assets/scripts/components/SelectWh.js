cc.Class({
    extends: cc.Component,
    properties: {
        whmj: cc.Node,
        jrfj: cc.Node,
        fhfj: cc.Node,
    },
    // use this for initialization
    onLoad: function() {
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
    initView: function() {},
    onBtnBack: function() {
        this.node.active = false;
    },
    initButtonHandler: function(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectWh", "onClickBtn");
    },
    onClickBtn: function(event) {
        switch (event.target.name) {
            case 'mj_join':
                cc.vv.mjType_joinGame = 5;
                cc.find("Canvas/JoinGame").active = true;
                break;
            case 'mj_back':
                this.onReturnGameClicked();
                break;
            case 'wuhan':
                if (cc.vv.gameNetMgr.roomId) {
                    this.onReturnGameClicked();
                } else {
                    cc.find("Canvas/CreateRoomWh").active = true;
                }
                break;
        }
    },
    onReturnGameClicked: function() {
        // cc.director.loadScene("whmj");
        this.node.active = false;
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});