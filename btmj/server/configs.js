//  配置实际的服务器ip地址
// var HALL_IP = "116.62.214.79";
var HALL_IP = "127.0.0.1";
// 端口好配置
var HALL_CLIENT_PORT = 9010;
var HALL_ROOM_PORT = 9020;
var ACCOUNT_PRI_KEY = "^&*#$%()@";
var ROOM_PRI_KEY = "~!@#$(*&^%$&";
// 充值用的密钥
var CHARGE_PRI_KEY = "#20170327&i5dD56&#";
var LOCAL_IP = 'localhost';
// 数据库配置信息
exports.mysql = function() {
    return {
        HOST: LOCAL_IP,
        USER: 'root',
        PSWD: '123456',
        // PSWD: '#mJ@2017p02J24G7u3#',
        DB: 'game_db',
        PORT: 3306,
    }
};
//账号服配置
exports.account_server = function() {
    return {
        CLIENT_PORT: 9009,
        HALL_IP: HALL_IP,
        HALL_CLIENT_PORT: HALL_CLIENT_PORT,
        ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,
        //
        DEALDER_API_IP: LOCAL_IP,
        DEALDER_API_PORT: 12981,
        VERSION: '20170320',
        APP_WEB: '',
        CHARGE_EXCHANGE_RATE: 10000,
        CHARGE_EXCHANGE_RATE_C: 100, //兑换钻石比例
        CHARGE_PRI_KEY: CHARGE_PRI_KEY,
        APPID: "wx0b291371dfdfb2a0",
        SECRET: "ea5bd860a1e128b4e565cec305c654c9"
    };
};
//大厅服配置
exports.hall_server = function() {
    return {
        HALL_IP: HALL_IP,
        HALL_CLIENT_PORT: HALL_CLIENT_PORT,
        FOR_ROOM_IP: LOCAL_IP,
        ROOM_PORT: HALL_ROOM_PORT,
        ACCOUNT_PRI_KEY: ACCOUNT_PRI_KEY,
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        CHARGE_PRI_KEY: CHARGE_PRI_KEY,
        //暴露给客户端的socket接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 9090,
        MODULES: [0, 1, 3, 4, 5], //0-德州扑克 1-炸金花 2-包头麻将 3-武汉麻将 4-斗牛 5-锦标赛 6-斗地主
        is_open_jbs: true, //是否开放锦标赛
        URL: "http://mj.yajugame.com/manage1/?/go/index/payDo/",
        SHARE_URL: "http://mj.yajugame.com/wx_app.php?is=btmj",
        ROBOT_IP: LOCAL_IP,
        ROBOT_PORT: 9053,
        OPEN_ROBOT: true,
        REDIS_IP: "127.0.0.1", //redis数据库ip地址
        REDIS_PORT: 6379, //redis数据库端口
        REDIS_DB_NUM: 15, //redis数据库编号
    };
};
//游戏服配置
exports.game_server = function() {
    return {
        SERVER_ID: "001",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9003,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19000,
    };
};
//游戏服配置
exports.zjh_server = function() {
    return {
        SERVER_ID: "002",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9013,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19010,
    };
};
//游戏服配置
exports.cq_server = function() {
    return {
        SERVER_ID: "003",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9023,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19020,
    };
};
//游戏服配置
exports.dn_server = function() {
    return {
        SERVER_ID: "004",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9033,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19030,
    };
};
//游戏服配置
exports.dzpk_server = function() {
    return {
        SERVER_ID: "005",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9043,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19040,
    };
};
//机器人服务器配置
exports.robot_server = function() {
    return {
        SERVER_ID: "006",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9053,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        HALL_CLIENT_PORT: HALL_CLIENT_PORT,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19050,
    };
};
//武汉麻将
//游戏服配置
exports.wh_majiang_server = function() {
    return {
        SERVER_ID: "007",
        //暴露给大厅服的HTTP端口号
        HTTP_PORT: 9063,
        //HTTP TICK的间隔时间，用于向大厅服汇报情况
        HTTP_TICK_TIME: 5000,
        //大厅服IP
        HALL_IP: LOCAL_IP,
        FOR_HALL_IP: LOCAL_IP,
        //大厅服端口
        HALL_PORT: HALL_ROOM_PORT,
        //与大厅服协商好的通信加密KEY
        ROOM_PRI_KEY: ROOM_PRI_KEY,
        //暴露给客户端的接口
        CLIENT_IP: HALL_IP,
        CLIENT_PORT: 19060,
    };
};