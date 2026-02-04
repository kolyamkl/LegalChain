#!/bin/bash

# ============================================
# LegalChain - Start All Services
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="/Users/macbook/Projects/LegalChain"

# PID file to track processes
PID_FILE="$PROJECT_ROOT/.running_pids"

# Function to cleanup on exit
cleanup() {
    echo -e "\n${RED}🛑 Shutting down all services...${NC}"
    
    if [ -f "$PID_FILE" ]; then
        while read pid; do
            if kill -0 $pid 2>/dev/null; then
                kill $pid 2>/dev/null
                echo -e "${YELLOW}   Stopped PID $pid${NC}"
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    
    # Also kill any remaining processes
    pkill -f "tsx.*backend" 2>/dev/null
    pkill -f "tsx.*telegram" 2>/dev/null
    pkill -f "next dev" 2>/dev/null
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Trap Ctrl+C and other signals
trap cleanup SIGINT SIGTERM

# Clear screen and show banner
clear
echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║     ██╗     ███████╗ ██████╗  █████╗ ██╗      ██████╗     ║"
echo "║     ██║     ██╔════╝██╔════╝ ██╔══██╗██║     ██╔════╝     ║"
echo "║     ██║     █████╗  ██║  ███╗███████║██║     ██║          ║"
echo "║     ██║     ██╔══╝  ██║   ██║██╔══██║██║     ██║          ║"
echo "║     ███████╗███████╗╚██████╔╝██║  ██║███████╗╚██████╗     ║"
echo "║     ╚══════╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝     ║"
echo "║                                                            ║"
echo "║              AI-Powered Smart Contract Security            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Kill any existing processes
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
pkill -f "tsx.*backend" 2>/dev/null
pkill -f "tsx.*telegram" 2>/dev/null
pkill -f "next dev" 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null
sleep 2

# Clear PID file
> "$PID_FILE"

# Create log directory
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"

# Start Backend
echo -e "\n${BLUE}🚀 Starting Backend API (port 3002)...${NC}"
cd "$PROJECT_ROOT/backend"
npx tsx src/index.ts > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID >> "$PID_FILE"
sleep 3

# Check if backend started
if kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Backend started (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}   ❌ Backend failed to start${NC}"
    cat "$LOG_DIR/backend.log"
    exit 1
fi

# Start Web App
echo -e "\n${BLUE}🌐 Starting Web App (port 3000)...${NC}"
cd "$PROJECT_ROOT/web-app"
npm run dev > "$LOG_DIR/webapp.log" 2>&1 &
WEBAPP_PID=$!
echo $WEBAPP_PID >> "$PID_FILE"
sleep 3

if kill -0 $WEBAPP_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Web App started (PID: $WEBAPP_PID)${NC}"
else
    echo -e "${RED}   ❌ Web App failed to start${NC}"
fi

# Start Telegram Bot
echo -e "\n${BLUE}🤖 Starting Telegram Bot...${NC}"
cd "$PROJECT_ROOT/telegram-bot"
# Wait a bit for Telegram API to release previous session
sleep 5
npx tsx src/index.ts > "$LOG_DIR/telegram.log" 2>&1 &
TELEGRAM_PID=$!
echo $TELEGRAM_PID >> "$PID_FILE"
sleep 2

if kill -0 $TELEGRAM_PID 2>/dev/null; then
    echo -e "${GREEN}   ✅ Telegram Bot started (PID: $TELEGRAM_PID)${NC}"
else
    echo -e "${RED}   ❌ Telegram Bot failed to start (may have polling conflict)${NC}"
fi

# Print status
echo -e "\n${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🎉 All services started!${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${YELLOW}📡 Backend API:${NC}    http://localhost:3002"
echo -e "  ${YELLOW}🌐 Web App:${NC}        http://localhost:3000"
echo -e "  ${YELLOW}📱 Telegram Bot:${NC}   @legalchain_bot (polling)"
echo -e "  ${YELLOW}☁️  Vercel:${NC}        https://web-app-eta-sage.vercel.app"
echo ""
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
echo -e "${CYAN}════════════════════════════════════════════════════════════${NC}"
echo ""

# Show live logs (combined)
echo -e "${BLUE}📋 Live Logs:${NC}\n"
tail -f "$LOG_DIR/backend.log" "$LOG_DIR/webapp.log" "$LOG_DIR/telegram.log" 2>/dev/null | while read line; do
    if echo "$line" | grep -q "backend.log"; then
        echo -e "${GREEN}[BACKEND]${NC} $line"
    elif echo "$line" | grep -q "webapp.log"; then
        echo -e "${BLUE}[WEBAPP]${NC} $line"
    elif echo "$line" | grep -q "telegram.log"; then
        echo -e "${YELLOW}[TELEGRAM]${NC} $line"
    else
        # Color-code by content
        if echo "$line" | grep -qi "error\|failed\|❌"; then
            echo -e "${RED}$line${NC}"
        elif echo "$line" | grep -qi "success\|started\|✅\|✓"; then
            echo -e "${GREEN}$line${NC}"
        elif echo "$line" | grep -qi "warning\|⚠"; then
            echo -e "${YELLOW}$line${NC}"
        else
            echo "$line"
        fi
    fi
done
