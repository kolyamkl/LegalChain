import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const API_URL = process.env.API_URL || 'http://localhost:3002';
const WEB_APP_URL = process.env.WEB_APP_URL || 'http://localhost:3000';
const WEBHOOK_URL = process.env.WEBHOOK_URL || '';
const USE_WEBHOOK = process.env.USE_WEBHOOK === 'true';
const USE_REAL_API = process.env.USE_REAL_API !== 'false'; // Default to true

// Check if we can use web_app buttons (requires HTTPS)
const IS_HTTPS = WEB_APP_URL.startsWith('https://');
const IS_LOCALHOST = WEB_APP_URL.includes('localhost') || WEB_APP_URL.includes('127.0.0.1');

// Helper to create URL button that works with both HTTP and HTTPS
// Returns null for localhost since Telegram rejects HTTP URLs
function createWebButton(text: string, url: string): TelegramBot.InlineKeyboardButton | null {
  if (IS_HTTPS) {
    return { text, web_app: { url } };
  }
  // For localhost/HTTP, we can't use URL buttons at all - Telegram rejects them
  // Return null to indicate this button should be skipped
  return null;
}

// Helper to filter out null buttons from inline keyboard rows
function filterButtons(buttons: (TelegramBot.InlineKeyboardButton | null)[]): TelegramBot.InlineKeyboardButton[] {
  return buttons.filter((b): b is TelegramBot.InlineKeyboardButton => b !== null);
}

// ============================================
// REAL API CALL FUNCTION
// ============================================

