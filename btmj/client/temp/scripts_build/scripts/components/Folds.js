"use strict";
cc._RFpush(module, '0bf63eiZEFMWbW03o8heqa5', 'Folds');
// scripts/components/Folds.js

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
        _folds: null
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this.initView();
        this.initEventHandler();
        this.initAllFolds();
    },
    initView: function initView() {
        this._folds = {};
        var game = this.node.getChildByName("game");
        var sides = ["myself", "right", "up", "left"];
        for (var i = 0; i < sides.length; ++i) {
            var sideName = sides[i];
            var sideRoot = game.getChildByName(sideName);
            var folds = [];
            var foldRoot = sideRoot.getChildByName("folds");
            for (var j = 0; j < foldRoot.children.length; ++j) {
                var n = foldRoot.children[j];
                n.active = false;
                var sprite = n.getComponent(cc.Sprite);
                sprite.spriteFrame = null;
                folds.push(sprite);
            }
            this._folds[sideName] = folds;
        }
        this.hideAllFolds();
    },
    hideAllFolds: function hideAllFolds() {
        for (var k in this._folds) {
            var f = this._folds[i];
            for (var i in f) {
                f[i].node.active = false;
            }
        }
    },
    initEventHandler: function initEventHandler() {
        var self = this;
        this.node.on('game_begin', function (data) {
            self.initAllFolds();
        });
        this.node.on('game_sync', function (data) {
            self.initAllFolds();
        });
        this.node.on('game_chupai_notify', function (data) {
            self.initFolds(data.detail);
        });
        this.node.on('guo_notify', function (data) {
            self.initFolds(data.detail);
        });
    },
    initAllFolds: function initAllFolds() {
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.initFolds(seats[i]);
        }
    },
    initFolds: function initFolds(seatData) {
        var folds = seatData.folds;
        if (folds == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var foldsSprites = this._folds[side];
        for (var i = 0; i < folds.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];
            this.setSpriteFrameByMJID(pre, sprite, folds[i]);
            if (side == "myself" && i == folds.length - 1) {
                //如果是最后一个
                var target_node = sprite.node;
                var old_x = target_node.x;
                var old_y = target_node.y;
                var pos = {
                    x: 0,
                    y: 0
                };
                var folds_diff_x = cc.find("Canvas/game/myself/folds").x;
                if (pos) {
                    target_node.x = pos.x / 0.8 - folds_diff_x / 0.8; //移到出牌位置
                    target_node.y = 70;
                    var action = cc.moveTo(0.2, cc.p(old_x, old_y));
                    target_node.runAction(action);
                }
            } else {
                sprite.node.active = true;
            }
        }
        for (var i = folds.length; i < foldsSprites.length; ++i) {
            var index = i;
            if (side == "right" || side == "up") {
                index = foldsSprites.length - i - 1;
            }
            var sprite = foldsSprites[index];
            sprite.spriteFrame = null;
            sprite.node.active = false;
        }
    },
    setSpriteFrameByMJID: function setSpriteFrameByMJID(pre, sprite, mjid) {
        sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
        sprite.node.active = true;
    }
});

cc._RFpop();