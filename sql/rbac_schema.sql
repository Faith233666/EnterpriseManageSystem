-- ============================================================
-- Enterprise Manage System - RBAC 完整建表脚本 (MySQL 8)
-- 字符集：utf8mb4 | 引擎：InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS `enterprise_manage`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `enterprise_manage`;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 1. 用户表 sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id`            BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
  `username`      VARCHAR(64)      NOT NULL COMMENT '登录账号',
  `password`      VARCHAR(128)     NOT NULL COMMENT '密码(bcrypt)',
  `nickname`      VARCHAR(64)      NOT NULL DEFAULT '' COMMENT '昵称',
  `email`         VARCHAR(128)     DEFAULT NULL COMMENT '邮箱',
  `phone`         VARCHAR(20)      DEFAULT NULL COMMENT '手机号',
  `avatar`        VARCHAR(255)     DEFAULT NULL COMMENT '头像 URL',
  `gender`        TINYINT          NOT NULL DEFAULT 0 COMMENT '性别: 0未知 1男 2女',
  `status`        TINYINT          NOT NULL DEFAULT 1 COMMENT '状态: 0禁用 1启用',
  `remark`        VARCHAR(500)     DEFAULT NULL COMMENT '备注',
  `last_login_at` DATETIME         DEFAULT NULL COMMENT '最后登录时间',
  `created_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`    DATETIME         DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统用户';

-- ----------------------------
-- 2. 角色表 sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
  `role_name`   VARCHAR(64)      NOT NULL COMMENT '角色名称',
  `role_key`    VARCHAR(64)      NOT NULL COMMENT '角色标识(如 admin)',
  `sort`        INT              NOT NULL DEFAULT 0 COMMENT '排序',
  `status`      TINYINT          NOT NULL DEFAULT 1 COMMENT '状态: 0禁用 1启用',
  `remark`      VARCHAR(500)     DEFAULT NULL COMMENT '备注',
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`  DATETIME         DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_role_key` (`role_key`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统角色';

-- ----------------------------
-- 3. 菜单/权限表 sys_menu
-- type: 1=目录 2=菜单 3=按钮
-- perms: 按钮权限标识，如 sys:user:add
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu` (
  `id`          BIGINT UNSIGNED  NOT NULL AUTO_INCREMENT COMMENT '主键',
  `parent_id`   BIGINT UNSIGNED  NOT NULL DEFAULT 0 COMMENT '父菜单ID，0为顶级',
  `menu_name`   VARCHAR(64)      NOT NULL COMMENT '菜单名称',
  `menu_type`   TINYINT          NOT NULL COMMENT '类型: 1目录 2菜单 3按钮',
  `path`        VARCHAR(200)     DEFAULT NULL COMMENT '路由 path（目录/菜单）',
  `component`   VARCHAR(255)     DEFAULT NULL COMMENT '前端组件路径，如 system/user/index',
  `redirect`    VARCHAR(200)     DEFAULT NULL COMMENT '重定向地址',
  `perms`       VARCHAR(100)     DEFAULT NULL COMMENT '权限标识，如 sys:user:add',
  `icon`        VARCHAR(64)      DEFAULT NULL COMMENT '图标',
  `sort`        INT              NOT NULL DEFAULT 0 COMMENT '排序(越小越靠前)',
  `visible`     TINYINT          NOT NULL DEFAULT 1 COMMENT '是否显示: 0隐藏 1显示',
  `status`      TINYINT          NOT NULL DEFAULT 1 COMMENT '状态: 0禁用 1启用',
  `is_frame`    TINYINT          NOT NULL DEFAULT 0 COMMENT '是否外链: 0否 1是',
  `is_cache`    TINYINT          NOT NULL DEFAULT 0 COMMENT '是否缓存: 0否 1是',
  `created_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME         NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_parent_id` (`parent_id`),
  KEY `idx_perms` (`perms`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='菜单权限';

-- ----------------------------
-- 4. 用户-角色关联表
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role` (
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  PRIMARY KEY (`user_id`, `role_id`),
  KEY `idx_role_id` (`role_id`),
  CONSTRAINT `fk_ur_user` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ur_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户角色关联';

-- ----------------------------
-- 5. 角色-菜单关联表
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu` (
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT '角色ID',
  `menu_id` BIGINT UNSIGNED NOT NULL COMMENT '菜单ID',
  PRIMARY KEY (`role_id`, `menu_id`),
  KEY `idx_menu_id` (`menu_id`),
  CONSTRAINT `fk_rm_role` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_rm_menu` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色菜单关联';

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 初始化数据
-- 密码 admin123 的 bcrypt hash ($2b$10$...)
-- ============================================================

-- 管理员用户 (password: admin123)
INSERT INTO `sys_user` (`id`, `username`, `password`, `nickname`, `email`, `status`) VALUES
(1, 'admin', '$2b$10$m46OOJri1CYP5FU0YJ/SHuNTPk90sedT2MOZ8XltAy7AoF8lBLiJS', '系统管理员', 'admin@example.com', 1);

-- 角色
INSERT INTO `sys_role` (`id`, `role_name`, `role_key`, `sort`, `status`, `remark`) VALUES
(1, '超级管理员', 'admin', 1, 1, '拥有全部权限'),
(2, '普通用户', 'user', 2, 1, '基础权限');

-- 用户-角色
INSERT INTO `sys_user_role` (`user_id`, `role_id`) VALUES (1, 1);

-- 菜单树
-- 一级：系统管理
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(1, 0, '系统管理', 1, '/system', 'Layout', '/system/user', NULL, 'Setting', 1, 1, 1),
(2, 1, '用户管理', 2, 'user', 'system/user/index', NULL, 'sys:user:list', 'User', 1, 1, 1),
(3, 1, '角色管理', 2, 'role', 'system/role/index', NULL, 'sys:role:list', 'UserFilled', 2, 1, 1),
(4, 1, '菜单管理', 2, 'menu', 'system/menu/index', NULL, 'sys:menu:list', 'Menu', 3, 1, 1);

-- 用户管理按钮
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(21, 2, '用户查询', 3, NULL, NULL, 'sys:user:query',  NULL, 1, 1, 1),
(22, 2, '用户新增', 3, NULL, NULL, 'sys:user:add',    NULL, 2, 1, 1),
(23, 2, '用户修改', 3, NULL, NULL, 'sys:user:edit',   NULL, 3, 1, 1),
(24, 2, '用户删除', 3, NULL, NULL, 'sys:user:remove', NULL, 4, 1, 1),
(25, 2, '用户导出', 3, NULL, NULL, 'sys:user:export', NULL, 5, 1, 1),
(26, 2, '状态切换', 3, NULL, NULL, 'sys:user:status', NULL, 6, 1, 1);

-- 角色管理按钮
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(31, 3, '角色查询', 3, NULL, NULL, 'sys:role:query',  NULL, 1, 1, 1),
(32, 3, '角色新增', 3, NULL, NULL, 'sys:role:add',    NULL, 2, 1, 1),
(33, 3, '角色修改', 3, NULL, NULL, 'sys:role:edit',   NULL, 3, 1, 1),
(34, 3, '角色删除', 3, NULL, NULL, 'sys:role:remove', NULL, 4, 1, 1);

-- 菜单管理按钮
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(41, 4, '菜单查询', 3, NULL, NULL, 'sys:menu:query',  NULL, 1, 1, 1),
(42, 4, '菜单新增', 3, NULL, NULL, 'sys:menu:add',    NULL, 2, 1, 1),
(43, 4, '菜单修改', 3, NULL, NULL, 'sys:menu:edit',   NULL, 3, 1, 1),
(44, 4, '菜单删除', 3, NULL, NULL, 'sys:menu:remove', NULL, 4, 1, 1);

-- 会员中心
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(10, 0, '会员中心', 1, '/member', 'Layout', '/member/archive', NULL, 'Postcard', 2, 1, 1),
(11, 10, '会员档案', 2, 'archive', 'member/index', NULL, 'member:list', 'User', 1, 1, 1);

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`) VALUES
(111, 11, '会员查询', 3, NULL, NULL, 'member:query',  NULL, 1, 1, 1),
(112, 11, '会员新增', 3, NULL, NULL, 'member:add',    NULL, 2, 1, 1),
(113, 11, '会员修改', 3, NULL, NULL, 'member:edit',   NULL, 3, 1, 1),
(114, 11, '会员删除', 3, NULL, NULL, 'member:remove', NULL, 4, 1, 1);

-- 超级管理员绑定全部菜单
INSERT INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `id` FROM `sys_menu`;