interface APIAnalysis {
  analysis_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'dangerous';
  summary_short: string;
  key_findings: Array<{
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  oracle_data?: {
    tvl_usd: number | null;
    age_days: number | null;
    tx_count: number | null;
    holders_count: number | null;
    audit_status: string;
  };
}

async function callBackendAPI(value: string, inputType: 'address' | 'tx_hash'): Promise<APIAnalysis> {
  const response = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_type: inputType,
      chain_id: 1,
      value: value,
      options: {
        generate_voice: false,
        user_level: 'beginner',
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json() as { message?: string };
    throw new Error(errorData.message || 'Analysis failed');
  }

  return response.json() as Promise<APIAnalysis>;
}

if (!BOT_TOKEN || BOT_TOKEN === 'YOUR_TELEGRAM_BOT_TOKEN') {
  console.error('❌ TELEGRAM_BOT_TOKEN is not set. Please set it in .env file.');
  process.exit(1);
}

// Initialize bot with either webhook or polling
const bot = USE_WEBHOOK && WEBHOOK_URL
  ? new TelegramBot(BOT_TOKEN)
  : new TelegramBot(BOT_TOKEN, { polling: true });

console.log('🤖 LegalChain Telegram Bot is starting...');
console.log(`📡 Mode: ${USE_WEBHOOK ? 'Webhook' : 'Polling'}`);
console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
console.log(`🔌 Backend API: ${API_URL}`);
console.log(`🔗 Web App buttons: ${IS_HTTPS ? '✅ Enabled (HTTPS)' : '⚠️  Disabled (HTTP - localhost)'}`);
console.log(`🤖 Using real API: ${USE_REAL_API ? '✅ Yes' : '❌ Mock data'}`);

// ============================================
// MOCK DATA - Fallback when API is unavailable
// ============================================

interface MockAnalysis {
  analysis_id: string;
  risk_score: number;
  risk_level: 'low' | 'medium' | 'high' | 'dangerous';
  summary_short: string;
  key_findings: Array<{
    title: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
  oracle_data: {
    tvl_usd: number;
    age_days: number;
    tx_count: number;
    holders_count: number;
    audit_status: string;
  };
  contract_name?: string;
}

const MOCK_ANALYSES: Record<string, MockAnalysis> = {
  // High risk example
  high: {
    analysis_id: 'mock_high_001',
    risk_score: 78,
    risk_level: 'high',
    summary_short: 'This contract presents significant centralization and potential rug-pull risks. The owner has unrestricted access to user funds and can pause trading at will.',
    key_findings: [
      {
        title: 'Owner can drain all funds',
        severity: 'critical',
        description: 'The emergencyWithdraw function allows owner to withdraw all tokens without restrictions.',
      },
      {
        title: 'Trading can be paused indefinitely',
        severity: 'high',
        description: 'Owner can pause all transfers with no time limit or governance override.',
      },
      {
        title: 'Hidden sell restrictions',
        severity: 'high',
        description: 'MaxTxAmount limits may prevent large sells while buys are unrestricted.',
      },
    ],
    oracle_data: {
      tvl_usd: 45000,
      age_days: 3,
      tx_count: 156,
      holders_count: 89,
      audit_status: 'none',
    },
    contract_name: 'SuspiciousToken',
  },
  // Medium risk example
  medium: {
    analysis_id: 'mock_medium_001',
    risk_score: 45,
    risk_level: 'medium',
    summary_short: 'This contract has some centralization concerns but follows standard patterns. Recommend reviewing owner privileges before large investments.',
    key_findings: [
      {
        title: 'Centralized ownership',
        severity: 'medium',
        description: 'Single owner address controls key functions. Consider multi-sig.',
      },
      {
        title: 'No timelock on sensitive functions',
        severity: 'medium',
        description: 'Admin functions execute immediately without delay.',
      },
    ],
    oracle_data: {
      tvl_usd: 250000,
      age_days: 45,
      tx_count: 2340,
      holders_count: 567,
      audit_status: 'unknown',
    },
    contract_name: 'DeFiProtocol',
  },
  // Low risk example
  low: {
    analysis_id: 'mock_low_001',
    risk_score: 15,
    risk_level: 'low',
    summary_short: 'This contract follows security best practices. It has been audited and uses well-tested OpenZeppelin patterns. Low risk for standard interactions.',
    key_findings: [
      {
        title: 'Standard ERC-20 implementation',
        severity: 'low',
        description: 'Uses OpenZeppelin battle-tested contracts.',
      },
    ],
    oracle_data: {
      tvl_usd: 5000000,
      age_days: 365,
      tx_count: 125000,
      holders_count: 15000,
      audit_status: 'audited',
    },
    contract_name: 'SafeToken',
  },
};

const EDUCATIONAL_PATTERNS = [
  {
    slug: 'reentrancy',
    title: '🔄 Reentrancy Attack',
    emoji: '🔴',
    description: 'Learn how attackers exploit external calls to drain funds',
  },
  {
    slug: 'access-control',
    title: '🔐 Access Control',
    emoji: '🟠',
    description: 'Understand missing or weak access restrictions',
  },
  {
    slug: 'integer-overflow',
    title: '🔢 Integer Overflow',
    emoji: '🟡',
    description: 'How arithmetic bugs can be exploited',
  },
  {
    slug: 'honeypot',
    title: '🍯 Honeypot Patterns',
    emoji: '🔴',
    description: 'Detect tokens designed to trap your funds',
  },
  {
    slug: 'frontrunning',
    title: '⚡ Front-Running',
    emoji: '🟠',
    description: 'MEV and transaction ordering attacks',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

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

function getRiskBar(score: number): string {
  const filled = Math.round(score / 10);
  const empty = 10 - filled;
  const filledChar = score > 70 ? '🔴' : score > 40 ? '🟡' : '🟢';
  return filledChar.repeat(filled) + '⚪'.repeat(empty);
}

function getRandomMockAnalysis(): MockAnalysis {
  const types = ['high', 'medium', 'low'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  return MOCK_ANALYSES[randomType];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// ============================================
// COMMAND HANDLERS
// ============================================

// /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const firstName = msg.from?.first_name || 'there';

  const welcomeMessage = `
🛡️ *Welcome to LegalChain, ${firstName}!*

I'm your AI-powered smart contract security assistant. I analyze contracts and explain risks in plain language.

━━━━━━━━━━━━━━━━━━━━━

*🔍 What I Can Do:*

• Scan any contract address for vulnerabilities
• Detect honeypots, rug pulls, and scams
• Explain risks in simple terms
• Help you learn about smart contract security

━━━━━━━━━━━━━━━━━━━━━

*⚡ Quick Start:*

Send me a contract address to analyze:
\`/check 0x1234...5678\`

Or explore these commands:
• /check - Analyze a contract
• /learn - Security education
• /help - All commands

━━━━━━━━━━━━━━━━━━━━━

_Stay safe in Web3!_ 🚀
  `.trim();

  const webAppButton = createWebButton('🌐 Open Full App', `${WEB_APP_URL}/telegram`);
  
  await bot.sendMessage(chatId, welcomeMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🔍 Scan Contract', callback_data: 'prompt_scan' },
          { text: '📚 Learn', callback_data: 'show_learn' },
        ],
        ...(webAppButton ? [[webAppButton]] : []),
      ],
    },
  });
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;

