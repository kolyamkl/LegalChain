import { Router } from 'express';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// Telegram Bot Token
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';

// Initialize bot without polling for webhook mode
let bot: TelegramBot | null = null;

if (BOT_TOKEN && BOT_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN') {
  bot = new TelegramBot(BOT_TOKEN);
  console.log('📱 Telegram webhook handler initialized');
}

// Webhook endpoint for Telegram updates
router.post('/telegram/webhook', async (req, res) => {
  if (!bot) {
    console.error('❌ Telegram bot not initialized - missing BOT_TOKEN');
    return res.status(500).json({ error: 'Bot not configured' });
  }

  try {
    // Process the update
    const update = req.body;
    
    // Let the bot handle the update
    bot.processUpdate(update);
    
    // Always respond with 200 OK to Telegram
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    // Still respond with 200 to prevent Telegram from retrying
    res.status(200).json({ ok: false });
  }
});

// Health check for webhook
router.get('/telegram/webhook/health', (req, res) => {
  res.json({
    status: bot ? 'configured' : 'not_configured',
    timestamp: new Date().toISOString(),
  });
});

// Export bot for use in other handlers if needed
export { bot };
export default router;
