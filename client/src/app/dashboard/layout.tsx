'use client';

import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { Shield, Upload, FileText, LogOut, User, Menu, X, LayoutDashboard, Globe, BookOpen, Activity } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const handleLogout = () => {
        logout();
        router.push('/');
    };

    const navLinks = [
        { href: '/dashboard', label: 'Upload Contract', icon: Upload },
        { href: '/dashboard/contracts', label: 'My Contracts', icon: FileText },
        { href: '/dashboard/intelligence', label: 'Contract Intelligence', icon: LayoutDashboard },
        { href: '/dashboard/risk-surface', label: 'Risk Surface', icon: Globe },
        { href: '/dashboard/dev-health', label: 'Dev Health', icon: Activity },
        { href: '/blog', label: 'Legal Insights', icon: BookOpen },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-background text-foreground relative overflow-hidden font-sans selection:bg-indigo-500/30">

                {/* Ambient Background Effects */}
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <div className="grid-perspective opacity-20">
                        <div className="grid-container" />
                    </div>
                    <div className="glow-mesh opacity-40" />
                </div>

                {/* Top Navigation */}
                <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                    <div className="container mx-auto px-4 md:px-6">
                        <div className="flex h-16 items-center justify-between">
                            {/* Logo & Mobile Toggle */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                    className="md:hidden p-2 text-slate-400 hover:text-white transition"
                                >
                                    {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                                </button>

                                <Link href="/dashboard" className="flex items-center gap-2 group">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-indigo-500 blur-lg opacity-20 group-hover:opacity-40 transition" />
                                        <Shield className="w-8 h-8 text-indigo-500 relative z-10" />
                                    </div>
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                                        DealGuard
                                    </span>
                                </Link>
                            </div>

                            {/* User Menu */}
                            <div className="flex items-center gap-4">
                                <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/5 bg-white/5">
                                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                        <User className="w-3.5 h-3.5 text-indigo-400" />
                                    </div>
                                    <span className="text-sm font-medium text-slate-300">{user?.name}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-red-400 transition"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden md:inline">Logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Layout Area */}
                <div className="pt-16 min-h-screen flex">

                    {/* Desktop Sidebar */}
                    <aside className="hidden md:block w-64 fixed left-0 top-16 bottom-0 border-r border-white/5 bg-black/20 backdrop-blur-sm z-40">
                        <div className="p-6 space-y-4">
                            {navLinks.map((link) => {
                                const isActive = window.location.pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden ${isActive
                                            ? 'text-white bg-white/5 shadow-[inset_0_0_20px_rgba(255,255,255,0.02)] border border-white/10'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.02]'
                                            }`}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-glow"
                                                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-full shadow-[0_0_15px_rgba(79,70,229,0.8)]"
                                            />
                                        )}
                                        <link.icon className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-400'
                                            }`} />
                                        <span className={`font-semibold tracking-wide ${isActive ? 'translate-x-1' : ''} transition-transform`}>{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </aside>

                    {/* Mobile Sidebar Overlay */}
                    <AnimatePresence>
                        {isSidebarOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => setIsSidebarOpen(false)}
                                    className="md:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                                />
                                <motion.aside
                                    initial={{ x: -280 }}
                                    animate={{ x: 0 }}
                                    exit={{ x: -280 }}
                                    transition={{ type: "spring", damping: 30, stiffness: 300 }}
                                    className="md:hidden fixed left-0 top-16 bottom-0 w-72 bg-[#0a0a0a] border-r border-white/10 z-50 p-6"
                                >
                                    <div className="space-y-4">
                                        {navLinks.map((link) => {
                                            const isActive = window.location.pathname === link.href;
                                            return (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    onClick={() => setIsSidebarOpen(false)}
                                                    className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive
                                                        ? 'text-white bg-indigo-500/10 border border-indigo-500/20'
                                                        : 'text-slate-400 bg-white/5'
                                                        }`}
                                                >
                                                    <link.icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : ''}`} />
                                                    <span className="font-bold tracking-tight">{link.label}</span>
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </motion.aside>
                            </>
                        )}
                    </AnimatePresence>

                    {/* Content Wrapper */}
                    <main className="flex-1 md:ml-64 p-4 md:p-8 relative z-10 overflow-y-auto">
                        <div className="max-w-7xl mx-auto">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}
