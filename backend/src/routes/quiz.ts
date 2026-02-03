import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

// Middleware to verify JWT token
const authenticateToken = (req: Request, res: Response, next: Function) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { userId: string };
    (req as any).userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Submit quiz result
router.post('/submit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { patternSlug, answers, totalQuestions, correctAnswers } = req.body;

    const score = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = score >= 70;

    const result = await prisma.quizResult.upsert({
      where: {
        userId_patternSlug: {
          userId,
          patternSlug,
        },
      },
      update: {
        score,
        totalQuestions,
        correctAnswers,
        answers,
        passed,
        completedAt: new Date(),
      },
      create: {
        userId,
        patternSlug,
        score,
        totalQuestions,
        correctAnswers,
        answers,
        passed,
      },
    });

    res.json({
      success: true,
      result: {
        id: result.id,
        score: result.score,
        passed: result.passed,
        correctAnswers: result.correctAnswers,
        totalQuestions: result.totalQuestions,
      },
    });
  } catch (error) {
    console.error('Quiz submit error:', error);
    res.status(500).json({ error: 'Failed to submit quiz result' });
  }
});

// Get user's quiz results (for dashboard)
router.get('/results', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;

    const results = await prisma.quizResult.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    // Get pattern details for each result
    const patternSlugs = results.map((r: any) => r.patternSlug);
    const patterns = await prisma.educationPattern.findMany({
      where: { slug: { in: patternSlugs } },
      select: { slug: true, title: true, category: true },
    });

    const patternMap = new Map(patterns.map((p: any) => [p.slug, p]));

    const enrichedResults = results.map((r: any) => ({
      ...r,
      pattern: patternMap.get(r.patternSlug) || { title: r.patternSlug, category: 'unknown' },
    }));

    // Calculate stats
    const totalCompleted = results.length;
    const totalPassed = results.filter((r: any) => r.passed).length;
    const averageScore = results.length > 0 
      ? Math.round(results.reduce((sum: number, r: any) => sum + r.score, 0) / results.length)
      : 0;

    res.json({
      results: enrichedResults,
      stats: {
        totalCompleted,
        totalPassed,
        averageScore,
        passRate: totalCompleted > 0 ? Math.round((totalPassed / totalCompleted) * 100) : 0,
      },
    });
  } catch (error) {
    console.error('Get quiz results error:', error);
    res.status(500).json({ error: 'Failed to get quiz results' });
  }
});

// Get result for specific pattern
router.get('/result/:patternSlug', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const { patternSlug } = req.params;

    const result = await prisma.quizResult.findUnique({
      where: {
        userId_patternSlug: {
          userId,
          patternSlug,
        },
      },
    });

    res.json({ result });
  } catch (error) {
    console.error('Get quiz result error:', error);
    res.status(500).json({ error: 'Failed to get quiz result' });
  }
});

export default router;
