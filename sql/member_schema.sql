-- ============================================================
-- 会员档案管理：建表 + 菜单权限（可重复执行）
-- mysql -u root -p < sql/member_schema.sql
-- ============================================================

USE `enterprise_manage`;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `biz_member` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '会员ID',
  `name`        VARCHAR(64)      NOT NULL COMMENT '姓名',
  `phone`       VARCHAR(20)      NOT NULL COMMENT '手机号',
  `level`       TINYINT          NOT NULL DEFAULT 1 COMMENT '等级: 1普通 2黄金 3钻石',
  `points`      INT              NOT NULL DEFAULT 0 COMMENT '积分',
  `balance`     DECIMAL(12,2)    NOT NULL DEFAULT 0.00 COMMENT '余额',
  `status`      TINYINT          NOT NULL DEFAULT 1 COMMENT '状态: 0禁用 1启用',
  `remark`      VARCHAR(500)     DEFAULT NULL COMMENT '备注',
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME         DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_name` (`name`),
  KEY `idx_level` (`level`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员档案';

-- 会员中心目录 + 会员档案菜单 + 按钮权限
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(10, 0, '会员中心', 1, '/member', 'Layout', '/member/archive', NULL, 'Postcard', 2, 1, 1),
(11, 10, '会员档案', 2, 'archive', 'member/index', NULL, 'member:list', 'User', 1, 1, 1)
ON DUPLICATE KEY UPDATE
  `menu_name` = VALUES(`menu_name`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `redirect` = VALUES(`redirect`),
  `perms` = VALUES(`perms`),
  `icon` = VALUES(`icon`);

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(111, 11, '会员查询', 3, NULL, NULL, 'member:query',  NULL, 1, 1, 1),
(112, 11, '会员新增', 3, NULL, NULL, 'member:add',    NULL, 2, 1, 1),
(113, 11, '会员修改', 3, NULL, NULL, 'member:edit',   NULL, 3, 1, 1),
(114, 11, '会员删除', 3, NULL, NULL, 'member:remove', NULL, 4, 1, 1)
ON DUPLICATE KEY UPDATE
  `menu_name` = VALUES(`menu_name`),
  `perms` = VALUES(`perms`);

-- 超级管理员绑定新增菜单
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `id` FROM `sys_menu` WHERE `id` IN (10, 11, 111, 112, 113, 114);

-- 演示数据（手机号唯一，已存在则跳过）
INSERT IGNORE INTO `biz_member` (`id`, `name`, `phone`, `level`, `points`, `balance`, `status`, `remark`) VALUES
(1, '张三', '13800001001', 1, 120,  88.50,  1, '普通会员'),
(2, '李四', '13800001002', 2, 860,  320.00, 1, '黄金会员'),
(3, '王五', '13800001003', 3, 5200, 1280.00, 1, '钻石会员'),
(4, '赵六', '13800001004', 1, 0,    0.00,   0, '已禁用');
