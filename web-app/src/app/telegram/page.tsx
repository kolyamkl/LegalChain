'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  BookOpen, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ChevronRight,
  Search,
  Volume2,
  Share2,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  ExternalLink,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Mock data types
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

// Mock analyses
const MOCK_ANALYSES: Record<string, MockAnalysis> = {
  mock_high_001: {
    analysis_id: 'mock_high_001',
    risk_score: 78,
    risk_level: 'high',
    contract_name: 'SuspiciousToken',
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
  },
  mock_medium_001: {
    analysis_id: 'mock_medium_001',
    risk_score: 45,
    risk_level: 'medium',
    contract_name: 'DeFiProtocol',
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
  },
  mock_low_001: {
    analysis_id: 'mock_low_001',
    risk_score: 15,
    risk_level: 'low',
    contract_name: 'SafeToken',
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
  },
};

const EDUCATIONAL_PATTERNS = [
  {
    slug: 'reentrancy',
    title: 'Reentrancy Attack',
    emoji: '🔄',
    severity: 'critical',
    description: 'Learn how attackers exploit external calls to drain funds',
    impact: 'Complete fund loss',
  },
  {
    slug: 'access-control',
    title: 'Access Control',
    emoji: '🔐',
    severity: 'high',
    description: 'Missing or weak access restrictions on sensitive functions',
    impact: 'Unauthorized actions',
  },
  {
    slug: 'honeypot',
    title: 'Honeypot Patterns',
    emoji: '🍯',
    severity: 'critical',
    description: 'Tokens designed to trap your funds - you can buy but not sell',
    impact: 'Total fund lock',
  },
  {
    slug: 'integer-overflow',
    title: 'Integer Overflow',
    emoji: '🔢',
    severity: 'medium',
    description: 'Arithmetic bugs that can manipulate balances',
    impact: 'Balance manipulation',
  },
  {
    slug: 'frontrunning',
    title: 'Front-Running',
    emoji: '⚡',
    severity: 'medium',
    description: 'MEV bots can see and exploit your pending transactions',
    impact: 'Value extraction',
  },
];

// Helper functions
function getRiskColor(level: string) {
  switch (level) {
    case 'low': return 'text-green-400 bg-green-500/20 border-green-500/30';
    case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
    case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
    case 'dangerous': return 'text-red-400 bg-red-500/20 border-red-500/30';
    default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'critical': return 'bg-red-500 text-white';
    case 'high': return 'bg-orange-500 text-white';
    case 'medium': return 'bg-yellow-500 text-black';
    case 'low': return 'bg-blue-500 text-white';
    default: return 'bg-slate-500 text-white';
  }
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `$${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(1)}K`;
  return `$${num}`;
}

function getRiskScoreColor(score: number) {
  if (score <= 20) return 'from-green-500 to-green-600';
  if (score <= 40) return 'from-yellow-500 to-yellow-600';
  if (score <= 70) return 'from-orange-500 to-orange-600';
  return 'from-red-500 to-red-600';
}

