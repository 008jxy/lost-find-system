import pytest
import os
import sys

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(TEST_DIR)
sys.path.insert(0, BACKEND_DIR)

from app import app, db

@pytest.fixture
def client():
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
        yield client
        with app.app_context():
            db.drop_all()

def test_register(client):
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    data = response.get_json()
    assert response.status_code == 201
    assert data['code'] == 200
    assert data['msg'] == '注册成功'
    assert data['data']['username'] == 'testuser'

def test_register_duplicate_username(client):
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test2@example.com',
        'password': '123456',
        'gender': 'male'
    })
    data = response.get_json()
    assert data['code'] == 400
    assert data['msg'] == '用户名已存在'

def test_register_missing_fields(client):
    response = client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com'
    })
    data = response.get_json()
    assert data['code'] == 400
    assert data['msg'] == '用户名、邮箱、密码不能为空'

def test_login(client):
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    response = client.post('/api/login', json={
        'username': 'testuser',
        'password': '123456'
    })
    data = response.get_json()
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['msg'] == '登录成功'
    assert 'token' in data['data']

def test_login_invalid_credentials(client):
    response = client.post('/api/login', json={
        'username': 'nonexistent',
        'password': '123456'
    })
    data = response.get_json()
    assert data['code'] == 401
    assert data['msg'] == '用户名或密码错误'

def test_get_user(client):
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    login_response = client.post('/api/login', json={
        'username': 'testuser',
        'password': '123456'
    })
    token = login_response.get_json()['data']['token']
    
    response = client.get('/api/user', headers={'Authorization': f'Bearer {token}'})
    data = response.get_json()
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['data']['username'] == 'testuser'

def test_create_item(client):
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    login_response = client.post('/api/login', json={
        'username': 'testuser',
        'password': '123456'
    })
    token = login_response.get_json()['data']['token']
    
    response = client.post('/api/items', data={
        'title': '测试物品',
        'category': 'lost',
        'item_type': 'other',
        'description': '这是一个测试物品',
        'contact': '123456789',
        'campus': 'kangmei'
    }, headers={'Authorization': f'Bearer {token}'})
    data = response.get_json()
    assert response.status_code in [200, 201]
    assert data['code'] == 200
    assert data['msg'] == '发布成功'
    assert data['data']['title'] == '测试物品'

def test_create_item_missing_fields(client):
    client.post('/api/register', json={
        'username': 'testuser',
        'email': 'test@example.com',
        'password': '123456',
        'gender': 'male'
    })
    login_response = client.post('/api/login', json={
        'username': 'testuser',
        'password': '123456'
    })
    token = login_response.get_json()['data']['token']
    
    response = client.post('/api/items', data={
        'title': '测试物品',
        'category': 'lost'
    }, headers={'Authorization': f'Bearer {token}'})
    data = response.get_json()
    assert data['code'] == 400

def test_get_items(client):
    response = client.get('/api/items')
    data = response.get_json()
    assert response.status_code == 200
    assert isinstance(data, list)

def test_test_api(client):
    response = client.get('/api/test')
    data = response.get_json()
    assert response.status_code == 200
    assert data['code'] == 200
    assert data['msg'] == '后端服务运行正常'