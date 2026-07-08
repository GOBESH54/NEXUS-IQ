'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Brain, ArrowRight, Zap, Shield, Clock, FileSearch,
  Network, MessageSquare, BarChart3, ChevronDown
} from 'lucide-react';

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 2 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let start = 0;
    const step = end / (duration * 60);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(timer);
  }, [started, end, duration]);

  return <span ref={ref}>{prefix}{count}{suffix}</span>;
}

function ParticleGrid() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Animated dot grid */}
      <div className="dot-grid-bg absolute inset-0 opacity-60" />

      {/* Floating orbs */}
      <div className="orb orb-blue w-96 h-96 -top-20 -left-20" style={{ animationDelay: '0s' }} />
      <div className="orb orb-cyan w-80 h-80 top-1/3 right-0" style={{ animationDelay: '3s' }} />
      <div className="orb orb-purple w-72 h-72 bottom-0 left-1/3" style={{ animationDelay: '6s' }} />

      {/* Scan lines effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-nq-accent-blue/[0.02] to-transparent"
        style={{ backgroundSize: '100% 4px', backgroundRepeat: 'repeat' }} />

      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-nq-bg-primary/0 via-nq-bg-primary/50 to-nq-bg-primary" />
    </div>
  );
}

const features = [
  {
    icon: MessageSquare,
    title: 'Intelligent AI Chat',
    description: 'Ask any question about your plant. Get answers with citations from your actual documents, SOPs, and maintenance manuals.',
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/20',
  },
  {
    icon: Network,
    title: 'Knowledge Graph',
    description: 'Visualize connections between equipment, documents, incidents, and personnel. Discover hidden patterns and failure chains.',
    color: 'from-purple-500 to-blue-500',
    glow: 'shadow-purple-500/20',
  },
  {
    icon: Shield,
    title: 'Compliance Intelligence',
    description: 'Automatically map regulations to equipment. Identify compliance gaps before auditors do. Generate evidence packages.',
    color: 'from-emerald-500 to-cyan-500',
    glow: 'shadow-emerald-500/20',
  },
  {
    icon: BarChart3,
    title: 'Predictive Analytics',
    description: 'MTBF trends, failure DNA analysis, maintenance cost optimization. Turn decades of data into actionable insights.',
    color: 'from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/20',
  },
  {
    icon: FileSearch,
    title: 'Document Intelligence',
    description: 'Automatically extract entities from P&IDs, SOPs, manuals, and inspection reports. Build your knowledge base automatically.',
    color: 'from-cyan-500 to-blue-500',
    glow: 'shadow-cyan-500/20',
  },
  {
    icon: Brain,
    title: 'Tribal Knowledge Capture',
    description: 'Preserve the expertise of your most experienced engineers. Knowledge that walks out the door when people retire.',
    color: 'from-pink-500 to-purple-500',
    glow: 'shadow-pink-500/20',
  },
];

const stats = [
  { value: 35, suffix: '%', label: 'Engineer Time Saved', description: 'Less time searching for information' },
  { value: 3.5, suffix: 'Cr', prefix: '₹', label: 'Saved Per Incident', description: 'Through predictive maintenance' },
  { value: 5, suffix: 'x', label: 'Faster Onboarding', description: 'New engineers productive in weeks, not years' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-nq-bg-primary overflow-x-hidden">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4">
        <ParticleGrid />

        {/* Nav */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 md:px-12 py-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-nq-accent-blue/30">
              <Brain size={22} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight">NEXUS <span className="text-nq-accent-cyan">IQ</span></span>
              <span className="text-[10px] text-nq-text-muted ml-1 hidden sm:inline">™</span>
            </div>
          </div>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm font-medium text-nq-text-primary hover:bg-white/10 hover:border-nq-accent-blue/30 transition-all duration-300"
          >
            Sign In
          </Link>
        </motion.nav>

        {/* Hero content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nq-accent-blue/10 border border-nq-accent-blue/20 mb-8">
              <Zap size={14} className="text-nq-accent-cyan" />
              <span className="text-xs font-medium text-nq-accent-cyan tracking-wide">INDUSTRIAL KNOWLEDGE INTELLIGENCE PLATFORM</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9] mb-6"
          >
            <span className="glow-text bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
              The Industrial
            </span>
            <br />
            <span className="bg-gradient-to-r from-nq-accent-blue via-nq-accent-cyan to-nq-accent-emerald bg-clip-text text-transparent animate-glow">
              Brain
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-nq-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Connect Every Document. Answer Every Question.
            <br className="hidden sm:block" />
            <span className="text-nq-accent-cyan font-medium">Prevent Every Failure.</span>
          </motion.p>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-primary text-white font-semibold text-lg transition-all duration-300 hover:shadow-xl hover:shadow-nq-accent-blue/30 hover:scale-105 active:scale-95"
            >
              Get Started
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-nq-text-primary font-medium text-lg hover:bg-white/10 transition-all duration-300"
            >
              Explore Features
            </a>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <a href="#stats" className="flex flex-col items-center gap-2 text-nq-text-muted hover:text-nq-accent-cyan transition-colors">
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <ChevronDown size={20} className="animate-bounce" />
          </a>
        </motion.div>
      </section>

      {/* ==================== STATS SECTION ==================== */}
      <section id="stats" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ y: 40, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="text-center p-8 rounded-2xl bg-nq-bg-card/50 border border-nq-border backdrop-blur-sm hover:border-nq-accent-blue/30 hover:bg-nq-bg-card-hover transition-all duration-500 group"
              >
                <div className="text-5xl md:text-6xl font-black bg-gradient-to-r from-nq-accent-blue to-nq-accent-cyan bg-clip-text text-transparent mb-2">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} prefix={stat.prefix || ''} />
                </div>
                <h3 className="text-lg font-bold text-nq-text-primary mb-1 group-hover:text-nq-accent-cyan transition-colors">
                  {stat.label}
                </h3>
                <p className="text-sm text-nq-text-muted">{stat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== FEATURES SECTION ==================== */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Everything Your Plant{' '}
              <span className="bg-gradient-to-r from-nq-accent-blue to-nq-accent-cyan bg-clip-text text-transparent">Needs to Know</span>
            </h2>
            <p className="text-nq-text-secondary text-lg max-w-2xl mx-auto">
              Six powerful modules that transform scattered industrial knowledge into a unified, intelligent system.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ y: 30, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className={`group relative p-6 rounded-2xl bg-nq-bg-card/60 border border-nq-border backdrop-blur-sm hover:border-nq-accent-blue/30 hover:${feature.glow} hover:shadow-xl transition-all duration-500 cursor-default`}
                >
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="text-lg font-bold text-nq-text-primary mb-2 group-hover:text-nq-accent-cyan transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-nq-text-secondary leading-relaxed">
                    {feature.description}
                  </p>
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-nq-accent-blue/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ==================== CTA SECTION ==================== */}
      <section className="relative py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="relative p-12 rounded-3xl bg-gradient-to-br from-nq-accent-blue/10 via-nq-bg-card/50 to-nq-accent-purple/10 border border-nq-accent-blue/20 backdrop-blur-xl"
          >
            <div className="absolute inset-0 rounded-3xl overflow-hidden">
              <div className="orb orb-blue w-64 h-64 -top-10 -right-10 opacity-10" />
              <div className="orb orb-purple w-48 h-48 -bottom-10 -left-10 opacity-10" />
            </div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Build Your
                <br />
                <span className="bg-gradient-to-r from-nq-accent-blue to-nq-accent-cyan bg-clip-text text-transparent">Industrial Brain?</span>
              </h2>
              <p className="text-nq-text-secondary text-lg mb-8 max-w-xl mx-auto">
                Join the industrial revolution. Transform your plant&apos;s scattered knowledge into an intelligent, queryable system.
              </p>
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-primary text-white font-semibold text-lg transition-all duration-300 hover:shadow-2xl hover:shadow-nq-accent-blue/30 hover:scale-105 active:scale-95"
              >
                Start Free Demo
                <ArrowRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className="border-t border-nq-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain size={18} className="text-nq-accent-cyan" />
            <span className="text-sm font-semibold">NEXUS IQ™</span>
            <span className="text-xs text-nq-text-muted">— Industrial Knowledge Intelligence</span>
          </div>
          <p className="text-xs text-nq-text-muted">
            Built for the ET AI Hackathon 2026 · Powered by Multi-Agent AI
          </p>
        </div>
      </footer>
    </div>
  );
}
