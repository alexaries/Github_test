"use strict";

var Net = require("Net");
var Global = require("Global");
cc.Class({
    extends: cc.Component,
    properties: {
        selectZJH: cc.Node,
        selectMJ: cc.Node,
        selectDN: cc.Node,
        selectDZPK: cc.Node,
        nickname: cc.Label,
        userGems: cc.Label,
        userCoins: cc.Label,
        headImg: cc.Sprite,
        _lastCheckTime: 0,
        _lastRefreshTime: 0,
        mj_online: cc.Label,
        zjh_online: cc.Label,
        dn_online: cc.Label,
        dzpk_online: cc.Label,
        effAnimation: cc.Node,
        lblNotice: cc.Label,
        _activity: null,
        gonggao: cc.Node,
        statement: null,
        statementContent: cc.RichText
    },
    // use this for initialization
    onLoad: function onLoad() {
        if (!cc.vv) {
            cc.director.loadScene("login");
            return;
        }
        this.statement = cc.find("Canvas/statement");
        this._activity = cc.find("Canvas/activity");
        this._match = cc.find("Canvas/match");
        this.jbs = this._match.getComponent("Jbs");
        var imgLoader = this.headImg.node.getComponent("ImageLoader");
        imgLoader.setUserID(cc.vv.userMgr.userId);
        this.jinbi = cc.find("Canvas/header/jinbi/gems").getComponent(cc.Label);
        this.diamond = cc.find("Canvas/header/zuanshi/coins").getComponent(cc.Label);
        this.jinbiChange = cc.find("Canvas/jinbiChange");
        this.initButtonHandler("Canvas/scrollview/view/content/zjhbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/mjbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/dnbtn");
        this.initButtonHandler("Canvas/scrollview/view/content/dzpkbtn");
        this.initButtonHandler("Canvas/footer/exchange");
        this.initButtonHandler("Canvas/header/jinbi/iconAdd");
        this.initJinbiChangeHandler();
        this.initLabels();
        this.getUserOnline();
        this.effNode = cc.find("Canvas/eff");
        // this.playBtnEff(true);
        if (!cc.vv.userMgr.notice) {
            cc.vv.userMgr.notice = {
                version: null,
                msg: "数据请求中..."
            };
        };
        if (!cc.vv.userMgr.gemstip) {
            cc.vv.userMgr.gemstip = {
                version: null,
                msg: "数据请求中..."
            };
        };
        var roomId = cc.vv.userMgr.oldRoomId;
        if (roomId != null) {
            cc.vv.userMgr.oldRoomId = null;
            cc.vv.userMgr.enterRoom(roomId);
        };
        this.lblNotice.string = cc.vv.userMgr.notice.msg;
        this.refreshNotice();
        cc.vv.audioMgr.playBGM("bgFight.mp3");
        //模块的动态显示
        if (cc.vv.userMgr.modules) {
            var content = cc.find("Canvas/scrollview/view/content");
            var del_arr = [];
            for (var i in content.children) {
                var child = content.children[i];
                if (cc.vv.userMgr.modules.indexOf(parseInt(i)) == -1) {
                    del_arr.push(child);
                }
            }
            for (var i in del_arr) {
                content.removeChild(del_arr[i]);
            }
            var width = content.children[0].width;
            var length = content.children.length;
            var per = (1280 - width * length) / (length + 1);
            per = per + 120;
            for (var i in content.children) {
                var child = content.children[i];
                child.x = per + i * (width / 2 + per);
            }
        };
        //锦标赛是否开放
        this.initJbs();
    },
    initJbs: function initJbs() {
        var btn = cc.find("Canvas/scrollview/view/content/jbsbtn");
        if (cc.vv.userMgr.is_open_jbs) {
            btn.getComponent(cc.Button).interactable = true;
            // btn.interactable = true;
            for (var i in btn.children) {
                btn.children[i].active = false;
            }
        }
    },
    /*// 播放按钮特效
    playBtnEff: function(flag) {
        if (flag) {
            this.btnEff = this.effAnimation.getComponent(cc.Animation);
            var animState = this.btnEff.play('anniu');
            animState.speed = 0.2;
            animState.wrapMode = cc.WrapMode.Loop;
            animState.repeatCount = Infinity;
        }
    },*/
    refreshNotice: function refreshNotice() {
        var self = this;
        var onGet = function onGet(ret) {
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
    initLabels: function initLabels() {
        this.nickname.string = cc.vv.userMgr.userName;
        this.userGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.userCoins.string = cc.vv.userMgr.coins;
    },
    initButtonHandler: function initButtonHandler(btnPath) {
        var btn = cc.find(btnPath);
        cc.vv.utils.addClickEvent(btn, this.node, "NewHall", "onBtnClicked");
    },
    initJinbiChangeHandler: function initJinbiChangeHandler() {
        cc.vv.utils.addClickEvent(this.jinbiChange.getChildByName('yes'), this.node, "NewHall", "onChangeJinbi");
        cc.vv.utils.addClickEvent(this.jinbiChange.getChildByName('no'), this.node, "NewHall", "onChangeJinbi");
    },
    onBtnClicked: function onBtnClicked(event) {
        switch (event.target.name) {
            case 'zjhbtn':
                this.selectZJH.active = true;
                this.selectZJH.getComponent("SelectZjh").initView();
                break;
            case 'exchange':
                this.jinbiChange.active = true;
                break;
            case 'mjbtn':
                this.selectMJ.active = true;
                break;
            case 'dnbtn':
                this.selectDN.active = true;
                this.selectDN.getComponent("SelectDn").initView();
                break;
            case 'dzpkbtn':
                this.selectDZPK.active = true;
                this.selectDZPK.getComponent("SelectDzpk").initView();
                break;
            case 'btn_setting':
                this.node.getChildByName("set").active = true;
                this.node.getChildByName("set").getComponent("Set").refreshVolume();
                break;
        }
    },
    showActivity: function showActivity() {
        this._activity.active = true;
        this._activity.getComponent("Collapse").refreshBtns();
    },
    hideActivity: function hideActivity() {
        this._activity.active = false;
    },
    //兑换金币
    onChangeJinbi: function onChangeJinbi(event) {
        switch (event.target.name) {
            case 'yes':
                var data = {
                    sign: cc.vv.userMgr.sign,
                    userid: cc.vv.userMgr.userId,
                    num_diamond: cc.find("Canvas/jinbiChange/editbox").getComponent(cc.EditBox).string
                };
                var onYes = function onYes(ret) {
                    if (ret) {
                        if (ret.userid == cc.vv.userMgr.userId) {
                            if (ret.jinbi != null) {
                                this.jinbi.string = cc.vv.utils.showJinbi(ret.jinbi); //刷新金币显示
                                this.diamond.string = ret.diamond; //刷新钻石显示
                                console.log('兑换成功！');
                            } else {
                                console.log('无金币数量返回！');
                            }
                        } else {
                            console.log('userid不匹配！');
                        }
                    } else {
                        console.log('兑换失败！');
                    }
                    this.jinbiChange.active = false;
                };
                cc.vv.http.sendRequest("/changeJinbi", data, onYes.bind(this));
                break;
            case 'no':
                this.jinbiChange.active = false;
                break;
        }
    },
    onBtnAddCoinsClicked: function onBtnAddCoinsClicked() {
        cc.vv.chargeType.show();
    },
    onBtnAddGemsClicked: function onBtnAddGemsClicked() {
        this.jinbiChange.active = true;
    },
    showAnnouncement: function showAnnouncement() {
        this.gonggao.active = true;
        this.gonggao.getComponent("Announcement").getAnnouncement();
    },
    // 获得更新消息
    getRefreshInfo: function getRefreshInfo() {
        var self = this;
        var fn = function fn(ret) {
            if (ret == null) {
                console.log('消息是空的');
                return;
            }
            if (ret.userid == cc.vv.userMgr.userId) {
                if (ret.gems != null) {
                    // self.userGems.string = cc.vv.utils.showJinbi(ret.gems);
                    cc.vv.userMgr.gems = ret.gems;
                }
                if (ret.coins != null) {
                    cc.vv.userMgr.coins = ret.coins;
                    // self.userCoins.string = ret.coins;
                }
                cc.vv.userMgr.refreshTime = 30000;
            }
        };
        this._lastRefreshTime = Date.now();
        cc.vv.http.sendRequest("/need_refresh", {
            userid: cc.vv.userMgr.userId
        }, fn);
    },
    getUserOnline: function getUserOnline() {
        var self = this;
        var fn = function fn(ret) {
            self.mj_online.string = ret['0'] + "人在线";
            self.zjh_online.string = ret['2'] + "人在线";
            self.dn_online.string = ret['3'] + "人在线";
            self.dzpk_online.string = ret['4'] + "人在线";
        };
        this._lastCheckTime = Date.now();
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign
        };
        cc.vv.http.sendRequest("/get_user_online", data, fn);
    },
    exchangeRoom: function exchangeRoom() {
        if (cc.vv.userMgr.room_type == 2) {
            var type = 'zjh';
        } else if (cc.vv.userMgr.room_type == 3) {
            var type = 'dn';
        } else {
            var type = 'dzpk';
        }
        var conf = {
            room_type: cc.vv.userMgr.room_type, //2代表扎金花房间
            scene: cc.vv.userMgr.scene,
            genre: 1,
            type: type
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf),
            e_roomid: cc.vv.userMgr.e_roomid
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                // if (ret.errcode == 2) {
                //     if (ret.errmsg == 1) {
                //         cc.vv.alert.show("提示", "钻石不够，无法匹配");
                //     } else {
                //         cc.vv.alert.show("提示", "金币不够，无法匹配");
                //     }
                // } else {
                //     cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                // }
                console.log('错误码', ret.errcode);
                cc.vv.alert.show("提示", ret.errmsg);
            } else {
                cc.vv.userMgr.room_type = conf.room_type;
                cc.vv.userMgr.scene = conf.scene;
                cc.vv.userMgr.e_roomid = ret.roomid;
                cc.vv.gameNetMgr.connectGameServer(ret);
            }
        };
        cc.vv.http.sendRequest("/exchange_room", data, onSearch);
    },
    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        if (Date.now() - this._lastCheckTime > 10000) {
            this.getUserOnline();
        };
        if (Date.now() - this._lastRefreshTime > cc.vv.userMgr.refreshTime) {
            this.getRefreshInfo();
        };
        var x = this.lblNotice.node.x;
        x -= dt * 100;
        if (x + this.lblNotice.node.width < -1000) {
            x = 500;
        }
        this.lblNotice.node.x = x;
        if (cc.vv && cc.vv.userMgr.roomData != null) {
            cc.vv.userMgr.reconnection = 1;
            cc.vv.userMgr.enterRoom(cc.vv.userMgr.roomData);
            cc.vv.userMgr.roomData = null;
        } else {
            // 如果当前没有房间，且分享过来的房间号不是空的话，可以进入房间
            if (cc.vv && cc.vv.userMgr.shareRoomId != null) {
                cc.vv.userMgr.roomData = null;
                var roomid = cc.vv.userMgr.shareRoomId;
                cc.vv.userMgr.shareRoomId = null;
                cc.vv.userMgr.enterRoom(roomid, function (ret) {
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
        if (cc.vv && cc.vv.userMgr.exchange == 1) {
            cc.vv.userMgr.exchange = 0;
            this.exchangeRoom();
        }
        this.userGems.string = cc.vv.utils.showJinbi(cc.vv.userMgr.gems);
        this.userCoins.string = cc.vv.userMgr.coins;
    },
    onOpenstatement: function onOpenstatement() {
        var onGet = function onGet(ret) {
            if (ret.errcode !== 0) {
                console.log(ret.errmsg);
            } else {
                this.statement.active = true;
                this.statementContent.string = ret.msg;
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            type: "statement"
        };
        cc.vv.http.sendRequest("/get_message", data, onGet.bind(this));
    },
    onClosestatement: function onClosestatement() {
        this.statement.active = false;
    },
    // onJBSBtnClick: function() {
    //     cc.vv.gameNetMgr.connectMatchServer();
    // },
    onJBSBtnClick: function onJBSBtnClick() {
        var self = this;
        var send_data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            userid: cc.vv.userMgr.userId
        };
        cc.vv.http.sendRequest("/get_jbs_data", send_data, function (ret) {
            self.jbs.showMatchList(ret);
        });
    }
});