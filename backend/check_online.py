import urllib.request
import json

url = "https://008jxy.pythonanywhere.com/api/items"
req = urllib.request.Request(url)
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))

print('总帖子数:', len(data))
print()
for item in data:
    print(f"id={item['id']}, title={item['title']}")
    print(f"  category={item['category']}, status={item['status']}")
    print(f"  description={item['description']}")
    print(f"  item_type={item['item_type']}, campus={item['campus']}")
    print()
