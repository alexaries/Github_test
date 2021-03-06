"use strict";

cc.Class({
    extends: cc.Component,
    properties: {
        pm: cc.Node,
        xz: cc.Node,
        lb: cc.Node,
        th: cc.Node,
        gz: cc.Node,
        hj: cc.Node,
        // pmlable1: cc.Label,
        // pmlable2: cc.Label,
        pmlable3: cc.Label,
        pmlable4: cc.Label,
        // xzlable1: cc.Label,
        // xzlable2: cc.Label,
        xzlable3: cc.Label,
        xzlable4: cc.Label,
        // lblable1: cc.Label,
        // lblable2: cc.Label,
        lblable3: cc.Label,
        lblable4: cc.Label,
        // thlable1: cc.Label,
        // thlable2: cc.Label,
        thlable3: cc.Label,
        thlable4: cc.Label,
        // gzlable1: cc.Label,
        // gzlable2: cc.Label,
        gzlable3: cc.Label,
        gzlable4: cc.Label,
        // hjlable1: cc.Label,
        // hjlable2: cc.Label,
        hjlable3: cc.Label,
        hjlable4: cc.Label
    },
    // use this for initialization
    onLoad: function onLoad() {
        this.initButtonHandler(this.pm);
        this.initButtonHandler(this.xz);
        this.initButtonHandler(this.lb);
        this.initButtonHandler(this.th);
        this.initButtonHandler(this.gz);
        this.initButtonHandler(this.hj);
    },
    initView: function initView() {
        var self = this;
        var fn = function fn(ret) {
            if (ret) {
                for (var i = 0; i < ret.length; i++) {
                    if (i == 0) {
                        self.pm.scene = ret[i].id;
                        // self.pmlable1.string = ret[i].name;
                        // self.pmlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.pmlable3.string = ret[i].online;
                        self.pmlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 1) {
                        self.xz.scene = ret[i].id;
                        // self.xzlable1.string = ret[i].name;
                        // self.xzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.xzlable3.string = ret[i].online;
                        self.xzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 2) {
                        self.lb.scene = ret[i].id;
                        // self.lblable1.string = ret[i].name;
                        // self.lblable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.lblable3.string = ret[i].online;
                        self.lblable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 3) {
                        self.th.scene = ret[i].id;
                        // self.thlable1.string = ret[i].name;
                        // self.thlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.thlable3.string = ret[i].online;
                        self.thlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 4) {
                        self.gz.scene = ret[i].id;
                        // self.gzlable1.string = ret[i].name;
                        // self.gzlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.gzlable3.string = ret[i].online;
                        self.gzlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    } else if (i == 5) {
                        self.hj.scene = ret[i].id;
                        // self.hjlable1.string = ret[i].name;
                        // self.hjlable2.string = ret[i].consume_type ? ("钻石" + ret[i].consume_num) : ("金币" + ret[i].consume_num);
                        self.hjlable3.string = ret[i].online;
                        self.hjlable4.string = "进房下限" + (ret[i].limit_type ? ret[i].limit_num : ret[i].limit_num);
                    }
                };
            }
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            room_type: 3
        };
        cc.vv.http.sendRequest("/get_scene", data, fn);
    },
    onBtnBack: function onBtnBack() {
        this.node.active = false;
    },
    initButtonHandler: function initButtonHandler(btn) {
        cc.vv.utils.addClickEvent(btn, this.node, "SelectDn", "matchRoom");
    },
    matchRoom: function matchRoom(event) {
        var conf = {
            room_type: 3, //3代表斗牛房间
            scene: event.target.scene,
            genre: 1,
            type: 'dn'
        };
        var data = {
            account: cc.vv.userMgr.account,
            sign: cc.vv.userMgr.sign,
            conf: JSON.stringify(conf)
        };
        cc.vv.wc.show("寻找房间");
        var onSearch = function onSearch(ret) {
            if (ret.errcode !== 0) {
                cc.vv.wc.hide();
                //console.log(ret.errmsg);
                // if (ret.errcode == 2) {
                //     cc.vv.alert.show("提示", ret.errmsg);
                // } else {
                //     if (ret.errcode == -3) {
                //         cc.vv.alert.show("提示", "您已加入房间，无法匹配");
                //     } else {
                //         cc.vv.alert.show("提示", "创建房间失败,错误码:" + ret.errcode);
                //     }
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
        cc.vv.http.sendRequest("/match_room", data, onSearch);
    }
});