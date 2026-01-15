'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Zap,
    Search,
    ShieldAlert,
    FileText,
    Gavel,
    CheckCircle,
    Cpu,
    Activity,
    BrainCircuit,
    Sparkles
} from 'lucide-react';

export interface AgentLog {
    agent: string;
    action: string;
    message: string;
    timestamp: Date;
    node: string;
    data?: any;
}

interface AgentVisualizerProps {
    logs: AgentLog[];
    isAnalyzing: boolean;
}

const AGENT_ICONS: Record<string, any> = {
    "System": Cpu,
    "Clause Extractor": FileText,
    "Risk Analyzer": ShieldAlert,
    "Alternative Generator": Sparkles,
    "Legal Reasoner": Gavel,
    "Summarizer": CheckCircle,
};

const NODE_ORDER = [
    "start",
    "extract_clauses",
    "analyze_risks",
    "generate_alternatives",
    "legal_reasoning",
    "calculate_risk_score",
    "generate_summary"
];

export default function AgentVisualizer({ logs, isAnalyzing }: AgentVisualizerProps) {
    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Simulate "playback" if analysis is done, or follow logs as they come
    useEffect(() => {
        if (!isAnalyzing && logs.length > 0) {
            const timer = setInterval(() => {
                setCurrentLogIndex(prev => {
                    if (prev < logs.length - 1) return prev + 1;
                    clearInterval(timer);
                    return prev;
                });
            }, 800);
            return () => clearInterval(timer);
        } else if (isAnalyzing) {
            setCurrentLogIndex(logs.length - 1);
        }
    }, [logs.length, isAnalyzing]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [currentLogIndex]);

    const activeLog = logs[currentLogIndex];
    if (!activeLog) return null;

    return (
        <div className="relative w-full bg-[#050608] border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
            {/* Header / Status Bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-white/[0.02] border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Activity className="w-4 h-4 text-indigo-400 animate-pulse" />
                        <div className="absolute inset-0 bg-indigo-500/20 blur-sm rounded-full animate-ping" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        Neural Orchestration Engine <span className="text-indigo-500 font-mono ml-2">v2.1.0-Elite</span>
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                        {isAnalyzing ? 'Live Process' : 'Simulation Complete'}
                    </span>
                </div>
            </div>

            <div className="flex h-[300px]">
                {/* Left Side: Node Visualization */}
                <div className="w-1/3 border-r border-white/5 p-6 flex flex-col justify-between relative bg-[#0a0c10]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />

                    {NODE_ORDER.map((node, idx) => {
                        const isActive = activeLog.node === node;
                        const isPast = NODE_ORDER.indexOf(activeLog.node) > idx;
                        const Icon = AGENT_ICONS[activeLog.agent] || BrainCircuit;

                        return (
                            <div key={node} className="relative flex items-center gap-4 group">
                                {idx < NODE_ORDER.length - 1 && (
                                    <div className={`absolute left-3 top-6 w-[1px] h-8 transition-colors duration-500 ${isPast ? 'bg-indigo-500/50' : 'bg-white/5'}`} />
                                )}
                                <div className={`relative z-10 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-500 ${isActive ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.5)] scale-110' :
                                        isPast ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/10 text-slate-700'
                                    }`}>
                                    {isPast ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-500 ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-700'
                                    }`}>
                                    {node.replace(/_/g, ' ')}
                                </span>

                                {isActive && (
                                    <motion.div
                                        layoutId="glow"
                                        className="absolute -inset-2 bg-indigo-500/10 blur-md rounded-xl"
                                    />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right Side: Thought Stream */}
                <div className="flex-1 flex flex-col bg-black/40">
                    <div
                        ref={scrollRef}
                        className="flex-1 p-6 overflow-y-auto custom-scrollbar space-y-4 font-mono text-xs"
                    >
                        {logs.slice(0, currentLogIndex + 1).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`p-4 rounded-2xl border transition-all ${i === currentLogIndex ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/5 opacity-40'
                                    }`}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter ${i === currentLogIndex ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                                            }`}>
                                            {log.agent}
                                        </span>
                                        <span className="text-slate-600">→</span>
                                        <span className="text-[10px] text-indigo-400 font-bold uppercase">{log.action}</span>
                                    </div>
                                    <span className="text-[8px] text-slate-700">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className={`leading-relaxed ${i === currentLogIndex ? 'text-slate-200' : 'text-slate-500'}`}>
                                    {log.message}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Active Intelligence Indicator */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeLog.agent}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="px-6 py-4 bg-indigo-600/10 border-t border-indigo-500/20 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg">
                                    {(() => {
                                        const Icon = AGENT_ICONS[activeLog.agent] || BrainCircuit;
                                        return <Icon className="w-5 h-5" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-[0.2em]">{activeLog.agent}</p>
                                    <p className="text-[9px] text-indigo-400 font-mono">{activeLog.action.toUpperCase()} PHASE ACTIVE</p>
                                </div>
                            </div>
                            <div className="flex gap-1">
                                {[1, 2, 3].map(i => (
                                    <motion.div
                                        key={i}
                                        animate={{ scaleY: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                                        className="w-0.5 h-3 bg-indigo-400 rounded-full"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
