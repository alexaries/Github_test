var crypto = require('../utils/crypto');
var express = require('express');
var bodyParser = require('body-parser');
var db = require('../utils/db');
var http = require('../utils/http');
var redis = require('redis');
var room_service = require("./room_service");
var socket = require("./socket_service");
var client = null;
var app = express();
var config = null;
var BASE_SHARE_URL = null;

function send(res, ret) {
    var str = JSON.stringify(ret);
    res.send(str)
}

function check_account(req, res) {
    var account = req.query.account;
    var sign = req.query.sign;
    if (account == null || sign == null) {
        http.send(res, 1, "unknown error");
        return false;
    }
    /*
     var serverSign = crypto.md5(account + req.ip + config.ACCOUNT_PRI_KEY);
     if(serverSign != sign){
     http.send(res,2,"login failed.");
     return false;
     }
     */
    return true;
}
//设置跨域访问
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By", ' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});
//设置post解析
app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({
    extended: true
})); // for parsing application/x-www-form-urlencoded

app.get('/login', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var ip = req.ip;
    if (ip.indexOf("::ffff:") != -1) {
        ip = ip.substr(7);
    }
    var account = req.query.account;
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, 0, "ok");
            return;
        }
        var ret = {
            account: data.account,
            userid: data.userid,
            name: data.name,
            lv: data.lv,
            exp: data.exp,
            coins: data.coins,
            gems: data.gems,
            ip: ip,
            sex: data.sex,
            is_sign: data.is_sign,
            sign_days: data.sign_days,
            headimg: data.headimg + 'jpg',
            collapse_prise: data.collapse_prise,
            is_first_charge: data.is_first_charge,
            modules: config.MODULES,
            is_open_jbs: config.is_open_jbs, //是否开启锦标赛
        };
        db.get_yaoqing_md5(data.yaoqing, function(data2) {
            if (data2 != null) {
                console.log('yaoqing_md5---' + data2.yaoqing_md5);
                var shareBaseUrl = BASE_SHARE_URL + data2.yaoqing_md5;
                ret.yaoqingUrl = shareBaseUrl;
                ret.yaoqing_key = data2.yaoqing_md5.toString();
                console.log('邀请人发出的基本的地址是:' + ret.yaoqingUrl);
                db.get_room_id_of_user(data.userid, function(roomId) {
                    //如果用户处于房间中，则需要对其房间进行检查。 如果房间还在，则通知用户进入
                    console.log('房间号码是' + roomId);
                    if (roomId != null) {
                        //检查房间是否存在于数据库中
                        db.is_room_exist(roomId, function(retval) {
                            if (retval) {
                                ret.roomid = roomId;
                                ret.room_type = retval.room_type;
                                console.log('房间还在啊' + ret.roomid);
                            } else {
                                //如果房间不在了，表示信息不同步，清除掉用户记录
                                db.set_room_id_of_user(data.userid, null);
                                console.log('房间不在啊');
                            }
                            http.send(res, 0, "ok", ret);
                        });
                    } else {
                        console.log('发回客户端的信息是' + JSON.stringify(ret));
                        http.send(res, 0, "ok", ret);
                    }
                });
            } else {
                console.log('邀请人出错');
                http.send(res, 1, "the super user invalid.");
            }
        });
    });
});
app.get('/judge_room', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var room_type = req.query.room_type;
    var roomId = req.query.roomId;
    var genre = 0;
    db.get_judge_room(roomId, room_type, genre, function(r) {
        if (r) {
            http.send(res, 0, "ok");
        } else {
            http.send(res, 1, "room is not exit");
        }
    });
});
app.get('/create_user', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var account = req.query.account;
    var name = req.query.name;
    var coins = 0;
    var gems = 80000;
    console.log(name);
    db.is_user_exist(account, function(ret) {
        if (!ret) {
            db.create_user(account, name, coins, gems, 0, null, null, function(ret) {
                if (ret == null) {
                    http.send(res, 2, "system error.");
                } else {
                    http.send(res, 0, "ok");
                }
            });
        } else {
            http.send(res, 1, "account have already exist.");
        }
    });
});
app.get('/get_scene', function(req, res) {
    //验证参数合法性
    var data = req.query;
    var room_type = data.room_type;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    db.get_scene(room_type, function(ret) {
        db.get_all_room(room_type, function(r) {
            if (r) {
                for (var i = 0; i < r.length; i++) {
                    for (var j = 0; j < ret.length; j++) {
                        if (r[i].scene == ret[j].id) {
                            if (r[i].user_id0 > 0) {
                                ret[j].online = ret[j].online + 1;
                            }
                            if (r[i].user_id1 > 0) {
                                ret[j].online = ret[j].online + 1;
                            }
                            if (r[i].user_id2 > 0) {
                                ret[j].online = ret[j].online + 1;
                            }
                            if (r[i].user_id3 > 0) {
                                ret[j].online = ret[j].online + 1;
                            }
                            if (r[i].user_id4 > 0) {
                                ret[j].online = ret[j].online + 1;
                            }
                        }
                    }
                }
            }
            http.send(res, 0, "ok", ret);
        })
    })
});
app.get('/get_announcement', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    db.get_announcement_data(function(r) {
        if (r) {
            http.send(res, 0, "ok", r);
        } else {
            http.send(res, 1, "system error");
        }
        return;
    });
});
app.get('/get_user_collapse', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(r) {
        if (r == null) {
            http.send(res, 1, "system error");
            return;
        }
        if (parseInt(r.gems) > 10000) {
            http.send(res, 2, "no need");
            return;
        }
        if (parseInt(r.collapse_prise) >= 2) {
            http.send(res, 2, "no need2");
            return;
        }
        db.update_user_collapse(account, r.collapse_prise, function(d) {
            if (d) {
                db.get_user_data(account, function(data) {
                    if (data == null) {
                        http.send(res, 3, "invalid gems!");
                        return;
                    }
                    var ret = {
                        gems: data.gems,
                        coins: data.coins,
                        collapse_prise: data.collapse_prise
                    };
                    http.send(res, 0, "ok", ret);
                })
            } else {
                http.send(res, 1, "system error");
            }
            return;
        })
    })
});
//首充6元奖励领取
app.get("/get_user_first_charge", function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(r) {
        if (r == null) {
            http.send(res, 1, "system error");
            return;
        }
        if (parseInt(r.is_first_charge) != 1) {
            http.send(res, 2, "no need");
            return;
        }
        db.update_user_first_charge(account, function(d) {
            if (d) {
                db.get_user_data(account, function(data) {
                    if (data == null) {
                        http.send(res, 3, "invalid gems!");
                        return;
                    }
                    var ret = {
                        gems: data.gems,
                        coins: data.coins,
                        is_first_charge: data.is_first_charge
                    };
                    http.send(res, 0, "ok", ret);
                })
            } else {
                http.send(res, 1, "system error");
            }
            return;
        })
    })
});
app.get('/match_room', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    data.account = null;
    data.sign = null;
    var conf = JSON.parse(data.conf);
    db.get_user_data(account, function(r) {
        if (r == null) {
            http.send(res, 1, "系统错误！");
            return;
        }
        if (r.userid && socket.isBaoMing(r.userid)) {
            //锦标赛已报名
            http.send(res, -4, "您已报名锦标赛，无法加入其他房间！");
            return;
        }

        room_service.checkCondition(r, conf.room_type, conf.scene, function(d) {
            if (typeof d == "object") {
                var userId = r.userid;
                var name = r.name;
                conf.consume_num = d.consume_num;
                conf.limit_danzhu = d.limit_danzhu;
                conf.jiazhu1 = d.jiazhu1;
                conf.jiazhu2 = d.jiazhu2;
                conf.jiazhu3 = d.jiazhu3;
                conf.jiazhu4 = d.jiazhu4;
                conf.limit_num = d.limit_num;
                conf.consume_type = d.consume_type;
                //验证玩家状态
                db.get_room_id_of_user(userId, function(roomId) {
                    if (roomId != null) {
                        http.send(res, -3, "您已加入房间，无法匹配！");
                        return;
                    }
                    db.select_room(conf.room_type, conf.scene, 0, function(roomId) {
                        if (roomId == null) {
                            //创建房间
                            room_service.createRoom(account, userId, conf, function(err, roomId) {
                                if (err == 0 && roomId != null) {
                                    room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
                                        if (enterInfo) {
                                            var ret = {
                                                roomid: roomId,
                                                ip: enterInfo.ip,
                                                port: enterInfo.port,
                                                token: enterInfo.token,
                                                time: Date.now()
                                            };
                                            ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
                                            if ((conf.room_type == 4 || conf.room_type == 2 || conf.room_type == 3) && conf.consume_type == 0) {
                                                get_robot_user(roomId, conf.room_type, config.OPEN_ROBOT); //查找机器人发给机器人客户端
                                            }
                                            http.send(res, 0, "ok", ret);
                                        } else {
                                            http.send(res, errcode, "房间不存在！");
                                        }
                                    });
                                } else {
                                    http.send(res, err, "创建房间失败！");
                                }
                            });
                        } else {
                            room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
                                if (enterInfo) {
                                    var ret = {
                                        roomid: roomId,
                                        ip: enterInfo.ip,
                                        port: enterInfo.port,
                                        token: enterInfo.token,
                                        time: Date.now()
                                    };
                                    ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
                                    http.send(res, 0, "ok", ret);
                                } else {
                                    http.send(res, errcode, "加入房间失败！");
                                }
                            });
                        }
                    });
                });
            } else {
                var msg = "";
                if (d == -1) {
                    msg = "钻石不够，无法匹配";
                } else {
                    msg = "金币不够，无法匹配";
                }
                http.send(res, 2, msg);
            }
        });
    })
});
app.get('/exchange_room', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    data.account = null;
    data.sign = null;
    var e_roomid = data.e_roomid;
    var conf = JSON.parse(data.conf);
    db.get_user_data(account, function(r) {
        if (r == null) {
            http.send(res, 1, "系统错误！");
            return;
        }
        if (r.userid && socket.isBaoMing(r.userid)) {
            //锦标赛已报名
            http.send(res, -4, "您已报名锦标赛，无法加入其他房间！");
            return;
        }
        room_service.checkCondition(r, conf.room_type, conf.scene, function(d) {
            if (d) {
                var userId = r.userid;
                var name = r.name;
                conf.consume_num = d.consume_num;
                conf.limit_num = d.limit_num;
                conf.limit_danzhu = d.limit_danzhu;
                conf.jiazhu1 = d.jiazhu1;
                conf.jiazhu2 = d.jiazhu2;
                conf.jiazhu3 = d.jiazhu3;
                conf.jiazhu4 = d.jiazhu4;
                conf.consume_type = d.consume_type;
                //验证玩家状态
                db.get_room_id_of_user(userId, function(roomId) {
                    if (roomId != null) {
                        http.send(res, -1, "您已加入房间，无法匹配！");
                        return;
                    }
                    db.select_room(conf.room_type, conf.scene, e_roomid, function(roomId) {
                        if (roomId == null) {
                            //创建房间
                            room_service.createRoom(account, userId, conf, function(err, roomId) {
                                if (err == 0 && roomId != null) {
                                    room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
                                        if (enterInfo) {
                                            var ret = {
                                                roomid: roomId,
                                                ip: enterInfo.ip,
                                                port: enterInfo.port,
                                                token: enterInfo.token,
                                                time: Date.now()
                                            };
                                            ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
                                            if ((conf.room_type == 4 || conf.room_type == 2 || conf.room_type == 3) && conf.consume_type == 0) {
                                                get_robot_user(roomId, conf.room_type, config.OPEN_ROBOT); //查找机器人发给机器人客户端
                                            }
                                            http.send(res, 0, "ok", ret);
                                        } else {
                                            http.send(res, errcode, "房间不存在！");
                                        }
                                    });
                                } else {
                                    http.send(res, err, "创建房间失败！");
                                }
                            });
                        } else {
                            room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
                                if (enterInfo) {
                                    var ret = {
                                        roomid: roomId,
                                        ip: enterInfo.ip,
                                        port: enterInfo.port,
                                        token: enterInfo.token,
                                        time: Date.now()
                                    };
                                    ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
                                    http.send(res, 0, "ok", ret);
                                } else {
                                    http.send(res, errcode, "进入房间失败！");
                                }
                            });
                        }
                    });
                })
            } else {
                var msg = "";
                if (d == -1) {
                    msg = "钻石不够，无法匹配";
                } else {
                    msg = "金币不够，无法匹配";
                }
                http.send(res, 2, msg);
            }
        })
    })
});

