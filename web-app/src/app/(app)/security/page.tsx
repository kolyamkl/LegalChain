'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { AnalysisInput } from '@/components/AnalysisInput';
import { AnalysisTabs } from '@/components/AnalysisTabs';
import { analyzeContract } from '@/lib/api';
import type { AnalyzeResponse, InputType } from '@/types';
import { Shield, Zap, Globe, Volume2, Sparkles } from 'lucide-react';
import { FeatureModal, featureData } from '@/components/ui/feature-modal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

type FeatureKey = 'securityAnalysis' | 'instantResults' | 'voiceSummaries' | 'multiPlatform';

export default function SecurityPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeModal, setActiveModal] = useState<FeatureKey | null>(null);

  const handleAnalyze = async (inputType: InputType, value: string, generateVoice: boolean) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await analyzeContract(inputType, value, {
        chainId: 1,
        generateVoice,
        userLevel: 'beginner',
      });
      setAnalysis(result);
      router.push(`/security?analysis_id=${result.analysis_id}`, { scroll: false });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto space-y-8"
    >
      {/* Hero Section */}
      <motion.div variants={itemVariants} className="text-center space-y-4 py-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-4"
        >
          <Sparkles className="w-4 h-4" />
          AI-Powered Security Analysis
        </motion.div>
          
        <h1 className="text-4xl md:text-5xl font-bold">
          <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            Smart Contract
          </span>
          <br />
          <span className="bg-gradient-to-r from-accent to-cyan-400 bg-clip-text text-transparent">
            Security Check
          </span>
        </h1>
          
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Analyze any smart contract for vulnerabilities and risks. Get AI-powered explanations
          in plain language with optional voice summaries.
        </p>
      </motion.div>

      {/* Analysis Input Card */}
      <motion.div 
        variants={itemVariants}
        className="glass-card rounded-2xl p-6 shadow-xl"
      >
        <AnalysisInput onAnalyze={handleAnalyze} isLoading={isLoading} />
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400"
        >
          <strong>Error:</strong> {error}
        </motion.div>
      )}

      {/* Analysis Results */}
      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnalysisTabs analysis={analysis} />
        </motion.div>
      )}

      {/* Feature Cards */}
      {!analysis && !isLoading && (
        <motion.div 
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <FeatureCard
            icon={Shield}
            title="Security Analysis"
            description="Detect vulnerabilities, scam patterns, and centralization risks"
            delay={0}
            onClick={() => setActiveModal('securityAnalysis')}
          />
          <FeatureCard
            icon={Zap}
            title="Instant Results"
            description="Get comprehensive analysis in seconds, not hours"
            delay={0.1}
            onClick={() => setActiveModal('instantResults')}
          />
          <FeatureCard
            icon={Volume2}
            title="Voice Summaries"
            description="Listen to AI-generated explanations powered by ElevenLabs"
            delay={0.2}
            onClick={() => setActiveModal('voiceSummaries')}
          />
          <FeatureCard
            icon={Globe}
            title="Multi-Platform"
            description="Access via web, Telegram bot, or browser extension"
            delay={0.3}
            onClick={() => setActiveModal('multiPlatform')}
          />
        </motion.div>
      )}

      {/* Feature Modals */}
      {activeModal && (
        <FeatureModal
          isOpen={!!activeModal}
          onClose={() => setActiveModal(null)}
          feature={featureData[activeModal]}
        />
      )}
    </motion.div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  description,
  delay = 0,
  onClick,
}: { 
  icon: typeof Shield; 
  title: string; 
  description: string;
  delay?: number;
  onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-card rounded-xl p-5 group cursor-pointer hover:border-accent/30 transition-colors"
    >
      <motion.div 
        whileHover={{ rotate: 5, scale: 1.1 }}
        className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl flex items-center justify-center mb-4 group-hover:shadow-lg group-hover:shadow-accent/20 transition-shadow"
      >
        <Icon className="w-6 h-6 text-accent" />
      </motion.div>
      <h3 className="font-semibold text-white mb-2 group-hover:text-accent transition-colors">{title}</h3>
      <p className="text-sm text-slate-400">{description}</p>
    </motion.div>
  );
}
