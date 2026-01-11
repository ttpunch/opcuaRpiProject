import os
import logging
from datetime import datetime, timedelta
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend
import bcrypt

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

class SecurityManager:
    def __init__(self, cert_dir=None):
        # Use absolute path to avoid "phantom folder" confusion
        if cert_dir is None:
            if os.path.exists("/opt/pi-opcua-server"):
                self.cert_dir = "/opt/pi-opcua-server/certs"
            else:
                self.cert_dir = os.path.abspath("certs")
        else:
            self.cert_dir = cert_dir
            
        if not os.path.exists(self.cert_dir):
            os.makedirs(self.cert_dir, exist_ok=True)
        
        self.server_cert_path = os.path.join(self.cert_dir, "server_cert.der")
        self.server_key_path = os.path.join(self.cert_dir, "server_key.pem")

    def generate_self_signed_cert(self, common_name="RPi-OPCUA-Server", app_uri="urn:raspberry:opcua:server", ip_addresses=None):
        if os.path.exists(self.server_cert_path) and os.path.exists(self.server_key_path):
            if os.path.getsize(self.server_cert_path) > 0 and os.path.getsize(self.server_key_path) > 0:
                _logger.info("Certificates already exist and are valid. Skipping generation.")
                return True
            else:
                _logger.warning("Existing certificates seem invalid or empty. Regenerating...")

        _logger.info("Generating self-signed certificate...")
        
        # Generate private key
        key = rsa.generate_private_key(
            public_exponent=65537,
            key_size=2048,
            backend=default_backend()
        )

        # Generate certificate
        subject = issuer = x509.Name([
            x509.NameAttribute(NameOID.COMMON_NAME, common_name),
        ])
        
        # Prepare SANs
        import ipaddress
        sans = [
            x509.DNSName("localhost"),
            x509.UniformResourceIdentifier(app_uri)
        ]
        if ip_addresses:
            for addr in ip_addresses:
                try:
                    # Check if it's a valid IP
                    ip_obj = ipaddress.ip_address(addr)
                    sans.append(x509.IPAddress(ip_obj))
                except ValueError:
                    # If not an IP, treat as a DNS name (hostname)
                    sans.append(x509.DNSName(addr))

        cert_builder = x509.CertificateBuilder().subject_name(
            subject
        ).issuer_name(
            issuer
        ).public_key(
            key.public_key()
        ).serial_number(
            x509.random_serial_number()
        ).not_valid_before(
            datetime.utcnow()
        ).not_valid_after(
            datetime.utcnow() + timedelta(days=365)
        ).add_extension(
            x509.BasicConstraints(ca=False, path_length=None),
            critical=True,
        ).add_extension(
            x509.SubjectAlternativeName(sans),
            critical=False,
        ).add_extension(
            x509.KeyUsage(
                digital_signature=True,
                content_commitment=True,
                key_encipherment=True,
                data_encipherment=True,
                key_agreement=False,
                key_cert_sign=False,
                crl_sign=False,
                encipher_only=False,
                decipher_only=False,
            ),
            critical=True,
        ).add_extension(
            x509.ExtendedKeyUsage([
                x509.oid.ExtendedKeyUsageOID.SERVER_AUTH,
                x509.oid.ExtendedKeyUsageOID.CLIENT_AUTH,
            ]),
            critical=False,
        )

        cert = cert_builder.sign(key, hashes.SHA256())

        # Save private key (PEM format is standard for keys)
        with open(self.server_key_path, "wb") as f:
            f.write(key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.TraditionalOpenSSL,
                encryption_algorithm=serialization.NoEncryption(),
            ))

        # Save certificate (DER format is standard for OPC UA binary protocol)
        with open(self.server_cert_path, "wb") as f:
            f.write(cert.public_bytes(serialization.Encoding.DER))

        _logger.info(f"Certificates generated (Cert: DER, Key: PEM) and saved to {self.cert_dir}")
        return True

    @staticmethod
    def hash_password(password: str) -> str:
        return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    @staticmethod
    def verify_password(password: str, hashed: str) -> bool:
        return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

# Example usage/test
if __name__ == "__main__":
    manager = SecurityManager()
    manager.generate_self_signed_cert()
    
    pwd = "admin_password"
    hashed = manager.hash_password(pwd)
    print(f"Hashed: {hashed}")
    print(f"Verify Correct: {manager.verify_password(pwd, hashed)}")
    print(f"Verify Incorrect: {manager.verify_password('wrong', hashed)}")