function get_robot_user(roomId, type, flag) {
    if (flag) {
        db.get_robot_user(function(t) {
            if (!t) return;
            for (var i = 0; i < t.length; i++) {
                var data = {
                    userId: t[i].userid,
                    name: t[i].name,
                    roomId: roomId,
                    type: type
                };
                http.get(config.ROBOT_IP, config.ROBOT_PORT, "/get_match_room", data);
            }
        });
    }
};
app.get('/robot_enter_room', function(req, res) {
    var userId = req.query.userId;
    var name = req.query.name;
    var roomId = req.query.roomId;
    room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
        if (enterInfo) {
            var ret = {
                roomid: roomId,
                ip: enterInfo.ip,
                port: enterInfo.port,
                token: enterInfo.token,
                time: Date.now()
            };
            ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
            http.send(res, 0, "ok", ret);
        } else {
            http.send(res, errcode, "enter room failed.");
        }
    });
});
app.get('/create_private_room', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    data.account = null;
    data.sign = null;
    var conf = JSON.parse(data.conf);
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, 1, "system error");
            return;
        }
        var userId = data.userid;
        var name = data.name;
        //验证玩家状态
        db.get_room_id_of_user(userId, function(roomId) {
            if (roomId != null) {
                http.send(res, -1, "user is playing in room now.");
                return;
            }
            //创建房间
            room_service.createRoom(account, userId, conf, function(err, roomId) {
                if (err == 0 && roomId != null) {
                    room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
                        if (enterInfo) {
                            var ret = {
                                roomid: roomId,
                                ip: enterInfo.ip,
                                port: enterInfo.port,
                                token: enterInfo.token,
                                time: Date.now()
                            };
                            ret.sign = crypto.md5(ret.roomid + ret.token + ret.time + config.ROOM_PRI_KEY);
                            http.send(res, 0, "ok", ret);
                        } else {
                            http.send(res, errcode, "room doesn't exist.");
                        }
                    });
                } else {
                    http.send(res, err, "create failed.");
                }
            });
        });
    });
});
app.get('/enter_private_room', function(req, res) {
    var data = req.query;
    var roomId = data.roomid;
    if (roomId == null) {
        http.send(res, -1, "parameters don't match api requirements.");
        return;
    }
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    console.log('Enter_private_room IN!', account);
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, -1, "system error");
            return;
        }
        var userId = data.userid;
        var name = data.name;
        console.log(userId, name, '即将进入房间', roomId);
        //验证玩家状态
        //todo
        //进入房间
        room_service.enterRoom(userId, name, roomId, function(errcode, enterInfo) {
            if (enterInfo) {
                db.is_room_exist(roomId, function(ret) {
                    if (ret) {
                        var ret = {
                            roomid: roomId,
                            ip: enterInfo.ip,
                            port: enterInfo.port,
                            token: enterInfo.token,
                            time: Date.now(),
                            room_type: ret.room_type,
                            scene: ret.scene,
                        };
                        ret.sign = crypto.md5(roomId + ret.token + ret.time + config.ROOM_PRI_KEY);
                        http.send(res, 0, "ok", ret);
                    }
                })
            } else {
                http.send(res, errcode, "enter room failed.");
            }
        });
    });
});
app.get('/get_history_list', function(req, res) {
    var data = req.query;
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, -1, "system error");
            return;
        }
        var userId = data.userid;
        db.get_user_history(userId, function(history) {
            http.send(res, 0, "ok", {
                history: history
            });
        });
    });
});
app.get('/set_user_sign', function(req, res) {
    var data = req.query;
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, -1, "system error");
            return;
        }
        var userId = data.userid;
        db.set_user_sign(userId, function(data) {
            //签到成功后查询签到天数
            if (data) {
                db.get_user_sign_days(userId, function(data) {
                    //获取签到奖励
                    if (data) {
                        var sday = data.sign_days > 6 ? 6 : data.sign_days;
                        db.get_sign_goods(sday, function(data) {
                            if (data) {
                                if (data.type == 1) {
                                    //增加房卡
                                    var ship_type = 0;
                                    db.add_user_gems(userId, data.amount, ship_type, function(suc) {
                                        if (suc) {
                                            use_money_logs(userId, (-1) * data.amount, ship_type, 'qiandao');
                                            http.send(res, 0, "ok", {
                                                data: data
                                            });
                                        } else {
                                            http.send(res, -1, "无法增加房卡");
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            } else {
                http.send(res, -1, "今日已签到");
            }
        });
    });
});
//查询每日签到礼物列表
app.get('/get_sign_list', function(req, res) {
    var data = req.query;
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, -1, "system error");
            return;
        }
        var userId = data.userid;
        db.get_sign_goods_list(userId, function(data) {
            if (data) {
                http.send(res, 0, "ok", {
                    data: data
                });
            } else {
                http.send(res, -1, "err");
            }
        });
    });
});
app.get('/get_games_of_room', function(req, res) {
    var data = req.query;
    var uuid = data.uuid;
    if (uuid == null) {
        http.send(res, -1, "parameters don't match api requirements.");
        return;
    }
    if (!check_account(req, res)) {
        return;
    }
    db.get_games_of_room(uuid, function(data) {
        console.log(data);
        http.send(res, 0, "ok", {
            data: data
        });
    });
});
app.get('/get_detail_of_game', function(req, res) {
    var data = req.query;
    var uuid = data.uuid;
    var index = data.index;
    if (uuid == null || index == null) {
        http.send(res, -1, "parameters don't match api requirements.");
        return;
    }
    if (!check_account(req, res)) {
        return;
    }
    db.get_detail_of_game(uuid, index, function(data) {
        http.send(res, 0, "ok", {
            data: data
        });
    });
});
app.get('/get_user_status', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var account = req.query.account;
    db.get_gems(account, function(data) {
        if (data != null) {
            http.send(res, 0, "ok", {
                gems: data.gems
            });
        } else {
            http.send(res, 1, "get gems failed.");
        }
    });
});
app.get('/get_user_gems_and_coins', function(req, res) {
    var data = req.query;
    if (!check_account(req, res)) {
        return;
    }
    var account = data.account;
    db.get_user_data(account, function(data) {
        if (data == null) {
            http.send(res, -1, "system error");
            return;
        }
        var userId = data.userid;
        db.get_gems_coins_by_uid(userId, function(data) {
            if (data != null) {
                http.send(res, 0, "ok", {
                    gems: data.gems,
                    coins: data.coins
                });
            } else {
                http.send(res, 1, "get gems failed.");
            }
        });
    });
});
app.get('/get_message', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var type = req.query.type;
    if (type == null) {
        http.send(res, -1, "parameters don't match api requirements.");
        return;
    }
    var version = req.query.version;
    db.get_message(type, version, function(data) {
        if (data != null) {
            http.send(res, 0, "ok", {
                msg: data.msg,
                version: data.version
            });
        } else {
            http.send(res, 1, "get message failed.");
        }
    });
});
//判断玩家是否在线
app.get('/is_server_online', function(req, res) {
    if (!check_account(req, res)) {
        return;
    }
    var ip = req.query.ip;
    var port = req.query.port;
    room_service.isServerOnline(ip, port, function(isonline) {
        var ret = {
            isonline: isonline
        };
        http.send(res, 0, "ok", ret);
    });
});
app.get('/need_refresh', function(req, res) {
    console.log('判断是否需要更新信息' + req.query.userid);
    var userid = req.query.userid;
    if (userid == null) {
        http.send(res, 1, "invalid param!");
        return;
    }
    client.SISMEMBER("userlist", userid, function(err, result) {
        if (err) {
            console.log('发生错误' + err);
            http.send(res, 1, "invalid param!");
            return;
        } else {
            console.log('执行操作正常', result);
            if (result == 1) {
                console.log('需要更新当前玩家');
                db.get_gems_coins_by_uid(userid, function(data) {
                    console.log('get_gems', data);
                    if (data == null) {
                        http.send(res, 1, "invalid gems!");
                        return;
                    }
                    var ret = {
                        gems: data.gems,
                        userid: userid,
                        coins: data.coins
                    };
                    console.log('取到的玩家gems' + data.gems);
                    client.SREM("userlist", userid, function(err, result) {
                        if (err) {
                            console.log('发生错误' + err);
                        } else {
                            console.log('移除成功!');
                        }
                    })
                    http.send(res, 0, 'ok', ret);
                });
            } else {
                console.log('不需要更新当前玩家');
                http.send(res, 1, "do not need to be update");
            }
        }
    });
});
// 临时的充值处理
app.get('/go_to_charge', function(req, res) {
    console.log("开始充钱了哦！！！！！！！");
    var userid = req.query.userid;
    var costRMB = Math.ceil(req.query.costRMB);
    var account = req.query.account;
    var sign = req.query.sign;
    var ship_type = req.query.ship_type;
    console.log("开始充钱了哦！！！！！！！" + userid + "----" + costRMB + "RMB---" + account + "-------" + sign);
    // 只能是正整数金额
    var patten = /^[1-9]\d*$/;
    var flag = patten.test(costRMB);
    if (account == null || sign == null || userid == null || costRMB == null || !flag) {
        http.send(res, 1, "unknown error");
        return;
    }
    var curTime = Math.floor(Date.now() / 1000).toString();
    var accountVal = crypto.md5(account).toString();
    var curToken = Math.random().toString(36).substr(2, 16);
    var tempSign = crypto.md5(curTime + costRMB + curToken + config.CHARGE_PRI_KEY).toString();
    console.log("加密前的字符串是:" + tempSign);
    console.log("加密后的结果是" + crypto.md5(tempSign));
    var ret = {
        timestamp: curTime,
        account: accountVal,
        token: curToken,
        money: costRMB,
        sign: tempSign,
        ind: "dcorepay",
        ship_type: ship_type,
        url: config.URL,
    };
    http.send(res, 0, "success", ret);
});
//兑换金币
app.get('/changeJinbi', function(req, res) {
    console.log("开始兑换金币了哦！！！！！！！");
    var userid = req.query.userid;
    var sign = req.query.sign;
    var num_diamond = req.query.num_diamond;
    // 只能是正整数金额
    var patten = /^[1-9]\d*$/;
    var flag = patten.test(num_diamond);
    if (userid == null || sign == null || num_diamond == null || !flag) {
        http.send(res, 1, "param error");
        return;
    }
    db.changeJinbi(userid, num_diamond, function(ret) {
        http.send(res, 0, "success", ret);
    });
});
//获取在线人数
app.get('/get_user_online', function(req, res) {
    room_service.userOnlineNum(function(ret) {
        http.send(res, 0, "success", ret);
    })
});
//获取是否报名锦标赛
app.get('/injinbiao', function(req, res) {
    var data = req.query;
    var ret = socket.isBaoMing(data.userId);
    console.log("/////////", ret);
    if (ret) {
        http.send(res, 0, "success", {
            ip: config.CLIENT_IP,
            port: config.CLIENT_PORT,
        });
    } else {
        http.send(res, 0, "success", false);
    }
});
//获取锦标赛socket服务ip和port，后面可能会加别的限制
app.get('/jinbiao_room', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var userid = req.query.userid;
    var match_id = req.query.match_id;
    if (!userid || !match_id) {
        http.send(res, -1, "参数错误", {});
        return;
    }
    var isBaoMing = socket.isBaoMing(userid);
    if (isBaoMing) {
        //已报名的不可再报名
        http.send(res, -2, "已处于报名队列，不可再报名", {});
        return;
    }
    // 查询比赛并且扣除报名费 
    db.get_match_by_id(match_id, function(match_data) {
        if (!match_data) {
            //查不到该比赛
            http.send(res, -3, "查无此比赛", {});
            return;
        }
        // console.log('match_data', match_data);
        var fee = match_data['fee'];
        var fee_type = match_data['feeType'];
        db.get_gems_coins_by_uid(userid, function(gems_coins) {
            if (!gems_coins) {
                http.send(res, -4, "查不到该用户的钻石和金币", {});
                return;
            }
            var type = null;
            if (fee_type == 1) {
                type = 0;
                if (gems_coins['gems'] < fee) {
                    http.send(res, -5, "报名费不足", {});
                    return;
                }
            } else {
                type = 1;
                if (gems_coins['coins'] < fee) {
                    http.send(res, -5, "报名费不足", {});
                    return;
                }
            }
            db.cost_gems_or_coins(userid, fee, type, function() {
                var ret = {
                    ip: config.CLIENT_IP,
                    port: config.CLIENT_PORT,
                }
                http.send(res, 0, "ok", ret);
            });
        });
    });
});
//退赛
app.get('/tuisai', function(req, res) {
    //验证参数合法性
    var data = req.query;
    //验证玩家身份
    if (!check_account(req, res)) {
        return;
    }
    var userid = req.query.userid;
    var match_id = req.query.match_id;
    if (!userid || !match_id) {
        http.send(res, -1, "参数错误", {});
        return;
    }
    var isBaoMing = socket.isBaoMing(userid);
    if (!isBaoMing) {
        //未报名的不可退赛
        http.send(res, -1, "还没有报名", {});
        return;
    }
    if (!socket.exit_match(userid)) {
        http.send(res, -1, "比赛进行中不能退赛", {});
        return;
    }
    // 查询比赛并且返还80%报名费 
    db.get_match_by_id(match_id, function(match_data) {
        if (!match_data) {
            //查不到该比赛
            http.send(res, -3, "查无此比赛", {});
            return;
        }
        // console.log('match_data', match_data);
        var fee = match_data['fee'];
        fee = fee * (-0.8);
        var fee_type = match_data['feeType'];
        var type = null;
        if (fee_type == 1) {
            type = 0;
        } else {
            type = 1;
        }
        db.cost_gems_or_coins(userid, fee, type, function() {
            http.send(res, 0, "ok");
        });
    });
});
//获取锦标赛数据
app.get('/get_jbs_data', function(req, res) {
    var userid = req.query.userid;
    db.get_jbs_data(function(data) {
        if (data == null) {
            http.send(res, -1, "data is empty!");
        } else {
            var result = {
                zha: [],
                dou: [],
                ma: []
            };
            for (var i in data) {
                var value = data[i];
                var match_id = value['id'];
                var match_type = value['type'];
                var num_in_match = socket.getNumInMatch(match_id);
                value['num_in_match'] = num_in_match; //该比赛已报名的人数
                var is_bao_ming = socket.isBaoMing(userid, match_id);
                value['is_bao_ming'] = is_bao_ming; //判断是否已报名
                var r = socket.ising(userid, match_id);
                console.log(userid, match_id, "ising result =====> ", r);
                if (r[0] == 'true') {
                    value['is_ing'] = 'true';
                    value['num_in_match'] = r[1];
                } else {
                    value['is_ing'] = 'false';
                }
                // value['is_ing'] = socket.ising(userid,match_id);
                if (value.type == 1) {
                    result['zha'].push(value);
                } else if (value.type == 2) {
                    result['dou'].push(value);
                } else if (value.type == 3) {
                    result['ma'].push(value);
                }
            }
            http.send(res, 0, "success", result);
        }
    })
});
//测试socket发送消息 begin
app.get('/sendResult', function(req, res) {
    socket.sendMsg(47, 'match_result', {
        isWin: true
    });
    http.send(res, 0, "success", 1);
});
app.get('/sendOver', function(req, res) {
    socket.sendMsg(47, 'match_over', {
        ranking: 3
    });
    http.send(res, 0, "success", 1);
});
//测试socket发送消息 end
//战绩
app.get('/get_match_log', function(req, res) {
    var userid = req.query.userid;
    if (!userid) return;
    var t = {};
    db.get_jbs_data(function(data) {
        for (var i in data) {
            t[data[i].id] = data[i].name;
        }
        db.get_match_log(userid, function(d) {
            for (var i in d) {
                d[i].game_type = t[d[i].game_type];
            }
            http.send(res, 0, "success", d);
        })
    })
});
app.get('/flushall', function(req, res) {
    socket.flushall();
    http.send(res, 0, "success", true);
});
//测试是否和牌接口，post方式 begin
app.post('/isHu', function(req, res) {
    console.log('isHu', req.body);
    var pai_arr = req.body.pai_arr;
    http.send(res, 0, "success", pai_arr);
});
//测试是否和牌接口，post方式 end
exports.start = function($config) {
    config = $config;
    client = redis.createClient(config.REDIS_PORT, config.REDIS_IP);
    client.select(config.REDIS_DB_NUM);
    client.on('error', function(err) {
        console.log('error' + err);
    });
    app.listen(config.HALL_CLIENT_PORT);
    BASE_SHARE_URL = config.SHARE_URL;
    console.log("client service is listening on port " + config.HALL_CLIENT_PORT);
    console.log("redis client service is listening on port " + config.HALL_CLIENT_PORT);
};
//记录金钱日志
function use_money_logs(userId, money, type, op) {
    db.add_money_logs(userId, money, type, op);
}