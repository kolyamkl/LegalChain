'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Code, ChevronRight, CheckCircle, XCircle, Loader2, GraduationCap, Sparkles, GitCompare, Info } from 'lucide-react';
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

// Line highlight types for vulnerability analysis
type LineHighlight = {
  type: 'danger' | 'warning' | 'safe';
  message: string;
};

type LineHighlights = Record<number, LineHighlight>;

// Syntax highlighting component with vulnerability annotations
function VulnerableCodeView({ 
  code, 
  highlights 
}: { 
  code: string; 
  highlights: LineHighlights;
}) {
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);

  const highlightLine = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let key = 0;

    const commentMatch = line.match(/^(.*?)(\/\/.*)$/);
    if (commentMatch) {
      tokens.push(...highlightLine(commentMatch[1]));
      tokens.push(<span key={key++} className="text-slate-500">{commentMatch[2]}</span>);
      return tokens;
    }

    const regex = /(\b(?:pragma|solidity|contract|function|public|private|external|internal|view|pure|payable|returns|return|if|else|for|while|require|mapping|address|uint256|uint|int|bool|string|bytes|memory|storage|calldata|msg|sender|value|block|timestamp|this|new|delete|true|false|import|is|abstract|interface|library|event|emit|modifier|constructor|fallback|receive)\b)|(\b\d+\b)|(["'][^"']*["'])|(\w+)|([^\w\s]+)|(\s+)/g;
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      const [, keyword, number, str, identifier, operator, whitespace] = match;
      
      if (keyword) {
        tokens.push(<span key={key++} className="text-purple-400">{keyword}</span>);
      } else if (number) {
        tokens.push(<span key={key++} className="text-orange-400">{number}</span>);
      } else if (str) {
        tokens.push(<span key={key++} className="text-green-400">{str}</span>);
      } else if (identifier) {
        tokens.push(<span key={key++} className="text-slate-200">{identifier}</span>);
      } else if (operator) {
        tokens.push(<span key={key++} className="text-cyan-300">{operator}</span>);
      } else if (whitespace) {
        tokens.push(<span key={key++}>{whitespace}</span>);
      }
    }
    
    return tokens;
  };

  const getLineClass = (lineNum: number) => {
    const highlight = highlights[lineNum];
    if (!highlight) return '';
    switch (highlight.type) {
      case 'danger': return 'bg-red-500/20 border-l-2 border-red-500';
      case 'warning': return 'bg-yellow-500/15 border-l-2 border-yellow-500';
      case 'safe': return 'bg-green-500/15 border-l-2 border-green-500';
      default: return '';
    }
  };

  const lines = code.split('\n');
  
  return (
    <div className="relative">
      {lines.map((line, lineIndex) => {
        const lineNum = lineIndex + 1;
        const highlight = highlights[lineNum];
        
        return (
          <div 
            key={lineIndex} 
            className={cn(
              "flex relative group cursor-pointer transition-colors",
              getLineClass(lineNum),
              !highlight && "hover:bg-slate-800/30"
            )}
            onMouseEnter={() => highlight && setHoveredLine(lineNum)}
            onMouseLeave={() => setHoveredLine(null)}
          >
            <span className="select-none text-slate-600 w-8 text-right pr-4 flex-shrink-0 border-r border-slate-700/30 mr-4">
              {lineNum}
            </span>
            <code className="flex-1 whitespace-pre">{highlightLine(line)}</code>
            
            {/* Tooltip indicator */}
            {highlight && (
              <span className={cn(
                "ml-2 opacity-50 group-hover:opacity-100 transition-opacity",
                highlight.type === 'danger' && "text-red-400",
                highlight.type === 'warning' && "text-yellow-400",
                highlight.type === 'safe' && "text-green-400"
              )}>
                <Info className="w-3 h-3" />
              </span>
            )}
            
            {/* Tooltip */}
            {hoveredLine === lineNum && highlight && (
              <div className={cn(
                "absolute right-4 top-full mt-1 z-50 px-3 py-2 rounded-lg text-xs max-w-sm shadow-xl whitespace-normal",
                highlight.type === 'danger' && "bg-red-900/95 border border-red-500/50 text-red-100",
                highlight.type === 'warning' && "bg-yellow-900/95 border border-yellow-500/50 text-yellow-100",
                highlight.type === 'safe' && "bg-green-900/95 border border-green-500/50 text-green-100"
              )}>
                <div className="font-medium mb-1 flex items-center gap-1">
                  {highlight.type === 'danger' && '⚠️ Security Issue'}
                  {highlight.type === 'warning' && '⚡ Caution'}
                  {highlight.type === 'safe' && '✓ Good Practice'}
                </div>
                {highlight.message}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Simple syntax highlighting for comparison view
function SyntaxHighlightedCode({ code }: { code: string }) {
  const highlightLine = (line: string): React.ReactNode[] => {
    const tokens: React.ReactNode[] = [];
    let key = 0;

    const commentMatch = line.match(/^(.*?)(\/\/.*)$/);
    if (commentMatch) {
      tokens.push(...highlightLine(commentMatch[1]));
      tokens.push(<span key={key++} className="text-slate-500">{commentMatch[2]}</span>);
      return tokens;
    }

    const regex = /(\b(?:pragma|solidity|contract|function|public|private|external|internal|view|pure|payable|returns|return|if|else|for|while|require|mapping|address|uint256|uint|int|bool|string|bytes|memory|storage|calldata|msg|sender|value|block|timestamp|this|new|delete|true|false|import|is|abstract|interface|library|event|emit|modifier|constructor|fallback|receive)\b)|(\b\d+\b)|(["'][^"']*["'])|(\w+)|([^\w\s]+)|(\s+)/g;
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      const [, keyword, number, str, identifier, operator, whitespace] = match;
      
      if (keyword) {
        tokens.push(<span key={key++} className="text-purple-400">{keyword}</span>);
      } else if (number) {
        tokens.push(<span key={key++} className="text-orange-400">{number}</span>);
      } else if (str) {
        tokens.push(<span key={key++} className="text-green-400">{str}</span>);
      } else if (identifier) {
        tokens.push(<span key={key++} className="text-slate-200">{identifier}</span>);
      } else if (operator) {
        tokens.push(<span key={key++} className="text-cyan-300">{operator}</span>);
      } else if (whitespace) {
        tokens.push(<span key={key++}>{whitespace}</span>);
      }
    }
    
    return tokens;
  };

  const lines = code.split('\n');
  
  return (
    <>
      {lines.map((line, lineIndex) => (
        <div key={lineIndex} className="flex hover:bg-slate-800/30">
          <span className="select-none text-slate-600 w-8 text-right pr-4 flex-shrink-0 border-r border-slate-700/30 mr-4">
            {lineIndex + 1}
          </span>
          <code className="flex-1 whitespace-pre">{highlightLine(line)}</code>
        </div>
      ))}
    </>
  );
}

// Generate line highlights based on pattern category
function getVulnerabilityHighlights(pattern: EducationPattern): LineHighlights {
  const highlights: LineHighlights = {};
  const lines = pattern.vulnerable_code.split('\n');
  
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim().toLowerCase();
    
    // Dangerous patterns (red)
    if (trimmed.includes('.call{value') || trimmed.includes('.call.value')) {
      highlights[lineNum] = { type: 'danger', message: 'External call that can be exploited for reentrancy attacks. State should be updated before this call.' };
    } else if (trimmed.includes('tx.origin')) {
      highlights[lineNum] = { type: 'danger', message: 'Using tx.origin for authorization is vulnerable to phishing attacks. Use msg.sender instead.' };
    } else if (trimmed.includes('selfdestruct')) {
      highlights[lineNum] = { type: 'danger', message: 'selfdestruct can be exploited if access control is weak. Ensure proper authorization.' };
    } else if (trimmed.includes('delegatecall')) {
      highlights[lineNum] = { type: 'danger', message: 'delegatecall executes code in the context of the calling contract. Can be exploited if target is untrusted.' };
    } else if (trimmed.match(/balances\[.*\]\s*[-+]=/) && !trimmed.includes('require')) {
      highlights[lineNum] = { type: 'danger', message: 'State change after external call - classic reentrancy vulnerability. Update state before external calls.' };
    } else if (trimmed.includes('private') && trimmed.includes('bool') && trimmed.includes('cansell')) {
      highlights[lineNum] = { type: 'danger', message: 'Hidden restriction variable - this is a honeypot pattern that traps users.' };
    }
    // Warning patterns (yellow)
    else if (trimmed.includes('block.timestamp')) {
      highlights[lineNum] = { type: 'warning', message: 'Block timestamp can be manipulated by miners within ~15 seconds. Avoid for critical logic.' };
    } else if (trimmed.includes('block.number')) {
      highlights[lineNum] = { type: 'warning', message: 'Block number can be predicted. Not suitable for randomness or time-sensitive operations.' };
    } else if (trimmed.match(/\+|\-|\*/) && !trimmed.includes('safemath') && !trimmed.includes('unchecked')) {
      if (trimmed.includes('uint') || trimmed.includes('int')) {
        highlights[lineNum] = { type: 'warning', message: 'Arithmetic operation without overflow protection. Consider using SafeMath or Solidity 0.8+.' };
      }
    }
    // Good practices (green)
    else if (trimmed.includes('require(') || trimmed.includes('revert(')) {
      highlights[lineNum] = { type: 'safe', message: 'Input validation with require/revert is a good security practice.' };
    } else if (trimmed.includes('onlyowner') || trimmed.includes('modifier')) {
      highlights[lineNum] = { type: 'safe', message: 'Access control modifier helps restrict function access to authorized users.' };
    } else if (trimmed.includes('reentrancyguard') || trimmed.includes('nonreentrant')) {
      highlights[lineNum] = { type: 'safe', message: 'ReentrancyGuard prevents reentrancy attacks effectively.' };
    } else if (trimmed.includes('safemath')) {
      highlights[lineNum] = { type: 'safe', message: 'SafeMath library prevents integer overflow/underflow vulnerabilities.' };
    }
  });
  
  return highlights;
}

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
  
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showCompareModal, setShowCompareModal] = useState(false);

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
    setShowQuizModal(false);
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


  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full px-4 space-y-6"
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
            className="grid grid-cols-1 lg:grid-cols-4 gap-4"
          >
            {/* Narrower sidebar */}
            <div className="lg:col-span-1 glass-card rounded-xl p-3 max-h-[70vh] overflow-y-auto">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2 text-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                Patterns
              </h2>
              {isLoadingPatterns ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-accent" />
                </div>
              ) : (
                <div className="space-y-1">
                  {patterns.map((pattern) => (
                    <button
                      key={pattern.slug}
                      onClick={() => handleSelectPattern(pattern.slug)}
                      className={cn(
                        'w-full flex items-center justify-between p-2 rounded-lg text-left transition-all duration-300',
                        selectedPattern?.slug === pattern.slug
                          ? 'bg-accent/10 border border-accent/30'
                          : 'hover:bg-slate-800/50 border border-transparent'
                      )}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-white text-xs truncate">
                          {pattern.title}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">
                          {pattern.category.replace('_', ' ')}
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wider content area */}
            <div className="lg:col-span-3 space-y-4">
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
                  {/* Header with title and actions */}
                  <div className="glass-card rounded-xl overflow-hidden">
                    <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-white">
                          {selectedPattern.title}
                        </h2>
                        <span className="text-sm text-slate-500 capitalize">
                          {selectedPattern.category.replace('_', ' ')}
                        </span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowCompareModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded-lg text-sm text-white transition-colors"
                      >
                        <GitCompare className="w-4 h-4" />
                        Compare to Fixed
                      </motion.button>
                    </div>
                    
                    {/* Only vulnerable code with highlights */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-red-400 flex items-center gap-2">
                          <span className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center text-xs">✗</span>
                          Vulnerable Code
                        </h3>
                        <div className="flex items-center gap-3 text-xs">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-red-500"></span> Dangerous</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-500"></span> Caution</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-green-500"></span> Good</span>
                        </div>
                      </div>
                      <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-700/50">
                        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/50 border-b border-slate-700/50">
                          <span className="text-xs text-slate-500">Solidity • Hover highlighted lines for details</span>
                          <span className="text-xs text-red-400">⚠ Contains Vulnerabilities</span>
                        </div>
                        <div className="p-4 text-xs font-mono leading-relaxed max-h-[50vh] overflow-y-auto overflow-x-auto">
                          <VulnerableCodeView 
                            code={selectedPattern.vulnerable_code} 
                            highlights={getVulnerabilityHighlights(selectedPattern)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Explanation and Quiz section - side by side */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-2 glass-card rounded-xl p-5">
                    <h3 className="font-semibold text-white mb-4 text-lg flex items-center gap-2">
                      <Info className="w-5 h-5 text-accent" />
                      Explanation
                    </h3>
                    <div className="prose prose-sm prose-invert max-w-none">
                      <div className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                        {selectedPattern.explanation}
                      </div>
                    </div>
                  </div>

                  {/* Take Quiz Button */}
                  <div className="lg:col-span-1 glass-card rounded-xl p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="font-semibold text-white mb-2 text-lg flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-accent" />
                        Test Your Knowledge
                      </h3>
                      <p className="text-sm text-slate-400 mb-4">
                        Complete a quiz to verify your understanding of this vulnerability pattern
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowQuizModal(true)}
                      className="w-full px-6 py-3 bg-gradient-to-r from-accent to-accent-dark text-white rounded-xl font-medium shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all flex items-center justify-center gap-2"
                    >
                      <GraduationCap className="w-5 h-5" />
                      Take Quiz
                    </motion.button>
                  </div>
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

      {/* Quiz Modal */}
      {showQuizModal && selectedPattern && (
        <QuizModal
          pattern={selectedPattern}
          onClose={() => setShowQuizModal(false)}
        />
      )}

      {/* Compare Modal */}
      {showCompareModal && selectedPattern && (
        <CompareModal
          pattern={selectedPattern}
          onClose={() => setShowCompareModal(false)}
        />
      )}
    </motion.div>
  );
}

// Compare Modal Component - side by side comparison
function CompareModal({ pattern, onClose }: { pattern: EducationPattern; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-accent" />
              Code Comparison: {pattern.title}
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Compare vulnerable code with the secure implementation
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <XCircle className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content - Side by side */}
        <div className="grid grid-cols-2 divide-x divide-slate-700/50 max-h-[70vh] overflow-hidden">
          {/* Vulnerable Code */}
          <div className="p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2 sticky top-0 bg-slate-900/95 py-2">
              <span className="w-5 h-5 rounded bg-red-500/20 flex items-center justify-center text-xs">✗</span>
              Vulnerable Code
            </h3>
            <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-red-500/30">
              <div className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                <SyntaxHighlightedCode code={pattern.vulnerable_code} />
              </div>
            </div>
          </div>

          {/* Fixed Code */}
          <div className="p-4 overflow-y-auto">
            <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2 sticky top-0 bg-slate-900/95 py-2">
              <span className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center text-xs">✓</span>
              Fixed Code
            </h3>
            <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-green-500/30">
              <div className="p-4 text-xs font-mono leading-relaxed overflow-x-auto">
                <SyntaxHighlightedCode code={pattern.fixed_code} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-700/50 bg-slate-800/30">
          <div className="text-sm text-slate-400">
            <strong className="text-white">Key Differences:</strong> The fixed version implements proper security patterns including checks-effects-interactions, access control, and input validation.
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// Quiz Modal Component with multiple questions
function QuizModal({ pattern, onClose }: { pattern: EducationPattern; onClose: () => void }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate 5 questions based on the pattern
  const questions = [
    {
      question: pattern.quiz_question,
      options: pattern.quiz_options,
      correctIndex: pattern.quiz_correct_index,
    },
    {
      question: `What type of vulnerability is demonstrated in the "${pattern.title}" pattern?`,
      options: [
        pattern.category.replace('_', ' '),
        'Integer overflow',
        'Access control',
        'Front-running',
      ],
      correctIndex: 0,
    },
    {
      question: 'Which of the following is a key indicator of this vulnerability?',
      options: [
        'State changes after external calls',
        'Proper use of SafeMath',
        'Correct access modifiers',
        'Event emissions',
      ],
      correctIndex: 0,
    },
    {
      question: 'What is the recommended fix for this type of vulnerability?',
      options: [
        'Follow checks-effects-interactions pattern',
        'Add more comments',
        'Use larger integers',
        'Remove all external calls',
      ],
      correctIndex: 0,
    },
    {
      question: 'Why is this vulnerability dangerous in smart contracts?',
      options: [
        'It can lead to loss of funds',
        'It makes code harder to read',
        'It increases gas costs',
        'It slows down transactions',
      ],
      correctIndex: 0,
    },
  ];

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    const correctCount: number = answers.reduce((count: number, answer, index) => {
      return count + (answer === questions[index].correctIndex ? 1 : 0);
    }, 0);

    // Try to save to backend (will fail silently if not authenticated)
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('token='))?.split('=')[1];
      if (token) {
        await fetch('http://localhost:3002/api/quiz/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            patternSlug: pattern.slug,
            answers: answers.map((a, i) => ({
              questionIndex: i,
              selectedAnswer: a,
              isCorrect: a === questions[i].correctIndex,
            })),
            totalQuestions: questions.length,
            correctAnswers: correctCount,
          }),
        });
      }
    } catch (err) {
      console.error('Failed to save quiz result:', err);
    }

    setIsSubmitting(false);
    setShowResults(true);
  };

  const score: number = answers.reduce((count: number, answer, index) => {
    return count + (answer === questions[index].correctIndex ? 1 : 0);
  }, 0);
  const percentage = Math.round((score / questions.length) * 100);
  const passed = percentage >= 70;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">Quiz: {pattern.title}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {showResults ? 'Results' : `Question ${currentQuestion + 1} of ${questions.length}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <XCircle className="w-5 h-5 text-slate-400" />
            </button>
          </div>
          
          {/* Progress bar */}
          {!showResults && (
            <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-cyan-500"
                initial={{ width: 0 }}
                animate={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {showResults ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className={cn(
                'w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4',
                passed ? 'bg-green-500/20' : 'bg-red-500/20'
              )}>
                {passed ? (
                  <CheckCircle className="w-12 h-12 text-green-400" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-400" />
                )}
              </div>
              
              <h3 className={cn(
                'text-3xl font-bold mb-2',
                passed ? 'text-green-400' : 'text-red-400'
              )}>
                {percentage}%
              </h3>
              
              <p className="text-slate-400 mb-2">
                {score} out of {questions.length} correct
              </p>
              
              <p className={cn(
                'text-lg font-medium mb-6',
                passed ? 'text-green-400' : 'text-red-400'
              )}>
                {passed ? '🎉 Congratulations! You passed!' : '📚 Keep learning! Review the material and try again.'}
              </p>

              <div className="flex gap-3 justify-center">
                {!passed && (
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setCurrentQuestion(0);
                      setAnswers([]);
                    }}
                    className="px-6 py-3 bg-accent/20 text-accent rounded-xl hover:bg-accent/30 transition-colors"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <h3 className="text-lg font-medium text-white mb-4">
                {questions[currentQuestion].question}
              </h3>
              
              <div className="space-y-3">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={cn(
                      'w-full p-4 rounded-xl border text-left transition-all',
                      answers[currentQuestion] === index
                        ? 'bg-accent/20 border-accent/50 text-white'
                        : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className={cn(
                        'w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs',
                        answers[currentQuestion] === index
                          ? 'border-accent bg-accent text-white'
                          : 'border-slate-600'
                      )}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      {option}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {/* Footer */}
        {!showResults && (
          <div className="p-6 border-t border-slate-700/50 flex justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestion === 0}
              className="px-4 py-2 text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            
            {currentQuestion === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={answers.some(a => a === null || a === undefined) || isSubmitting}
                className="px-6 py-2 bg-gradient-to-r from-accent to-cyan-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                disabled={answers[currentQuestion] === null || answers[currentQuestion] === undefined}
                className="px-6 py-2 bg-accent/20 text-accent rounded-xl hover:bg-accent/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function EducationPage() {
  return <EducationPageContent />;
}
