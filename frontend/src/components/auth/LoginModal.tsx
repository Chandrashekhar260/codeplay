import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Building2 } from 'lucide-react';
import { api } from '../../api/client';
import type { AuthResponse } from '../../types';

interface LoginModalProps {
  onLoginSuccess: (data: AuthResponse) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('ramesh.kumar@aarogyadiagnostics.in');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('datasentinel_token', data.token);
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-600 rounded flex items-center justify-center mx-auto text-white shadow-sm">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">Sign in to DataSentinel</h2>
          <p className="text-xs text-slate-500">
            Enterprise DPDP Act 2023 Compliance & Data Governance Engine
          </p>
        </div>

        {/* Demo Credentials Quick-Select Pill */}
        <div className="bg-slate-50 border border-slate-200 rounded p-3 text-xs text-slate-700 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            <span>Pre-configured Demo MSME Workspace</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Aarogya Diagnostic Center (Neon Cloud PostgreSQL)
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-medium text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
