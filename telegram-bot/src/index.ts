import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_URL = process.env.API_URL || 'http://localhost:3001';
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set. Please set it in .env file.');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 LegalChain Telegram Bot is starting...');

function isValidAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value);
}

function isValidTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value);
}

function detectInputType(value: string): 'address' | 'tx_hash' | null {
  if (isValidAddress(value)) return 'address';
  if (isValidTxHash(value)) return 'tx_hash';
  return null;
}

function getRiskEmoji(level: string): string {
  switch (level) {
    case 'low': return '🟢';
    case 'medium': return '🟡';
    case 'high': return '🟠';
    case 'dangerous': return '🔴';
    default: return '⚪';
  }
}

function getSeverityEmoji(severity: string): string {
  switch (severity) {
    case 'critical': return '🔴';
    case 'high': return '🟠';
    case 'medium': return '🟡';
    case 'low': return '🔵';
    default: return '⚪';
  }
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';

  const welcomeMessage = `
👋 Welcome to *LegalChain*, ${firstName}!

I'm your AI-powered smart contract security assistant. I can help you analyze smart contracts for vulnerabilities and risks.

*Available Commands:*
• /check <address_or_tx> - Analyze a contract
• /help - Show all commands

*Quick Start:*
Just send me a contract address or transaction hash, and I'll analyze it for you!

Example:
\`/check 0x1234567890123456789012345678901234567890\`

Stay safe in Web3! 🛡️
  `.trim();

  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Open Web App', url: WEB_APP_URL }],
        [{ text: '📚 Learn Security', url: `${WEB_APP_URL}/education` }],
      ],
    },
  });
});

bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
🛡️ *LegalChain Bot Commands*

*/check <address_or_tx>*
Analyze a smart contract by address or transaction hash.
Example: \`/check 0x1234...5678\`

*/start*
Show welcome message and quick start guide.

*/help*
Show this help message.

*Tips:*
• I auto-detect whether you send an address or tx hash
• For detailed analysis, click "View Full Analysis"
• Use the web app for code analysis and education

Need more help? Visit our web app!
  `.trim();

  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🌐 Open Web App', url: WEB_APP_URL }],
      ],
    },
  });
});

bot.onText(/\/check(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const value = match?.[1]?.trim();

  if (!value) {
    await bot.sendMessage(
      chatId,
      '❌ Please provide a contract address or transaction hash.\n\nExample: `/check 0x1234567890123456789012345678901234567890`',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const inputType = detectInputType(value);
  if (!inputType) {
    await bot.sendMessage(
      chatId,
      '❌ Invalid input. Please provide a valid Ethereum address (0x + 40 hex chars) or transaction hash (0x + 64 hex chars).',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  const scanningMsg = await bot.sendMessage(
    chatId,
    '🔍 *Scanning contract...*\n\n⏳ This may take a few seconds.',
    { parse_mode: 'Markdown' }
  );

  try {
    const response = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_type: inputType,
        chain_id: 1,
        value,
        options: {
          generate_voice: false,
          user_level: 'beginner',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Analysis failed');
    }

    const analysis = await response.json();

    const riskEmoji = getRiskEmoji(analysis.risk_level);
    const keyFindingsText = analysis.key_findings
      .slice(0, 3)
      .map((f: { title: string; severity: string }) => 
        `${getSeverityEmoji(f.severity)} ${f.title}`
      )
      .join('\n');

    const resultMessage = `
✅ *Analysis Complete*

${riskEmoji} *Risk Score: ${analysis.risk_score}/100* (${analysis.risk_level.toUpperCase()})

📋 *Summary:*
${analysis.summary_short}

🔍 *Key Findings:*
${keyFindingsText || 'No critical issues found'}

${inputType === 'address' ? `📍 Contract: \`${value.slice(0, 10)}...${value.slice(-8)}\`` : `📍 Transaction: \`${value.slice(0, 10)}...${value.slice(-8)}\``}
    `.trim();

    await bot.editMessageText(resultMessage, {
      chat_id: chatId,
      message_id: scanningMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ 
            text: '📊 View Full Analysis', 
            url: `${WEB_APP_URL}/analyze?analysis_id=${analysis.analysis_id}` 
          }],
          [{ text: '🔄 Scan Another', callback_data: 'scan_another' }],
        ],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    await bot.editMessageText(
      `❌ *Analysis Failed*\n\n${errorMessage}\n\nPlease try again or use the web app for more options.`,
      {
        chat_id: chatId,
        message_id: scanningMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🌐 Try Web App', url: WEB_APP_URL }],
          ],
        },
      }
    );
  }
});

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  
  if (!chatId) return;

  if (query.data === 'scan_another') {
    await bot.answerCallbackQuery(query.id);
    await bot.sendMessage(
      chatId,
      '🔍 Send me a contract address or transaction hash to analyze.\n\nExample: `/check 0x1234...`',
      { parse_mode: 'Markdown' }
    );
  }
});

bot.on('message', async (msg) => {
  if (msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  if (isValidAddress(text) || isValidTxHash(text)) {
    await bot.sendMessage(
      chatId,
      `Detected ${isValidAddress(text) ? 'address' : 'transaction hash'}! Use \`/check ${text}\` to analyze it.`,
      { parse_mode: 'Markdown' }
    );
  }
});

bot.on('polling_error', (error) => {
  console.error('Polling error:', error.message);
});

console.log('✅ LegalChain Telegram Bot is running!');
console.log(`📡 API URL: ${API_URL}`);
console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