  const helpMessage = `
📖 *LegalChain Bot Commands*

━━━━━━━━━━━━━━━━━━━━━

*🔍 Analysis Commands:*

\`/check <address>\`
Analyze a smart contract by address
_Example: /check 0x1234...5678_

\`/check <tx_hash>\`
Analyze a transaction
_Example: /check 0xabcd...efgh_

━━━━━━━━━━━━━━━━━━━━━

*📚 Learning Commands:*

\`/learn\`
Browse security education topics

\`/start\`
Show welcome message

━━━━━━━━━━━━━━━━━━━━━

*💡 Tips:*
• I auto-detect addresses vs tx hashes
• Click "View Full Analysis" for details
• Use web app for code analysis

━━━━━━━━━━━━━━━━━━━━━

_Need help? Join our community!_
  `.trim();

  const webAppButton = createWebButton('🌐 Open Web App', `${WEB_APP_URL}/telegram`);
  
  await bot.sendMessage(chatId, helpMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '🔍 Scan Contract', callback_data: 'prompt_scan' }],
        ...(webAppButton ? [[webAppButton]] : []),
      ],
    },
  });
});

// /learn command
bot.onText(/\/learn/, async (msg) => {
  const chatId = msg.chat.id;

  const patternsText = EDUCATIONAL_PATTERNS
    .map(p => `${p.emoji} *${p.title}*\n   _${p.description}_`)
    .join('\n\n');

  const learnMessage = `
📚 *Smart Contract Security Education*

Learn about common vulnerabilities and how to spot them:

━━━━━━━━━━━━━━━━━━━━━

${patternsText}

━━━━━━━━━━━━━━━━━━━━━

_Tap a topic below to learn more, or open the full education center in our web app._
  `.trim();

  const patternButtons = EDUCATIONAL_PATTERNS.slice(0, 4).map(p => ({
    text: p.title.split(' ').slice(1).join(' '),
    callback_data: `learn_${p.slug}`,
  }));

  const eduButton = createWebButton('📖 Full Education Center', `${WEB_APP_URL}/telegram?tab=education`);
  
  await bot.sendMessage(chatId, learnMessage, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        patternButtons.slice(0, 2),
        patternButtons.slice(2, 4),
        ...(eduButton ? [[eduButton]] : []),
      ],
    },
  });
});

