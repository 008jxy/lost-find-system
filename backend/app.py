from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime
import bcrypt
import os
import uuid

app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///lost_find.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = 'super-secret-key-change-in-production'
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'avatars')
app.config['ITEM_IMAGE_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads', 'items')
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024

os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(app.config['ITEM_IMAGE_FOLDER'], exist_ok=True)

db = SQLAlchemy(app)
jwt = JWTManager(app)

# ========== 数据库模型 ==========
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), default='/avatar-male.jpg')
    gender = db.Column(db.String(10), default='male')
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
    found_time = db.Column(db.String(50), default='')
    found_location = db.Column(db.String(200), default='')
    campus = db.Column(db.String(20), default='kangmei')
    image = db.Column(db.String(255), default='')
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

# 创建数据库表
with app.app_context():
    db.create_all()

# ========== 连通性测试接口 ==========
@app.route("/api/test", methods=["GET"])
def test_api():
    return {
        "code": 200,
        "msg": "后端服务运行正常",
        "data": "失物招领系统基础接口连通成功"
    }

# ========== 用户认证接口 ==========
@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    gender = data.get('gender', 'male')

    if not username or not email or not password:
        return jsonify({"code": 400, "msg": "用户名、邮箱、密码不能为空"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"code": 400, "msg": "用户名已存在"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"code": 400, "msg": "邮箱已被注册"}), 400

    if gender not in ['male', 'female']:
        gender = 'male'

    user = User(username=username, email=email, gender=gender)
    user.set_password(password)
    user.avatar = '/avatar-female.jpg' if gender == 'female' else '/avatar-male.jpg'
    db.session.add(user)
    db.session.commit()

    return jsonify({"code": 200, "msg": "注册成功", "data": {"username": username, "avatar": user.avatar}}), 201

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

    access_token = create_access_token(identity=str(user.id))
    return jsonify({
        "code": 200,
        "msg": "登录成功",
        "data": {
            "token": access_token,
            "username": user.username,
            "user_id": user.id,
            "avatar": user.avatar if user.avatar else '/avatar-male.jpg'
        }
    })

