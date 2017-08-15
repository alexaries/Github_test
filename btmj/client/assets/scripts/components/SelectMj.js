cc.Class({
    extends: cc.Component,
    properties: {
        btmj: cc.Node,
        whmj: cc.Node,
        jrfj: cc.Node,
        fhfj: cc.Node,
    },
    // use this for initialization
    onLoad: function() {
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
    initView: function() {},
    onBtnBack: function() {
        this.node.active = false;
    },
    initButtonHandler: function(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectMj", "onClickBtn");
    },
    onClickBtn: function(event) {
        switch (event.target.name) {
            case 'mj_join':
                cc.find("Canvas/JoinGame").active = true;
                break;
            case 'mj_back':
                this.onReturnGameClicked();
                break;
            case 'baotou':
                if (cc.vv.gameNetMgr.roomId) {
                    this.onReturnGameClicked();
                }else{
                    cc.find("Canvas/CreateRoom").active = true;
                }
                break;
            case 'wuhan':
                // cc.find("Canvas/JoinGame").active = true;
                break;
        }
    },
    onReturnGameClicked: function() {
        cc.director.loadScene("mjgame");
    },
    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {
    // },
});