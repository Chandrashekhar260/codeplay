import { useState, useEffect } from 'react';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { OverviewPage } from './pages/OverviewPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { RopaPage } from './pages/RopaPage';
import { GovernancePage } from './pages/GovernancePage';
import { ConsentPage } from './pages/ConsentPage';
import { AuditPage } from './pages/AuditPage';
import { DsrAdminPage } from './pages/DsrAdminPage';
import { DataPrincipalPortal } from './pages/DataPrincipalPortal';
import { LoginModal } from './components/auth/LoginModal';
import { api } from './api/client';
import type { DataSource, ProcessingActivity, DataAsset, Purpose, DsrRequest } from './types';

const navTabs: NavTab[] = [
  'dashboard',
  'discovery',
  'ropa',
  'governance',
  'consent',
  'dsr',
  'audit',
];

function tabFromHash(): NavTab {
  const hash = window.location.hash.slice(1) as NavTab;
  return navTabs.includes(hash) ? hash : 'dashboard';
}

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(tabFromHash);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [tenantName, setTenantName] = useState<string>('Loading Workspace...');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Toggle for Citizen / Data Principal Self-Service Portal
  const [isPortalView, setIsPortalView] = useState<boolean>(() => {
    return window.location.hash === '#portal';
  });

  // Live Backend Data States
  const [sources, setSources] = useState<DataSource[]>([]);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [dsrRequests, setDsrRequests] = useState<DsrRequest[]>([]);
  const [realFindingsCount, setRealFindingsCount] = useState<number>(0);
  const [realFlagsCount, setRealFlagsCount] = useState<number>(0);
  const [realConsentsCount, setRealConsentsCount] = useState<number>(0);
  const [pendingDsrCount, setPendingDsrCount] = useState<number>(0);

  const navigateToTab = (tab: NavTab) => {
    setIsPortalView(false);
    window.history.pushState({ tab }, '', `#${tab}`);
    setCurrentTab(tab);
  };

  const openPortalView = () => {
    setIsPortalView(true);
    window.history.pushState({ portal: true }, '', '#portal');
  };

  const closePortalView = () => {
    setIsPortalView(false);
    window.history.pushState({ tab: currentTab }, '', `#${currentTab}`);
    loadWorkspaceData();
  };

  // Live Data Loader — Direct from PostgreSQL Backend
  const loadWorkspaceData = async () => {
    setIsRefreshing(true);
    try {
      const [srcData, actData, astData, purpData, tenantData, dsrAlerts, dsrList] =
        await Promise.all([
          api.discovery.getSources().catch(() => []),
          api.mapping.getActivities().catch(() => []),
          api.governance.getAssets().catch(() => []),
          api.consent.getPurposes().catch(() => []),
          api.auth.getTenant().catch(() => null),
          api.dsr.getAlerts().catch(() => ({ totalPending: 0 })),
          api.dsr.getRequests().catch(() => []),
        ]);

      setSources(srcData);
      setActivities(actData);
      setAssets(astData);
      setPurposes(purpData);
      setDsrRequests(dsrList);
      setPendingDsrCount(dsrAlerts.totalPending || 0);

      if (tenantData?.name) {
        setTenantName(tenantData.name);
      }

      setRealConsentsCount(tenantData?.counts?.consentRecords || 0);

      // Fetch actual findings and flags from the data sources
      let totalFindings = 0;
      let totalFlags = 0;
      for (const src of srcData) {
        try {
          const [f, fl] = await Promise.all([
            api.discovery.getFindings(src.sourceId),
            api.discovery.getFlags(src.sourceId),
          ]);
          totalFindings += f.length;
          totalFlags += fl.length;
        } catch {}
      }
      setRealFindingsCount(totalFindings);
      setRealFlagsCount(totalFlags);
    } catch (err) {
      console.error('[DataSentinel] Live API sync failed:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Authenticate and load live data
  useEffect(() => {
    const handlePopState = () => {
      if (window.location.hash === '#portal') {
        setIsPortalView(true);
      } else {
        setIsPortalView(false);
        setCurrentTab(tabFromHash());
      }
    };
    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('datasentinel:unauthorized', handleUnauthorized);

    async function initAuth() {
      setIsAuthChecking(true);
      const existingToken = localStorage.getItem('datasentinel_token');
      if (existingToken) {
        try {
          const me = await api.auth.getMe();
          setIsAuthenticated(true);
          if (me.tenant?.name) setTenantName(me.tenant.name);
          await loadWorkspaceData();
          setIsAuthChecking(false);
          return;
        } catch {
          localStorage.removeItem('datasentinel_token');
        }
      }

      // Auto-authenticate as registered demo DPO user
      try {
        const loginData = await api.auth.login(
          'ramesh.kumar@aarogyadiagnostics.in',
          'Password123!'
        );
        localStorage.setItem('datasentinel_token', loginData.token);
        setIsAuthenticated(true);
        if (loginData.tenant?.name) setTenantName(loginData.tenant.name);
        await loadWorkspaceData();
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsAuthChecking(false);
      }
    }

    initAuth();
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('datasentinel:unauthorized', handleUnauthorized);
    };
  }, []);

  // 1. Citizen / Data Principal Self-Service Portal (Public access)
  if (isPortalView) {
    return <DataPrincipalPortal onBackToAdmin={closePortalView} />;
  }

  // 2. Authentication Loading / Login State
  if (isAuthChecking) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">Connecting to DataSentinel DPDP Workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <LoginModal
        onLoginSuccess={(data) => {
          setIsAuthenticated(true);
          if (data.tenant?.name) setTenantName(data.tenant.name);
          loadWorkspaceData();
        }}
      />
    );
  }

  // 3. Authenticated Enterprise Dashboard
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={navigateToTab}
        tenantName={tenantName}
        pendingDsrCount={pendingDsrCount}
        onLaunchPortal={openPortalView}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Topbar
          currentTab={currentTab}
          onRefresh={loadWorkspaceData}
          isRefreshing={isRefreshing}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {currentTab === 'dashboard' && (
            <OverviewPage
              onNavigate={navigateToTab}
              stats={{
                sourcesCount: sources.length,
                findingsCount: realFindingsCount,
                assetsCount: assets.length,
                consentsCount: realConsentsCount,
                flagsCount: realFlagsCount,
              }}
            />
          )}

          {currentTab === 'discovery' && (
            <DiscoveryPage
              sources={sources}
              onFileUploaded={loadWorkspaceData}
            />
          )}

          {currentTab === 'ropa' && (
            <RopaPage
              activities={activities}
              onActivityCreated={loadWorkspaceData}
            />
          )}

          {currentTab === 'governance' && (
            <GovernancePage assets={assets} />
          )}

          {currentTab === 'consent' && (
            <ConsentPage
              purposes={purposes}
              onConsentRecorded={loadWorkspaceData}
            />
          )}

          {currentTab === 'dsr' && (
            <DsrAdminPage
              requests={dsrRequests}
              onDsrResolved={loadWorkspaceData}
              onLaunchPortal={openPortalView}
            />
          )}

          {currentTab === 'audit' && <AuditPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
