import sqlite3

conn = sqlite3.connect('multichat.db')
cursor = conn.cursor()

cursor.execute('SELECT id, username, email, is_admin, is_active, balance FROM users')
users = cursor.fetchall()

print('\n=== Пользователи в базе данных ===')
if users:
    for user in users:
        print(f'ID: {user[0]}')
        print(f'Username: {user[1]}')
        print(f'Email: {user[2]}')
        print(f'Admin: {user[3]}')
        print(f'Active: {user[4]}')
        print(f'Balance: ${user[5]}')
        print('---')
else:
    print('❌ Пользователей нет!')

conn.close()
