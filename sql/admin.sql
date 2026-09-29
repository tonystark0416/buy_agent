-- ============================================================
-- 后台管理模块（/api/admin）相关表
-- 执行方式：mysql -u<user> -p <database> < sql/admin.sql
-- 幂等说明：使用 IF NOT EXISTS，可重复执行
-- ============================================================

-- 后台管理员账号表
CREATE TABLE IF NOT EXISTS adp_admin_user (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(64)  NOT NULL COMMENT '登录名',
  password_hash VARCHAR(100) NOT NULL COMMENT 'bcrypt 哈希',
  nickname      VARCHAR(64)           DEFAULT NULL COMMENT '显示名',
  role          VARCHAR(20)  NOT NULL DEFAULT 'operator' COMMENT 'admin/operator/readonly',
  status        TINYINT      NOT NULL DEFAULT 1 COMMENT '1=启用 0=禁用',
  last_login_at DATETIME              DEFAULT NULL,
  create_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  update_time   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='后台管理员表';

-- 种子管理员：username=admin / password=admin123（首次登录后请尽快修改）
INSERT IGNORE INTO adp_admin_user (username, password_hash, nickname, role, status)
VALUES ('admin', '$2b$10$KuczGThnWMzL4P3kXxJt..ZsUcfH3FCLQOGz8sYUoZL6fx359j9O6', '超级管理员', 'admin', 1);

-- ============================================================
-- 业务表查询索引（后台多条件查询性能保障）
-- 如索引已存在会报错，可按需单独执行
-- ============================================================
-- ALTER TABLE adp_order ADD INDEX idx_uid (uid);
-- ALTER TABLE adp_order ADD INDEX idx_platform (platform);
-- ALTER TABLE adp_order ADD INDEX idx_create_time (create_time);
-- ALTER TABLE adp_order ADD UNIQUE INDEX uk_order_sn (order_sn);
