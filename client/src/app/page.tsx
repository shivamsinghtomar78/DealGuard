'use client';

import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import HeroScene from '@/components/HeroScene';

export default function HomePage() {
  const { scrollY } = useScroll();
  const opacity = useTransform(scrollY, [0, 200], [1, 0]);
  const scale = useTransform(scrollY, [0, 200], [1, 0.9]);

  return (
    <div className="relative min-h-screen bg-[#020202] text-white overflow-hidden selection:bg-purple-500/30">
      {/* Premium 3D Hero Background */}
      <HeroScene />

      {/* Noise Texture Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Global Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] border-b border-white/5 bg-black/10 backdrop-blur-2xl">
        <div className="container mx-auto px-6 py-5 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group cursor-pointer"
          >
            <div className="relative">
              <Shield className="w-8 h-8 text-purple-500 transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 bg-purple-500/30 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase italic">
              Deal<span className="text-purple-500">Guard</span>
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <Link href="/login" className="text-sm font-bold text-white/50 hover:text-white transition-colors">
              LOG IN
            </Link>
            <Link href="/signup">
              <Button variant="primary" className="rounded-full px-8 bg-white text-black hover:bg-white/90 border-none shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                JOIN NOW
              </Button>
            </Link>
          </motion.div>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative flex flex-col items-center justify-center min-h-screen z-10 px-6">
        <motion.div
          style={{ opacity, scale }}
          className="container mx-auto flex flex-col items-center text-center"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 px-4 py-1.5 rounded-full border border-purple-500/20 bg-purple-500/5 backdrop-blur-md"
          >
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-purple-400">
              Agentic Intelligence • Redefining Law
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(3rem,8vw,6rem)] font-black leading-[0.95] tracking-tighter mb-12 uppercase italic"
          >
            Guard Every <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-white to-purple-600">
              Single Deal
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl text-white/40 mb-16 max-w-2xl leading-relaxed font-medium"
          >
            The world's first neural engine for contract risk.
            Analyze, negotiate, and execute with the speed of thought.
          </motion.p>

          {/* Singular Hyper-Premium CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <Link href="/signup">
              <button className="relative group overflow-hidden px-12 py-5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black uppercase tracking-widest text-sm transition-all hover:scale-110 active:scale-95 shadow-[0_20px_50px_rgba(168,85,247,0.3)]">
                <span className="relative z-10 flex items-center gap-3">
                  Initialize Neural Analysis <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
              </button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2"
        >
          <div className="w-[1px] h-20 bg-gradient-to-b from-white/0 via-white/20 to-white/0 animate-pulse" />
        </motion.div>
      </main>

      <style jsx global>{`
        .gradient-text {
          background: linear-gradient(to right, #fff, #a855f7, #6366f1);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
