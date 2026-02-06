"""
Initial setup script for MultiChat
Creates the first admin user
"""
from app.database import SessionLocal, init_db
from app.models.user import User
from app.auth import get_password_hash

def create_admin_user():
    # Initialize database
    init_db()
    
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.username == "admin").first()
        
        if existing_admin:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin = User(
            username="admin",
            email="admin@example.com",
            hashed_password=get_password_hash("admin123"),
            is_admin=True,
            balance=100.0,
            is_active=True
        )
        
        db.add(admin)
        db.commit()
        db.refresh(admin)
        
        print("✅ Admin user created successfully!")
        print(f"Username: admin")
        print(f"Password: admin123")
        print(f"Balance: $100.00")
        print("\n⚠️  Please change the password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
