var http_service = require("./http_service");

//从配置文件获取服务器信息
var configs = require("../configs.js");
var config = configs.robot_server();

var db = require('../utils/db');
db.init(configs.mysql());

//开启HTTP服务
http_service.start(config);

