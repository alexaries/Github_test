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
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (!cc.vv) {
            return;
        }
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName("myself");
        var pengangroot = myself.getChildByName("penggangs");
        var realwidth = cc.director.getVisibleSize().width;
        var scale = realwidth / 1280;
        pengangroot.scaleX *= scale;
        pengangroot.scaleY *= scale;
        var self = this;
        this.node.on('peng_notify', function (data) {
            //刷新所有的牌
            console.log("peng_notify", data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        this.node.on('chi_notify', function (data) {
            //刷新所有的牌
            console.log("chi_notify-----penggang", data.detail);
            var data = data.detail;
            self.onPengGangChanged(data);
        });
        this.node.on('gang_notify', function (data) {
            //刷新所有的牌
            //console.log(data.detail);
            var data = data.detail;
            self.onPengGangChanged(data.seatData);
        });
        this.node.on('game_begin', function (data) {
            self.onGameBein();
        });
        var seats = cc.vv.gameNetMgr.seats;
        for (var i in seats) {
            this.onPengGangChanged(seats[i]);
        }
    },
    onGameBein: function onGameBein() {
        this.hideSide("myself");
        this.hideSide("right");
        this.hideSide("up");
        this.hideSide("left");
    },
    hideSide: function hideSide(side) {
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        if (pengangroot) {
            for (var i = 0; i < pengangroot.childrenCount; ++i) {
                pengangroot.children[i].active = false;
            }
        }
    },
    onPengGangChanged: function onPengGangChanged(seatData) {
        if (seatData.angangs == null && seatData.diangangs == null && seatData.wangangs == null && seatData.pengs == null && seatData.chis == null) {
            return;
        }
        var localIndex = cc.vv.gameNetMgr.getLocalIndex(seatData.seatindex);
        var side = cc.vv.mahjongmgr.getSide(localIndex);
        var pre = cc.vv.mahjongmgr.getFoldPre(localIndex);
        console.log("onPengGangChanged" + localIndex);
        var gameChild = this.node.getChildByName("game");
        var myself = gameChild.getChildByName(side);
        var pengangroot = myself.getChildByName("penggangs");
        for (var i = 0; i < pengangroot.childrenCount; ++i) {
            pengangroot.children[i].active = false;
        }
        //初始化杠牌
        var index = 0;
        var gangs = seatData.angangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "angang");
                index++;
            }
        }
        var gangs = seatData.diangangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "diangang");
                index++;
            }
        }
        var gangs = seatData.wangangs;
        if (gangs) {
            for (var i = 0; i < gangs.length; ++i) {
                var mjid = gangs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "wangang");
                index++;
            }
        }
        //初始化碰牌
        var pengs = seatData.pengs;
        if (pengs) {
            for (var i = 0; i < pengs.length; ++i) {
                var mjid = pengs[i];
                this.initPengAndGangs(pengangroot, side, pre, index, mjid, "peng");
                index++;
            }
        }
        // 吃的牌一定要以数组的形式存放,类似[[1,2,3],[3,4,5]];
        //初始化吃牌
        var chis = seatData.chis;
        console.debug("显示吃牌操作", chis);
        if (chis) {
            console.debug("吃的", chis.length);
            for (var i = 0; i < chis.length; ++i) {
                var mjids = chis[i];
                this.initChis(pengangroot, side, pre, index, mjids);
                index++;
            }
        }
    },
    initPengAndGangs: function initPengAndGangs(pengangroot, side, pre, index, mjid, flag) {
        console.info("initPengAndGangs", pengangroot, side, pre, index, mjid, flag);
        var pgroot = null;
        if (pengangroot.childrenCount <= index) {
            if (side == "left" || side == "right") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            pengangroot.addChild(pgroot);
        } else {
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        if (side == "left") {
            pgroot.y = -(index * 25 * 3);
        } else if (side == "right") {
            pgroot.y = index * 25 * 3;
            pgroot.setLocalZOrder(-index);
        } else if (side == "myself") {
            pgroot.x = index * 55 * 3 + index * 10;
        } else {
            pgroot.x = -(index * 55 * 3);
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                var isGang = flag != "peng";
                sprite.node.active = isGang;
                sprite.node.scaleX = 1.0;
                sprite.node.scaleY = 1.0;
                if (flag == "angang") {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getEmptySpriteFrame(side);
                    if (side == "myself" || side == "up") {
                        sprite.node.scaleX = 1.4;
                        sprite.node.scaleY = 1.4;
                    }
                } else {
                    sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
                }
            } else {
                sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjid);
            }
        }
    },
    // 吃牌
    initChis: function initChis(pengangroot, side, pre, index, mjids) {
        console.debug("initChis", mjids);
        var pgroot = null;
        if (pengangroot.childrenCount <= index) {
            if (side == "left" || side == "right") {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabLeft);
            } else {
                pgroot = cc.instantiate(cc.vv.mahjongmgr.pengPrefabSelf);
            }
            pengangroot.addChild(pgroot);
        } else {
            pgroot = pengangroot.children[index];
            pgroot.active = true;
        }
        if (side == "left") {
            pgroot.y = -(index * 25 * 3);
        } else if (side == "right") {
            pgroot.y = index * 25 * 3;
            pgroot.setLocalZOrder(-index);
        } else if (side == "myself") {
            pgroot.x = index * 55 * 3 + index * 10;
        } else {
            pgroot.x = -(index * 55 * 3);
        }
        var sprites = pgroot.getComponentsInChildren(cc.Sprite);
        for (var s = 0; s < sprites.length; ++s) {
            var sprite = sprites[s];
            if (sprite.node.name == "gang") {
                sprite.node.active = false;
            }
            sprite.spriteFrame = cc.vv.mahjongmgr.getSpriteFrameByMJID(pre, mjids[s]);
        }
    }
});