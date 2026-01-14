import psutil
import time
import logging
from typing import Dict, Any

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

class SystemMonitor:
    def __init__(self):
        self.start_time = time.time()
        # Initialize some metrics that need delta calculations
        psutil.cpu_percent(interval=None)
        self.net_io_last = psutil.net_io_counters()
        self.net_io_last_time = time.time()

    def get_cpu_info(self) -> Dict[str, Any]:
        return {
            "percent": psutil.cpu_percent(interval=None),
            "count": psutil.cpu_count(),
            "load_avg": psutil.getloadavg()
        }

    def get_memory_info(self) -> Dict[str, Any]:
        mem = psutil.virtual_memory()
        return {
            "total": mem.total,
            "available": mem.available,
            "used": mem.used,
            "percent": mem.percent
        }

    def get_disk_info(self) -> Dict[str, Any]:
        disk = psutil.disk_usage('/')
        return {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        }

    def get_network_info(self) -> Dict[str, Any]:
        net_io = psutil.net_io_counters()
        now = time.time()
        dt = now - self.net_io_last_time
        
        # Calculate rates
        sent_rate = (net_io.bytes_sent - self.net_io_last.bytes_sent) / dt if dt > 0 else 0
        recv_rate = (net_io.bytes_recv - self.net_io_last.bytes_recv) / dt if dt > 0 else 0
        
        self.net_io_last = net_io
        self.net_io_last_time = now
        
        return {
            "bytes_sent": net_io.bytes_sent,
            "bytes_recv": net_io.bytes_recv,
            "sent_rate": sent_rate,
            "recv_rate": recv_rate
        }

    def get_system_summary(self) -> Dict[str, Any]:
        return {
            "cpu": self.get_cpu_info(),
            "memory": self.get_memory_info(),
            "disk": self.get_disk_info(),
            "network": self.get_network_info(),
            "temp": 50.0, # Placeholder for RPi temperature reading
            "uptime_seconds": int(time.time() - self.start_time)
        }
