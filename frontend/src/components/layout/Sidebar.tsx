import React from 'react';
import {
  ShieldCheck,
  LayoutDashboard,
  FileSearch,
  Network,
  Scale,
  FileCheck2,
  ScrollText,
  Building2,
  ChevronRight,
  UserCheck,
  ExternalLink,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'discovery' | 'ropa' | 'governance' | 'consent' | 'dsr' | 'audit';

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  tenantName: string;
  pendingDsrCount?: number;
  onLaunchPortal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  tenantName,
  pendingDsrCount = 0,
  onLaunchPortal,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Executive Overview', icon: LayoutDashboard },
    { id: 'discovery', label: 'Data Discovery & Scanner', icon: FileSearch },
    { id: 'ropa', label: 'RoPA & Data Flow Graph', icon: Network },
    { id: 'governance', label: 'Governance & Retention', icon: Scale },
    { id: 'consent', label: 'Consent & Notices', icon: FileCheck2 },
    { id: 'dsr', label: 'Data Rights (DSR)', icon: UserCheck, badge: pendingDsrCount },
    { id: 'audit', label: 'Immutable Audit Trail', icon: ScrollText },
  ] as const;

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-bold text-white tracking-tight leading-tight">DataSentinel</span>
          <span className="text-[11px] text-slate-400 truncate">DPDP Compliance Engine</span>
        </div>
      </div>

      {/* Workspace Context Switcher */}
      <div className="p-3.5 border-b border-slate-800/80">
        <div className="bg-slate-800/60 rounded p-2.5 flex items-center gap-2.5 border border-slate-700/50">
          <Building2 className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tenant Workspace</p>
            <p className="text-xs font-semibold text-slate-100 truncate">{tenantName}</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-2 pb-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">Modules</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          const badgeCount = (item as any).badge;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-medium rounded transition-colors text-left ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="flex-1 truncate">{item.label}</span>
              {badgeCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 font-extrabold rounded-full text-[10px] animate-pulse">
                  ⭐ {badgeCount}
                </span>
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-80" />}
            </button>
          );
        })}
      </nav>

      {/* Citizen Privacy Portal Callout */}
      {onLaunchPortal && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/30">
          <button
            onClick={onLaunchPortal}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-blue-950/40 border border-blue-500/30 text-blue-300 hover:bg-blue-900/40 text-xs font-semibold transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🛡️</span>
              <div className="text-left">
                <span className="block text-[11px] leading-tight text-white">Citizen Privacy Portal</span>
                <span className="text-[9px] text-blue-400 font-normal">Self-service DPDP rights</span>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
          </button>
        </div>
      )}

      {/* Footer DPO Profile */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200 shrink-0">
            RK
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">Ramesh Kumar</p>
            <p className="text-[11px] text-slate-400 truncate">Designated DPO</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Live DB Connected" />
        </div>
      </div>
    </aside>
  );
};
