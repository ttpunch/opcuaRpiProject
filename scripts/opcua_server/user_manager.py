import logging
from asyncua import ua
from ..database.db import SessionLocal
from ..database.models import User
from .security import SecurityManager

_logger = logging.getLogger(__name__)

class DBUserManager:
    """
    Integrates asyncua authentication with the backend database.
    """
    def __init__(self):
        self.security_manager = SecurityManager()

    async def get_user(self, isession, username, password):
        """
        OPC UA server calls this to validate username/password tokens.
        """
        db = SessionLocal()
        try:
            from ..database.models import ServerSetting
            
            # 0. Handle Anonymous Login attempt
            if username is None:
                allow_anon_setting = db.query(ServerSetting).filter(ServerSetting.key == "allow_anonymous").first()
                allow_anon = allow_anon_setting.value.lower() == "true" if allow_anon_setting else False # Default to False for security
                
                if allow_anon:
                    _logger.info("Anonymous login permitted.")
                    # In asyncua, returning a non-None object permits login.
                    # We return a dummy object that indicates 'Anonymous'
                    return User(username="Anonymous", role="ReadOnly")
                else:
                    _logger.warning("Anonymous login rejected.")
                    return None

            if not username or not password:
                _logger.warning("Authentication failed: Missing username or password")
                return None
            
            # 1. Check for dedicated OPC UA credentials in settings
            settings = db.query(ServerSetting).filter(ServerSetting.key.in_(["opcua_username", "opcua_password"])).all()
            settings_dict = {s.key: s.value for s in settings}
            
            target_user = settings_dict.get("opcua_username")
            target_pass = settings_dict.get("opcua_password")

            if target_user and target_pass:
                if username == target_user and password == target_pass:
                    _logger.info(f"Authenticated using dedicated OPC UA credentials: {username}")
                    # Return a mock user object with Admin role for dedicated credentials
                    return User(username=username, role="Admin")

            # 2. Fallback to individual database users
            user = db.query(User).filter(User.username == username).first()
            if not user:
                _logger.warning(f"Authentication failed: User '{username}' not found")
                return None
            
            if not user.enabled:
                _logger.warning(f"Authentication failed: User '{username}' is disabled")
                return None

            # Verify password
            if self.security_manager.verify_password(password, user.password_hash):
                _logger.info(f"User '{username}' authenticated successfully via Database (Role: {user.role})")
                return user
            else:
                _logger.warning(f"Authentication failed: Invalid password for user '{username}'")
                return None
        except Exception as e:
            _logger.error(f"Error during user authentication: {e}")
            return None
        finally:
            db.close()

    async def get_user_permissions(self, user):
        """
        Maps database roles to OPC UA permissions.
        """
        # Note: 'user' here is the object returned by get_user
        if not user:
            return []
            
        role = user.role
        if role == "Admin":
            return [ua.PermissionType.Read, ua.PermissionType.Write, ua.PermissionType.Browse]
        elif role == "Operator":
            return [ua.PermissionType.Read, ua.PermissionType.Write, ua.PermissionType.Browse]
        else: # ReadOnly or default
            return [ua.PermissionType.Read, ua.PermissionType.Browse]
