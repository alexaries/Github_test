"use strict";
cc._RFpush(module, 'd4522T19FRDDZLEYIwuCL4T', 'JbsNetMgr');
// scripts/JbsNetMgr.js

"use strict";

cc.Class({
    extends: cc.Component,
    initHandlers: function initHandlers(GameNet) {
        var self = GameNet;
        cc.vv.match_net.addHandler("signup", function (data) {
            cc.vv.alert.show("提示", "进入比赛队列成功！比赛人数一满您将直接进入游戏！");
        });
        cc.vv.match_net.addHandler("signup_fail", function (data) {
            cc.vv.alert.show("提示", "进入比赛队列失败！");
        });
        cc.vv.match_net.addHandler("create_match_finish", function (data) {
            console.log("create_match_finish", data);
            //达到开始比赛条件
            cc.vv.userMgr.enterRoom(data.roomid);
        });
        cc.vv.match_net.addHandler("match_result", function (data) {
            console.log("match_result", data);
            //处理一轮比赛结果
            if (!data) {
                return;
            }
            var msg = '该轮比赛结束，';
            if (data.isWin) {
                msg += '恭喜进入下一轮！';
            } else {
                msg += '您已被淘汰！';
                cc.vv.match_net.close();
            }
            cc.vv.alert.show('提示', msg);
        });
        cc.vv.match_net.addHandler("match_over", function (data) {
            console.log("match_over", data);
            //处理整个比赛结果
            if (!data) {
                return;
            }
            var msg = '锦标赛结束，';
            var ranking = data.ranking; //排名
            if (ranking == 1) {
                msg += '恭喜获得冠军';
            } else if (ranking == 2) {
                msg += '恭喜获得第二名';
            } else if (ranking == 3) {
                msg += '恭喜获得第三名';
            }
            cc.vv.match_net.close();
            // var reward_num = data.reward_num;
            // var reward_type = data.reward_type;
            // if (reward_type == 1) {
            //     msg += reward_num + '金币！';
            // } else if (reward_type == 2) {
            //     msg += reward_num + '钻石！';
            // }
            cc.vv.alert.show('提示', msg);
        });
        cc.vv.match_net.addHandler("exit_match", function (data) {
            cc.vv.match_net.close();
        });
    }
});

cc._RFpop();