# AI辅助开发Prompt日志
说明：本文档记录项目开发中使用AI解决代码开发相关问题的对话，每条对话配套截图存放于同级 ../screenshots/ 文件夹.

## 1、项目初始化，搭建前后端目录结构
    -对话时间：2026-07-13 16:25  
    -对应功能：项目基础框架搭建  
    -对应文件：根目录 frontend/ 、backend/ 整体目录结构  
### 用户提问：
我要做失物招领AI实训系统，技术栈Next.js+Flask，现在第一步要做什么？
### AI回复内容
 完整分步操作
 第一步：本地创建项目根目录
1. 电脑空白位置新建文件夹，命名 `lost-find-system`
2. 用VS Code打开这个文件夹
 第二步：划分前后端文件夹
在根目录新建两个文件夹：
1. `frontend`：存放Next.js网页前端全部代码
2. `backend`：存放Flask Python后端、接口、AI匹配逻辑
 第三步：初始化Git版本仓库
1. VS Code左侧点击「源代码管理」图标
2. 点击「初始化仓库」，自动生成隐藏.git版本控制文件夹
3. 后续所有代码改动都会被记录，满足工程规范打分要求
 第四步：绑定远程GitHub仓库
1. 源代码管理面板 → 远程仓库 → 添加远程仓库
2. 粘贴你的仓库地址
3. 远程名称默认 `origin` 即可
 第五步：搭建前后端基础框架
后端Flask初始化
1. 进入backend文件夹，新建 `app.py` 主启动文件、`requirements.txt` 依赖文件
2. 写入Flask基础启动代码，保证本地能正常跑通服务
前端Next.js初始化
1. VS Code终端输入：`cd frontend`
2. 执行命令：`npx create-next-app .` 一键生成Next标准项目框架
3. 安装完成后运行 `npm run dev` 测试前端是否正常启动
 第六步：第一次规范提交代码到GitHub
1. 左侧源代码管理勾选所有新增文件
2. 提交描述填写规范内容：`feat: 初始化项目，搭建Next前端+Flask后端基础目录框架`
3. 点击提交，再推送至GitHub远程仓库
### 配套截图存放路径
screenshots/prompt1_搭建框架.png

## 2、检查前端页面完整性
    -对话时间：2026-07-13 21:15  
    -对应功能：前端页面规划  
    -对应文件：frontend/app/  
### 用户提问：
你觉得前端这些tab全了吗
### AI回复内容
当前前端已有6个路由页面：
1. 首页 / - 帖子列表、Tab切换（全部/寻物/招领）
2. 发布 /post - 发布帖子（需登录）
3. 我的 /profile - 个人中心、登录/注册
4. 通知 /notifications - AI匹配通知
5. AI匹配 /match - 测试匹配功能
6. 登录/注册 /login /register
已满足。
### 配套截图存放路径
screenshots/prompt2_页面完整性检查.png

## 3、实现用户认证API（注册/登录）
    -对话时间：2026-07-13 21:30  
    -对应功能：用户认证后端  
    -对应文件：backend/app.py  
### 用户提问：
帮我实现用户认证API（注册/登录）
### AI回复内容
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
app = Flask(__name__)
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lost_find.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-in-production'
db = SQLAlchemy(app)
jwt = JWTManager(app)
#### ========== 数据库模型 ==========
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
class Item(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(10), nullable=False)
    description = db.Column(db.Text, nullable=False)
    contact = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), default='pending')
    created_at = db.Column(db.DateTime, default=datetime.now)
class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    title = db.Column(db.String(100), nullable=False)
    content = db.Column(db.Text, nullable=False)
    related_item_id = db.Column(db.Integer)
    read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
#### 创建数据库表
with app.app_context():
    db.create_all()
#### ========== 连通性测试接口 ==========
@app.route("/api/test", methods=["GET"])
def test_api():
    return {
        "code": 200,
        "msg": "后端服务运行正常",
        "data": "失物招领系统基础接口连通成功"
    }
#### ========== 用户认证接口 ==========
##### 1. 用户注册
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    if not username or not email or not password:
        return jsonify({"code": 400, "msg": "用户名、邮箱、密码不能为空"}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"code": 400, "msg": "用户名已存在"}), 400
    if User.query.filter_by(email=email).first():
        return jsonify({"code": 400, "msg": "邮箱已被注册"}), 400
    user = User(username=username, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"code": 200, "msg": "注册成功", "data": {"username": username}}), 201
##### 2. 用户登录
@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"code": 400, "msg": "用户名和密码不能为空"}), 400
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"code": 401, "msg": "用户名或密码错误"}), 401
    access_token = create_access_token(identity={"id": user.id, "username": user.username})
    return jsonify({
        "code": 200,
        "msg": "登录成功",
        "data": {
            "token": access_token,
            "username": user.username,
            "user_id": user.id
        }
    })
