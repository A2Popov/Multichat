"""
Скрипт для сброса пароля пользователя
"""
import sys
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.auth import get_password_hash

def reset_password(username: str, new_password: str):
    """Сброс пароля пользователя"""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        if not user:
            print(f"❌ Пользователь '{username}' не найден!")
            return False
        
        # Хешируем новый пароль
        hashed_password = get_password_hash(new_password)
        user.hashed_password = hashed_password
        db.commit()
        
        print(f"✅ Пароль для пользователя '{username}' успешно изменен!")
        print(f"   Username: {username}")
        print(f"   Password: {new_password}")
        return True
    except Exception as e:
        print(f"❌ Ошибка: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("=== Сброс пароля MultiChat ===\n")
    
    # Сбрасываем пароль admin на "admin123"
    reset_password("admin", "admin123")
    
    print("\n📋 Данные для входа:")
    print("   URL: https://wrongfully-suited-jaybird.cloudpub.ru/")
    print("   Username: admin")
    print("   Password: admin123")
