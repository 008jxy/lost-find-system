import sys
import os

sys.path.insert(0, '/home/008jxy/lost-find-system/backend')

os.environ['FLASK_ENV'] = 'production'
os.environ['FLASK_DEBUG'] = 'False'
os.environ['JWT_SECRET_KEY'] = 'your-secret-key-123'
os.environ['SERVER_URL'] = 'https://008jxy.pythonanywhere.com'

from app import application