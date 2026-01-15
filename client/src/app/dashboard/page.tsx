'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload,
    FileText,
    XCircle,
    FileUp,
    ArrowRight,
    Clock,
    ShieldAlert
} from 'lucide-react';
import { contractAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { toast } from 'sonner';
import Link from 'next/link';

interface Contract {
    _id: string;
    contractFileName: string;
    status: 'pending' | 'analyzing' | 'completed' | 'expert-review';
    overallRiskScore: number;
    purchasedAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [recentContracts, setRecentContracts] = useState<Contract[]>([]);
    const [isLoadingContracts, setIsLoadingContracts] = useState(true);

    useEffect(() => {
        const fetchRecentContracts = async () => {
            try {
                const response = await contractAPI.getMyContracts();
                setRecentContracts((response.data.data || []).slice(0, 5));
            } catch (error) {
                console.error('Failed to fetch contracts:', error);
            } finally {
                setIsLoadingContracts(false);
            }
        };
        fetchRecentContracts();
    }, []);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
            'application/msword': ['.doc'],
        },
        maxSize: 50 * 1024 * 1024,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 5, 95));
            }, 800);

            const formData = new FormData();
            formData.append('contract', file);
            formData.append('category', 'other');

            const response = await contractAPI.uploadAndAnalyze(formData);

            clearInterval(progressInterval);
            setUploadProgress(100);
            toast.success('Analysis started successfully');

            setTimeout(() => {
                router.push(`/dashboard/analysis/${response.data.data.analysisId}`);
            }, 800);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed. Please try again.');
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const getStatusStyles = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'analyzing':
                return 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse';
            default:
                return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const getRiskColor = (score: number) => {
        if (score >= 8) return 'text-red-400';
        if (score >= 5) return 'text-amber-400';
        return 'text-emerald-400';
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 py-8">
            {/* Simple Header */}
            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold text-white">
                    Contract Analysis
                </h1>
                <p className="text-slate-400 text-lg">
                    Upload your contract for AI-powered risk analysis
                </p>
            </div>

            {/* Upload Section */}
            <Card className="border border-slate-700 bg-slate-900/50 p-8">
                <div
                    {...getRootProps()}
                    className={`
                        border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-indigo-500 bg-indigo-500/5' : 'border-slate-600 hover:border-indigo-500/50'}
                        ${file ? 'border-indigo-500/50 bg-indigo-500/5' : ''}
                    `}
                >
                    <input {...getInputProps()} />

                    <AnimatePresence mode="wait">
                        {!file ? (
                            <motion.div
                                key="upload-prompt"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="space-y-4"
                            >
                                <div className="inline-flex p-4 bg-slate-800 rounded-xl">
                                    <FileUp className="w-12 h-12 text-indigo-400" />
                                </div>
                                <div>
                                    <p className="text-xl font-semibold text-white mb-2">
                                        {isDragActive ? 'Drop your contract here' : 'Drop contract or click to browse'}
                                    </p>
                                    <p className="text-slate-500">
                                        PDF or DOCX • Max 50MB
                                    </p>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="file-ready"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-8 h-8 text-indigo-400" />
                                        <div className="text-left">
                                            <p className="font-semibold text-white">{file.name}</p>
                                            <p className="text-sm text-slate-400">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                        }}
                                        className="p-2 text-slate-400 hover:text-white transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </div>

                                {!isUploading ? (
                                    <Button
                                        size="lg"
                                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleUpload();
                                        }}
                                    >
                                        Start Analysis
                                    </Button>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Loader size="sm" />
                                                <span className="text-white font-medium">Processing...</span>
                                            </div>
                                            <span className="text-indigo-400 font-semibold">{uploadProgress}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden">
                                            <motion.div
                                                className="h-full bg-indigo-500"
                                                initial={{ width: 0 }}
                                                animate={{ width: `${uploadProgress}%` }}
                                                transition={{ duration: 0.5 }}
                                            />
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </Card>

            {/* Recent Contracts */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-white">Recent Analyses</h2>
                    <Link href="/dashboard/contracts">
                        <Button variant="ghost" size="sm" className="text-indigo-400 hover:text-indigo-300">
                            View All
                            <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                </div>

                {isLoadingContracts ? (
                    <div className="flex justify-center py-8">
                        <Loader size="md" />
                    </div>
                ) : recentContracts.length === 0 ? (
                    <Card className="border border-slate-700 bg-slate-900/50 p-8 text-center">
                        <p className="text-slate-400">No analyses yet. Upload your first contract to get started.</p>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {recentContracts.map((contract) => (
                            <Link key={contract._id} href={`/dashboard/analysis/${contract._id}`}>
                                <Card className="border border-slate-700 bg-slate-900/50 p-4 hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <FileText className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-white truncate">
                                                    {contract.contractFileName}
                                                </p>
                                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(contract.purchasedAt).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric'
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge className={`${getStatusStyles(contract.status)} border text-xs px-2 py-1`}>
                                                {contract.status}
                                            </Badge>
                                            {contract.status === 'completed' && (
                                                <div className="flex items-center gap-1">
                                                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                                                    <span className={`font-bold ${getRiskColor(contract.overallRiskScore)}`}>
                                                        {contract.overallRiskScore}/10
                                                    </span>
                                                </div>
                                            )}
                                            <ArrowRight className="w-4 h-4 text-slate-500" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
