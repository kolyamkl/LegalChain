'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, ChevronRight, CheckCircle, XCircle, Loader2, GraduationCap, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  getEducationPatterns, 
  getEducationPattern, 
  analyzeEducationCode 
} from '@/lib/api';
import type { 
  EducationPatternSummary, 
  EducationPattern, 
  EducationAnalyzeResponse 
} from '@/types';
import { getSeverityBgClass } from '@/lib/utils';
import { ProtectedRoute } from '@/components/ProtectedRoute';

type Tab = 'library' | 'custom';

function EducationPageContent() {
  const [activeTab, setActiveTab] = useState<Tab>('library');
  const [patterns, setPatterns] = useState<EducationPatternSummary[]>([]);
  const [selectedPattern, setSelectedPattern] = useState<EducationPattern | null>(null);
  const [isLoadingPatterns, setIsLoadingPatterns] = useState(true);
  const [isLoadingPattern, setIsLoadingPattern] = useState(false);
  
  const [customCode, setCustomCode] = useState('');
  const [customAnalysis, setCustomAnalysis] = useState<EducationAnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    const fetchPatterns = async () => {
      try {
        const result = await getEducationPatterns();
        setPatterns(result);
      } catch (err) {
        console.error('Failed to fetch patterns:', err);
      } finally {
        setIsLoadingPatterns(false);
      }
    };
    fetchPatterns();
  }, []);

  const handleSelectPattern = async (slug: string) => {
    setIsLoadingPattern(true);
    setQuizAnswer(null);
    setQuizSubmitted(false);
    try {
      const pattern = await getEducationPattern(slug);
      setSelectedPattern(pattern);
    } catch (err) {
      console.error('Failed to fetch pattern:', err);
    } finally {
      setIsLoadingPattern(false);
    }
  };

  const handleAnalyzeCustomCode = async () => {
    if (!customCode.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysisError(null);
    setCustomAnalysis(null);
    
    try {
      const result = await analyzeEducationCode(customCode);
      setCustomAnalysis(result);
    } catch (err) {
      setAnalysisError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleQuizSubmit = () => {
    setQuizSubmitted(true);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4 py-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium"
        >
          <GraduationCap className="w-4 h-4" />
          Interactive Learning
        </motion.div>
        
        <h1 className="text-3xl md:text-4xl font-bold">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Learn Smart Contract
          </span>
          <br />
          <span className="bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent">
            Security
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Explore vulnerability patterns and analyze your own code
        </p>
      </motion.div>

      {/* Tab Switcher */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 justify-center"
      >
        <div className="flex bg-slate-900/80 p-1 rounded-full border border-slate-700/50">
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300',
              activeTab === 'library'
                ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/30'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <BookOpen className="w-4 h-4" />
            Pattern Library
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 rounded-full font-medium transition-all duration-300',
              activeTab === 'custom'
                ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/30'
                : 'text-slate-400 hover:text-white'
            )}
          >
            <Code className="w-4 h-4" />
            Custom Code
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <div className="lg:col-span-1 glass-card rounded-xl p-4">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              Vulnerability Patterns
            </h2>
            {isLoadingPatterns ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
              </div>
            ) : (
              <div className="space-y-2">
                {patterns.map((pattern) => (
                  <button
                    key={pattern.slug}
                    onClick={() => handleSelectPattern(pattern.slug)}
                    className={cn(
                      'w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-300',
                      selectedPattern?.slug === pattern.slug
                        ? 'bg-accent/10 border border-accent/30 shadow-lg shadow-accent/10'
                        : 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700'
                    )}
                  >
                    <div>
                      <div className="font-medium text-white text-sm">
                        {pattern.title}
                      </div>
                      <div className="text-xs text-slate-400 capitalize">
                        {pattern.category.replace('_', ' ')}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {isLoadingPattern ? (
              <div className="glass-card rounded-xl p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : selectedPattern ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="glass-card rounded-xl overflow-hidden">
                  <div className="p-4 border-b border-slate-700/50">
                    <h2 className="text-xl font-semibold text-white">
                      {selectedPattern.title}
                    </h2>
                    <span className="text-sm text-slate-500 capitalize">
                      {selectedPattern.category.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-700/50">
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-red-600 mb-2">
                        ❌ Vulnerable Code
                      </h3>
                      <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                        {selectedPattern.vulnerable_code}
                      </pre>
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-medium text-green-600 mb-2">
                        ✅ Fixed Code
                      </h3>
                      <pre className="bg-slate-900 text-green-400 p-3 rounded-lg text-xs overflow-x-auto font-mono">
                        {selectedPattern.fixed_code}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">
                    Explanation
                  </h3>
                  <div className="prose prose-sm prose-invert max-w-none">
                    <div className="text-slate-300 whitespace-pre-wrap text-sm">
                      {selectedPattern.explanation}
                    </div>
                  </div>
                </div>

                <div className="glass-card rounded-xl p-4">
                  <h3 className="font-semibold text-white mb-3">
                    🧪 Quiz
                  </h3>
                  <p className="text-slate-300 mb-4">
                    {selectedPattern.quiz_question}
                  </p>
                  <div className="space-y-2">
                    {selectedPattern.quiz_options.map((option, index) => (
                      <label
                        key={index}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          quizSubmitted
                            ? index === selectedPattern.quiz_correct_index
                              ? 'bg-green-500/10 border-green-500/30'
                              : quizAnswer === index
                                ? 'bg-red-500/10 border-red-500/30'
                                : 'border-slate-700'
                            : quizAnswer === index
                              ? 'bg-accent/10 border-accent/30'
                              : 'border-slate-700 hover:bg-slate-800/50'
                        )}
                      >
                        <input
                          type="radio"
                          name="quiz"
                          checked={quizAnswer === index}
                          onChange={() => !quizSubmitted && setQuizAnswer(index)}
                          disabled={quizSubmitted}
                          className="w-4 h-4"
                        />
                        <span className="flex-1 text-sm">{option}</span>
                        {quizSubmitted && index === selectedPattern.quiz_correct_index && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {quizSubmitted && quizAnswer === index && index !== selectedPattern.quiz_correct_index && (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                      </label>
                    ))}
                  </div>
                  {!quizSubmitted && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleQuizSubmit}
                      disabled={quizAnswer === null}
                      className="mt-4 px-6 py-2.5 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow"
                    >
                      Check Answer
                    </motion.button>
                  )}
                  {quizSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        'mt-4 p-3 rounded-lg',
                        quizAnswer === selectedPattern.quiz_correct_index
                          ? 'bg-green-500/10 text-green-400'
                          : 'bg-red-500/10 text-red-400'
                      )}>
                      {quizAnswer === selectedPattern.quiz_correct_index
                        ? '🎉 Correct! Great job understanding this vulnerability.'
                        : '❌ Not quite. Review the explanation above and try again.'}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="glass-card rounded-xl p-8 text-center">
                <BookOpen className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  Select a pattern from the library to learn about it
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === 'custom' && (
        <motion.div
          key="custom"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="grid lg:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="glass-card rounded-xl p-4">
              <h2 className="font-semibold text-white mb-3">
                Paste Your Solidity Code
              </h2>
              <textarea
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                placeholder="// Paste your Solidity code here...
pragma solidity ^0.8.0;

contract MyContract {
    // ...
}"
                className="w-full h-64 p-3 bg-slate-950 text-cyan-400 rounded-lg font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-accent/50 border border-slate-700"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAnalyzeCustomCode}
                disabled={!customCode.trim() || isAnalyzing}
                className="mt-4 w-full py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Code className="w-4 h-4" />
                    Analyze Code
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="space-y-4">
            {analysisError && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400">
                <strong>Error:</strong> {analysisError}
              </div>
            )}

            {customAnalysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="glass-card rounded-xl p-4">
                  <h2 className="font-semibold text-white mb-3">
                    Analysis Results
                  </h2>
                  <p className="text-slate-300 text-sm mb-4">
                    {customAnalysis.summary}
                  </p>
                  
                  {customAnalysis.issues.length === 0 ? (
                    <div className="text-center py-4 text-green-400">
                      ✅ No issues detected
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {customAnalysis.issues.map((issue, index) => (
                        <div
                          key={index}
                          className="border border-slate-700 rounded-lg p-3 bg-slate-800/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className={cn(
                              'px-2 py-0.5 text-xs font-medium text-white rounded',
                              getSeverityBgClass(issue.severity)
                            )}>
                              {issue.severity.toUpperCase()}
                            </span>
                            <span className="font-medium text-white text-sm">
                              {issue.title}
                            </span>
                          </div>
                          <p className="text-sm text-slate-300">
                            {issue.description}
                          </p>
                          {issue.line_start && (
                            <div className="mt-2 text-xs text-slate-500">
                              Line {issue.line_start}
                              {issue.line_end && issue.line_end !== issue.line_start && `-${issue.line_end}`}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {customAnalysis.overview && (
                  <div className="glass-card rounded-xl p-4">
                    <h3 className="font-semibold text-white mb-3">
                      Detailed Overview
                    </h3>
                    <div className="text-sm text-slate-300 whitespace-pre-wrap">
                      {customAnalysis.overview}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {!customAnalysis && !analysisError && (
              <div className="glass-card rounded-xl p-8 text-center">
                <Code className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <p className="text-slate-400">
                  Paste your Solidity code and click Analyze to see results
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function EducationPage() {
  return <EducationPageContent />;
}
