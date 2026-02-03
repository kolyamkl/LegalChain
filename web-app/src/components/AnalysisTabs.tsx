'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  AlertTriangle, 
  Database, 
  History, 
  GitCompare,
  Play,
  Pause,
  Volume2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { RiskScore } from './RiskScore';
import { 
  getRiskTextClass, 
  getSeverityBgClass, 
  formatNumber, 
  formatCurrency, 
  formatDate,
  shortenHash 
} from '@/lib/utils';
import type { AnalyzeResponse, ContractAnalysis } from '@/types';

type TabId = 'overview' | 'vulnerabilities' | 'oracle' | 'history' | 'comparison';

interface AnalysisTabsProps {
  analysis: AnalyzeResponse | ContractAnalysis;
}

const TABS: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'vulnerabilities', label: 'Vulnerabilities', icon: AlertTriangle },
  { id: 'oracle', label: 'Oracle Data', icon: Database },
  { id: 'history', label: 'History', icon: History },
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
];

export function AnalysisTabs({ analysis }: AnalysisTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [isPlaying, setIsPlaying] = useState(false);

  const vulnerabilities = 'vulnerabilities' in analysis 
    ? analysis.vulnerabilities 
    : 'vulnerability_findings' in analysis 
      ? analysis.vulnerability_findings 
      : [];

  const voiceUrl = 'voice' in analysis 
    ? analysis.voice.audio_url 
    : 'voice_asset_url' in analysis 
      ? analysis.voice_asset_url 
      : null;

  const historyData = 'history_data' in analysis ? analysis.history_data : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="flex border-b border-slate-700/50 overflow-x-auto bg-slate-900/50">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-all relative',
                activeTab === tab.id
                  ? 'text-accent'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              )}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.id === 'vulnerabilities' && vulnerabilities.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                  {vulnerabilities.length}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent"
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <RiskScore 
                  score={analysis.risk_score} 
                  level={analysis.risk_level} 
                  size="lg" 
                />
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">
                      Summary
                    </h3>
                    <p className="text-slate-300">
                      {analysis.summary_short}
                    </p>
                  </div>

                  {voiceUrl && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="w-10 h-10 flex items-center justify-center bg-accent hover:bg-accent-dark text-white rounded-full transition-colors shadow-lg shadow-accent/20"
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5" />
                        )}
                      </motion.button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-slate-300">
                          <Volume2 className="w-4 h-4 text-accent" />
                          Voice Summary
                        </div>
                        <audio
                          src={voiceUrl}
                          onPlay={() => setIsPlaying(true)}
                          onPause={() => setIsPlaying(false)}
                          onEnded={() => setIsPlaying(false)}
                          controls
                          className="w-full h-8 mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-3">
                  Key Findings
                </h3>
                <div className="space-y-2">
                  {analysis.key_findings.map((finding, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl border border-slate-700"
                    >
                      <span
                        className={cn(
                          'px-2 py-0.5 text-xs font-medium text-white rounded',
                          getSeverityBgClass(finding.severity)
                        )}
                      >
                        {finding.severity.toUpperCase()}
                      </span>
                      <div>
                        <h4 className="font-medium text-white">
                          {finding.title}
                        </h4>
                        <p className="text-sm text-slate-300 mt-1">
                          {finding.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'vulnerabilities' && (
            <motion.div
              key="vulnerabilities"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {vulnerabilities.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  No vulnerabilities detected
                </div>
              ) : (
                vulnerabilities.map((vuln, index) => (
                  <motion.div
                    key={vuln.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border border-slate-700 rounded-xl overflow-hidden"
                  >
                    <div className="flex items-center justify-between p-4 bg-slate-800/50">
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'px-2 py-0.5 text-xs font-medium text-white rounded',
                            getSeverityBgClass(vuln.severity)
                          )}
                        >
                          {vuln.severity.toUpperCase()}
                        </span>
                        <h4 className="font-medium text-white">
                          {vuln.title}
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-1 rounded">
                        {vuln.category}
                      </span>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-slate-300">
                        {vuln.description}
                      </p>
                    {vuln.code_snippet && (
                      <div className="bg-slate-900 rounded-lg p-3 overflow-x-auto">
                        <code className="text-sm text-green-400 font-mono">
                          {vuln.line_start && (
                            <span className="text-slate-500 mr-3">
                              Line {vuln.line_start}:
                            </span>
                          )}
                          {vuln.code_snippet}
                        </code>
                      </div>
                    )}
                    {vuln.fix_suggestion && (
                      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
                        <h5 className="text-sm font-medium text-accent mb-1">
                          Suggested Fix
                        </h5>
                        <p className="text-sm text-cyan-300">
                          {vuln.fix_suggestion}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

          {activeTab === 'oracle' && (
            <motion.div
              key="oracle"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
            {analysis.oracle_data ? (
              <>
                <OracleCard
                  label="TVL"
                  value={formatCurrency(analysis.oracle_data.tvl_usd)}
                />
                <OracleCard
                  label="24h Volume"
                  value={formatCurrency(analysis.oracle_data.volume_24h_usd)}
                />
                <OracleCard
                  label="Contract Age"
                  value={analysis.oracle_data.age_days !== null ? `${analysis.oracle_data.age_days} days` : 'N/A'}
                />
                <OracleCard
                  label="Transactions"
                  value={formatNumber(analysis.oracle_data.tx_count)}
                />
                <OracleCard
                  label="Holders"
                  value={formatNumber(analysis.oracle_data.holders_count)}
                />
                <OracleCard
                  label="Audit Status"
                  value={analysis.oracle_data.audit_status}
                  highlight={analysis.oracle_data.audit_status === 'audited'}
                />
              </>
            ) : (
              <div className="col-span-full text-center py-8 text-slate-400">
                No oracle data available
              </div>
            )}
          </motion.div>
        )}

          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {historyData && historyData.recent_tx_sample.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="text-sm text-slate-400">First Seen</div>
                      <div className="font-medium text-white">
                        {historyData.first_seen_at 
                          ? formatDate(historyData.first_seen_at) 
                          : 'N/A'}
                      </div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                      <div className="text-sm text-slate-400">Last Activity</div>
                      <div className="font-medium text-white">
                        {historyData.last_seen_at 
                          ? formatDate(historyData.last_seen_at) 
                          : 'N/A'}
                      </div>
                    </div>
                  </div>
                  <h4 className="font-medium text-white">
                    Recent Transactions
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Hash</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Method</th>
                          <th className="text-left py-2 px-3 font-medium text-slate-400">Time</th>
                          <th className="text-right py-2 px-3 font-medium text-slate-400">Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {historyData.recent_tx_sample.map((tx, index) => (
                          <tr key={index} className="border-b border-slate-700/50">
                            <td className="py-2 px-3 font-mono text-accent">
                              {shortenHash(tx.hash)}
                            </td>
                            <td className="py-2 px-3">
                              <span className="px-2 py-0.5 bg-slate-700 rounded text-xs text-slate-300">
                                {tx.method || 'transfer'}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-400">
                              {formatDate(tx.timestamp)}
                            </td>
                            <td className="py-2 px-3 text-right font-mono text-white">
                              {(parseInt(tx.value) / 1e18).toFixed(4)} ETH
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400">
                  No transaction history available
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'comparison' && (
            <motion.div
              key="comparison"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="text-center py-12"
            >
              <GitCompare className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-300">
                Coming Soon
              </h3>
              <p className="text-sm text-slate-400 mt-2">
                Compare this contract with similar contracts to identify differences and potential risks.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function OracleCard({ 
  label, 
  value, 
  highlight = false 
}: { 
  label: string; 
  value: string; 
  highlight?: boolean;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        'p-4 rounded-xl border transition-colors',
        highlight 
          ? 'bg-green-500/10 border-green-500/30' 
          : 'bg-slate-800/50 border-slate-700 hover:border-accent/30'
      )}
    >
      <div className="text-sm text-slate-400">{label}</div>
      <div className={cn(
        'text-lg font-semibold mt-1',
        highlight ? 'text-green-400' : 'text-white'
      )}>
        {value}
      </div>
    </motion.div>
  );
}
