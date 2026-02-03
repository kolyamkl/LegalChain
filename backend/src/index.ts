import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import analyzeRoutes from './routes/analyze';
import educationRoutes from './routes/education';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

app.use('/api', analyzeRoutes);
app.use('/api', educationRoutes);
app.use('/api', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'LegalChain API',
    version: '1.0.0',
    endpoints: {
      analyze: 'POST /api/analyze',
      getAnalysis: 'GET /api/analysis/:id',
      getAnalysisByContract: 'GET /api/analysis/by-contract',
      analyzeEducation: 'POST /api/analyze/education',
      getPatterns: 'GET /api/education/patterns',
      getPattern: 'GET /api/education/patterns/:slug',
      health: 'GET /health',
    },
  });
});

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`🚀 LegalChain API running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});

export default app;
