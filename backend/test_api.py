import requests

url = 'http://localhost:5000/api/conversations'
headers = {'Authorization': 'Bearer test'}

try:
    response = requests.get(url, headers=headers)
    print(f'状态码: {response.status_code}')
    print(f'响应: {response.text}')
except Exception as e:
    print(f'错误: {e}')
