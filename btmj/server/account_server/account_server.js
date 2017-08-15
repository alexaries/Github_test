var crypto = require('../utils/crypto');
var express = require('express');
var db = require('../utils/db');
var http = require("../utils/http");
var redis = require('redis');
var bodyParser = require('body-parser');
var client = redis.createClient(6379, '127.0.0.1');
client.on('error', function(err) {
    console.log('error' + err);
});
//  根据sessionid取到用户的code和state信息
function getAccess_token(sid, callback) {
    var sid = sid + "_code";
    client.get(sid, function(err, value) {
        if (err) throw err;
        console.log('Got: ' + value);
        callback(value);
    });
}
// 将需要更新数据的玩家id号放到redis中
function notify_refresh_gems(batchno, callback) {
    console.log('当前的批次号是' + batchno);
    var useridlist = [];
    db.get_refresh_userlist(batchno, function(data) {
        if (data == null) {
            console.log('当前查询到的数据是空的,不做任何操作');
            return;
        } else {
            for (idx in data) {
                var val = data[idx].userid;
                client.sadd("userlist", val, function(err, res) {
                    if (err) {
                        console.log('err!!!' + err);
                    } else {
                        callback();
                        console.log('res!!!' + res);
                    }
                });
            }
        }
    });
};
// 后台添加金币后，redis中需要更新的玩家列表存储时间为10分钟，10分钟后失效，
function set_userlist_expire() {
    console.log('当前set_userlist_expire');
    client.expire("userlist", 1000, function(err, res) {
        if (err) {
            console.log('err!!!' + err);
        } else {
            console.log('res!!!' + res);
        }
    });
};
var app = express();
// 创建 application/json 解析
var jsonParser = bodyParser.json()
    // 创建 application/x-www-form-urlencoded 解析
var urlencodedParser = bodyParser.urlencoded({
    extended: false
})
var multipart = require('connect-multiparty');
var multipartMiddleware = multipart();
var hallAddr = "";

function send(res, ret) {
    var str = JSON.stringify(ret);
    res.send(str)
}
var config = null;
var appInfo = {};
exports.start = function(cfg) {
    config = cfg;
    hallAddr = config.HALL_IP + ":" + config.HALL_CLIENT_PORT;
    app.listen(config.CLIENT_PORT);
    console.log("account server is listening on " + config.CLIENT_PORT);
    appInfo = {
        Android: {
            appid: config.APPID,
            secret: config.SECRET,
        },
        iOS: {
            appid: config.APPID,
            secret: config.SECRET,
        },
        WEB: {
            appid: config.APPID,
            secret: config.SECRET,
        }
    };
};
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
app.get('/register', function(req, res) {
    var account = req.query.account;
    var password = req.query.password;
    var fnFailed = function() {
        send(res, {
            errcode: 1,
            errmsg: "account has been used."
        });
    };
    var fnSucceed = function() {
        send(res, {
            errcode: 0,
            errmsg: "ok"
        });
    };
    db.is_user_exist(account, function(exist) {
        if (exist) {
            db.create_account(account, password, function(ret) {
                if (ret) {
                    fnSucceed();
                } else {
                    fnFailed();
                }
            });
        } else {
            fnFailed();
            console.log("account has been used.");
        }
    });
});
app.get('/get_version', function(req, res) {
    var ret = {
        version: config.VERSION,
    };
    send(res, ret);
});
app.get('/get_serverinfo', function(req, res) {
    console.log('到服务器检验版本信息');
    var ret = {
        version: config.VERSION,
        hall: hallAddr,
        appweb: config.APP_WEB,
    };
    send(res, ret);
});
app.get('/guest', function(req, res) {
    var account = "guest_" + req.query.account;
    var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
    var ret = {
        errcode: 0,
        errmsg: "ok",
        account: account,
        halladdr: hallAddr,
        sign: sign
    };
    send(res, ret);
});
app.get('/auth', function(req, res) {
    var account = req.query.account;
    var password = req.query.password;
    db.get_account_info(account, password, function(info) {
        if (info == null) {
            send(res, {
                errcode: 1,
                errmsg: "invalid account"
            });
            return;
        }
        var account = "vivi_" + req.query.account;
        var sign = get_md5(account + req.ip + config.ACCOUNT_PRI_KEY);
        var ret = {
            errcode: 0,
            errmsg: "ok",
            account: account,
            sign: sign
        };
        send(res, ret);
    });
});


