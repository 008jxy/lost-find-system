from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# 连通性测试接口
@app.route("/api/test", methods=["GET"])
def test_api():
    return {
        "code": 200,
        "msg": "后端服务运行正常",
        "data": "失物招领系统基础接口连通成功"
    }

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
