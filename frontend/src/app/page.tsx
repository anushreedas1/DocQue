'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileUpload, DocumentList, SearchQuery, AnswerDisplay } from '@/components';
import type { QueryResponse } from '@/types';
import { Search, Upload, FileText, Sparkles, Brain, Zap } from 'lucide-react';

export default function Home() {
  const [searchResults, setSearchResults] = useState<QueryResponse | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');
  const [windowSize, setWindowSize] = useState({ width: 1200, height: 800 });

  useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateWindowSize();
    window.addEventListener('resize', updateWindowSize);
    return () => window.removeEventListener('resize', updateWindowSize);
  }, []);

  const handleSearchResults = (results: QueryResponse) => {
    setSearchResults(results);
  };

  const handleQueryChange = (query: string) => {
    setCurrentQuery(query);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10
      }
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Animated Background */}
      <div className="animated-bg"></div>
      
      {/* Floating Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white/20 rounded-full"
            initial={{
              x: Math.random() * windowSize.width,
              y: Math.random() * windowSize.height,
            }}
            animate={{
              y: [null, Math.random() * windowSize.height],
              x: [null, Math.random() * windowSize.width],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
          />
        ))}
      </div>

      {/* Header */}
      <motion.header 
        className="glass border-b border-white/10 sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Brain className="w-8 h-8 text-blue-400" />
                  <motion.div
                    className="absolute inset-0 bg-blue-400/20 rounded-full"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    DocQue AI
                  </h1>
                  <p className="text-sm text-white/70 mt-1">
                    Intelligent Document Search & Analysis
                  </p>
                </div>
              </div>
            </motion.div>
            
            <motion.div
              className="flex items-center space-x-4"
              initial={{ x: 50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center space-x-2 text-white/60">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">AI Powered</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="space-y-12"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Hero Section */}
          <motion.div 
            className="text-center py-12"
            variants={itemVariants}
          >
            <motion.h2 
              className="text-5xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-6"
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 100, damping: 15, delay: 0.5 }}
            >
              Transform Your Documents
            </motion.h2>
            <motion.p 
              className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed"
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              Upload, analyze, and query your documents with the power of AI. 
              Get instant answers and insights from your knowledge base.
            </motion.p>
          </motion.div>

          {/* Search Section */}
          <motion.div 
            className="glass-card rounded-2xl p-8 relative overflow-hidden"
            variants={itemVariants}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-yellow-500/20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 glass rounded-lg">
                  <Search className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold text-white">
                  Search Documents
                </h2>
                <motion.div
                  className="px-3 py-1 glass rounded-full text-xs text-blue-300 border border-blue-400/30"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  AI Enhanced
                </motion.div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <SearchQuery onResults={handleSearchResults} onQueryChange={handleQueryChange} />
                </motion.div>
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <AnswerDisplay results={searchResults} query={currentQuery} />
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upload Section */}
            <motion.div 
              className="space-y-6"
              variants={itemVariants}
            >
              <motion.div 
                className="glass-card rounded-2xl p-8 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full blur-2xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 glass rounded-lg">
                      <Upload className="w-6 h-6 text-green-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Upload Documents
                    </h2>
                    <motion.div
                      className="px-3 py-1 glass rounded-full text-xs text-green-300 border border-green-400/30"
                      animate={{ rotate: [0, 5, -5, 0] }}
                      transition={{ duration: 3, repeat: Infinity }}
                    >
                      Drag & Drop
                    </motion.div>
                  </div>
                  <FileUpload />
                </div>
              </motion.div>
            </motion.div>

            {/* Document Management Section */}
            <motion.div 
              className="space-y-6"
              variants={itemVariants}
            >
              <motion.div 
                className="glass-card rounded-2xl p-8 relative overflow-hidden"
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="p-2 glass rounded-lg">
                      <FileText className="w-6 h-6 text-purple-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Document Library
                    </h2>
                    <motion.div
                      className="px-3 py-1 glass rounded-full text-xs text-purple-300 border border-purple-400/30"
                      animate={{ y: [0, -2, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      Organized
                    </motion.div>
                  </div>
                  <DocumentList />
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Features Section */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16"
            variants={itemVariants}
          >
            {[
              {
                icon: Brain,
                title: "AI-Powered Analysis",
                description: "Advanced natural language processing for accurate document understanding",
                gradient: "from-blue-500 to-cyan-500"
              },
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Get instant answers from thousands of documents in milliseconds",
                gradient: "from-yellow-500 to-orange-500"
              },
              {
                icon: Sparkles,
                title: "Smart Insights",
                description: "Discover hidden patterns and connections across your document collection",
                gradient: "from-purple-500 to-pink-500"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="glass-card rounded-xl p-6 text-center relative overflow-hidden group"
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                delay={0.8 + index * 0.1}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="mx-auto w-12 h-12 glass rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-white/70 text-sm">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