// /check command - with mock data
bot.onText(/\/check(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const value = match?.[1]?.trim();

  if (!value) {
    await bot.sendMessage(
      chatId,
      `❌ *Missing Input*\n\nPlease provide a contract address or transaction hash.\n\n*Example:*\n\`/check 0x1234567890123456789012345678901234567890\``,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '📋 Paste from Clipboard', callback_data: 'prompt_scan' }],
          ],
        },
      }
    );
    return;
  }

  const inputType = detectInputType(value);
  if (!inputType) {
    await bot.sendMessage(
      chatId,
      `❌ *Invalid Format*\n\nPlease provide:\n• Address: \`0x\` + 40 hex characters\n• TX Hash: \`0x\` + 64 hex characters\n\n*Your input:* \`${value.slice(0, 20)}...\``,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Send scanning animation
  const scanningMsg = await bot.sendMessage(
    chatId,
    `🔍 *Analyzing ${inputType === 'address' ? 'Contract' : 'Transaction'}...*\n\n⏳ Scanning for vulnerabilities...\n\n\`${value.slice(0, 10)}...${value.slice(-8)}\``,
    { parse_mode: 'Markdown' }
  );

  try {
    let analysis: APIAnalysis | MockAnalysis;
    
    if (USE_REAL_API) {
      // Update with progress - fetching source
      await bot.editMessageText(
        `🔍 *Analyzing ${inputType === 'address' ? 'Contract' : 'Transaction'}...*\n\n✅ Fetching source code...\n⏳ Running AI security analysis...\n\n\`${value.slice(0, 10)}...${value.slice(-8)}\``,
        {
          chat_id: chatId,
          message_id: scanningMsg.message_id,
          parse_mode: 'Markdown',
        }
      );
      
      // Call real backend API
      analysis = await callBackendAPI(value, inputType);
      console.log(`✅ Real API analysis completed for ${value.slice(0, 10)}...`);
    } else {
      // Simulate analysis delay for mock
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update with progress
      await bot.editMessageText(
        `🔍 *Analyzing ${inputType === 'address' ? 'Contract' : 'Transaction'}...*\n\n✅ Fetching source code...\n⏳ Running security checks...\n\n\`${value.slice(0, 10)}...${value.slice(-8)}\``,
        {
          chat_id: chatId,
          message_id: scanningMsg.message_id,
          parse_mode: 'Markdown',
        }
      );

      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Get mock analysis
      analysis = getRandomMockAnalysis();
    }

    // Build result message
    const riskEmoji = getRiskEmoji(analysis.risk_level);
    const riskBar = getRiskBar(analysis.risk_score);
    
    const keyFindingsText = analysis.key_findings
      .slice(0, 3)
      .map((f) => `   ${getSeverityEmoji(f.severity)} ${f.title}`)
      .join('\n');

    // Handle oracle data - may be null/undefined from real API
    const oracleData = analysis.oracle_data || {
      tvl_usd: null,
      age_days: null,
      tx_count: null,
      holders_count: null,
      audit_status: 'unknown'
    };
    
    const oracleText = [
      `💰 TVL: ${oracleData.tvl_usd ? '$' + formatNumber(oracleData.tvl_usd) : 'N/A'}`,
      `📅 Age: ${oracleData.age_days ? oracleData.age_days + ' days' : 'N/A'}`,
      `📊 Txns: ${oracleData.tx_count ? formatNumber(oracleData.tx_count) : 'N/A'}`,
      `👥 Holders: ${oracleData.holders_count ? formatNumber(oracleData.holders_count) : 'N/A'}`,
    ].join(' • ');

    const auditBadge = oracleData.audit_status === 'audited' 
      ? '✅ Audited' 
      : oracleData.audit_status === 'none'
      ? '⚠️ Not Audited'
      : '❓ Unknown';

    const resultMessage = `
✅ *Analysis Complete*${USE_REAL_API ? ' (AI-Powered)' : ''}

━━━━━━━━━━━━━━━━━━━━━

${riskEmoji} *Risk Score: ${analysis.risk_score}/100*
${riskBar}
*Level:* ${analysis.risk_level.toUpperCase()} ${auditBadge}

━━━━━━━━━━━━━━━━━━━━━

📋 *Summary:*
${analysis.summary_short}

━━━━━━━━━━━━━━━━━━━━━

🔍 *Key Findings:*
${keyFindingsText || '   ✅ No critical issues found'}

━━━━━━━━━━━━━━━━━━━━━

📊 *Contract Stats:*
${oracleText}

━━━━━━━━━━━━━━━━━━━━━

📍 *${inputType === 'address' ? 'Contract' : 'Transaction'}:*
\`${value}\`
    `.trim();

    const analysisButton = createWebButton('📊 Full Analysis', `${WEB_APP_URL}/telegram?analysis_id=${analysis.analysis_id}&address=${value}`);
    
    await bot.editMessageText(resultMessage, {
      chat_id: chatId,
      message_id: scanningMsg.message_id,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          ...(analysisButton ? [[analysisButton]] : []),
          [
            { text: '🎧 Listen Summary', callback_data: `voice_${analysis.analysis_id}` },
            { text: '📤 Share', callback_data: `share_${analysis.analysis_id}` },
          ],
          [
            { text: '🔄 Scan Another', callback_data: 'prompt_scan' },
          ],
        ],
      },
    });
  } catch (error) {
    console.error('❌ Analysis error:', error);
    
    // Show error and offer to try mock analysis
    await bot.editMessageText(
      `❌ *Analysis Failed*\n\n${error instanceof Error ? error.message : 'Unknown error occurred'}\n\n_The backend server may be unavailable. Please try again later._`,
      {
        chat_id: chatId,
        message_id: scanningMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔄 Try Again', callback_data: 'prompt_scan' }],
          ],
        },
      }
    );
  }
});

