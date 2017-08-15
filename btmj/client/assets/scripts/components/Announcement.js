cc.Class({
    extends: cc.Component,
    properties: {
        ima1: {
            type: cc.SpriteFrame,
            default: null
        },
        ima2: {
            type: cc.SpriteFrame,
            default: null
        },
        lContent: cc.Node,
        rContent: cc.Node,
    },
    onLoad: function() {},
    onBtnSwitch: function(event) {
        for (var i = 0; i < this.lContent.children.length; i++) {
            if (i == event.target.getSiblingIndex()) {
                this.lContent.children[i].getComponent("cc.Sprite").spriteFrame = this.ima1;
                this.rContent.children[i].active = true;
            } else {
                this.lContent.children[i].getComponent("cc.Sprite").spriteFrame = this.ima2;
                this.rContent.children[i].active = false;
            }
        }
    },
    refreshAnnouncement: function() {
        for (var i = 0; i < this.lContent.children.length; i++) {
            cc.vv.utils.addClickEvent(this.lContent.children[i], this.node, "Announcement", "onBtnSwitch");
        };
    },
    getAnnouncement: function() {
        var self = this;
        var fn = function(ret) {
            if (ret.errcode) {
                console.log("没有公告");
            } else {
                var i = 0;
                var y = self.lContent.children[0].y;
                var h = self.lContent.children[0].height;
                var node1 = self.lContent.children[0];
                var node2 = self.rContent.children[0];
                self.lContent.removeAllChildren();
                self.rContent.removeAllChildren();
                for (var key in ret) {
                    var n1 = cc.instantiate(node1);
                    var n2 = cc.instantiate(node2);
                    n1.getChildByName('label').getComponent(cc.Label).string = ret[key].title;
                    n2.getChildByName('notice_title2').getChildByName('label').getComponent(cc.Label).string = ret[key].title;
                    n2.getChildByName('richtext').getComponent(cc.RichText).string = ret[key].content;
                    n1.y = y - i * (20 + h);
                    if (i != 0) {
                        n2.active = false;
                        n1.getComponent("cc.Sprite").spriteFrame = self.ima2;
                    }else{
                        n2.active = true;
                        n1.getComponent("cc.Sprite").spriteFrame = self.ima1;
                    }
                    self.lContent.addChild(n1);
                    self.rContent.addChild(n2);
                    i++;
                }
                self.refreshAnnouncement();
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_announcement", data, fn);
    },
    onBtnClose: function() {
        this.node.active = false;
    },
    update: function(dt) {},
});