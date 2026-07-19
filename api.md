# 失物招领系统 API 文档

> **基础地址**：线上 `https://008jxy.pythonanywhere.com` / 本地 `http://localhost:5000`  
> **鉴权方式**：除标注"公开"外，所有接口需在请求头携带 `Authorization: Bearer <token>`  
> **响应格式**：统一 JSON，字段 `code`（200 成功）、`msg`（提示信息）、`data`（响应数据）  
> **更新日期**：2026-07-19

---

## 📋 接口总览

| 模块 | 接口数 | 路径前缀 | 说明 |
| --- | --- | --- | --- |
| 连通性测试 | 1 | `/api/test` | 健康检查 |
| 用户认证 | 6 | `/api/register`, `/api/login`, `/api/user` | 注册、登录、用户信息管理 |
| 物品管理 | 7 | `/api/items` | 发布、列表、详情、更新、删除、搜索 |
| 文件上传 | 4 | `/api/upload`, `/uploads` | 头像上传、图片静态服务 |
| 站内信 | 7 | `/api/messages`, `/api/conversations` | 消息发送、列表、撤回、已读 |
| 通知 | 4 | `/api/notifications` | 通知列表、标记已读、删除 |
| AI 匹配 | 2 | `/api/match` | 智能匹配 |

---

## 🔌 1. 连通性测试

### GET /api/test

**功能**：健康检查，验证后端服务是否正常运行

**请求**：无参数

**响应**：
```json
{
  "code": 200,
  "msg": "后端服务运行正常",
  "data": "失物招领系统基础接口连通成功"
}
```

---

## 👤 2. 用户认证

### POST /api/register

**功能**：注册新用户

**鉴权**：公开

**请求体**（JSON）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | ✅ | 用户名，唯一 |
| email | string | ✅ | 邮箱，唯一 |
| password | string | ✅ | 密码，至少6位 |
| gender | string | ❌ | 性别，`male`（默认）或 `female` |

**请求示例**：
```http
POST /api/register
Content-Type: application/json

{
  "username": "张三",
  "email": "zhangsan@example.com",
  "password": "123456",
  "gender": "male"
}
```

**成功响应**（201）：
```json
{
  "code": 200,
  "msg": "注册成功",
  "data": {
    "username": "张三",
    "avatar": "/avatar-male.jpg"
  }
}
```

**失败响应**（400）：
```json
{
  "code": 400,
  "msg": "用户名已存在"
}
```

---

### POST /api/login

**功能**：用户登录，获取 JWT token

**鉴权**：公开

**请求体**（JSON）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | ✅ | 用户名 |
| password | string | ✅ | 密码 |

**请求示例**：
```http
POST /api/login
Content-Type: application/json

{
  "username": "张三",
  "password": "123456"
}
```

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "username": "张三",
    "user_id": 1,
    "avatar": "/avatar-male.jpg"
  }
}
```

**失败响应**（401）：
```json
{
  "code": 401,
  "msg": "用户名或密码错误"
}
```

---

### GET /api/user

**功能**：获取当前登录用户信息

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "username": "张三",
    "email": "zhangsan@example.com",
    "avatar": "/avatar-male.jpg",
    "created_at": "2026-07-13T16:25:00+00:00"
  }
}
```

---

### PUT /api/user

**功能**：更新用户信息（修改用户名或密码）

**鉴权**：需要登录

**请求体**（JSON）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| username | string | ❌ | 新用户名 |
| password | string | ❌ | 新密码（修改密码时必须同时提供 old_password） |
| old_password | string | ❌ | 原密码（修改密码时必填） |

**请求示例**：
```http
PUT /api/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "李四"
}
```

```http
PUT /api/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "old_password": "123456",
  "password": "654321"
}
```

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "username": "李四"
  }
}
```

---

### GET /api/user/stats

**功能**：获取当前用户的物品统计信息

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "data": {
    "total": 5,
    "claimed": 2,
    "resolved": 1,
    "completed": 3,
    "pending": 2
  }
}
```

---

### GET /api/user/posts

