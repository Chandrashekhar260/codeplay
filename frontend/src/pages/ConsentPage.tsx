import React, { useState, useEffect } from 'react';
import {
  Globe2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import type { Purpose, ConsentRecord, ConsentNotice } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface ConsentPageProps {
  purposes: Purpose[];
  onConsentRecorded: () => void;
}

export const ConsentPage: React.FC<ConsentPageProps> = ({ purposes, onConsentRecorded }) => {
  const [activeTab, setActiveTab] = useState<'notices' | 'ledger' | 'record'>('notices');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'hi' | 'kn'>('en');
  const [notice, setNotice] = useState<ConsentNotice | null>(null);
  const [loadingNotice, setLoadingNotice] = useState<boolean>(true);

  // Patient ledger search state
  const [searchUserRef, setSearchUserRef] = useState<string>('+919876543210');
  const [userRecords, setUserRecords] = useState<ConsentRecord[]>([]);
  const [loadingLedger, setLoadingLedger] = useState<boolean>(false);
  const [withdrawMessage, setWithdrawMessage] = useState<string | null>(null);

  // Record consent form state
  const [formUserRef, setFormUserRef] = useState<string>('');
  const [formPurposeId, setFormPurposeId] = useState<string>('');
  const [formChannel, setFormChannel] = useState<string>('WHATSAPP_YES');
  const [formLanguage, setFormLanguage] = useState<'en' | 'hi' | 'kn'>('kn');
  const [formAffirmative, setFormAffirmative] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Load statutory notice on language change
  useEffect(() => {
    async function loadNotice() {
      setLoadingNotice(true);
      try {
        const data = await api.consent.getNotices(selectedLanguage);
        setNotice(data);
      } catch (err) {
        console.error('Failed to load notice:', err);
      } finally {
        setLoadingNotice(false);
      }
    }
    loadNotice();
  }, [selectedLanguage]);

  // Load user ledger
  const fetchUserLedger = async (userRef: string) => {
    if (!userRef.trim()) return;
    setLoadingLedger(true);
    setWithdrawMessage(null);
    try {
      const records = await api.consent.getUserLedger(userRef);
      setUserRecords(records);
    } catch (err) {
      console.error('Failed to fetch user ledger:', err);
      setUserRecords([]);
    } finally {
      setLoadingLedger(false);
    }
  };

  useEffect(() => {
    fetchUserLedger(searchUserRef);
  }, []);

  // Handle Withdrawal (DPDP Section 6(4))
  const handleWithdraw = async (record: ConsentRecord) => {
    try {
      await api.consent.withdrawConsent({
        userRef: record.userRef,
        purposeId: record.purposeId,
        reason: 'Customer initiated withdrawal via self-service portal',
      });
      setWithdrawMessage(`Consent for "${record.purposeName}" marked WITHDRAWN under Section 6(4).`);
      fetchUserLedger(record.userRef);
      onConsentRecorded();
    } catch (err: any) {
      alert(err.response?.data?.error?.message || 'Failed to withdraw consent.');
    }
  };

  // Handle Record New Consent
  const handleRecordConsent = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    if (!formAffirmative) {
      setFormError('DPDP Act Section 6 Violation: Consent requires affirmative action. Checkbox must be explicitly checked.');
      setFormSubmitting(false);
      return;
    }

    try {
      const result = await api.consent.recordConsent({
        userRef: formUserRef,
        purposeId: formPurposeId || purposes[0]?.purposeId,
        channel: formChannel,
        noticeLanguage: formLanguage,
        affirmativeCheck: true,
      });

      setFormSuccess(`Affirmative consent recorded for ${result.userRef} (ID: ${result.recordId}).`);
      setFormUserRef('');
      setFormAffirmative(false);
      onConsentRecorded();
      if (searchUserRef === formUserRef) {
        fetchUserLedger(formUserRef);
      }
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to record consent.');
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            DPDP Consent Ledger & Multilingual Notice Generator
          </h2>
          <p className="text-xs text-slate-500">
            Enforces Section 5 (Eighth Schedule Notices), Section 6 (Affirmative Action), and Section 6(4) (Immediate Withdrawal).
          </p>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'notices' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Multilingual Notices
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'ledger' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Patient Consent Ledger
          </button>
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              activeTab === 'record' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Record Consent Event
          </button>
        </div>
      </div>

      {activeTab === 'notices' && (
        <div className="space-y-4">
          {/* Language Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              <Globe2 className="w-3.5 h-3.5 text-blue-600" />
              Notice Language:
            </span>
            {(['en', 'hi', 'kn'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setSelectedLanguage(lang)}
                className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                  selectedLanguage === lang
                    ? 'bg-blue-600 text-white border-blue-600 font-semibold'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                {lang === 'en' ? 'English (EN)' : lang === 'hi' ? 'हिन्दी (Hindi)' : 'ಕನ್ನಡ (Kannada)'}
              </button>
            ))}
          </div>

          {/* Rendered Notice Card */}
          {loadingNotice || !notice ? (
            <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded">
              Loading statutory notice template...
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded p-6 space-y-5">
              <div className="border-b border-slate-200 pb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                  DPDP Act Section 5 Compliant Notice
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-2">{notice.headline}</h3>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">Personal Data Collected:</h4>
                  <ul className="list-disc list-inside space-y-1 text-slate-700 pl-1">
                    {notice.dataCollected.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">Specified Processing Purpose:</h4>
                  <p className="text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-200">
                    {notice.specifiedPurpose}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">Data Principal Rights:</h4>
                  <p className="text-slate-700 leading-relaxed">{notice.rightsNotice}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-slate-900 uppercase text-[11px] mb-1">Consent Withdrawal (Section 6(4)):</h4>
                  <p className="text-slate-700 leading-relaxed">{notice.withdrawalInstructions}</p>
                </div>

                <div className="bg-blue-50/60 border border-blue-200 p-3 rounded flex items-center justify-between text-xs text-blue-900">
                  <div>
                    <span className="font-bold">Grievance Redressal Officer: </span>
                    <span>{notice.grievanceRedressal.officerTitle} ({notice.grievanceRedressal.email})</span>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700">Turnaround: {notice.grievanceRedressal.turnaroundDays} days</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-start gap-2 bg-slate-50 p-3 rounded">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="font-medium text-slate-800 text-[11px] italic">
                    "{notice.affirmativeStatement}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="bg-white border border-slate-200 rounded overflow-hidden space-y-4 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Individual Patient / Customer Consent History
              </h4>
              <p className="text-xs text-slate-500">Query complete audit trail of consent events by phone or email.</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUserLedger(searchUserRef);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                placeholder="+919876543210"
                value={searchUserRef}
                onChange={(e) => setSearchUserRef(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 font-mono"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded hover:bg-slate-800"
              >
                Search
              </button>
            </form>
          </div>

          {withdrawMessage && (
            <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2 rounded">
              {withdrawMessage}
            </p>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Subject Identifier</th>
                  <th className="py-2.5 px-4">Purpose</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Channel & Notice</th>
                  <th className="py-2.5 px-4">Captured At</th>
                  <th className="py-2.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {loadingLedger ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-500">
                      Loading ledger records...
                    </td>
                  </tr>
                ) : userRecords.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No consent records found for identifier "{searchUserRef}".
                    </td>
                  </tr>
                ) : (
                  userRecords.map((r) => (
                    <tr key={r.recordId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.userRef}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{r.purposeName}</td>
                      <td className="py-3 px-4">
                        <Badge status={r.status} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-mono text-[11px]">{r.channel}</span> ({r.noticeLanguage.toUpperCase()})
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-500">
                        {new Date(r.capturedAt).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        {r.status === 'GIVEN' ? (
                          <button
                            onClick={() => handleWithdraw(r)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded hover:bg-rose-100"
                          >
                            Withdraw Consent
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Withdrawn</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'record' && (
        <div className="bg-white border border-slate-200 rounded p-6 max-w-xl mx-auto space-y-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Record Affirmative Consent Event (DPDP Section 6)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Test affirmative consent recording. If affirmative action is unchecked, the request will be rejected.
            </p>
          </div>

          <form onSubmit={handleRecordConsent} className="space-y-4 text-xs">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Patient Phone or Email *</label>
              <input
                type="text"
                required
                placeholder="+919876543210"
                value={formUserRef}
                onChange={(e) => setFormUserRef(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Processing Purpose *</label>
              <select
                value={formPurposeId}
                onChange={(e) => setFormPurposeId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {purposes.map((p) => (
                  <option key={p.purposeId} value={p.purposeId}>
                    {p.name} ({p.legalBasis})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Collection Channel</label>
                <select
                  value={formChannel}
                  onChange={(e) => setFormChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="WHATSAPP_YES">WhatsApp Reply (YES)</option>
                  <option value="PAPER_SLIP">Signed Physical Paper Slip</option>
                  <option value="WEB_PORTAL">Web Patient Portal</option>
                  <option value="RECEPTION_DESK">Clinic Reception Desk</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Notice Language Presented</label>
                <select
                  value={formLanguage}
                  onChange={(e) => setFormLanguage(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>
            </div>

            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded flex items-start gap-2.5">
              <input
                type="checkbox"
                id="affirmativeCheck"
                checked={formAffirmative}
                onChange={(e) => setFormAffirmative(e.target.checked)}
                className="mt-0.5 rounded border-amber-400 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="affirmativeCheck" className="text-slate-800 text-xs cursor-pointer">
                <span className="font-bold">Affirmative Action Check: </span>
                Data principal made an explicit affirmative action granting informed consent. (Silence or pre-ticked box is invalid under DPDP Section 6).
              </label>
            </div>

            {formSuccess && (
              <p className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded">
                {formSuccess}
              </p>
            )}

            {formError && (
              <p className="text-xs text-rose-800 bg-rose-50 border border-rose-200 p-2.5 rounded">
                {formError}
              </p>
            )}

            <button
              type="submit"
              disabled={formSubmitting}
              className="w-full py-2.5 px-4 font-semibold text-white bg-blue-600 hover:bg-blue-500 active:bg-blue-700 rounded transition-colors disabled:opacity-50"
            >
              {formSubmitting ? 'Recording Consent in Immutable Ledger...' : 'Record Affirmative Consent'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
