'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Shield, Lock, User, Building, ArrowLeft, ArrowRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    username: z.string().min(3, 'Username must be 3-10 characters').max(10, 'Username must be 3-10 characters'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(20, 'Password must be at most 20 characters')
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
            'Password must contain at least one uppercase, one lowercase, one number and one special character'),
    company: z.string().optional(),
});

type SignupFormData = z.infer<typeof signupSchema>;

import HeroScene from '@/components/HeroScene';

export default function SignupPage() {
    const router = useRouter();
    const setUser = useAuthStore((state) => state.setUser);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<SignupFormData>({
        resolver: zodResolver(signupSchema),
    });

    const onSubmit = async (data: SignupFormData) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await authAPI.signup(data);
            const { user, token } = response.data;

            setUser(user, token);
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Signup failed. Please try again.');
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
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/5 blur-[150px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative w-full max-w-md z-10 py-10"
            >
                {/* Back Button */}
                <Link href="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white mb-10 transition-colors group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-black uppercase tracking-widest">Abort & Return</span>
                </Link>

                {/* Form Card */}
                <div className="bg-white/[0.01] border border-white/5 p-10 rounded-[2.5rem] shadow-2xl backdrop-blur-3xl relative overflow-hidden group">
                    {/* Interior Gradient Glow */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-purple-500/10 blur-[60px] rounded-full group-hover:bg-purple-500/20 transition-colors duration-700" />

                    <div className="relative z-10">
                        <div className="mb-10 text-center">
                            {/* Logo */}
                            <div className="flex items-center justify-center gap-3 mb-6">
                                <div className="relative">
                                    <Shield className="w-8 h-8 text-purple-500" />
                                    <div className="absolute inset-0 bg-purple-500/30 blur-xl" />
                                </div>
                                <span className="text-2xl font-black tracking-tighter uppercase italic">
                                    Deal<span className="text-purple-500">Guard</span>
                                </span>
                            </div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                                New <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-white">Identity</span>
                            </h1>
                            <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.2em]">Join the neural legal network</p>
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

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">
                                    Legal Name
                                </label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="text"
                                        {...register('name')}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-1 focus:ring-purple-500/50 outline-none text-sm font-medium transition-all placeholder:text-white/10"
                                        placeholder="Full Name"
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-500/80 text-[10px] font-black uppercase tracking-wider mt-1 ml-2">{errors.name.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">
                                    Identity Handle
                                </label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                    <input
                                        type="text"
                                        {...register('username')}
                                        className="w-full pl-14 pr-6 py-4 bg-white/[0.03] border border-white/5 rounded-2xl focus:ring-1 focus:ring-purple-500/50 outline-none text-sm font-medium transition-all placeholder:text-white/10"
                                        placeholder="Username"
                                    />
                                </div>
                                {errors.username && (
                                    <p className="text-red-500/80 text-[10px] font-black uppercase tracking-wider mt-1 ml-2">{errors.username.message}</p>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] ml-2">
                                    Secure Key
                                </label>
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
                                className="w-full py-5 mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 shadow-[0_15px_40px_rgba(168,85,247,0.2)] flex items-center justify-center gap-3"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Initializing...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Create Identity</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </form>

                        <p className="text-center mt-10 text-[10px] font-black uppercase tracking-widest text-white/20">
                            Already on the network?{' '}
                            <Link href="/login" className="text-purple-500/60 hover:text-purple-400 transition-colors">
                                Authenticate
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
