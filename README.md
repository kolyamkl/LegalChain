# LegalChain - AI-Powered Smart Contract Security Platform

LegalChain is an AI-powered smart contract analysis platform that explains on-chain risk in natural language and voice, delivered across a web app, Telegram bot, and browser extension.

## 🏗️ Project Structure

```
LegalChain/
├── backend/           # Node.js/TypeScript API server
├── web-app/           # Next.js web application
├── telegram-bot/      # Telegram bot for quick scans
├── extension/         # Chrome browser extension
└── ETH HACK DOCS/     # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
# - DATABASE_URL: PostgreSQL connection string
# - ETHERSCAN_API_KEY: (optional) for real contract data
# - OPENAI_API_KEY: (optional) for real LLM analysis
# - ELEVENLABS_API_KEY: (optional) for voice generation

# Generate Prisma client
npm run db:generate

# Push database schema
npm run db:push

# Start development server
npm run dev
```

The backend will run on `http://localhost:3001`

### 2. Web App Setup

```bash
cd web-app

# Install dependencies
npm install

# Start development server
npm run dev
```

The web app will run on `http://localhost:3000`

### 3. Telegram Bot Setup

```bash
cd telegram-bot

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your Telegram bot token
# Get a token from @BotFather on Telegram

# Start the bot
npm run dev
```

### 4. Chrome Extension Setup

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select the `extension/` folder
5. The extension icon will appear in your toolbar

**Note:** You'll need to create icon files (16x16, 32x32, 48x48, 128x128 PNG) in `extension/icons/` or remove the icon references from `manifest.json` for testing.

## 📡 API Endpoints

### Analysis

- `POST /api/analyze` - Analyze a contract
  ```json
  {
    "input_type": "address" | "tx_hash" | "source_code",
    "chain_id": 1,
    "value": "0x...",
    "options": {
      "generate_voice": false,
      "user_level": "beginner"
    }
  }
  ```

- `GET /api/analysis/:id` - Get analysis by ID
- `GET /api/analysis/by-contract?chain_id=1&contract_address=0x...` - Get analysis by contract

### Education

- `POST /api/analyze/education` - Analyze custom Solidity code
- `GET /api/education/patterns` - List all educational patterns
- `GET /api/education/patterns/:slug` - Get pattern details

## 🎯 Features

### Web App
- **Security Check**: Analyze contracts by address, tx hash, or source code
- **Multi-tab Results**: Overview, Vulnerabilities, Oracle Data, History
- **Voice Summaries**: AI-generated audio explanations
- **Education Section**: Learn about vulnerabilities with interactive examples

### Telegram Bot
- `/start` - Welcome message
- `/check <address_or_tx>` - Quick contract scan
- `/help` - Command reference
- Deep links to full web analysis

### Browser Extension
- **Popup Scanner**: Paste address → instant risk score
- **Inline Widget**: Auto-detects contracts on Etherscan pages
- **Quick Actions**: Open full analysis in web app

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:password@localhost:5432/legalchain"
REDIS_URL="redis://localhost:6379"  # Optional
RPC_URL="https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY"
ETHERSCAN_API_KEY="YOUR_KEY"
OPENAI_API_KEY="sk-..."  # Optional, uses mock if not set
ELEVENLABS_API_KEY="..."  # Optional, uses mock if not set
TELEGRAM_BOT_TOKEN="..."
PORT=3001
WEB_APP_URL="http://localhost:3000"
```

#### Telegram Bot (.env)
```env
TELEGRAM_BOT_TOKEN="YOUR_BOT_TOKEN"
API_URL="http://localhost:3001"
WEB_APP_URL="http://localhost:3000"
```

## 🧪 Testing the MVP

1. **Start all services** (backend, web app, telegram bot)

2. **Web App Test**:
   - Go to `http://localhost:3000`
   - Paste a contract address: `0x1234567890123456789012345678901234567890`
   - Click "Analyze" and see the mock results

3. **Telegram Bot Test**:
   - Find your bot on Telegram
   - Send `/start` for welcome message
   - Send `/check 0x1234567890123456789012345678901234567890`

4. **Extension Test**:
   - Click the extension icon
   - Paste an address and click "Scan"

## 📁 Key Files

### Backend
- `src/index.ts` - Express server entry point
- `src/routes/analyze.ts` - Analysis endpoints
- `src/services/analysisService.ts` - Core analysis logic
- `src/services/staticAnalysis.ts` - Vulnerability detection patterns
- `src/services/llmService.ts` - LLM integration (mock)
- `src/services/voiceService.ts` - Voice generation (mock)
- `prisma/schema.prisma` - Database schema

### Web App
- `src/app/page.tsx` - Security Check page
- `src/app/education/page.tsx` - Education page
- `src/app/analyze/page.tsx` - Analysis view (for deep links)
- `src/components/` - React components
- `src/lib/api.ts` - API client

### Telegram Bot
- `src/index.ts` - Bot implementation with all commands

### Extension
- `manifest.json` - Chrome extension manifest
- `popup.html/js/css` - Extension popup UI
- `background.js` - Service worker for API calls
- `content.js/css` - Inline widget for Etherscan

## 🔮 Future Enhancements

- Real LLM integration (OpenAI GPT-4)
- Real voice synthesis (ElevenLabs)
- Multi-chain support
- Slither/Mythril integration
- User authentication
- Watchlists and alerts
- PDF report export

## 📄 License

MIT License - See LICENSE file for details