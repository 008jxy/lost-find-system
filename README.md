# 🎒 校园失物招领系统 Lost & Find System

> 一个面向校园场景的失物招领平台，支持**寻物 / 招领信息发布**、**AI 智能匹配**、**站内信沟通**、**多校区 / 分类筛选**，覆盖从丢东西到找回物品的完整闭环。系统已在校园两个校区（康美、美林）真实使用。

---

## 📌 线上 Demo
| 端 | 访问地址 | 部署平台 |
| --- | --- | --- |
| 🖥️ 前端 | **https://www.jjxxyy.top** | Vercel |
| ⚙️ 后端 API | https://008jxy.pythonanywhere.com | PythonAnywhere |
| 🗄️ 数据库 | SQLite（部署机本地文件） | PythonAnywhere 文件系统 |

> 直接打开 https://www.jjxxyy.top 即可体验全部功能（注册 → 登录 → 发布失物/招领 → 等待 AI 匹配通知 → 站内信联系对方）。

---

## 📖 项目介绍

校园场景中，学生遗失物品或拾到物品后，传统做法是贴纸质告示或发朋友圈，**信息散落、难以匹配失主**。本系统把"丢东西的人"和"捡到东西的人"汇聚到同一平台，并通过 **AI 文本相似度算法自动匹配双方帖子**，主动推送匹配通知，再用**站内信**促成联系，最终闭环到"已认领 / 已解决"状态。

### 核心闭环

```
   丢东西 ──发"寻物"帖──┐                            ┌── 联系发布者
                        ├─→ AI 自动匹配 ─→ 通知双方 ─┤
   捡东西 ──发"招领"帖──┘                            └── 状态置为已解决
```

### 核心功能模块

| 模块 | 说明 |
| --- | --- |
| 👤 用户认证 | 注册 / 登录 / JWT 鉴权 / 修改用户名密码 / 头像上传 / 性别分配默认头像 |
| 📦 物品发布 | 发布寻物或招领帖，支持图片上传、校区选择、分类选择、状态管理 |
| 🔍 搜索筛选 | 按关键词模糊搜索 + 按类型（寻物/招领）+ 按校区（康美/美林）+ 按物品分类多维筛选 |
| 🤖 AI 智能匹配 | 基于 Jaccard 文本相似度算法自动匹配相似帖子，新帖发布即触发，匹配结果实时通知双方 |
| 💬 站内信 | 帖子详情页发起私信、支持图片消息、未读提醒、1分钟内可撤回 |
| 🔔 通知中心 | 匹配通知、未读数统计、单条/全部已读、删除 |
| 🏫 多校区支持 | 康美校区（kangmei） / 美林校区（meilin）独立筛选 |
| 🛡️ 安全控制 | 未登录用户无法看到联系方式（脱敏为 ******），AI 匹配接口需鉴权 |
| 📊 个人统计 | 发布总数、待处理、已认领、已解决统计 |

### 物品分类

| item_type 值 | 显示名称 |
| --- | --- |
| `id_card` | 证件卡片 |
| `electronics` | 电子设备 |
| `stationery` | 学习用品 |
| `daily` | 生活日用 |
| `sports` | 体育器材 |
| `other` | 其他 |

### 物品状态

| status 值 | 适用 | 含义 |
| --- | --- | --- |
| `pending` | 寻物 / 招领 | 待处理 |
| `claimed` | 仅招领 | 已被认领 |
| `resolved` | 仅寻物 | 已解决（找回） |

---

## 🛠️ 技术栈

