import { Router, Request, Response } from 'express';
import { analyzeContract, getAnalysisById, getAnalysisByContract, analyzeEducation } from '../services/analysisService';
import { analyzeRequestSchema, educationAnalyzeRequestSchema } from '../utils/validators';
import { ZodError } from 'zod';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const validatedData = analyzeRequestSchema.parse(req.body);
    const result = await analyzeContract(validatedData);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    console.error('[POST /api/analyze] Error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/analysis/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const analysis = await getAnalysisById(id);
    
    if (!analysis) {
      res.status(404).json({ error: 'Analysis not found' });
      return;
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('[GET /api/analysis/:id] Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/analysis/by-contract', async (req: Request, res: Response) => {
  try {
    const chainId = parseInt(req.query.chain_id as string, 10);
    const contractAddress = req.query.contract_address as string;
    
    if (isNaN(chainId) || !contractAddress) {
      res.status(400).json({
        error: 'Missing required parameters: chain_id and contract_address',
      });
      return;
    }
    
    const analysis = await getAnalysisByContract(chainId, contractAddress);
    
    if (!analysis) {
      res.status(404).json({ error: 'No analysis found for this contract' });
      return;
    }
    
    res.json(analysis);
  } catch (error) {
    console.error('[GET /api/analysis/by-contract] Error:', error);
    res.status(500).json({
      error: 'Failed to retrieve analysis',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.post('/analyze/education', async (req: Request, res: Response) => {
  try {
    const validatedData = educationAnalyzeRequestSchema.parse(req.body);
    const result = await analyzeEducation(validatedData);
    res.json(result);
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    console.error('[POST /api/analyze/education] Error:', error);
    res.status(500).json({
      error: 'Education analysis failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