**功能**：获取当前用户发布的所有物品

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "title": "寻找一卡通",
      "category": "lost",
      "description": "昨天下午在图书馆三楼丢失",
      "contact": "微信号 zhangsan123",
      "campus": "kangmei",
      "image": "",
      "status": "pending",
      "created_at": "2026-07-14T10:00:00+00:00"
    }
  ]
}
```

---

## 📦 3. 物品管理

### GET /api/items

**功能**：获取物品列表，支持筛选

**鉴权**：公开（未登录时 contact 字段脱敏为 `******`）

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| campus | string | ❌ | 校区，`kangmei`（康美）或 `meilin`（美林） |
| item_type | string | ❌ | 物品分类，见下方分类表 |

**物品分类表**：

| item_type | 显示名称 |
| --- | --- |
| id_card | 证件卡片 |
| electronics | 电子设备 |
| stationery | 学习用品 |
| daily | 生活日用 |
| sports | 体育器材 |
| other | 其他 |

**请求示例**：
```http
GET /api/items?campus=kangmei&item_type=id_card
```

**成功响应**（200）：返回物品数组
```json
[
  {
    "id": 1,
    "user_id": 1,
    "title": "寻找一卡通",
    "category": "lost",
    "item_type": "id_card",
    "description": "昨天下午在图书馆三楼丢失",
    "contact": "******",
    "found_time": "2026-07-13",
    "found_location": "图书馆三楼",
    "campus": "kangmei",
    "image": "",
    "status": "pending",
    "created_at": "2026-07-14T10:00:00+00:00",
    "user": {
      "id": 1,
      "username": "张三",
      "avatar": "/avatar-male.jpg"
    }
  }
]
```

---

### POST /api/items

**功能**：发布新物品（寻物或招领）

**鉴权**：需要登录

**请求体**（multipart/form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | ✅ | 标题 |
| category | string | ✅ | 类型，`lost`（寻物）或 `found`（招领） |
| item_type | string | ❌ | 物品分类，默认 `other` |
| description | string | ✅ | 描述 |
| contact | string | ✅ | 联系方式（微信号/手机号） |
| campus | string | ✅ | 校区，`kangmei` 或 `meilin` |
| found_time | string | ❌ | 发现时间 |
| found_location | string | ❌ | 发现地点 |
| image | file | ❌ | 物品图片，支持 jpg/jpeg/png/webp，≤2MB |

**请求示例**：
```http
POST /api/items
Authorization: Bearer <token>
Content-Type: multipart/form-data

title=寻找一卡通
category=lost
item_type=id_card
description=昨天下午在图书馆三楼丢失一张校园一卡通
contact=微信号 zhangsan123
campus=kangmei
found_time=2026-07-13
found_location=图书馆三楼
image=<文件>
```

**成功响应**（201）：
```json
{
  "code": 200,
  "msg": "发布成功",
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "寻找一卡通",
    "category": "lost",
    "description": "昨天下午在图书馆三楼丢失一张校园一卡通",
    "contact": "微信号 zhangsan123",
    "found_time": "2026-07-13",
    "found_location": "图书馆三楼",
    "image": "https://008jxy.pythonanywhere.com/uploads/items/xxx.jpg",
    "status": "pending",
    "created_at": "2026-07-14T10:00:00+00:00"
  }
}
```

---

### GET /api/items/{item_id}

**功能**：获取物品详情

**鉴权**：公开（未登录时 contact 脱敏）

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**请求示例**：
```http
GET /api/items/1
```

**成功响应**（200）：
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "user_id": 1,
    "title": "寻找一卡通",
    "category": "lost",
    "item_type": "id_card",
    "description": "昨天下午在图书馆三楼丢失",
    "contact": "******",
    "found_time": "2026-07-13",
    "found_location": "图书馆三楼",
    "campus": "kangmei",
    "image": "",
    "status": "pending",
    "created_at": "2026-07-14T10:00:00+00:00",
    "user": {
      "id": 1,
      "username": "张三",
      "avatar": "/avatar-male.jpg"
    }
  }
}
```

**失败响应**（404）：
```json
{
  "code": 404,
  "msg": "物品未找到"
}
```

---

### PUT /api/items/{item_id}

**功能**：更新物品信息（仅作者可操作）

**鉴权**：需要登录，且必须是物品作者

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**请求体**（JSON）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | ❌ | 新标题 |
| description | string | ❌ | 新描述 |
| contact | string | ❌ | 新联系方式 |
| found_time | string | ❌ | 新发现时间 |
| found_location | string | ❌ | 新发现地点 |
| campus | string | ❌ | 新校区 |
| item_type | string | ❌ | 新物品分类 |
| status | string | ❌ | 新状态（见下方状态规则） |

**状态规则**：

| 分类 | 允许状态 |
| --- | --- |
| lost（寻物） | `pending`（待认领）、`resolved`（已解决） |
| found（招领） | `pending`（待认领）、`claimed`（已认领） |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1,
    "title": "寻找一卡通",
    "status": "resolved",
    ...
  }
}
```

**失败响应**（403）：
```json
{
  "code": 403,
  "msg": "无权限修改此物品"
}
```

---

### DELETE /api/items/{item_id}

**功能**：删除物品（仅作者可操作，同时清理关联消息和通知）

**鉴权**：需要登录，且必须是物品作者

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "删除成功"
}
```

---

### GET /api/items/search

**功能**：搜索物品

**鉴权**：公开（未登录时 contact 脱敏）

