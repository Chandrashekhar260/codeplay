import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Edit3,
  Trash2,
  Clock,
  Database,
  Building,
  Lock,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Layers,
} from 'lucide-react';
import { api } from '../api/client';
import type { UserTraversalReport, DsrRequest } from '../types';

interface DataPrincipalPortalProps {
  onBackToAdmin?: () => void;
}

export const DataPrincipalPortal: React.FC<DataPrincipalPortalProps> = ({ onBackToAdmin }) => {
  const [userRef, setUserRef] = useState('patient@aarogya.in');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<UserTraversalReport | null>(null);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for exercising rights: 'access' | 'correction' | 'erasure'
  const [activeTab, setActiveTab] = useState<'access' | 'correction' | 'erasure'>('correction');

  // Correction Form State
  const [fieldToCorrect, setFieldToCorrect] = useState('Phone Number');
  const [currentValue, setCurrentValue] = useState('+91 9845012345');
  const [correctedValue, setCorrectedValue] = useState('+91 9876543210');
  const [correctionDetails, setCorrectionDetails] = useState('My phone number is wrong. Please update it.');

  // Erasure Form State
  const [erasureDetails, setErasureDetails] = useState(
    'Delete my account data that you no longer need to retain under DPDP Act Section 12.'
  );

  // Submitting DSR Request
  const [submittingDsr, setSubmittingDsr] = useState(false);
  const [dsrSuccess, setDsrSuccess] = useState<DsrRequest | null>(null);

  // Run Graph Traversal for User
  const handleInspectData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userRef.trim()) return;

    setLoading(true);
    setError(null);
    setDsrSuccess(null);
    try {
      const data = await api.dsr.traverseUserGraph(userRef.trim());
      setReport(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to inspect user data');
    } finally {
      setLoading(false);
    }
  };

  // Submit Correction Request
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim() || !correctedValue.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const res = await api.dsr.submitPortalRequest({
        requestType: 'CORRECTION',
        userRef: userRef.trim(),
        details: correctionDetails.trim(),
        fieldToCorrect,
        currentValue: currentValue.trim() || undefined,
        correctedValue: correctedValue.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
      });

      setDsrSuccess(res);
      // Refresh user traversal
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit correction request');
    } finally {
      setSubmittingDsr(false);
    }
  };

  // Submit Erasure Request
  const handleSubmitErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const res = await api.dsr.submitPortalRequest({
        requestType: 'ERASURE',
        userRef: userRef.trim(),
        details: erasureDetails.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
      });

      setDsrSuccess(res);
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit erasure request');
    } finally {
      setSubmittingDsr(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Top Portal Navigation */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              Data Principal Privacy Rights Portal
              <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded border border-blue-500/30">
                DPDP Act 2023 Sec 11 & 12
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              Exercise your statutory rights: Access, Correct, or Erase your personal data.
            </p>
          </div>
        </div>

        {onBackToAdmin && (
          <button
            onClick={onBackToAdmin}
            className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <span>Return to DPO Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-6 space-y-6">
        {/* Identifier Lookup Card */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
          <div>
            <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
              Step 1: Identify Your Data
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              Enter your email address or phone number
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              The system will perform a live <strong>RoPA knowledge graph traversal</strong> to locate every system, database, and third-party processor holding your personal data.
            </p>
          </div>

          <form onSubmit={handleInspectData} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="e.g. patient@aarogya.in or +91 9845012345"
                value={userRef}
                onChange={(e) => setUserRef(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Traversing Graph...' : 'Inspect My Data & Lineage'}</span>
            </button>
          </form>

          {/* Quick preset chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
            <span className="text-[11px] text-slate-400">Quick Test Identifiers:</span>
            {['patient@aarogya.in', '+91 9845012345', 'ramesh.kumar@aarogyadiagnostics.in'].map(
              (demoRef) => (
                <button
                  key={demoRef}
                  type="button"
                  onClick={() => {
                    setUserRef(demoRef);
                  }}
                  className="px-2 py-0.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors"
                >
                  {demoRef}
                </button>
              )
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Confirmation Toast */}
        {dsrSuccess && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-2 text-emerald-300 text-xs">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>
                Statutory {dsrSuccess.requestType} Request Registered Successfully!
              </span>
            </div>
            <p className="text-slate-300 text-xs">
              Your request has been logged into the enterprise RoPA compliance ledger. The Data Protection Officer has been notified, and affected systems have been flagged with high priority.
            </p>
            <div className="bg-slate-900/80 p-2.5 rounded border border-emerald-500/20 font-mono text-[11px] space-y-1">
              <div>Request ID: <span className="text-white font-bold">{dsrSuccess.requestId}</span></div>
              <div>Status: <span className="text-amber-400 font-bold">{dsrSuccess.status}</span></div>
              {dsrSuccess.sha256Proof && (
                <div className="truncate text-slate-400 text-[10px]">
                  DPDP Integrity Proof (SHA-256): {dsrSuccess.sha256Proof}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Traversal Results & Exercise Rights Section */}
        {searched && report && (
          <div className="space-y-6">
            {/* 1. RoPA Lineage Report (Right to Access - Section 11) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      1. Right to Access Information (DPDP Act Sec 11)
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Summary of personal data processed, underlying sources, purposes, and third parties.
                    </p>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  VERIFIED IDENTIFIER
                </span>
              </div>

              {/* Personal Data Categories Discovered */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Discovered Personal Data Categories (PII)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.personalDataSummary.piiCategoriesHeld.length > 0 ? (
                      report.personalDataSummary.piiCategoriesHeld.map((cat, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded text-[11px] font-medium"
                        >
                          {cat}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-xs italic">
                        Full Name, Contact Phone, Health Diagnostics, Tax Invoice
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900/60 p-3.5 rounded-lg border border-slate-700/60 space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                    Underlying Data Sources (Files / Repositories)
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {report.dataSources.map((src) => (
                      <span
                        key={src.sourceId}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded text-[11px] font-medium"
                      >
                        <Database className="w-3 h-3 text-indigo-400" />
                        {src.name} ({src.type})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Processing Activities (RoPA) & Specific Purposes */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Processing Activities & Purposes Undertaken
                </span>
                <div className="space-y-2">
                  {report.processingActivities.map((act) => (
                    <div
                      key={act.activityId}
                      className="bg-slate-900/70 p-3 rounded-lg border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{act.name}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono">
                            {act.legalBasis}
                          </span>
                        </div>
                        <p className="text-[11px] text-blue-300/90">
                          🎯 <strong>Purpose:</strong> {act.purpose}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-[11px]">
                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">DPDP Retention:</span>
                          <span className="font-bold text-amber-400">
                            {act.retentionMonths} Months
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Third-Party Recipients / Processors */}
              <div className="space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Third-Party Recipients & External Processors
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {report.thirdPartyRecipients.map((rec, i) => (
                    <div
                      key={i}
                      className="bg-slate-900/70 px-3 py-1.5 rounded-lg border border-slate-700/80 flex items-center gap-2"
                    >
                      <Building className="w-3.5 h-3.5 text-rose-400" />
                      <div>
                        <span className="font-semibold text-white text-[11px]">{rec.name}</span>
                        <span className="text-[10px] text-slate-400 ml-1.5 font-mono">
                          ({rec.type} • {rec.country})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Interactive Rights Request Submission Panel (Correction & Erasure) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  Step 2: Exercise Your DPDP Rights
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  Submit a Statutory Request to the Company
                </h3>
              </div>

              {/* Rights Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-700 pb-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('correction')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'correction'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Right to Correction (Sec 12.1)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('erasure')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'erasure'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Right to Erasure (Sec 12.2)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('access')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    activeTab === 'access'
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-blue-400" />
                  <span>Certified Access Summary</span>
                </button>
              </div>

              {/* TAB 1: CORRECTION FORM */}
              {activeTab === 'correction' && (
                <form onSubmit={handleSubmitCorrection} className="space-y-4 pt-1 text-xs">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-200 text-xs">
                    <strong>DPDP Act Section 12(1):</strong> You have the right to correct inaccurate or misleading personal data and update outdated records across all company systems.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Field to Correct *
                      </label>
                      <select
                        value={fieldToCorrect}
                        onChange={(e) => setFieldToCorrect(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Phone Number">Phone Number</option>
                        <option value="Email Address">Email Address</option>
                        <option value="Residential Address">Residential Address</option>
                        <option value="Full Name">Full Name</option>
                        <option value="Emergency Contact">Emergency Contact</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Current Inaccurate Value
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +91 9845012345"
                        value={currentValue}
                        onChange={(e) => setCurrentValue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        New Corrected Value *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={correctedValue}
                        onChange={(e) => setCorrectedValue(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500 font-bold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Request Description / Reason *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. My phone number is wrong. Please update it."
                      value={correctionDetails}
                      onChange={(e) => setCorrectionDetails(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>
                        {submittingDsr ? 'Submitting...' : 'Submit Statutory Correction Request'}
                      </span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 2: ERASURE FORM */}
              {activeTab === 'erasure' && (
                <form onSubmit={handleSubmitErasure} className="space-y-4 pt-1 text-xs">
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-200 text-xs">
                    <strong>DPDP Act Section 12(2):</strong> You may request deletion of your personal data where retention is no longer necessary for the specified purpose.
                    <p className="text-[11px] text-slate-400 mt-1">
                      Note: Data required for mandatory statutory compliance (such as 7-year tax audit retention under Income Tax Act or Clinical Establishment records) will be retained under statutory lock.
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Erasure Request Details *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={erasureDetails}
                      onChange={(e) => setErasureDetails(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:ring-1 focus:ring-rose-500"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={submittingDsr}
                      className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{submittingDsr ? 'Submitting...' : 'Request Erasure of Personal Data'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: ACCESS SUMMARY */}
              {activeTab === 'access' && (
                <div className="space-y-3 pt-1 text-xs">
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-200 text-xs">
                    <strong>DPDP Act Section 11 Compliance Record:</strong> This report represents the complete, verified transparency register of all personal data held under your identifier.
                  </div>
                  <div className="bg-slate-900/80 p-4 rounded-lg border border-slate-700 font-mono text-[11px] space-y-1 text-slate-300">
                    <div>Data Principal: {report.userRef}</div>
                    <div>Processing Activities Count: {report.processingActivities.length}</div>
                    <div>External Processors Count: {report.thirdPartyRecipients.length}</div>
                    <div>Generated At: {new Date().toISOString()}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. User's DSR Request History */}
            {report.dsrHistory.length > 0 && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  Your Filed Requests & Live Status
                </h4>
                <div className="space-y-2">
                  {report.dsrHistory.map((req) => (
                    <div
                      key={req.requestId}
                      className="bg-slate-900/70 p-3 rounded-lg border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{req.requestType}</span>
                          <span
                            className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                              req.status === 'COMPLETED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : req.status === 'RETAINED_TAX_CONFLICT'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{req.details}</p>
                        {req.resolutionNotes && (
                          <p className="text-[10px] text-emerald-400 mt-1 font-medium">
                            DPO Resolution: {req.resolutionNotes}
                          </p>
                        )}
                      </div>

                      <div className="text-right text-[10px] text-slate-400 font-mono">
                        <div>Filed: {new Date(req.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
