#!/bin/bash

# LegalChain - Stop All Services

set -e

echo "🛑 Stopping LegalChain Services..."
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to stop service
stop_service() {
    local name=$1
    local pid_file="$SCRIPT_DIR/logs/${name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "${BLUE}Stopping ${name} (PID: $pid)...${NC}"
            kill "$pid" 2>/dev/null || true
            sleep 1
            if kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm "$pid_file"
            echo -e "${GREEN}✅ ${name} stopped${NC}"
        else
            echo -e "${RED}${name} was not running${NC}"
            rm "$pid_file"
        fi
    else
        echo -e "${RED}No PID file for ${name}${NC}"
    fi
}

# Stop all services
stop_service "Backend"
stop_service "Web-App"
stop_service "Telegram-Bot"

# Kill any remaining processes
echo ""
echo -e "${BLUE}Cleaning up remaining processes...${NC}"
pkill -f "tsx watch" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "ts-node.*telegram" 2>/dev/null || true

# Kill processes on ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All services stopped${NC}"
