import sys
sys.path.insert(0, '.')
from app import app, db, User

with app.app_context():
    users = User.query.all()
    print("当前用户列表：")
    for u in users:
        print(f"ID: {u.id}, 用户名: {u.username}, 邮箱: {u.email}")
    
    username = input("\n请输入要删除的用户名：")
    user = User.query.filter_by(username=username).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        print(f"✅ 已删除用户: {user.username}")
    else:
        print(f"❌ 未找到用户: {username}")