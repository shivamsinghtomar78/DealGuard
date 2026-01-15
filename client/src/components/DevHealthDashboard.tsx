'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Cpu, Zap, Radio, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api';

interface ServiceStatus {
    status: 'connected' | 'disconnected' | 'error' | 'loading';
    latency?: number;
}

export default function DevHealthDashboard() {
    const [services, setServices] = useState({
        backend: { status: 'loading' } as ServiceStatus,
        mongodb: { status: 'loading' } as ServiceStatus,
        ai_service: { status: 'loading' } as ServiceStatus,
        langsmith: { status: 'connected' } as ServiceStatus, // Static for now
        sentry: { status: 'connected' } as ServiceStatus, // Static for now
    });

    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchHealth = async () => {
        const start = Date.now();
        try {
            const response = await apiClient.get('/api/health');
            const latency = Date.now() - start;

            setServices(prev => ({
                ...prev,
                backend: { status: 'connected', latency },
                mongodb: { status: response.data.services.mongodb === 'connected' ? 'connected' : 'error' },
                ai_service: { status: response.data.services.ai_service === 'connected' ? 'connected' : 'error' },
            }));
        } catch (error) {
            setServices(prev => ({
                ...prev,
                backend: { status: 'disconnected' },
                mongodb: { status: 'disconnected' },
                ai_service: { status: 'disconnected' },
            }));
        }
        setLastRefresh(new Date());
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ status }: { status: ServiceStatus['status'] }) => {
        const configs = {
            connected: { color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', icon: CheckCircle2, label: 'Operational' },
            disconnected: { color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', icon: Radio, label: 'Offline' },
            error: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', icon: AlertCircle, label: 'Degraded' },
            loading: { color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20', icon: RefreshCw, label: 'Checking' },
        };
        const config = configs[status];
        const Icon = config.icon;

        return (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
                <Icon className={`w-3.5 h-3.5 ${status === 'loading' ? 'animate-spin' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{config.label}</span>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Activity className="text-indigo-400" /> System Observability
                    </h2>
                    <p className="text-slate-500 text-sm">Real-time telemetry and service heartbeat monitor.</p>
                </div>
                <button
                    onClick={fetchHealth}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-slate-400"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Latency Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                            <Zap className="w-6 h-6" />
                        </div>
                        <StatusBadge status={services.backend.status} />
                    </div>
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">API Latency</span>
                    <div className="text-3xl font-bold text-white mt-1">
                        {services.backend.latency ? `${services.backend.latency}ms` : '--'}
                    </div>
                </motion.div>

                {/* Database Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-green-500/10 text-green-400">
                            <Database className="w-6 h-6" />
                        </div>
                        <StatusBadge status={services.mongodb.status} />
                    </div>
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">Database (MongoDB)</span>
                    <div className="text-3xl font-bold text-white mt-1">
                        {services.mongodb.status === 'connected' ? 'Healthy' : 'Error'}
                    </div>
                </motion.div>

                {/* AI Service Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 backdrop-blur-xl group"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                            <Cpu className="w-6 h-6" />
                        </div>
                        <StatusBadge status={services.ai_service.status} />
                    </div>
                    <span className="text-slate-500 text-xs font-medium uppercase tracking-widest">AI Engine Status</span>
                    <div className="text-3xl font-bold text-white mt-1">
                        {services.ai_service.status === 'connected' ? 'Active' : 'Offline'}
                    </div>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                        <span className="text-sm font-medium text-slate-300">Sentry Error Tracking</span>
                    </div>
                    <StatusBadge status={services.sentry.status} />
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                        <span className="text-sm font-medium text-slate-300">LangSmith AI Tracing</span>
                    </div>
                    <StatusBadge status={services.langsmith.status} />
                </div>
            </div>

            <div className="text-center text-[10px] text-slate-600 font-mono uppercase tracking-tighter">
                Last Heartbeat: {lastRefresh.toLocaleTimeString()}
            </div>
        </div>
    );
}
