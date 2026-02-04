import { Router, Request, Response } from 'express';
import { analyzeContract, getAnalysisById, getAnalysisByContract, analyzeEducation } from '../services/analysisService';
import { analyzeRequestSchema, educationAnalyzeRequestSchema } from '../utils/validators';
import { ZodError, z } from 'zod';
import OpenAI from 'openai';

const router = Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

console.log(`🤖 OpenAI API: ${openai ? '✅ Configured' : '❌ Not configured'}`);

// Schema for direct code analysis
const codeAnalyzeSchema = z.object({
  code: z.string().min(10, 'Code must be at least 10 characters'),
  user_level: z.enum(['beginner', 'intermediate', 'expert']).default('beginner'),
});

// Main analyze endpoint
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

// Direct code analysis with GPT-4o-mini
router.post('/analyze/code', async (req: Request, res: Response) => {
  try {
    if (!openai) {
      res.status(503).json({
        error: 'LLM service unavailable',
        message: 'OpenAI API key not configured',
      });
      return;
    }

    const { code, user_level } = codeAnalyzeSchema.parse(req.body);

    const systemPrompt = `You are a smart contract security auditor. Analyze the provided Solidity code for security vulnerabilities.

Your response MUST be valid JSON with this structure:
{
  "risk_score": <number 0-100>,
  "risk_level": "low|medium|high|dangerous",
  "summary_short": "1-2 sentence overview",
  "key_findings": [
    {
      "title": "Finding name",
      "severity": "critical|high|medium|low",
      "description": "Clear explanation",
      "line_number": <number or null>,
      "code_snippet": "relevant code" or null,
      "fix_suggestion": "how to fix"
    }
  ],
  "detailed_explanation": "Full analysis with recommendations",
  "contract_type": "ERC20|ERC721|DeFi|Proxy|Custom|Unknown"
}

${user_level === 'beginner' 
  ? 'Explain findings in simple terms. Avoid jargon. Use analogies.'
  : user_level === 'intermediate'
  ? 'Provide balanced technical explanations.'
  : 'Give detailed technical analysis suitable for experienced auditors.'}

Respond with JSON only.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this smart contract code:\n\n\`\`\`solidity\n${code}\n\`\`\`` }
      ],
      temperature: 0.2,
      max_tokens: 3000,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    // Parse and validate JSON response
    const analysis = JSON.parse(content);
    
    res.json({
      success: true,
      analysis_id: `code_${Date.now()}`,
      ...analysis,
      analyzed_at: new Date().toISOString(),
      input_type: 'code',
    });

  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
      return;
    }
    console.error('[POST /api/analyze/code] Error:', error);
    res.status(500).json({
      error: 'Code analysis failed',
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
