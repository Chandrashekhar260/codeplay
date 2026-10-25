import React, { useState, useEffect } from 'react';
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
  Globe,
  Building2,
  Check,
  Calendar,
  Hash,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { api } from '../api/client';
import type { UserTraversalReport, DsrRequest, BusinessInfo, DsrTrackReport } from '../types';

interface DataPrincipalPortalProps {
  onBackToAdmin?: () => void;
}

export const DataPrincipalPortal: React.FC<DataPrincipalPortalProps> = ({ onBackToAdmin }) => {
  // Top-level mode: 'inspect' | 'track'
  const [portalMode, setPortalMode] = useState<'inspect' | 'track'>('inspect');

  // Business / Website directory
  const [businesses, setBusinesses] = useState<BusinessInfo[]>([]);
  const [selectedWebsite, setSelectedWebsite] = useState('aarogyadiagnostics.in');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [isCustomWebsite, setIsCustomWebsite] = useState(false);
  const [customWebsiteInput, setCustomWebsiteInput] = useState('');

  // User inspection state
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

  // Tracking Request State
  const [trackRequestId, setTrackRequestId] = useState('');
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState<string | null>(null);
  const [trackedReport, setTrackedReport] = useState<DsrTrackReport | null>(null);

  // Load registered businesses/tenants on mount
  useEffect(() => {
    async function loadBusinesses() {
      try {
        const list = await api.dsr.getBusinesses();
        setBusinesses(list);
        if (list.length > 0) {
          setSelectedTenantId(list[0].tenantId);
          setSelectedWebsite(list[0].website || 'aarogyadiagnostics.in');
        }
      } catch {
        // Fallback demo business
        setBusinesses([
          {
            tenantId: 'sample-tenant-aarogya-clinic',
            name: 'Aarogya Diagnostic Center & Polyclinic',
            website: 'aarogyadiagnostics.in',
          },
        ]);
      }
    }
    loadBusinesses();
  }, []);

  // Run Graph Traversal for User against selected Business Website
  const handleInspectData = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userRef.trim()) return;

    setLoading(true);
    setError(null);
    setDsrSuccess(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const data = await api.dsr.traverseUserGraph(userRef.trim(), activeWebsite, selectedTenantId || undefined);
      setReport(data);
      setSearched(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to inspect user data');
    } finally {
      setLoading(false);
    }
  };

  // Submit Correction Request to selected Business
  const handleSubmitCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim() || !correctedValue.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const res = await api.dsr.submitPortalRequest({
        requestType: 'CORRECTION',
        userRef: userRef.trim(),
        details: correctionDetails.trim(),
        fieldToCorrect,
        currentValue: currentValue.trim() || undefined,
        correctedValue: correctedValue.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
        businessWebsite: activeWebsite,
        tenantId: selectedTenantId || undefined,
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

  // Submit Erasure Request to selected Business
  const handleSubmitErasure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userRef.trim()) return;

    setSubmittingDsr(true);
    setError(null);
    try {
      const activeWebsite = isCustomWebsite ? customWebsiteInput.trim() : selectedWebsite;
      const res = await api.dsr.submitPortalRequest({
        requestType: 'ERASURE',
        userRef: userRef.trim(),
        details: erasureDetails.trim(),
        affectedActivityId: report?.processingActivities?.[0]?.activityId,
        businessWebsite: activeWebsite,
        tenantId: selectedTenantId || undefined,
      });

      setDsrSuccess(res);
      handleInspectData();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to submit erasure request');
    } finally {
      setSubmittingDsr(false);
    }
  };

  // Track live status of a statutory request
  const handleTrackRequest = async (idToTrack?: string) => {
    const targetId = (idToTrack || trackRequestId).trim();
    if (!targetId) return;

    setTrackLoading(true);
    setTrackError(null);
    try {
      const data = await api.dsr.trackRequest(targetId);
      setTrackedReport(data);
      setTrackRequestId(targetId);
      setPortalMode('track');
    } catch (err: any) {
      setTrackError(err.response?.data?.error?.message || 'Could not find a statutory request with that ID or Proof hash.');
      setTrackedReport(null);
    } finally {
      setTrackLoading(false);
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
        {/* Navigation Tabs: Inspect vs Track */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setPortalMode('inspect')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              portalMode === 'inspect'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Exercise Privacy Rights (Sec 11 & 12)</span>
          </button>

          <button
            onClick={() => setPortalMode('track')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              portalMode === 'track'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700/80'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Track Request Status & DPO Approval</span>
            {dsrSuccess && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: INSPECT DATA & SUBMIT REQUESTS (SCOPED BY BUSINESS) */}
        {/* ======================================================== */}
        {portalMode === 'inspect' && (
          <>
            {/* Step 1: Identifier & Business Website Lookup Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  Step 1: Choose Business & Identify Your Data
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Search by Business Website & Your Identifier
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select the target business/website you interacted with. The system will perform a live <strong>RoPA knowledge graph traversal</strong> against that specific Data Fiduciary.
                </p>
              </div>

              <form onSubmit={handleInspectData} className="space-y-3">
                {/* Business / Website Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      Target Business Website / Fiduciary *
                    </label>
                    <select
                      value={isCustomWebsite ? 'custom' : selectedWebsite}
                      onChange={(e) => {
                        if (e.target.value === 'custom') {
                          setIsCustomWebsite(true);
                        } else {
                          setIsCustomWebsite(false);
                          setSelectedWebsite(e.target.value);
                          const b = businesses.find((x) => x.website === e.target.value);
                          if (b) setSelectedTenantId(b.tenantId);
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    >
                      {businesses.map((biz) => (
                        <option key={biz.tenantId} value={biz.website}>
                          {biz.name} ({biz.website})
                        </option>
                      ))}
                      <option value="custom">🌐 Enter custom business website / domain...</option>
                    </select>
                  </div>

                  {isCustomWebsite ? (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Enter Custom Website Domain *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. clinic.in, aarogyadiagnostics.in, company.com"
                        value={customWebsiteInput}
                        onChange={(e) => setCustomWebsiteInput(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Current Data Fiduciary Active
                      </label>
                      <div className="w-full bg-slate-900/60 border border-slate-700/70 rounded-lg px-3 py-2.5 text-xs text-emerald-400 font-mono flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="truncate">{selectedWebsite}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Email or Phone Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-blue-400" />
                    Data Principal Identifier (Email or Phone Number) *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-3">
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
                  </div>
                </div>
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
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl space-y-3 text-emerald-300 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-200">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <span>
                      Statutory {dsrSuccess.requestType} Request Registered Successfully!
                    </span>
                  </div>
                  <button
                    onClick={() => handleTrackRequest(dsrSuccess.requestId)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded text-xs transition-colors flex items-center gap-1.5 shadow"
                  >
                    <span>Track Present Status Live</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-slate-300 text-xs">
                  Your request has been logged into the enterprise RoPA compliance ledger for <strong>{selectedWebsite}</strong>. The Data Protection Officer has been notified, and affected systems have been flagged with high priority.
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
          </>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TRACK REQUEST STATUS & DPO APPROVAL RESOLUTION   */}
        {/* ======================================================== */}
        {portalMode === 'track' && (
          <div className="space-y-6">
            {/* Lookup Card */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-4">
              <div>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                  Real-Time Status & Statutory Proof
                </span>
                <h2 className="text-base font-bold text-white mt-0.5">
                  Track Your Filed Request Status & DPO Approval
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Enter your unique <strong>Request ID</strong> or <strong>SHA-256 Proof Hash</strong> to check if the DPO has approved, resolved, or applied statutory retention to your request.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="Enter Statutory Request ID (e.g. c032649b-... or SHA-256 proof)"
                    value={trackRequestId}
                    onChange={(e) => setTrackRequestId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono font-medium"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleTrackRequest()}
                  disabled={trackLoading || !trackRequestId.trim()}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  <Search className="w-4 h-4" />
                  <span>{trackLoading ? 'Verifying Ledger...' : 'Track Live Status'}</span>
                </button>
              </div>

              {/* Quick links to track recently filed requests */}
              {dsrSuccess && (
                <div className="flex items-center gap-2 text-xs pt-1">
                  <span className="text-[11px] text-slate-400">Recently Filed Request:</span>
                  <button
                    type="button"
                    onClick={() => handleTrackRequest(dsrSuccess.requestId)}
                    className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[11px] font-mono hover:bg-emerald-500/30 transition-colors"
                  >
                    {dsrSuccess.requestId.slice(0, 8)}... ({dsrSuccess.requestType})
                  </button>
                </div>
              )}
            </div>

            {trackError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex items-center gap-2 text-xs text-rose-400">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Live Tracked Result Card */}
            {trackedReport && (
              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-6">
                {/* Header: Request ID & Present Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white uppercase tracking-wider">
                        {trackedReport.requestType} Request
                      </span>
                      <span className="text-slate-500 font-mono text-xs">#{trackedReport.requestId}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-blue-400" />
                      <span>Data Fiduciary: <strong className="text-slate-200">{trackedReport.businessInfo.name}</strong> ({trackedReport.businessInfo.website})</span>
                    </div>
                  </div>

                  {/* Present Status Badge */}
                  <div>
                    {trackedReport.status === 'COMPLETED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Approved & Resolved</span>
                      </span>
                    )}

                    {trackedReport.status === 'RETAINED_TAX_CONFLICT' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Statutory Retention Applied (CGST Act)</span>
                      </span>
                    )}

                    {trackedReport.status === 'SUBMITTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-bold">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span>Submitted & In Queue</span>
                      </span>
                    )}

                    {trackedReport.status === 'IN_REVIEW' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 text-xs font-bold">
                        <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />
                        <span>Under DPO Assessment</span>
                      </span>
                    )}

                    {trackedReport.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Declined</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Statutory Progress Stepper */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-700/60">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                    DPDP Statutory SLA Timeline & Verification
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Step 1 */}
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                      <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold mb-1">
                        <Check className="w-4 h-4" />
                        <span>1. Request Lodged</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {new Date(trackedReport.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Logged with SHA-256 Proof</div>
                    </div>

                    {/* Step 2 */}
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                      <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${
                        trackedReport.status !== 'SUBMITTED' ? 'text-emerald-400' : 'text-blue-400'
                      }`}>
                        {trackedReport.status !== 'SUBMITTED' ? <Check className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        <span>2. DPO Assessment</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {trackedReport.daysRemaining !== null ? `${trackedReport.daysRemaining} Days Left in SLA` : 'Evaluated'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">Section 11/12 Statutory Mandate</div>
                    </div>

                    {/* Step 3 */}
                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/50">
                      <div className={`flex items-center gap-1.5 text-xs font-bold mb-1 ${
                        trackedReport.status === 'COMPLETED' ? 'text-emerald-400' :
                        trackedReport.status === 'RETAINED_TAX_CONFLICT' ? 'text-amber-400' :
                        trackedReport.status === 'REJECTED' ? 'text-rose-400' : 'text-slate-500'
                      }`}>
                        {['COMPLETED', 'RETAINED_TAX_CONFLICT', 'REJECTED'].includes(trackedReport.status) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                        <span>3. Final Decision</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {trackedReport.status === 'COMPLETED' ? 'Approved & Committed' :
                         trackedReport.status === 'RETAINED_TAX_CONFLICT' ? 'Statutory Lock Active' :
                         trackedReport.status === 'REJECTED' ? 'Declined' : 'Pending DPO Resolution'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        Updated {new Date(trackedReport.updatedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resolution Details & Officer Commentary */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-400" />
                    <span>DPO Resolution Commentary & Verified Ledger Notes</span>
                  </h4>

                  {trackedReport.resolutionNotes ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                        Official DPO Response Note:
                      </span>
                      <p className="text-emerald-200 font-medium">{trackedReport.resolutionNotes}</p>
                    </div>
                  ) : (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300">
                      This request is currently under review by the designated Data Protection Officer. Statutory decision will be posted here before the statutory due date.
                    </div>
                  )}

                  {/* Field Correction comparison */}
                  {trackedReport.fieldToCorrect && (
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700 text-xs space-y-1">
                      <div className="text-slate-400">Field Target: <strong className="text-white">{trackedReport.fieldToCorrect}</strong></div>
                      <div className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                        <span className="text-rose-400 line-through">{trackedReport.currentValue || 'Original Value'}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-emerald-400 font-bold">{trackedReport.correctedValue}</span>
                      </div>
                    </div>
                  )}

                  {/* Erasure statutory lock note */}
                  {trackedReport.taxRetentionLock && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 space-y-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Statutory Retention Conflict (Section 36 CGST Act)</span>
                      </div>
                      <p className="text-[11px] text-amber-200/90">
                        While your marketing & consent profiles have been withdrawn, underlying transaction/financial records are mandated by Indian Central Goods & Services Tax law to be preserved for 7 years (72 months).
                      </p>
                    </div>
                  )}

                  {/* Cryptographic SHA-256 Proof */}
                  {trackedReport.sha256Proof && (
                    <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-700/80 font-mono text-[10px] space-y-1">
                      <span className="text-slate-500 block uppercase font-bold tracking-wider">
                        Tamper-Evident SHA-256 Ledger Proof:
                      </span>
                      <div className="text-blue-400 break-all select-all">
                        {trackedReport.sha256Proof}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Traversal Results & Exercise Rights Section */}
        {portalMode === 'inspect' && searched && report && (
          <div className="space-y-6">
            {/* 1. RoPA Lineage Report (Right to Access - Section 11) */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-6 shadow-xl space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-700/80">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>1. Right to Access Information (DPDP Act Sec 11)</span>
                      {report.businessInfo && (
                        <span className="text-[10px] bg-slate-700 text-blue-300 font-normal px-2 py-0.5 rounded border border-slate-600">
                          {report.businessInfo.name} ({report.businessInfo.website})
                        </span>
                      )}
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

                      <div className="flex flex-col sm:items-end justify-between gap-1 text-right text-[10px] text-slate-400 font-mono">
                        <div>Filed: {new Date(req.createdAt).toLocaleDateString()}</div>
                        <button
                          onClick={() => handleTrackRequest(req.requestId)}
                          className="mt-1 px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white rounded text-[10px] font-sans font-semibold transition-colors flex items-center gap-1 border border-blue-500/30"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Track Live Status</span>
                        </button>
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
