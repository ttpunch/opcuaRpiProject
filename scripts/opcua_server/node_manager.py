import logging
from asyncua import ua, Node
from asyncua.common.node import Node

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

class InternalWriteHandler:
    def __init__(self, node_id, callback):
        self.node_id = node_id
        self.callback = callback

    async def write(self, value):
        _logger.info(f"Write request for {self.node_id}: {value}")
        if self.callback:
            await self.callback(self.node_id, value.Value.Value)

class NodeManager:
    def __init__(self, server, namespace_index):
        self.server = server
        self.idx = namespace_index
        self.nodes = {} # node_id -> node object

    async def create_folder(self, parent_node, name):
        folder = await parent_node.add_folder(self.idx, name)
        return folder

    async def add_node(self, parent_node, config, write_callback=None):
        name = config.get("name")
        node_id_str = config.get("node_id")
        data_type_str = config.get("data_type", "Float")
        access_level_str = config.get("access_level", "CurrentRead")
        
        # Convert initial value based on data type
        raw_initial_value = config.get("initial_value", 0.0)
        if data_type_str == "Boolean":
            initial_value = str(raw_initial_value).lower() == "true"
        elif data_type_str in ["Float", "Double"]:
            try:
                initial_value = float(raw_initial_value)
            except (ValueError, TypeError):
                initial_value = 0.0
        else:
            initial_value = raw_initial_value

        # Map data types
        ua_type = getattr(ua.VariantType, data_type_str, ua.VariantType.Float)
        
        # Map access levels
        if access_level_str == "CurrentReadWrite":
            access_level = {ua.AccessLevel.CurrentRead, ua.AccessLevel.CurrentWrite}
        else:
            access_level = {ua.AccessLevel.CurrentRead}

        # Create the variable
        try:
            # If the node_id_str looks like a full NodeId (e.g. "ns=2;s=MyNode"), parse it
            if ";" in str(node_id_str) and "=" in str(node_id_str):
                requested_node_id = ua.NodeId.from_string(node_id_str)
            else:
                # Otherwise, treat it as a string identifier in our current namespace
                requested_node_id = ua.NodeId(node_id_str, self.idx)
        except Exception as e:
            _logger.warning(f"Failed to parse NodeID string '{node_id_str}', falling back to default: {e}")
            requested_node_id = ua.NodeId(node_id_str, self.idx)
        
        node = await parent_node.add_variable(requested_node_id, name, initial_value, varianttype=ua_type)
        is_writable = ua.AccessLevel.CurrentWrite in access_level
        await node.set_writable(is_writable)
        
        if is_writable and write_callback:
            # Setup write handler for this specific node
            # handler = InternalWriteHandler(node_id_str, write_callback)
            # The previous set_attribute_value call was broken and redundant as initial value is set in add_variable
            pass
            # asyncua 1.x uses write handlers like this:
            await node.set_modelling_rule(True) # Ensure it's treated as a real object if needed
            
        self.nodes[node_id_str] = node
        self.nodes[node_id_str] = node
        # Store the expected variant type for this node to perform casting during updates
        if not hasattr(self, 'node_types'):
            self.node_types = {}
        self.node_types[node_id_str] = ua_type
        
        _logger.info(f"Added node: {name} ({node_id_str}) with type {data_type_str}")
        
        return node

    async def set_node_value(self, node_id_str, value):
        if node_id_str in self.nodes:
            node = self.nodes[node_id_str]
            target_type = self.node_types.get(node_id_str)
            
            try:
                # Cast value to the correct type/variant
                if target_type == ua.VariantType.Boolean:
                    val = bool(value)
                elif target_type == ua.VariantType.Float:
                    val = float(value)
                elif target_type == ua.VariantType.Double:
                    val = float(value)
                elif target_type == ua.VariantType.Int32:
                    val = int(value)
                elif target_type == ua.VariantType.Int64:
                    val = int(value)
                else:
                    val = value
                
                # Explicitly wrap in Variant to enforce the type
                variant = ua.Variant(val, target_type)
                await node.write_value(variant)
            except Exception as e:
                 _logger.error(f"Failed to write value {value} to {node_id_str}: {e}")

        else:
            _logger.warning(f"Node {node_id_str} not found in manager.")

    async def get_node_value(self, node_id_str):
        if node_id_str in self.nodes:
            node = self.nodes[node_id_str]
            return await node.read_value()
        return None
