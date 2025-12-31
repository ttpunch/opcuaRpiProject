import asyncio
import logging
from asyncua import Server, ua
from asyncua.common.methods import uamethod

from .security import SecurityManager
from .node_manager import NodeManager
from .data_sources import SourceFactory
from ..database.db import SessionLocal
from ..database.models import Node

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

class OPCUAServer:
    def __init__(self, endpoint="opc.tcp://0.0.0.0:4840/", name="RPi OPC UA Server"):
        self.server = None # Will be initialized in setup()
        self.endpoint = endpoint
        self.name = name
        self.namespace = None
        self.is_running = False
        self.security_manager = SecurityManager()
        self.node_manager = None
        self.data_sources = {} # node_id -> DataSource instance
        self.polling_task = None
        self.root_folder = None
        self.last_error = None
        import uuid
        self.instance_id = str(uuid.uuid4())[:8]
        _logger.info(f"OPCUAServer initialized with ID: {self.instance_id}")

    async def setup(self):
        # Create a fresh server object to avoid "remaining nodes" error on restart
        self.server = Server()
        
        # Load global settings from Database
        db = SessionLocal()
        try:
            from ..database.models import ServerSetting
            settings = {s.key: s.value for s in db.query(ServerSetting).all()}
            
            self.name = settings.get("server_name", self.name)
            port = settings.get("port", "4840")
            app_uri = settings.get("namespace_uri", "urn:raspberry:opcua:server")
        finally:
            db.close()

        # Prepare Endpoint URL
        _logger.info("Configuring OPC UA Endpoint...")
        listen_ip = "0.0.0.0"
        
        # Determine the best IP to report to clients
        import socket
        report_ip = "127.0.0.1"
        try:
            # Try to get the local IP that can reach outside world
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.settimeout(0.1) # Fast timeout
            try:
                s.connect(("8.8.8.8", 80))
                report_ip = s.getsockname()[0]
                _logger.info(f"Detected external IP: {report_ip}")
            except Exception as e:
                _logger.warning(f"Could not auto-detect IP, falling back to 127.0.0.1: {e}")
            finally:
                s.close()
        except Exception as e:
            _logger.error(f"Socket error during IP detection: {e}")

        # If user explicitly set an endpoint in DB, we might want to respect that logic,
        # but usually constructing it dynamically is safer for Pi environments.
        self.endpoint = f"opc.tcp://{report_ip}:{port}/"
        _logger.info(f"Setting Endpoint URL to: {self.endpoint}")
        
        # We need to explicitly tell the server to report this specific endpoint
        # while still binding to everything.
        try:
            await self.server.init()
            self.server.set_endpoint(self.endpoint)
            self.server.set_server_name(self.name)
            _logger.info("Server initialized successfully.")
        except Exception as e:
             _logger.error(f"Failed to init server: {e}")
             raise e
        
        # Strict Application URI
        await self.server.set_application_uri(app_uri)
        
        # Security configuration - Include Pi IP in certificate SANs
        import socket
        try:
            # Try to get the local IP that can reach outside world
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            local_ip = s.getsockname()[0]
            s.close()
            ips = [local_ip, "127.0.0.1"]
        except:
            ips = ["127.0.0.1"]

        self.security_manager.generate_self_signed_cert(app_uri=app_uri, ip_addresses=ips)
        await self.server.load_certificate(self.security_manager.server_cert_path)
        await self.server.load_private_key(self.security_manager.server_key_path)

        # Set security policies
        self.server.set_security_policy([
            ua.SecurityPolicyType.NoSecurity,
            ua.SecurityPolicyType.Basic256Sha256_SignAndEncrypt,
            ua.SecurityPolicyType.Basic256Sha256_Sign
        ])

        # Create namespace
        uri = "http://raspberry.opcua.server"
        self.namespace = await self.server.register_namespace(uri)
        
        # Initialise node manager
        self.node_manager = NodeManager(self.server, self.namespace)
        
        # Load configuration from Database
        db = SessionLocal()
        try:
            nodes_db = db.query(Node).filter(Node.enabled == True).all()
            self.root_folder = await self.server.nodes.objects.add_folder(self.namespace, "Sensors")
            
            for node_db in nodes_db:
                await self.add_dynamic_node(node_db)
        finally:
            db.close()

    async def add_dynamic_node(self, node_db):
        """Adds a node dynamically to the running server"""
        node_id = node_db.node_id
        
        # Setup data source first so we can use it in write callback
        source_cfg = node_db.source_config or {}
        source_cfg["name"] = node_db.name
        source_cfg["type"] = node_db.source_type
        
        try:
            source = SourceFactory.create(source_cfg)
            self.data_sources[node_id] = source
            
            # Add node to OPC UA address space
            config = {
                "name": node_db.name,
                "node_id": node_db.node_id,
                "data_type": node_db.data_type,
                "access_level": node_db.access_level,
                "initial_value": node_db.initial_value
            }
            
            # Define write callback that propagates to the data source
            async def handle_write(node_id_val, value):
                if node_id_val in self.data_sources:
                    await self.data_sources[node_id_val].write(value)
            
            await self.node_manager.add_node(self.root_folder, config, write_callback=handle_write)
            _logger.info(f"Dynamically added node: {node_id}")
        except Exception as e:
            _logger.error(f"Failed to add dynamic node {node_id}: {e}")
            # Clean up if partially added?
            if node_id in self.data_sources:
                del self.data_sources[node_id]

    async def remove_dynamic_node(self, node_id):
        """Removes a node dynamically from the running server"""
        if node_id in self.data_sources:
            del self.data_sources[node_id]
            
        # TODO: Implement proper node removal in NodeManager/asyncua
        # For now, we might just stop updating it in the poll loop.
        # But wait, asyncua server.delete_nodes is available usually.
        # Check NodeManager for implementation details. 
        # Since NodeManager doesn't export a remove method yet, 
        # and standard asyncua delete_nodes requires NodeIds, we should check `self.node_manager.nodes`
        
        if node_id in self.node_manager.nodes:
            try:
                # This is a bit hacky if NodeManager doesn't support it directly, 
                # but we can try to call delete_nodes on the server
                ua_node = self.node_manager.nodes[node_id]
                # self.server.delete_nodes([ua_node.nodeid]) # This might be the way, but depends on asyncua version
                # Let's inspect asyncua capabilities later or check docs.
                # Use a safer approach: disable it in our polling map (already done since removed from data_sources)
                # and maybe try to remove from address space.
                
                # Removing from internal map
                del self.node_manager.nodes[node_id]
                _logger.info(f"Removed node {node_id} from management.")
            except Exception as e:
                _logger.error(f"Error removing node {node_id} from address space: {e}")
                
    async def update_dynamic_node(self, node_db):
        """Updates a node dynamically"""
        # Simplest approach: remove and add again
        await self.remove_dynamic_node(node_db.node_id)
        # Verify it's gone?
        await self.add_dynamic_node(node_db)

    async def poll_nodes(self):
        while self.is_running:
            for node_id, source in self.data_sources.items():
                try:
                    value = await source.read()
                    # _logger.info(f"Polling {node_id}: {value}") 
                    await self.node_manager.set_node_value(node_id, value)
                except Exception as e:
                    _logger.error(f"Error polling node {node_id}: {e}")
            await asyncio.sleep(1)

    async def start(self):
        if self.is_running:
            return
        
        try:
            await self.setup()
        except Exception as e:
            _logger.error(f"FATAL: Setup failed: {e}")
            import traceback
            traceback.print_exc()
            return

        async with self.server:
            self.is_running = True
            _logger.info(f"Server started at {self.endpoint}")
            # Start polling task
            self.polling_task = asyncio.create_task(self.poll_nodes())
            try:
                while self.is_running:
                    await asyncio.sleep(1)
            except asyncio.CancelledError:
                pass
            finally:
                if self.polling_task:
                    self.polling_task.cancel()
                    await self.polling_task

    async def stop(self):
        _logger.info("Stopping OPC UA Server...")
        self.is_running = False

if __name__ == "__main__":
    server = OPCUAServer()
    try:
        asyncio.run(server.start())
    except KeyboardInterrupt:
        pass
