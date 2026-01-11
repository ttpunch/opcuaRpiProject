import sys
import os
import argparse
import logging

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.db import SessionLocal
from backend.database.models import User
from backend.opcua_server.security import SecurityManager

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

def reset_password(username, new_password):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.username == username).first()
        
        if not user:
            print(f"Error: User '{username}' not found.")
            return False
            
        hashed_pwd = SecurityManager.hash_password(new_password)
        user.password_hash = hashed_pwd
        db.commit()
        
        print(f"Success: Password for '{username}' has been updated.")
        return True
    except Exception as e:
        print(f"Error: Failed to reset password: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Reset OPC UA Server User Password")
    parser.add_argument("username", help="Username to reset")
    parser.add_argument("password", help="New password")
    
    args = parser.parse_args()
    
    reset_password(args.username, args.password)
