# 系统架构与工程规范

## 1. 技术选型说明

| 选型 | 方案 | 理由 |
|------|------|------|
| 后端 | NestJS | 与前端统一 TypeScript；模块化、DI、装饰器与企业级分层清晰 |
| 数据库 | MySQL 8 | 国内企业落地成熟，运维成本低 |
| ORM | TypeORM | NestJS 官方优先集成，实体即文档，支持迁移 |

## 2. 工程目录划分

### 2.1 后端 `backend/src`

```
src/
├── main.ts                      # 启动入口（全局管道 / 过滤器 / 拦截器）
├── app.module.ts
├── config/                      # 配置模块（数据库、JWT）
├── common/
│   ├── constants/               # 业务常量、错误码
│   ├── dto/                     # 公共 DTO（分页等）
│   ├── filters/                 # 全局异常过滤器
│   ├── interceptors/            # 响应转换拦截器
│   ├── decorators/              # @Public、@Permissions、@CurrentUser
│   ├── guards/                  # JWT / 权限守卫
│   └── interfaces/              # ApiResponse 等接口
└── modules/
    ├── auth/                    # 登录、Token、权限菜单聚合
    ├── user/                    # 用户管理
    ├── role/                    # 角色管理
    └── menu/                    # 菜单/权限管理
```

### 2.2 前端 `frontend/src`

```
src/
├── main.ts
├── App.vue
├── api/                         # 按模块划分的接口
├── assets/
├── components/                  # 通用组件
├── directives/                  # v-permission 等
├── hooks/                       # usePermission 等
├── layouts/                     # 后台布局
├── router/                      # 静态路由 + 动态路由 + 守卫
├── stores/                      # Pinia（user / permission / app）
├── types/                       # 全局 TS 类型
├── utils/                       # request、auth、storage
└── views/                       # 页面（system/user 等）
```

## 3. 统一 API 响应格式

所有接口统一返回：

```json
{
  "code": 200,
  "data": {},
  "message": "success"
}
```

| code | 含义 |
|------|------|
| 200 | 成功 |
| 400 | 参数校验失败 |
| 401 | 未登录 / Token 失效 |
| 403 | 无权限 |
| 500 | 服务端异常 |

分页接口 `data` 结构：

```json
{
  "list": [],
  "total": 100,
  "page": 1,
  "pageSize": 10
}
```

## 4. 全局错误处理机制

### 后端

1. `HttpExceptionFilter`：捕获 `HttpException` 与未知异常，统一包装为 `{ code, data, message }`
2. `ValidationPipe`：DTO 校验失败 → `code: 400`
3. `JwtAuthGuard`：无 Token / 无效 → `code: 401`
4. `PermissionsGuard`：无按钮权限 → `code: 403`
5. `TransformInterceptor`：成功响应自动包装 `code: 200`

### 前端

1. Axios 请求拦截：自动附加 `Authorization: Bearer <token>`
2. Axios 响应拦截：
   - `code !== 200` → Element Plus `ElMessage` 提示
   - `code === 401` → 清除本地态并跳转登录
3. 业务层通过泛型 `ApiResponse<T>` / `request<T>()` 获得类型安全的 `data`

## 5. RBAC 模型

```
sys_user ←→ sys_user_role ←→ sys_role ←→ sys_role_menu ←→ sys_menu
```

- `sys_menu.type`：`1` 目录 · `2` 菜单 · `3` 按钮
- 按钮权限标识：`perms` 字段，如 `sys:user:add`
- 前端：路由按菜单动态 `addRoute`；按钮用 `v-permission` / `usePermission`
