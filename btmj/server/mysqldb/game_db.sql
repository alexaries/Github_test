/*
 Navicat Premium Data Transfer

 Source Server         : realease_mahjong
 Source Server Type    : MySQL
 Source Server Version : 50173
 Source Host           : 116.62.214.79
 Source Database       : game_db

 Target Server Type    : MySQL
 Target Server Version : 50173
 File Encoding         : utf-8

 Date: 05/02/2017 15:01:55 PM
*/

SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
--  Table structure for `t_accounts`
-- ----------------------------
DROP TABLE IF EXISTS `t_accounts`;
CREATE TABLE `t_accounts` (
  `account` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_charge_log`
-- ----------------------------
DROP TABLE IF EXISTS `t_charge_log`;
CREATE TABLE `t_charge_log` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '??id',
  `orderno` char(20) NOT NULL COMMENT '???',
  `userid` int(11) NOT NULL DEFAULT '0' COMMENT '??id',
  `gems_num` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '????',
  `cost_money` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '????????',
  `charge_type` char(127) NOT NULL DEFAULT '0' COMMENT '0???????1????????????',
  `time` int(20) NOT NULL DEFAULT '0' COMMENT '????',
  `goldcoin_exchange_rate` double(12,0) NOT NULL DEFAULT '1' COMMENT '??????',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_games`
-- ----------------------------
DROP TABLE IF EXISTS `t_games`;
CREATE TABLE `t_games` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_games_archive`
-- ----------------------------
DROP TABLE IF EXISTS `t_games_archive`;
CREATE TABLE `t_games_archive` (
  `room_uuid` char(20) NOT NULL,
  `game_index` smallint(6) NOT NULL,
  `base_info` varchar(1024) NOT NULL,
  `create_time` int(11) NOT NULL,
  `snapshots` char(255) DEFAULT NULL,
  `action_records` varchar(2048) DEFAULT NULL,
  `result` char(255) DEFAULT NULL,
  PRIMARY KEY (`room_uuid`,`game_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_guests`
-- ----------------------------
DROP TABLE IF EXISTS `t_guests`;
CREATE TABLE `t_guests` (
  `guest_account` varchar(255) NOT NULL,
  PRIMARY KEY (`guest_account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_message`
-- ----------------------------
DROP TABLE IF EXISTS `t_message`;
CREATE TABLE `t_message` (
  `type` varchar(32) NOT NULL,
  `msg` varchar(1024) NOT NULL,
  `version` varchar(32) NOT NULL,
  PRIMARY KEY (`type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_rooms`
-- ----------------------------
DROP TABLE IF EXISTS `t_rooms`;
CREATE TABLE `t_rooms` (
  `uuid` char(20) NOT NULL,
  `id` char(8) NOT NULL,
  `base_info` varchar(256) NOT NULL DEFAULT '0',
  `create_time` int(11) NOT NULL,
  `num_of_turns` int(11) NOT NULL DEFAULT '0',
  `next_button` int(11) NOT NULL,
  `user_id0` int(11) NOT NULL DEFAULT '0',
  `user_icon0` varchar(128) NOT NULL,
  `user_name0` varchar(32) NOT NULL,
  `user_score0` int(11) NOT NULL DEFAULT '0',
  `user_id1` int(11) NOT NULL DEFAULT '0',
  `user_icon1` varchar(128) NOT NULL,
  `user_name1` varchar(32) NOT NULL,
  `user_score1` int(11) NOT NULL DEFAULT '0',
  `user_id2` int(11) NOT NULL DEFAULT '0',
  `user_icon2` varchar(128) NOT NULL,
  `user_name2` varchar(32) NOT NULL,
  `user_score2` int(11) NOT NULL DEFAULT '0',
  `user_id3` int(11) NOT NULL DEFAULT '0',
  `user_icon3` varchar(128) NOT NULL,
  `user_name3` varchar(32) NOT NULL,
  `user_score3` int(11) NOT NULL DEFAULT '0',
  `ip` varchar(16) DEFAULT NULL,
  `port` int(11) DEFAULT '0',
  PRIMARY KEY (`uuid`),
  UNIQUE KEY `uuid` (`uuid`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_sell_log`
-- ----------------------------
DROP TABLE IF EXISTS `t_sell_log`;
CREATE TABLE `t_sell_log` (
  `id` int(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '??id',
  `userid` int(11) NOT NULL DEFAULT '0' COMMENT '??id',
  `gems_num` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '????',
  `seller_id` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '?????id',
  `charge_type` tinyint(2) unsigned NOT NULL DEFAULT '1' COMMENT '??:1:?? 2:???',
  `addtime` int(20) NOT NULL DEFAULT '0' COMMENT '????',
  `batchno` char(20) NOT NULL DEFAULT '0' COMMENT '???',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_session_pool`
-- ----------------------------
DROP TABLE IF EXISTS `t_session_pool`;
CREATE TABLE `t_session_pool` (
  `session_id` varchar(50) NOT NULL,
  `content` text,
  PRIMARY KEY (`session_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_users`
-- ----------------------------
DROP TABLE IF EXISTS `t_users`;
CREATE TABLE `t_users` (
  `userid` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '??ID',
  `account` varchar(64) NOT NULL DEFAULT '' COMMENT '??',
  `name` varchar(32) DEFAULT NULL COMMENT '????',
  `sex` int(1) DEFAULT NULL COMMENT '??',
  `headimg` varchar(256) DEFAULT NULL COMMENT '??',
  `lv` smallint(6) DEFAULT '1' COMMENT '????',
  `exp` int(11) DEFAULT '0' COMMENT '????',
  `coins` int(11) DEFAULT '0' COMMENT '????',
  `gems` int(11) unsigned NOT NULL DEFAULT '0' COMMENT '????',
  `roomid` varchar(8) DEFAULT NULL COMMENT '?????',
  `history` varchar(4096) NOT NULL COMMENT '??',
  `yaoqing` int(11) DEFAULT NULL COMMENT '???',
  `time` int(10) DEFAULT NULL COMMENT '????',
  `shareroomid` varchar(8) DEFAULT '',
  PRIMARY KEY (`userid`),
  UNIQUE KEY `account` (`account`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8;

-- ----------------------------
--  Table structure for `t_users_rechange_record`
-- ----------------------------
DROP TABLE IF EXISTS `t_users_rechange_record`;
CREATE TABLE `t_users_rechange_record` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '??',
  `userid` int(11) unsigned NOT NULL COMMENT '??',
  `orderno` char(20) NOT NULL COMMENT '???',
  `money` decimal(10,2) unsigned NOT NULL COMMENT '????',
  `pay_type` char(10) NOT NULL COMMENT '????',
  `status` tinyint(2) NOT NULL COMMENT '??(0??  1?????)',
  `time` int(10) NOT NULL COMMENT '????',
  `result` text COMMENT '???',
  `notify_result` text COMMENT '?????',
  `is_account` tinyint(2) DEFAULT '0' COMMENT '?????0???  1????  9:???',
  `account_userid` int(11) unsigned DEFAULT NULL COMMENT '???????????',
  `account_result` text COMMENT '?????',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=DYNAMIC COMMENT='?????';

SET FOREIGN_KEY_CHECKS = 1;