// Components
function RiskGauge({ score }: { score: number }) {
  const rotation = (score / 100) * 180 - 90;
  
  return (
    <div className="relative w-40 h-24 mx-auto">
      {/* Background arc */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 60">
        <defs>
          <linearGradient id="riskGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22c55e" />
            <stop offset="33%" stopColor="#eab308" />
            <stop offset="66%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="url(#riskGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.3"
        />
        <motion.path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none"
          stroke="url(#riskGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: score / 100 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      
      {/* Needle */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 origin-bottom"
        initial={{ rotate: -90 }}
        animate={{ rotate: rotation }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        <div className="w-1 h-12 bg-white rounded-full shadow-lg" />
        <div className="w-3 h-3 bg-white rounded-full absolute -bottom-1 left-1/2 -translate-x-1/2" />
      </motion.div>
      
      {/* Score */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <motion.span 
          className="text-3xl font-bold text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score}
        </motion.span>
        <span className="text-sm text-slate-400">/100</span>
      </div>
    </div>
  );
}

function AnalysisView({ analysis, address }: { analysis: MockAnalysis; address?: string }) {
  const [activeSection, setActiveSection] = useState<'overview' | 'findings' | 'stats'>('overview');

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-2xl p-4"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">
              {analysis.contract_name || 'Contract Analysis'}
            </h2>
            {address && (
              <p className="text-xs text-slate-400 font-mono mt-1">
                {address.slice(0, 8)}...{address.slice(-6)}
              </p>
            )}
          </div>
          <div className={cn(
            'px-3 py-1.5 rounded-full text-sm font-medium border',
            getRiskColor(analysis.risk_level)
          )}>
            {analysis.risk_level.toUpperCase()}
          </div>
        </div>

        <RiskGauge score={analysis.risk_score} />

        <div className="flex items-center justify-center gap-2 mt-4">
          {analysis.oracle_data.audit_status === 'audited' ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Audited
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              Not Audited
            </span>
          )}
        </div>
      </motion.div>

      {/* Section Tabs */}
      <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl">
        {(['overview', 'findings', 'stats'] as const).map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={cn(
              'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
              activeSection === section
                ? 'bg-accent text-white shadow-lg shadow-accent/30'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)}
          </button>
        ))}
      </div>

      {/* Section Content */}
      <AnimatePresence mode="wait">
        {activeSection === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="glass-card rounded-2xl p-4"
          >
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Info className="w-4 h-4 text-accent" />
              Summary
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              {analysis.summary_short}
            </p>
          </motion.div>
        )}

        {activeSection === 'findings' && (
          <motion.div
            key="findings"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="space-y-3"
          >
            {analysis.key_findings.map((finding, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card rounded-xl p-4"
              >
                <div className="flex items-start gap-3">
                  <span className={cn(
                    'px-2 py-0.5 rounded text-xs font-medium shrink-0',
                    getSeverityColor(finding.severity)
                  )}>
                    {finding.severity.toUpperCase()}
                  </span>
                  <div>
                    <h4 className="font-medium text-white text-sm">
                      {finding.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {finding.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
            {analysis.key_findings.length === 0 && (
              <div className="glass-card rounded-xl p-6 text-center">
                <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-2" />
                <p className="text-slate-300">No critical issues found</p>
              </div>
            )}
          </motion.div>
        )}

        {activeSection === 'stats' && (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-3 h-3" />
                TVL
              </div>
              <p className="text-lg font-bold text-white">
                {formatNumber(analysis.oracle_data.tvl_usd)}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Clock className="w-3 h-3" />
                Age
              </div>
              <p className="text-lg font-bold text-white">
                {analysis.oracle_data.age_days} days
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <TrendingUp className="w-3 h-3" />
                Transactions
              </div>
              <p className="text-lg font-bold text-white">
                {analysis.oracle_data.tx_count.toLocaleString()}
              </p>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-3 h-3" />
                Holders
              </div>
              <p className="text-lg font-bold text-white">
                {analysis.oracle_data.holders_count.toLocaleString()}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
          <Volume2 className="w-4 h-4" />
          Listen
        </button>
        <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors">
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}

function EducationView({ patternSlug }: { patternSlug?: string }) {
  const [selectedPattern, setSelectedPattern] = useState<typeof EDUCATIONAL_PATTERNS[0] | null>(
    patternSlug ? EDUCATIONAL_PATTERNS.find(p => p.slug === patternSlug) || null : null
  );

  if (selectedPattern) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => setSelectedPattern(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to topics
        </button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-2xl p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">{selectedPattern.emoji}</span>
            <div>
              <h2 className="text-xl font-bold text-white">{selectedPattern.title}</h2>
              <span className={cn(
                'inline-block px-2 py-0.5 rounded text-xs font-medium mt-1',
                getSeverityColor(selectedPattern.severity)
              )}>
                {selectedPattern.severity.toUpperCase()}
              </span>
            </div>
          </div>

          <p className="text-slate-300 mb-4">{selectedPattern.description}</p>

          <div className="bg-slate-800/50 rounded-xl p-4">
            <h4 className="text-sm font-medium text-white mb-2">Potential Impact</h4>
            <p className="text-sm text-red-400">{selectedPattern.impact}</p>
          </div>
        </motion.div>

        <div className="glass-card rounded-2xl p-4">
          <h3 className="font-semibold text-white mb-3">What you&apos;ll learn:</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              How this vulnerability works
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Real-world exploit examples
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              How to detect it in code
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-accent" />
              Best practices to prevent it
            </li>
          </ul>
        </div>

        <button className="w-full py-3 rounded-xl bg-gradient-to-r from-accent to-accent-dark text-white font-medium shadow-lg shadow-accent/20">
          Start Learning
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center py-4">
        <h2 className="text-xl font-bold text-white mb-2">Security Education</h2>
        <p className="text-sm text-slate-400">Learn about common vulnerabilities</p>
      </div>

      <div className="space-y-3">
        {EDUCATIONAL_PATTERNS.map((pattern, index) => (
          <motion.button
            key={pattern.slug}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedPattern(pattern)}
            className="w-full glass-card rounded-xl p-4 text-left hover:bg-slate-800/50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{pattern.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-white truncate">{pattern.title}</h3>
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0',
                    getSeverityColor(pattern.severity)
                  )}>
                    {pattern.severity.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate">{pattern.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

function ScanView() {
  const [address, setAddress] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<MockAnalysis | null>(null);

  const handleScan = async () => {
    if (!address.trim()) return;
    
    setIsScanning(true);
    
    // Simulate scanning
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Get random mock result
    const types = ['mock_high_001', 'mock_medium_001', 'mock_low_001'];
    const randomType = types[Math.floor(Math.random() * types.length)];
    setResult(MOCK_ANALYSES[randomType]);
    setIsScanning(false);
  };

  if (result) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => { setResult(null); setAddress(''); }}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Scan another
        </button>
        <AnalysisView analysis={result} address={address} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center mx-auto mb-4"
        >
          <Shield className="w-8 h-8 text-white" />
        </motion.div>
        <h2 className="text-xl font-bold text-white mb-2">Contract Scanner</h2>
        <p className="text-sm text-slate-400">Paste a contract address to analyze</p>
      </div>

      <div className="glass-card rounded-xl p-4">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="0x..."
          className="w-full bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none font-mono"
        />
      </div>

      <button
        onClick={handleScan}
        disabled={!address.trim() || isScanning}
        className={cn(
          "w-full py-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
          address.trim() && !isScanning
            ? "bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/20"
            : "bg-slate-800 text-slate-500 cursor-not-allowed"
        )}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Scan Contract
          </>
        )}
      </button>

      {isScanning && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-xl p-4"
        >
          <div className="space-y-2 text-sm">
            <motion.div 
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="flex items-center gap-2 text-slate-300"
            >
              <CheckCircle className="w-4 h-4 text-green-400" />
              Fetching contract code...
            </motion.div>
            <motion.div 
              initial={{ opacity: 0.5 }}
              animate={{ opacity: 1 }}
              transition={{ repeat: Infinity, duration: 1, delay: 0.3 }}
              className="flex items-center gap-2 text-slate-400"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              Running security analysis...
            </motion.div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TelegramMiniAppContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'scan' | 'education'>('scan');

  // Parse URL parameters
  const analysisId = searchParams.get('analysis_id');
  const address = searchParams.get('address');
  const tab = searchParams.get('tab');
  const pattern = searchParams.get('pattern');

  useEffect(() => {
    if (tab === 'education') {
      setActiveTab('education');
    }
  }, [tab]);

  // If we have an analysis_id, show the analysis directly
  const analysis = analysisId ? MOCK_ANALYSES[analysisId] : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white p-4 pb-24">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-dark flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg">LegalChain</span>
        </div>
        <a 
          href="https://legalchain.app" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-xs text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
        >
          Full App
          <ExternalLink className="w-3 h-3" />
        </a>
      </motion.div>

      {/* Content */}
      {analysis ? (
        <AnalysisView analysis={analysis} address={address || undefined} />
      ) : (
        <>
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1 bg-slate-800/50 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('scan')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all',
                activeTab === 'scan'
                  ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <Shield className="w-4 h-4" />
              Scan
            </button>
            <button
              onClick={() => setActiveTab('education')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-medium transition-all',
                activeTab === 'education'
                  ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              <BookOpen className="w-4 h-4" />
              Learn
            </button>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'scan' ? (
              <motion.div
                key="scan"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <ScanView />
              </motion.div>
            ) : (
              <motion.div
                key="education"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <EducationView patternSlug={pattern || undefined} />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

export default function TelegramMiniAppPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    }>
      <TelegramMiniAppContent />
    </Suspense>
  );
}
