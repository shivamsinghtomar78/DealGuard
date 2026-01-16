'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    FileText,
    ShieldAlert,
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
    "Multi-Agent": Sparkles,
    "Alternative Generator": Sparkles,
    "Legal Reasoner": Gavel,
    "Summarizer": CheckCircle,
};

const NODE_ORDER = [
    "start",
    "extract_clauses",
    "analyze_risks",
    "generate_alternatives_and_reasoning",
    "calculate_risk_score",
    "generate_summary"
];

const NODE_LABELS: Record<string, string> = {
    "start": "Initialize",
    "extract_clauses": "Extract",
    "analyze_risks": "Analyze",
    "generate_alternatives_and_reasoning": "Process",
    "generate_alternatives": "Alternatives",
    "apply_legal_reasoning": "Reasoning",
    "calculate_risk_score": "Score",
    "generate_summary": "Summary"
};

export default function AgentVisualizer({ logs, isAnalyzing }: AgentVisualizerProps) {
    const [currentLogIndex, setCurrentLogIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

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
        <div className="w-full bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden">
            {/* Header - LARGER */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-400" />
                    <span className="text-base font-semibold text-white">AI Processing</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-sm text-slate-400">
                        {isAnalyzing ? 'Processing' : 'Complete'}
                    </span>
                </div>
            </div>

            <div className="flex h-[320px]">
                {/* Left: Step Indicators - LARGER */}
                <div className="w-48 border-r border-white/10 p-5 flex flex-col gap-2 bg-[#0a0d12]">
                    {NODE_ORDER.map((node, idx) => {
                        const isActive = activeLog.node === node ||
                            (activeLog.node === 'generate_alternatives' && node === 'generate_alternatives_and_reasoning') ||
                            (activeLog.node === 'apply_legal_reasoning' && node === 'generate_alternatives_and_reasoning');
                        const isPast = NODE_ORDER.indexOf(activeLog.node) > idx;

                        return (
                            <div
                                key={node}
                                className={`
                                    flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300
                                    ${isActive ? 'bg-indigo-500/15' : ''}
                                `}
                            >
                                <div className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center text-sm font-semibold
                                    transition-all duration-300
                                    ${isActive
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/40'
                                        : isPast
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-white/5 text-slate-500'
                                    }
                                `}>
                                    {isPast ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                                </div>
                                <span className={`
                                    text-sm font-medium transition-colors duration-300
                                    ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-500'}
                                `}>
                                    {NODE_LABELS[node] || node}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Log Stream - LARGER */}
                <div className="flex-1 flex flex-col">
                    <div
                        ref={scrollRef}
                        className="flex-1 p-5 overflow-y-auto space-y-3"
                    >
                        {logs.slice(0, currentLogIndex + 1).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    p-4 rounded-xl border transition-all
                                    ${i === currentLogIndex
                                        ? 'bg-indigo-500/10 border-indigo-500/30'
                                        : 'bg-white/[0.03] border-transparent opacity-60'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`
                                        px-2.5 py-1 rounded-lg text-xs font-bold
                                        ${i === currentLogIndex ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}
                                    `}>
                                        {log.agent}
                                    </span>
                                    <span className="text-slate-500">→</span>
                                    <span className="text-sm text-indigo-400 font-semibold">{log.action}</span>
                                    <span className="text-xs text-slate-600 ml-auto">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${i === currentLogIndex ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {log.message}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Active Agent Footer - LARGER */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeLog.agent}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-5 py-4 bg-indigo-500/10 border-t border-indigo-500/20 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                                    {(() => {
                                        const Icon = AGENT_ICONS[activeLog.agent] || BrainCircuit;
                                        return <Icon className="w-6 h-6" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-base font-bold text-white">{activeLog.agent}</p>
                                    <p className="text-sm text-indigo-400">{activeLog.action}</p>
                                </div>
                            </div>
                            {isAnalyzing && (
                                <div className="flex gap-1">
                                    {[1, 2, 3].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ scaleY: [1, 1.8, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-1 h-5 bg-indigo-400 rounded-full"
                                        />
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
