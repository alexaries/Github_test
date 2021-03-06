"use strict";
cc._RFpush(module, '98d344IgLdDe4VDjl3EBUP+', 'whGameResult');
// scripts/wh/whGameResult.js

"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        // foo: {
        //    default: null,
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        _gameresult: null,
        _seats: []
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._gameresult = this.node.getChildByName("game_result");
        //this._gameresult.active = false;
        var seats = this._gameresult.getChildByName("seats");
        for (var i = 0; i < seats.children.length; ++i) {
            this._seats.push(seats.children[i].getComponent("Seat"));
        }
        var btnClose = cc.find("Canvas/game_result/btnClose");
        if (btnClose) {
            cc.vv.utils.addClickEvent(btnClose, this.node, "GameResult", "onBtnCloseClicked");
        }
        var btnShare = cc.find("Canvas/game_result/btnShare");
        if (btnShare) {
            cc.vv.utils.addClickEvent(btnShare, this.node, "GameResult", "onBtnShareClicked");
        }
        //初始化网络事件监听器
        var self = this;
        this.node.on('game_end', function (data) {
            self.onGameEnd(data.detail);
        });
    },
    showResult: function showResult(seat, info, isZuiJiaPaoShou) {
        seat.node.getChildByName("zuijiapaoshou").active = isZuiJiaPaoShou;
        seat.node.getChildByName("zimocishu").getComponent(cc.Label).string = info.numzimo;
        seat.node.getChildByName("jiepaocishu").getComponent(cc.Label).string = info.numjiepao;
        seat.node.getChildByName("dianpaocishu").getComponent(cc.Label).string = info.numdianpao;
        seat.node.getChildByName("angangcishu").getComponent(cc.Label).string = info.numangang;
        seat.node.getChildByName("minggangcishu").getComponent(cc.Label).string = info.numminggang;
        // seat.node.getChildByName("chajiaocishu").getComponent(cc.Label).string = info.numchadajiao;
    },
    onGameEnd: function onGameEnd(endinfo) {
        var seats = cc.vv.gameNetMgr.seats;
        var maxscore = -1;
        var maxdianpao = 0;
        var dianpaogaoshou = -1;
        for (var i = 0; i < seats.length; ++i) {
            var seat = seats[i];
            if (seat.score > maxscore) {
                maxscore = seat.score;
            }
            if (endinfo[i].numdianpao > maxdianpao) {
                maxdianpao = endinfo[i].numdianpao;
                dianpaogaoshou = i;
            }
        }
        for (var i = 0; i < seats.length; ++i) {
            var seat = seats[i];
            var isBigwin = false;
            if (seat.score > 0) {
                isBigwin = seat.score == maxscore;
            }
            this._seats[i].setInfo(seat.name, seat.score, isBigwin);
            this._seats[i].setID(seat.userid);
            var isZuiJiaPaoShou = dianpaogaoshou == i;
            this.showResult(this._seats[i], endinfo[i], isZuiJiaPaoShou);
        }
    },
    onBtnCloseClicked: function onBtnCloseClicked() {
        //刷新客户端金币和钻石
        cc.vv.userMgr.getGemsAndCoins(function (data) {
            cc.vv.userMgr.gems = data.gems;
            cc.vv.userMgr.coins = data.coins;
        });
        cc.director.loadScene("newhall");
    },
    onBtnShareClicked: function onBtnShareClicked() {
        cc.vv.share.show();
        // cc.vv.anysdkMgr.shareResult();
    }
});

cc._RFpop();