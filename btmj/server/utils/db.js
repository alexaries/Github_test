var mysql = require("mysql");
var crypto = require('./crypto');
var console = require('./console');
var pool = null;

function nop(a, b, c, d, e, f, g) {}

function query(sql, callback) {
    console.log('query sql====>', sql);
    pool.getConnection(function(err, conn) {
        if (err) {
            callback(err, null, null);
        } else {
            conn.query(sql, function(qerr, vals, fields) {
                //释放连接
                conn.release();
                //事件驱动回调
                callback(qerr, vals, fields);
            });
        }
    });
};
exports.init = function(config) {
    pool = mysql.createPool({
        host: config.HOST,
        user: config.USER,
        password: config.PSWD,
        database: config.DB,
        port: config.PORT,
    });
};
//检查是不是可以进对应的房间
exports.get_judge_room = function(roomId, room_type, genre, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '" and room_type = ' + room_type + ' and genre = ' + genre;
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
};
exports.is_account_exist = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(true);
            } else {
                callback(false);
            }
        }
    });
};
exports.create_account = function(account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || password == null) {
        callback(false);
        return;
    }
    var psw = crypto.md5(password);
    var sql = 'INSERT INTO t_accounts(account,password) VALUES("' + account + '","' + psw + '")';
    query(sql, function(err, rows, fields) {
        if (err) {
            if (err.code == 'ER_DUP_ENTRY') {
                callback(false);
                return;
            }
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.get_announcement_data = function(callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_announcement order by sort desc';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length == 0) {
                callback(false);
                return;
            }
            callback(rows);
        }
    })
};
exports.get_account_info = function(account, password, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_accounts WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        if (password != null) {
            var psw = crypto.md5(password);
            if (rows[0].password == psw) {
                callback(null);
                return;
            }
        }
        callback(rows[0]);
    });
};
exports.is_user_exist = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT userid FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(true);
    });
}
exports.is_user_sign = function(userid, callback) {
        callback = callback == null ? nop : callback;
        if (userid == null) {
            callback(false);
            return;
        }
        var sql = 'SELECT is_sign FROM t_users WHERE userid = "' + userid + '"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
            }
            if (rows[0].is_sign) {
                callback(false);
                return;
            }
            callback(rows[0]);
        });
    }
    //查看签到天数
exports.get_user_sign_days = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT sign_days FROM t_users WHERE userid = "' + userid + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows[0]) {
            callback(rows[0]);
            return;
        }
        callback(false);
    });
};
exports.set_user_sign = function(userid, callback) {
        callback = callback == null ? nop : callback;
        if (!userid) {
            callback(false);
            return;
        }
        var sql = 'UPDATE t_users SET is_sign = 1,sign_days = sign_days + 1 WHERE is_sign = 0 AND userid = "' + userid + '"';
        // var sql = 'SELECT * FROM t_sign_goods WHERE num = "' + num + '"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
            }
            if (rows.affectedRows != 0) { //签到成功
                callback(true);
                return;
            }
            callback(false);
        });
    }
    //获取对应的签到物品
exports.get_sign_goods = function(num, callback) {
        callback = callback == null ? nop : callback;
        if (num == null) {
            callback(false);
            return;
        }
        var sql = 'SELECT * FROM t_sign_goods WHERE num = "' + num + '"';
        query(sql, function(err, rows, fields) {
            if (err) {
                throw err;
            }
            if (rows) {
                callback(rows[0]);
                return;
            }
            callback(false);
        });
    }
    //查找礼物列表
