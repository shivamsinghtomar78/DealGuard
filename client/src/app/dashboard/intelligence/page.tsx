'use client';

import React from 'react';
import SearchInterface from '@/components/SearchInterface';
import { motion } from 'framer-motion';
import { Sparkles, BrainCircuit, Globe2 } from 'lucide-react';

export default function IntelligencePage() {
    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative z-10"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-4">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">AI Intelligence HUB</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-500">
                        Contract Intelligence
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl leading-relaxed">
                        Query your entire legal repository with semantic precision. Our neural agents analyze every clause
                        to provide instant cross-document insights.
                    </p>
                </motion.div>

                {/* Decorative background glow */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full pointer-events-none" />
                <div className="absolute top-10 right-0 w-80 h-80 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* Stats / Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { icon: BrainCircuit, label: 'Cross-Document RAG', description: 'Context-aware answers from your whole history.' },
                    { icon: Globe2, label: 'Semantic Indexing', description: 'Search by meaning, not just keywords.' },
                    { icon: Sparkles, label: 'Neural Retrieval', description: 'Pinecone-powered vector search at scale.' },
                ].map((feature, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-sm group hover:bg-white/[0.05] transition-all"
                    >
                        <feature.icon className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                        <h3 className="text-white font-bold mb-2">{feature.label}</h3>
                        <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                    </motion.div>
                ))}
            </div>

            {/* Main Interface */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="relative"
            >
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-blue-500/20 blur-2xl rounded-[2rem] opacity-50 pointer-events-none" />
                <SearchInterface />
            </motion.div>
        </div>
    );
}
