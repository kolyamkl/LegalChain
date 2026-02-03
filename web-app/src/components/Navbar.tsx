'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, BookOpen, LogIn, LogOut, User, FileText, Bell, Settings, LayoutDashboard, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { useState, useEffect } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('light', savedTheme === 'light');
    }
  }, []);

  const toggleTheme = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('light', newTheme === 'light');
    setShowSettingsMenu(false);
  };

  const isSecurityMode = pathname.startsWith('/security');
  const isEducationMode = pathname.startsWith('/education');

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 bg-transparent backdrop-blur-md border-b border-slate-800/30"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative w-10 h-10"
            >
              {/* Hexagon Logo */}
              <svg viewBox="0 0 40 40" className="w-full h-full">
                <defs>
                  <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#22d3ee" />
                    <stop offset="100%" stopColor="#0891b2" />
                  </linearGradient>
                </defs>
                <path 
                  d="M20 2 L36 11 L36 29 L20 38 L4 29 L4 11 Z" 
                  fill="url(#logoGradient)" 
                  className="drop-shadow-lg"
                />
                <path 
                  d="M20 8 L14 12 L14 20 L20 24 L26 20 L26 12 Z" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="1.5"
                  className="opacity-90"
                />
                <circle cx="20" cy="16" r="3" fill="white" className="opacity-90" />
              </svg>
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              LegalChain
            </span>
          </Link>

          {/* Center Toggle Switch with Tubelight Effect */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <div className="relative flex items-center bg-slate-900/90 p-1 rounded-full border border-slate-700/50 backdrop-blur-lg">
              {/* Animated Background Pill */}
              <motion.div
                className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-gradient-to-r from-accent to-cyan-500 shadow-lg shadow-accent/40"
                initial={false}
                animate={{
                  x: isEducationMode ? 'calc(100% + 4px)' : 4,
                  width: isEducationMode ? 'calc(50% - 6px)' : 'calc(50% - 6px)',
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                }}
              >
                {/* Tubelight Glow Effect */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-accent rounded-full opacity-80" />
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-12 h-4 bg-accent/30 rounded-full blur-md" />
              </motion.div>

              {/* Security Button */}
              <button
                onClick={() => router.push('/security')}
                className={cn(
                  'relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                  isSecurityMode || (!isEducationMode && !isSecurityMode)
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </button>
              
              {/* Education Button */}
              <button
                onClick={() => router.push('/education')}
                className={cn(
                  'relative z-10 flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors duration-200',
                  isEducationMode
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Education</span>
              </button>
            </div>
          </div>

          {/* Right Side - Nav Items & Auth */}
          <div className="flex items-center gap-2">
            {/* Additional Nav Buttons */}
            <div className="hidden md:flex items-center gap-1 mr-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push('/dashboard')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-accent/20 to-cyan-500/20 border border-accent/30 text-accent hover:from-accent/30 hover:to-cyan-500/30 transition-all"
                title="Dashboard"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                title="Documentation"
              >
                <FileText className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                title="Notifications"
              >
                <Bell className="w-5 h-5" />
              </motion.button>
              
              {/* Settings Button with Theme Toggle */}
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onMouseEnter={() => setShowSettingsMenu(true)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </motion.button>
                
                <AnimatePresence>
                  {showSettingsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      onMouseEnter={() => setShowSettingsMenu(true)}
                      onMouseLeave={() => setShowSettingsMenu(false)}
                      className="absolute right-0 top-full mt-2 w-48 py-2 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl"
                    >
                      <div className="px-4 py-2 border-b border-slate-700/50">
                        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Theme</p>
                      </div>
                      <button
                        onClick={() => toggleTheme('dark')}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          theme === 'dark' 
                            ? "text-accent bg-accent/10" 
                            : "text-slate-300 hover:bg-slate-800/50"
                        )}
                      >
                        <Moon className="w-4 h-4" />
                        Dark Mode
                        {theme === 'dark' && <span className="ml-auto text-accent">✓</span>}
                      </button>
                      <button
                        onClick={() => toggleTheme('light')}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                          theme === 'light' 
                            ? "text-accent bg-accent/10" 
                            : "text-slate-300 hover:bg-slate-800/50"
                        )}
                      >
                        <Sun className="w-4 h-4" />
                        Light Mode
                        {theme === 'light' && <span className="ml-auto text-accent">✓</span>}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/60 border border-slate-700/50 hover:border-accent/50 transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-accent-light flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-slate-300 hidden sm:inline max-w-[100px] truncate">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 py-2 bg-slate-900/95 backdrop-blur-xl rounded-xl border border-slate-700/50 shadow-xl"
                    >
                      <div className="px-4 py-2 border-b border-slate-700/50">
                        <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                          router.push('/');
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800/50 hover:text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href="/"
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-accent to-accent-dark text-white text-sm font-medium shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-shadow"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