function get_access_token(code, os, callback) {
    var info = appInfo[os];
    if (info == null) {
        callback(false, null);
    }
    var data = {
        appid: info.appid,
        secret: info.secret,
        code: code,
        grant_type: "authorization_code"
    };
    console.log('返回的数据是！！！！！！！！！！！！', data);
    http.get2("https://api.weixin.qq.com/sns/oauth2/access_token", data, callback, true);
}

function get_state_info(access_token, openid, callback) {
    var data = {
        access_token: access_token,
        openid: openid
    };
    console.log('返回的数据是！！！！！！！！！！！！get_state_info', data);
    http.get2("https://api.weixin.qq.com/sns/userinfo", data, callback, true);
}

function create_user(account, name, sex, headimgurl, yaoqing, roomid, callback) {
    console.log("运行到crate user！");
    var coins = 0;
    var gems = 80000;
    db.is_user_exist(account, function(ret) {
        if (!ret) {
            console.log("创号！");
            db.create_user(account, name, coins, gems, sex, headimgurl, yaoqing, roomid, function(ret) {
                callback();
            });
        } else {
            console.log("更新账号信息=========12");
            db.update_user_info(account, name, headimgurl, sex, roomid, function(ret) {
                callback();
            });
        }
    });
}

function get_user_code(callback) {
    var data = {
        appid: 'wx0b291371dfdfb2a0',
        redirect_uri: 'http://mj1.0086qd.com/wechat_auth',
        response_type: 'code',
        scope: 'snsapi_userinfo', //需要授权:snsapi_userinfo  //静默授权:snsapi_base
        state: '123#wechat_redirect',
    };
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    http.get3(url, data, callback, true);
}
app.get('/wechat_login', function(req, res) {
    console.log("------------------wechat_login------------------start");
    console.log(req.statusCode);
    console.log(req.headers);
    console.log("------------------wechat_login-----------------------");
    console.log(res.statusCode);
    console.log(res.headers);
    console.log("------------------wechat_login------------------end");
    get_user_code(function(suc, data) {
        console.log('>>>suc:' + suc + ">>>");
        if (suc) {
            console.log(data);
        }
    });
    var ret = {
        source: 'waiting...'
    };
    send(res, ret);
});
app.get('/wechat_auth', function(req, res) {
    console.log("------------------wechat_auth------------------coming");
    var code = req.query.code;
    var uid = req.query.uid;
    var roomid = req.query.roomid;
    console.log('邀请人是:' + uid + "code是多少:" + code + "房间号是多少" + roomid);
    //var os = req.query.os;
    var os = 'WEB';
    if (code == null || code == "" || os == null || os == "" || uid == null || uid == "") {
        return;
    }
    console.log(os);
    get_access_token(code, os, function(suc, data) {
        if (suc) {
            console.log("获取到的最后的结果是:" + JSON.stringify(data));
            var access_token = data.access_token;
            var openid = data.openid;
            if (access_token == null || access_token == "" || openid == null || openid == "") {
                console.log('没有拿到正确的access_token');
                send(res, {
                    errcode: -1,
                    errmsg: "invalid access_token"
                });
                return;
            }
            console.log('token 是多少' + access_token, openid);
            get_state_info(access_token, openid, function(suc2, data2) {
                console.log(data2);
                if (suc2) {
                    var openid = data2.openid;
                    var nickname = data2.nickname;
                    var sex = data2.sex;
                    var headimgurl = data2.headimgurl;
                    var account = "wx_" + openid;
                    var yaoqing = uid;
                    console.log('邀请人的uid是多少:' + uid, account, nickname, sex, headimgurl);
                    create_user(account, nickname, sex, headimgurl, yaoqing, roomid, function() {
                        var sign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
                        var ret = {
                            errcode: 0,
                            errmsg: "ok",
                            account: account,
                            halladdr: hallAddr,
                            sign: sign,
                            shareRoomId: roomid
                        };
                        db.is_room_exist(roomid, function(data) {
                            if (!data) {
                                console.log('房间不存在');
                                ret.shareRoomId = null;
                            }
                            console.log('-------------返回的结果是--------------' + ret.account, ret.sign, ret.shareRoomId);
                            send(res, ret);
                        });
                    });
                }
            });
        } else {
            send(res, {
                errcode: -1,
                errmsg: "unknown err."
            });
        }
    });
});
app.get('/base_info', function(req, res) {
    console.log('来取玩家的基本信息');
    var userid = req.query.userid;
    db.get_user_base_info(userid, function(data) {
        var ret = {
            errcode: 0,
            errmsg: "ok",
            name: data.name,
            sex: data.sex,
            headimgurl: data.headimg + '.jpg'
        };
        console.log('取到的玩家的基本信息是' + ret.headimgurl + ret.name);
        send(res, ret);
    });
});
// 客户端从这取到用户的微信code
app.get('/get_wx_code', function(req, res) {
    var sid = req.query.sid;
    console.log('用户sid是------------- ' + sid);
    getAccess_token(sid, function(redisdata) {
        if (redisdata == null) {
            send(res, {
                errcode: 1,
                errmsg: "invalid session_id"
            });
            return;
        }
        var returnValue = JSON.parse(redisdata);
        console.log('获取到的值是多少!!!!!!!!!!!!!!' + returnValue.state + "---code是多少" + returnValue.code);
        if (returnValue.state == null) {
            console.log('邀请人缺失');
            send(res, {
                errcode: 1,
                errmsg: "invalid state code"
            });
            return;
        }
        var returnUID = null;
        var shareRoomId = null;
        var stateLength = returnValue.state.length;
        // roomid号为6位数字
        var roomIdLength = 6;
        shareRoomId = returnValue.state.slice(stateLength - roomIdLength);
        console.log('当前的roomid是多少' + shareRoomId);
        returnValue.state = returnValue.state.substring(0, stateLength - roomIdLength);
        console.log('当前的returnValue.state是多少' + returnValue.state);
        db.check_state_valid(returnValue.state, function(data) {
            var retSt = JSON.parse(data.ts);
            var retUid = JSON.parse(data.uid);
            if (data == null || retSt != 1 || retUid == null) {
                send(res, {
                    errcode: 1,
                    errmsg: "invalid super user"
                });
                return;
            }
            console.log('UID是多少' + retUid);
            returnUID = retUid;
            console.log("the code is " + returnValue.code + "--------uid:" + returnUID);
            var ret = {
                errcode: 0,
                errmsg: "ok",
                code: returnValue.code,
                uid: returnUID,
                roomid: shareRoomId
            };
            send(res, ret);
        });
    });
});
// 活动赠送金币
app.get('/add_sale_gems', function(req, res) {
    console.log('活动赠送金币');
    var batchno = req.query.batchno;
    var timestamp = req.query.timestamp;
    var token = req.query.token;
    var sign = req.query.sign;
    if (batchno == null || timestamp == null || token == null || sign == null) {
        http.send(res, 1, "invalid param!");
        console.log('赠送金币参数不正确');
        return;
    }
    var localsign = crypto.md5(timestamp + batchno + token + config.CHARGE_PRI_KEY);
    if (sign != localsign) {
        console.log('签名验证未通过');
        http.send(res, 1, "sign error");
        return;
    } else {
        db.add_sale_gems(batchno, function(suc) {
            if (suc) {
                console.log('添加金币成功成功');
                db.add_sale_log(batchno, function(suc2) {
                    if (suc2) {
                        console.log('添加记录成功');
                        db.change_goldop_state(batchno, function(suc3) {
                            if (suc3) {
                                console.log('改变状态成功');
                                notify_refresh_gems(batchno, set_userlist_expire);
                                var curTime = Math.floor(Date.now() / 1000);
                                var curToken = Math.random().toString(36).substr(2, 16);
                                var tempSign = crypto.md5(curTime + batchno + curToken + config.CHARGE_PRI_KEY);
                                http.send(res, 0, "sucess", {
                                    timestamp: curTime,
                                    batchno: batchno,
                                    token: curToken,
                                    sign: tempSign
                                });
                            } else {
                                console.log('改变op表状态失败操作失败');
                                http.send(res, 1, "change_goldop_state failed");
                            };
                        });
                    } else {
                        console.log('添加充值记录操作失败');
                        http.send(res, 1, "add gems log failed");
                    }
                });
            } else {
                console.log('插入金币操作失败');
                http.send(res, 1, "add gems failed");
            }
        });
    }
});
// 充值结果
// id,orderno,money,token
app.post('/on_charge_result', multipartMiddleware, function(req, res) {
    console.log('获取充值结果--1', req.body);
    var reqData = req.body;
    var userid = reqData.userid;
    var orderno = reqData.orderno;
    var money = reqData.money;
    var token = reqData.token;
    console.log(token, userid, orderno, money);
    if (userid == null || orderno == null || money == null || token == null) {
        http.send(res, 1, "invalid param!");
        return;
    }
    var sign = crypto.md5(userid + orderno + money + config.CHARGE_PRI_KEY);
    console.log("接收到的值是");
    console.log(sign, userid, orderno, money);
    if (sign != token) {
        console.log('签名验证未通过');
        http.send(res, 1, "sign error");
        return;
    }
    console.log('获取充值结果' + userid + "----" + orderno + "money:" + money);
    db.get_charge_info(userid, orderno, function(data) {
        if (data != null) {
            console.log("data", data);
            var userid = data.userid;
            // FIXME: 切记，钱和金币的换算关系
            var money = data.money;
            var ship_type = data.ship_type;
            if (ship_type == 1) {
                var gems = Math.ceil(data.money * config.CHARGE_EXCHANGE_RATE_C);
                var exchange_rate = config.CHARGE_EXCHANGE_RATE_C;
            } else if (ship_type == 0) {
                var gems = Math.ceil(data.money * config.CHARGE_EXCHANGE_RATE);
                var exchange_rate = config.CHARGE_EXCHANGE_RATE;
            }
            var charge_type = data.pay_type;
            console.log("玩家的金币数数量是");
            console.log(userid, gems);
            if (userid != null && gems != null) {
                db.check_hava_charged(userid, orderno, function(flag) {
                    console.log("查询是否已经充值!", flag, orderno);
                    if (!flag) {
                        console.log("查询到已经充值!");
                        db.add_user_gems(userid, gems, ship_type, function(suc) {
                            if (suc) {
                                db.set_first_charge(userid, money, function(s) {
                                    // 如果充值成功，讲玩家的信息添加到redis，便于用来查询
                                    client.sadd("userlist", userid, function(err) {
                                        if (err) {
                                            console.log('err!!!', err);
                                        } else {
                                            set_userlist_expire();
                                            // 将记录存到充值表中
                                            db.add_charge_log(userid, orderno, gems, money, charge_type, exchange_rate, ship_type, function(suc3) {
                                                if (suc3) {
                                                    http.send(res, 0, "charge success");
                                                } else {
                                                    http.send(res, 1, "add charge log error");
                                                };
                                            })
                                        }
                                    });
                                })
                            } else {
                                http.send(res, 1, " charge failed");
                                return;
                            }
                        });
                    } else {
                        http.send(res, 1, " have charged");
                        return;
                    };
                })
            } else {
                console.log("根据订单没有查询到充值记录");
                http.send(res, 1, "no record!");
                return;
            };
        } else {
            http.send(res, 1, "no charge record");
        };
    });
});