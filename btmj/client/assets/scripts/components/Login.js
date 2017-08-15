String.prototype.format = function(args) {
    if (arguments.length > 0) {
        var result = this;
        if (arguments.length == 1 && typeof(args) == "object") {
            for (var key in args) {
                var reg = new RegExp("({" + key + "})", "g");
                result = result.replace(reg, args[key]);
            }
        } else {
            for (var i = 0; i < arguments.length; i++) {
                if (arguments[i] == undefined) {
                    return "";
                } else {
                    var reg = new RegExp("({[" + i + "]})", "g");
                    result = result.replace(reg, arguments[i]);
                }
            }
        }
        return result;
    } else {
        return this;
    }
};
cc.Class({
    extends: cc.Component,
    properties: {
        _stateStr: '',
        _progress: 0.0,
        _isLoading: true,
        btnWechatLogin: cc.Node,
        loadingbar: {
            default: null,
            type: cc.ProgressBar
        },
        _time: 0,
        i: 0,
    },
    // use this for initialization
    onLoad: function() {
        this.loadingbar.progress = 0;
        if (!cc.sys.isNative && cc.sys.isMobile) {
            var cvs = this.node.getComponent(cc.Canvas);
            cvs.fitHeight = true;
            cvs.fitWidth = true;
        }
        this.initMgr();
        if (!cc.vv) {
            this.initMgr();
        }
        cc.vv.http.url = cc.vv.http.master_url;
        this.btnWechatLogin.active = false;
    },
    start: function() {
        var self = this;
        var SHOW_TIME = 3000;
        var FADE_TIME = 500;
        if (cc.sys.os != cc.sys.OS_IOS || !cc.sys.isNative) {
            var t = Date.now();
            var fn = function() {
                var dt = Date.now() - t;
                if (dt < SHOW_TIME) {
                    setTimeout(fn, 33);
                } else {
                    var op = (1 - ((dt - SHOW_TIME) / FADE_TIME)) * 255;
                    if (op < 0) {
                        self.checkVersion();
                    } else {
                        setTimeout(fn, 33);
                    }
                }
            };
            setTimeout(fn, 33);
        } else {
            this.checkVersion();
        }
    },
    initMgr: function() {
        cc.vv = {};
        var UserMgr = require("UserMgr");
        cc.vv.userMgr = new UserMgr();
        var ReplayMgr = require("ReplayMgr");
        cc.vv.replayMgr = new ReplayMgr();
        cc.vv.http = require("HTTP");
        cc.vv.global = require("Global");
        cc.vv.net = require("Net");
        cc.vv.match_net = require("MatchNet");
        var GameNetMgr = require("GameNetMgr");
        cc.vv.gameNetMgr = new GameNetMgr();
        // cc.vv.gameNetMgr.initHandlers();
        var AnysdkMgr = require("AnysdkMgr");
        cc.vv.anysdkMgr = new AnysdkMgr();
        cc.vv.anysdkMgr.init();
        var VoiceMgr = require("VoiceMgr");
        cc.vv.voiceMgr = new VoiceMgr();
        cc.vv.voiceMgr.init();
        var AudioMgr = require("AudioMgr");
        cc.vv.audioMgr = new AudioMgr();
        cc.vv.audioMgr.init();
        var Utils = require("Utils");
        cc.vv.utils = new Utils();
        cc.args = this.urlParse();
        this._isLoading = true;
    },
    urlParse: function() {
        var params = {};
        if (window.location == null) {
            return params;
        }
        var name, value;
        var str = window.location.href; //取得整个地址栏
        var num = str.indexOf("?")
        str = str.substr(num + 1); //取得所有参数   
        var arr = str.split("&"); //各个参数放到数组里
        for (var i = 0; i < arr.length; i++) {
            num = arr[i].indexOf("=");
            if (num > 0) {
                name = arr[i].substring(0, num);
                value = arr[i].substr(num + 1);
                params[name] = value;
            }
        }
        return params;
    },
    checkVersion: function() {
        var self = this;
        var onGetVersion = function(ret) {
            if (ret.version == null) {
                console.log("error.");
            } else {
                console.log("返回的结果是" + JSON.stringify(ret));
                cc.vv.SI = ret;
                self.startPreloading();
            }
        };
        var xhr = null;
        var complete = false;
        var fnRequest = function() {
            self._stateStr = "正在连接服务器";
            xhr = cc.vv.http.sendRequest("/get_serverinfo", null, function(ret) {
                xhr = null;
                complete = true;
                onGetVersion(ret);
            });
            setTimeout(fn, 5000);
        }
        var fn = function() {
            if (!complete) {
                if (xhr) {
                    xhr.abort();
                    self._stateStr = "连接失败，即将重试";
                    setTimeout(function() {
                        fnRequest();
                    }, 5000);
                } else {
                    fnRequest();
                }
            }
        };
        fn();
    },
    startPreloading: function() {
        this._stateStr = "正在加载资源，请稍候";
        // this._isLoading = true;
        var self = this;
        cc.loader.onProgress = function(completedCount, totalCount, item) {
            if (self._isLoading) {
                self._progress = completedCount / totalCount;
            }
        };
        cc.loader.loadResDir("textures/images/login", function(err, assets) {
            console.log("登录资源加载完成");
            self.onLoadComplete();
        });
    },
    // 加载完成
    onLoadComplete: function() {
        this._isLoading = false;
        this.loadingbar.node.active = false;
        this.btnWechatLogin.active = true;
        cc.loader.onComplete = null;
        cc.loader.loadResDir("textures/home", function(err, assets) {
            console.log("hall大厅资源加载完成");
        });
    },
    // 点击微信登录按钮
    onBtnWeichatClicked: function() {
        console.log("创建一个微信登录的");
        if (cc.args["account"] == null) {
            this.sendWXLoginXHR();
        } else {
            cc.vv.wc.show("正在登录游戏,请稍后");
            cc.vv.userMgr.guestAuth();
        }
    },
    // 发送请求，获取到微信登录用的code
    sendWXLoginXHR: function() {
        cc.vv.wc.show("正在登录游戏,请稍后");
        var url = "http://mj.yajugame.com/sessionid.php";
        var xhr = cc.loader.getXMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && (xhr.status >= 200 && xhr.status <= 207)) {
                var httpStatus = xhr.statusText;
                var response = xhr.responseText;
                var res = JSON.parse(response)
                this.session_id = res["sid"];
                if (this.session_id) {
                    console.log("the sid is " + this.session_id);
                    var fn = function(ret) {
                        if (ret.errcode == 0) {
                            cc.vv.anysdkMgr.onLoginResp(ret.code, ret.uid, ret.roomid);
                        } else {
                            cc.vv.wc.show("请在微信中打开该链接地址或刷新页面！");
                        }
                    }
                    cc.vv.http.sendRequest("/get_wx_code", {
                        sid: this.session_id
                    }, fn);
                }
            } else {
                console.log("无结果返回");
            }
        };
        xhr.timeout = 5000; // 5 seconds for timeout
        xhr.send();
    },
    time: function() {
        this._time = Date.now();
    },
    update: function(dt) {
        var progress = this.loadingbar.progress;
        if (this._isLoading) {
            if (Date.now() - this._time > 100) {
                this.time();
                progress += dt;
                if (this.i >= 3) {
                    if (progress < this._progress) {
                        progress = this._progress;
                    }
                }
                if (progress > 1) {
                    progress = 1;
                }
                this.i++;
            }
            this.loadingbar.progress = progress;
        }
    }
});