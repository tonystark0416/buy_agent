-- buy_agent 正式数据库结构（库: cps，2026-11-15 从 mike 库迁移并以此为准）
-- 2026-11-15 补充：adp_user 新增 openid 列（微信登录绑定，代码 models 依赖，mike 库时代即缺失）
-- 与代码 models 层实际使用的表一一对应（关闭问题清单 B-6）
-- 注意: mike 库中的同名表已停止写入，仅作迁移前备份保留

CREATE TABLE `adp_user` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `biz_code` varchar(11) DEFAULT NULL,
  `username` varchar(20) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `phone` varchar(20) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `openid` varchar(128) DEFAULT NULL COMMENT '微信openid（小程序登录绑定）',
  PRIMARY KEY (`id`),
  KEY `idx_openid` (`openid`)
) ENGINE=InnoDB AUTO_INCREMENT=241 DEFAULT CHARSET=utf8 COMMENT='用户表';

CREATE TABLE `adp_user_auth` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `user_id` int(10) NOT NULL COMMENT '关联 adp_user.id',
  `biz_code` varchar(11) NOT NULL DEFAULT 'pp' COMMENT '业务编码：pp=租车小程序',
  `app_id` varchar(32) DEFAULT NULL COMMENT '小程序appid（预留）',
  `openid` varchar(50) NOT NULL COMMENT '该小程序下的openid',
  `unionid` varchar(50) DEFAULT NULL COMMENT '微信unionid（跨小程序识别同一用户，待开放平台关联后启用）',
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_biz_openid` (`biz_code`,`openid`),
  KEY `idx_user` (`user_id`),
  KEY `idx_unionid` (`unionid`)
) ENGINE=InnoDB AUTO_INCREMENT=80 DEFAULT CHARSET=utf8mb4 COMMENT='用户授权表（一个小程序一行）';

CREATE TABLE `adp_order` (
  `id` int(10) NOT NULL AUTO_INCREMENT COMMENT '订单id',
  `order_sn` varchar(50) NOT NULL COMMENT '订单号',
  `uid` varchar(100) DEFAULT NULL COMMENT '用户唯一id',
  `status` int(10) DEFAULT NULL COMMENT '订单状态，0失效；1待定；2已完成',
  `platform` varchar(10) DEFAULT NULL COMMENT '所属平台',
  `order_amount` decimal(10,2) DEFAULT NULL COMMENT '订单支付金额',
  `commission` decimal(10,2) DEFAULT NULL COMMENT '订单佣金',
  `goods_id` varchar(100) DEFAULT NULL COMMENT '第三方商品id',
  `goods_name` varchar(100) DEFAULT NULL COMMENT '商品名称',
  `goods_img_url` varchar(200) DEFAULT NULL COMMENT '商品图片',
  `create_time` datetime DEFAULT NULL,
  `update_time` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=57 DEFAULT CHARSET=utf8 COMMENT='CPS订单表';

CREATE TABLE `adp_banner` (
  `id` int(5) NOT NULL AUTO_INCREMENT COMMENT '主键id',
  `type` int(10) NOT NULL COMMENT '1，首页banner； 2，吃喝玩乐banner',
  `title` varchar(50) NOT NULL,
  `sub_text` varchar(200) DEFAULT NULL,
  `banner_img_url` varchar(100) DEFAULT NULL COMMENT 'banner图片url地址',
  `sort` int(10) DEFAULT NULL,
  `extra_id` varchar(10) DEFAULT NULL COMMENT '第三方素材id',
  `extra_url` varchar(255) DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8;

CREATE TABLE `adp_goods` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `goods_name` varchar(200) NOT NULL,
  `goods_image_url` varchar(200) DEFAULT NULL,
  `market_price` decimal(10,2) DEFAULT NULL,
  `sale_price` decimal(10,2) DEFAULT NULL,
  `platform` varchar(10) DEFAULT NULL,
  `goods_platform_id` varchar(50) DEFAULT NULL,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8;

CREATE TABLE `adp_admin_user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(64) NOT NULL COMMENT '登录名',
  `password_hash` varchar(100) NOT NULL COMMENT 'bcrypt 哈希',
  `nickname` varchar(64) DEFAULT NULL COMMENT '显示名',
  `role` varchar(20) NOT NULL DEFAULT 'operator' COMMENT 'admin/operator/readonly',
  `status` tinyint(4) NOT NULL DEFAULT '1' COMMENT '1=启用 0=禁用',
  `last_login_at` datetime DEFAULT NULL,
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员表';