exports.get_sign_goods_list = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }
    var sql = 'SELECT * FROM t_sign_goods';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        if (rows) {
            callback(rows);
            return;
        }
        callback(false);
    });
}
exports.get_user_data = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};
exports.get_robot_user = function(callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_users WHERE robot = 1 and roomid is null ORDER BY RAND() LIMIT 2';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        for (var i = 0; i < rows.length; i++) {
            rows[i].name = crypto.fromBase64(rows[i].name);
        }
        callback(rows);
    });
};
exports.get_user_data_by_userid = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_users WHERE userid = ' + userid;
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};
/**增加玩家房卡 */
exports.add_user_gems = function(userid, gems, ship_type, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
        return;
    }
    if (ship_type == 0) {
        var sql = 'UPDATE t_users SET gems = gems +' + gems + ' WHERE userid = ' + userid;
    } else if (ship_type == 1) {
        var sql = 'UPDATE t_users SET coins = coins +' + gems + ' WHERE userid = ' + userid;
    }
    query(sql, function(err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};
//设置是否有首充奖励
exports.set_first_charge = function(userid, money, callback) {
    if (money >= 6) {
        var sql = "select * from t_users where userid = " + userid + " and  is_first_charge = 0";
        query(sql, function(err, rows, fields) {
            if (err) {
                callback(null);
                throw err;
            }
            if (rows.length > 0) {
                var sql = 'UPDATE t_users SET is_first_charge = 1 WHERE userid = ' + userid;
                query(sql, function(err, rows, fields) {
                    if (err) {
                        callback(null);
                        return;
                    } else {
                        callback(null);
                        return;
                    }
                })
            } else {
                callback(null);
                return
            }
        })
    } else {
        callback(null);
        return;
    }
};
//领取救济金
exports.update_user_collapse = function(account, collapse_prise, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }
    if (collapse_prise == 0) {
        var gems = 20000;
    } else {
        var gems = 10000;
    }
    var sql = 'UPDATE t_users SET gems = gems + ' + gems + ', collapse_prise = collapse_prise + 1 WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};
//领取首充奖励
exports.update_user_first_charge = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(false);
        return;
    }
    var gems = 10000;
    var sql = 'UPDATE t_users SET gems = gems + ' + gems + ', is_first_charge = 2 WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            return;
        } else {
            callback(rows.affectedRows > 0);
            return;
        }
    });
};
exports.get_gems_coins = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT gems,coins FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};
exports.get_gems = function(account, callback) {
    callback = callback == null ? nop : callback;
    if (account == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT gems FROM t_users WHERE account = "' + account + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};
exports.get_user_history = function(userId, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT history FROM t_users WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        var history = rows[0].history;
        if (history == null || history == "") {
            callback(null);
        } else {
            console.log(history.length);
            history = JSON.parse(history);
            callback(history);
        }
    });
};
exports.update_user_history = function(userId, history, callback) {
    callback = callback == null ? nop : callback;
    if (userId == null || history == null) {
        callback(false);
        return;
    }
    history = JSON.stringify(history);
    var sql = 'UPDATE t_users SET roomid = null, history = \'' + history + '\' WHERE userid = "' + userId + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        }
        if (rows.length == 0) {
            callback(false);
            return;
        }
        callback(true);
    });
};
exports.get_games_of_room = function(room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT game_index,create_time,result FROM t_games_archive WHERE room_uuid = "' + room_uuid + '"';
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows);
    });
};
exports.get_detail_of_game = function(room_uuid, index, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || index == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT base_info,action_records FROM t_games_archive WHERE room_uuid = "' + room_uuid + '" AND game_index = ' + index;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
}
exports.create_user = function(account, name, coins, gems, sex, headimg, yaoqing, roomid, callback) {
    callback = callback == null ? nop : callback;
    if (account == null || name == null || coins == null || gems == null || yaoqing == null || yaoqing == "") {
        console.log("创号失败");
        callback(false);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    } else {
        headimg = 'null';
    }
    if (roomid == "000000" || roomid == null) {
        roomid = 'null';
    }
    name = crypto.toBase64(name);
    var create_time = Math.floor(Date.now() / 1000);
    console.log('当前创号时间是' + create_time);
    var sql = 'INSERT INTO t_users(account,name,coins,gems,sex,headimg,yaoqing,shareroomid,time) VALUES("{0}","{1}",{2},{3},{4},{5},{6},{7},{8})';
    sql = sql.format(account, name, coins, gems, sex, headimg, yaoqing, roomid, create_time);
    console.log("创建新的用户" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(true);
    });
};
exports.update_user_info = function(userid, name, headimg, sex, roomid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    if (headimg) {
        headimg = '"' + headimg + '"';
    } else {
        headimg = 'null';
    }
    if (roomid == "000000" || roomid == null) {
        roomid = 'null';
    }
    name = crypto.toBase64(name);
    var sql = 'UPDATE t_users SET name="{0}",headimg={1},sex={2} ,shareroomid={3} WHERE account="{4}"';
    sql = sql.format(name, headimg, sex, roomid, userid);
    console.log("更新用户" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        callback(rows);
    });
};
exports.get_user_base_info = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT name,sex,headimg FROM t_users WHERE userid={0}';
    sql = sql.format(userid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
        rows[0].name = crypto.fromBase64(rows[0].name);
        callback(rows[0]);
    });
};
exports.get_all_room = function(type, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_rooms WHERE room_type = "' + type + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows);
            } else {
                callback(false);
            }
        }
    });
};
exports.is_room_exist = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(rows[0]);
        }
    });
};
exports.cost_gems_or_coins = function(userid, cost, type, callback) {
    if (!userid || !cost) {
        callback(false);
    }
    callback = callback == null ? nop : callback;
    var sql = null;
    if (parseInt(type) == 0) {
        sql = 'UPDATE t_users SET gems = gems - ' + cost + ' WHERE userid = ' + userid;
    } else if (parseInt(type) == 1) {
        sql = 'UPDATE t_users SET coins = coins - ' + cost + ' WHERE userid = ' + userid;
    }
    console.log('cost_gems_or_coins', sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.add_money_logs = function(userId, money, type, op, callback) {
    callback = callback == null ? nop : callback;
    var create_time = Math.ceil(Date.now() / 1000);
    var sql = "INSERT INTO t_use_money_logs(userid,money,type,create_time,op) VALUES({0},'{1}',{2},{3},'{4}')";
    sql = sql.format(userId, money, type, create_time, op);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.set_room_id_of_user = function(userId, roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId != null) {
        roomId = '"' + roomId + '"';
    }
    var sql = 'UPDATE t_users SET roomid = ' + roomId + ' ,shareroomid = null  WHERE userid = "' + userId + '"';
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            console.log(err);
            callback(false);
            throw err;
        } else {
            callback(rows.length > 0);
        }
    });
};
exports.get_room_id_of_user = function(userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT roomid FROM t_users WHERE userid = "' + userId + '"';
    console.log('查询用户房间信息' + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0].roomid);
            } else {
                callback(null);
            }
        }
    });
};
exports.create_room = function(roomId, conf, ip, port, create_time, roomConf, callback) {
    callback = callback == null ? nop : callback;
    var scene = roomConf.scene ? roomConf.scene : 0,
        genre = roomConf.genre ? roomConf.genre : 0,
        room_type = roomConf.room_type ? roomConf.room_type : 0;
    var sql = "INSERT INTO t_rooms(uuid,id,base_info,ip,port,create_time, scene, room_type, genre) \
                VALUES('{0}','{1}','{2}','{3}',{4},{5},{6},{7},{8})";
    var uuid = Date.now() + roomId;
    var baseInfo = JSON.stringify(conf);
    sql = sql.format(uuid, roomId, baseInfo, ip, port, create_time, scene, room_type, genre);
    // console.log(sql);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(uuid);
        }
    });
};
exports.get_room_uuid = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT uuid FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(rows[0].uuid);
        }
    });
};
exports.get_seat_info_room = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT user_id0,user_id1,user_id2,user_id3,user_id4 FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(rows[0]);
        }
    });
}
exports.update_seat_info = function(roomId, seatIndex, userId, icon, name, userData, callback) {
    callback = callback == null ? nop : callback;
    if (name) {
        var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}" WHERE id = "{4}"';
        name = crypto.toBase64(name);
        sql = sql.format(seatIndex, userId, icon, name, roomId);
    } else {
        var sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = null,user_score{0} = 0 WHERE id = "{3}"';
        sql = sql.format(seatIndex, userId, icon, roomId);
    }
    var score = 0;
    if (userData) {
        sql = 'UPDATE t_rooms SET user_id{0} = {1},user_icon{0} = "{2}",user_name{0} = "{3}",user_score{0} = "{5}" WHERE id = "{4}"';
        score = userData.gems;
        sql = sql.format(seatIndex, userId, icon, name, roomId, score);
    }
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
}
exports.update_num_of_turns = function(roomId, numOfTurns, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET num_of_turns = {0} WHERE id = "{1}"'
    sql = sql.format(numOfTurns, roomId);
    //console.log(sql);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_next_button = function(roomId, nextButton, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_rooms SET next_button = {0} WHERE id = "{1}"'
    sql = sql.format(nextButton, roomId);
    console.log(sql);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.get_room_addr = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false, null, null);
        return;
    }
    var sql = 'SELECT ip,port,room_type FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false, null, null);
            throw err;
        }
        if (rows.length > 0) {
            callback(true, rows[0].ip, rows[0].port, rows[0].room_type);
        } else {
            callback(false, null, null);
        }
    });
};
exports.get_room_data = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT * FROM t_rooms WHERE id = "' + roomId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            if (rows[0].user_name0) {
                rows[0].user_name0 = crypto.fromBase64(rows[0].user_name0);
            }
            if (rows[0].user_name1) {
                rows[0].user_name1 = crypto.fromBase64(rows[0].user_name1);
            }
            if (rows[0].user_name2) {
                rows[0].user_name2 = crypto.fromBase64(rows[0].user_name2);
            }
            if (rows[0].user_name3) {
                rows[0].user_name3 = crypto.fromBase64(rows[0].user_name3);
            }
            callback(rows[0]);
        } else {
            callback(null);
        }
    });
};
exports.delete_room = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_rooms WHERE id = '{0}'";
    sql = sql.format(roomId);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
}
exports.create_game = function(room_uuid, index, base_info, callback) {
    callback = callback == null ? nop : callback;
    var sql = "INSERT INTO t_games(room_uuid,game_index,base_info,create_time) VALUES('{0}',{1},'{2}',unix_timestamp(now()))";
    sql = sql.format(room_uuid, index, base_info);
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            callback(rows.insertId);
        }
    });
};
exports.select_room = function(room_type, scene, e_roomid, callback) {
    callback = callback == null ? nop : callback;
    if (room_type == null || scene == null) {
        callback(false);
    }
    if (e_roomid != 0) {
        var sql = "select * FROM t_rooms WHERE genre = 1 and room_type = {0} and scene = {1} and (user_id0 = 0 or user_id1 = 0 or user_id2 = 0 or user_id3 = 0 or user_id4 = 0 ) and id<>'{2}'";
        sql = sql.format(room_type, scene, e_roomid);
    } else {
        var sql = "select * FROM t_rooms WHERE genre = 1 and room_type = {0} and scene = {1} and (user_id0 = 0 or user_id1 = 0 or user_id2 = 0 or user_id3 = 0 or user_id4 = 0 )";
        sql = sql.format(room_type, scene);
    }
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                var i = Math.round(Math.random() * (rows.length - 1));
                callback(rows[i].id);
            } else {
                callback(null);
            }
        }
    });
};
exports.delete_games = function(room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "DELETE FROM t_games WHERE room_uuid = '{0}'";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.archive_games = function(room_uuid, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null) {
        callback(false);
    }
    var sql = "INSERT INTO t_games_archive(SELECT * FROM t_games WHERE room_uuid = '{0}')";
    sql = sql.format(room_uuid);
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            exports.delete_games(room_uuid, function(ret) {
                callback(ret);
            });
        }
    });
}
exports.update_game_action_records = function(room_uuid, index, actions, callback) {
    callback = callback == null ? nop : callback;
    var sql = "UPDATE t_games SET action_records = '" + actions + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.update_game_result = function(room_uuid, index, result, callback) {
    callback = callback == null ? nop : callback;
    if (room_uuid == null || result) {
        callback(false);
    }
    result = JSON.stringify(result);
    var sql = "UPDATE t_games SET result = '" + result + "' WHERE room_uuid = '" + room_uuid + "' AND game_index = " + index;
    //console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.get_message = function(type, version, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_message WHERE type = "' + type + '"';
    if (version == "null") {
        version = null;
    }
    if (version) {
        version = '"' + version + '"';
        sql += ' AND version != ' + version;
    }
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};
// 取到微信授权时的code
exports.get_sid_code = function(sid, callback) {
    callback = callback == null ? nop : callback;
    if (sid == null) {
        callback(false);
    }
    var sql = 'SELECT * FROM t_session_pool where session_id = "' + sid + '"';
    console.log("获取sessionid查询语句是:" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};
// 验证邀请人是否有效
exports.check_state_valid = function(state, callback) {
    callback = callback == null ? nop : callback;
    if (state == null) {
        callback(false);
    }
    var sql = 'SELECT COUNT(uid) AS ts ,uid AS uid FROM dealers_db.go_member WHERE MD5(username)="' + state + '"and ind=1';
    console.log("查询语句是:" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};
// 获取邀请人的md5值
exports.get_yaoqing_md5 = function(yaoqing, callback) {
    callback = callback == null ? nop : callback;
    if (yaoqing == null) {
        callback(false);
    }
    var sql = 'SELECT MD5(username) as yaoqing_md5 FROM dealers_db.go_member WHERE uid="' + yaoqing + '"';
    console.log("查询语句是:" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};
// 获取邀请人的uid
exports.get_yaoqing_uid = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(false);
    }
    var sql = 'SELECT yaoqing FROM t_users WHERE userid="' + userid + '"';
    console.log("查询语句是:" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length > 0) {
                callback(rows[0]);
            } else {
                callback(null);
            }
        }
    });
};
// 添加金币发放
exports.add_sale_log = function(batchno, callback) {
    callback = callback == null ? nop : callback;
    if (batchno == null) {
        callback(false);
    };
    var sql = "INSERT INTO t_sell_log(userid,gems_num,seller_id,charge_type,addtime,batchno)" + "(SELECT custom_id,qty,uid,ind,addtime,batchno FROM dealers_db.go_goldcoin_op WHERE dealers_db.go_goldcoin_op.batchno = '{0}' AND dealers_db.go_goldcoin_op.st = 0);";
    sql = sql.format(batchno);
    // console.log("执行的add_sale_log语句是" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
// 批量添加玩家金币
exports.add_sale_gems = function(batchno, callback) {
        callback = callback == null ? nop : callback;
        if (batchno == null) {
            callback(false);
        };
        // var sql = "UPDATE game_db.t_users a,  dealers_db.go_goldcoin_op b SET a.gems = a.gems + b.qty WHERE a.userid = b.custom_id AND b.batchno = '{0}' AND b.st = 0;"
        var sql = "UPDATE game_db.t_users a INNER JOIN dealers_db.go_goldcoin_op b  ON a.userid = b.custom_id SET a.gems = a.gems + b.qty, b.result = '充值成功' WHERE b.batchno = '{0}' AND b.st = 0;";
        sql = sql.format(batchno);
        // console.log('给玩家添加金币' + sql);
        query(sql, function(err, rows, fields) {
            if (err) {
                callback(false);
                throw err;
                return;
            } else {
                callback(true);
            }
        });
    }
    // 改变操作金币的状态
exports.change_goldop_state = function(batchno, callback) {
        callback = callback == null ? nop : callback;
        if (batchno == null) {
            callback(false);
        };
        var sql = 'update dealers_db.go_goldcoin_op set dealers_db.go_goldcoin_op.st = 1 ,dealers_db.go_goldcoin_op.result = "充值成功，添加记录成功" where batchno = "{0}"; ';
        sql = sql.format(batchno);
        // console.log('change_goldop_state' + sql);
        query(sql, function(err, rows, fields) {
            if (err) {
                callback(false);
                throw err;
                return;
            } else {
                callback(true);
            }
        });
    }
    // 获取需要更新金币数量的玩家
exports.get_refresh_userlist = function(batchno, callback) {
    callback = callback == null ? nop : callback;
    if (batchno == null) {
        callback(false);
    };
    var sql = ' SELECT userid FROM t_sell_log WHERE batchno = "{0}"; ';
    sql = sql.format(batchno);
    console.log('get_refresh_userlist' + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
            return;
        } else {
            if (rows.length > 0) {
                callback(rows);
            } else {
                callback(null);
            }
        }
    });
}
exports.get_gems_by_uid = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT gems FROM t_users WHERE userid = "' + userid + '"';
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};
exports.get_gems_coins_by_uid = function(userid, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null) {
        callback(null);
        return;
    }
    var sql = 'SELECT gems,coins FROM t_users WHERE userid = "' + userid + '"';
    console.log(sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length == 0) {
            callback(null);
            return;
        }
        callback(rows[0]);
    });
};
//  添加一条充值log
exports.get_charge_info = function(userid, orderno, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || orderno == null) {
        callback(null);
    }
    var sql = "SELECT * FROM game_db.t_users_rechange_record WHERE userid = {0}  AND  orderno = '{1}';"
    sql = sql.format(userid, orderno);
    console.log("查询语句是:" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        } else {
            if (rows.length == 0) {
                callback(null);
                return;
            }
            callback(rows[0]);
        }
    });
};
// 添加金币发放
exports.add_charge_log = function(userid, orderno, gems, money, charge_type, exchange_rate, ship_type, callback) {
    callback = callback == null ? nop : callback;
    if (userid == null || orderno == null || gems == null || money == null || charge_type == null || exchange_rate == null) {
        callback(false);
    };
    var addtime = Math.floor(Date.now() / 1000);
    if (ship_type == 0) {
        var sql = "INSERT INTO t_charge_log(userid,orderno,gems_num,cost_money,charge_type,time,goldcoin_exchange_rate) value({0},'{1}',{2},{3},'{4}',{5},{6});";
    } else if (ship_type == 1) {
        var sql = "INSERT INTO t_charge_log(userid,orderno,coins_num,cost_money,charge_type,time,goldcoin_exchange_rate) value({0},'{1}',{2},{3},'{4}',{5},{6});";
    }
    sql = sql.format(userid, orderno, gems, money, charge_type, addtime, exchange_rate);
    console.log("执行的add_charge_log语句是" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(true);
        }
    });
};
exports.check_hava_charged = function(userid, orderno, callback) {
    console.log("check_hava_charged", userid, orderno);
    callback = callback == null ? nop : callback;
    if (userid == null || orderno == null) {
        callback(false);
    };
    var sql = "SELECT * FROM t_charge_log WHERE userid = {0} AND orderno = '{1}';";
    sql = sql.format(userid, orderno);
    console.log("check_hava_charged" + sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            console.log("没有数据出错了");
            callback(false);
            throw err;
        } else {
            if (rows.length == 0) {
                console.log("没有数据");
                callback(false);
                return;
            }
            console.log("有数据!");
            callback(true);
        }
    });
};
exports.select_scene = function(room_type, scene, callback) {
    callback = callback == null ? nop : callback;
    var sql = "select * from t_scene where room_type={0} and id ={1}";
    sql = sql.format(room_type, scene);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length == 0) {
                callback(false);
                return;
            }
            callback(rows[0]);
        }
    });
};
exports.get_scene = function(room_type, callback) {
    callback = callback == null ? nop : callback;
    var sql = "select * from t_scene where room_type = " + room_type;
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            if (rows.length == 0) {
                callback(false);
                return;
            }
            callback(rows);
        }
    });
};
/*扣取擂台费*/
exports.enter_lei = function(leiZhu, gongLei, fixed, feeNum, feeType, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET gems = gems - {0},{1}={1}-{2} where userid = "{3}"'; //扣除攻擂者
    if (feeType == 0) {
        feeType = 'gems';
    } else if (feeType == 1) {
        feeType = 'coins';
    }
    sql = sql.format(fixed, feeType, feeNum, gongLei);
    console.log('enter_lei', sql);
    var sql_shoulei = 'UPDATE t_users SET {1}={1}+{2} where userid = "{3}"'; //1%加给擂主，固定的1万金币给平台
    sql_shoulei = sql_shoulei.format(fixed, feeType, feeNum, leiZhu);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            query(sql_shoulei, function(err, row, fields) {
                if (err) {
                    callback(false);
                    throw err;
                } else {
                    callback(true);
                }
            });
        }
    });
};
/*攻擂成功*/
exports.success_gonglei = function(leiZhu, gongLei, feeNum, feeType, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET {0}={0}-{1} where userid = "{2}"'; //扣除守擂者
    if (feeType == 0) {
        feeType = 'gems';
    } else if (feeType == 1) {
        feeType = 'coins';
    }
    sql = sql.format(feeType, feeNum, leiZhu);
    var sql_gonglei = 'UPDATE t_users SET {0}={0}+{1} where userid = "{2}"'; //加给攻擂者
    sql_gonglei = sql_gonglei.format(feeType, feeNum, gongLei);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
        } else {
            query(sql_gonglei, function(err, row, fields) {
                if (err) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
};
/*攻擂失败*/
exports.fail_gonglei = function(leiZhu, gongLei, feeNum, feeType, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'UPDATE t_users SET {0}={0}-{1} where userid = "{2}"'; //扣除攻擂者
    if (feeType == 0) {
        feeType = 'gems';
    } else if (feeType == 1) {
        feeType = 'coins';
    }
    sql = sql.format(feeType, feeNum, gongLei);
    var sql_gonglei = 'UPDATE t_users SET {0}={0}+{1} where userid = "{2}"'; //加给守擂者
    sql_gonglei = sql_gonglei.format(feeType, feeNum, leiZhu);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
        } else {
            query(sql_gonglei, function(err, row, fields) {
                if (err) {
                    callback(false);
                } else {
                    callback(true);
                }
            });
        }
    });
};
/*兑换金币*/
exports.changeJinbi = function(userid, num_diamond, callback) {
    callback = callback == null ? nop : callback;
    var num_jinbi = parseInt(num_diamond) * 100;
    var sql = 'UPDATE t_users SET gems = gems + {0},coins = coins - {1} where userid = "{2}"'; //扣除钻石，增加金币
    sql = sql.format(num_jinbi, num_diamond, userid);
    console.log('sql==>', sql);
    var sql_select = 'select gems,coins from t_users where userid = "{0}"';
    sql_select = sql_select.format(userid);
    console.log('sql_select==>', sql_select);
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            query(sql_select, function(err, row, fields) {
                if (err) {
                    callback(false);
                    throw err;
                } else {
                    console.log('row==>', row);
                    if (row && row.length > 0) {
                        var ret = {
                            jinbi: row[0].gems,
                            diamond: row[0].coins,
                            userid: userid
                        };
                        callback(ret);
                    }
                }
            });
        }
    });
};
// 猜拳判断手续费是否满足
exports.has_enough_fee = function(gongLei, fixed, feeNum, feeType, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT gems,coins FROM t_users WHERE userid = ' + gongLei; //扣除攻擂者
    query(sql, function(err, row, fields) {
        if (err) {
            callback(false);
            throw err;
        } else {
            callback(row[0]);
        }
    });
};
exports.get_users_in_room = function(roomId, callback) {
    callback = callback == null ? nop : callback;
    if (roomId == null) {
        callback(null);
        return;
    }
    var users = {};
    var sql_users = 'SELECT * FROM t_users WHERE roomid = "' + roomId + '"';
    query(sql_users, function(err, rows_users, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows_users.length > 0) {
            for (var i in rows_users) {
                var user = rows_users[i];
                users[user.userid] = user;
            }
        }
        callback(users);
    });
};
exports.get_jbs_data = function(callback) {
    callback = callback == null ? nop : callback;
    var sql_users = 'SELECT * FROM t_match';
    query(sql_users, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            callback(rows);
        } else {
            callback(null);
        }
    });
};
exports.get_match_by_id = function(match_id, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match where id = ' + match_id;
    console.log('get_match_by_id', sql);
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            callback(rows[0]);
        } else {
            callback(null);
        }
    });
};
exports.get_match_award = function(id, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match WHERE id = "' + id + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            callback(null);
            throw err;
        }
        if (rows.length > 0) {
            var result = [rows[0]['rewardFirst'], rows[0]['rewardSecond'], rows[0]['rewardThird']];
            callback(result);
        } else {
            callback(null);
        }
    })
};
exports.match_log = function(userId, type) {
    var sql = 'INSERT INTO t_match_log(userid,game_type, result) VALUES("' + userId + '","' + type + '", "lose")';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        }
    });
};
exports.update_match_log = function(userId, data) {
    var sql_id = 'SELECT max(id) FROM t_match_log WHERE userid = "' + userId + '"';
    query(sql_id, function(err, rows, fields) {
        if (err) {
            throw err;
        } else {
            var t = rows[0]['max(id)'];
            var sql = 'UPDATE t_match_log SET result = "' + data + '" WHERE id = "' + t + '"';
            query(sql, function(err, rows, fields) {
                if (err) {
                    throw err;
                }
            });
        }
    })
};
exports.get_match_log = function(userId, callback) {
    callback = callback == null ? nop : callback;
    var sql = 'SELECT * FROM t_match_log WHERE userid = "' + userId + '"';
    query(sql, function(err, rows, fields) {
        if (err) {
            throw err;
        } else {
            if (rows.length == 0) {
                callback(false);
                return;
            }
            callback(rows);
        }
    })
};
exports.query = query;
//清理机器人
exports.clearRobot = function(room_type) {
    var sql_robot_users = 'SELECT userid FROM t_users WHERE robot = 1;';
    query(sql_robot_users, function(err_robot, rows_robot, fields_robot) {
        if (err_robot) {
            throw err_robot;
        } else {
            if (rows_robot.length == 0) {
                return;
            }
            var robot_arr = [];
            for (var i in rows_robot) {
                robot_arr.push(rows_robot[i].userid);
            }
            var sql = 'SELECT * FROM t_rooms WHERE room_type = ' + room_type;
            query(sql, function(err_rooms, rows_rooms, fields_rooms) {
                if (err_rooms) {
                    throw err_rooms;
                } else {
                    var clear_sql_arr = [];
                    for (var j in rows_rooms) {
                        var room = rows_rooms[j];
                        for (var n = 0; n < 5; n++) {
                            // console.log('room',room);
                            var userid = room['user_id' + n];
                            // console.log('userid',userid);
                            if (robot_arr.indexOf(userid) > -1) {
                                var uuid = room['uuid'];
                                var clear_sql_users = 'update t_users set roomid = null where userid = ' + userid;
                                var clear_sql_rooms = 'update t_rooms set user_id' + n + ' = 0,user_icon' + n + ' = 0,user_name' + n + ' = null,user_score' + n + ' = 0 where uuid = ' + uuid;
                                clear_sql_arr.push(clear_sql_users);
                                clear_sql_arr.push(clear_sql_rooms);
                                query(clear_sql_users,function(){});
                                query(clear_sql_rooms,function(){});
                            }
                        }
                    }
                    // console.log('clear_sql_arr', clear_sql_arr);
                }
            });
        }
    });
};