// ============================================
// CALLBACK QUERY HANDLERS
// ============================================

bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  const data = query.data;

  if (!chatId || !data) return;

  await bot.answerCallbackQuery(query.id);

  // Handle different callbacks
  if (data === 'prompt_scan') {
    await bot.sendMessage(
      chatId,
      `🔍 *Ready to Scan*\n\nSend me a contract address or transaction hash:\n\n*Example:*\n\`/check 0x1234567890123456789012345678901234567890\`\n\n_Or just paste the address and I'll detect it!_`,
      { parse_mode: 'Markdown' }
    );
  }
  
  else if (data === 'show_learn') {
    // Trigger /learn command
    const patternsText = EDUCATIONAL_PATTERNS
      .map(p => `${p.emoji} *${p.title}*\n   _${p.description}_`)
      .join('\n\n');

    const learnMessage = `
📚 *Smart Contract Security Education*

Learn about common vulnerabilities and how to spot them:

━━━━━━━━━━━━━━━━━━━━━

${patternsText}

━━━━━━━━━━━━━━━━━━━━━

_Tap a topic below to learn more, or open the full education center in our web app._
    `.trim();

    const patternButtons = EDUCATIONAL_PATTERNS.slice(0, 4).map(p => ({
      text: p.title.split(' ').slice(1).join(' '),
      callback_data: `learn_${p.slug}`,
    }));

    const eduCenterButton = createWebButton('📖 Full Education Center', `${WEB_APP_URL}/telegram?tab=education`);
    
    await bot.sendMessage(chatId, learnMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          patternButtons.slice(0, 2),
          patternButtons.slice(2, 4),
          ...(eduCenterButton ? [[eduCenterButton]] : []),
        ],
      },
    });
  }
  
  else if (data.startsWith('learn_')) {
    const slug = data.replace('learn_', '');
    const pattern = EDUCATIONAL_PATTERNS.find(p => p.slug === slug);
    
    if (pattern) {
      const learnDetailMessage = `
${pattern.emoji} *${pattern.title}*

━━━━━━━━━━━━━━━━━━━━━

${pattern.description}

*What you'll learn:*
• How this vulnerability works
• Real-world exploit examples
• How to detect it in code
• Best practices to prevent it

━━━━━━━━━━━━━━━━━━━━━

_Open the education center for interactive examples with vulnerable vs. fixed code comparisons._
      `.trim();

      const learnMoreButton = createWebButton('📖 Learn More', `${WEB_APP_URL}/telegram?tab=education&pattern=${slug}`);
      
      await bot.sendMessage(chatId, learnDetailMessage, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...(learnMoreButton ? [[learnMoreButton]] : []),
            [{ text: '◀️ Back to Topics', callback_data: 'show_learn' }],
          ],
        },
      });
    }
  }
  
  else if (data.startsWith('voice_')) {
    // Mock voice response
    await bot.sendMessage(
      chatId,
      `🎧 *Voice Summary*\n\n_Voice generation is being prepared..._\n\nIn the full version, you'll hear an AI-generated audio summary explaining the contract risks in plain language.\n\n🔊 Feature coming soon!`,
      { parse_mode: 'Markdown' }
    );
  }
  
  else if (data.startsWith('share_')) {
    const analysisId = data.replace('share_', '');
    const shareUrl = `${WEB_APP_URL}/telegram?analysis_id=${analysisId}`;
    
    await bot.sendMessage(
      chatId,
      `📤 *Share Analysis*\n\nCopy this link to share:\n\n\`${shareUrl}\`\n\n_Anyone with this link can view the analysis results._`,
      { parse_mode: 'Markdown' }
    );
  }
  
  else if (data.startsWith('analyze_')) {
    const value = data.replace('analyze_', '');
    // Trigger the check command by processing it
    const inputType = detectInputType(value);
    if (inputType) {
      // Send scanning animation
      const scanningMsg = await bot.sendMessage(
        chatId,
        `🔍 *Analyzing ${inputType === 'address' ? 'Contract' : 'Transaction'}...*\n\n⏳ Scanning for vulnerabilities...\n\n\`${value.slice(0, 10)}...${value.slice(-8)}\``,
        { parse_mode: 'Markdown' }
      );

      // Simulate analysis delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get mock analysis (random for demo)
      const analysis = getRandomMockAnalysis();
      
      // Build result message
      const riskEmoji = getRiskEmoji(analysis.risk_level);
      const riskBar = getRiskBar(analysis.risk_score);
      
      const keyFindingsText = analysis.key_findings
        .slice(0, 3)
        .map((f) => `   ${getSeverityEmoji(f.severity)} ${f.title}`)
        .join('\n');

      const auditBadge = analysis.oracle_data.audit_status === 'audited' 
        ? '✅ Audited' 
        : analysis.oracle_data.audit_status === 'none'
        ? '⚠️ Not Audited'
        : '❓ Unknown';

      const resultMessage = `
✅ *Analysis Complete*

━━━━━━━━━━━━━━━━━━━━━

${riskEmoji} *Risk Score: ${analysis.risk_score}/100*
${riskBar}
*Level:* ${analysis.risk_level.toUpperCase()} ${auditBadge}

━━━━━━━━━━━━━━━━━━━━━

📋 *Summary:*
${analysis.summary_short}

━━━━━━━━━━━━━━━━━━━━━

🔍 *Key Findings:*
${keyFindingsText || '   ✅ No critical issues found'}

━━━━━━━━━━━━━━━━━━━━━

📍 *${inputType === 'address' ? 'Contract' : 'Transaction'}:*
\`${value}\`
      `.trim();

      const fullAnalysisButton = createWebButton('📊 Full Analysis', `${WEB_APP_URL}/telegram?analysis_id=${analysis.analysis_id}&address=${value}`);
      
      await bot.editMessageText(resultMessage, {
        chat_id: chatId,
        message_id: scanningMsg.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            ...(fullAnalysisButton ? [[fullAnalysisButton]] : []),
            [
              { text: '🎧 Listen Summary', callback_data: `voice_${analysis.analysis_id}` },
              { text: '📤 Share', callback_data: `share_${analysis.analysis_id}` },
            ],
            [
              { text: '🔄 Scan Another', callback_data: 'prompt_scan' },
            ],
          ],
        },
      });
    }
  }
  
  else if (data === 'cancel') {
    if (query.message) {
      await bot.deleteMessage(query.message.chat.id, query.message.message_id);
    }
  }
});

