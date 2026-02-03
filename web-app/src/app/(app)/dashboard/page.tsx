'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Trophy, 
  Target, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  BookOpen,
  Award,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

interface QuizResult {
  id: string;
  patternSlug: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  attemptCount?: number;
  completedAt: string;
  pattern: {
    title: string;
    category: string;
  };
}

interface QuizAttempt {
  id: string;
  patternSlug: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  passed: boolean;
  completedAt: string;
  pattern: {
    title: string;
    category: string;
  };
}

interface DashboardStats {
  totalCompleted: number;
  totalPassed: number;
  averageScore: number;
  passRate: number;
}

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [results, setResults] = useState<QuizResult[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'best' | 'history'>('best');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!isAuthenticated) return;
      
      try {
        const token = Cookies.get('token');
        
        // Fetch best results
        const resultsResponse = await fetch('http://localhost:3002/api/quiz/results', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!resultsResponse.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const resultsData = await resultsResponse.json();
        setResults(resultsData.results);
        setStats(resultsData.stats);

        // Fetch all attempts
        const attemptsResponse = await fetch('http://localhost:3002/api/quiz/attempts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (attemptsResponse.ok) {
          const attemptsData = await attemptsResponse.json();
          setAttempts(attemptsData.attempts);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setIsLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-8 px-4"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-accent" />
            Learning Dashboard
          </h1>
          <p className="text-slate-400 mt-1">
            Track your progress in smart contract security
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-400">Welcome back,</p>
          <p className="text-lg font-semibold text-white">{user?.name || user?.email}</p>
        </div>
      </motion.div>

      {/* Stats Cards */}
      {stats && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            label="Units Completed"
            value={stats.totalCompleted}
            color="accent"
          />
          <StatCard
            icon={<Trophy className="w-6 h-6" />}
            label="Units Passed"
            value={stats.totalPassed}
            color="green"
          />
          <StatCard
            icon={<Target className="w-6 h-6" />}
            label="Average Score"
            value={`${stats.averageScore}%`}
            color="blue"
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6" />}
            label="Pass Rate"
            value={`${stats.passRate}%`}
            color="purple"
          />
        </motion.div>
      )}

      {/* Quiz Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-xl overflow-hidden"
      >
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-accent" />
              Quiz Results
            </h2>
            {/* Tab switcher */}
            <div className="flex bg-slate-800/50 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('best')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-colors',
                  activeTab === 'best' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                Best Scores
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={cn(
                  'px-3 py-1 text-xs rounded-md transition-colors',
                  activeTab === 'history' ? 'bg-accent text-white' : 'text-slate-400 hover:text-white'
                )}
              >
                All Attempts ({attempts.length})
              </button>
            </div>
          </div>
          <button
            onClick={() => router.push('/education')}
            className="text-sm text-accent hover:text-accent-light transition-colors"
          >
            Take More Quizzes →
          </button>
        </div>

        {error ? (
          <div className="p-8 text-center text-red-400">
            {error}
          </div>
        ) : (activeTab === 'best' ? results : attempts).length === 0 ? (
          <div className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400 mb-4">
              {activeTab === 'best' ? "You haven't completed any quizzes yet" : "No quiz attempts recorded"}
            </p>
            <button
              onClick={() => router.push('/education')}
              className="px-4 py-2 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors"
            >
              Start Learning
            </button>
          </div>
        ) : activeTab === 'best' ? (
          <div className="divide-y divide-slate-700/50">
            {results.map((result, index) => (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * index }}
                className="p-4 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      result.passed 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    )}>
                      {result.passed ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <XCircle className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-white">
                        {result.pattern.title}
                      </h3>
                      <p className="text-sm text-slate-400 capitalize">
                        {result.pattern.category.replace('_', ' ')}
                        {result.attemptCount && result.attemptCount > 1 && (
                          <span className="ml-2 text-xs text-slate-500">
                            ({result.attemptCount} attempts)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className={cn(
                        'text-2xl font-bold',
                        result.score >= 70 ? 'text-green-400' : 'text-red-400'
                      )}>
                        {result.score}%
                      </div>
                      <div className="text-xs text-slate-500">
                        {result.correctAnswers}/{result.totalQuestions} correct
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock className="w-4 h-4" />
                      {new Date(result.completedAt).toLocaleDateString()}
                    </div>

                    {!result.passed && (
                      <button
                        onClick={() => router.push('/education')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 text-accent rounded-lg hover:bg-accent/30 transition-colors text-sm"
                      >
                        <RefreshCw className="w-4 h-4" />
                        Review
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
            {attempts.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.03 * Math.min(index, 10) }}
                className="p-3 hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-xs',
                      attempt.passed 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    )}>
                      {attempt.passed ? '✓' : '✗'}
                    </div>
                    <div>
                      <h3 className="font-medium text-white text-sm">
                        {attempt.pattern.title}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {new Date(attempt.completedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'text-lg font-bold',
                      attempt.score >= 70 ? 'text-green-400' : 'text-red-400'
                    )}>
                      {attempt.score}%
                    </div>
                    <div className="text-xs text-slate-500">
                      {attempt.correctAnswers}/{attempt.totalQuestions}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Progress Overview */}
      {stats && stats.totalCompleted > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card rounded-xl p-6"
        >
          <h2 className="text-lg font-semibold text-white mb-4">Understanding Level</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-400">Overall Progress</span>
                <span className="text-white font-medium">{stats.averageScore}%</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats.averageScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className={cn(
                    'h-full rounded-full',
                    stats.averageScore >= 70 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-400'
                      : stats.averageScore >= 50
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-400'
                        : 'bg-gradient-to-r from-red-500 to-rose-400'
                  )}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700/50">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{stats.totalPassed}</div>
                <div className="text-xs text-slate-500">Mastered</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.totalCompleted - stats.totalPassed}</div>
                <div className="text-xs text-slate-500">Needs Review</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-400">5</div>
                <div className="text-xs text-slate-500">Available</div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

function StatCard({ 
  icon, 
  label, 
  value, 
  color 
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: string | number;
  color: 'accent' | 'green' | 'blue' | 'purple';
}) {
  const colorClasses = {
    accent: 'from-accent/20 to-cyan-500/20 border-accent/30 text-accent',
    green: 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400',
    blue: 'from-blue-500/20 to-indigo-500/20 border-blue-500/30 text-blue-400',
    purple: 'from-purple-500/20 to-violet-500/20 border-purple-500/30 text-purple-400',
  };

  return (
    <div className={cn(
      'glass-card rounded-xl p-4 bg-gradient-to-br border',
      colorClasses[color]
    )}>
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-sm text-slate-400">{label}</div>
        </div>
      </div>
    </div>
  );
}
