'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { detectInputType } from '@/lib/api';
import type { InputType } from '@/types';

interface AnalysisInputProps {
  onAnalyze: (inputType: InputType, value: string, generateVoice: boolean) => void;
  isLoading: boolean;
}

const INPUT_TYPES = [
  { value: 'auto', label: 'Auto-detect' },
  { value: 'address', label: 'Address' },
  { value: 'tx_hash', label: 'Tx Hash' },
  { value: 'source_code', label: 'Source Code' },
] as const;

const CHAINS = [
  { id: 1, name: 'Ethereum', icon: '⟠' },
] as const;

export function AnalysisInput({ onAnalyze, isLoading }: AnalysisInputProps) {
  const [value, setValue] = useState('');
  const [inputType, setInputType] = useState<'auto' | InputType>('auto');
  const [chainId, setChainId] = useState(1);
  const [generateVoice, setGenerateVoice] = useState(false);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showChainDropdown, setShowChainDropdown] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim() || isLoading) return;

    let resolvedType: InputType;
    if (inputType === 'auto') {
      const detected = detectInputType(value);
      if (!detected) {
        alert('Could not detect input type. Please select manually.');
        return;
      }
      resolvedType = detected;
    } else {
      resolvedType = inputType;
    }

    onAnalyze(resolvedType, value.trim(), generateVoice);
  };

  const isSourceCode = inputType === 'source_code' || 
    (inputType === 'auto' && detectInputType(value) === 'source_code');

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowTypeDropdown(!showTypeDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-700/80 hover:border-accent/30 transition-all"
            >
              {INPUT_TYPES.find((t) => t.value === inputType)?.label}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <AnimatePresence>
              {showTypeDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden"
                >
                  {INPUT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => {
                        setInputType(type.value as 'auto' | InputType);
                        setShowTypeDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 transition-colors',
                        inputType === type.value && 'bg-accent/10 text-accent'
                      )}
                    >
                      {type.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowChainDropdown(!showChainDropdown)}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm font-medium hover:bg-slate-700/80 hover:border-accent/30 transition-all"
            >
              {CHAINS.find((c) => c.id === chainId)?.icon}
              {CHAINS.find((c) => c.id === chainId)?.name}
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>
            <AnimatePresence>
              {showChainDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute top-full left-0 mt-2 bg-slate-900/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-xl z-10 min-w-[140px] overflow-hidden"
                >
                  {CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      type="button"
                      onClick={() => {
                        setChainId(chain.id);
                        setShowChainDropdown(false);
                      }}
                      className={cn(
                        'w-full px-4 py-2.5 text-left text-sm hover:bg-slate-800 transition-colors flex items-center gap-2',
                        chainId === chain.id && 'bg-accent/10 text-accent'
                      )}
                    >
                      <span>{chain.icon}</span>
                      {chain.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-sm cursor-pointer hover:bg-slate-700/80 hover:border-accent/30 transition-all">
            <input
              type="checkbox"
              checked={generateVoice}
              onChange={(e) => setGenerateVoice(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-accent focus:ring-accent"
            />
            <span className="text-slate-300">🔊 Voice</span>
          </label>
        </div>

        {isSourceCode ? (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Paste Solidity source code here..."
            className="w-full h-48 px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-sm font-mono text-cyan-400 resize-y focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 placeholder-slate-500 transition-all"
          />
        ) : (
          <div className="relative group">
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Paste contract address, transaction hash, or Solidity code..."
              className="w-full px-4 py-4 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 placeholder-slate-500 transition-all"
            />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-accent transition-colors" />
          </div>
        )}
      </div>

      <motion.button
        type="submit"
        disabled={!value.trim() || isLoading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={cn(
          'w-full py-4 rounded-xl font-semibold text-white transition-all',
          'bg-gradient-to-r from-accent to-accent-dark',
          'shadow-lg shadow-accent/20 hover:shadow-accent/40',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none',
          'flex items-center justify-center gap-2'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            Analyze Contract
          </>
        )}
      </motion.button>
    </form>
  );
}
