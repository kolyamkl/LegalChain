"use client"

import { motion } from "framer-motion"
import { Shield, BookOpen, ArrowRight, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function SelectModePage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.1, 0.15, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center mb-12"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm font-medium mb-6"
        >
          <Sparkles className="w-4 h-4" />
          {user ? `Welcome, ${user.name || user.email}!` : "Choose Your Path"}
        </motion.div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
          What would you like to do?
        </h1>
        <p className="text-lg text-slate-400 max-w-xl mx-auto">
          Choose between analyzing smart contracts for security risks or learning about blockchain vulnerabilities.
        </p>
      </motion.div>

      <div className="relative z-10 grid md:grid-cols-2 gap-6 max-w-4xl w-full">
        {/* Security Check Card */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/security")}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 p-8 text-left transition-all hover:border-accent/50 hover:shadow-xl hover:shadow-accent/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-accent/20 transition-shadow">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-accent transition-colors">
              Security Check
            </h2>
            
            <p className="text-slate-400 mb-6 leading-relaxed">
              Analyze any smart contract for vulnerabilities, scam patterns, and risks. Get AI-powered explanations with voice summaries.
            </p>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Paste address, tx hash, or code
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Get risk score (0-100)
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                Listen to voice explanations
              </li>
            </ul>
            
            <div className="flex items-center gap-2 text-accent font-medium">
              Start Analyzing
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>

        {/* Education Card */}
        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -5 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/education")}
          className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700 p-8 text-left transition-all hover:border-cyan-500/50 hover:shadow-xl hover:shadow-cyan-500/10"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center mb-6 group-hover:shadow-lg group-hover:shadow-cyan-500/20 transition-shadow">
              <BookOpen className="w-8 h-8 text-cyan-400" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-3 group-hover:text-cyan-400 transition-colors">
              Education Mode
            </h2>
            
            <p className="text-slate-400 mb-6 leading-relaxed">
              Learn about smart contract security through interactive code analysis. Grammarly-style highlighting shows vulnerabilities.
            </p>
            
            <ul className="space-y-2 mb-6">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Browse vulnerability patterns
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Interactive code highlighting
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                Take quizzes and earn badges
              </li>
            </ul>
            
            <div className="flex items-center gap-2 text-cyan-400 font-medium">
              Start Learning
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </motion.button>
      </div>
    </div>
  )
}
