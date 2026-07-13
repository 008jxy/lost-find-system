from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime

app = Flask(__name__)
CORS(app)

# ========== 模拟数据（系统自带两条示例，让你马上能看到效果）==========
items = [
    {
        "id": 1,
        "title": "蓝色水杯",
        "category": "lost",
        "description": "在图书馆3楼自习室丢失，蓝色带杯套",
        "contact": "138xxxx1234",
        "status": "pending",
        "created_at": "2026-07-12 10:00:00"
    },
    {
        "id": 2,
        "title": "黑色书包",
        "category": "found",
        "description": "在食堂二楼捡到一个黑色双肩包，内有书本",
        "contact": "139xxxx5678",
        "status": "pending",
        "created_at": "2026-07-12 14:30:00"
    }
]
next_id = 3

# ========== 连通性测试接口（保留）==========
@app.route("/api/test", methods=["GET"])
def test_api():
    return {
        "code": 200,
        "msg": "后端服务运行正常",
        "data": "失物招领系统基础接口连通成功"
    }

# ========== 核心业务接口 ==========
# 1. 获取所有物品列表
@app.route("/api/items", methods=["GET"])
def get_items():
    return jsonify(items)

# 2. 发布新物品
@app.route("/api/items", methods=["POST"])
def create_item():
    global next_id
    data = request.get_json()
    new_item = {
        "id": next_id,
        "title": data.get("title"),
        "category": data.get("category"),
        "description": data.get("description"),
        "contact": data.get("contact"),
        "status": "pending",
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    items.append(new_item)
    next_id += 1
    return jsonify(new_item), 201

# 3. 获取单个物品详情
@app.route("/api/items/<int:item_id>", methods=["GET"])
def get_item(item_id):
    for item in items:
        if item["id"] == item_id:
            return jsonify(item)
    return jsonify({"error": "物品未找到"}), 404

# 4. 更新物品状态（认领/解决）
@app.route("/api/items/<int:item_id>", methods=["PUT"])
def update_item(item_id):
    data = request.get_json()
    for item in items:
        if item["id"] == item_id:
            item["status"] = data.get("status", item["status"])
            return jsonify(item)
    return jsonify({"error": "物品未找到"}), 404

# 5. 删除物品
@app.route("/api/items/<int:item_id>", methods=["DELETE"])
def delete_item(item_id):
    global items
    for i, item in enumerate(items):
        if item["id"] == item_id:
            deleted = items.pop(i)
            return jsonify(deleted)
    return jsonify({"error": "物品未找到"}), 404

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)