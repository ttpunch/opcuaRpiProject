import asyncio
import logging
import sys
import os

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

try:
    from asyncua import Client, ua
except ImportError:
    print("Error: 'asyncua' library not found. Please install it with 'pip install asyncua'")
    sys.exit(1)

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

async def test_authentication(url, username=None, password=None):
    client = Client(url=url)
    if username and password:
        client.set_user(username)
        client.set_password(password)
    
    auth_type = "Username/Password" if username else "Anonymous"
    print(f"\n--- Testing Connection ({auth_type}) ---")
    
    try:
        async with client:
            print(f"SUCCESS: Connected to {url}")
            # Try to read a value to confirm session is active
            objects = client.get_objects_node()
            print(f"Server objects: {await objects.get_children()}")
            return True
    except Exception as e:
        print(f"FAILURE: Could not connect/authenticate: {e}")
        return False

async def main():
    url = "opc.tcp://localhost:4840/"
    # Note: Ensure the server is running before running this script
    
    print("Starting OPC UA Authentication Integration Test")
    print("-" * 50)
    
    # Test 1: Anonymous (should succeed if NoSecurity policy is enabled)
    await test_authentication(url)
    
    # Test 2: Valid Admin (default from seed)
    await test_authentication(url, "admin", "admin123")
    
    # Test 3: Invalid Credentials
    await test_authentication(url, "admin", "wrong_password")
    
    # Test 4: Non-existent User
    await test_authentication(url, "ghost_user", "password")

if __name__ == "__main__":
    asyncio.run(main())