**查询参数**：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| keyword | string | ❌ | 关键词，匹配标题和描述 |
| category | string | ❌ | 类型，`lost`、`found` 或 `all`（默认） |
| campus | string | ❌ | 校区 |
| item_type | string | ❌ | 物品分类 |

**请求示例**：
```http
GET /api/items/search?keyword=一卡通&category=lost&campus=kangmei
```

**成功响应**（200）：返回物品数组，格式同 `/api/items`

---

## 🖼️ 4. 文件上传与静态资源

### POST /api/upload/avatar

**功能**：上传用户头像

**鉴权**：需要登录

**请求体**（multipart/form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| file | file | ✅ | 头像图片，支持 jpg/jpeg/png/webp，≤2MB |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "头像上传成功",
  "data": {
    "avatar": "https://008jxy.pythonanywhere.com/uploads/avatars/xxx.jpg"
  }
}
```

---

### GET /uploads/avatars/{filename}

**功能**：获取头像图片

**鉴权**：公开

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| filename | string | 文件名 |

**成功响应**（200）：返回图片文件

---

### GET /uploads/items/{filename}

**功能**：获取物品图片

**鉴权**：公开

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| filename | string | 文件名 |

**成功响应**（200）：返回图片文件

---

### GET /uploads/messages/{filename}

**功能**：获取消息图片

**鉴权**：公开

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| filename | string | 文件名 |

**成功响应**（200）：返回图片文件

---

## 💬 5. 站内信

### GET /api/messages/{item_id}

**功能**：获取某物品帖下的消息列表（仅参与双方可见）

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "messages": [
    {
      "id": 1,
      "item_id": 1,
      "sender_id": 2,
      "receiver_id": 1,
      "content": "你好，我捡到了一张一卡通",
      "image": "",
      "read": true,
      "recalled": false,
      "created_at": "2026-07-14T12:00:00+00:00",
      "sender": {
        "id": 2,
        "username": "李四",
        "avatar": "/avatar-male.jpg"
      }
    }
  ]
}
```

---

### POST /api/messages/{item_id}

**功能**：发送消息（支持文字 + 图片）

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**请求体**（multipart/form-data）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| content | string | ❌ | 消息内容（文字或图片，至少一项） |
| image | file | ❌ | 消息图片，≤2MB |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "发送成功",
  "data": {
    "id": 1,
    "item_id": 1,
    "sender_id": 2,
    "receiver_id": 1,
    "content": "你好，我捡到了一张一卡通",
    "image": "",
    "created_at": "2026-07-14T12:00:00+00:00",
    "sender": {
      "id": 2,
      "username": "李四",
      "avatar": "/avatar-male.jpg"
    }
  }
}
```

---

### POST /api/messages/{msg_id}/recall

**功能**：撤回消息（仅发送者，且距发送 ≤1 分钟）

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| msg_id | int | 消息 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "撤回成功"
}
```

**失败响应**（400）：
```json
{
  "code": 400,
  "msg": "只能在消息发出后1分钟内撤回"
}
```

---

### POST /api/messages/{item_id}/read

**功能**：标记某物品帖下的消息为已读

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| item_id | int | 物品 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "已标记为已读"
}
```

---

### GET /api/conversations

**功能**：获取当前用户所有会话列表（按最后消息时间倒序）

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "conversations": [
    {
      "item_id": 1,
      "item_title": "寻找一卡通",
      "item_category": "lost",
      "other_user": {
        "id": 2,
        "username": "李四",
        "avatar": "/avatar-male.jpg"
      },
      "last_message": "你好，我捡到了一张一卡通",
      "last_time": "2026-07-14T12:00:00+00:00",
      "unread_count": 1
    }
  ]
}
```

---

### GET /api/messages/unread-count

**功能**：获取未读消息数

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "count": 3
}
```

---

## 🔔 6. 通知

### GET /api/notifications

**功能**：获取当前用户通知列表 + 未读数

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "notifications": [
    {
      "id": 1,
      "title": "🔍 发现相似招领帖",
      "content": "您发布的\"寻找一卡通\"与\"捡到一卡通\"相似度达85%，可能是您寻找的物品！",
      "related_item_id": 2,
      "read": false,
      "created_at": "2026-07-14T13:00:00+00:00"
    }
  ],
  "unread_count": 1
}
```

---

### PUT /api/notifications/{notification_id}/read

**功能**：标记单条通知为已读

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| notification_id | int | 通知 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "已标记为已读"
}
```

---

### DELETE /api/notifications/{notification_id}

**功能**：删除单条通知

**鉴权**：需要登录

**路径参数**：

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| notification_id | int | 通知 ID |

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "删除成功"
}
```

---

### POST /api/notifications/mark-all-read

