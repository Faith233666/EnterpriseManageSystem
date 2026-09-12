-- 报表中心菜单及其按钮权限
USE `enterprise_manage`;
SET NAMES utf8mb4;

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(30, 0, '报表中心', 1, '/report', 'Layout', '/report/index', NULL, 'TrendCharts', 4, 1, 1),
(301, 30, '业务数据报表', 2, 'index', 'report/index', NULL, 'report:list', 'PieChart', 1, 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `path` = VALUES(`path`),
  `component` = VALUES(`component`),
  `redirect` = VALUES(`redirect`),
  `perms` = VALUES(`perms`),
  `icon` = VALUES(`icon`),
  `sort` = VALUES(`sort`),
  `visible` = VALUES(`visible`),
  `status` = VALUES(`status`);

INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(3011, 301, '报表导出', 3, NULL, NULL, 'report:export', NULL, 1, 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `perms` = VALUES(`perms`);

-- 自动为超级管理员角色授权
INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
VALUES (1, 30), (1, 301), (1, 3011);
