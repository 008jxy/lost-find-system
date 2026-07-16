import sqlite3
conn = sqlite3.connect(r'd:\lost-find-system\backend\lost_find.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print('数据库中的表:', tables)
conn.close()
