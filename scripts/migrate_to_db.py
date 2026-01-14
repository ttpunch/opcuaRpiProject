import json
import os
import sys

# Add the project root to sys.path so we can import from backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from backend.database.models import Base, Node

# Configuration
CONFIG_FILE = "config.json"
DB_PATH = "sqlite:///backend/database/opcua_server.db"

def migrate():
    if not os.path.exists(CONFIG_FILE):
        print(f"{CONFIG_FILE} not found.")
        return

    with open(CONFIG_FILE, "r") as f:
        config = json.load(f)

    # Ensure the directory for the DB exists
    db_dir = os.path.dirname(DB_PATH.replace("sqlite:///", ""))
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir)

    engine = create_engine(DB_PATH)
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()

    for node_cfg in config.get("nodes", []):
        # Check if node already exists
        existing = session.query(Node).filter(Node.node_id == node_cfg["node_id"]).first()
        if existing:
            print(f"Node {node_cfg['node_id']} already exists in DB.")
            continue

        node = Node(
            name=node_cfg["name"],
            node_id=node_cfg["node_id"],
            data_type=node_cfg.get("data_type", "Float"),
            access_level=node_cfg.get("access_level", "CurrentRead"),
            source_type=node_cfg["source"]["type"],
            source_config=node_cfg["source"],
            update_interval_ms=1000,
            initial_value=str(node_cfg.get("initial_value", ""))
        )
        session.add(node)
        print(f"Adding node {node_cfg['node_id']} to DB.")

    session.commit()
    print("Migration completed.")

if __name__ == "__main__":
    migrate()
