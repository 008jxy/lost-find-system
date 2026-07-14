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
    avatar = db.Column(db.String(255), default='')
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

    if not username or not email or not password:
        return jsonify({"code": 400, "msg": "用户名、邮箱、密码不能为空"}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"code": 400, "msg": "用户名已存在"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"code": 400, "msg": "邮箱已被注册"}), 400

    user = User(username=username, email=email)
    user.set_password(password)
    default_avatars = [
        'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=4',
        'https://api.dicebear.com/7.x/avataaars/svg?seed=5',
    ]
    user.avatar = default_avatars[hash(username) % len(default_avatars)]
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
            "avatar": user.avatar
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
            "avatar": user.avatar,
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
    pending_count = Item.query.filter_by(user_id=user_id, status='pending').count()
    
    return jsonify({
        "code": 200,
        "data": {
            "total": total_count,
            "claimed": claimed_count,
            "pending": pending_count
        }
    })

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
    items = Item.query.order_by(Item.created_at.desc()).all()
    result = [{
        "id": item.id,
        "user_id": item.user_id,
        "title": item.title,
        "category": item.category,
        "description": item.description,
        "contact": item.contact,
        "found_time": item.found_time,
        "found_location": item.found_location,
        "image": item.image,
        "status": item.status,
        "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    } for item in items]
    return jsonify(result)

@app.route("/api/items", methods=["POST"])
@jwt_required()
def create_item():
    user_id_str = get_jwt_identity()
    
    title = request.form.get('title')
    category = request.form.get('category')
    description = request.form.get('description')
    contact = request.form.get('contact')
    found_time = request.form.get('found_time', '')
    found_location = request.form.get('found_location', '')
    
    if not title or not category or not description or not contact:
        return jsonify({"code": 400, "msg": "标题、类型、描述、联系方式不能为空"}), 400
    
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
        image=image_url,
        status='pending'
    )
    db.session.add(new_item)
    db.session.commit()

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
            "image": item.image,
            "status": item.status,
            "created_at": item.created_at.strftime("%Y-%m-%d %H:%M:%S")
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

# ========== AI匹配接口 ==========
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