##### 3. 获取当前用户信息
@app.route("/api/user", methods=["GET"])
@jwt_required()
def get_user():
    current_user = get_jwt_identity()
    user = User.query.get(current_user['id'])
    if not user:
        return jsonify({"code": 404, "msg": "用户不存在"}), 404
    return jsonify({
        "code": 200,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    })
#### ========== 物品接口 ==========
##### 1. 获取所有物品列表
@app.route("/api/items", methods=["GET"])
def get_items():
    items = Item.query.order_by(Item.created_at.desc()).all()
    result = [{
        "id": item.id,
        "user_id": item.user_id,
        "title": item.title,
        "category": item.category,
        "description": item.description,
        "contact": item.contact,
        "status": item.status,
        "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for item in items]
    return jsonify(result)
##### 2. 发布新物品（需登录）
@app.route("/api/items", methods=["POST"])
@jwt_required()
def create_item():
    current_user = get_jwt_identity()
    data = request.get_json()
    new_item = Item(
        user_id=current_user['id'],
        title=data.get('title'),
        category=data.get('category'),
        description=data.get('description'),
        contact=data.get('contact'),
        status='pending'
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify({
        "id": new_item.id,
        "user_id": new_item.user_id,
        "title": new_item.title,
        "category": new_item.category,
        "description": new_item.description,
        "contact": new_item.contact,
        "status": new_item.status,
        "created_at": new_item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    }), 201
##### 3. 获取单个物品详情
@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "物品未找到"}), 404
    return jsonify({
        "id": item.id,
        "user_id": item.user_id,
        "title": item.title,
        "category": item.category,
        "description": item.description,
        "contact": item.contact,
        "status": item.status,
        "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    })
##### 4. 更新物品状态（认领/解决）（需登录）
@app.route("/api/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    current_user = get_jwt_identity()
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "物品未找到"}), 404
    if item.user_id != current_user['id']:
        return jsonify({"error": "无权限修改此物品"}), 403
    data = request.get_json()
    item.status = data.get("status", item.status)
    db.session.commit()
    return jsonify({
        "id": item.id,
        "status": item.status
    })
##### 5. 删除物品（需登录）
@app.route("/api/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    current_user = get_jwt_identity()
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"error": "物品未找到"}), 404
    if item.user_id != current_user['id']:
        return jsonify({"error": "无权限删除此物品"}), 403
    db.session.delete(item)
    db.session.commit()
    return jsonify({"msg": "删除成功"})
#### ========== 通知接口 ==========
@app.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    current_user = get_jwt_identity()
    notifications = Notification.query.filter_by(user_id=current_user['id']).order_by(Notification.created_at.desc()).all()
    result = [{
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "related_item_id": n.related_item_id,
        "read": n.read,
        "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for n in notifications]
    unread_count = Notification.query.filter_by(user_id=current_user['id'], read=False).count()
    return jsonify({"notifications": result, "unread_count": unread_count})
#### ========== AI匹配接口 ==========
@app.route("/api/match", methods=["POST"])
def ai_match():
    data = request.get_json()
    description = data.get('description', '')
    category = data.get('category', 'lost')
    if not description:
        return jsonify({"code": 400, "msg": "请输入描述内容"}), 400
    target_category = 'found' if category == 'lost' else 'lost'
    items = Item.query.filter_by(category=target_category, status='pending').all()
    matches = []
    for item in items:
        similarity = calculate_similarity(description, item.description)
        if similarity > 0.3:
            matches.append({
                "item_id": item.id,
                "title": item.title,
                "description": item.description,
                "similarity": round(similarity * 100, 2)
            })
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    return jsonify({"code": 200, "matches": matches[:5]})
def calculate_similarity(text1, text2):
    words1 = set(text1.lower())
    words2 = set(text2.lower())
    if not words1 or not words2:
        return 0
    intersection = words1 & words2
    union = words1 | words2
    return len(intersection) / len(union)
if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
### 配套截图存放路径
screenshots/prompt3_用户认证API.png

## 4、实现头像管理功能
    -对话时间：2026-07-14 01:00  
    -对应功能：头像上传与管理  
    -对应文件：backend/app.py, frontend/app/profile/page.tsx, frontend/app/login/page.tsx  
### 用户提问：
基于现有注册登录体系，在"我的"页面扩展头像管理能力：用户首次注册默认分配系统头像，后续可通过本地图片上传自定义头像，需满足格式校验（jpg/png/webp）、大小限制（≤2MB）、上传加载反馈，并确保头像 URL 随用户信息持久化存储，支持退出重登后依然正确展示，前后端协同实现完整闭环。
### AI回复内容
    -后端：User模型添加avatar字段，修改注册/登录接口支持头像  
    -后端：添加头像上传API（格式校验、大小限制）  
    -后端：创建头像存储目录，配置静态文件服务  
    -前端：Profile页面实现头像展示和上传功能  
    -前端：实现格式校验、大小限制、上传加载反馈  
    -测试：注册新用户、上传头像、退出重登验证  
### 配套截图存放路径
screenshots/prompt4_头像上传.png

## 5、实现发布归属与统计闭环
    -对话时间：2026-07-14 15:49  
    -对应功能：帖子发布归属与用户统计  
    -对应文件：backend/app.py, frontend/app/profile/page.tsx  
### 用户提问：
帮我完成发布功能，当前发布只能实现简单的发布，但未关联用户，需在 POST /api/items 中从 JWT 提取 user_id 写入数据库，并在 /profile 页面新增 /api/user/stats 接口，返回当前用户的帖子总数、已认领数、待处理数，替换前端硬编码的 0，实现发布归属与统计闭环
### AI回复内容
实现发布归属与统计闭环：
1. 后端修改：
   - POST /api/items：从JWT提取user_id，关联到发布的帖子
   - 新增 GET /api/user/stats：返回当前用户的帖子统计（总数、已认领、待处理）
2. 前端修改：
   - Profile页面：调用统计接口，动态显示用户帖子数据
   - 替换硬编码的0为实际统计值
### 配套截图存放路径
screenshots/prompt5_发布统计.png

## 6、实现帖子详情页与发布页的图片上传功能
    -对话时间：2026-07-14 16:20  
    -对应功能：帖子详情页、图片上传、状态操作  
    -对应文件：backend/app.py, frontend/app/items/[id]/page.tsx, frontend/app/post/page.tsx, frontend/app/page.tsx  
### 用户提问：
在现有失物招领系统基础上，扩展两个核心交互模块：1）帖子详情页，支持通过首页点击进入，展示完整信息（标题、分类、状态、描述、联系方式、发布时间），并支持发布者本人操作状态变更（认领/解决）；2）发布功能增强，支持用户在发布时上传图片（单张即可），并在详情页支持点击图片放大预览。后端需提供图片上传接口与静态访问服务，前端需实现缩略图展示与图片预览弹窗，确保格式校验（jpg/png/webp）与大小限制（≤2MB），整体形成发布→展示→交互的完整闭环。
### AI回复内容
实现帖子详情页与图片上传功能：
1. 后端修改：
   - Item模型添加image字段
   - 添加物品图片静态文件服务（/uploads/items/）
   - 修改发布接口支持multipart/form-data和图片上传
   - 修改获取单个物品接口返回image字段
2. 前端修改：
   - 创建详情页（/items/[id]）：展示完整信息、状态操作按钮、图片预览弹窗
   - 修改发布页：支持图片上传、预览、格式校验、大小限制
   - 修改首页：帖子卡片支持点击跳转、显示缩略图
### 配套截图存放路径
screenshots/prompt6_详情页.png

## 7、修复会话管理问题
    -对话时间：2026-07-14 19:30  
    -对应功能：用户认证、会话管理  
    -对应文件：frontend/app/utils/auth.ts, frontend/app/profile/page.tsx, frontend/app/post/page.tsx, frontend/app/notifications/page.tsx  
### 用户提问：
会话管理有问题：退出登录后刷新页面，“我的”页面还显示用户信息，但点击发布又提示登录过期。需要统一检查 token 有效性，失效时自动清除本地存储并跳转登录页，保证未登录状态下不显示任何用户信息。
### AI回复内容
实现统一的会话管理机制：
1. 创建统一认证工具 `utils/auth.ts`：
   - `clearAuthStorage()`：统一清除所有认证相关的 localStorage 数据（token、username、user_id、avatar）
   - `validateToken()`：调用后端 `/api/user` 接口验证 token 有效性，失效时自动清除存储
2. 更新 profile 页面：页面加载时先调用 `validateToken()` 验证 token，验证失败时清除 localStorage 并显示登录页面
3. 更新 post 页面：使用统一的 `validateToken()` 验证，失效时自动跳转登录页
4. 更新 notifications 页面：使用统一的 `validateToken()` 验证，失效时自动跳转登录页
### 配套截图存放路径
screenshots/prompt7_会话管理修复.png

## 8、实现AI智能匹配功能
    -对话时间：2026-07-14 21:00  
    -对应功能：AI匹配、自动通知  
    -对应文件：backend/app.py, frontend/app/match/page.tsx  
### 用户提问：
基于现有失物招领系统，实现AI智能匹配功能，寻物帖找到对应的招领帖，招领帖找到对应的寻物帖。匹配结果只返回状态为“pending”（待处理）的帖子，已解决或已认领的不参与匹配。
### AI回复内容
实现AI智能匹配功能：
1. 后端改进匹配算法：使用Jaccard相似度+词频加权，同时考虑标题和描述
2. 添加全量匹配接口 /api/match/all：遍历所有待处理帖子进行交叉匹配
3. 发布后自动触发匹配：调用trigger_match_and_notify()函数，匹配成功向双方发送通知
4. 前端优化：登录后自动展示用户帖子的匹配结果，支持测试匹配和全量匹配
5. 匹配规则：寻物↔招领互相匹配，只匹配pending状态，相似度>40%触发通知
### 配套截图存放路径
screenshots/prompt8_AI匹配功能.png