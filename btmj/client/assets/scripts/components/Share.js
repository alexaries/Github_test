// 微信分享相关逻辑处理
cc.Class({
    extends: cc.Component,
    properties: {
        _share: null,
        _linkPanel: cc.Node,
        _QRCodePanel: cc.Node,
        _headIcon: cc.Sprite,
        _shareInfo: cc.Label,
        _shareType: 0,
        _btnLink: {
            default: null,
            type: cc.Button
        },
        _btnQRCode: {
            default: null,
            type: cc.Button
        },
        _spriteFrame: null,
        _shareRoomId: null,
        _sprQRCode: cc.Sprite,
    },
    onLoad: function() {
        if (cc.vv == null) {
            return;
        }
        this.initUI()
        cc.vv.share = this;
    },
    initUI: function() {
        this._share = cc.find("Canvas/share");
        this._linkPanel = cc.find("Canvas/share/link_panel");
        this._QRCodePanel = cc.find("Canvas/share/QR_code_panel");
        this._headIcon = this._linkPanel.getChildByName("headicon");
        this._shareInfo = this._linkPanel.getChildByName("shareinfo");
        this._btnLink = cc.find("Canvas/share/button_link").getComponent(cc.Button);
        this._btnQRCode = cc.find("Canvas/share/button_qrcode").getComponent(cc.Button);
        this._sprQRCode = cc.find("Canvas/share/QR_code_panel/QRCodeImg").getComponent(cc.Sprite);
        this._shareRoomId = cc.vv.userMgr.shareRoomId || cc.vv.gameNetMgr.roomId;
    },
    onCloseBtnClicked: function() {
        console.log('关闭按钮点击');
        this._share.active = false;
    },
    onLinkBtnClicked: function() {
        console.log('链接邀请按钮点击');
        this._shareType = 1;
        this.toggleStatue();
    },
    onQRcodeBtnClicked: function() {
        console.log('二维码分享按钮点击');
        this._shareType = 2;
        this.toggleStatue();
    },
    toggleStatue: function() {
        if (this._shareType == 1) {
            this._linkPanel.active = true;
            this._QRCodePanel.active = false;
            this._btnLink.interactable = false;
            this._btnQRCode.interactable = true;
            this.getShareLinkInfo();
        } else {
            this._btnLink.interactable = true;
            this._btnQRCode.interactable = false;
            this._linkPanel.active = false;
            this._QRCodePanel.active = true;
            this.getShareQRCodeInfo();
        }
    },
    show: function() {
        this._share.active = true;
        this._shareType = 1;
        this.toggleStatue();
    },
    getShareLinkInfo: function() {
        var shareTitle = "亚巨棋牌";
        var shareContent = "我邀请你来玩亚巨棋牌，最火热的棋牌游戏，包含各种主流及地方棋牌游戏种类，快上车吧！";
        if (cc.vv.userMgr.userName) {
            shareContent = cc.vv.userMgr.userName + "邀请你来玩亚巨棋牌，最火热的棋牌游戏，包含各种主流及地方棋牌游戏种类，快上车吧！";
        };
        if (this._shareRoomId) {
            shareContent = shareContent + "房间号是:" + this._shareRoomId;
        };
        this._shareInfo.getComponent(cc.Label).string = shareContent;
        if (!cc.sys.isNative) {
            document.title = window.wxFriend.title = shareTitle;
            window.wxFriend.desc = shareContent;
            if(cc.vv.gameNetMgr.roomId && cc.vv.gameNetMgr.roomId != null){
                var shareUrl = cc.vv.userMgr.yaoqingUrl + cc.vv.gameNetMgr.roomId;
            }else{
                var shareUrl = cc.vv.userMgr.yaoqingUrl + "000000";
            }
            window.wxFriend.link = shareUrl;
            window.shareMessage();
        }
    },
    // 加载二维码
    getShareQRCodeInfo: function() {
        var ImageLoader = this._sprQRCode.node.getComponent("ImageLoader");
        ImageLoader.setUserID(cc.vv.userMgr.userId, 1);
    },
    onDestory: function() {
        if (cc.vv) {
            cc.vv.share = null;
        }
    }
});