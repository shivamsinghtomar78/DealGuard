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
    "Alternative Generator": Sparkles,
    "Legal Reasoner": Gavel,
    "Summarizer": CheckCircle,
};

const NODE_ORDER = [
    "start",
    "extract_clauses",
    "analyze_risks",
    "generate_alternatives",
    "apply_legal_reasoning",
    "calculate_risk_score",
    "generate_summary"
];

const NODE_LABELS: Record<string, string> = {
    "start": "Initialize",
    "extract_clauses": "Extract",
    "analyze_risks": "Analyze",
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
        <div className="w-full bg-[#0d1117] border border-white/[0.06] rounded-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-medium text-slate-400">AI Processing</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isAnalyzing ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                    <span className="text-[10px] text-slate-500">
                        {isAnalyzing ? 'Processing' : 'Complete'}
                    </span>
                </div>
            </div>

            <div className="flex h-[260px]">
                {/* Left: Step Indicators */}
                <div className="w-40 border-r border-white/[0.06] p-4 flex flex-col gap-1 bg-[#0a0d12]">
                    {NODE_ORDER.map((node, idx) => {
                        const isActive = activeLog.node === node;
                        const isPast = NODE_ORDER.indexOf(activeLog.node) > idx;

                        return (
                            <div
                                key={node}
                                className={`
                                    flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-all duration-300
                                    ${isActive ? 'bg-indigo-500/10' : ''}
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-medium
                                    transition-all duration-300
                                    ${isActive
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                        : isPast
                                            ? 'bg-emerald-500/20 text-emerald-400'
                                            : 'bg-white/[0.04] text-slate-600'
                                    }
                                `}>
                                    {isPast ? <CheckCircle className="w-3 h-3" /> : idx + 1}
                                </div>
                                <span className={`
                                    text-[11px] font-medium transition-colors duration-300
                                    ${isActive ? 'text-white' : isPast ? 'text-slate-400' : 'text-slate-600'}
                                `}>
                                    {NODE_LABELS[node] || node}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Right: Log Stream */}
                <div className="flex-1 flex flex-col">
                    <div
                        ref={scrollRef}
                        className="flex-1 p-4 overflow-y-auto space-y-2"
                    >
                        {logs.slice(0, currentLogIndex + 1).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`
                                    p-3 rounded-xl border transition-all
                                    ${i === currentLogIndex
                                        ? 'bg-indigo-500/[0.08] border-indigo-500/20'
                                        : 'bg-white/[0.02] border-transparent opacity-50'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`
                                        px-1.5 py-0.5 rounded text-[9px] font-semibold
                                        ${i === currentLogIndex ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}
                                    `}>
                                        {log.agent}
                                    </span>
                                    <span className="text-slate-600 text-[10px]">→</span>
                                    <span className="text-[10px] text-indigo-400 font-medium">{log.action}</span>
                                    <span className="text-[9px] text-slate-700 ml-auto">
                                        {new Date(log.timestamp).toLocaleTimeString()}
                                    </span>
                                </div>
                                <p className={`text-xs leading-relaxed ${i === currentLogIndex ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {log.message}
                                </p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Active Agent Footer */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeLog.agent}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="px-4 py-3 bg-indigo-500/[0.06] border-t border-indigo-500/10 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white">
                                    {(() => {
                                        const Icon = AGENT_ICONS[activeLog.agent] || BrainCircuit;
                                        return <Icon className="w-4 h-4" />;
                                    })()}
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-white">{activeLog.agent}</p>
                                    <p className="text-[10px] text-indigo-400">{activeLog.action}</p>
                                </div>
                            </div>
                            {isAnalyzing && (
                                <div className="flex gap-0.5">
                                    {[1, 2, 3].map(i => (
                                        <motion.div
                                            key={i}
                                            animate={{ scaleY: [1, 1.5, 1] }}
                                            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                                            className="w-0.5 h-3 bg-indigo-400 rounded-full"
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
