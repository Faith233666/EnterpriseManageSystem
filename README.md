# Enterprise Manage System

现代化企业级后台管理系统（Vue 3 + NestJS + MySQL）。

## 技术栈

当前项目技术栈如下：

**前端**
- Vue 3（`<script setup>` + TypeScript）
- Element Plus（UI）
- Pinia（状态）
- Vue Router（含动态路由 / 守卫）
- Vite（构建）
- Axios（请求封装）

**后端**
- Node.js + NestJS 10
- JWT + Passport（登录鉴权）
- class-validator（参数校验）
- bcryptjs（密码加密）

**数据层**
- MySQL 兼容库（本机当前跑的是 MariaDB 12.3）
- TypeORM（ORM）

**权限与工程**
- RBAC（用户 / 角色 / 菜单 + 按钮级 `sys:user:add` 等）
- 统一响应 `{ code, data, message }`
- 前端 `v-permission` + `usePermission`

**默认账号**：`admin` / `admin123`

| 层 | 技术 |
|---|---|
| 前端 | Vue 3 (`<script setup>` + TS) · Element Plus · Pinia · Vue Router · Vite · Axios |
| 后端 | **Node.js · NestJS 10** · JWT · Passport · class-validator · bcryptjs |
| 数据库 | **MySQL / MariaDB** · **TypeORM** |
| 规范 | 统一 `code/data/message` 响应 · RBAC（菜单 + 按钮级权限） |

## 目录结构

```
EnterpriseManageSystem/
├── docs/                 # 架构与规范文档
├── sql/                  # 数据库建表与初始化脚本
├── backend/              # NestJS 后端
└── frontend/             # Vue 3 前端
```

## 快速启动

### 1. 数据库

```bash
mysql -u root -p < sql/rbac_schema.sql
```

### 2. 后端

```bash
cd backend
cp .env.example .env   # 按需修改数据库连接
npm install
npm run start:dev
# http://localhost:3000
```

### 3. 前端

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

### 默认账号

- 用户名：`admin`
- 密码：`admin123`

## 模块说明

1. **系统架构与规范** — 见 `docs/architecture.md`
2. **RBAC 权限与建表** — 见 `sql/rbac_schema.sql`
3. **前端核心底座** — Axios / 动态路由 / `v-permission`
4. **用户管理闭环** — 分页查询、增删改、状态切换
