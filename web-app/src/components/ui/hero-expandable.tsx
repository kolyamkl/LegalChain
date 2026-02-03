"use client"

import { useState, useEffect } from "react"
import { X, Check, ArrowRight, Shield, BookOpen, Mail, Lock, User, Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/AuthProvider"

export default function HeroExpandable() {
  const router = useRouter()
  const { login, register, isAuthenticated } = useAuth()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [formStep, setFormStep] = useState<"idle" | "submitting" | "success">("idle")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExpand = () => setIsExpanded(true)
  
  const handleClose = () => {
    setIsExpanded(false)
    setTimeout(() => {
      setFormStep("idle")
      setError(null)
    }, 500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFormStep("submitting")
    
    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, name)
      }
      setFormStep("success")
      setTimeout(() => {
        router.push("/select-mode")
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed")
      setFormStep("idle")
    }
  }

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => { document.body.style.overflow = "unset" }
  }, [isExpanded])

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/select-mode")
    }
  }, [isAuthenticated, router])

  return (
    <>
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 sm:px-6 py-12 sm:py-20">
        
        {/* Animated Background */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-blue-500/5" />
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

        <div className="relative z-10 flex flex-col items-center gap-6 sm:gap-8 text-center max-w-4xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent backdrop-blur-sm"
          >
            <span className="flex h-2 w-2 rounded-full bg-accent mr-2 animate-pulse"></span>
            AI-Powered Smart Contract Security
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white max-w-4xl"
          >
            Understand Every <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-cyan-400">
              Smart Contract
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg md:text-xl text-slate-400 max-w-2xl px-4 leading-relaxed"
          >
            Stop approving transactions you don't understand. LegalChain analyzes smart contracts 
            and explains risks in plain language with AI-powered voice summaries.
          </motion.p>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-8 mt-4"
          >
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-slate-500">Users approve blindly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">$1.5B+</div>
              <div className="text-sm text-slate-500">Lost to scams yearly</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white">30s</div>
              <div className="text-sm text-slate-500">Average analysis time</div>
            </div>
          </motion.div>

          <AnimatePresence initial={false}>
            {!isExpanded && (
              <motion.div className="inline-block relative mt-6">
                <motion.div
                  style={{ borderRadius: "100px" }}
                  layout
                  layoutId="cta-card"
                  className="absolute inset-0 bg-gradient-to-r from-accent to-cyan-500"
                />
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  layout={false}
                  onClick={handleExpand}
                  className="relative flex items-center gap-2 h-14 px-8 py-3 text-lg font-medium text-white tracking-wide hover:opacity-90 transition-opacity"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Expanded Modal */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
            <motion.div
              layoutId="cta-card"
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              style={{ borderRadius: "24px" }}
              layout
              className="relative flex h-full w-full overflow-hidden bg-gradient-to-br from-cyan-600 to-accent sm:rounded-[24px] shadow-2xl"
            >
              {/* Close Button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleClose}
                className="absolute right-4 top-4 sm:right-8 sm:top-8 z-50 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </motion.button>

              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="relative z-10 flex flex-col lg:flex-row h-full w-full max-w-7xl mx-auto overflow-y-auto lg:overflow-hidden"
              >
                {/* Left Side: Problem/Solution */}
                <div className="flex-1 flex flex-col justify-center p-8 sm:p-12 lg:p-16 gap-8 text-white">
                  <div className="space-y-4">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
                      The Problem We Solve
                    </h2>
                    <p className="text-cyan-100 text-lg max-w-md">
                      Billions are lost annually to smart contract scams because users can't understand what they're signing.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <Shield className="w-6 h-6 text-cyan-200" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">AI-Powered Analysis</h3>
                        <p className="text-cyan-100/80 text-sm leading-relaxed mt-1">
                          Our AI analyzes smart contracts using multiple data sources and explains risks in plain language.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10">
                        <BookOpen className="w-6 h-6 text-cyan-200" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Learn As You Go</h3>
                        <p className="text-cyan-100/80 text-sm leading-relaxed mt-1">
                          Interactive education mode teaches you about vulnerabilities with Grammarly-style code highlighting.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-8 border-t border-white/20">
                    <figure>
                      <blockquote className="text-xl font-medium leading-relaxed mb-6">
                        "95% of users approve transactions without understanding what the smart contract actually does."
                      </blockquote>
                      <figcaption className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-cyan-400 to-accent flex items-center justify-center text-lg font-bold text-white">
                          LC
                        </div>
                        <div>
                          <div className="font-semibold">LegalChain Research</div>
                          <div className="text-sm text-cyan-200">Web3 Security Report 2024</div>
                        </div>
                      </figcaption>
                    </figure>
                  </div>
                </div>

                {/* Right Side: Login/Register Form */}
                <div className="flex-1 flex items-center justify-center p-4 sm:p-12 lg:p-16 bg-black/10 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none">
                  <div className="w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 sm:p-8 shadow-2xl">
                    
                    {formStep === "success" ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center text-center h-[400px] space-y-6"
                      >
                        <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
                          <Check className="w-10 h-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">Welcome to LegalChain!</h3>
                          <p className="text-cyan-100">Redirecting you to choose your mode...</p>
                        </div>
                      </motion.div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold text-white">
                            {isLogin ? "Welcome Back" : "Create Account"}
                          </h3>
                          <p className="text-sm text-cyan-200">
                            {isLogin ? "Sign in to continue" : "Join LegalChain today"}
                          </p>
                        </div>

                        {/* Toggle Login/Register */}
                        <div className="flex bg-white/10 rounded-lg p-1">
                          <button
                            type="button"
                            onClick={() => setIsLogin(true)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                              isLogin ? "bg-white text-cyan-700" : "text-white hover:bg-white/10"
                            }`}
                          >
                            Sign In
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsLogin(false)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                              !isLogin ? "bg-white text-cyan-700" : "text-white hover:bg-white/10"
                            }`}
                          >
                            Sign Up
                          </button>
                        </div>

                        {error && (
                          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 text-red-200 text-sm">
                            {error}
                          </div>
                        )}

                        <div className="space-y-4">
                          {!isLogin && (
                            <div>
                              <label htmlFor="name" className="block text-xs font-medium text-cyan-200 mb-1.5 uppercase tracking-wider">
                                Full Name
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                                <input
                                  type="text"
                                  id="name"
                                  value={name}
                                  onChange={(e) => setName(e.target.value)}
                                  placeholder="John Doe"
                                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-cyan-950/40 border border-cyan-300/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all text-sm"
                                />
                              </div>
                            </div>
                          )}

                          <div>
                            <label htmlFor="email" className="block text-xs font-medium text-cyan-200 mb-1.5 uppercase tracking-wider">
                              Email
                            </label>
                            <div className="relative">
                              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                              <input
                                required
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full pl-10 pr-4 py-3 rounded-lg bg-cyan-950/40 border border-cyan-300/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all text-sm"
                              />
                            </div>
                          </div>

                          <div>
                            <label htmlFor="password" className="block text-xs font-medium text-cyan-200 mb-1.5 uppercase tracking-wider">
                              Password
                            </label>
                            <div className="relative">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                              <input
                                required
                                type={showPassword ? "text" : "password"}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-12 py-3 rounded-lg bg-cyan-950/40 border border-cyan-300/20 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all text-sm"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                              >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                              </button>
                            </div>
                          </div>
                        </div>

                        <button
                          disabled={formStep === "submitting"}
                          type="submit"
                          className="w-full flex items-center justify-center px-8 py-3.5 rounded-lg bg-white text-cyan-700 font-semibold hover:bg-cyan-50 focus:ring-4 focus:ring-cyan-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                          {formStep === "submitting" ? (
                             <span className="flex items-center gap-2">
                               <Loader2 className="h-4 w-4 animate-spin" />
                               {isLogin ? "Signing in..." : "Creating account..."}
                             </span>
                          ) : (
                            isLogin ? "Sign In" : "Create Account"
                          )}
                        </button>
                        
                        <p className="text-xs text-center text-cyan-200/60 mt-4">
                          By continuing, you agree to our Terms of Service and Privacy Policy.
                        </p>
                      </form>
                    )}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
