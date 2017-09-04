"use strict";
cc._RFpush(module, '0ecea6X+IFIK5XFdJe38hXa', 'MahjongMgr');
// scripts/MahjongMgr.js

"use strict";

var mahjongSprites = [];
cc.Class({
    extends: cc.Component,
    properties: {
        leftAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        rightAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        bottomAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        bottomFoldAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        pengPrefabSelf: {
            default: null,
            type: cc.Prefab
        },
        pengPrefabLeft: {
            default: null,
            type: cc.Prefab
        },
        emptyAtlas: {
            default: null,
            type: cc.SpriteAtlas
        },
        holdsEmpty: {
            default: [],
            type: [cc.SpriteFrame]
        },
        _sides: null,
        _pres: null,
        _foldPres: null
    },
    onLoad: function onLoad() {
        if (cc.vv == null) {
            return;
        }
        this._sides = ["myself", "right", "up", "left"];
        this._pres = ["M_", "R_", "B_", "L_"];
        this._foldPres = ["B_", "R_", "B_", "L_"];
        cc.vv.mahjongmgr = this;
        //筒
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("dot_" + i);
        }
        //条
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("bamboo_" + i);
        }
        //万
        for (var i = 1; i < 10; ++i) {
            mahjongSprites.push("character_" + i);
        }
        //东南西北风
        mahjongSprites.push("wind_east");
        mahjongSprites.push("wind_south");
        mahjongSprites.push("wind_west");
        mahjongSprites.push("wind_north");
        //中、发、白
        mahjongSprites.push("red");
        mahjongSprites.push("green");
        mahjongSprites.push("white");
        //春夏秋冬 
        mahjongSprites.push("spring");
        mahjongSprites.push("summer");
        mahjongSprites.push("autumn");
        mahjongSprites.push("winter");
        //兰竹菊梅
        mahjongSprites.push("orchid"); //兰
        mahjongSprites.push("bamboo"); //竹
        mahjongSprites.push("chrysanthemum"); //菊       
        mahjongSprites.push("plum"); //梅            
    },
    getMahjongSpriteByID: function getMahjongSpriteByID(id) {
        return mahjongSprites[id];
    },
    getMahjongType: function getMahjongType(id) {
        if (id >= 0 && id < 9) {
            //筒
            return 0;
        } else if (id >= 9 && id < 18) {
            //条
            return 1;
        } else if (id >= 18 && id < 27) {
            //万
            return 2;
        } else if (id >= 27 && id < 34) {
            //字一（东西南北中发白）
            return 3;
        } else if (id >= 34 && id < 42) {
            //花一（春夏秋冬兰竹菊梅）
            return 4;
        }
    },
    getSpriteFrameByMJID: function getSpriteFrameByMJID(pre, mjid) {
        var spriteFrameName = this.getMahjongSpriteByID(mjid);
        spriteFrameName = pre + spriteFrameName;
        if (pre == "M_") {
            return this.bottomAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "B_") {
            return this.bottomFoldAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "L_") {
            return this.leftAtlas.getSpriteFrame(spriteFrameName);
        } else if (pre == "R_") {
            return this.rightAtlas.getSpriteFrame(spriteFrameName);
        }
    },
    // 出牌声音对应id只有筒条万和东西南北中发白才有声音
    getAudioURLByMJID: function getAudioURLByMJID(id) {
        var paitype = this.getMahjongType(id);
        console.log("牌的类型是:" + paitype);
        if (paitype >= 0 && paitype < 4) {
            return "nv/" + id + ".mp3";
        } else {
            return null;
        }
    },
    getEmptySpriteFrame: function getEmptySpriteFrame(side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_up");
        } else if (side == "myself") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_bottom");
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_b_right");
        }
    },
    getHoldsEmptySpriteFrame: function getHoldsEmptySpriteFrame(side) {
        if (side == "up") {
            return this.emptyAtlas.getSpriteFrame("e_mj_up");
        } else if (side == "myself") {
            return null;
        } else if (side == "left") {
            return this.emptyAtlas.getSpriteFrame("e_mj_left");
        } else if (side == "right") {
            return this.emptyAtlas.getSpriteFrame("e_mj_right");
        }
    },
    sortMJ: function sortMJ(mahjongs) {
        var self = this;
        mahjongs.sort(function (a, b) {
            return a - b;
        });
    },
    getSide: function getSide(localIndex) {
        return this._sides[localIndex];
    },
    getPre: function getPre(localIndex) {
        return this._pres[localIndex];
    },
    getFoldPre: function getFoldPre(localIndex) {
        return this._foldPres[localIndex];
    }
});

cc._RFpop();