@app.route("/api/user", methods=["GET"])
@jwt_required()
def get_user():
    user_id_str = get_jwt_identity()
    user = User.query.get(int(user_id_str))
    if not user:
        return jsonify({"code": 404, "msg": "用户不存在"}), 404
    return jsonify({
        "code": 200,
        "data": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar": user.avatar if user.avatar else '/avatar-male.jpg',
            "created_at": user.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

@app.route("/api/user", methods=["PUT"])
@jwt_required()
def update_user():
    user_id_str = get_jwt_identity()
    user = User.query.get(int(user_id_str))
    if not user:
        return jsonify({"code": 404, "msg": "用户不存在"}), 404

    data = request.get_json()
    update_fields = {}

    if 'username' in data:
        new_username = data['username'].strip()
        if not new_username:
            return jsonify({"code": 400, "msg": "用户名不能为空"}), 400
        if new_username != user.username:
            if User.query.filter_by(username=new_username).first():
                return jsonify({"code": 400, "msg": "用户名已存在"}), 400
            user.username = new_username
            update_fields['username'] = new_username

    if 'password' in data:
        new_password = data['password']
        old_password = data.get('old_password')
        
        if not old_password:
            return jsonify({"code": 400, "msg": "请输入原密码"}), 400
        
        if not user.check_password(old_password):
            return jsonify({"code": 400, "msg": "原密码错误"}), 400
        
        if not new_password or len(new_password) < 6:
            return jsonify({"code": 400, "msg": "新密码长度不能少于6位"}), 400
        
        user.set_password(new_password)
        update_fields['password'] = 'updated'

    db.session.commit()

    return jsonify({
        "code": 200,
        "msg": "更新成功",
        "data": {
            "username": user.username
        }
    })

@app.route("/api/user/stats", methods=["GET"])
@jwt_required()
def get_user_stats():
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    
    total_count = Item.query.filter_by(user_id=user_id).count()
    claimed_count = Item.query.filter_by(user_id=user_id, status='claimed').count()
    resolved_count = Item.query.filter_by(user_id=user_id, status='resolved').count()
    pending_count = Item.query.filter_by(user_id=user_id, status='pending').count()
    
    return jsonify({
        "code": 200,
        "data": {
            "total": total_count,
            "claimed": claimed_count,
            "resolved": resolved_count,
            "completed": claimed_count + resolved_count,
            "pending": pending_count
        }
    })

@app.route("/api/user/posts", methods=["GET"])
@jwt_required()
def get_user_posts():
    user_id_str = get_jwt_identity()
    user_id = int(user_id_str)
    
    items = Item.query.filter_by(user_id=user_id).order_by(Item.created_at.desc()).all()
    
    result = [{
        "id": item.id,
        "title": item.title,
        "category": item.category,
        "description": item.description,
        "contact": item.contact,
        "campus": item.campus,
        "image": item.image,
        "status": item.status,
        "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for item in items]
    
    return jsonify({"code": 200, "data": result})

@app.route("/api/upload/avatar", methods=["POST"])
@jwt_required()
def upload_avatar():
    user_id_str = get_jwt_identity()
    user = User.query.get(int(user_id_str))
    
    if not user:
        return jsonify({"code": 404, "msg": "用户不存在"}), 404
    
    if 'file' not in request.files:
        return jsonify({"code": 400, "msg": "请选择上传的图片"}), 400
    
    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"code": 400, "msg": "请选择上传的图片"}), 400
    
    allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
    if '.' not in file.filename or file.filename.rsplit('.', 1)[1].lower() not in allowed_extensions:
        return jsonify({"code": 400, "msg": "仅支持jpg、png、webp格式的图片"}), 400
    
    if file.content_length > app.config['MAX_CONTENT_LENGTH']:
        return jsonify({"code": 400, "msg": "图片大小不能超过2MB"}), 400
    
    filename = f"{uuid.uuid4().hex}.{file.filename.rsplit('.', 1)[1].lower()}"
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(file_path)
    
    user.avatar = f"http://localhost:5000/uploads/avatars/{filename}"
    db.session.commit()
    
    return jsonify({
        "code": 200,
        "msg": "头像上传成功",
        "data": {"avatar": user.avatar}
    })

# 头像静态文件服务
@app.route("/uploads/avatars/<filename>")
def serve_avatar(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 物品图片静态文件服务
@app.route("/uploads/items/<filename>")
def serve_item_image(filename):
    return send_from_directory(app.config['ITEM_IMAGE_FOLDER'], filename)

# ========== 物品接口 ==========
@app.route("/api/items", methods=["GET"])
def get_items():
    campus = request.args.get('campus', '')
    
    query = Item.query
    if campus and campus in ['kangmei', 'meilin']:
        query = query.filter_by(campus=campus)
    
    items = query.order_by(Item.created_at.desc()).all()
    result = []
    for item in items:
        user = User.query.get(item.user_id)
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "contact": item.contact,
            "found_time": item.found_time,
            "found_location": item.found_location,
            "campus": item.campus,
            "image": item.image,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "user": {
                "id": user.id,
                "username": user.username,
                "avatar": user.avatar
            } if user else None
        })
    return jsonify(result)

@app.route("/api/items", methods=["POST"])
@jwt_required()
def create_item():
    user_id_str = get_jwt_identity()
    
    title = request.form.get('title')
    category = request.form.get('category')
    description = request.form.get('description')
    contact = request.form.get('contact')
    campus = request.form.get('campus', 'kangmei')
    found_time = request.form.get('found_time', '')
    found_location = request.form.get('found_location', '')
    
    if not title or not category or not description or not contact or not campus:
        return jsonify({"code": 400, "msg": "标题、类型、描述、联系方式、校区不能为空"}), 400
    
    if campus not in ['kangmei', 'meilin']:
        campus = 'kangmei'
    
    image_url = ''
    if 'image' in request.files:
        file = request.files['image']
        if file.filename != '':
            allowed_extensions = {'jpg', 'jpeg', 'png', 'webp'}
            if '.' in file.filename and file.filename.rsplit('.', 1)[1].lower() in allowed_extensions:
                filename = f"{uuid.uuid4().hex}.{file.filename.rsplit('.', 1)[1].lower()}"
                file_path = os.path.join(app.config['ITEM_IMAGE_FOLDER'], filename)
                file.save(file_path)
                image_url = f"http://localhost:5000/uploads/items/{filename}"
    
    new_item = Item(
        user_id=int(user_id_str),
        title=title,
        category=category,
        description=description,
        contact=contact,
        found_time=found_time,
        found_location=found_location,
        campus=campus,
        image=image_url,
        status='pending'
    )
    db.session.add(new_item)
    db.session.commit()

    trigger_match_and_notify(new_item)

    return jsonify({
        "code": 200,
        "msg": "发布成功",
        "data": {
            "id": new_item.id,
            "user_id": new_item.user_id,
            "title": new_item.title,
            "category": new_item.category,
            "description": new_item.description,
            "contact": new_item.contact,
            "found_time": new_item.found_time,
            "found_location": new_item.found_location,
            "image": new_item.image,
            "status": new_item.status,
            "created_at": new_item.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    }), 201

@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        return jsonify({"code": 404, "msg": "物品未找到"}), 404
    
    user = User.query.get(item.user_id)
    
    return jsonify({
        "code": 200,
        "data": {
            "id": item.id,
            "user_id": item.user_id,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "contact": item.contact,
            "found_time": item.found_time,
            "found_location": item.found_location,
            "campus": item.campus,
            "image": item.image,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "user": {
                "id": user.id,
                "username": user.username,
                "avatar": user.avatar
            } if user else None
        }
    })

@app.route("/api/items/<int:item_id>", methods=["PUT"])
@jwt_required()
def update_item(item_id):
    user_id_str = get_jwt_identity()
    item = Item.query.get(item_id)
    
    if not item:
        return jsonify({"code": 404, "msg": "物品未找到"}), 404
    
    if item.user_id != int(user_id_str):
        return jsonify({"code": 403, "msg": "无权限修改此物品"}), 403
    
    data = request.get_json()
    
    if 'title' in data:
        item.title = data['title']
    if 'description' in data:
        item.description = data['description']
    if 'contact' in data:
        item.contact = data['contact']
    if 'found_time' in data:
        item.found_time = data['found_time']
    if 'found_location' in data:
        item.found_location = data['found_location']
    if 'campus' in data:
        item.campus = data['campus']
    
    if 'status' in data:
        new_status = data['status']
        if item.category == 'lost':
            if new_status not in ['pending', 'resolved']:
                return jsonify({"code": 400, "msg": "寻物帖子仅支持待认领和已解决状态"}), 400
        else:
            if new_status not in ['pending', 'claimed']:
                return jsonify({"code": 400, "msg": "招领帖子仅支持待认领和已认领状态"}), 400
        item.status = new_status
    
    db.session.commit()
    
    return jsonify({
        "code": 200,
        "msg": "更新成功",
        "data": {
            "id": item.id,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "contact": item.contact,
            "found_time": item.found_time,
            "found_location": item.found_location,
            "campus": item.campus,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
    })

@app.route("/api/items/<int:item_id>", methods=["DELETE"])
@jwt_required()
def delete_item(item_id):
    user_id_str = get_jwt_identity()
    item = Item.query.get(item_id)
    
    if not item:
        return jsonify({"code": 404, "msg": "物品未找到"}), 404
    
    if item.user_id != int(user_id_str):
        return jsonify({"code": 403, "msg": "无权限删除此物品"}), 403
    
    db.session.delete(item)
    db.session.commit()
    
    return jsonify({"code": 200, "msg": "删除成功"})

@app.route("/api/items/search", methods=["GET"])
def search_items():
    keyword = request.args.get('keyword', '')
    category = request.args.get('category', 'all')
    campus = request.args.get('campus', '')
    
    query = Item.query
    
    if keyword:
        query = query.filter(
            (Item.title.ilike(f'%{keyword}%')) | 
            (Item.description.ilike(f'%{keyword}%'))
        )
    
    if category != 'all':
        query = query.filter_by(category=category)
    
    if campus and campus in ['kangmei', 'meilin']:
        query = query.filter_by(campus=campus)
    
    items = query.all()
    
    result = []
    for item in items:
        user = User.query.get(item.user_id)
        result.append({
            "id": item.id,
            "user_id": item.user_id,
            "title": item.title,
            "category": item.category,
            "description": item.description,
            "contact": item.contact,
            "found_time": item.found_time,
            "found_location": item.found_location,
            "campus": item.campus,
            "image": item.image,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "user": {
                "id": user.id,
                "username": user.username,
                "avatar": user.avatar
            } if user else None
        })
    
    return jsonify(result)

# ========== 通知接口 ==========
@app.route("/api/notifications", methods=["GET"])
@jwt_required()
def get_notifications():
    user_id_str = get_jwt_identity()
    user_id_int = int(user_id_str)
    
    notifications = Notification.query.filter_by(user_id=user_id_int).order_by(Notification.created_at.desc()).all()
    
    result = [{
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "related_item_id": n.related_item_id,
        "read": n.read,
        "created_at": n.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for n in notifications]
    
    unread_count = Notification.query.filter_by(user_id=user_id_int, read=False).count()
    
    return jsonify({"notifications": result, "unread_count": unread_count})

@app.route("/api/notifications/<int:notification_id>/read", methods=["PUT"])
@jwt_required()
def mark_notification_read(notification_id):
    user_id_str = get_jwt_identity()
    user_id_int = int(user_id_str)
    
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({"code": 404, "msg": "通知不存在"}), 404
    
    if notification.user_id != user_id_int:
        return jsonify({"code": 403, "msg": "无权限操作此通知"}), 403
    
    notification.read = True
    db.session.commit()
    
    return jsonify({"code": 200, "msg": "已标记为已读"})

@app.route("/api/notifications/<int:notification_id>", methods=["DELETE"])
@jwt_required()
def delete_notification(notification_id):
    user_id_str = get_jwt_identity()
    user_id_int = int(user_id_str)
    
    notification = Notification.query.get(notification_id)
    if not notification:
        return jsonify({"code": 404, "msg": "通知不存在"}), 404
    
    if notification.user_id != user_id_int:
        return jsonify({"code": 403, "msg": "无权限删除此通知"}), 403
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({"code": 200, "msg": "删除成功"})

# ========== AI匹配接口 ==========
@app.route("/api/match", methods=["POST"])
def ai_match():
    data = request.get_json()
    description = data.get('description', '')
    title = data.get('title', '')
    category = data.get('category', 'lost')
    
    if not description:
        return jsonify({"code": 400, "msg": "请输入描述内容"}), 400
    
    full_text = f"{title} {description}"
    target_category = 'found' if category == 'lost' else 'lost'
    items = Item.query.filter_by(category=target_category, status='pending').all()
    
    matches = []
    for item in items:
        item_full_text = f"{item.title} {item.description}"
        similarity = calculate_similarity(full_text, item_full_text)
        if similarity > 0.3:
            matches.append({
                "item_id": item.id,
                "title": item.title,
                "description": item.description,
                "contact": item.contact,
                "category": item.category,
                "status": item.status,
                "similarity": round(similarity * 100, 2)
            })
    
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    return jsonify({"code": 200, "matches": matches[:5]})

@app.route("/api/match/all", methods=["GET"])
def ai_match_all():
    lost_items = Item.query.filter_by(category='lost', status='pending').all()
    found_items = Item.query.filter_by(category='found', status='pending').all()
    
    matches = []
    for lost in lost_items:
        for found in found_items:
            lost_text = f"{lost.title} {lost.description}"
            found_text = f"{found.title} {found.description}"
            similarity = calculate_similarity(lost_text, found_text)
            if similarity > 0.4:
                matches.append({
                    "lost_item": {
                        "id": lost.id,
                        "title": lost.title,
                        "description": lost.description,
                        "contact": lost.contact,
                        "user_id": lost.user_id
                    },
                    "found_item": {
                        "id": found.id,
                        "title": found.title,
                        "description": found.description,
                        "contact": found.contact,
                        "user_id": found.user_id
                    },
                    "similarity": round(similarity * 100, 2)
                })
    
    matches.sort(key=lambda x: x['similarity'], reverse=True)
    
    return jsonify({"matches": matches[:10]})

def trigger_match_and_notify(new_item):
    target_category = 'found' if new_item.category == 'lost' else 'lost'
    target_items = Item.query.filter_by(category=target_category, status='pending').all()
    
    new_text = f"{new_item.title} {new_item.description}"
    
    for item in target_items:
        if item.id == new_item.id:
            continue
        
        item_text = f"{item.title} {item.description}"
        similarity = calculate_similarity(new_text, item_text)
        
        if similarity > 0.4:
            if new_item.category == 'lost':
                notification_title = '🔍 发现相似招领帖'
                notification_content = f'您发布的"{new_item.title}"与"{item.title}"相似度达{round(similarity*100, 1)}%，可能是您寻找的物品！'
                notify_user(new_item.user_id, notification_title, notification_content, item.id)
                
                notification_title = '🔔 发现相似寻物帖'
                notification_content = f'您发布的"{item.title}"与"{new_item.title}"相似度达{round(similarity*100, 1)}%，可能是失主发布的！'
                notify_user(item.user_id, notification_title, notification_content, new_item.id)
            else:
                notification_title = '🔍 发现相似寻物帖'
                notification_content = f'您发布的"{new_item.title}"与"{item.title}"相似度达{round(similarity*100, 1)}%，可能是失主发布的！'
                notify_user(new_item.user_id, notification_title, notification_content, item.id)
                
                notification_title = '🔔 发现相似招领帖'
                notification_content = f'您发布的"{item.title}"与"{new_item.title}"相似度达{round(similarity*100, 1)}%，可能是您寻找的物品！'
                notify_user(item.user_id, notification_title, notification_content, new_item.id)

def notify_user(user_id, title, content, related_item_id=None):
    notification = Notification(
        user_id=user_id,
        title=title,
        content=content,
        related_item_id=related_item_id,
        read=False
    )
    db.session.add(notification)
    db.session.commit()

def tokenize(text):
    import re
    text = text.lower()
    text = re.sub(r'[^\w\s]', '', text)
    words = text.split()
    return words

def calculate_similarity(text1, text2):
    words1 = tokenize(text1)
    words2 = tokenize(text2)
    
    if not words1 or not words2:
        return 0
    
    set1 = set(words1)
    set2 = set(words2)
    
    if not set1 or not set2:
        return 0
    
    intersection = set1 & set2
    union = set1 | set2
    jaccard = len(intersection) / len(union)
    
    common_words = list(intersection)
    if common_words:
        for word in common_words:
            count1 = words1.count(word)
            count2 = words2.count(word)
            jaccard += min(count1, count2) * 0.1
    
    return min(jaccard, 1.0)

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)