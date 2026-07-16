import requests

# 测试items接口
url = 'http://localhost:5000/api/items'

try:
    response = requests.get(url)
    print(f'items接口状态码: {response.status_code}')
    print(f'响应长度: {len(response.text)}')
except Exception as e:
    print(f'items接口错误: {e}')

# 测试conversations接口（无token）
url = 'http://localhost:5000/api/conversations'
try:
    response = requests.get(url)
    print(f'\nconversations接口状态码: {response.status_code}')
    print(f'响应: {response.text}')
except Exception as e:
    print(f'\nconversations接口错误: {e}')
