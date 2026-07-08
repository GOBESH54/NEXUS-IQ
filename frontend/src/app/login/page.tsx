'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Brain, Mail, Lock, ChevronDown, Factory, LogIn } from 'lucide-react';
import { mockPlants } from '@/lib/mock-data';

const roles = ['Plant Engineer', 'Maintenance Manager', 'Safety Officer', 'Plant Head'];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('rajesh.k@bharatsteel.co.in');
  const [password, setPassword] = useState('demo123');
  const [role, setRole] = useState('Plant Engineer');
  const [plant, setPlant] = useState(mockPlants[0].name);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    localStorage.setItem('nexusiq_role', role);
    localStorage.setItem('nexusiq_plant', plant);
    setTimeout(() => router.push('/dashboard'), 800);
  };

  return (
    <div className="min-h-screen bg-nq-bg-primary flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="dot-grid-bg absolute inset-0 opacity-40" />
        <div className="orb orb-blue w-96 h-96 -top-20 -left-20" />
        <div className="orb orb-cyan w-80 h-80 bottom-0 right-0" />
        <div className="orb orb-purple w-72 h-72 top-1/2 left-1/2" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-nq-bg-card/80 backdrop-blur-2xl border border-nq-border rounded-2xl p-8 shadow-2xl shadow-black/50">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
            className="flex flex-col items-center mb-8"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-nq-accent-blue/30 mb-4">
              <Brain size={32} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              NEXUS <span className="text-nq-accent-cyan">IQ</span>
            </h1>
            <p className="text-sm text-nq-text-muted mt-1">Industrial Knowledge Intelligence</p>
          </motion.div>

          {/* Demo notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="bg-nq-accent-blue/10 border border-nq-accent-blue/20 rounded-lg px-4 py-2.5 mb-6"
          >
            <p className="text-xs text-nq-accent-cyan text-center">🔐 Demo Mode — Pre-filled credentials for quick access</p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-nq-text-secondary mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nq-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-dark w-full pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-nq-text-secondary mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nq-text-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-dark w-full pl-10"
                />
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-nq-text-secondary mb-1.5">Role</label>
              <div className="relative">
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-nq-text-muted pointer-events-none" />
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="input-dark w-full appearance-none cursor-pointer"
                >
                  {roles.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Plant */}
            <div>
              <label className="block text-sm font-medium text-nq-text-secondary mb-1.5">Plant</label>
              <div className="relative">
                <Factory size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-nq-text-muted" />
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-nq-text-muted pointer-events-none" />
                <select
                  value={plant}
                  onChange={(e) => setPlant(e.target.value)}
                  className="input-dark w-full pl-10 appearance-none cursor-pointer"
                >
                  {mockPlants.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full gradient-btn flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  Sign In to Demo
                </>
              )}
            </motion.button>
          </form>

          <p className="text-center text-xs text-nq-text-muted mt-6">
            Built for ET AI Hackathon 2026
          </p>
        </div>
      </motion.div>
    </div>
  );
}