// ============================================
// MESSAGE HANDLER - Auto-detect addresses
// ============================================

bot.on('message', async (msg) => {
  // Skip if it's a command
  if (msg.text?.startsWith('/')) return;
  
  const chatId = msg.chat.id;
  const text = msg.text?.trim();

  if (!text) return;

  // Check if it looks like an address or tx hash
  if (isValidAddress(text) || isValidTxHash(text)) {
    const type = isValidAddress(text) ? 'contract address' : 'transaction hash';
    
    await bot.sendMessage(
      chatId,
      `🔍 *Detected ${type}!*\n\nWould you like me to analyze it?\n\n\`${text.slice(0, 20)}...${text.slice(-8)}\``,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '✅ Yes, Analyze', callback_data: `analyze_${text}` }],
            [{ text: '❌ No, Cancel', callback_data: 'cancel' }],
          ],
        },
      }
    );
  }
});

// ============================================
// ERROR HANDLING
// ============================================

bot.on('polling_error', (error) => {
  console.error('❌ Polling error:', error.message);
});

bot.on('error', (error) => {
  console.error('❌ Bot error:', error.message);
});

// ============================================
// WEBHOOK SETUP (for production)
// ============================================

if (USE_WEBHOOK && WEBHOOK_URL) {
  bot.setWebHook(`${WEBHOOK_URL}/api/telegram/webhook`);
  console.log(`🔗 Webhook set to: ${WEBHOOK_URL}/api/telegram/webhook`);
}

// Export for webhook handler
export { bot };

// ============================================
// STARTUP
// ============================================

console.log('✅ LegalChain Telegram Bot is running!');
console.log(`📡 API URL: ${API_URL}`);
console.log(`🌐 Web App URL: ${WEB_APP_URL}`);
console.log(`🔄 Mode: ${USE_WEBHOOK ? 'Webhook' : 'Polling'}`);
