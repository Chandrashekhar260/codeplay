import React from 'react';
import { Database, RefreshCw, CheckCircle2 } from 'lucide-react';
import type { NavTab } from './Sidebar';

interface TopbarProps {
  currentTab: NavTab;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

const tabTitles: Record<NavTab, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Executive Compliance Overview',
    subtitle: 'High-level metrics, statutory penalty exposure, and active DPDP posture.',
  },
  discovery: {
    title: 'Data Discovery & File Scanner',
    subtitle: 'Upload MSME spreadsheets & extract PII via Python Verhoeff algorithm.',
  },
  ropa: {
    title: 'Record of Processing Activities (RoPA)',
    subtitle: 'Interactive data relationship graph and Article 30/Section 8 mapping.',
  },
  governance: {
    title: 'Statutory Governance & Retention Matrix',
    subtitle: 'Deterministic DPDP Act & CGST Section 36 retention rules (Zero LLM Hallucination).',
  },
  consent: {
    title: 'Consent Ledger & Multilingual Notices',
    subtitle: 'Affirmative consent collection (WhatsApp/Web) and Section 5 multilingual notices.',
  },
  dsr: {
    title: 'Data Subject Requests (DSR)',
    subtitle: 'Manage and fulfil data principal rights requests under DPDP Act Section 11–13.',
  },
  cookies: {
    title: 'Website Cookie & Tracker Governance',
    subtitle: 'Automated crawler discovery, tracker inventory categorization, and DPDP Section 6 CMP banner.',
  },
  audit: {
    title: 'Append-Only Audit Trail',
    subtitle: 'Tamper-evident system ledger of every classification, scan, and consent event.',
  },
};

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onRefresh, isRefreshing }) => {
  const meta = tabTitles[currentTab];

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
      <div>
        <h1 className="text-sm font-semibold text-slate-900 tracking-tight">{meta.title}</h1>
        <p className="text-xs text-slate-500">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Backend / Cloud Database Connectivity Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 rounded">
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>PostgreSQL Active (Neon)</span>
          <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-0.5" />
        </div>

        {/* Refresh Action */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50 active:bg-slate-100 disabled:opacity-50 transition-colors"
          title="Refresh live data from backend"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
