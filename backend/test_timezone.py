from datetime import datetime, timezone
from app import app, db

with app.app_context():
    now_utc = datetime.now(timezone.utc)
    print('=== 当前UTC时间 ===')
    print('datetime对象:', now_utc)
    print('isoformat():', now_utc.isoformat())
    
    print('\n=== 测试数据库存储 ===')
    from app import Message
    msg = Message(
        item_id=1,
        sender_id=1,
        receiver_id=2,
        content='测试消息'
    )
    db.session.add(msg)
    db.session.commit()
    
    stored_msg = Message.query.get(msg.id)
    print('存储后的时间:', stored_msg.created_at)
    print('存储后的tzinfo:', stored_msg.created_at.tzinfo)
    
    print('\n=== 测试修复后的输出 ===')
    print('使用replace(tzinfo=timezone.utc).isoformat():')
    print(stored_msg.created_at.replace(tzinfo=timezone.utc).isoformat())
    
    db.session.delete(msg)
    db.session.commit()
