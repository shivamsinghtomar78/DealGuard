'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, ArrowRight, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { contractAPI } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

interface Contract {
    _id: string;
    contractFileName: string;
    status: 'pending' | 'analyzing' | 'completed' | 'failed';
    overallRiskScore: number;
    purchasedAt: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const response = await contractAPI.getMyContracts();
            setContracts(response.data.data || []);
        } catch (error) {
            console.error('Failed to fetch contracts:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
        },
        maxSize: 50 * 1024 * 1024,
        multiple: false,
    });

    const handleUpload = async () => {
        if (!file) return;

        try {
            setIsUploading(true);
            const formData = new FormData();
            formData.append('contract', file);
            formData.append('category', 'other');

            const response = await contractAPI.uploadAndAnalyze(formData);
            toast.success('Analysis started!');

            router.push(`/dashboard/analysis/${response.data.data.analysisId}`);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Upload failed');
            setIsUploading(false);
        }
    };

    const getStatusBadge = (status: string, score: number) => {
        if (status === 'analyzing' || status === 'pending') {
            return <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Analyzing...</span>;
        }
        if (status === 'completed') {
            const color = score >= 7 ? 'text-red-400 bg-red-500/20' : score >= 4 ? 'text-amber-400 bg-amber-500/20' : 'text-green-400 bg-green-500/20';
            return <span className={`px-2 py-1 ${color} text-xs rounded-full font-medium`}>{score}/10 Risk</span>;
        }
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 text-xs rounded-full">{status}</span>;
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-2">Contract Analysis</h1>
                <p className="text-slate-400">Upload a contract to analyze risks and get recommendations</p>
            </div>

            {/* Upload Section */}
            <div className="bg-slate-900/50 border border-slate-700 rounded-xl p-6 mb-8">
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
                        ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-600 hover:border-indigo-500/50'}
                        ${file ? 'border-indigo-500/50 bg-indigo-500/5' : ''}`}
                >
                    <input {...getInputProps()} />

                    {!file ? (
                        <div className="space-y-3">
                            <Upload className="w-10 h-10 text-indigo-400 mx-auto" />
                            <p className="text-white font-medium">
                                {isDragActive ? 'Drop your contract here' : 'Drop contract or click to browse'}
                            </p>
                            <p className="text-slate-500 text-sm">PDF or DOCX • Max 50MB</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center justify-center gap-3">
                                <FileText className="w-8 h-8 text-indigo-400" />
                                <div className="text-left">
                                    <p className="text-white font-medium">{file.name}</p>
                                    <p className="text-slate-400 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>

                            {!isUploading ? (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-colors"
                                >
                                    Start Analysis
                                </button>
                            ) : (
                                <div className="flex items-center justify-center gap-2 text-indigo-400">
                                    <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    <span>Uploading...</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Contracts List */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Your Contracts</h2>

                {isLoading ? (
                    <div className="text-center py-8 text-slate-400">Loading...</div>
                ) : contracts.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 bg-slate-900/30 rounded-lg border border-slate-800">
                        No contracts yet. Upload your first contract above.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {contracts.map((contract) => (
                            <Link key={contract._id} href={`/dashboard/analysis/${contract._id}`}>
                                <div className="flex items-center justify-between p-4 bg-slate-900/50 border border-slate-700 rounded-lg hover:border-indigo-500/50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <FileText className="w-5 h-5 text-slate-400" />
                                        <div>
                                            <p className="text-white font-medium">{contract.contractFileName}</p>
                                            <p className="text-slate-500 text-xs flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(contract.purchasedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(contract.status, contract.overallRiskScore)}
                                        <ArrowRight className="w-4 h-4 text-slate-500" />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
