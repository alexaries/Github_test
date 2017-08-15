/*
Navicat MySQL Data Transfer

Source Server         : local
Source Server Version : 50717
Source Host           : localhost:3306
Source Database       : dealers_db

Target Server Type    : MYSQL
Target Server Version : 50717
File Encoding         : 65001

Date: 2017-05-09 15:38:29
*/

SET FOREIGN_KEY_CHECKS=0;

-- ----------------------------
-- Table structure for go_admin
-- ----------------------------
DROP TABLE IF EXISTS `go_admin`;
CREATE TABLE `go_admin` (
  `uid` tinyint(3) unsigned NOT NULL AUTO_INCREMENT,
  `mid` tinyint(3) unsigned NOT NULL,
  `username` char(15) NOT NULL,
  `userpass` char(32) NOT NULL,
  `useremail` varchar(100) DEFAULT NULL,
  `addtime` int(10) unsigned DEFAULT NULL,
  `logintime` int(10) unsigned DEFAULT NULL,
  `loginip` varchar(15) DEFAULT NULL,
  `type_id` tinyint(4) NOT NULL DEFAULT '1' COMMENT '后台管理员类型',
  PRIMARY KEY (`uid`),
  KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='管理员表';

-- ----------------------------
-- Records of go_admin
-- ----------------------------
INSERT INTO `go_admin` VALUES ('1', '0', 'admin', '4e12fc4e9b1a00eb8d57bbcd92e05909', null, null, '1493698192', '101.90.252.26', '1');
INSERT INTO `go_admin` VALUES ('19', '0', 'kefu', 'e10adc3949ba59abbe56e057f20f883e', '441413132@qq.com', '1478674847', '0', '60.178.207.103', '14');
INSERT INTO `go_admin` VALUES ('20', '0', 'yj-zzy', 'a4c81d27e608e0edeff6543f49cd193a', '491345175@qq.com', '1493281297', '0', '180.173.220.75', '1');

-- ----------------------------
-- Table structure for go_admin_goldcoin_log
-- ----------------------------
DROP TABLE IF EXISTS `go_admin_goldcoin_log`;
CREATE TABLE `go_admin_goldcoin_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '序号',
  `uid` int(11) unsigned DEFAULT NULL COMMENT '管理用户',
  `to_uid` int(11) unsigned DEFAULT NULL COMMENT '会员用户',
  `to_uid_ind` tinyint(2) unsigned DEFAULT '0' COMMENT '用户类型 0:会员 1：客户',
  `qty` decimal(10,2) unsigned DEFAULT NULL COMMENT '金币数量',
  `remark` varchar(50) DEFAULT NULL COMMENT '备注',
  `addtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_admin_goldcoin_log
-- ----------------------------

-- ----------------------------
-- Table structure for go_admin_type
-- ----------------------------
DROP TABLE IF EXISTS `go_admin_type`;
CREATE TABLE `go_admin_type` (
  `type_id` int(11) NOT NULL AUTO_INCREMENT COMMENT '类型id号',
  `name` varchar(255) NOT NULL DEFAULT '' COMMENT '权限名称',
  `purview` text COMMENT '权限内容',
  `status` tinyint(4) NOT NULL DEFAULT '0' COMMENT '是否启用',
  `remark` varchar(255) DEFAULT NULL COMMENT '简短描述',
  `addtime` varchar(255) DEFAULT NULL COMMENT '添加时间',
  `addip` varchar(255) DEFAULT NULL COMMENT '添加ip',
  PRIMARY KEY (`type_id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8 COMMENT='用户类型表';

-- ----------------------------
-- Records of go_admin_type
-- ----------------------------
INSERT INTO `go_admin_type` VALUES ('1', 'admin', 'a:55:{i:0;s:1:\"6\";i:1;s:1:\"8\";i:2;s:2:\"13\";i:3;s:2:\"14\";i:4;s:2:\"15\";i:5;s:2:\"16\";i:6;s:2:\"17\";i:7;s:2:\"18\";i:8;s:2:\"19\";i:9;s:3:\"102\";i:10;s:3:\"103\";i:11;s:3:\"104\";i:12;s:3:\"105\";i:13;s:3:\"106\";i:14;s:3:\"168\";i:15;s:3:\"169\";i:16;s:1:\"9\";i:17;s:2:\"21\";i:18;s:2:\"22\";i:19;s:2:\"23\";i:20;s:2:\"24\";i:21;s:2:\"25\";i:22;s:2:\"26\";i:23;s:3:\"109\";i:24;s:3:\"110\";i:25;s:2:\"32\";i:26;s:2:\"34\";i:27;s:2:\"82\";i:28;s:2:\"84\";i:29;s:2:\"85\";i:30;s:2:\"86\";i:31;s:2:\"89\";i:32;s:2:\"90\";i:33;s:3:\"149\";i:34;s:3:\"175\";i:35;s:3:\"176\";i:36;s:3:\"177\";i:37;s:3:\"178\";i:38;s:3:\"179\";i:39;s:3:\"180\";i:40;s:2:\"95\";i:41;s:2:\"96\";i:42;s:3:\"157\";i:43;s:3:\"158\";i:44;s:3:\"159\";i:45;s:3:\"160\";i:46;s:3:\"161\";i:47;s:3:\"170\";i:48;s:2:\"99\";i:49;s:3:\"100\";i:50;s:3:\"101\";i:51;s:3:\"164\";i:52;s:3:\"165\";i:53;s:3:\"166\";i:54;s:3:\"167\";}', '1', '', '1490691919', '218.74.249.166');
INSERT INTO `go_admin_type` VALUES ('14', '客服', 'a:68:{i:0;s:2:\"32\";i:1;s:2:\"50\";i:2;s:2:\"51\";i:3;s:2:\"52\";i:4;s:2:\"53\";i:5;s:2:\"54\";i:6;s:2:\"66\";i:7;s:3:\"123\";i:8;s:3:\"124\";i:9;s:3:\"126\";i:10;s:3:\"127\";i:11;s:3:\"128\";i:12;s:3:\"129\";i:13;s:3:\"130\";i:14;s:3:\"131\";i:15;s:3:\"132\";i:16;s:3:\"133\";i:17;s:3:\"134\";i:18;s:3:\"135\";i:19;s:3:\"172\";i:20;s:2:\"56\";i:21;s:3:\"136\";i:22;s:2:\"59\";i:23;s:2:\"60\";i:24;s:2:\"61\";i:25;s:2:\"62\";i:26;s:2:\"63\";i:27;s:3:\"137\";i:28;s:3:\"138\";i:29;s:3:\"139\";i:30;s:3:\"140\";i:31;s:3:\"141\";i:32;s:3:\"171\";i:33;s:2:\"67\";i:34;s:3:\"142\";i:35;s:2:\"70\";i:36;s:2:\"71\";i:37;s:2:\"73\";i:38;s:3:\"143\";i:39;s:3:\"144\";i:40;s:3:\"145\";i:41;s:3:\"146\";i:42;s:3:\"147\";i:43;s:3:\"148\";i:44;s:3:\"174\";i:45;s:2:\"75\";i:46;s:2:\"76\";i:47;s:2:\"77\";i:48;s:2:\"79\";i:49;s:2:\"82\";i:50;s:2:\"83\";i:51;s:2:\"84\";i:52;s:2:\"85\";i:53;s:2:\"86\";i:54;s:2:\"87\";i:55;s:2:\"88\";i:56;s:2:\"89\";i:57;s:2:\"90\";i:58;s:3:\"149\";i:59;s:3:\"150\";i:60;s:3:\"151\";i:61;s:3:\"152\";i:62;s:3:\"153\";i:63;s:3:\"154\";i:64;s:3:\"175\";i:65;s:2:\"92\";i:66;s:3:\"155\";i:67;s:3:\"156\";}', '1', 'kefu', '1478674726', '60.178.207.103');
INSERT INTO `go_admin_type` VALUES ('15', '财务', 'a:20:{i:0;s:2:\"32\";i:1;s:2:\"82\";i:2;s:2:\"83\";i:3;s:2:\"84\";i:4;s:2:\"85\";i:5;s:2:\"86\";i:6;s:2:\"87\";i:7;s:2:\"88\";i:8;s:2:\"89\";i:9;s:2:\"90\";i:10;s:3:\"149\";i:11;s:3:\"150\";i:12;s:3:\"151\";i:13;s:3:\"152\";i:14;s:3:\"153\";i:15;s:3:\"154\";i:16;s:3:\"175\";i:17;s:2:\"92\";i:18;s:3:\"155\";i:19;s:3:\"156\";}', '1', 'caiwu', '1478674755', '60.178.207.103');
INSERT INTO `go_admin_type` VALUES ('16', '运营', 'a:88:{i:0;s:2:\"32\";i:1;s:2:\"12\";i:2;s:2:\"35\";i:3;s:2:\"36\";i:4;s:3:\"111\";i:5;s:3:\"112\";i:6;s:3:\"113\";i:7;s:3:\"114\";i:8;s:3:\"115\";i:9;s:3:\"116\";i:10;s:2:\"38\";i:11;s:2:\"39\";i:12;s:2:\"41\";i:13;s:2:\"43\";i:14;s:2:\"44\";i:15;s:2:\"46\";i:16;s:2:\"47\";i:17;s:3:\"117\";i:18;s:3:\"118\";i:19;s:3:\"119\";i:20;s:3:\"120\";i:21;s:3:\"121\";i:22;s:3:\"122\";i:23;s:2:\"50\";i:24;s:2:\"51\";i:25;s:2:\"52\";i:26;s:2:\"53\";i:27;s:2:\"54\";i:28;s:2:\"66\";i:29;s:3:\"123\";i:30;s:3:\"124\";i:31;s:3:\"126\";i:32;s:3:\"127\";i:33;s:3:\"128\";i:34;s:3:\"129\";i:35;s:3:\"130\";i:36;s:3:\"131\";i:37;s:3:\"132\";i:38;s:3:\"133\";i:39;s:3:\"134\";i:40;s:3:\"135\";i:41;s:3:\"172\";i:42;s:2:\"56\";i:43;s:3:\"136\";i:44;s:2:\"59\";i:45;s:2:\"60\";i:46;s:2:\"61\";i:47;s:2:\"62\";i:48;s:2:\"63\";i:49;s:3:\"137\";i:50;s:3:\"138\";i:51;s:3:\"139\";i:52;s:3:\"140\";i:53;s:3:\"141\";i:54;s:3:\"171\";i:55;s:2:\"67\";i:56;s:3:\"142\";i:57;s:2:\"70\";i:58;s:2:\"71\";i:59;s:2:\"73\";i:60;s:3:\"143\";i:61;s:3:\"144\";i:62;s:3:\"145\";i:63;s:3:\"146\";i:64;s:3:\"147\";i:65;s:3:\"148\";i:66;s:2:\"75\";i:67;s:2:\"76\";i:68;s:2:\"77\";i:69;s:2:\"79\";i:70;s:2:\"95\";i:71;s:2:\"96\";i:72;s:2:\"97\";i:73;s:3:\"157\";i:74;s:3:\"158\";i:75;s:3:\"159\";i:76;s:3:\"160\";i:77;s:3:\"161\";i:78;s:3:\"162\";i:79;s:3:\"163\";i:80;s:3:\"170\";i:81;s:2:\"99\";i:82;s:3:\"100\";i:83;s:3:\"101\";i:84;s:3:\"164\";i:85;s:3:\"165\";i:86;s:3:\"166\";i:87;s:3:\"167\";}', '1', 'yunying', '1478674790', '60.178.207.103');

-- ----------------------------
-- Table structure for go_article
-- ----------------------------
DROP TABLE IF EXISTS `go_article`;
CREATE TABLE `go_article` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '文章id',
  `cateid` char(30) NOT NULL COMMENT '文章父ID',
  `author` char(20) DEFAULT NULL,
  `title` char(100) NOT NULL COMMENT '标题',
  `title_style` varchar(100) DEFAULT NULL,
  `thumb` varchar(3) DEFAULT NULL,
  `picarr` text,
  `keywords` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `content` mediumtext COMMENT '内容',
  `hit` int(10) unsigned DEFAULT '0',
  `order` tinyint(3) unsigned DEFAULT NULL,
  `posttime` int(10) unsigned DEFAULT NULL COMMENT '添加时间',
  `url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `cateid` (`cateid`)
) ENGINE=InnoDB AUTO_INCREMENT=79 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='网站文章表';

-- ----------------------------
-- Records of go_article
-- ----------------------------
INSERT INTO `go_article` VALUES ('48', '119', '', '购物指南', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p style=\"margin-top:0;margin-right:100px;margin-bottom:0;margin-left:0;text-indent:28px;padding:0 0 0 0 ;line-height:26px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; font-size: 14px; color: rgb(127, 127, 127);\">嗨拼网是以互联网+理念推出的一个创新型购物平台，各类高端商品以“众筹”的形式发售，商品被分为若干分出售，1元一份，用户可以购买其中一份或多份即有机会夺取商品。</span></p><h4 style=\"margin-top:20px;margin-right:100px;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:30px\"><span style=\"font-size: 16px;\"><strong><span style=\"font-family: 微软雅黑; color: rgb(85, 85, 85); letter-spacing: 0px; font-weight: bold; font-style: normal;\">关于夺宝：</span></strong><strong><span style=\"font-family: 微软雅黑; color: rgb(85, 85, 85); letter-spacing: 0px; font-weight: bold; font-style: normal;\"></span></strong></span></h4><p style=\"margin-top:0;margin-right:100px;margin-bottom:0;margin-left:0;text-indent:28px;padding:0 0 0 0 ;line-height:26px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">夺宝是把一件商品平分成若干“等份”出售，每份1夺宝币，当一件奖品所有号码售出后，根据预先制定的规则计算出一个幸运号码，持有该号码的用户，直接获得该奖品。</span></p><p style=\"margin-top:0;margin-right:100px;margin-bottom:0;margin-left:0;text-indent:28px;padding:0 0 0 0 ;line-height:26px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\"><br/></span></p><h4 style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 \"><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">夺宝</span></strong><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">步骤：</span></strong></h4><p style=\"margin-top:0;margin-right:0;margin-bottom:0;padding:0 0 0 0 ;text-align:justify;text-justify:inter-ideograph\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">&nbsp;<img src=\"http://haipin888.com/statics/uploads/shopimg/20161108/67399370575639.jpg\" title=\"46707562314764.jpg\"/></span></p><h4 style=\"margin-top:0;margin-right:0;margin-bottom:6px;margin-left:0;padding:0 0 0 0 \"><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">嗨拼网购物规则</span></strong></h4><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">1、每件商品参考市场价平分成相应“等份”，每份1夺宝币，1份对应1个夺宝码。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">2、同一件商品可以购买多次或一次购买多份。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">3、当一件商品所有“等份”全部售出后计算出“幸运夺宝码”，拥有“幸运夺宝码”者即可获得此商品</span><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:normal;font-style:normal;font-size:16px;\">。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:normal;font-style:normal;font-size:16px;\"><br/></span></p><h4 style=\"margin-top:0;margin-right:0;margin-bottom:6px;margin-left:0;padding:0 0 0 0 \"><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">幸运夺宝码计算规则</span></strong></h4><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">1、奖品的最后一个号码分配完毕后，将公示该分配时间点前本站全部奖品的最后100个参与时间；</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">2、将这100个时间的数值进行求和（得出数值A）（每个时间按时、分、秒、毫秒的顺序组合，如20:15:25.362则为201525362）；</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">3、为保证公平公正公开，系统还会等待一小段时间，取中国福利彩票“重庆时时彩”最近下一期的开奖结果（一个五位数值B）；</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">4、（数值A+数值B）除以该奖品总需人次得到的余数 ? + 原始数 10000001，得到最终幸运夺宝码，拥有该幸运夺宝码者，直接获得该奖品。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px; letter-spacing: 0px; text-indent: 28px;\">注：本商品最后一个夺宝码分配时间对应的“重庆时时彩”期数号码因福彩中心未开奖或福彩中心通讯故障导致未能及时揭晓的,将于12小时后默认按“重庆时时彩”开奖结果为“00000”计算揭晓。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px; letter-spacing: 0px; text-indent: 28px;\"><br/></span></p><h4 style=\"margin-top:0;margin-right:0;margin-bottom:6px;margin-left:0;padding:0 0 0 0 \"><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">关于“</span></strong><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">重庆</span></strong><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">时时彩”</span></strong></h4><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; font-size: 14px; color: rgb(127, 127, 127);\">1、“重庆时时彩”是由中国福彩中心发行的一种彩票，夺宝骑兵仅取其结果作为抗干扰数据源，以示公平公正公开，和“重庆时时彩”本身没有任何关系；</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; font-size: 14px; color: rgb(127, 127, 127);\">2、“重庆时时彩”每天10:00-22:00-02:00进行开奖，白天72期，10分钟开奖，夜间48期，5分钟开奖，停开时间以福彩中心公布信息为准；</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; font-size: 14px; color: rgb(127, 127, 127);\">3、了解更多“重庆时时彩”信息，可自行查询。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><h4 style=\"margin-top:0;margin-right:0;margin-bottom:6px;margin-left:0;padding:0 0 0 0 \"><strong><span style=\";font-family:微软雅黑;color:rgb(85,85,85);letter-spacing:0;font-weight:bold;font-style:normal;font-size:14px;\">晒单分享</span></strong></h4><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">晒出您收到的商品实物图片甚至您的靓照，说出您的夺宝心得，让大家一起分享您的快乐。</span></p><p style=\"margin-top:0;margin-right:0;margin-bottom:0;margin-left:0;padding:0 0 0 0 ;line-height:28px\"><span style=\"font-family: 微软雅黑; letter-spacing: 0px; font-weight: normal; font-style: normal; color: rgb(127, 127, 127); font-size: 14px;\">在您收到商品后，您只需登录网站完成晒单，并通过审核，即可根据商品价格，获得对应积分奖励。在您成功晒单后，您的晒单会出现在网站&quot;晒单分享&quot;区，与大家分享喜悦。</span></p>', '0', '1', '1463464360', null);
INSERT INTO `go_article` VALUES ('49', '119', '', '服务协议', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p style=\"margin-right:0;margin-left:0;text-indent:28px;text-autospace:ideograph-numeric;text-align:justify;text-justify:inter-ideograph\"><span style=\"font-size: 14px; font-family: 微软雅黑; color: rgb(127, 127, 127);\"></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:28px;text-align:justify;text-justify:inter-ideograph\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">欢迎您访问并使用</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">众筹平台</span>&nbsp;（http://www.</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">haipin888</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">.com/)，作为为用户提供全新、趣味购物模式的电子商务公司，</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">通过在线交易为您提供各项相关商品消费及服务。当使用</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">的各项具体服务时，您和</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">都将受到本服务协议规则的约束，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将持续推出各项新的商品及服务，您在接受各项商品及服务的同时视为您接受本服务协议及网站相关服务条款的制约。请您在注册并使用服务前务必认真阅读此服务协议相关条款，如有任何疑问，请致电</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">及时咨询。一旦您注册成功，视为接受本服务协议，本服务协议即在用户和</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">之间产生法律效力。请您在注册过程中查看协议内容，一旦您注册成功，表示您完全接受本协议中的全部条款，随后按照页面给予的提示完成全部的注册步骤。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将本着服务客户、尊重法律的原则，不定期的修改本服务协议的有关条款，并保留在必要时对此协议中的所有条款进行修订的权利。一旦协议内容有所修改，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将会在网站重要页面或社区的醒目位置第一时间给予通知。如果您继续使用</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">的服务，则视为您接受协议的改动内容。如果不同意本站对协议内容所做的修改，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">会及时取消您的相关服务使用权限，本站保留修改或中断服务而不需告知用户的权利，本站行使修改或中断服务的权利时，不需对用户或第三方负责。用户须认真阅读网站服务条款，不得以未阅读本服务条款内容作任何形式的抗辩。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">一、用户注册</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 1、用户注册是指用户登录</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">，按要求填写相关用户信息并确认同意本服务协议的过程。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 2、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">用户须为具有完全民事行为能力的自然人，或者具有合法持续经营资格的组织。无民事行为能力人、限制民事行为能力人以及无经营或特定经营资格的组织不得注册为</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">用户，超过其民事权利或行为能力范围与</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">进行交易，则交易自始无效，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权立即停止与该用户的交易、注销该用户账户，并有权要求其承担相应法律责任。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">二、用户账户、密码和安全性</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 用户一旦注册成功，成为本站的合法用户，用户将对用户名和密码安全负全部责任。此外，每个用户都要对以其用户名进行的所有活动和事件负全责。用户若发现任何非法使用用户帐号或存在安全漏洞的情况，请立即告知本站。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">三、账户充值及使用规则</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 1、用户在成为</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">会员后，可以通过</span>“我的账户”充值获得夺宝币，购买1元的获得1夺宝币，您在网站参与夺宝使用夺宝币即可。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 2、夺宝币仅限</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">商城使用，不能用于购买或兑换其他网站商品或转移给其他用户。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 3、本网站为创新购买商品及服务的网站，遵守国家关于反洗钱相关法律规范的要求，并且为了防止信用卡套现和洗钱等行为，因此本网站不允许提现。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">四、</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">原则</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 平等原则：用户和</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">在交易过程中具有同等的法律地位。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp; &nbsp; 自由原则：用户享有自主、自愿在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">参与购买商品及服务的权利，任何人不得非法干预。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp; &nbsp; 公平原则：用户和</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">行使权利、履行义务应当遵循公平原则。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 诚信原则：用户和</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">行使权利、履行义务应当遵循诚实信用原则。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 尊重规则原则：用户向</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">参与商品及服务分享购买时，用户和</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">皆有义务依法根据本服务协议的约定完成该交易（法律或本协议禁止的交易除外）。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">五、用户的权利和义务</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 1、用户有权独立拥有并支配其在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">的用户名及密码，并用该用户名和密码登录</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">参与商品购买。用户不得以任何形式转让或授权他人使用自己的</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">账户。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 2、用户有权根据本协议规则以及</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站上发布的相关规则在</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">上查询商品信息、发表使用体验、参与商品讨论、邀请关注好友、上传商品图片、参加</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">等各项有关活动，以及享受</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">提供的其它信息服务。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp; 3、用户有义务在注册时提供自己的真实身份信息，并保证诸如电子邮件地址、联系电话、联系地址、邮政编码等内容的有效性及真实性，保证</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">可以通过上述联系方式与用户本人取得联系。同时，用户也有义务在相关资料发生变更时及时更新有关注册资料。用户不得以他人信息资料在</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">进行注册和参与商品及服务分享购买。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp; 4、用户应当保证在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">参与商品及服务分享购买时遵守诚实信用原则，不扰乱网上交易的正常秩序。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;5、用户通过参与</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">服务获得奖品后须在</span>7天登录</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">提交或确认收货地址，否则视为放弃该奖品，用户因此行为造成的损失云购公司不承担任何责任。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;6、若用户存在任何违法或违反本服务协议约定的行为，</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权视用户的违法或违规情节适用以下一项或多项处罚措施：</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（1）责令用户改正违法或违规行为；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（2）中止、终止部分或全部服务；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（3）取消用户购物订单并取消奖品发放（若用户已获得奖品），且用户已获得的夺宝币不予退回；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（4）冻结或注销用户账号及其夺宝币（如有）；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（5）其他</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">认为适当的措施。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;7、用户享有法律规定的言论自由权利，并拥有适度修改、删除自己发表的文章的权利，用户不得在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">发表包含涉及以下内容的任何言论：</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（1）反对宪法所确定的基本原则，煽动、抗拒、破坏宪法和法律、行政法规实施的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（2） 煽动颠覆国家政权，推翻社会主义制度，煽动、分裂国家，破坏国家统一的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（3） 损害国家荣誉和利益的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（4） 煽动民族仇恨、民族歧视，破坏民族团结的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（5） 任何包含对种族、性别、宗教、地域内容等歧视的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（6） 捏造或者歪曲事实，散布谣言，扰乱社会秩序的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（7） 宣扬封建迷信、邪教、淫秽、色情、赌博、暴力、凶杀、恐怖、教唆犯罪的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（8） 公然侮辱他人或者捏造事实诽谤他人的，或者进行其他恶意攻击的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（9） 损害国家机关信誉的；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（10） 其他违反宪法和法律行政法规的。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;8、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有依国家机关要求、依据自身审查或依被侵权人请求对于用户言论信息进行处理的权利。或若用户发表侵犯他人权利或违反法律规定的言论，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权停止传输并删除其言论、禁止该用户发言、注销用户账号及其夺宝币（如有），同时，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">保留根据国家法律法规、相关政策向有关机关上报权利。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;9、用户在发表使用体验、讨论图片等，除遵守本条款外，还应遵守该讨论区的相关规则。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;10、未经</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">同意，禁止用户在网站发布任何形式的广告。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">六、</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">的权利和义务</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;1、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有义务在现有技术上维护整个网上交易平台的正常运行，并努力提升和改进技术，使用户网上交易活动得以顺利进行；</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;2、对用户在注册和使用</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网上交易平台中所遇到的与交易或注册有关的问题及反映的情况，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">客服中心应及时作出回复；</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;3、对于用户在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站上作出下列行为的，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权作出删除相关信息、终止提供服务等处理，而无须征得用户的同意：</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（1） </span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权对用户的注册信息及购买行为进行查阅，发现注册信息或购买行为中存在任何问题的，有权要求用户合理时间进行解释及改正的通知或者作出删除等处理措施；</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp; &nbsp;（2）用户违反本协议规定或有违反法律法规和地方规章的行为的，</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权停止传输并删除其信息，禁止用户发言，注销用户账户并按照相关法律规定向相关主管部门进行披露。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（3）对于用户在</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">进行的下列行为，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权对用户采取删除其信息、禁止用户发言、注销用户账户等限制性措施：包括发布或以电子邮件或以其他方式传送存在恶意、虚假和侵犯他人人身财产权利内容的信息，进行与分享购物无关或不是以分享购物为目的的活动，恶意注册、签到、评论等方式试图扰乱正常购物秩序，将有关干扰、破坏或限制任何计算机软件、硬件或通讯设备功能的软件病毒或其他计算机代码、档案和程序之资料，加以上载、发布、发送电子邮件或以其他方式传送，干扰或破坏</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站和服务或与</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站和服务相连的服务器和网络，或发布其他违反公共利益或可能严重损害</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">和其它用户合法利益的信息。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;4、用户在此免费授予</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">永久性的独家使用权</span>(并有权对该权利进行再授权)，使</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权在全球范围内</span>(全部或部分地)使用、复制、修订、改写、发布、翻译和展示用户公示于</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站的各类信息，或制作其派生作品，或以现在已知或日后开发的任何形式、媒体或技术，将上述信息纳入其它作品内。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;5、对于</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网络平台已上架商品，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权根据市场变动修改商品价格，而无需提前通知客户。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;6、如果发生下列情况，</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">有权取消用户购物订单：</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（1）因不可抗力、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网络系统发生故障或遭受第三方攻击，或发生其他</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">电子商务有限公司无法控制的情形；</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（2）根据</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">公司已经发布的或将来可能发布或更新的各类规则、公告的规定，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">公司有权取消用户订单情形；</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（3）公司有权取消用户订单后，用户可申请退还夺宝币至自己的账户，所退还夺宝币将在3个工作日内退还至用户账户中。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;7、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">分享购物模式，秉持双方自愿原则，分享购物存在风险，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">不对抽取的</span>“幸运编号”结果承担责任，望所有用户谨慎参与。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">七、配送及费用</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;1、</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将会把产品送到您所指定的送货地址。全国大陆区域免费配送（港澳台地区除外）。如需配送至西藏、新疆（乌鲁木齐、石河子、五家渠市、吐鲁番、昌吉州、塔城地区除外）等偏远地区时，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">按比例收取一定运费。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;请清楚准确地填写您的真实姓名、收货地址及联系方式。因如下情况造成配送延迟或无法配送等，本站将不承担责任：</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（1）客户提供错误信息和不详细的地址；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（2）货物送达无人签收，由此造成的重复配送所产生的费用及相关的后果。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;（3）不可抗力，例如：自然灾害、交通戒严、突发战争等。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;2、由于地域限制，</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">所有汽车不在配送范围内，奖品获得者需自行提取，提车地点：浙江宁波。</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;3、汽车价格包含购置税、上牌费、保险费费用和运费，奖品获得者拥有该汽车20年免费使用权。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">八、商品缺货规则</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;用户通过参与</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">所获得的商品如果发生缺货，用户和</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">皆有权取消该交易，所花费的夺宝币</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将全部返还。或</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">对缺货商品进行预售登记，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">会尽最大努力在最快时间内满足用户的购买需求，当缺货商品到货，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将第一时间通过短信或电话通知用户，方便用户进行购买。预售登记并不做交易处理，不构成要约。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">九、责任限制</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;在法律法规所允许的限度内，因使用</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">服务而引起的任何损害或经济损失，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">承担的全部责任均不超过用户所购买的与该索赔有关的商品价格。这些责任限制条款将在法律所允许的最大限度内适用，并在用户资格被撤销或终止后仍继续有效。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十、网络服务内容的所有权</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;本站定义的网络服务内容包括：文字、软件、声音、图片、录象、图表、广告中的全部内容；电子邮件的全部内容；本站为用户提供的其他信息。所有这些内容受著作权法、商标法、专利法等相关知识产权法律的保护。用户只能在本站和广告商授权下才能使用这些内容，而不能擅自复制、再造这些内容、或创造与内容有关的派生产品。本站所有的文章版权归原文作者和本站共同所有，任何人需要转载本站的文章，必须征得原文作者或本站授权。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 16px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十一、用户隐私保护制度</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;我们不会向任何第三方提供，出售，出租，分享和交易用户的个人信息。当在以下情况下，用户的个人信息将部分或全部被善意披露：</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;1、经用户同意，向第三方披露；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;2、如用户是符合资格的知识产权投诉人并已提起投诉，应被投诉人要求，向被投诉人披露，以便双方处理可能的权利纠纷；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;3、根据法律的有关规定，或者行政或司法机构的要求，向第三方或者行政、司法机构披露；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;4、如果用户出现违反中国有关法律或者网站政策的情况，需要向第三方披露；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;5、为提供你所要求的产品和服务，而必须和第三方分享用户的个人信息；</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;6、其它本站根据法律或者网站政策认为应当披露的事项。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><br/></span><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十二、法律管辖和适用</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;1、本协议的订立、执行和解释及争议的解决均应适用中国法律。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;2、如发生本站服务条款与中国法律相抵触时，则这些条款将完全按法律规定重新解释，而其它合法条款则依旧保持对用户产生法律效力和影响。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp;&nbsp;&nbsp;3、本协议的规定是可分割的，如本协议任何规定被裁定为无效或不可执行，该规定可被删除而其余条款应予以执行。</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><br/></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">&nbsp; &nbsp;4、如双方就本协议内容或其执行发生任何争议，双方应尽力友好协商解决；双方协商未达成一致时，任何一方均可向</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网站所在地的有管辖权的人民法院提起诉讼。</span></span></p><p><span style=\";font-family:Calibri;font-size:14px\">&nbsp;</span></p><p style=\"margin-right:0;margin-left:0;text-indent:28px;text-autospace:ideograph-numeric;text-align:justify;text-justify:inter-ideograph\"><br/></p>', '0', '1', '1463464407', null);
INSERT INTO `go_article` VALUES ('50', '119', '', '常见问题', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">一、怎样参加</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">使用手机号注册登录，就可以参加</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">了。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">参加方式：</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">1、充值获得夺宝币，然后选择喜欢的商品开始夺宝；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">2、点击一个感兴趣的商品，选择要参与的人次并支付，直接充值并参与夺宝。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">二、</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">是怎么计算幸运号码的？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">1、 商品的最后一个号码分配完毕后，将公示该分配时间点前本站全部奖品的最后100个参与时间；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">2、将这100个时间的数值进行求和（得出数值A）（每个时间按时、分、秒、毫秒的顺序组合，如20:15:25.362则为201525362）；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">3、为保证公平公正公开，系统还会等待一小段时间，取最近下一期中国福利彩票“重庆时时彩”的开奖结果（一个五位数值B）；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">4、（数值A+数值B）除以该奖品总需人次得到的余数 + 原始数 10000001，得到最终幸运号码。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">注：如遇福彩中心通讯故障，无法获取上述期数的中国福利彩票</span>“重庆时时彩”揭晓结果，且12小时内该期“重庆时时彩”揭晓结果仍未公布，则默认“重庆时时彩”揭晓结果为00000。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">三、为什么要加入</span>“重庆时时彩”揭晓结果？</span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">引入</span>“重庆时时彩”揭晓结果是为了保证幸运号码计算结果的绝对公平公正。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">四、幸运号码的计算结果可信吗？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">由于使用了</span>“重庆时时彩”揭晓结果作为参数，因此幸运号码肯定是未知的；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">您可以绝对相信计算结果真实、可信。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">五、怎样查看是否成为幸运用户？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">个人中心有您的夺宝记录，点击对应的记录，即可知道该期夺宝的获得者；</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">如果您成为幸运用户，将会有邮件、短信等方式的通知。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">六、如何领取幸运商品？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">在您成为幸运用户后会收到电子邮件通知，如果验证了手机，还会有短信通知。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">收到通知后，请到个人中心填写真实的收货地址，完善或确认您的个人信息，以便我们为您派发获得的商品。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">七、商品是正品吗？怎么保证？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">所有商品均由公司确认的第三方商家提供，承诺</span>100%正品，假一赔三，可享受厂家所提供的全国联保服务。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">八、收到的商品可以换货或者退货吗？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">非质量问题，不在三包范围内，不给予退换货</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">请尽量亲自签收并当面拆箱验货，如果发现运输途中造成了商品的损坏，请不要签收，可以拒签退回。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">九、参与</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span></strong><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">需要注意什么？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">为了确保在您成为幸运用户后第一时间收到通知，请务必正确填写真实有效的联系电话和收货地址。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十、网上支付未及时到帐怎么办？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">网上支付未及时到帐可能有以下几个原因造成：</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">第一，由于网速或者支付接口等问题，支付数据没有及时传送到支付系统造成的；</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">第二，网速过慢，数据传输超时使银行后台支付信息不能成功对接，导致银行交易成功而支付后台显示失败；</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">第三，如果使用某些防火墙软件，有时会屏蔽银行接口的弹出窗口。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">如果支付过程中遇到问题，请与我们联系。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十一、什么是夺宝币？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">夺宝币是</span>1元夺宝的代币，用户每充值1元，即可获得1个夺宝币；</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\">1个夺宝币可以直接购买1个夺宝号码。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十二、如何进行夺宝币充值？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">我的账户可以找到入口进行充值；</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">需要注意的是，充值之后获得的是夺宝币，可以直接用于参与夺宝。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十三、夺宝币是否可以提现？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">夺宝币无法提现。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"letter-spacing: 0;font-size: 16px\">&nbsp;</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 18px\"><span style=\"font-family:微软雅黑\">十四、您付款遇到问题了？看看是不是由于下面的原因。</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">问题一：支付平台（例如支付宝、微信、网银等）已经扣款，但夺宝币余额没有增加？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">请您不用担心，如果是因为银行单边账等原因造成的上述问题，已付款项将会在</span>5-7个工作日内原路退回到您的银行账户；如果是因为银行网络延迟等原因造成的上述问题，则已付款项将会在会在5-7个工作日内以余额形式充值到您的</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">账户。</span></span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">问题二：支付平台（例如支付宝、微信、网银等）已经扣款，但没有获得夺宝号码？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">这是因为支付完成时当期商品的夺宝号码已经分配完毕，该笔款项将以余额形式充值到您的</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">账户，请于</span>1个工作日后登录</span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">后在</span>“我的账户&gt;账户余额”中查看。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">问题三：网上银行页面打不开，怎么办？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">建议使用</span>Microsoft IE浏览器。点击IE的菜单“工具”―“internet选项”―“安全”―将安全中的各项设置恢复到默认级别。</span></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><strong><span style=\"font-family: 微软雅黑;letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">问题四：支付平台重复多次付款了该怎么办？</span></span></strong></p><p style=\"margin-top:5px;margin-right:0;margin-bottom:5px;margin-left:0;text-indent:0\"><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">由于支付平台没有即时传输数据给</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">，造成您在支付平台被重复扣款。不过请放心，</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">嗨拼网</span></span><span style=\"font-family: 微软雅黑;color: rgb(127, 127, 127);letter-spacing: 0;font-size: 14px\"><span style=\"font-family:微软雅黑\">将在和支付平台对账确认您的付款后，将重复支付款项原路退回到您的支付平台账户。</span></span></p><p><br/></p>', '0', '1', '1463464427', null);
INSERT INTO `go_article` VALUES ('51', '119', '', '意见反馈', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p><span style=\"font-size: 14px; font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; color: rgb(127, 127, 127);\">嗨拼网致力于为用户提供更好的服务。如果在使用过程中遇到问题，或是有任何想法和建议，请让我们知道，以便我们为大家提供更优质的产品和服务。<br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">你可以发送邮箱至haipinwang@126.com&nbsp;提交投诉建议。</span></p>', '0', '1', '1463464442', null);
INSERT INTO `go_article` VALUES ('52', '117', '', '安全支付', '', '', 'a:0:{}', '', '', '<p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">嗨拼网得到国付宝、网银在线支付认证，严格遵循网络购物的安全准则，通过<span style=\"color: rgb(102, 102, 102); font-family: &#39;Microsoft Yahei&#39;, simsun; font-size: 22px; line-height: 30px; text-align: center; background-color: rgb(249, 249, 249);\"><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px;\">国付宝</span></span>、网银在线这几类安全度高的支付方式，保障您的在线支付的安全性。</span><br/></p>', '0', '1', '1463464463', null);
INSERT INTO `go_article` VALUES ('53', '117', '', '风险提示', '', '', 'a:0:{}', '', '', '<p>	</p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">一、嗨拼网（http://www.haipin888.com/）是以互联网+理念推出的一个创新型购物平台。本风险提示书包含本网站的各类服务条款，您在浏览和使用本网站之前，请务必仔细阅读本《风险提示书》及本网站其他服务协议的全部内容。您在接受本网站各项服务时，我们将默认为您已接受本提示中所有条款。杭州伟愿科技网络科技有限公司在符合中国法律、行政法规等相关规范的前提下对相关服务条款享有最终解释权，并对服务条款进行相应修订。</span><br/></p><p><br/></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">二、本网站将采用适当的保密及安全措施保障用户个人隐私安全，保证不向任何个人或组织泄露用户个人在网站中披露的相关信息。在司法机关、监管部门或其他政府机构依据法律程序，要求本网站提供您的个人信息时，我们将会依法向有关部门提供相关信息资料。</span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">三、本网站建议用户加强自我信息保护，提高风险防范意识。由于用户个人疏忽、缺乏自我信息保护意识而造成的任何个人及身份信息及其他信息的泄露或资金损失，本网站将不承担任何责任。</span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">四、由于任何本网站无法控制的原因（包括但不限于黑客攻击、计算机病毒攻击、政府管制、通讯设施故障及其他不可抗力因素）而导致的网站暂时关闭、用户信息泄露、被盗用、被篡改等非正常经营行为，本网站不承担任何责任。</span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">五、本网站会挑选业界具备良好声誉或有较大影响力的网站作为友情链接列入本网站相关区域，供您浏览和参考。该行为并不代表本网站与其具有合作关系，请您对相关网站内容进行审慎辨别及独立判断，加强自我保护。对于任何外部链接的网站，您在该网站上进行访问、使用、下载等行为引起的损失或损害，本网站不承担任何责任。</span></p>', '0', '1', '1463464483', null);
INSERT INTO `go_article` VALUES ('54', '117', '', '保障体系', '', '', 'a:0:{}', '', '', '<p>	</p><p><strong style=\"font-size: 18px;\"><span style=\"font-family: 微软雅黑;\">100%正品保障</span></strong><br/></p><p><span style=\"font-size: 14px; font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; color: rgb(127, 127, 127);\">嗨拼网精心挑选优质服务品牌商家，保障全场商品100%品牌正品。如果您认为您通过本商城购买的商品是假货，并能提供国家相关质检机构的证明文件，经确认后，在返还商品金额的同时并提供假一赔三的服务保障。</span></p><p><span style=\"font-family: 微软雅黑; font-size: 16px;\"><br/></span></p><p><span style=\"font-size: 18px;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold;\">100%公平公正</span></strong></span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">整个过程是完全透明，您可以随时查看每件商品参与人数，参与次数，参与名单及获得者信息等记录；夺宝幸运号码计算公式，加入了“重庆时时彩”数据作为公正数据源，保证揭晓结果的随机性，保证绝对公正性。</span></p><p><span style=\"font-family: 微软雅黑; font-size: 16px;\"><br/></span></p><p><span style=\"font-size: 18px;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold;\">全国免费快递</span></strong></span></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">嗨拼网承诺全场所有商品全国免费快递（港澳台地区除外）。</span></p>', '0', '1', '1463464572', null);
INSERT INTO `go_article` VALUES ('55', '117', '', '隐私声明', '', '', 'a:0:{}', '', '', '<p>	</p><p><strong style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><span style=\"font-family: 微软雅黑; font-size: 18px;\">一、未成年人的特别注意事项</span></strong><br/></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">如果您未满18周岁，您无权使用本站服务，因此我们希望您不要向我们提供任何个人信息。如果您未满18周岁，您只能在父母或监护人的陪同下才可以使用本站服务。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">二、用户名和密码</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">当您在注册为本站用户时，您需要根据提示填写用户名和密码，并设置密码提示问题及其答案，以便在您丢失密码时用于您的身份确认。您只能通过您的密码来使用您的账户。如果您泄漏或了密码，您可能会丢失您的个人识别信息，并可能导致对您不利的司法行为。因此无论任何原因使您的密码安全受到威胁时，您应该立即通过客服和我们取得联系。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">三、完善信息</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">在您注册成为本站用户后或参与购物并获得商品后，您需要在“个人设置”里完善您个人信息，根据要求填写您的真实姓名，地址，与电子邮件地址。您还有权选择填写更多信息，包括电话号码，QQ号。我们使用注册信息来保护用户账户安全，在您在账户利益受到危害的情况下。同时我们使用注册信息来获得用户统计资料，以便为用户提供更多更新的服务。我们会通过电子邮件方式通知您有关新的服务。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">四、什么是Cookies?</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">Cookies是一种能够让网站服务器把少量数据储存到客户端的硬盘或内存，或是从客户端的硬盘读取数据的一种技术。Cookies是当您浏览某网站时，由Web服务器置于您硬盘上的一个非常小的文本文件，它可以记录您的用户ID、密码、浏览过的网页、停留的时间等信息。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">当您再次来到该网站时，网站通过读取Cookies，得知您的相关信息，就可以做出相应的动作，如在页面显示欢迎您的标语，或者让您不用输入ID、密码就直接登录等等。从本质上讲，它可以看作是您的身份证。但Cookies不能作为代码执行，也不会传送病毒，且为您所专有，并只能由提供它的服务器来读取。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">本站为您提供Cookies使用功能，以便为您提供周到的个性服务，使您再次访问时更加快捷、方便。当然，您也可以选择关闭此服务，本站将为您停止Cookies为您的服务。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">五、信息披露</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">我们不会向任何第三方提供，出售，出租，分享和交易用户的个人信息。当在以下情况下，用户的个人信息将部分或全部被善意披露：</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">1、经用户同意，向第三方披露;</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">2、如用户是合资格的知识产权投诉人并已提起投诉，应被投诉人要求，向被投诉人披露，以便双方处理可能的权利纠纷;</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">3、根据法律的有关规定，或者行政或司法机构的要求，向第三方或者行政、司法机构披露;</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">4、如果用户出现违反中国有关法律或者网站政策的情况，需要向第三方披露;</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">5、为提供您所要求的产品和服务，而必须和第三方分享用户的个人信息;</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">6、其它本站根据法律或者网站政策认为合适的披露。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">六、安全</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">我们网站有相应的安全措施来确保我们掌握的信息不丢失，不被滥用和变造。这些安全措施包括向其它服务器备份数据和对用户密码加密。尽管我们有这些安全措施，但请注意在因特网上不存在“完善的安全措施”。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">七、查阅和修改个人信息</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">您使用嗨拼网服务时，您可以随时查阅并随时修改您的个人信息。同时，在您登录后我们会提供登录日志功能，我们会将您每次登录的IP地址公布供您查看，以便保证您账号的安全性。因此提供查看IP地址仅仅只是为了安全的必要。</span></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 16px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><strong><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 18px;\">八、邮件/短信服务</span></strong></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 18px;\"><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">注册成为嗨拼网用户后，您将会收到以电子邮件、短信的形式为您发送的最新活动与通知。为此，我们保留为用户发送最新活动与通知等告知服务的权利。当您注册成为嗨拼网用户后即表明您已同意接受此项服务。如您不想接受来自夺宝骑兵的邮件、短信与通知，您可向夺宝骑兵客服提出退阅申请，并注明您的电子邮件地址、手机号等相关接受平台信息，嗨拼网将在收到您的申请后为您及时办理。</span></span></p>', '0', '1', '1463464592', null);
INSERT INTO `go_article` VALUES ('56', '118', '', '商品配送', '', '', 'a:0:{}', '', '', '<p>	</p><p><span style=\"font-size: 14px; font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; color: rgb(127, 127, 127);\">在您成为幸运用户后，嗨拼网会第一时间为您寄出商品，大陆地区免快递费。<br/></span></p><p><span style=\"text-decoration: none; font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">获得商品后，请您尽快提交收货地址，超过<span style=\"color: rgb(127, 127, 127); font-size: 14px; text-decoration: none; font-family: Calibri;\">7</span>天未确认收货地址，视为自动放弃该商品。</span></p>', '0', '1', '1463464622', null);
INSERT INTO `go_article` VALUES ('57', '118', '', '商品验收与签收', '', '', 'a:0:{}', '', '', '<p>	</p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">一、签收时请慎重，尽量本人签收，签收时务必仔细检查商品，如：外包装是否被开封，商品是否破损，配件是否缺失，功能是否正常。在确保无误后再签收，以免产生不必要的纠纷。若有任何疑问，请及时拨打客服电话反馈信息，若因用户未仔细检查商品即签收后产生的纠纷，嗨拼网概不负责，仅承担协调处理的义务。</span><br/></p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">二、用户所获商品，相关商品质量及保修问题请直接联系生产厂家。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">三、若因您的地址填写错误、联系方式填写有误等情况造成商品无法完成投递或被退回，所产生的额外费用及后果由用户负责。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">四、如因不可抗拒的自然原因，如地震、洪水等，所造成的商品配送延迟，嗨拼网不承担责任。</span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">五、若商品已签收，则说明商品配送正确无误且不存在影响使用的因素，嗨拼网有权不受理换货申请。</span></p>', '0', '1', '1463464652', null);
INSERT INTO `go_article` VALUES ('58', '118', '', '配送费用', '', '', 'a:0:{}', '', '', '<p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">所有商品大陆地区免费快递。</span><br/></p>', '0', '1', '1463464674', null);
INSERT INTO `go_article` VALUES ('59', '118', '', '长时间未收到商品', '', '', 'a:0:{}', '', '', '<p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">一、确保收货地址、邮编、电话、Email、地址等各项信息的准确性。</span><br/></p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\"><br/></span></p><p><span style=\"text-decoration: none; font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; color: rgb(127, 127, 127); font-size: 14px;\">二、配送过程中联系方式畅顺无阻，如果联络您的时间超过7天未得到回复，默认您已经放弃此商品。</span></p>', '0', '1', '1463464690', null);
INSERT INTO `go_article` VALUES ('60', '111', '', '加入我们', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p style=\"text-align: center;\"><strong style=\"font-size: 18px;\"><span style=\"font-family: 微软雅黑;\">人脉就是你的财脉 把握人脉营造成功</span></strong><br/></p><p style=\"text-align: left;\"><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\">在21世纪，有了一个新的词汇——人脉，你可以利用别人的时间，别人的知识，别人的智慧，别人的人际关系，来实现自己的目的，也就是说你拥有一个好的人际关系，人脉就是你一生中最大的财富，有人脉就是力量，有人买就是竞争里，人脉即是你的财脉，你的成功就赢在人脉中，把握人脉营造成功！</span></p><p style=\"text-align: center;\"><br/></p><p style=\"text-align: center;\"><br/></p><p><br/></p><p style=\"text-align: center;\"><span style=\"font-family: Calibri; font-size: 14px;\">&nbsp;</span><br/></p>', '0', '1', '1463464722', null);
INSERT INTO `go_article` VALUES ('61', '111', '', '关于我们', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p style=\"text-align: center;\"><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">嗨拼网是杭州伟愿科技网络科技有限公司以互联网+理念推出的一个创新型的众筹购物商城，主营全球高端奢侈产品，引领年轻人的轻奢生活。</span><br/></p><p><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p style=\"text-align: center;\"><img src=\"http://haipin888.com/statics/uploads/shopimg/20161108/77899717574976.jpg\" title=\"17746808250391.jpg\"/></p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑, sans-serif; font-size: 14px; text-align: center;\">杭州伟愿科技网络科技公司一家集软件研发与平台运营为一体的高科技互联网公司。公司是杭州市高新技术企业，主营基于互联网的商品促销和大学生交友软件平台的研发和运营。公司秉承“超越自我，追求卓越”的理念，在互联网的浪潮中由小到大，不断发展。我们邀请一切有志于投身互联网行业的朋友，加盟我们，共创美好未来。</span></p><p><br/></p><p style=\"text-align: center;\"><img src=\"http://haipin888.com/statics/uploads/shopimg/20161108/47684202575088.jpg\" title=\"63723204578305.jpg\"/></p><p style=\"text-align: left;\"><span style=\";font-family:微软雅黑;font-size:14px\"><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px; text-align: center;\">嗨拼网的全球各大知名奢侈品牌商品都是由公司精心挑选的优质商家提供，承诺100%正品保障。<span style=\"color: rgb(127, 127, 127); text-align: center; font-family: 微软雅黑, sans-serif; font-size: 14px;\">专业的企划团队，客服团队，商品配送团队，招商团队，开发团队为您打造完美的夺宝体验。</span></span></span></p><p style=\"text-align: center;\"><br/></p><p style=\"text-align: center;\"><img src=\"http://haipin888.com/statics/uploads/shopimg/20161108/11489301575115.jpg\" title=\"56881013250187.jpg\"/><span style=\";font-family:微软雅黑;font-size:14px\"></span></p><p style=\"text-align: left;\"><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 14px;\">使命：</span><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">引领轻奢时尚，造就品质生活，让一切奢华近在眼前。 &nbsp;&nbsp;</span><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 14px;\">愿景：</span><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">打造开放共赢平台，与合作伙伴共创财富梦想。 &nbsp;&nbsp;</span><span style=\"font-family: 微软雅黑; font-weight: bold; font-size: 14px;\">价值观：</span><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑; font-size: 14px;\">公正信实，负责敬业，团结共赢。 &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;&nbsp;</span></p>', '0', '1', '1463464744', null);
INSERT INTO `go_article` VALUES ('62', '111', '', '联系我们', '', '', 'a:0:{}', '', '', '<p><strong style=\"color: rgb(89, 89, 89); font-family: 微软雅黑; font-size: 18px;\">官方QQ群</strong><br/></p><p><span style=\"color:#7f7f7f;font-family:微软雅黑\"><span style=\"font-size: 14px;\">暂无</span></span></p><p><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\"></span></p><p style=\"white-space: normal;\"><strong style=\"font-size: 18px;\"><span style=\"font-family: 微软雅黑;\">地址</span></strong><br/></p><p style=\"white-space: normal;\"><span style=\"color:#7f7f7f;font-family:微软雅黑\"><span style=\"font-size: 14px;\">杭州市莫干山路102号立新大厦1301室</span></span></p><p style=\"white-space: normal;\"><span style=\"font-family: 微软雅黑; font-size: 14px; color: rgb(127, 127, 127);\"><br/></span></p><p style=\"white-space: normal;\"><span style=\"font-size: 18px;\"><strong><span style=\"font-family: 微软雅黑;\">客服服务</span></strong></span></p><p style=\"white-space: normal;\"><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\">400-117-8669</span></p><p style=\"white-space: normal;\"><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\"><br/></span></p><p style=\"white-space: normal;\"><span style=\"font-size: 18px;\"><strong><span style=\"font-family: 微软雅黑;\">商务合作</span></strong></span></p><p style=\"white-space: normal;\"><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\">haipinwang@126.com<span style=\"color: rgb(38, 38, 38);\"></span></span></p><p><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\"><br/></span><br/></p><p><span style=\"font-family: 微软雅黑; color: rgb(127, 127, 127); font-size: 14px;\"></span></p>', '0', '1', '1463464763', null);
INSERT INTO `go_article` VALUES ('67', '109', '', '即将上线', '', 'pho', 'a:0:{}', '夺宝之旅即将开启！', '夺宝之旅即将开启！', '<p>	</p><p><br/></p><p><span style=\"color: rgb(127, 127, 127); font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px;\">iPhone6s、iPad、LV包包、卡地亚腕表、宝马奔驰玛莎拉蒂只需1元就拿下！还有香奈儿，迪奥更多大牌商品秒杀活动等你来开启！加入嗨拼网开启你的夺宝之旅，现注册即送5元红包，邀请好友赚现金。购物新时尚，1元“够”时尚！</span><br/></p>', '11', '1', '1463550018', null);
INSERT INTO `go_article` VALUES ('71', '109', '', '网站测试中', '', '', 'a:0:{}', '', '', '<p>近期网站仍在测试阶段，请勿夺宝！<br/></p>', '76', '1', '1463729675', null);
INSERT INTO `go_article` VALUES ('72', '109', '', '上线公告', '', '', 'a:0:{}', '', '', '<p>	</p><p><span id=\"_baidu_bookmark_start_4\" style=\"display: none; line-height: 0px;\">‍</span><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px; color: rgb(127, 127, 127);\">上线啦！汽车大佬ABB<span style=\"font-size: 14px; font-family: 宋体;\">，</span><span style=\"font-size: 14px; color: rgb(127, 127, 127); font-family: 微软雅黑, &#39;Microsoft YaHei&#39;;\"><span style=\"font-size: 14px;\">全球奢侈大品，最新手机数码，只需一元都有机会拿下！购物新时尚，一元“够时尚”！有</span>300<span style=\"font-size: 14px;\">万吸粉奖励等你来拿，先到先得，赶紧行动吧！现注册还送</span>5<span style=\"font-size: 14px;\">元体验金，邀请好友赚现金。购物新时尚，</span>1<span style=\"font-size: 14px;\">元“够”时尚！</span></span></span><span id=\"_baidu_bookmark_end_5\" style=\"display: none; line-height: 0px;\">‍</span></p>', '43', '1', '1464827864', null);
INSERT INTO `go_article` VALUES ('73', '109', '', '网站更新', '', '', 'a:0:{}', '', '', '<p>&nbsp;尊敬的夺宝豪杰，本网站由于需要更新数据库，将在10：10暂时无法访问，预计5分钟后完成更新，给您造成不便，敬请谅解。&nbsp;</p>', '61', '1', '1466129227', null);
INSERT INTO `go_article` VALUES ('74', '109', '', '网站更新', '', '', 'a:0:{}', '', '', '<p>尊敬的夺宝豪杰，本网站由于需要更新数据库，将在10：25暂时无法访问，预计5分钟后完成更新，给您造成不便，敬请谅解。</p>', '63', '1', '1466130183', null);
INSERT INTO `go_article` VALUES ('76', '109', '', '活动调整公告', '', '', 'a:0:{}', '', '', '<p>	</p><p><span style=\"font-family: 微软雅黑, &#39;Microsoft YaHei&#39;; font-size: 14px;\">&nbsp;尊敬的嗨拼网用户，因网站调整注册优惠活动需要，原先新用户注册即送的五元体验金取消，之后将会推出全新的优惠活动，本次调整于2016年6月20日17：15开始实行，全新的优惠活动会另行告知，如您有任何疑问请联系我们在线客服进行咨询，我们将竭诚为您服务。&nbsp;</span></p>', '4', '1', '1466413976', null);
INSERT INTO `go_article` VALUES ('78', '109', '', '活动公告', '', '', 'a:0:{}', '', '', '<p>	</p><p><br/></p><p><span style=\"font-size: 14px;\"><strong><span style=\"font-family: 微软雅黑, sans-serif;\">一．充值有豪礼：</span></strong></span></p><ol style=\"list-style-type: decimal;\" class=\" list-paddingleft-2\"><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">1.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>新用户首次充值10元以上即送5元夺宝币。(要充值才能送，直接购买系统无法送)</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">2.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>用户每次成功充值后，嗨拼网还额外赠送一个夺宝红包，红包金额为充值金额的5%。</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">3.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>换句话说，就是等于新用户现在充值100元就送10元夺宝币，让你夺宝更任性！</span></p></li></ol><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">&nbsp;</span></p><p><span style=\"font-size: 14px;\"><strong><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">二．邀请赚佣金：</span></strong></span></p><ol style=\"list-style-type: decimal;\" class=\" list-paddingleft-2\"><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">1.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>朋友的朋友，都是朋友，三级好友，消费佣金赚不停；500万消费佣金等你来赚，消费佣金比例如下：</span></p></li></ol><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">&nbsp;</span></p><table border=\"1\" cellspacing=\"0\" cellpadding=\"0\" style=\"border-collapse:collapse;border:none\"><tbody><tr><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">好友等级</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;border-left:none;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">邀请关系</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;border-left:none;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">消费佣金比例</span></p></td></tr><tr><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;border-top:none;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">一级好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">由你直接邀请的好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">5%</span></p></td></tr><tr><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;border-top:none;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">二级好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">由一级好友邀请的好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">3%</span></p></td></tr><tr><td width=\"189\" valign=\"top\" style=\"width:189px;border:solid windowtext 1px;border-top:none;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">三级好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">由二级好友邀请的好友</span></p></td><td width=\"189\" valign=\"top\" style=\"width:189px;border-top:none;border-left: none;border-bottom:solid windowtext 1px;border-right:solid windowtext 1px;padding:0 7px 0 7px\"><p style=\"text-align:center\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">2%</span></p></td></tr></tbody></table><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">&nbsp;</span></p><ol style=\"list-style-type: decimal;\" class=\" list-paddingleft-2\"><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">2.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>举个例子：</span></p></li></ol><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">假如每个人只邀请<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">10个好友!</span></strong>那你就拥有10个一级好友，100个二级好友，1000个三级好友！<span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">（如果这个世界上有人连10个朋友都没有，那真的……当我没说）</span></span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">假如每个人只消费<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">100块钱！</span></strong>（100块钱！？excuse me？一个月话费都不止吧！）</span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">那么你的三级佣金之和就是<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">2350块钱！</span></strong></span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">消费<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">200元</span></strong>呢？<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">300元</span></strong>呢？这个还得你自己算……</span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">这仅仅只是邀请<strong><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px; color: red;\">10个好友</span></strong>的前提下！</span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\">赚多少佣金？你邀了算！</span></p><p><span style=\"font-size: 14px;\"><strong><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">&nbsp;</span></strong></span></p><p><span style=\"font-size: 14px;\"><strong><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">三．活动明细：</span></strong></span></p><ol style=\"list-style-type: decimal;\" class=\" list-paddingleft-2\"><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">1.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;</span>充值所送的夺宝红包金额为充值金额的5%，红包金额取整，如充值50元，则获得2元夺宝红包；</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">2.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;</span>邀请者在活动期间内邀请好友完成注册并成功夺宝，好友佣金奖励将自动发放至邀请者账户内；</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">3.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;</span>账户中好友佣金可直接充值为夺宝币使用，如佣金超过100元，也可申请提现；</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">4.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;</span>邀请者需保证被邀请者真实有效，若发现恶意切换账号等作弊行为，嗨拼网有权收回邀请奖励；</span></p></li><li><p><span style=\"font-size: 14px; font-family: 微软雅黑, sans-serif;\">5.<span style=\"font-stretch: normal; font-size: 9px; font-family: &#39;Times New Roman&#39;;\">&nbsp;&nbsp;&nbsp;&nbsp;</span>活动开始时间：2016年6月30日24点，结束时间：以公告为准。</span></p></li></ol><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 12px;\"><br/></span></p><p><span style=\"font-family: 微软雅黑, sans-serif; font-size: 14px;\"><span style=\"font-family: 微软雅黑, sans-serif; font-size: 12px;\">注：如您有任何疑问请联系我们在线客服进行咨询，我们将竭诚为您服务</span>。</span></p><p><br/></p>', '32', '1', '1466733682', null);

-- ----------------------------
-- Table structure for go_caches
-- ----------------------------
DROP TABLE IF EXISTS `go_caches`;
CREATE TABLE `go_caches` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(100) NOT NULL,
  `value` text,
  PRIMARY KEY (`id`),
  KEY `key` (`key`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='通知模版表';

-- ----------------------------
-- Records of go_caches
-- ----------------------------
INSERT INTO `go_caches` VALUES ('1', 'member_name_key', 'admin,administrator');
INSERT INTO `go_caches` VALUES ('2', 'shopcodes_table', '1');
INSERT INTO `go_caches` VALUES ('3', 'goods_count_num', '35825');
INSERT INTO `go_caches` VALUES ('4', 'template_mobile_reg', '你好,如非本人操作,就当是骚扰短信啦!你的注册验证码是:000000');
INSERT INTO `go_caches` VALUES ('5', 'template_mobile_shop', '');
INSERT INTO `go_caches` VALUES ('6', 'template_email_reg', '<table width=\"600\" cellpadding=\"0\" cellspacing=\"0\" style=\"border: #dddddd 1px solid; padding: 20px 0;\">\n<tbody>\n<tr>\n<td>\n<table width=\"100%\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" style=\"border-bottom: #ff6600 2px solid; padding-bottom: 12px;\">\n<tbody>\n<tr>\n<td style=\"line-height:22px; padding-left:20px;\">\n<a href=\"http://114.215.208.46/\" target=\"_blank\" style=\" font-size:32px;color:#ff7700; text-decoration:none;\"><b>嗨拼网</b></a></td>\n<td align=\"right\" style=\"font-size: 12px; padding-right: 20px; padding-top: 30px;\">\n<a href=\"http://114.215.208.46/\" target=\"_blank\" style=\"color: #2AF; text-decoration: none;\">首页</a>\n<b style=\"width: 1px; height: 10px; vertical-align: -1px; font-size: 1px; background: #CACACA; display: inline-block; margin: 0 5px;\"></b>\n<a href=\"http://114.215.208.46/?/member/home\" target=\"_blank\" style=\"color: #22aaff; text-decoration: none;\">个人天地</a>\n<b style=\"width: 1px; height: 10px; vertical-align: -1px; font-size: 1px; background: #CACACA; display: inline-block; margin: 0 5px;\"></b>\n<a href=\"http://114.215.208.46/?/help/1\" target=\"_blank\" style=\"color: #22aaff; text-decoration: none;\">帮助中心</a></td>\n</tr>\n</tbody>\n</table>\n<table width=\"100%\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" style=\"padding: 0 20px;\">\n<tbody>\n<tr>\n<td style=\"font-size: 14px; color: #333333; height: 40px; line-height: 40px; padding-top: 10px;\">\n<b style=\"color: #333333; font-family: Arial;\"> </b></td>\n</tr>\n<tr>\n<td style=\"font-size: 12px; color: #333333; line-height: 22px;\">\n<p style=\"text-indent: 2em; padding: 0; margin: 0;\">亲爱的用户您好！感谢您注册夺宝骑兵。</p></td>\n</tr>\n<tr>\n<td style=\"font-size: 12px; color: #333333; line-height: 22px;\">\n<p style=\"text-indent: 2em; padding: 0; margin: 0;\">请在24小时内激活注册邮件，点击连接激活邮件：</p></td>\n</tr>\n<tr>\n</tr>\n<tr>\n<td width=\"525\" style=\"font-size: 12px; padding-top: 5px; word-break: break-all; word-wrap: break-word;\">\n<a href=\"#\" target=\"_blank\" style=\"font-family: Arial; color: #22aaff;\">{地址}</a></td>\n</tr>\n</tbody>\n</table>\n<table width=\"100%\" align=\"center\" cellpadding=\"0\" cellspacing=\"0\" style=\"margin-top: 60px;\">\n<tbody>\n<tr>\n<td style=\"font-size: 12px; color: #777777; line-height: 22px; border-bottom: #22aaff 2px solid; padding-bottom: 8px; padding-left: 20px;\">此邮件由系统自动发出，请勿回复！</td>\n</tr>\n<tr>\n<td style=\"font-size: 12px; color: #333333; line-height: 22px; padding: 8px 20px 0;\">感谢您对夺宝骑兵（<a href=\"http://114.215.208.46/\" target=\"_blank\" style=\"color: #22aaff; font-family: Arial;\">http://114.215.208.46/</a>）的支持，祝您好运！</td>\n</tr>\n</tbody>\n</table>\n</td>\n</tr>\n</tbody>\n</table>\n<table cellpadding=\"0\" cellspacing=\"0\" width=\"600\"> <tbody> <tr> <td align=\"center\" style=\"font-size:12px; color:#999; line-height:30px\">&copy;2012-2020 夺宝骑兵版权所有 All Rights Reserved <a href=\"http://www.miibeian.gov.cn/\">备案号</a></td>\n</tr>\n</tbody>\n</table>');
INSERT INTO `go_caches` VALUES ('7', 'template_email_shop', '');
INSERT INTO `go_caches` VALUES ('8', 'pay_bank_type', 'yeepay');
INSERT INTO `go_caches` VALUES ('9', 'template_mobile_pwd', '你好,你现在正在找回密码,你的验证码是【000000】,请不要告诉别人');
INSERT INTO `go_caches` VALUES ('10', 'template_email_pwd', '请在24小时内激活邮件，点击连接激活邮件：{地址}');

-- ----------------------------
-- Table structure for go_config
-- ----------------------------
DROP TABLE IF EXISTS `go_config`;
CREATE TABLE `go_config` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `value` mediumtext,
  `zhushi` text,
  PRIMARY KEY (`id`),
  KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='网站基本配置表';

-- ----------------------------
-- Records of go_config
-- ----------------------------
INSERT INTO `go_config` VALUES ('1', 'web_name', '亚巨游戏', '网站名');
INSERT INTO `go_config` VALUES ('2', 'web_key', '亚巨游戏', '网站关键字');
INSERT INTO `go_config` VALUES ('3', 'web_des', '亚巨游戏', '网站介绍');
INSERT INTO `go_config` VALUES ('4', 'web_path', 'http://mj.0086qd.com/manage/', '网站地址');
INSERT INTO `go_config` VALUES ('5', 'templates_edit', '1', '是否允许在线编辑模板');
INSERT INTO `go_config` VALUES ('6', 'templates_name', 'taolong-fangwangyi', '当前模板方案');
INSERT INTO `go_config` VALUES ('7', 'charset', 'utf-8', '网站字符集');
INSERT INTO `go_config` VALUES ('8', 'timezone', 'Asia/Shanghai', '网站时区');
INSERT INTO `go_config` VALUES ('9', 'error', '1', '1、保存错误日志到 cache/error_log.php | 0、在页面直接显示');
INSERT INTO `go_config` VALUES ('10', 'gzip', '0', '是否Gzip压缩后输出,服务器没有gzip请不要启用');
INSERT INTO `go_config` VALUES ('11', 'lang', 'zh-cn', '网站语言包');
INSERT INTO `go_config` VALUES ('12', 'cache', '3600', '默认缓存时间');
INSERT INTO `go_config` VALUES ('13', 'web_off', '1', '网站是否开启');
INSERT INTO `go_config` VALUES ('14', 'web_off_text', '网站关闭。升级中....', '关闭原因');
INSERT INTO `go_config` VALUES ('15', 'tablepre', 'QCNf', null);
INSERT INTO `go_config` VALUES ('16', 'index_name', '?', '隐藏首页文件名');
INSERT INTO `go_config` VALUES ('17', 'expstr', '/', 'url分隔符号');
INSERT INTO `go_config` VALUES ('18', 'admindir', 'admin', '后台管理文件夹');
INSERT INTO `go_config` VALUES ('19', 'qq', '1463968788', 'qq');
INSERT INTO `go_config` VALUES ('20', 'cell', '021-60348791', '联系电话');
INSERT INTO `go_config` VALUES ('21', 'web_logo', 'banner/20170324/84296092332319.png', 'logo');
INSERT INTO `go_config` VALUES ('22', 'web_copyright', 'Copyright © 2017 版权所有:亚巨游戏 蒙ICP备17001101号-1', '版权');
INSERT INTO `go_config` VALUES ('23', 'web_name_two', '亚巨游戏', '短网站名');
INSERT INTO `go_config` VALUES ('24', 'qq_qun', '', 'QQ群');
INSERT INTO `go_config` VALUES ('25', 'goods_end_time', '30', '开奖动画秒数(单位秒)');
INSERT INTO `go_config` VALUES ('36', 'pay_cashback_money', '0.20', '返现金额');
INSERT INTO `go_config` VALUES ('38', 'web_gg1', '网站刚刚运行请多关照_(n_n)_', '公告1');
INSERT INTO `go_config` VALUES ('39', 'web_gg2', '亚巨游戏，祝您愉快~！', '公告2');
INSERT INTO `go_config` VALUES ('40', 'postuid1', '110', '虚拟人员订单ID段');
INSERT INTO `go_config` VALUES ('41', 'postuid2', '100', '虚拟人员订单ID段');
INSERT INTO `go_config` VALUES ('42', 'regnum', '23438', '注册基数');
INSERT INTO `go_config` VALUES ('43', 'vip_condition', '0', 'VIP条件设置为充值多少开启');
INSERT INTO `go_config` VALUES ('44', 'wx_title', '快乐游戏', '微信分享信息标题');
INSERT INTO `go_config` VALUES ('45', 'wx_content', '这里有最新游戏，欢迎来玩！', '微信分享信息内容');
INSERT INTO `go_config` VALUES ('46', 'goldcoin_exchange_rate', '1', '金币兑换汇率');
INSERT INTO `go_config` VALUES ('47', 'web_game_sale_key', '#20170327&i5dD56&#', '网站密钥');
INSERT INTO `go_config` VALUES ('48', 'web_game_sale_url', 'http://114.55.108.83:9009/', null);

-- ----------------------------
-- Table structure for go_goldcoin_op
-- ----------------------------
DROP TABLE IF EXISTS `go_goldcoin_op`;
CREATE TABLE `go_goldcoin_op` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '序号',
  `uid` int(11) unsigned DEFAULT NULL COMMENT '会员号或管理员号',
  `ind` tinyint(2) unsigned DEFAULT '0' COMMENT '类型:1:会员 2:管理员',
  `batchno` char(20) DEFAULT NULL COMMENT '批次号',
  `custom_id` int(11) unsigned DEFAULT NULL COMMENT '客户号',
  `qty` decimal(10,2) unsigned DEFAULT NULL COMMENT '发送数量',
  `addtime` int(10) unsigned DEFAULT NULL COMMENT '创建时间',
  `st` tinyint(2) DEFAULT '0' COMMENT '状态:0:新增 1:成功  -1:失败',
  `result` varchar(100) DEFAULT NULL COMMENT '返回值',
  PRIMARY KEY (`id`),
  KEY `batchno` (`batchno`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_goldcoin_op
-- ----------------------------

-- ----------------------------
-- Table structure for go_link
-- ----------------------------
DROP TABLE IF EXISTS `go_link`;
CREATE TABLE `go_link` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT COMMENT '友情链接ID',
  `type` tinyint(1) unsigned NOT NULL COMMENT '链接类型',
  `name` char(20) NOT NULL COMMENT '名称',
  `logo` varchar(250) NOT NULL COMMENT '图片',
  `url` varchar(50) NOT NULL COMMENT '地址',
  PRIMARY KEY (`id`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of go_link
-- ----------------------------

-- ----------------------------
-- Table structure for go_member
-- ----------------------------
DROP TABLE IF EXISTS `go_member`;
CREATE TABLE `go_member` (
  `uid` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `username` char(20) CHARACTER SET utf8 COLLATE utf8_polish_ci NOT NULL COMMENT '用户名',
  `realname` varchar(50) DEFAULT NULL COMMENT '真实姓名',
  `email` varchar(50) DEFAULT NULL COMMENT '用户邮箱',
  `mobile` char(11) DEFAULT NULL COMMENT '用户手机',
  `password` char(32) DEFAULT NULL COMMENT '密码',
  `user_ip` varchar(255) DEFAULT NULL COMMENT '用户ip',
  `img` varchar(255) DEFAULT NULL COMMENT '用户头像',
  `ind` tinyint(1) DEFAULT '0' COMMENT '1:经纪人/2:会员单位/3:区域代理',
  `money` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '账户金额',
  `freeze_money` decimal(10,2) DEFAULT '0.00' COMMENT '冻结金额',
  `total_money` decimal(10,2) DEFAULT '0.00' COMMENT '总金额',
  `emailcode` char(21) DEFAULT '-1' COMMENT '邮箱认证码',
  `mobilecode` char(21) DEFAULT '-1' COMMENT '手机认证码',
  `passcode` char(21) DEFAULT '-1' COMMENT '找会密码认证码-1,1,码',
  `reg_key` varchar(100) DEFAULT NULL COMMENT '注册参数',
  `yaoqing` int(10) unsigned DEFAULT NULL,
  `time` int(10) DEFAULT NULL,
  `login_time` int(10) unsigned DEFAULT '0',
  `subscribe` tinyint(1) unsigned DEFAULT NULL,
  `wxid` char(28) DEFAULT NULL,
  `nickname` varchar(50) CHARACTER SET gb2312 DEFAULT NULL COMMENT '呢称',
  `sex` tinyint(1) unsigned DEFAULT NULL COMMENT '1:男   0:女',
  `city` varchar(50) DEFAULT NULL COMMENT '城市',
  `country` varchar(50) DEFAULT NULL COMMENT '国家',
  `province` varchar(50) DEFAULT NULL COMMENT '省',
  `language` varchar(50) DEFAULT NULL COMMENT '语言',
  `headimgurl` varchar(200) DEFAULT NULL,
  `subscribe_time` int(10) unsigned DEFAULT NULL,
  `localimgurl` varchar(200) DEFAULT NULL,
  `setp` smallint(2) unsigned DEFAULT NULL,
  `is_del` tinyint(1) unsigned DEFAULT '0' COMMENT '0:正常    1:删除',
  `allotment_ratio` decimal(3,2) DEFAULT '0.00' COMMENT '分配比率',
  `nid` int(10) DEFAULT '0' COMMENT '在三级中是第几位',
  `is_bankcard` tinyint(2) DEFAULT '0' COMMENT '银行卡锁定标志 1:绑定',
  `bankcard_info` text COMMENT '银行卡信息',
  `default_allotment_ratio` decimal(3,2) DEFAULT '0.00' COMMENT '设置默认的分配比率',
  `goldcoin` int(10) unsigned DEFAULT '0' COMMENT '金币',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='前台会员信息表';

-- ----------------------------
-- Records of go_member
-- ----------------------------
INSERT INTO `go_member` VALUES ('1', '001', '张正洋', null, '18516239655', 'a4c81d27e608e0edeff6543f49cd193a', '上海市上海市,180.173.220.75', 'photo/member.jpg', '3', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '0', '1493274984', '1493280907', null, null, null, null, null, null, null, null, null, null, null, null, '0', '0.70', '1', '0', null, '0.50', '0');
INSERT INTO `go_member` VALUES ('2', '00100001', '测试_会员单位', null, '13989300000', 'e10adc3949ba59abbe56e057f20f883e', ',127.0.0.1', 'photo/member.jpg', '2', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '1', '1493275925', '1493779043', null, null, null, null, null, null, null, null, null, null, null, null, '0', '0.50', '1', '0', null, '0.20', '0');
INSERT INTO `go_member` VALUES ('3', '001000010000001', '测试_经纪人_韩曾朝', null, '13989306494', 'e10adc3949ba59abbe56e057f20f883e', ',127.0.0.1', 'photo/member.jpg', '1', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '2', '1493275945', '1494208479', null, null, null, null, null, null, null, null, null, null, null, null, '0', '0.20', '1', '0', null, '0.00', '0');
INSERT INTO `go_member` VALUES ('4', '002', '测试区域代理', null, '13989300001', 'e10adc3949ba59abbe56e057f20f883e', '浙江省宁波市,218.74.250.38', 'photo/member.jpg', '3', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '0', '1493277166', '1493277180', null, null, null, null, null, null, null, null, null, null, null, null, '1', '0.70', '2', '0', null, '0.50', '0');
INSERT INTO `go_member` VALUES ('5', '00100002', '003', null, '15049338928', 'e10adc3949ba59abbe56e057f20f883e', null, 'photo/member.jpg', '2', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '1', '1493278251', '0', null, null, null, null, null, null, null, null, null, null, null, null, '1', '0.50', '2', '0', null, '0.20', '0');
INSERT INTO `go_member` VALUES ('6', '001000020000001', '001', null, '15049338929', 'e10adc3949ba59abbe56e057f20f883e', '上海市上海市,180.173.220.75', 'photo/member.jpg', '1', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '5', '1493278279', '1493278308', null, null, null, null, null, null, null, null, null, null, null, null, '1', '0.20', '1', '0', null, '0.00', '0');
INSERT INTO `go_member` VALUES ('7', '00100003', '张三', null, '13100000000', '96e79218965eb72c92a549dd5a330112', null, 'photo/member.jpg', '2', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '1', '1493280503', '0', null, null, null, null, null, null, null, null, null, null, null, null, '1', '0.50', '3', '0', null, '0.20', '0');
INSERT INTO `go_member` VALUES ('8', '00100004', '001', null, '15049338921', '96e79218965eb72c92a549dd5a330112', '上海市上海市,180.173.220.75', 'photo/member.jpg', '2', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '1', '1493280988', '1493281029', null, null, null, null, null, null, null, null, null, null, null, null, '1', '0.50', '4', '0', null, '0.20', '0');
INSERT INTO `go_member` VALUES ('9', '00100005', '001', null, '18516239999', 'e10adc3949ba59abbe56e057f20f883e', '上海市上海市,180.173.220.75', 'photo/member.jpg', '2', '0.00', '0.00', '0.00', '-1', '1', '-1', null, '1', '1493281823', '1493359688', null, null, null, null, null, null, null, null, null, null, null, null, '0', '0.50', '5', '0', null, '0.20', '0');
INSERT INTO `go_member` VALUES ('10', '001000050000001', null, null, '18817354804', '48cc007df454248adbe8ae50a21cf31d', '上海市上海市,180.173.220.75', 'photo/member.jpg', '1', '0.00', '0.00', '0.00', '-1', '1', '-1', '18817354804', '9', '1493360593', '1493361397', null, null, null, null, null, null, null, null, null, null, null, null, '0', '0.20', '1', '0', null, '0.00', '0');

-- ----------------------------
-- Table structure for go_member_account
-- ----------------------------
DROP TABLE IF EXISTS `go_member_account`;
CREATE TABLE `go_member_account` (
  `uid` int(11) unsigned NOT NULL COMMENT '用户id',
  `type` tinyint(1) DEFAULT NULL COMMENT '充值1/消费-1',
  `pay` char(20) DEFAULT NULL COMMENT '支付方式',
  `content` varchar(255) DEFAULT NULL COMMENT '详情',
  `money` decimal(10,2) unsigned NOT NULL DEFAULT '0.00' COMMENT '金额',
  `create_time` int(11) NOT NULL COMMENT '创建日期',
  KEY `uid` (`uid`),
  KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='会员账户明细表';

-- ----------------------------
-- Records of go_member_account
-- ----------------------------

-- ----------------------------
-- Table structure for go_member_cashout
-- ----------------------------
DROP TABLE IF EXISTS `go_member_cashout`;
CREATE TABLE `go_member_cashout` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL COMMENT '用户id',
  `username` varchar(20) NOT NULL COMMENT '开户人',
  `bankname` varchar(100) NOT NULL COMMENT '银行名称',
  `branch` varchar(100) NOT NULL COMMENT '支行',
  `money` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '申请提现金额',
  `time` int(10) NOT NULL COMMENT '申请时间',
  `banknumber` varchar(50) NOT NULL COMMENT '银行帐号',
  `linkphone` varchar(50) NOT NULL COMMENT '联系电话',
  `auditstatus` tinyint(4) NOT NULL COMMENT '1审核通过',
  `procefees` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '手续费',
  `real_account_money` decimal(10,2) DEFAULT '0.00' COMMENT '真实到帐金额',
  `audituid` int(11) DEFAULT NULL COMMENT '审核人',
  `audittime` int(10) NOT NULL COMMENT '审核时间',
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  KEY `type` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='会员佣金提现信息表';

-- ----------------------------
-- Records of go_member_cashout
-- ----------------------------

-- ----------------------------
-- Table structure for go_member_goldcoin_log
-- ----------------------------
DROP TABLE IF EXISTS `go_member_goldcoin_log`;
CREATE TABLE `go_member_goldcoin_log` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '序号',
  `uid` int(11) unsigned NOT NULL COMMENT '用户',
  `to_uid` int(11) unsigned NOT NULL COMMENT '接收者',
  `to_uid_ind` tinyint(2) unsigned DEFAULT '0' COMMENT '用户类型 0:会员 1：客户',
  `ind` tinyint(4) unsigned NOT NULL DEFAULT '0' COMMENT '类型0:金币',
  `qty` decimal(10,2) unsigned DEFAULT '0.00' COMMENT '数量',
  `remark` varchar(100) DEFAULT NULL COMMENT '备注',
  `addtime` int(10) unsigned NOT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_member_goldcoin_log
-- ----------------------------

-- ----------------------------
-- Table structure for go_member_group
-- ----------------------------
DROP TABLE IF EXISTS `go_member_group`;
CREATE TABLE `go_member_group` (
  `groupid` tinyint(4) unsigned NOT NULL AUTO_INCREMENT,
  `name` char(15) NOT NULL COMMENT '会员组名',
  `jingyan_start` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '需要的经验值',
  `jingyan_end` int(10) NOT NULL,
  `icon` varchar(255) DEFAULT NULL COMMENT '图标',
  `type` char(1) NOT NULL DEFAULT 'N' COMMENT '是否是系统组',
  PRIMARY KEY (`groupid`),
  KEY `jingyan` (`jingyan_start`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='会员经验等级信息表';

-- ----------------------------
-- Records of go_member_group
-- ----------------------------

-- ----------------------------
-- Table structure for go_member_message
-- ----------------------------
DROP TABLE IF EXISTS `go_member_message`;
CREATE TABLE `go_member_message` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL COMMENT '用户id',
  `type` tinyint(1) DEFAULT '0' COMMENT '消息来源,0系统,1私信',
  `sendid` int(11) unsigned DEFAULT '0' COMMENT '发送人ID',
  `sendname` char(20) DEFAULT NULL COMMENT '发送人名',
  `content` varchar(255) DEFAULT NULL COMMENT '发送内容',
  `time` int(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='会员消息表';

-- ----------------------------
-- Records of go_member_message
-- ----------------------------

-- ----------------------------
-- Table structure for go_model
-- ----------------------------
DROP TABLE IF EXISTS `go_model`;
CREATE TABLE `go_model` (
  `modelid` smallint(5) unsigned NOT NULL AUTO_INCREMENT,
  `name` char(10) NOT NULL,
  `table` char(20) NOT NULL,
  PRIMARY KEY (`modelid`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='模型表';

-- ----------------------------
-- Records of go_model
-- ----------------------------
INSERT INTO `go_model` VALUES ('1', '一元夺宝', 'shoplist');
INSERT INTO `go_model` VALUES ('2', '文章模型', 'article');
INSERT INTO `go_model` VALUES ('3', '积分分类', 'jf_shoplist');

-- ----------------------------
-- Table structure for go_navigation
-- ----------------------------
DROP TABLE IF EXISTS `go_navigation`;
CREATE TABLE `go_navigation` (
  `cid` smallint(6) unsigned NOT NULL AUTO_INCREMENT,
  `parentid` smallint(6) unsigned DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `type` char(10) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `status` char(1) DEFAULT 'Y' COMMENT '显示/隐藏',
  `order` smallint(6) unsigned DEFAULT '1',
  `content` text,
  `time` datetime NOT NULL,
  PRIMARY KEY (`cid`),
  KEY `status` (`status`),
  KEY `order` (`order`),
  KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='导航条信息表';

-- ----------------------------
-- Records of go_navigation
-- ----------------------------
INSERT INTO `go_navigation` VALUES ('4', '0', '关于我们', 'foot', '/help/1', 'Y', '1', null, '0000-00-00 00:00:00');
INSERT INTO `go_navigation` VALUES ('5', '0', '常见问题', 'foot', '/help/2', 'Y', '1', '<p>欢迎使用!</p>', '2016-04-08 10:48:48');
INSERT INTO `go_navigation` VALUES ('7', '0', '友情链接', 'foot', '/link', 'Y', '1', null, '0000-00-00 00:00:00');
INSERT INTO `go_navigation` VALUES ('8', '0', '联系我们', 'foot', '/help/13', 'Y', '1', null, '0000-00-00 00:00:00');

-- ----------------------------
-- Table structure for go_pay
-- ----------------------------
DROP TABLE IF EXISTS `go_pay`;
CREATE TABLE `go_pay` (
  `pay_id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `pay_name` char(20) NOT NULL,
  `pay_class` char(20) NOT NULL,
  `pay_type` tinyint(3) NOT NULL,
  `pay_thumb` varchar(255) DEFAULT NULL,
  `pay_des` text,
  `pay_start` tinyint(4) NOT NULL,
  `pay_key` text,
  `pay_mobile` tinyint(3) unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`pay_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8 COMMENT='支付方式信息表';

-- ----------------------------
-- Records of go_pay
-- ----------------------------
INSERT INTO `go_pay` VALUES ('1', '合利宝支付', 'helipay', '0', 'photo/20170323/38235011261974.jpg', '合利宝支付', '1', 'a:5:{s:2:\"id\";a:2:{s:4:\"name\";s:9:\"商户号\";s:3:\"val\";s:11:\"C1800001015\";}s:3:\"key\";a:2:{s:4:\"name\";s:6:\"密匙\";s:3:\"val\";s:32:\"FQVr0DMOcpoqUpLni2iZhD2ImmFygTLW\";}s:3:\"url\";a:2:{s:4:\"name\";s:6:\"地址\";s:3:\"val\";s:51:\"http://pay.trx.helipay.com/trx/app/interface.action\";}s:8:\"wx_appid\";a:2:{s:4:\"name\";s:5:\"APPID\";s:3:\"val\";s:18:\"wx0b291371dfdfb2a0\";}s:12:\"wx_appsecret\";a:2:{s:4:\"name\";s:9:\"APPSECRET\";s:3:\"val\";s:32:\"e8c7d11b8446c1e16d6846b752d1d538\";}}', '0');
INSERT INTO `go_pay` VALUES ('2', '点芯支付', 'dcorepay', '0', 'photo/20170412/39783083975811.png', '点芯支付', '1', 'a:5:{s:2:\"id\";a:2:{s:4:\"name\";s:9:\"商户号\";s:3:\"val\";s:12:\"102510504454\";}s:3:\"key\";a:2:{s:4:\"name\";s:6:\"密匙\";s:3:\"val\";s:32:\"19965596c1bb1444a6719bccfefc98dd\";}s:3:\"url\";a:2:{s:4:\"name\";s:6:\"地址\";s:3:\"val\";s:36:\"https://pay.swiftpass.cn/pay/gateway\";}s:8:\"wx_appid\";a:2:{s:4:\"name\";s:5:\"APPID\";s:3:\"val\";s:18:\"wx0b291371dfdfb2a0\";}s:12:\"wx_appsecret\";a:2:{s:4:\"name\";s:9:\"APPSECRET\";s:3:\"val\";s:32:\"e8c7d11b8446c1e16d6846b752d1d538\";}}', '0');

-- ----------------------------
-- Table structure for go_permission
-- ----------------------------
DROP TABLE IF EXISTS `go_permission`;
CREATE TABLE `go_permission` (
  `perid` int(11) NOT NULL AUTO_INCREMENT COMMENT '权限自增id号',
  `per_name` varchar(255) CHARACTER SET utf8 DEFAULT NULL COMMENT '权限名称',
  `per_pid` int(11) NOT NULL DEFAULT '0' COMMENT '当前权限的父级id号，顶级权限的话值为0，默认为0',
  `per_content` varchar(255) CHARACTER SET utf8 DEFAULT NULL COMMENT '权限内容，存储序列化字符',
  `per_parameter` varchar(255) DEFAULT NULL COMMENT '针对当前权限需要的参数，格式：参数名字=参数值。比如borrow/list  ，status=0   ，对应的就是后台的发标待审',
  `per_path` varchar(255) DEFAULT NULL COMMENT '权限全路径，',
  `per_level` int(11) NOT NULL DEFAULT '0' COMMENT '当前权限所属的级别,0代表顶级，1代表次级，以此类推',
  `per_menu` varchar(255) NOT NULL DEFAULT '0' COMMENT '当前权限是否属于菜单栏，1代表是菜单项',
  `per_url` varchar(255) DEFAULT NULL COMMENT '菜单的链接地址，如果是菜单，则填写url地址',
  `order` int(11) NOT NULL DEFAULT '0' COMMENT '排序值，值越大，排名越靠前',
  `status` int(11) NOT NULL DEFAULT '0' COMMENT '权限状态，0代表不启用，1代表启用，默认为0。',
  `addtime` varchar(255) DEFAULT NULL COMMENT '添加时间',
  `addip` varchar(255) DEFAULT NULL COMMENT '添加ip',
  PRIMARY KEY (`perid`)
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=latin1 COMMENT='此为权限表，存储的是整个网站的所有权限。';

-- ----------------------------
-- Records of go_permission
-- ----------------------------
INSERT INTO `go_permission` VALUES ('4', '系统设置', '0', 'setting', null, '4', '0', '1', '', '10', '1', '1465024567', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('5', '站点设置', '4', '', null, '4-5', '1', '1', '', '52', '1', '1464924139', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('6', 'SEO设置', '5', '/admin/setting/webcfg', null, '4-5-6', '2', '1', '/admin/setting/webcfg', '34', '1', '1465024813', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('7', '管理员管理', '4', '', null, '4-7', '1', '1', '', '34', '1', '1464924680', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('8', '基本设置', '5', '/admin/setting/config', null, '4-5-8', '2', '1', '/admin/setting/config', '33', '1', '1465024879', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('9', '管理员管理', '7', '/admin/user/lists', null, '4-7-9', '2', '1', '/admin/user/lists', '10', '1', '1465190299', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('10', '内容管理', '0', 'content', null, '10', '0', '1', '12', '10', '0', '1465114112', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('11', '文章管理', '10', 'javascript:void(0)', null, '10-11', '1', '1', 'javascript:void(0)', '23', '0', '1465113473', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('12', '添加文章', '11', '/admin/content/article_add', null, '10-11-12', '2', '1', '/admin/content/article_add', '10', '0', '1465113529', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('13', '上传设置', '5', '/admin/setting/upload', null, '4-5-13', '2', '1', '/admin/setting/upload', '10', '1', '1465111852', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('14', '水印设置', '5', '/admin/setting/watermark', null, '4-5-14', '2', '1', '/admin/setting/watermark', '10', '1', '1465111910', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('15', '邮箱配置', '5', '/admin/setting/email', null, '4-5-15', '2', '1', '/admin/setting/email', '10', '1', '1465111962', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('16', '短信配置', '5', '/admin/setting/mobile', null, '4-5-16', '2', '1', '/admin/setting/mobile', '10', '1', '1465111998', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('17', '通知模版配置', '5', '/admin/template/temp', null, '4-5-17', '2', '1', '/admin/template/temp', '10', '1', '1465112176', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('18', '支付方式', '5', '/pay/pay/pay_list', null, '4-5-18', '2', '1', '/pay/pay/pay_list', '10', '1', '1465112233', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('19', '模块域名绑定', '5', '/admin/setting/domain', null, '4-5-19', '2', '1', '/admin/setting/domain', '10', '1', '1465116965', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('20', '官方QQ群', '5', '/admin/qq_admin/init', null, '4-5-20', '2', '1', '/admin/qq_admin/init', '10', '0', '1465196859', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('21', '添加管理员', '7', '/admin/user/reg', null, '4-7-21', '2', '1', '/admin/user/reg', '10', '1', '1465112514', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('22', '角色管理', '7', '/admin/user/typelists', null, '4-7-22', '2', '1', '/admin/user/typelists', '10', '1', '1465112591', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('23', '添加角色', '7', '/admin/user/typereg', null, '4-7-23', '2', '1', '/admin/user/typereg', '10', '1', '1465112639', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('24', '权限管理', '7', '/admin/user/perlists', null, '4-7-24', '2', '1', '/admin/user/perlists', '10', '1', '1465112694', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('25', '添加权限', '7', '/admin/user/pereg', null, '4-7-25', '2', '1', '/admin/user/pereg', '10', '1', '1465112725', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('26', '修改密码', '7', '/admin/user/edit', null, '4-7-26', '2', '1', '/admin/user/edit', '10', '1', '1465117164', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('27', '站长运营', '4', 'javascript:void(0)', null, '4-27', '1', '1', 'javascript:void(0)', '10', '0', '1465112998', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('28', '站点地图', '27', '/admin/yunwei/websitemap', null, '4-27-28', '2', '1', '/admin/yunwei/websitemap', '10', '0', '1465113056', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('29', '网站提交', '27', '/admin/yunwei/websubmit', null, '4-27-29', '2', '1', '/admin/yunwei/websubmit', '10', '0', '1465113087', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('30', '站长统计', '27', '/admin/yunwei/webtongji', null, '4-27-30', '2', '1', '/admin/yunwei/webtongji', '10', '0', '1465113138', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('31', '后台首页', '4', 'javascript:void(0)', null, '4-31', '1', '1', 'javascript:void(0)', '10', '1', '1465113166', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('32', '后台首页', '31', '/admin/index/Tdefault', null, '4-31-32', '2', '1', '/admin/index/Tdefault', '10', '1', '1465113199', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('33', '其他', '4', 'javascript:void(0)', null, '4-33', '1', '1', 'javascript:void(0)', '10', '1', '1465113235', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('34', '清空缓存', '33', '/admin/cache/init', null, '4-33-34', '2', '1', '/admin/cache/init', '10', '1', '1465113263', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('35', '文章列表', '11', '/admin/content/article_list', null, '10-11-35', '2', '1', '/admin/content/article_list', '10', '0', '1465113616', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('36', '文章分类', '11', '/admin/category/lists/article', null, '10-11-36', '2', '1', '/admin/category/lists/article', '10', '0', '1465113651', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('37', '单页管理', '10', 'javascript:void(0)', null, '10-37', '1', '1', 'javascript:void(0)', '10', '0', '1465113717', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('38', '添加单页', '37', '/admin/category/addcate/danweb', null, '10-37-38', '2', '1', '/admin/category/addcate/danweb', '10', '0', '1465113760', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('39', '单页列表', '37', '/admin/category/lists/single', null, '10-37-39', '2', '1', '/admin/category/lists/single', '10', '0', '1465113782', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('40', '附件管理', '10', 'javascript:void(0)', null, '10-40', '1', '1', 'javascript:void(0)', '10', '0', '1465113818', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('41', '上传文件管理', '40', '/admin/upload/lists', null, '10-40-41', '2', '1', '/admin/upload/lists', '10', '0', '1465113848', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('42', '其他', '10', 'javascript:void(0)', null, '10-42', '1', '1', 'javascript:void(0)', '10', '0', '1465113890', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('43', '内容模型', '42', '/admin/content/model', null, '10-42-43', '2', '1', '/admin/content/model', '10', '0', '1465113914', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('44', '栏目管理', '42', '/admin/category/lists', null, '10-42-44', '2', '1', '/admin/category/lists', '10', '0', '1465113939', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('45', '模块管理', '10', 'javascript:void(0)', null, '10-45', '1', '1', 'javascript:void(0)', '10', '0', '1465113980', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('46', '友情链接', '45', '/admin/link/lists', null, '10-45-46', '2', '1', '/admin/link/lists', '10', '0', '1465114013', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('47', '广告模块', '45', '/admanage/admanage_admin/init', null, '10-45-47', '2', '1', '/admanage/admanage_admin/init', '10', '0', '1465207653', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('80', '用户管理', '0', 'user', null, '80', '0', '1', 'javascript:void(0)', '10', '1', '1465118503', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('81', '用户管理', '80', 'javascript:void(0)', null, '80-81', '1', '1', 'javascript:void(0)', '10', '1', '1465115957', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('82', '会员列表', '81', '/member/member/lists', null, '80-81-82', '2', '1', '/member/member/lists', '10', '1', '1465116005', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('84', '添加会员', '81', '/member/member/insert', null, '80-81-84', '2', '1', '/member/member/insert', '10', '1', '1465116048', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('85', '会员配置', '81', '/member/member/config', null, '80-81-85', '2', '1', '/member/member/config', '10', '1', '1465116073', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('86', '充值记录', '81', '/member/member/recharge', null, '80-81-86', '2', '1', '/member/member/recharge', '10', '1', '1465116096', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('88', '会员组', '81', '/member/member/member_group', null, '80-81-88', '2', '1', '/member/member/member_group', '10', '0', '1465116136', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('89', '现金提现审核', '81', '/member/member/commissions', null, '80-81-89', '2', '1', '/member/member/commissions', '10', '1', '1465116167', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('90', '手机验证码日志', '81', '/member/member/phone_valicode_list', null, '80-81-90', '2', '1', '/member/member/phone_valicode_list', '10', '1', '1465116186', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('93', '界面管理', '0', 'template', null, '93', '0', '1', 'javascript:void(0)', '10', '1', '1465118545', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('94', '界面管理', '93', 'javascript:void(0)', null, '93-94', '1', '1', 'javascript:void(0)', '10', '1', '1465116338', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('95', '导航条管理', '94', '/admin/ments/navigation', null, '93-94-95', '2', '1', '/admin/ments/navigation', '10', '1', '1465116368', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('96', '幻灯片管理', '94', '/admin/slide/init', null, '93-94-96', '2', '1', '/admin/slide/init', '10', '1', '1465213919', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('98', '模版风格', '93', 'javascript:void(0)', null, '93-98', '1', '1', 'javascript:void(0)', '10', '1', '1465116469', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('99', '模版设置', '98', '/admin/template/init', null, '93-98-99', '2', '1', '/admin/template/init', '10', '1', '1465214425', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('100', '查看模版', '98', '/admin/template/see', null, '93-98-100', '2', '1', '/admin/template/see', '10', '1', '1465116544', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('101', '模版TAG标签', '98', '/admin/htmlcustom/lists', null, '93-98-101', '2', '1', '/admin/htmlcustom/lists', '10', '1', '1465116575', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('102', '授权查询', '5', '/admin/setting/empower', null, '4-5-102', '2', '0', '', '10', '1', '1465191019', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('103', '短信发送模版配置', '5', '/admin/template/mobile_temp', null, '4-5-103', '2', '0', '', '10', '1', '1465192594', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('104', '支付银行选择', '5', '/pay/pay/pay_bank', null, '4-5-104', '2', '0', '', '10', '1', '1465192666', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('105', '中奖通知设置', '5', '/admin/setting/sendconfig', null, '4-5-105', '2', '0', '', '10', '1', '1465192713', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('106', '支付方式编辑', '5', '/pay/pay/pay_set', null, '4-5-106', '2', '0', '', '10', '1', '1465192790', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('109', '修改角色', '7', '/admin/user/typeedit', null, '4-7-109', '2', '0', '', '10', '1', '1465197495', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('110', '权限修改', '7', '/admin/user/peredit', null, '4-7-110', '2', '0', '', '10', '1', '1465197980', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('111', '文章修改', '11', '/admin/content/article_edit', null, '10-11-111', '2', '0', '', '10', '0', '1465198290', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('112', '添加栏目', '11', '/admin/category/addcate/def', null, '10-11-112', '2', '0', '', '10', '0', '1465198620', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('113', '添加单网页', '11', '/admin/category/addcate/danweb', null, '10-11-113', '2', '0', '', '10', '0', '1465199162', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('114', '添加外部链接', '11', '/admin/category/addcate/link', null, '10-11-114', '2', '0', '', '10', '0', '1465199205', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('115', '修改栏目', '11', '/admin/category/editcate', null, '10-11-115', '2', '0', '', '10', '0', '1465199258', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('116', '栏目排序', '11', '/admin/category/listorder', null, '10-11-116', '2', '0', '', '10', '0', '1465199362', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('117', '添加图片链接', '45', '/admin/link/addimg', null, '10-45-117', '2', '0', '', '10', '0', '1465207376', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('118', '添加文字链接', '45', '/admin/link/addtext', null, '10-45-118', '2', '0', '', '10', '0', '1465207436', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('119', '广告位管理', '45', '/admanage/admanage_admin/adarea', null, '10-45-119', '2', '0', '', '10', '0', '1465207771', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('120', '广告位添加', '45', '/admanage/admanage_admin/doadarea', null, '10-45-120', '2', '0', '', '10', '0', '1465207988', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('121', '广告管理', '45', '/admanage/admanage_admin/admanage', null, '10-45-121', '2', '0', '', '10', '0', '1465208069', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('122', '广告添加', '45', '/admanage/admanage_admin/adadd', null, '10-45-122', '2', '0', '', '10', '0', '1465208277', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('149', '修改会员', '81', '/member/member/modify', null, '80-81-149', '2', '0', '', '10', '1', '1465212958', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('151', '会员福利配置', '81', '/member/member/member_fufen', null, '80-81-151', '2', '0', '', '10', '0', '1465213216', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('152', '添加会员组', '81', '/member/member/member_add_group', null, '80-81-152', '2', '0', '', '10', '0', '1465213295', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('153', '修改会员组', '81', '/member/member/group_modify', null, '80-81-153', '2', '0', '', '10', '0', '1465213372', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('154', '审核拥挤提现申请', '81', '/member/member/commreview', null, '80-81-154', '2', '0', '', '10', '0', '1465213474', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('155', '添加充值卡', '91', '/czk/vote_admin/insert', null, '80-91-155', '2', '0', '', '10', '0', '1465213663', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('156', '删除充值卡', '91', '/czk/vote_admin/del/id', null, '80-91-156', '2', '0', '', '10', '0', '1465213734', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('157', '添加导航条', '94', '/admin/ments/addnav', null, '93-94-157', '2', '0', '', '10', '1', '1465213822', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('158', '修改导航条', '94', '/admin/ments/editnav', null, '93-94-158', '2', '0', '', '10', '1', '1465213875', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('159', '添加幻灯片', '94', '/admin/slide/add', null, '93-94-159', '2', '0', '', '10', '1', '1465214023', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('160', '幻灯片修改', '94', '/admin/slide/update', null, '93-94-160', '2', '0', '', '10', '1', '1465214065', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('161', '删除幻灯片', '94', '/admin/slide/delete', null, '93-94-161', '2', '0', '', '10', '1', '1465214152', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('164', '修改模版', '98', '/admin/template/edit/taolong-fangwangyi', null, '93-98-164', '2', '0', '', '10', '1', '1465214514', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('165', '查看模版1', '98', '/admin/template/see/taolong-fangwangyi/html-fwy', null, '93-98-165', '2', '0', '', '10', '1', '1465214591', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('166', '查看模版2', '98', '/admin/template/see/taolong-1yygkuan/html-kuan', null, '93-98-166', '2', '0', '', '10', '1', '1465214607', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('167', '新建模版TAG标签', '98', '/admin/htmlcustom/create', null, '93-98-167', '2', '0', '', '10', '1', '1465214703', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('168', '官方qq群修改', '5', '/admin/qq_admin/update', null, '4-5-168', '2', '0', '', '10', '1', '1465262751', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('169', 'QQ群添加', '5', '/admin/qq_admin/add', null, '4-5-169', '2', '0', '', '10', '1', '1465277122', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('170', '删除导航条', '94', '/admin/ments/navdel', null, '93-94-170', '2', '0', '', '10', '1', '1465277448', '192.168.1.185');
INSERT INTO `go_permission` VALUES ('175', '三级分销(不分层)', '81', '', null, '80-81-175', '2', '1', '/member/member/yaoqing', '10', '1', '1470376031', '60.178.205.159');
INSERT INTO `go_permission` VALUES ('176', '三级分销(分层)', '81', '', null, '80-81-176', '2', '1', '/member/member/yaoqingPlus', '10', '1', '1470376031', '60.178.205.159');
INSERT INTO `go_permission` VALUES ('177', '日报表', '81', '', null, '80-81-177', '2', '1', '/member/member/reportDay', '10', '1', '1470376031', '60.178.205.159');
INSERT INTO `go_permission` VALUES ('178', '客户列表', '81', '', null, '80-81-178', '2', '1', '/member/member/customList', '10', '1', '1470376031', '60.178.205.159');
INSERT INTO `go_permission` VALUES ('179', '分支日报表', '81', '', null, '80-81-179', '2', '1', '/member/member/reportDay1', '10', '1', '1470376031', '60.178.205.159');
INSERT INTO `go_permission` VALUES ('180', '金币日志', '81', '', null, '80-81-180', '2', '1', '/member/member/goldcoinLog', '10', '1', '1470376031', '60.178.205.159');

-- ----------------------------
-- Table structure for go_queue
-- ----------------------------
DROP TABLE IF EXISTS `go_queue`;
CREATE TABLE `go_queue` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(20) DEFAULT NULL COMMENT '类型：sms,mail',
  `status` tinyint(4) DEFAULT '0' COMMENT '状态，表示是否处理',
  `uid` int(11) DEFAULT '0' COMMENT '用户ID',
  `phone` varchar(11) NOT NULL DEFAULT '0' COMMENT '手机号码',
  `valicode` varchar(10) NOT NULL DEFAULT '0' COMMENT '手机验证码',
  `addtime` int(11) DEFAULT '0' COMMENT '加入时间',
  `updatetime` int(11) DEFAULT '0' COMMENT '处理时间',
  `addip` char(15) DEFAULT NULL COMMENT 'ip',
  `result` text COMMENT '返回结果',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=gbk COMMENT='手机验证码日志';

-- ----------------------------
-- Records of go_queue
-- ----------------------------
INSERT INTO `go_queue` VALUES ('1', 'sms', '0', '10', '18817354804', '622390', '1493360593', '0', '180.173.220.75', null);

-- ----------------------------
-- Table structure for go_recom
-- ----------------------------
DROP TABLE IF EXISTS `go_recom`;
CREATE TABLE `go_recom` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '推荐位id',
  `img` varchar(50) DEFAULT NULL COMMENT '推荐位图片',
  `title` varchar(30) DEFAULT NULL COMMENT '推荐位标题',
  `link` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of go_recom
-- ----------------------------

-- ----------------------------
-- Table structure for go_rpt_account
-- ----------------------------
DROP TABLE IF EXISTS `go_rpt_account`;
CREATE TABLE `go_rpt_account` (
  `ymd` varchar(8) NOT NULL COMMENT '年月日',
  `id` int(11) unsigned NOT NULL COMMENT '序号',
  `status` tinyint(2) DEFAULT '0' COMMENT '状态(0:新建  1:审批)',
  `uid` int(11) NOT NULL COMMENT '三级用户UID',
  `ind` tinyint(2) DEFAULT NULL COMMENT '1:经纪人/2:会员单位/3:区域代理',
  `allotment_ratio` decimal(3,2) DEFAULT NULL COMMENT '分配比率',
  `first_money` decimal(10,2) DEFAULT NULL COMMENT '首次分配金额',
  `last_money` decimal(10,2) DEFAULT NULL COMMENT '最后分配金额',
  `rechange_id` int(11) unsigned DEFAULT NULL COMMENT '充值表ID',
  `rechange_userid` int(11) DEFAULT NULL COMMENT '充值表客户ID',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `day_ymd` varchar(8) DEFAULT NULL COMMENT '日报表年月日',
  PRIMARY KEY (`ymd`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_rpt_account
-- ----------------------------

-- ----------------------------
-- Table structure for go_rpt_account_day
-- ----------------------------
DROP TABLE IF EXISTS `go_rpt_account_day`;
CREATE TABLE `go_rpt_account_day` (
  `ymd` varchar(8) NOT NULL COMMENT '年月日',
  `id` int(11) NOT NULL COMMENT '序号',
  `status` tinyint(2) DEFAULT NULL COMMENT '状态(0:新建  1:审批)',
  `ts` int(11) DEFAULT '0' COMMENT '条数',
  `uid` int(11) DEFAULT NULL COMMENT '三级用户UID',
  `ind` tinyint(2) DEFAULT NULL COMMENT '1:经纪人/2:会员单位/3:区域代理',
  `allotment_ratio` decimal(3,2) DEFAULT NULL COMMENT '分配比率',
  `money` decimal(10,2) DEFAULT NULL COMMENT '金额',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`ymd`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_rpt_account_day
-- ----------------------------

-- ----------------------------
-- Table structure for go_rpt_account_day_1
-- ----------------------------
DROP TABLE IF EXISTS `go_rpt_account_day_1`;
CREATE TABLE `go_rpt_account_day_1` (
  `ymd` varchar(8) NOT NULL COMMENT '年月日',
  `id` int(11) NOT NULL COMMENT '序号',
  `ts` int(11) DEFAULT '0' COMMENT '条数',
  `uid` int(11) DEFAULT NULL COMMENT '三级用户UID',
  `ind` tinyint(2) DEFAULT NULL COMMENT '1:经纪人/2:会员单位/3:区域代理',
  `allotment_ratio` decimal(3,2) DEFAULT NULL COMMENT '分配比率',
  `money` decimal(10,2) DEFAULT NULL COMMENT '金额',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`ymd`,`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_rpt_account_day_1
-- ----------------------------

-- ----------------------------
-- Table structure for go_rpt_account_day_ind
-- ----------------------------
DROP TABLE IF EXISTS `go_rpt_account_day_ind`;
CREATE TABLE `go_rpt_account_day_ind` (
  `ymd` varchar(8) NOT NULL COMMENT '年月日',
  `ind` tinyint(2) NOT NULL COMMENT '1:经纪人/2:会员单位/3:区域代理',
  `ts` int(11) DEFAULT NULL COMMENT '条数',
  `money` decimal(10,2) DEFAULT NULL COMMENT '金额',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`ymd`,`ind`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_rpt_account_day_ind
-- ----------------------------

-- ----------------------------
-- Table structure for go_rpt_account_total
-- ----------------------------
DROP TABLE IF EXISTS `go_rpt_account_total`;
CREATE TABLE `go_rpt_account_total` (
  `ymd` varchar(8) NOT NULL COMMENT '年月日',
  `ts` int(11) DEFAULT NULL COMMENT '条数',
  `total_money` decimal(10,2) DEFAULT NULL COMMENT '总金额',
  `allocation_money` decimal(10,2) DEFAULT NULL COMMENT '分配金额',
  `hold_money` decimal(10,2) DEFAULT NULL COMMENT '保留金额',
  `create_time` datetime DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`ymd`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_rpt_account_total
-- ----------------------------

-- ----------------------------
-- Table structure for go_send
-- ----------------------------
DROP TABLE IF EXISTS `go_send`;
CREATE TABLE `go_send` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `uid` int(11) unsigned NOT NULL,
  `gid` int(11) unsigned NOT NULL,
  `username` varchar(30) NOT NULL,
  `shoptitle` varchar(200) NOT NULL,
  `send_type` tinyint(4) NOT NULL,
  `send_time` int(10) unsigned NOT NULL,
  `is_award` char(1) DEFAULT 'Y' COMMENT '是否是中奖',
  `source` tinyint(3) DEFAULT '0' COMMENT '来源 1:来自大派送',
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  KEY `gid` (`gid`),
  KEY `send_type` (`send_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of go_send
-- ----------------------------

-- ----------------------------
-- Table structure for go_send_temp
-- ----------------------------
DROP TABLE IF EXISTS `go_send_temp`;
CREATE TABLE `go_send_temp` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '序号',
  `uid` int(11) unsigned NOT NULL COMMENT '用户ID',
  `gid` int(11) unsigned NOT NULL COMMENT '商品ID',
  `gtimes` smallint(6) DEFAULT NULL COMMENT '商品期数',
  `addtime` int(10) unsigned NOT NULL COMMENT '写入时间',
  `status` int(2) NOT NULL DEFAULT '0' COMMENT '状态0:未发 1:已发',
  `is_award` char(1) DEFAULT 'N' COMMENT '是否是中奖',
  `param` text COMMENT '参数组',
  `send_time` int(10) DEFAULT NULL COMMENT '发送时间',
  `source` tinyint(3) DEFAULT '0' COMMENT '来源 1:来自大派送',
  PRIMARY KEY (`id`),
  KEY `uid` (`uid`),
  KEY `gid` (`gid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of go_send_temp
-- ----------------------------

-- ----------------------------
-- Table structure for go_slide
-- ----------------------------
DROP TABLE IF EXISTS `go_slide`;
CREATE TABLE `go_slide` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `img` varchar(50) DEFAULT NULL COMMENT '幻灯片',
  `title` varchar(30) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `status` smallint(5) DEFAULT '0',
  `content` text,
  `time` datetime NOT NULL,
  `ind` tinyint(2) unsigned DEFAULT '0' COMMENT '0:pc  1:mobile',
  PRIMARY KEY (`id`),
  KEY `img` (`img`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='前台幻灯片信息表';

-- ----------------------------
-- Records of go_slide
-- ----------------------------
INSERT INTO `go_slide` VALUES ('20', 'banner/20170228/57441369254439.jpg', '1', 'http://www.test.com/?/register', '0', '', '2017-02-28 13:55:47', '0');
INSERT INTO `go_slide` VALUES ('29', 'banner/20170228/12301278261390.jpg', '我的百度', 'http://www.baidu.com', '0', '', '2017-02-28 13:56:34', '0');

-- ----------------------------
-- Table structure for go_template
-- ----------------------------
DROP TABLE IF EXISTS `go_template`;
CREATE TABLE `go_template` (
  `template_name` char(25) NOT NULL,
  `template` char(25) NOT NULL,
  `des` varchar(100) DEFAULT NULL,
  KEY `template` (`template`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC;

-- ----------------------------
-- Records of go_template
-- ----------------------------

-- ----------------------------
-- Table structure for go_temp_log
-- ----------------------------
DROP TABLE IF EXISTS `go_temp_log`;
CREATE TABLE `go_temp_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `addtime` datetime DEFAULT NULL,
  `remark` varchar(50) DEFAULT NULL,
  `ind` tinyint(2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of go_temp_log
-- ----------------------------
INSERT INTO `go_temp_log` VALUES ('1', '2017-04-28 03:00:00', 'account_allocation', '1');
INSERT INTO `go_temp_log` VALUES ('2', '2017-04-29 03:00:00', 'account_allocation', '1');
INSERT INTO `go_temp_log` VALUES ('3', '2017-04-30 03:00:00', 'account_allocation', '1');
INSERT INTO `go_temp_log` VALUES ('4', '2017-05-01 03:00:00', 'account_allocation', '1');
INSERT INTO `go_temp_log` VALUES ('5', '2017-05-02 03:00:00', 'account_allocation', '1');
INSERT INTO `go_temp_log` VALUES ('6', '2017-05-03 03:00:00', 'account_allocation', '1');

-- ----------------------------
-- Table structure for t_bills
-- ----------------------------
DROP TABLE IF EXISTS `t_bills`;
CREATE TABLE `t_bills` (
  `orderid` bigint(20) NOT NULL,
  `operator` varchar(255) DEFAULT NULL,
  `target` varchar(255) DEFAULT NULL,
  `num` int(11) DEFAULT NULL,
  `time` bigint(20) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`orderid`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_bills
-- ----------------------------

-- ----------------------------
-- Table structure for t_buy_goods_log
-- ----------------------------
DROP TABLE IF EXISTS `t_buy_goods_log`;
CREATE TABLE `t_buy_goods_log` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `account` char(11) DEFAULT NULL,
  `goods_type` int(11) DEFAULT NULL,
  `goods_num` int(11) DEFAULT NULL,
  `goods_price` int(11) DEFAULT NULL,
  `price_type` int(11) DEFAULT NULL,
  `time` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_buy_goods_log
-- ----------------------------

-- ----------------------------
-- Table structure for t_dealers
-- ----------------------------
DROP TABLE IF EXISTS `t_dealers`;
CREATE TABLE `t_dealers` (
  `account` char(11) NOT NULL COMMENT 'phone number of this admin',
  `password` varchar(41) NOT NULL COMMENT 'password of this admin',
  `name` varchar(255) DEFAULT NULL,
  `create_time` bigint(11) NOT NULL COMMENT 'when this account created',
  `gems` int(11) DEFAULT '0' COMMENT '房卡',
  `score` int(11) DEFAULT '0' COMMENT '积分',
  `parent` char(11) DEFAULT NULL COMMENT '上级',
  `token` char(32) DEFAULT NULL COMMENT 'the token of this admin',
  `last_login_time` int(11) DEFAULT NULL COMMENT 'last_login_time',
  `privilege_level` int(11) NOT NULL COMMENT 'privilige level of this admin.  999 super 0 normal',
  `all_gems` int(11) DEFAULT '0' COMMENT '累计获得房卡',
  `all_score` int(11) DEFAULT '0' COMMENT '累计获得积分',
  `all_subs` int(11) DEFAULT '0' COMMENT '累计新增用户',
  PRIMARY KEY (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='代理系统数据库';

-- ----------------------------
-- Records of t_dealers
-- ----------------------------

-- ----------------------------
-- Table structure for t_dealers_goods
-- ----------------------------
DROP TABLE IF EXISTS `t_dealers_goods`;
CREATE TABLE `t_dealers_goods` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `goods_name` varchar(45) NOT NULL,
  `goods_type` int(11) NOT NULL COMMENT '1：  房卡 2： 积分',
  `goods_num` int(11) NOT NULL COMMENT '数量',
  `goods_price` int(11) NOT NULL COMMENT '单价',
  `price_type` int(11) NOT NULL COMMENT ' 1:积分 2：房卡： 3 RMB ',
  `state` int(11) NOT NULL COMMENT '0，关闭 1，启用',
  `act_time` bigint(20) NOT NULL COMMENT '启用时间',
  `end_time` bigint(20) DEFAULT NULL COMMENT '结束失效时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_dealers_goods
-- ----------------------------

-- ----------------------------
-- Table structure for t_dealers_kpi
-- ----------------------------
DROP TABLE IF EXISTS `t_dealers_kpi`;
CREATE TABLE `t_dealers_kpi` (
  `account` char(11) NOT NULL COMMENT '账号id',
  `year` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `gems` int(11) DEFAULT '0' COMMENT '累计值',
  `score` int(11) DEFAULT '0',
  `subs` int(11) DEFAULT '0',
  PRIMARY KEY (`account`,`year`,`month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COMMENT='按月统计考核代理';

-- ----------------------------
-- Records of t_dealers_kpi
-- ----------------------------

-- ----------------------------
-- Table structure for t_dealers_notice
-- ----------------------------
DROP TABLE IF EXISTS `t_dealers_notice`;
CREATE TABLE `t_dealers_notice` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(45) DEFAULT NULL,
  `content` varchar(2048) DEFAULT NULL,
  `level` int(11) DEFAULT '0',
  `act_time` bigint(20) DEFAULT NULL,
  `end_time` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_dealers_notice
-- ----------------------------

-- ----------------------------
-- Table structure for t_rates
-- ----------------------------
DROP TABLE IF EXISTS `t_rates`;
CREATE TABLE `t_rates` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `rate1` int(11) DEFAULT NULL,
  `rate2` int(11) DEFAULT NULL,
  `rate3` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Records of t_rates
-- ----------------------------
INSERT INTO `t_rates` VALUES ('1', '20', '15', '10');

-- ----------------------------
-- Procedure structure for account_allocation
-- ----------------------------
DROP PROCEDURE IF EXISTS `account_allocation`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `account_allocation`()
BEGIN
        /*  ---------------------------------------------------------- */ 
        /*  三级经销  客户充值分配入帐  jervis 2016.11.23 */
        DECLARE done INT DEFAULT 0;      
        DECLARE error INT DEFAULT 0;               
        
        
        DECLARE t_id INT;     
        DECLARE t_userid INT;          
        DECLARE t_money DOUBLE;        
        DECLARE t_account_userid INT;   
        
        
        DECLARE t_uid_1 INT DEFAULT 0; 
        DECLARE t_ar_1 DOUBLE DEFAULT 0.00; 
        DECLARE t_yq_1 INT DEFAULT 0; 
        DECLARE t_money_1 DOUBLE DEFAULT 0.00;
        DECLARE t_ts_1 INT DEFAULT 0; 
        
        DECLARE t_uid_2 INT DEFAULT 0; 
        DECLARE t_ar_2 DOUBLE DEFAULT 0.00; 
        DECLARE t_yq_2 INT DEFAULT 0;   
        DECLARE t_money_2 DOUBLE DEFAULT 0.00;        
        DECLARE t_money_22 DOUBLE DEFAULT 0.00; 
        DECLARE t_ts_2 INT DEFAULT 0; 
               
        DECLARE t_uid_3 INT DEFAULT 0; 
        DECLARE t_ar_3 DOUBLE DEFAULT 0.00; 
        DECLARE t_yq_3 INT DEFAULT 0;       
        DECLARE t_money_3 DOUBLE DEFAULT 0.00;       
        DECLARE t_money_33 DOUBLE DEFAULT 0.00;   
        DECLARE t_ts_3 INT DEFAULT 0; 
        
        DECLARE t_money_0 DOUBLE DEFAULT 0.00;            
        DECLARE t_money_validate DOUBLE DEFAULT 0.00;            
        
        DECLARE t_ymd VARCHAR(8); 
        DECLARE t_ts INT DEFAULT 0;         
        
        DECLARE t_money_total DOUBLE DEFAULT 0.00;      
        DECLARE t_allocation_money DOUBLE DEFAULT 0.00;              
        DECLARE t_hold_money DOUBLE DEFAULT 0.00;              
        DECLARE t_ts_total INT DEFAULT 0;      
        DECLARE t_tsp INT DEFAULT 0; 
                
        DECLARE plan CURSOR FOR SELECT id,userid,money,account_userid FROM game_db.t_users_rechange_record WHERE IFNULL(is_account,0)=0 AND IFNULL(`status`,0)=1;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;                
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN  
               SET error=1;  
        END; 
        
        SELECT DATE_FORMAT(NOW(),'%Y%m%d') INTO t_ymd;      
        START TRANSACTION;       
        -- 要处理当日数据，如果有当日数据，先删除  
        CALL account_allocation_del(t_ymd);        
/******************************************************************************/  
        OPEN plan;         
        FETCH plan INTO t_id,t_userid,t_money,t_account_userid;      
        REPEAT         
              SET t_ts=0;
              --  每一次循环都统计一下当前有效条数
              SELECT COUNT(*) INTO t_ts FROM go_rpt_account WHERE `ymd`=t_ymd;                  
              -- 一级经纪人              
              SELECT count(*),uid,allotment_ratio,yaoqing INTO t_ts_1,t_uid_1,t_ar_1,t_yq_1 FROM go_member WHERE uid=t_account_userid AND ind=1;                     
              -- 二级会员单位
              SELECT COUNT(*),uid,allotment_ratio,yaoqing INTO t_ts_2,t_uid_2,t_ar_2,t_yq_2 FROM go_member WHERE uid=t_yq_1 AND ind=2;               
              -- 三级区域代理
              SELECT COUNT(*),uid,allotment_ratio,yaoqing INTO t_ts_3,t_uid_3,t_ar_3,t_yq_3 FROM go_member WHERE uid=t_yq_2 AND ind=3;           
              if t_ts_1=1 and t_ts_2=1 and t_ts_3=1 then
                    -- 算帐  80%   50%    20%
                    SET t_money_3=t_money*t_ar_3;     -- 80元           
                    SET t_money_2=t_money*t_ar_2;     -- 50元  
                    SET t_money_1=t_money*t_ar_1;     -- 20元
                                      
                    SET  t_money_0=t_money-t_money_3;      -- 20元  (平台)
                    SET  t_money_33=t_money_3-t_money_2;   -- 30元
                    SET  t_money_22=t_money_2-t_money_1;   -- 30元 
                                      
                    IF t_money_0 <0 THEN 
                         SET t_money_0=0;
                    END IF;
                    IF t_money_33 <0 THEN 
                         SET t_money_33=0;
                    END IF;
                    IF t_money_22 <0 THEN 
                         SET t_money_22=0;
                    END IF;
                    IF t_money_1 <0 THEN 
                         SET t_money_1=0;
                    END IF;
              
                    SET t_money_validate=t_money_0+t_money_33+t_money_22+t_money_1; -- 试验算
                    IF t_money=t_money_validate THEN                 
                         --  从顶级算起 >>>三级区域代理  
                         SET t_ts=t_ts+1;              
                         INSERT INTO go_rpt_account(`ymd`,id,uid,ind,allotment_ratio,first_money,last_money,rechange_id,rechange_userid,create_time)              
                         VALUES(t_ymd,t_ts,t_uid_3,3,t_ar_3,t_money_3,t_money_33,t_id,t_userid,NOW());              
                         --  从顶级算起 >>>二级会员单位
                         SET t_ts=t_ts+1;              
                         INSERT INTO go_rpt_account(`ymd`,id,uid,ind,allotment_ratio,first_money,last_money,rechange_id,rechange_userid,create_time)              
                         VALUES(t_ymd,t_ts,t_uid_2,2,t_ar_2,t_money_2,t_money_22,t_id,t_userid,NOW());               
                         --  从顶级算起 >>>一级经纪人
                         SET t_ts=t_ts+1;                   
                         INSERT INTO go_rpt_account(`ymd`,id,uid,ind,allotment_ratio,first_money,last_money,rechange_id,rechange_userid,create_time)              
                         VALUES(t_ymd,t_ts,t_uid_1,1,t_ar_1,t_money_1,t_money_1,t_id,t_userid,NOW());
                                                 
                         -- 写入当日统计总表中
                         SET t_money_total=t_money_total+t_money;
                         SET t_allocation_money=t_allocation_money+(t_money_33+t_money_22+t_money_1);
                         SET t_hold_money=t_hold_money+t_money_0;
                         SET t_ts_total=t_ts_total+1;
                                            
                         -- 用完记录标识为已处理
                         UPDATE game_db.t_users_rechange_record SET is_account=1,account_result=CONCAT('试验算平衡通过') WHERE id=t_id;                   
                    ELSE
                         -- 用完记录标识为已处理
                         UPDATE game_db.t_users_rechange_record SET is_account=9,
                             account_result=CONCAT('试验算不平衡(',t_uid_3,';',t_ar_3,';',t_money_33,'|',t_uid_2,';',t_ar_2,';',t_money_22,'|',t_uid_1,';',t_ar_1,';',t_money_1,")")  
                         WHERE id=t_id;                                                                            
                    END IF;              
              else                
                         -- 用完记录标识为已处理
                         UPDATE game_db.t_users_rechange_record SET is_account=9,
                             account_result=CONCAT('会员查找错误(1级:',t_ts_1,'|2级:',t_ts_2,'|3级',t_ts_2,")")  
                         WHERE id=t_id;                                        
              end if;
              FETCH plan INTO t_id,t_userid,t_money,t_account_userid;     
        UNTIL done
        END REPEAT;                   
        CLOSE plan;     
        
        IF t_ts_total >0 THEN 
             -- 写入当日统计总表中
             SELECT COUNT(*) INTO t_tsp FROM go_rpt_account_total WHERE ymd=t_ymd;
             -- (t_money_total-t_allocation_money)
             IF t_tsp=0 THEN
                 INSERT INTO go_rpt_account_total(ymd,ts,total_money,allocation_money,hold_money,create_time)
                 VALUES(t_ymd,t_ts_total,t_money_total,t_allocation_money,t_hold_money,NOW());                        
             ELSE
                 UPDATE go_rpt_account_total SET ts=IFNULL(ts,0)+t_ts_total,
                                                     total_money=IFNULL(total_money,0)+t_money_total,
                                                     allocation_money=IFNULL(allocation_money,0)+t_allocation_money,
                                                     hold_money=IFNULL(hold_money,0)+t_hold_money, 
                                                     update_time=NOW() 
                 WHERE ymd=t_ymd;            
             END IF;        
        
             -- 当日结算完成后，生成日报表数据
             CALL account_allocation_day(t_ymd);        
        END IF;
        
        -- 插入运行日志
        INSERT INTO go_temp_log(`addtime`,remark,ind)VALUES(NOW(),'account_allocation',1);        
/******************************************************************************/  
        IF error=0 THEN             
            COMMIT;
        ELSE 
            ROLLBACK;  
        END IF;                 
        /*  ---------------------------------------------------------- */   
 
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for account_allocation_day
-- ----------------------------
DROP PROCEDURE IF EXISTS `account_allocation_day`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `account_allocation_day`(IN P_ymd VARCHAR(8))
BEGIN
        DECLARE done INT DEFAULT 0;      
        DECLARE error INT DEFAULT 0;               
                
        DECLARE t_rc INT;
        DECLARE t_uid INT; 
        DECLARE t_ind TINYINT;
        DECLARE t_ar DOUBLE;       
        DECLARE t_money DOUBLE;
        DECLARE t_first_money DOUBLE;
        
        DECLARE t_i INT;                 
        DECLARE t_j INT;          
                
        DECLARE plan CURSOR FOR SELECT COUNT(*),uid,ind,allotment_ratio,SUM(last_money),SUM(first_money) FROM go_rpt_account WHERE `status`=0 GROUP BY ymd,uid,ind,allotment_ratio; 
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;                
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN  
               SET error=1;  
        END;         
        
            
        START TRANSACTION;       
/******************************************************************************/  
             SET t_i=0;
             SET t_j=0;        
            
             OPEN plan;         
             FETCH plan INTO t_rc,t_uid,t_ind,t_ar,t_money,t_first_money;      
             REPEAT         
                  SET t_i=t_i+1;
                  -- 插入日报表 (已审核状态)
                  INSERT INTO go_rpt_account_day(ymd,id,`status`,ts,uid,ind,allotment_ratio,money,create_time)      
                  VALUES(P_ymd,t_i,1,t_rc,t_uid,t_ind,t_ar,t_money,NOW());
                   
                  -- 变更用户帐户金额
                  UPDATE go_member SET total_money=IFNULL(total_money,0)+t_money,money=IFNULL(money,0)+t_money WHERE uid=t_uid;
                  
                  -- 写入帐户日志   type:  1:增加帐户    -1减少帐户
                  INSERT INTO go_member_account (uid,`type`,pay,content,money,create_time)
                  VALUES(t_uid,1,'帐户',CONCAT('用户分成金额(',t_ind,';',t_ar,")"),t_money,UNIX_TIMESTAMP(NOW()));
                  
                  -- 分支报表，平台只对区域代理和会员单位分帐
                  IF t_ind=3 THEN 
                      SET t_j=t_j+1;
                      INSERT INTO go_rpt_account_day_1(ymd,id,ts,uid,ind,allotment_ratio,money,create_time)      
                      VALUES(P_ymd,t_j,t_rc,t_uid,t_ind,t_ar,t_money,NOW());                                    
                  END IF;
                  
                  IF t_ind=2 THEN 
                      SET t_j=t_j+1;
                      INSERT INTO go_rpt_account_day_1(ymd,id,ts,uid,ind,allotment_ratio,money,create_time)      
                      VALUES(P_ymd,t_j,t_rc,t_uid,t_ind,t_ar,t_first_money,NOW());                                                      
                  END IF;
                  
                  
                  FETCH plan INTO t_rc,t_uid,t_ind,t_ar,t_money,t_first_money;     
             UNTIL done
             END REPEAT;                   
             CLOSE plan;
             -- 更改源表状态
             UPDATE go_rpt_account SET `status`=1,day_ymd=P_ymd WHERE `status`=0;
             
             -- 写入类型日报表
             INSERT INTO go_rpt_account_day_ind(ymd,ind,ts,money,create_time)
             SELECT ymd,ind,COUNT(*),SUM(money),NOW() FROM go_rpt_account_day WHERE `status`=1 AND ymd=P_ymd GROUP BY ind;                     
/******************************************************************************/  
        IF error=0 THEN 
            COMMIT;
        ELSE 
            ROLLBACK;  
        END IF;       
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for account_allocation_del
-- ----------------------------
DROP PROCEDURE IF EXISTS `account_allocation_del`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `account_allocation_del`(IN P_ymd VARCHAR(8))
BEGIN
        DECLARE error INT DEFAULT 0;  
        
        DECLARE t_ts INT; 
        
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN  
               SET error=1;  
        END;                    
            
        START TRANSACTION;       
/******************************************************************************/  
        SET t_ts=0;        
        SELECT COUNT(*) INTO t_ts FROM go_rpt_account WHERE `ymd`=P_ymd;           
        IF t_ts>0 THEN
            -- 先恢复原数据
            UPDATE game_db.t_users_rechange_record SET is_account=0  
            WHERE is_account IN (1,9) AND id IN (SELECT rechange_id FROM go_rpt_account WHERE `ymd`=P_ymd);
            
            -- 再删除已生成的数据
            DELETE FROM go_rpt_account WHERE `ymd`=P_ymd;            
            
            -- 再删除该日报表
            DELETE FROM go_rpt_account_day WHERE `ymd`=P_ymd;
            
            -- 再删除该日报表
            DELETE FROM go_rpt_account_day_1 WHERE `ymd`=P_ymd;            
            
            -- 删除该日分类报表
            DELETE FROM go_rpt_account_day_ind WHERE `ymd`=P_ymd;             
            
            -- 日总报表处理
            DELETE FROM go_rpt_account_total WHERE `ymd`=P_ymd;                 
        END IF;          
/******************************************************************************/  
        IF error=0 THEN 
            COMMIT;
        ELSE 
            ROLLBACK;  
        END IF;        
 
eND
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for member_rename_process
-- ----------------------------
DROP PROCEDURE IF EXISTS `member_rename_process`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `member_rename_process`()
BEGIN
   /*  ---------------------------------------------------------- */ 
        /*  改名按编码规则  jervis 2016.11.23 */
        DECLARE done INT DEFAULT 0;      
        DECLARE error INT DEFAULT 0;               
                
        DECLARE t_uid INT;                      
        DECLARE t_ind TINYINT;        
        DECLARE t_yaoqing INT;      
        
        DECLARE t_max INT;         
        DECLARE t_len INT;
        DECLARE t_nid CHAR(20);
        DECLARE t_yqid CHAR(20);
        DECLARE t_username CHAR(20);
                        
        DECLARE plan CURSOR FOR SELECT uid,ind,yaoqing FROM go_member WHERE ind IN (1,2,3) ORDER BY ind DESC;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;                
        DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN  
               SET error=1;  
        END; 
        -- 编码规则
        -- 区域  会员     经纪人
        -- 000  00000    0000000   =3+5+7=15
        
        -- 删除临时表        
        DROP TABLE IF EXISTS t_tmp;         
        
        -- 创建临时表  
        /*     
        CREATE TABLE `t_tmp` (
            `uid` INT(11) NOT NULL,
            `ind` tinyint(2) default NULL,
            `nid` VARCHAR(20) DEFAULT NULL,
            `username` VARCHAR(20) DEFAULT NULL,
            `yaoqing` int(11) not null,
             PRIMARY KEY (`uid`)
       ) ENGINE=INNODB DEFAULT CHARSET=utf8; 
       */              
/******************************************************************************/  
        OPEN plan;         
        FETCH plan INTO t_uid,t_ind,t_yaoqing;      
        REPEAT         
              SET t_max=0;
              -- SELECT MAX(CASE WHEN ISNULL(username)=1 THEN 0 WHEN TRIM(username)='' THEN 0 WHEN (username REGEXP '^[0-9]*$')=1 THEN username ELSE 0 END) into t_max 
              -- FROM go_member WHERE ind=t_ind;          
              
              IF t_ind=3 THEN    
                 SELECT IFNULL(MAX(CASE WHEN ISNULL(nid)=1 THEN 0 WHEN TRIM(nid)='' THEN 0 WHEN (nid REGEXP '^[0-9]*$')=1 THEN nid ELSE 0 END),0) INTO t_max 
                 FROM go_member WHERE ind=t_ind;
              
                 SET t_len=CHAR_LENGTH(t_max+1);                             
                 IF (3-t_len)>=0 THEN  -- 如果值没超出的话
                      SET t_nid=CONCAT(REPEAT('0',3-t_len),(t_max+1));
                      SET t_username=t_nid;                     
                      -- insert into t_tmp (uid,ind,nid,username,yaoqing)values(t_uid,t_ind,t_nid,t_username,t_yaoqing);                      
                      -- SELECT 3,t_ind,t_len,t_nid,t_yqid,t_yaoqing,t_uid;                                  
                      UPDATE go_member SET go_member.username=t_username,go_member.nid=t_nid WHERE ind=3 AND uid=t_uid;
                 END IF;
              END IF;            
              
              
              IF t_ind=2 THEN
                 SELECT username INTO t_yqid FROM go_member WHERE uid=t_yaoqing;                      
                 SELECT IFNULL(MAX(nid),0) INTO t_max FROM go_member WHERE  yaoqing=t_yaoqing;   
                                                   
                 SET t_len=CHAR_LENGTH(t_max+1);                   
                 IF (5-t_len)>=0 THEN  -- 如果值没超出的话                                         
                      SET t_nid=CONCAT(REPEAT('0',5-t_len),(t_max+1));
                      SET t_username=CONCAT(t_yqid,t_nid);
                      -- INSERT INTO t_tmp (uid,ind,nid,username,yaoqing)VALUES(t_uid,t_ind,t_nid,t_username,t_yaoqing);
                      -- SELECT 2,t_ind,t_len,t_nid,t_yqid,t_yaoqing,t_uid;                                  
                      UPDATE go_member SET go_member.username=t_username,go_member.nid=t_nid WHERE ind=2 AND uid=t_uid;
                 END IF;
              END IF;         
              
              IF t_ind=1 THEN
                 SELECT username INTO t_yqid FROM go_member WHERE uid=t_yaoqing;                     
                 SELECT IFNULL(MAX(nid),0) INTO t_max FROM go_member WHERE  yaoqing=t_yaoqing;    
                 SET t_len=CHAR_LENGTH(t_max+1);                 
                 IF (7-t_len)>=0 THEN  -- 如果值没超出的话                                         
                      SET t_nid=CONCAT(REPEAT('0',7-t_len),(t_max+1));
                      SET t_username=CONCAT(t_yqid,t_nid);                 
                      -- INSERT INTO t_tmp (uid,ind,nid,username,yaoqing)VALUES(t_uid,t_ind,t_nid,t_username,t_yaoqing);
                      -- SELECT 1,t_ind,t_len,t_nid,t_yqid,t_uid;                                  
                      UPDATE go_member SET go_member.username=t_username,go_member.nid=t_nid WHERE ind=1 AND uid=t_uid;
                 END IF;
              END IF;    
              
              FETCH plan INTO t_uid,t_ind,t_yaoqing;     
        UNTIL done
        END REPEAT;                   
        CLOSE plan;     
        
        -- 插入临时表数据到表中
        -- UPDATE go_member INNER JOIN t_tmp ON go_member.uid=t_tmp.uid SET go_member.username=t_tmp.username,go_member.nid=t_tmp.nid;                           
        /*  ---------------------------------------------------------- */               
END
;;
DELIMITER ;

-- ----------------------------
-- Procedure structure for member_rename_process_update
-- ----------------------------
DROP PROCEDURE IF EXISTS `member_rename_process_update`;
DELIMITER ;;
CREATE DEFINER=`root`@`localhost` PROCEDURE `member_rename_process_update`(in P_uid int)
BEGIN
  
   /*  ---------------------------------------------------------- */ 
        /*  改名按编码规则  jervis 2016.11.23 */
        DECLARE t_uid INT;                      
        DECLARE t_ind TINYINT;        
        DECLARE t_yaoqing INT;      
        
        DECLARE t_max INT;         
        DECLARE t_len INT;
        DECLARE t_nid CHAR(20);
        DECLARE t_yqid CHAR(20);
        DECLARE t_username CHAR(20);
                        
        -- 编码规则
        -- 区域  会员     经纪人
        -- 000  00000    0000000   =3+5+7=15        
              
/******************************************************************************/  
        -- 取基础数据
        SELECT uid,ind,yaoqing into t_uid,t_ind,t_yaoqing FROM go_member WHERE uid=P_uid;
        
        -- 得到现最大值
        SET t_max=0;        
        SELECT IFNULL(MAX(CASE WHEN ISNULL(nid)=1 THEN 0 WHEN TRIM(nid)='' THEN 0 WHEN (nid REGEXP '^[0-9]*$')=1 THEN nid ELSE 0 END),0) INTO t_max  
        FROM go_member WHERE ind=t_ind;
        
        SET t_len=CHAR_LENGTH(t_max+1); 
        -- 给不同的用户类型以不同的用户名
        IF t_ind=3 THEN                 
                 IF (3-t_len)>=0 THEN  -- 如果值没超出的话
                      SET t_nid=CONCAT(REPEAT('0',3-t_len),(t_max+1));
                      SET t_username=t_nid;
                      UPDATE go_member SET username=t_username,nid=t_nid where uid=P_uid;                                              
                 END IF;
        END IF;                          
              
        IF t_ind=2 THEN
                 IF (5-t_len)>=0 THEN  -- 如果值没超出的话                                         
                      SELECT username INTO t_yqid FROM go_member WHERE uid=t_yaoqing;
                      SELECT IFNULL(MAX(nid),0) INTO t_max FROM go_member WHERE  yaoqing=t_yaoqing; 
                     
                      SET t_nid=CONCAT(REPEAT('0',5-t_len),(t_max+1));
                      SET t_username=CONCAT(t_yqid,t_nid);
                      UPDATE go_member SET username=t_username,nid=t_nid WHERE uid=P_uid;                                                                                          
                 END IF;
        END IF;         
              
        IF t_ind=1 THEN
                 IF (7-t_len)>=0 THEN  -- 如果值没超出的话                                         
                      SELECT username INTO t_yqid FROM go_member WHERE uid=t_yaoqing;   
                      SELECT IFNULL(MAX(nid),0) INTO t_max FROM go_member WHERE  yaoqing=t_yaoqing;                   
                      
                      SET t_nid=CONCAT(REPEAT('0',7-t_len),(t_max+1));
                      SET t_username=CONCAT(t_yqid,t_nid);
                      
                      UPDATE go_member SET username=t_username,nid=t_nid WHERE uid=P_uid;         
                 END IF;
        END IF;                                         
        /*  ---------------------------------------------------------- */           
    END
;;
DELIMITER ;

-- ----------------------------
-- Event structure for run_onehour_ontime
-- ----------------------------
DROP EVENT IF EXISTS `run_onehour_ontime`;
DELIMITER ;;
CREATE DEFINER=`root`@`127.0.0.1` EVENT `run_onehour_ontime` ON SCHEDULE EVERY 1 DAY STARTS '2017-03-14 03:00:00' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
	     /* 每天03:00运行金额分配 */
            CALL account_allocation();
	END
;;
DELIMITER ;
SET FOREIGN_KEY_CHECKS=1;
