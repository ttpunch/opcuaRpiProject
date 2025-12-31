import sys
import os

# Add project root to sys.path so we can import backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.database.db import init_db, SessionLocal
from backend.database.models import User, ServerSetting, Node
from backend.opcua_server.security import SecurityManager
import logging

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

def seed_db():
    _logger.info("Initializing database...")
    init_db()
    
    db = SessionLocal()
    try:
        # Check if admin user exists
        admin = db.query(User).filter(User.username == "admin").first()
        if not admin:
            _logger.info("Creating default admin user...")
            hashed_pwd = SecurityManager.hash_password("admin123")
            admin = User(username="admin", password_hash=hashed_pwd, role="Admin")
            db.add(admin)
        
        # Add some default settings
        settings = {
            "server_port": "4840",
            "server_name": "RPi OPC UA Server",
            "log_level": "INFO",
            "security_mode": "SignAndEncrypt"
        }
        
        for key, val in settings.items():
            if not db.query(ServerSetting).filter(ServerSetting.key == key).first():
                db.add(ServerSetting(key=key, value=val))
        
        # Reset nodes to standard RPi configuration
        _logger.info("Resetting nodes to standard RPi configuration...")
        db.query(Node).delete()
        
        # 1. Simulation Node (for testing analog graphs)
        sim_node = Node(
            name="Simulated_Sine",
            node_id="ns=2;s=Simulated_Sine",
            data_type="Float",
            access_level="CurrentRead", # Simulation is usually read-only
            source_type="simulation",
            source_config={"type": "simulation", "sim_type": "sine", "min": 0, "max": 100},
            enabled=True
        )
        db.add(sim_node)

        # 2. GPIO 17 (Standard Input - e.g. Button)
        gpio_17 = Node(
            name="GPIO_17_Input",
            node_id="ns=2;s=GPIO_17",
            data_type="Boolean",
            access_level="CurrentRead", # Input pin is read-only from OPC UA side
            source_type="gpio",
            source_config={"type": "gpio", "pin": 17, "mode": "input"},
            enabled=True
        )
        db.add(gpio_17)

        # 3. GPIO 27 (Standard Output - e.g. LED)
        gpio_27 = Node(
            name="GPIO_27_Output",
            node_id="ns=2;s=GPIO_27",
            data_type="Boolean",
            access_level="CurrentReadWrite", # Output pin can be written to
            source_type="gpio",
            source_config={"type": "gpio", "pin": 27, "mode": "output"},
            enabled=True
        )
        db.add(gpio_27)
        
        # 4. GPIO 22 (Standard Output - e.g. Relay)
        gpio_22 = Node(
            name="GPIO_22_Output",
            node_id="ns=2;s=GPIO_22",
            data_type="Boolean",
            access_level="CurrentReadWrite",
            source_type="gpio",
            source_config={"type": "gpio", "pin": 22, "mode": "output"},
            enabled=True
        )
        db.add(gpio_22)

        start_time_node = Node(
            name="StartTime",
             node_id="ns=2;s=StartTime",
            data_type="String",
            access_level="CurrentRead",
            source_type="manual",
            source_config={"type": "manual", "initial_value": "Not Started"},
            enabled=True
        )
        db.add(start_time_node)
             
        db.commit()
        _logger.info("Database seeding complete.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
