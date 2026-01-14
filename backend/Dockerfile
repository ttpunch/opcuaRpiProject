# Use official Python lightweight image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the backend code
COPY . .

# Make the start script executable
RUN chmod +x backend/start.sh

# Expose ports: 8000 for API, 4840 for OPC UA
EXPOSE 8000
EXPOSE 4840

# Run the start script
CMD ["./backend/start.sh"]
