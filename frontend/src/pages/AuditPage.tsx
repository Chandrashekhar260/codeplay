import React, { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import type { AuditEvent } from '../types';
import { api } from '../api/client';

export const AuditPage: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');

  const loadAuditEvents = async () => {
    setLoading(true);
    try {
      // Fetch platform tenant info or audit entries
      const tenant = await api.auth.getTenant();
      // If backend returns audit events or sample
      setEvents(tenant?.recentAuditEvents || []);
    } catch (err) {
      console.error('Failed to load audit events:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditEvents();
  }, []);

  const filteredEvents = events.filter((e) =>
    filterAction === 'ALL' ? true : e.action.includes(filterAction)
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Append-Only Statutory Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Immutable compliance ledger recording all PII discoveries, classifications, and consent state changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-2.5 py-1.5 text-xs border border-slate-300 rounded focus:outline-none bg-white text-slate-800"
          >
            <option value="ALL">All Event Types</option>
            <option value="CONSENT">Consent Events</option>
            <option value="DATA_ASSET">Asset Classification</option>
            <option value="ROPA">RoPA Mapping</option>
            <option value="AUTH">Authentication</option>
          </select>

          <button
            onClick={loadAuditEvents}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Verified Event Ledger Entries ({filteredEvents.length})
          </span>
          <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Append-Only Enforced
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Action</th>
                <th className="py-2.5 px-4">Resource Target</th>
                <th className="py-2.5 px-4">Actor / Origin</th>
                <th className="py-2.5 px-4">Event Payload / Diff</th>
                <th className="py-2.5 px-4">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 animate-pulse">
                    Retrieving tamper-evident ledger events...
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No matching audit events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  let parsedDiff = null;
                  try {
                    parsedDiff = ev.diffJson ? JSON.parse(ev.diffJson) : null;
                  } catch {}

                  return (
                    <tr key={ev.eventId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] font-bold text-slate-900 px-2 py-0.5 bg-slate-100 border border-slate-200 rounded">
                          {ev.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                        {ev.resourceType}
                        {ev.resourceId && <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{ev.resourceId}</p>}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        <span className="font-mono text-[11px]">{ev.ipAddress || '127.0.0.1'}</span>
                      </td>
                      <td className="py-3 px-4 max-w-sm">
                        {parsedDiff ? (
                          <pre className="font-mono text-[10px] bg-slate-50 p-1.5 rounded border border-slate-200 overflow-x-auto text-slate-700">
                            {JSON.stringify(parsedDiff, null, 1)}
                          </pre>
                        ) : (
                          <span className="text-slate-400 text-[11px]">N/A</span>
                        )}
                      </td>
                      <td className="py-3 px-4 tabular-nums text-slate-500 text-[11px] whitespace-nowrap">
                        {new Date(ev.createdAt).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
