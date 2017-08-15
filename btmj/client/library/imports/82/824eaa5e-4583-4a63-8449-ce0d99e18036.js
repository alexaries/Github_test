"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        _groups: null
    },
    // use this for initialization
    init: function init() {
        this._groups = {};
    },
    add: function add(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            buttons = [];
            this._groups[groupId] = buttons;
        }
        buttons.push(radioButton);
    },
    del: function del(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            return;
        }
        var idx = buttons.indexOf(radioButton);
        if (idx != -1) {
            buttons.splice(idx, 1);
        }
        if (buttons.length == 0) {
            delete this._groups[groupId];
        }
    },
    check: function check(radioButton) {
        var groupId = radioButton.groupId;
        var buttons = this._groups[groupId];
        if (buttons == null) {
            return;
        }
        for (var i = 0; i < buttons.length; ++i) {
            var btn = buttons[i];
            if (btn == radioButton) {
                btn.check(true);
            } else {
                btn.check(false);
            }
        }
    }
});