import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Files,
  FileCheck2,
  Scale,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import type { NavTab } from '../components/layout/Sidebar';
import { api } from '../api/client';

interface OverviewPageProps {
  onNavigate: (tab: NavTab) => void;
  stats: {
    sourcesCount: number;
    findingsCount: number;
    assetsCount: number;
    consentsCount: number;
    flagsCount: number;
  };
}

export const OverviewPage: React.FC<OverviewPageProps> = ({ onNavigate, stats }) => {
  const [penalties, setPenalties] = useState<Array<{ key: string; section: string; maximum: string; basis: string }>>([]);
  const [loadingRules, setLoadingRules] = useState<boolean>(true);

  // Fetch real statutory rules & penalties directly from backend API
  useEffect(() => {
    async function loadStatutoryRules() {
      try {
        const rules = await api.governance.getRules();
        if (rules?.penaltyReferences) {
          const list = Object.entries(rules.penaltyReferences).map(([key, val]: [string, any]) => ({
            key,
            section: val.section,
            maximum: val.maximum,
            basis: val.basis,
          }));
          setPenalties(list);
        }
      } catch (err) {
        console.error('Failed to load statutory penalty rules:', err);
      } finally {
        setLoadingRules(false);
      }
    }
    loadStatutoryRules();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Statutory Readiness Banner */}
      <div className="bg-slate-900 text-white rounded-lg p-5 border border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded">
              DPDP ACT, 2023 LIVE ENFORCEMENT
            </span>
            <span className="text-xs text-slate-400">Connected to Cloud PostgreSQL Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            DataSentinel Compliance Dashboard
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Real-time synchronization with discovery scanner, RoPA processing activities, and affirmative Section 6 consent ledger.
          </p>
        </div>

        <button
          onClick={() => onNavigate('discovery')}
          className="shrink-0 flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded shadow transition-colors"
        >
          <span>Scan New Data Source</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Primary KPI Grid (Direct Live Counts from PostgreSQL) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Discovered Sources */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Discovered Data Sources</span>
            <Files className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.sourcesCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Uploaded Excel & CSV sources</p>
        </div>

        {/* Extracted PII Fields */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Extracted PII Identifiers</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.findingsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Discovered via Python Verhoeff scanner</p>
        </div>

        {/* Governed Assets */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Governed Data Assets</span>
            <Scale className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.assetsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Classified with statutory retention</p>
        </div>

        {/* Active Consents */}
        <div className="bg-white border border-slate-200 rounded p-4">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Active Consent Records</span>
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 tabular-nums">{stats.consentsCount}</div>
          <p className="text-[11px] text-slate-500 mt-1">Recorded affirmative consents</p>
        </div>
      </div>

      {/* Statutory Maximum Penalty Reference Matrix (Direct from /api/v1/governance/rules) */}
      <div className="bg-white border border-slate-200 rounded">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Statutory Penalty Liability Matrix (DPDP Act, 2023)
            </h3>
            <p className="text-xs text-slate-500">
              Direct statutory entries from <span className="font-mono">/api/v1/governance/rules</span>.
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded">
            Legal Constants
          </span>
        </div>

        <div className="overflow-x-auto">
          {loadingRules ? (
            <div className="p-8 text-center text-xs text-slate-500">Loading statutory penalty matrix from API...</div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Statutory Contravention Area</th>
                  <th className="py-2.5 px-4">DPDP Section</th>
                  <th className="py-2.5 px-4">Maximum Statutory Liability</th>
                  <th className="py-2.5 px-4">Statutory Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {penalties.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{item.key.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 font-mono text-slate-700">{item.section}</td>
                    <td className="py-3 px-4 font-bold text-rose-700 tabular-nums">{item.maximum}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px]">{item.basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div
          onClick={() => onNavigate('discovery')}
          className="bg-white border border-slate-200 rounded p-4 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">1. PII Scanner</h4>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Detect 12-digit Indian Aadhaar via Verhoeff algorithm and PAN numbers.
          </p>
        </div>

        <div
          onClick={() => onNavigate('ropa')}
          className="bg-white border border-slate-200 rounded p-4 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">2. RoPA Data Graph</h4>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Interactive React Flow pipeline mapping data from collection to WhatsApp.
          </p>
        </div>

        <div
          onClick={() => onNavigate('consent')}
          className="bg-white border border-slate-200 rounded p-4 hover:border-blue-400 hover:shadow-sm cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-900 uppercase">3. Multilingual Consent</h4>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Section 5 notices in English, Hindi & Kannada with one-click withdrawal.
          </p>
        </div>
      </div>
    </div>
  );
};
