#!/bin/bash

# LegalChain - Start All Services
# This script starts the database, backend, web app, and telegram bot

set -e  # Exit on error

echo "🚀 Starting LegalChain Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Check if PostgreSQL is running
echo -e "${BLUE}📊 Checking PostgreSQL...${NC}"
if ! psql -l &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not running!${NC}"
    echo -e "${YELLOW}Starting PostgreSQL...${NC}"
    brew services start postgresql@14 || brew services start postgresql@16 || brew services start postgresql
    sleep 2
fi

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw legalchain; then
    echo -e "${YELLOW}Creating database 'legalchain'...${NC}"
    createdb legalchain
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port)
    if [ ! -z "$pid" ]; then
        echo -e "${YELLOW}Killing existing process on port $port (PID: $pid)${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Kill existing processes
echo -e "${BLUE}🧹 Cleaning up existing processes...${NC}"
kill_port 3000
kill_port 3002
pkill -f "ts-node.*telegram" 2>/dev/null || true
pkill -f "telegram-bot" 2>/dev/null || true
echo ""

# Function to run command in background and track PID
run_service() {
    local name=$1
    local dir=$2
    local cmd=$3
    local log_file="$SCRIPT_DIR/logs/${name}.log"
    
    mkdir -p "$SCRIPT_DIR/logs"
    
    echo -e "${BLUE}▶️  Starting ${name}...${NC}"
    cd "$dir"
    eval "$cmd" > "$log_file" 2>&1 &
    local pid=$!
    echo "$pid" > "$SCRIPT_DIR/logs/${name}.pid"
    echo -e "${GREEN}✅ ${name} started (PID: $pid)${NC}"
    echo -e "   Log: $log_file"
    echo ""
}

# Start Backend
run_service "Backend" "$SCRIPT_DIR/backend" "npx tsx watch src/index.ts"
sleep 2

# Start Web App
run_service "Web-App" "$SCRIPT_DIR/web-app" "npm run dev"
sleep 3

# Start Telegram Bot
run_service "Telegram-Bot" "$SCRIPT_DIR/telegram-bot" "npx ts-node src/index.ts"
sleep 2

# Display status
echo ""
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 All Services Started Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📍 Service URLs:${NC}"
echo -e "   🌐 Web App:      ${GREEN}http://localhost:3000${NC}"
echo -e "   🔌 Backend API:  ${GREEN}http://localhost:3002${NC}"
echo -e "   🤖 Telegram Bot: ${GREEN}Running in background${NC}"
echo -e "   📊 Database:     ${GREEN}PostgreSQL (legalchain)${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "   Backend:       $SCRIPT_DIR/logs/Backend.log"
echo -e "   Web App:       $SCRIPT_DIR/logs/Web-App.log"
echo -e "   Telegram Bot:  $SCRIPT_DIR/logs/Telegram-Bot.log"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo -e "   • View logs: ${BLUE}tail -f logs/<service>.log${NC}"
echo -e "   • Stop all:  ${BLUE}./stop-all.sh${NC}"
echo -e "   • Backend runs on port 3002 (not 3001)"
echo ""
echo -e "${GREEN}Press Ctrl+C to stop monitoring (services will continue running)${NC}"
echo ""

# Monitor services
while true; do
    sleep 5
    
    # Check if services are still running
    if ! kill -0 $(cat "$SCRIPT_DIR/logs/Backend.pid" 2>/dev/null) 2>/dev/null; then
        echo -e "${RED}⚠️  Backend stopped unexpectedly!${NC}"
    fi
    
    if ! kill -0 $(cat "$SCRIPT_DIR/logs/Web-App.pid" 2>/dev/null) 2>/dev/null; then
        echo -e "${RED}⚠️  Web App stopped unexpectedly!${NC}"
    fi
    
    if ! kill -0 $(cat "$SCRIPT_DIR/logs/Telegram-Bot.pid" 2>/dev/null) 2>/dev/null; then
        echo -e "${RED}⚠️  Telegram Bot stopped unexpectedly!${NC}"
    fi
done
