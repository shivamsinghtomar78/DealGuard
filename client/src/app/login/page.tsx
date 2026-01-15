'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, User, Lock, ArrowLeft } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
});


type LoginFormData = z.infer<typeof loginSchema>;

import HeroScene from '@/components/HeroScene';

export default function LoginPage() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginFormData) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await authAPI.signin(data);
            const { user, token } = response.data;

            setUser(user, token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen bg-[#020202] text-white flex items-center justify-center p-6 overflow-hidden">
            {/* Premium 3D Background */}
            <HeroScene />

            {/* Noise Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Global Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md z-10"
            >
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-10 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Return to Base</span>
                </Link>

                {/* Form Card */}
                <div className="bg-white/[0.02] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                    {/* Interior Gradient Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-700" />

                    <div className="relative z-10">
                        {/* Logo */}
                        <div className="flex items-center gap-3 mb-12">
                            <div className="relative">
                                <Shield className="w-8 h-8 text-purple-500" />
                                <div className="absolute inset-0 bg-purple-500/30 blur-xl" />
                            </div>
                            <span className="text-2xl font-black tracking-tighter uppercase italic">
                                Deal<span className="text-purple-500">Guard</span>
                            </span>
                        </div>

                        <div className="mb-10">
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                                Access <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">Intelligence</span>
                            </h1>
                            <p className="text-white/30 text-xs font-bold uppercase tracking-widest">Initialize neural credentials</p>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-red-500/5 border border-red-500/10 text-red-500 px-4 py-3 rounded-2xl mb-8 text-[10px] font-black uppercase tracking-wider text-center"
                            >
                                {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">
                                    Identity Email
                                </label>

                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="email"
                                        {...register('email')}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-1 focus:ring-purple-500/50 outline-none text-sm font-medium transition-all placeholder:text-white/10"
                                        placeholder="Enter email address"
                                    />
                                </div>
                                {errors.email && (
                                    <p className="text-red-500/80 text-[10px] font-black uppercase tracking-wider mt-1 ml-2">{errors.email.message}</p>
                                )}

                            </div>

                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center px-2">
                                    <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">
                                        Secure Key
                                    </label>
                                    <Link href="#" className="text-[9px] font-black text-purple-500/60 hover:text-purple-400 transition-colors uppercase tracking-widest">
                                        Lost Key?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="password"
                                        {...register('password')}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-1 focus:ring-purple-500/50 outline-none text-sm font-medium transition-all placeholder:text-white/10"
                                        placeholder="••••••••"
                                    />
                                </div>
                                {errors.password && (
                                    <p className="text-red-500/80 text-[10px] font-black uppercase tracking-wider mt-1 ml-2">{errors.password.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full py-5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_15px_40px_rgba(168,85,247,0.2)] flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Syncing...</span>
                                    </>
                                ) : 'Initialize Access'}
                            </button>
                        </form>

                        <p className="text-center mt-10 text-[10px] font-black uppercase tracking-widest text-white/20">
                            New to the network?{' '}
                            <Link href="/signup" className="text-purple-500/60 hover:text-purple-400 transition-colors">
                                Create Identity
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
