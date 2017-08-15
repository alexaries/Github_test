var net = require("./net");
var userMgr = require("./usermgr");
exports.initHandlers = function(socket, type) {
    net.addHandler(socket, "login_result", function(data) {
        if (data.errcode === 0) {
            setTimeout(function() {
                net.send(socket, "ready");
            }, 3000);
        } else {
            console.log(data.errmsg);
        }
    });
    if (type == 4) {
        net.addHandler(socket, "login_finished", function(data) {});
        net.addHandler(socket, "game_begin_push", function(data) {
            var t = {
                mz: data.gameInfo.baseMoney * 2,
            };
            userMgr.set(socket.userId, t);
        });
        net.addHandler(socket, "game_myTurn_push", function(data) {
            var userData = userMgr.get(socket.userId);
            var t = parseInt(Math.random() * 10) + 1;
            if (data.canOps) {
                if (data.canGen) {
                    if (data.GenMoney <= (userData.mz * 10)) {
                        setTimeout(function() {
                            net.send(socket, "genpai");
                        }, t * 1000);
                    } else {
                        setTimeout(function() {
                            net.send(socket, "qipai");
                        }, t * 1000);
                    }
                }
                if (data.canGuo) {
                    setTimeout(function() {
                        net.send(socket, "rangpai");
                    }, t * 1000);
                }
            }
        });
        net.addHandler(socket, "game_over", function(data) {
            console.log("robot====",socket.userId);
            setTimeout(function() {
                net.send(socket, "ready");
            }, 3000);
        });
    }
    if (type == 2) {
        net.addHandler(socket, "login_finished", function(data) {});
        net.addHandler(socket, "game_begin_push", function(data) {
            var t = parseInt(Math.random() * 2) + 1;
            setTimeout(function() {
                net.send(socket, "kanpai");
            }, t * 1000);
        });
        net.addHandler(socket, "game_circleCount_push", function(data) {
            var t = {
                circleCount: data + 1,
            };
            userMgr.set(socket.userId, t);
        });
        net.addHandler(socket, "game_myTurn_push", function(data) {
            var t = parseInt(Math.random() * 10) + 1;
            if (t > 5) {
                t = t - 5;
            }
            var userData = userMgr.get(socket.userId);
            if (userData.circleCount >= 4) {
                if (data.canBiPai) {
                    net.send(socket, 'wannaToComparePai');
                } else {
                    setTimeout(function() {
                        net.send(socket, 'qipai');
                    }, t * 1000);
                }
            } else {
                if (data.allInFlag) {
                    setTimeout(function() {
                        net.send(socket, 'qipai');
                    }, t * 1000);
                } else {
                    setTimeout(function() {
                        net.send(socket, 'genzhu');
                    }, t * 1000);
                }
            }
        });
        net.addHandler(socket, "game_wannaToCompare_push", function(data) {
            var t = parseInt(Math.random() * 10) + 1;
            if (t > 5) {
                t = t - 5;
            }
            if (data.length < 1) {
                setTimeout(function() {
                    net.send(socket, 'qipai');
                }, t * 1000);
            } else {
                var userId2 = data[Math.floor(Math.random() * data.length)].userid;
                var d = {
                    userId1: socket.userId,
                    userId2: userId2
                }
                setTimeout(function() {
                    net.send(socket, 'bipai', d);
                }, t * 1000);
            }
        });
        net.addHandler(socket, "gameOver_notify_push", function(data) {
            setTimeout(function() {
                net.send(socket, "ready");
            }, 3000);
        });
        net.addHandler(socket, "game_userInBipai_result_push", function(data) {
            if (data.winer == socket.userId && data.from == socket.userId) {
                setTimeout(function() {
                    net.send(socket, 'wannaToComparePai');
                }, 1000);
            }
        });
    }
    if (type == 3) {
        net.addHandler(socket, "game_over", function(data) {
            setTimeout(function() {
                net.send(socket, "ready");
            }, 3000);
        });
        net.addHandler(socket, "game_zhuangSelected_push", function(data) {
            net.send(socket, "zhuangEndFromClient");
        });
    }
};