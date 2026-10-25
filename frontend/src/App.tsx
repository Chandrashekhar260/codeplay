import { useState, useEffect } from 'react';
import { Sidebar, type NavTab } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { OverviewPage } from './pages/OverviewPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { RopaPage } from './pages/RopaPage';
import { GovernancePage } from './pages/GovernancePage';
import { ConsentPage } from './pages/ConsentPage';
import { AuditPage } from './pages/AuditPage';
import { LoginModal } from './components/auth/LoginModal';
import { api } from './api/client';
import type { DataSource, ProcessingActivity, DataAsset, Purpose } from './types';

const navTabs: NavTab[] = ['dashboard', 'discovery', 'ropa', 'governance', 'consent', 'audit'];

function tabFromHash(): NavTab {
  const tab = window.location.hash.slice(1) as NavTab;
  return navTabs.includes(tab) ? tab : 'dashboard';
}

export function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>(tabFromHash);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [tenantName, setTenantName] = useState<string>('Loading Workspace...');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Live Backend Data States
  const [sources, setSources] = useState<DataSource[]>([]);
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [assets, setAssets] = useState<DataAsset[]>([]);
  const [purposes, setPurposes] = useState<Purpose[]>([]);
  const [realFindingsCount, setRealFindingsCount] = useState<number>(0);
  const [realFlagsCount, setRealFlagsCount] = useState<number>(0);
  const [realConsentsCount, setRealConsentsCount] = useState<number>(0);

  const navigateToTab = (tab: NavTab) => {
    if (tab === currentTab) return;
    window.history.pushState({ tab }, '', `#${tab}`);
    setCurrentTab(tab);
  };

  // Live Data Loader — Direct from PostgreSQL Backend
  const loadWorkspaceData = async () => {
    setIsRefreshing(true);
    try {
      const [srcData, actData, astData, purpData, tenantData] = await Promise.all([
        api.discovery.getSources(),
        api.mapping.getActivities(),
        api.governance.getAssets(),
        api.consent.getPurposes(),
        api.auth.getTenant(),
      ]);

      setSources(srcData);
      setActivities(actData);
      setAssets(astData);
      setPurposes(purpData);
      if (tenantData?.name) {
        setTenantName(tenantData.name);
      }

      // Read real counts directly from PostgreSQL database via tenant API
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
    if (!window.location.hash || !navTabs.includes(window.location.hash.slice(1) as NavTab)) {
      window.history.replaceState({ tab: currentTab }, '', `#${currentTab}`);
    }

    const handlePopState = () => setCurrentTab(tabFromHash());
    const handleUnauthorized = () => setIsAuthenticated(false);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('datasentinel:unauthorized', handleUnauthorized);

    async function initAuth() {
      const existingToken = localStorage.getItem('datasentinel_token');
      if (existingToken) {
        try {
          const me = await api.auth.getMe();
          setIsAuthenticated(true);
          if (me.tenant?.name) setTenantName(me.tenant.name);
          await loadWorkspaceData();
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
      }
    }

    initAuth();
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('datasentinel:unauthorized', handleUnauthorized);
    };
  }, []);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 font-sans">
      {/* If not authenticated, show login form */}
      {!isAuthenticated && (
        <LoginModal
          onLoginSuccess={(data) => {
            setIsAuthenticated(true);
            if (data.tenant?.name) setTenantName(data.tenant.name);
            loadWorkspaceData();
          }}
        />
      )}

      {/* Persistent Enterprise Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={navigateToTab}
        tenantName={tenantName}
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

          {currentTab === 'audit' && <AuditPage />}
        </main>
      </div>
    </div>
  );
}

export default App;
