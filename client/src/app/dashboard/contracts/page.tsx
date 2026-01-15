'use client';

import { contractAPI } from '@/lib/api';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    FileText,
    Clock,
    ChevronRight,
    Search,
    ArrowUpRight,
    ShieldAlert,
    Calendar
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import Link from 'next/link';
import { toast } from 'sonner';

interface Contract {
    _id: string;
    contractFileName: string;
    status: 'pending' | 'analyzing' | 'completed' | 'expert-review';
    overallRiskScore: number;
    purchasedAt: string;
}

export default function ContractsPage() {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const response = await contractAPI.getMyContracts();
                setContracts(response.data.data || []);
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
                toast.error('Failed to load contracts');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContracts();
    }, []);

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'analyzing':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            case 'expert-review':
                return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 8) return 'text-red-400';
        if (score >= 5) return 'text-amber-400';
        return 'text-emerald-400';
    };

    const filteredContracts = contracts.filter(c =>
        c.contractFileName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                <Loader size="lg" />
                <p className="text-slate-400">Loading contracts...</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        All Contracts
                    </h1>
                    <p className="text-slate-400">
                        {contracts.length} {contracts.length === 1 ? 'contract' : 'contracts'} analyzed
                    </p>
                </div>
                <Link href="/dashboard">
                    <Button className="bg-indigo-600 hover:bg-indigo-500 text-white">
                        <ArrowUpRight className="w-4 h-4 mr-2" />
                        New Analysis
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                    type="text"
                    placeholder="Search by filename..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Contracts List */}
            {filteredContracts.length === 0 ? (
                <Card className="border border-slate-700 bg-slate-900/50 p-12 text-center">
                    <p className="text-slate-400 text-lg mb-2">
                        {searchTerm ? `No contracts matching "${searchTerm}"` : 'No contracts yet'}
                    </p>
                    {!searchTerm && (
                        <p className="text-slate-500 mb-4">
                            Upload your first contract to get started
                        </p>
                    )}
                    {!searchTerm && (
                        <Link href="/dashboard">
                            <Button variant="outline" className="border-indigo-500 text-indigo-400">
                                Upload Contract
                            </Button>
                        </Link>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredContracts.map((contract, idx) => (
                        <motion.div
                            key={contract._id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                        >
                            <Link href={`/dashboard/analysis/${contract._id}`}>
                                <Card className="border border-slate-700 bg-slate-900/50 p-5 hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* File Info */}
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="p-3 bg-slate-800 rounded-lg">
                                                <FileText className="w-6 h-6 text-indigo-400" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="font-semibold text-white mb-1 truncate">
                                                    {contract.contractFileName}
                                                </h3>
                                                <div className="flex items-center gap-3 text-sm text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {new Date(contract.purchasedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                    <span>•</span>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(contract.purchasedAt).toLocaleTimeString('en-US', {
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status and Score */}
                                        <div className="flex items-center gap-4">
                                            <Badge className={`${getStatusStyles(contract.status)} border text-xs px-3 py-1`}>
                                                {contract.status.replace('-', ' ')}
                                            </Badge>

                                            {contract.status === 'completed' && (
                                                <div className="flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                                                    <div className="text-right">
                                                        <p className={`text-lg font-bold ${getRiskColor(contract.overallRiskScore)}`}>
                                                            {contract.overallRiskScore}<span className="text-xs text-slate-500">/10</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