### 前端

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| [Next.js](https://nextjs.org/) | 16.2.10 | React 全栈框架（App Router） |
| React | 19.2.4 | UI 库 |
| TypeScript | ^5 | 类型安全 |
| Tailwind CSS | ^4 | 原子化样式 |
| 原生 fetch | - | HTTP 请求 |
| localStorage | - | 客户端 token / 用户信息存储 |

### 后端

| 技术 | 版本 | 用途 |
| --- | --- | --- |
| [Flask](https://flask.palletsprojects.com/) | 3.1.3 | Web 框架 |
| Flask-SQLAlchemy | 3.1.1 | ORM |
| Flask-JWT-Extended | 4.6.0 | JWT 认证 |
| Flask-CORS | 6.0.5 | 跨域处理 |
| bcrypt | 4.2.0 | 密码哈希 |
| python-dotenv | 1.0.1 | 环境变量加载 |
| gunicorn | 23.0.0 | 生产环境 WSGI 服务器 |
| pytest | 9.1.1 | 单元测试 |

### 数据库 & 基础设施

- **数据库**：SQLite（轻量、零配置，文件位于 `backend/lost_find.db`）
- **CI/CD**：GitHub Actions（推送 main 自动跑后端测试 + 前端构建）
- **日志**：Python logging 模块，输出到 `backend/app.log`
- **错误监控**：Flask 全局异常日志 + JWT 错误处理
- **环境变量**：`backend/.env`（开发）/ PythonAnywhere 环境变量（生产）

---

## 📂 项目目录结构

```
lost-find-system/
├── .github/
│   └── workflows/
│       └── ci.yml                  # CI 配置（后端 pytest + 前端 build）
├── backend/                        # Flask 后端
│   ├── app.py                      # 主入口：模型 + 路由 + AI 匹配算法（~1062 行）
│   ├── wsgi.py                     # PythonAnywhere 生产部署入口
│   ├── requirements.txt            # Python 依赖
│   ├── .env.example                # 环境变量模板
│   ├── app.log                     # 运行日志（自动生成）
│   ├── lost_find.db                # SQLite 数据库文件（自动生成）
│   ├── uploads/                    # 上传文件存储目录
│   │   ├── avatars/                # 用户头像
│   │   ├── items/                  # 物品图片
│   │   └── messages/               # 消息图片
│   └── tests/
│       └── test_api.py             # pytest 单元测试（10 个用例）
├── frontend/                       # Next.js 前端
│   ├── app/
│   │   ├── page.tsx                # 首页（物品列表 + 筛选）
│   │   ├── layout.tsx              # 全局布局
│   │   ├── globals.css             # 全局样式
│   │   ├── components/
│   │   │   └── NavBar.tsx          # 顶部导航栏
│   │   ├── utils/
│   │   │   ├── api.ts              # API 基础地址
│   │   │   └── auth.ts             # token 校证 / 清理工具
│   │   ├── login/page.tsx          # 登录页
│   │   ├── register/page.tsx       # 注册页
│   │   ├── post/page.tsx           # 发布物品页
│   │   ├── items/[id]/page.tsx     # 物品详情页（含站内信入口）
│   │   ├── match/page.tsx          # AI 匹配页
│   │   ├── messages/page.tsx       # 我的消息（会话列表）
│   │   ├── notifications/page.tsx  # 通知中心
│   │   └── profile/
│   │       ├── page.tsx            # 个人中心
│   │       └── posts/page.tsx      # 我的发布
│   ├── public/                     # 静态资源（默认头像等）
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   └── tailwind.config (PostCSS 配置)
├── docs/
│   └── prompt_log.md               # AI 辅助开发 Prompt 日志
├── screenshots/                    # 开发过程截图（与 prompt_log 配套）
│   ├── prompt1_搭建框架.png
│   └── ...
├── vercel.json                     # Vercel 部署配置
├── render.yaml                     # Render 部署配置（备用）
└── .gitignore
```

---

## 🚀 本地开发指南

### 环境要求

- **Node.js** ≥ 20（推荐 20.x）
- **Python** ≥ 3.12
- **Git** ≥ 2.x

### 1. 克隆仓库

```bash
git clone https://github.com/008jxy/lost-find-system.git
cd lost-find-system
```

### 2. 启动后端（Flask）

```bash
cd backend

# 创建并激活虚拟环境
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# macOS / Linux
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt

# 复制环境变量模板并按需修改
cp .env.example .env
# 编辑 .env，把 JWT_SECRET_KEY 改成你的随机字符串

# 启动开发服务器
flask run
# 或者
python app.py
```

后端默认运行在 **http://localhost:5000**，首次启动会自动创建 `lost_find.db` 数据库和 `uploads/` 目录。

✅ 验证：浏览器访问 http://localhost:5000/api/test，应返回：

```json
{
  "code": 200,
  "msg": "后端服务运行正常",
  "data": "失物招领系统基础接口连通成功"
}
```

### 3. 启动前端（Next.js）

```bash
cd frontend

# 安装依赖
npm install

# （可选）配置后端地址，指向本地 Flask
# 创建 .env.local 文件，写入：NEXT_PUBLIC_API_URL=http://localhost:5000

# 启动开发服务器
npm run dev
```

前端默认运行在 **http://localhost:3000**。

> ⚠️ 注意：`frontend/app/utils/api.ts` 默认指向线上后端 `https://008jxy.pythonanywhere.com`。本地开发时若要连本地后端，请在 `frontend/` 下创建 `.env.local` 并设置 `NEXT_PUBLIC_API_URL=http://localhost:5000`，否则前端会调用线上接口。

### 4. 跑单元测试

```bash
cd backend
PYTHONPATH=. python -m pytest tests/test_api.py -v
```

预期输出：**10 个测试用例全部通过**。

### 5. 生产构建

```bash
# 前端
cd frontend
npm run build
npm run start

# 后端（用 gunicorn）
cd backend
gunicorn app:app --host 0.0.0.0 --port 5000
```

---

## 🌐 部署说明

### 当前部署架构

```
   浏览器
     │
     ▼
 https://www.jjxxyy.top  ──── Vercel（Next.js 静态/SSR）
                              │ fetch 调用
                              ▼
                    https://008jxy.pythonanywhere.com  ──── PythonAnywhere（Flask + gunicorn）
                              │
                              ▼
                          SQLite 文件
```

### 前端部署到 Vercel

1. 在 Vercel 导入 GitHub 仓库 `008jxy/lost-find-system`
2. **Root Directory** 选 `frontend`
3. **Build Command**：`npm run build`
4. **Output Directory**：`.next`
5. 添加环境变量 `NEXT_PUBLIC_API_URL` 指向你的后端地址
6. 部署后会得到 `https://xxx.vercel.app`，可绑定自定义域名（如本项目的 `jjxxyy.top`）

仓库内的 [vercel.json](./vercel.json) 已配置好上述构建参数。

### 后端部署到 PythonAnywhere

1. 注册 [PythonAnywhere](https://www.pythonanywhere.com/) 账号
2. 上传 `backend/` 目录到 `/home/008jxy/lost-find-system/backend/`
3. 在 **Web** 标签创建新的 Web App，选择 **Manual configuration** + **Python 3.12**
4. WSGI 配置文件参考 `backend/wsgi.py`：

   ```python
   import sys
   import os
   path = '/home/008jxy/lost-find-system/backend'
   if path not in sys.path:
      sys.path.insert(0, path)
   os.environ['FLASK_ENV'] = 'production'
   os.environ['FLASK_DEBUG'] = 'False'
   os.environ['JWT_SECRET_KEY'] = 'your-secret-key-123'
   os.environ['SERVER_URL'] = 'https://008jxy.pythonanywhere.com'
   from app import app as application
   ```

5. 安装依赖：在 Bash console 执行
   ```bash
   cd ~/lost-find-system/backend
   pip install -r requirements.txt
   ```
6. **必须**：在 Web 标签的 **Static files** 中映射：
   - URL `/uploads/avatars/` → Directory `/home/008jxy/lost-find-system/backend/uploads/avatars/`
   - URL `/uploads/items/` → Directory `/home/008jxy/lost-find-system/backend/uploads/items/`
   - URL `/uploads/messages/` → Directory `/home/008jxy/lost-find-system/backend/uploads/messages/`

   否则上传的头像和物品图片无法访问。


## 🗄️ 数据库设计

### 实体关系（ER 模型）

```
   User (用户)
   ├── id (PK)
   ├── username (unique)
   ├── email (unique)
   ├── password_hash
   ├── avatar
   ├── gender
   └── created_at
        │
        │ 1
        │
        │ N
   Item (物品帖) ◄──── item_id ────► Message (消息)
   ├── id (PK)                            ├── id (PK)
   ├── user_id (FK → User)                ├── item_id (FK → Item)
   ├── title                              ├── sender_id (FK → User)
   ├── category (lost/found)              ├── receiver_id (FK → User)
   ├── item_type                          ├── content
   ├── description                         ├── image
   ├── contact                             ├── read
   ├── found_time                          ├── recalled
   ├── found_location                      └── created_at
   ├── campus (kangmei/meilin)
   ├── image
   ├── status
   └── created_at

   Notification (通知)
   ├── id (PK)
   ├── user_id (FK → User)
   ├── title
   ├── content
   ├── related_item_id
   ├── read
   └── created_at
```

### 字段说明

**User**：用户基础信息，密码使用 bcrypt 哈希存储，永不存明文。

**Item**：失物/招领帖。`category` 区分寻物还是招领，`item_type` 区分物品分类，`campus` 区分校区，`status` 跟踪处理进度。

**Notification**：系统通知，`related_item_id` 关联匹配到的物品，用于点击通知跳转到详情页。

**Message**：站内信。`item_id` 表示该消息是关于哪个物品帖的，`sender_id` 和 `receiver_id` 表示对话双方，`recalled` 字段标记是否被撤回。

---

## 📡 API 接口文档

> 基础地址：`https://008jxy.pythonanywhere.com`（线上） / `http://localhost:5000`（本地）
>
> 鉴权方式：除标注"公开"外，所有接口需在请求头携带 `Authorization: Bearer <token>`，token 通过 `/api/login` 获取。
>
> 响应格式：JSON。统一字段 `code`（200 成功，4xx 客户端错误，5xx 服务端错误）、`msg`、`data`。

### 1. 连通性测试

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/test` | 公开 | 健康检查接口 |

### 2. 用户认证

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/register` | 公开 | 注册用户 |
| POST | `/api/login` | 公开 | 登录获取 JWT token |
| GET | `/api/user` | ✅ | 获取当前用户信息 |
| PUT | `/api/user` | ✅ | 修改用户名 / 密码（改密码需提供 `old_password`） |
| GET | `/api/user/stats` | ✅ | 获取当前用户的物品统计（总数、待处理、已认领、已解决） |
| GET | `/api/user/posts` | ✅ | 获取当前用户发布的所有物品 |

**注册示例**

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

```json
{
  "code": 200,
  "msg": "注册成功",
  "data": { "username": "张三", "avatar": "/avatar-male.jpg" }
}
```

**登录示例**

```http
POST /api/login
Content-Type: application/json

{ "username": "张三", "password": "123456" }
```

```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "username": "张三",
    "user_id": 1,
    "avatar": "/avatar-male.jpg"
  }
}
```

### 3. 物品管理

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/items` | 公开（登录可见联系方式） | 物品列表，支持 `campus`、`item_type` 查询参数筛选 |
| POST | `/api/items` | ✅ | 发布新物品（multipart/form-data，支持图片上传） |
| GET | `/api/items/<id>` | 公开（登录可见联系方式） | 获取物品详情 |
| PUT | `/api/items/<id>` | ✅（仅作者） | 修改物品信息 / 更新状态 |
| DELETE | `/api/items/<id>` | ✅（仅作者） | 删除物品（同时清理关联消息和通知） |
| GET | `/api/items/search` | 公开 | 关键词搜索，支持 `keyword`、`category`、`campus`、`item_type` |

**发布物品示例**

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
found_time=
found_location=图书馆三楼
image=<二进制文件，可选>
```

发布成功后**自动触发 AI 匹配**，若有匹配项会立即给双方发通知。

### 4. 文件上传 & 静态资源

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/upload/avatar` | ✅ | 上传用户头像（限 jpg/jpeg/png/webp，≤2MB） |
| GET | `/uploads/avatars/<filename>` | 公开 | 头像图片静态服务 |
| GET | `/uploads/items/<filename>` | 公开 | 物品图片静态服务 |
| GET | `/uploads/messages/<filename>` | 公开 | 消息图片静态服务 |

### 5. 站内信

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/messages/<item_id>` | ✅ | 获取某物品帖下的消息列表（仅参与双方可见） |
| POST | `/api/messages/<item_id>` | ✅ | 发送消息（支持文字 + 图片，multipart/form-data） |
| GET | `/api/conversations` | ✅ | 获取当前用户所有会话列表（按最后消息时间倒序） |
| GET | `/api/messages/unread-count` | ✅ | 获取未读消息数（用于导航栏红点） |
| POST | `/api/messages/<item_id>/read` | ✅ | 标记某物品帖下消息为已读 |
| POST | `/api/messages/<msg_id>/recall` | ✅ | 撤回消息（仅发送者，且距发送 ≤ 1 分钟） |

### 6. 通知

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| GET | `/api/notifications` | ✅ | 获取当前用户通知列表 + 未读数 |
| PUT | `/api/notifications/<id>/read` | ✅ | 标记单条通知为已读 |
| DELETE | `/api/notifications/<id>` | ✅ | 删除单条通知 |

### 7. AI 智能匹配

| 方法 | 路径 | 鉴权 | 说明 |
| --- | --- | --- | --- |
| POST | `/api/match` | ✅ | 单次匹配：输入一段描述，返回相似度 ≥ 30% 的招领/寻物帖（前 5 条） |
| GET | `/api/match/all` | ✅ | 全量匹配：跑库内所有寻物 vs 招领帖，返回相似度 ≥ 40% 的对（前 10 条） |

**单次匹配请求示例**

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

```json
{
  "code": 200,
  "matches": [
    {
      "item_id": 42,
      "title": "捡到一张校园一卡通",
      "description": "在图书馆三楼捡到一张一卡通",
      "contact": "微信号 lisi456",
      "category": "found",
      "status": "pending",
      "similarity": 78.5
    }
  ]
}
```

---

## 🤖 AI 匹配算法说明

匹配逻辑位于 `backend/app.py` 的 `calculate_similarity()` 函数，采用**词级 Jaccard + 字符级 Jaccard** 双重相似度计算，兼顾中英文场景：

### 算法步骤

1. **分词**（`tokenize`）：转小写 → 去标点 → 按空格切词
2. **词级 Jaccard**：`|词集A ∩ 词集B| / |词集A ∪ 词集B|`
3. **共同词加权**：对每个共同词，加 `min(词A出现次数, 词B出现次数) × 0.1`，提升重复关键词权重
4. **字符级 Jaccard**：`|字符集A ∩ 字符集B| / |字符集A ∪ 字符集B|`，针对中文场景（中文不按空格分词）
5. **融合**：最终相似度 = `(词级Jaccard + 字符级Jaccard) / 2`，限制不超过 1.0

### 匹配规则

- 寻物帖 ↔ 招领帖**跨类别匹配**（`lost` 与 `found` 配对）
- 仅匹配 `status='pending'` 的物品
- **同分类加成**：若两帖 `item_type` 相同，相似度 +0.2（最多 1.0）
- **新帖发布自动触发匹配**：`trigger_match_and_notify()` 会遍历异类待处理帖，相似度 > 40% 即向双方推送通知

### 阈值一览

| 场景 | 阈值 | 返回数 |
| --- | --- | --- |
| `/api/match` 单次匹配 | similarity > 0.3 | 最多 5 条 |
| `/api/match/all` 全量匹配 | similarity > 0.4 | 最多 10 条 |
| 新帖发布自动匹配 | similarity > 0.4 | 不限（全部通知） |

---

## ⚙️ 环境变量

复制 `backend/.env.example` 为 `backend/.env`，按需修改：

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `FLASK_APP` | `app.py` | Flask 入口 |
| `FLASK_ENV` | `development` | 运行环境（`development` / `production`） |
| `FLASK_DEBUG` | `True` | 调试模式 |
| `SERVER_PORT` | `5000` | 监听端口 |
| `SERVER_URL` | `http://localhost:5000` | 后端外网访问地址（用于拼接图片 URL，**生产部署必须改**） |
| `JWT_SECRET_KEY` | `your-secret-key-here` | JWT 签名密钥（**生产部署必须改**） |
| `SQLALCHEMY_DATABASE_URI` | `sqlite:///lost_find.db` | 数据库连接串 |
| `SQLALCHEMY_TRACK_MODIFICATIONS` | `False` | SQLAlchemy 修改追踪 |
| `MAX_CONTENT_LENGTH` | `2097152`（2MB） | 上传文件大小上限 |
| `LOG_LEVEL` | `INFO` | 日志级别 |
| `LOG_FILE` | `app.log` | 日志文件路径 |

前端环境变量（`frontend/.env.local`）：

| 变量名 | 默认值 | 说明 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://008jxy.pythonanywhere.com` | 后端 API 基础地址 |

---

## 🧪 单元测试

测试文件：[`backend/tests/test_api.py`](./backend/tests/test_api.py)

使用 pytest 框架 + SQLite 内存数据库（`sqlite:///:memory:`）隔离测试，每个用例前后自动建表/销毁，互不污染。

### 测试用例

| 用例名 | 覆盖功能 |
| --- | --- |
| `test_register` | 正常注册用户 |
| `test_register_duplicate_username` | 重复用户名注册被拒 |
| `test_register_missing_fields` | 缺失字段注册被拒 |
| `test_login` | 正常登录获取 token |
| `test_login_invalid_credentials` | 错误密码登录被拒 |
| `test_get_user` | 携带 token 获取用户信息 |
| `test_create_item` | 发布物品 |
| `test_create_item_missing_fields` | 缺失字段发布被拒 |
| `test_get_items` | 获取物品列表 |
| `test_test_api` | API 连通性 |

运行：

```bash
cd backend
PYTHONPATH=. python -m pytest tests/test_api.py -v
```

---

## 🔄 CI/CD

配置文件：[`.github/workflows/ci.yml`](./.github/workflows/ci.yml)

触发条件：推送到 `main` 分支 或 对 `main` 提交 Pull Request

### Jobs

1. **backend-test**：Ubuntu + Python 3.12 → 安装依赖 → 跑 pytest
2. **frontend-build**：Ubuntu + Node 20 → npm install → npm run build

任一 Job 失败会在 GitHub 仓库的 Actions 标签显示红色叉，PR 也会被阻塞。

---

## 📊 健壮性 / 异常处理说明

- **未登录脱敏**：`/api/items`、`/api/items/<id>`、`/api/items/search` 在未登录时返回的 `contact` 字段会被脱敏为 `******`，避免泄露联系方式。
- **权限校验**：修改/删除物品仅作者本人可操作，返回 `403`；撤回消息仅发送者本人可操作。
- **业务规则校验**：密码长度 ≥ 6、用户名/邮箱唯一、消息撤回时间 ≤ 60 秒、物品状态转移规则（寻物只能转 `resolved`，招领只能转 `claimed`）。
- **文件上传校验**：扩展名白名单（jpg/jpeg/png/webp）、大小上限 2MB。
- **JWT 异常处理**：token 过期 / 无效 / 缺失时返回 401，前端 `validateToken()` 自动清理本地存储并跳转登录页。
- **时区一致性**：所有时间戳使用 UTC 存储，返回时显式附加 `+00:00` 时区信息，避免客户端时区错乱导致消息撤回计算错误。
- **删除联动**：删除物品时同步清理关联的消息和通知，避免脏数据。
- **日志记录**：所有 API 请求、错误信息、注册/登录行为都写入 `backend/app.log`，便于排查问题。

---

## 📚 相关文档

- [Prompt 日志](./docs/prompt_log.md) — AI 辅助开发全过程记录
- [开发截图](./screenshots/) — 与 prompt_log 一一对应的截图

---

## 📝 Git 提交规范

本项目遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

- `feat:` 新功能（如 `feat: add vercel.json for frontend deployment`）
- `fix:` Bug 修复（如 `fix: 修复 fetchMyMatches 中 match 请求未携带 Authorization header 导致 401`）
- `docs:` 文档更新
- `chore:` 杂项

提交跨越多个日期（2026-07-13 至 2026-07-19），确保过程可追溯。

---

## 👤 作者

- GitHub：[@008jxy](https://github.com/008jxy)
- 项目仓库：https://github.com/008jxy/lost-find-system

---

