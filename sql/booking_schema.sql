-- 预约管理：服务项目 / 服务人员 / 预约单 + 菜单
USE `enterprise_manage`;
SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS `biz_service_item` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '项目ID',
  `name`       VARCHAR(64)     NOT NULL COMMENT '服务项目名称',
  `duration`   INT             NOT NULL DEFAULT 60 COMMENT '时长(分钟)',
  `status`     TINYINT         NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `sort`       INT             NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务项目';

CREATE TABLE IF NOT EXISTS `biz_staff` (
  `id`         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '人员ID',
  `name`       VARCHAR(64)     NOT NULL COMMENT '服务人员姓名',
  `store_name` VARCHAR(64)     NOT NULL COMMENT '所属门店/网点',
  `status`     TINYINT         NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  `sort`       INT             NOT NULL DEFAULT 0 COMMENT '排序',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约服务人员';

CREATE TABLE IF NOT EXISTS `biz_appointment` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  `order_no`      VARCHAR(32)     NOT NULL COMMENT '预约单号',
  `customer_name` VARCHAR(64)     NOT NULL COMMENT '客户姓名',
  `phone`         VARCHAR(20)     NOT NULL COMMENT '联系电话',
  `service_id`    BIGINT UNSIGNED NOT NULL COMMENT '服务项目ID',
  `staff_id`      BIGINT UNSIGNED NOT NULL COMMENT '服务人员ID',
  `appoint_date`  DATE            NOT NULL COMMENT '预约日期',
  `slot_start`    CHAR(5)         NOT NULL COMMENT '时段开始 HH:mm',
  `slot_end`      CHAR(5)         NOT NULL COMMENT '时段结束 HH:mm',
  `status`        TINYINT         NOT NULL DEFAULT 1 COMMENT '1待服务 2已完成 3已取消 4已过期',
  `remark`        VARCHAR(500)    DEFAULT NULL COMMENT '预约备注',
  `cancel_reason` VARCHAR(200)    DEFAULT NULL COMMENT '取消原因',
  `cancelled_at`  DATETIME        DEFAULT NULL COMMENT '取消时间',
  `created_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at`    DATETIME        DEFAULT NULL COMMENT '软删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_phone` (`phone`),
  KEY `idx_customer` (`customer_name`),
  KEY `idx_staff_date` (`staff_id`, `appoint_date`, `status`),
  KEY `idx_status` (`status`),
  KEY `idx_appoint_date` (`appoint_date`),
  CONSTRAINT `fk_ap_service` FOREIGN KEY (`service_id`) REFERENCES `biz_service_item` (`id`),
  CONSTRAINT `fk_ap_staff` FOREIGN KEY (`staff_id`) REFERENCES `biz_staff` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预约单';

-- 预约菜单 ID：20 目录、51 页面、211-214 按钮
-- 注意：不能占用 21（rbac 里已是「用户查询」按钮），否则会变成按钮节点，点侧边栏进 404

-- 1) 先写入预约页面，再把旧按钮从错误的 parent=21 挪过来
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(20, 0, '预约中心', 1, '/booking', 'Layout', '/booking', NULL, 'Calendar', 3, 1, 1),
(51, 20, '预约管理', 2, 'list', 'booking/index', NULL, 'booking:list', 'List', 1, 1, 1)
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
(211, 51, '预约查询', 3, NULL, NULL, 'booking:query',  NULL, 1, 1, 1),
(212, 51, '预约新增', 3, NULL, NULL, 'booking:add',    NULL, 2, 1, 1),
(213, 51, '预约修改', 3, NULL, NULL, 'booking:edit',   NULL, 3, 1, 1),
(214, 51, '取消预约', 3, NULL, NULL, 'booking:cancel', NULL, 4, 1, 1),
(215, 51, '预约删除', 3, NULL, NULL, 'booking:remove', NULL, 5, 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = VALUES(`parent_id`),
  `menu_name` = VALUES(`menu_name`),
  `menu_type` = VALUES(`menu_type`),
  `perms` = VALUES(`perms`);

-- 2) 还原被覆盖的「用户查询」按钮
INSERT INTO `sys_menu`
(`id`, `parent_id`, `menu_name`, `menu_type`, `path`, `component`, `redirect`, `perms`, `icon`, `sort`, `visible`, `status`)
VALUES
(21, 2, '用户查询', 3, NULL, NULL, NULL, 'sys:user:query', NULL, 1, 1, 1)
ON DUPLICATE KEY UPDATE
  `parent_id` = 2,
  `menu_name` = '用户查询',
  `menu_type` = 3,
  `path` = NULL,
  `component` = NULL,
  `redirect` = NULL,
  `perms` = 'sys:user:query',
  `icon` = NULL,
  `sort` = 1;

INSERT IGNORE INTO `sys_role_menu` (`role_id`, `menu_id`)
SELECT 1, `id` FROM `sys_menu` WHERE `id` IN (20, 51, 211, 212, 213, 214, 215);

INSERT IGNORE INTO `biz_service_item` (`id`, `name`, `duration`, `status`, `sort`) VALUES
(1, '基础护理', 60, 1, 1),
(2, '深度保养', 90, 1, 2),
(3, '专项检测', 60, 1, 3),
(4, 'VIP 尊享套餐', 120, 1, 4);

INSERT IGNORE INTO `biz_staff` (`id`, `name`, `store_name`, `status`, `sort`) VALUES
(1, '陈晨', '朝阳门店', 1, 1),
(2, '刘洋', '朝阳门店', 1, 2),
(3, '周敏', '海淀网点', 1, 3),
(4, '吴倩', '浦东网点', 1, 4);

INSERT IGNORE INTO `biz_appointment`
(`order_no`, `customer_name`, `phone`, `service_id`, `staff_id`, `appoint_date`, `slot_start`, `slot_end`, `status`, `remark`)
VALUES
('AP202608200001', '王芳', '13900002001', 1, 1, DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00', '11:00', 1, '首次到店'),
('AP202608200002', '李强', '13900002002', 2, 3, DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:00', '15:00', 1, NULL);
