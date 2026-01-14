import time
from typing import Dict, Any, List
from collections import deque

class OPCUAMetrics:
    def __init__(self):
        self.start_time = time.time()
        self.total_requests = 0
        self.read_requests = 0
        self.write_requests = 0
        self.error_count = 0
        self.active_sessions = 0
        
        # Historical tracking for RPM (Requests Per Minute)
        self.request_history = deque(maxlen=60) # Last 60 seconds

    def record_request(self, req_type="read", success=True):
        self.total_requests += 1
        if req_type == "read":
            self.read_requests += 1
        elif req_type == "write":
            self.write_requests += 1
        
        if not success:
            self.error_count += 1
            
        self.request_history.append(time.time())

    def update_sessions(self, count: int):
        self.active_sessions = count

    def get_rpm(self) -> int:
        now = time.time()
        # Filter history for last minute
        one_min_ago = now - 60
        count = sum(1 for t in self.request_history if t > one_min_ago)
        return count

    def get_summary(self) -> Dict[str, Any]:
        return {
            "uptime_seconds": int(time.time() - self.start_time),
            "total_requests": self.total_requests,
            "read_requests": self.read_requests,
            "write_requests": self.write_requests,
            "error_count": self.error_count,
            "active_sessions": self.active_sessions,
            "rpm": self.get_rpm()
        }
