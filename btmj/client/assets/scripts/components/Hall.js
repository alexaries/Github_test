var Net = require("Net")
var Global = require("Global")
cc.Class({
    extends: cc.Component,
    properties: {
        lblName: cc.Label,
        lblGems: cc.Label,
        lblID: cc.Label,
        lblNotice: cc.Label,
        joinGameWin: cc.Node,
        applyAgentWin: cc.Node,
        createRoomWin: cc.Node,
        settingsWin: cc.Node,
        helpWin: cc.Node,
        shareWin: cc.Node,
        btnJoinGame: cc.Node,
        btnReturnGame: cc.Node,
        sprHeadImg: cc.Sprite,
        effAnimation: cc.Node,
        _lastCheckTime: 0,
    },
    initNetHandlers: function() {
        var self = this;
    },
    onShare: function() {
        cc.vv.anysdkMgr.share("亚巨包头麻将", "亚巨包头麻将");
    },
    // use this for initialization
    onLoad: function() {
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.preLoad();
        this.initLabels();
        this.effNode = cc.find("Canvas/eff");
        // 如果未创建房间，创建按钮显示特效
        // 如果存在房间，返回房间显示特效            
        var pos = cc.v2(310, 53);
        this.playBtnEff(true, pos);
        if (cc.vv.gameNetMgr.roomId) {
            this.btnJoinGame.active = false;
            this.btnReturnGame.active = true;
            pos = cc.v2(310, 53);
        } else {
            this.btnJoinGame.active = true;
            this.btnReturnGame.active = false;
            pos = cc.v2(86, -108);
        }
        // 播放按钮特效
        this.playBtnEff(true, pos);
        var roomId = cc.vv.userMgr.oldRoomId
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        }
        var imgLoader = this.sprHeadImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        cc.vv.utils.addClickEvent(this.sprHeadImg.node, this.node, "Hall", "onBtnClicked");
        this.initButtonHandler("Canvas/right_bottom/btn_shezhi");
        this.initButtonHandler("Canvas/right_bottom/btn_help");
        this.initButtonHandler("Canvas/right_bottom/btn_share_wx");
        this.helpWin.addComponent("OnBack");
        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "数据请求中...",
            }
        }
        if (!cc.vv.userMgr.gemstip) {
            cc.vv.userMgr.gemstip = {
                version: null,
                msg: "数据请求中...",
            }
        }
        this.lblNotice.string = cc.vv.userMgr.notice.msg;
        this.refreshInfo();
        this.refreshNotice();
        this.refreshGemsTip();
        // cc.vv.audioMgr.playBGM("bgMain.mp3");
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        this.initEventHandlers();
    },
    refreshInfo: function() {
        var self = this;
        var onGet = function(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                if (ret.gems != null) {
                    this.lblGems.string = cc.vv.utils.showJinbi(ret.gems);
                }
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
        };
        cc.vv.http.sendRequest("/get_user_status", data, onGet.bind(this));
    },
    refreshGemsTip: function() {
        var self = this;
        var onGet = function(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.gemstip.version = ret.version;
                cc.vv.userMgr.gemstip.msg = ret.msg.replace("<newline>", "\n");
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "fkgm",
            version: cc.vv.userMgr.gemstip.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    refreshNotice: function() {
        var self = this;
        var onGet = function(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                cc.vv.userMgr.notice.version = ret.version;
                cc.vv.userMgr.notice.msg = ret.msg;
                this.lblNotice.string = ret.msg;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "notice",
            version: cc.vv.userMgr.notice.version
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    initButtonHandler: function(btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "Hall", "onBtnClicked");
    },
    preLoad: function() {
        cc.loader.loadResDir("textures/images", function(err, assets) {
            cc.loader.loadResDir("textures/MJRoom", function(err, assets) {
                cc.loader.loadResDir("textures/MJ", function(err, assets) {});
            });
        });
    },
    initLabels: function() {
        this.lblName.string = cc.vv.userMgr.userName;
        this.lblGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.lblID.string = "ID:" + cc.vv.userMgr.userId;
    },
    onBtnClicked: function(event) {
        if (event.target.name == "btn_shezhi") {
            this.settingsWin.active = true;
        } else if (event.target.name == "btn_help") {
            this.helpWin.active = true;
        } else if (event.target.name == "btn_share_wx") {
            cc.vv.share.show();
        }
    },
    onApplyAgentClicked: function() {
        this.applyAgentWin.active = true;
    },
    onApplyAgentBtnBack: function() {
        this.applyAgentWin.active = false;
    },
    onJoinGameClicked: function() {
        this.joinGameWin.active = true;
    },
    onReturnGameClicked: function() {
        cc.director.loadScene("mjgame");
    },
    onBtnAddGemsClicked: function() {
        console.log("点击充值按钮");
        cc.vv.charge.show();
    },
    onCreateRoomClicked: function() {
        if (cc.vv.gameNetMgr.roomId != null) {
            cc.vv.alert.show("提示", "房间已经创建!\n必须解散当前房间才能创建新的房间");
            return;
        }
        console.log("onCreateRoomClicked");
        this.createRoomWin.active = true;
    },
    initEventHandlers: function() {
        this.node.on('update_gems', function(event) {
            if (event.detail.gems != null) {
                var str = event.detail.gems;
                this.lblGems.string = cc.vv.utils.showJinbi(str);
            }
        }.bind(this));
    },
    // 获得更新消息
    getRefreshInfo: function() {
        var fn = function(ret) {
            if (ret == null) {
                console.log('消息是空的');
                return;
            }
            if (ret.userid == cc.vv.userMgr.userId) {
                if (ret.gems != null) {
                    this.lblGems.string = cc.vv.utils.showJinbi(ret.gems);
                }
            }
        };
        this._lastCheckTime = Date.now();
        cc.vv.http.sendRequest("/need_refresh", {
            userid: cc.vv.userMgr.userId
        }, fn.bind(this));
    },
    // 播放按钮特效
    playBtnEff: function(flag, pos) {
        if (flag) {
            this.btnEff = this.effAnimation.getComponent(cc.Animation);
            // this.effAnimation.getComponent(cc.Node).getPosition();
            this.effNode.setPosition(pos);
            var animState = this.btnEff.play('anniu');
            animState.speed = 0.3;
            animState.wrapMode = cc.WrapMode.Loop;
            animState.repeatCount = Infinity;
        }
    },
    gotoNewHall:function(){
        cc.director.loadScene("newhall");
    },
    // called every frame, uncomment this function to activate update callback
    update: function(dt) {
        if (Date.now() - this._lastCheckTime > 30000) {
            this.getRefreshInfo();
        };
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
        // 如果当前自己有房间，不能直接进入分享过来的房间
        if (cc.vv && cc.vv.userMgr.roomData != null) {
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        } else {
            // 如果当前没有房间，且分享过来的房间号不是空的话，可以进入房间
            if (cc.vv && cc.vv.userMgr.shareRoomId != null) {
                cc.vv.userMgr.roomData = null;
                var roomid = cc.vv.userMgr.shareRoomId;
                cc.vv.userMgr.shareRoomId = null;
                cc.vv.userMgr.enterRoom(roomid, function(ret) {
                    if (ret.errcode != 0) {
                        var content = "房间[" + roomid + "]不存在，请重新输入!";
                        if (ret.errcode == 4) {
                            content = "房间[" + roomid + "]已满!";
                        }
                        cc.vv.alert.show("提示", content);
                    }
                }.bind(this));
            }
        }
    },
});