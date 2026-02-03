"use client"

import { useState } from "react"
import { X, Shield, Zap, Volume2, Globe, Check, MessageSquare, Chrome, Code, Smartphone } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FeatureModalProps {
  isOpen: boolean
  onClose: () => void
  feature: {
    title: string
    icon: React.ReactNode
    description: string
    details: string[]
    highlights?: string[]
  }
}

export function FeatureModal({ isOpen, onClose, feature }: FeatureModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="relative bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-cyan-500/5 pointer-events-none" />
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>

              {/* Content */}
              <div className="relative p-6 sm:p-8">
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: "spring" }}
                  className="w-14 h-14 bg-gradient-to-br from-accent/20 to-accent/5 rounded-2xl flex items-center justify-center mb-5 border border-accent/20"
                >
                  {feature.icon}
                </motion.div>

                {/* Title */}
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-bold text-white mb-3"
                >
                  {feature.title}
                </motion.h3>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-slate-400 mb-6 leading-relaxed"
                >
                  {feature.description}
                </motion.p>

                {/* Details list */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="space-y-3 mb-6"
                >
                  {feature.details.map((detail, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-slate-300 text-sm">{detail}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Highlights */}
                {feature.highlights && feature.highlights.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-2"
                  >
                    {feature.highlights.map((highlight, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-xs font-medium rounded-full bg-accent/10 text-accent border border-accent/20"
                      >
                        {highlight}
                      </span>
                    ))}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Feature data based on update_idea.md
export const featureData = {
  securityAnalysis: {
    title: "Security Analysis",
    icon: <Shield className="w-7 h-7 text-accent" />,
    description: "Comprehensive smart contract security analysis using multiple data sources including static analysis, pattern matching, and AI-powered vulnerability detection.",
    details: [
      "Detect reentrancy, overflow, and backdoor vulnerabilities",
      "Identify scam patterns like honeypots and hidden fees",
      "Check against known malicious contract database",
      "Control flow and data dependency analysis",
      "Run Slither and Mythril vulnerability scanners",
      "Pattern matching for safe vs dangerous code"
    ],
    highlights: ["AI-Powered", "Real-time", "Multi-chain"]
  },
  instantResults: {
    title: "Instant Results",
    icon: <Zap className="w-7 h-7 text-accent" />,
    description: "Get comprehensive security analysis in seconds, not hours. Our optimized pipeline delivers fast results without compromising on accuracy.",
    details: [
      "Quick scan in 15-20 seconds (Telegram/Extension)",
      "Full analysis in 20-40 seconds (Web app)",
      "Instant results for pre-analyzed common patterns",
      "Cached results for previously analyzed contracts",
      "Parallel processing of multiple analysis steps",
      "Optimized for speed without sacrificing accuracy"
    ],
    highlights: ["15-40 seconds", "Cached Results", "Parallel Processing"]
  },
  voiceSummaries: {
    title: "Voice Summaries",
    icon: <Volume2 className="w-7 h-7 text-accent" />,
    description: "Listen to AI-generated explanations powered by ElevenLabs. Voice tone adjusts based on risk level - calm for safe contracts, urgent for dangerous ones.",
    details: [
      "60-second voice summaries via ElevenLabs API",
      "Voice tone adjusts based on risk level (calm to urgent)",
      "Multi-language support (20+ languages)",
      "Adjustable playback speed (0.75x to 1.5x)",
      "Male/female voice selection options",
      "Makes security accessible to visually impaired users"
    ],
    highlights: ["ElevenLabs", "20+ Languages", "Adaptive Tone"]
  },
  multiPlatform: {
    title: "Multi-Platform",
    icon: <Globe className="w-7 h-7 text-accent" />,
    description: "Access LegalChain wherever you interact with Web3. Our platform is available across multiple interfaces to protect you everywhere.",
    details: [
      "Web Application - Full deep-dive analysis platform",
      "Telegram Bot & Mini App - Quick scans on-the-go",
      "Browser Extension - Real-time transaction protection",
      "SDK for Developers - Integrate into your own apps",
      "Data syncs across all platforms seamlessly",
      "One account, all platforms, always protected"
    ],
    highlights: ["Web App", "Telegram", "Extension", "SDK"]
  }
}