**功能**：标记所有通知为已读

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "code": 200,
  "msg": "已全部标记为已读"
}
```

---

## 🤖 7. AI 智能匹配

### POST /api/match

**功能**：单次匹配——输入描述，返回相似的招领/寻物帖

**鉴权**：需要登录

**请求体**（JSON）：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| title | string | ❌ | 标题 |
| description | string | ✅ | 描述内容 |
| category | string | ❌ | 当前类型，`lost`（默认）或 `found` |
| item_type | string | ❌ | 物品分类 |

**请求示例**：
```http
POST /api/match
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "寻找一卡通",
  "description": "昨天下午在图书馆三楼丢失一张校园一卡通",
  "category": "lost",
  "item_type": "id_card"
}
```

**成功响应**（200）：
```json
{
  "code": 200,
  "matches": [
    {
      "item_id": 2,
      "title": "捡到一卡通",
      "description": "在图书馆三楼捡到一张校园一卡通",
      "contact": "微信号 lisi456",
      "category": "found",
      "status": "pending",
      "similarity": 85.5
    }
  ]
}
```

---

### GET /api/match/all

**功能**：全量匹配——跑库内所有寻物 vs 招领帖

**鉴权**：需要登录

**请求**：无参数

**成功响应**（200）：
```json
{
  "matches": [
    {
      "lost_item": {
        "id": 1,
        "title": "寻找一卡通",
        "description": "在图书馆三楼丢失",
        "contact": "微信号 zhangsan123",
        "user_id": 1
      },
      "found_item": {
        "id": 2,
        "title": "捡到一卡通",
        "description": "在图书馆三楼捡到",
        "contact": "微信号 lisi456",
        "user_id": 2
      },
      "similarity": 85.5
    }
  ]
}
```

---

## 📝 错误码说明

| code | HTTP 状态码 | 说明 |
| --- | --- | --- |
| 200 | 200/201 | 请求成功 |
| 400 | 400 | 请求参数错误（缺失字段、格式错误、业务规则不满足） |
| 401 | 401 | 未授权（token 无效、过期、缺失） |
| 403 | 403 | 无权限（非物品作者、非消息发送者） |
| 404 | 404 | 资源未找到（物品、用户、通知、消息不存在） |
| 413 | 413 | 请求体过大（上传文件超过 2MB） |
| 500 | 500 | 服务端错误 |

---

## 🔑 认证流程

```
1. 用户提交用户名密码 → POST /api/login
2. 后端验证成功 → 返回 JWT token
3. 前端将 token 存入 localStorage
4. 后续请求在 headers 中携带 Authorization: Bearer <token>
5. 后端验证 token 有效性 → 返回数据或 401
6. token 过期 → 前端跳转到登录页
```

---

## 📊 数据库模型

### User（用户）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 主键 |
| username | string(80) | 用户名，唯一 |
| email | string(120) | 邮箱，唯一 |
| password_hash | string(255) | 密码哈希 |
| avatar | string(255) | 头像 URL |
| gender | string(10) | 性别 |
| created_at | datetime | 创建时间（UTC） |

### Item（物品帖）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 主键 |
| user_id | int | 外键 → User.id |
| title | string(100) | 标题 |
| category | string(10) | 类型（lost/found） |
| item_type | string(20) | 物品分类 |
| description | text | 描述 |
| contact | string(100) | 联系方式 |
| found_time | string(50) | 发现时间 |
| found_location | string(200) | 发现地点 |
| campus | string(20) | 校区 |
| image | string(255) | 图片 URL |
| status | string(20) | 状态 |
| created_at | datetime | 创建时间（UTC） |

### Notification（通知）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 主键 |
| user_id | int | 外键 → User.id |
| title | string(100) | 标题 |
| content | text | 内容 |
| related_item_id | int | 关联物品 ID |
| read | bool | 是否已读 |
| created_at | datetime | 创建时间（UTC） |

### Message（消息）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | int | 主键 |
| item_id | int | 外键 → Item.id |
| sender_id | int | 外键 → User.id |
| receiver_id | int | 外键 → User.id |
| content | text | 内容 |
| image | string(255) | 图片 URL |
| read | bool | 是否已读 |
| recalled | bool | 是否已撤回 |
| created_at | datetime | 创建时间（UTC） |

---

## 🚀 快速开始

### 本地开发

```bash
# 后端
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py

# 前端
cd frontend
npm install
npm run dev
```

### 在线测试

```bash
# 测试连通性
curl https://008jxy.pythonanywhere.com/api/test

# 注册
curl -X POST https://008jxy.pythonanywhere.com/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"123456"}'

# 登录
curl -X POST https://008jxy.pythonanywhere.com/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'

# 获取用户信息
curl -X GET https://008jxy.pythonanywhere.com/api/user \
  -H "Authorization: Bearer <token>"
```

---

**后端版本**：Flask 3.1.3  
**前端版本**：Next.js 16.2.10
