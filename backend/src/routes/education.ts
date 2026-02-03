import { Router, Request, Response } from 'express';
import { getAllPatterns, getPatternBySlug } from '../services/educationService';

const router = Router();

router.get('/education/patterns', async (req: Request, res: Response) => {
  try {
    const patterns = getAllPatterns();
    res.json(patterns);
  } catch (error) {
    console.error('[GET /api/education/patterns] Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve patterns',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/education/patterns/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const pattern = getPatternBySlug(slug);
    
    if (!pattern) {
      res.status(404).json({ error: 'Pattern not found' });
      return;
    }
    
    res.json(pattern);
  } catch (error) {
    console.error('[GET /api/education/patterns/:slug] Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve pattern',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
