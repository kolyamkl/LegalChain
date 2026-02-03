'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Shield, BookOpen, LogIn, LogOut, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAuth } from './AuthProvider';
import { useState } from 'react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isEducationMode = pathname.startsWith('/education');

  const handleToggle = () => {
    if (isEducationMode) {
      router.push('/');
    } else {
      router.push('/education');
    }
  };

  return (
    <motion.nav 
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="glass sticky top-0 z-50 border-b border-slate-800/50"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div 
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 bg-gradient-to-br from-accent to-accent-light rounded-xl flex items-center justify-center shadow-lg shadow-accent/20"
            >
              <Shield className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xl font-bold bg-gradient-to-r from-accent to-accent-light bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              LegalChain
            </span>
          </Link>

          {/* Center Toggle Switch */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 bg-slate-900/80 p-1 rounded-full border border-slate-700/50"
            >
              <button
                onClick={() => !isEducationMode && handleToggle()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                  !isEducationMode
                    ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/30'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Security</span>
              </button>
              
              <button
                onClick={() => isEducationMode && handleToggle()}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300',
                  isEducationMode
                    ? 'bg-gradient-to-r from-accent to-accent-dark text-white shadow-lg shadow-accent/30'
                    : 'text-slate-400 hover:text-white'
                )}
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Education</span>
              </button>
            </motion.div>
          </div>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-slate-800 animate-pulse" />
            ) : isAuthenticated ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-800/80 border border-slate-700/50 hover:border-accent/50 transition-colors"
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
                          router.push('/login');
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
                  href="/login"
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
