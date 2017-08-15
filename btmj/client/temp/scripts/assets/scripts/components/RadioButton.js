"use strict";
cc._RFpush(module, '8d571y2U+9AiKntO+TSf0Fb', 'RadioButton');
// scripts/components/RadioButton.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

cc.Class({
    extends: cc.Component,
    properties: {
        target: cc.Node,
        sprite: cc.SpriteFrame,
        checkedSprite: cc.SpriteFrame,
        checked: false,
        groupId: -1
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        if (cc.vv.radiogroupmgr == null) {
            var RadioGroupMgr = require("RadioGroupMgr");
            cc.vv.radiogroupmgr = new RadioGroupMgr();
            cc.vv.radiogroupmgr.init();
        }
        console.log(_typeof(cc.vv.radiogroupmgr.add));
        cc.vv.radiogroupmgr.add(this);
        this.refresh();
    },
    refresh: function refresh() {
        var targetSprite = this.target.getComponent(cc.Sprite);
        if (this.checked) {
            targetSprite.spriteFrame = this.checkedSprite;
        } else {
            targetSprite.spriteFrame = this.sprite;
        }
    },
    check: function check(value) {
        this.checked = value;
        this.refresh();
    },
    onClicked: function onClicked() {
        cc.vv.radiogroupmgr.check(this);
    },
    onDestroy: function onDestroy() {
        if (cc.vv && cc.vv.radiogroupmgr) {
            cc.vv.radiogroupmgr.del(this);
        }
    }
});

cc._RFpop();