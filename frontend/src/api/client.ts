import axios from 'axios';
import type {
  AuthResponse,
  DataSource,
  ScanFinding,
  RemediationFlag,
  ProcessingActivity,
  RopaGraphData,
  DataAsset,
  Purpose,
  ConsentRecord,
  ConsentNotice,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage automatically
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('datasentinel_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-clear if already on login attempt
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('datasentinel_token');
        window.dispatchEvent(new Event('datasentinel:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<AuthResponse> => {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data.data;
    },
    getMe: async () => {
      const res = await apiClient.get('/auth/me');
      return res.data.data;
    },
    getTenant: async () => {
      const res = await apiClient.get('/platform/tenant');
      return res.data.data;
    },
  },

  // Discovery & Scanner
  discovery: {
    uploadFile: async (file: File): Promise<{ source: DataSource; findings: ScanFinding[]; flags: RemediationFlag[] }> => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/discovery/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    getSources: async (): Promise<DataSource[]> => {
      const res = await apiClient.get('/discovery/sources');
      return res.data.data;
    },
    getFindings: async (sourceId: string): Promise<ScanFinding[]> => {
      const res = await apiClient.get(`/discovery/sources/${sourceId}/findings`);
      return res.data.data.findings;
    },
    getFlags: async (sourceId: string): Promise<RemediationFlag[]> => {
      const res = await apiClient.get(`/discovery/sources/${sourceId}/flags`);
      return res.data.data;
    },
  },

  // RoPA & Graph
  mapping: {
    getActivities: async (): Promise<ProcessingActivity[]> => {
      const res = await apiClient.get('/mapping/activities');
      return res.data.data;
    },
    getGraph: async (): Promise<RopaGraphData> => {
      const res = await apiClient.get('/mapping/graph');
      return res.data.data;
    },
    createActivity: async (data: {
      name: string;
      businessFunction: string;
      legalBasis: string;
      sourceId?: string;
    }): Promise<ProcessingActivity> => {
      const res = await apiClient.post('/mapping/activities', data);
      return res.data.data;
    },
  },

  // Governance
  governance: {
    getAssets: async (): Promise<DataAsset[]> => {
      const res = await apiClient.get('/governance/assets');
      return res.data.data;
    },
    getRules: async (): Promise<any> => {
      const res = await apiClient.get('/governance/rules');
      return res.data.data;
    },
    registerAsset: async (data: {
      name: string;
      type: string;
      owner: string;
      steward?: string;
      businessFunction?: string;
      sourceId?: string;
    }): Promise<any> => {
      const res = await apiClient.post('/governance/assets', data);
      return res.data.data;
    },
  },

  // Consent Ledger
  consent: {
    getPurposes: async (): Promise<Purpose[]> => {
      const res = await apiClient.get('/consent/purposes');
      return res.data.data.purposes;
    },
    createPurpose: async (data: { name: string; legalBasis?: string; description?: string }): Promise<Purpose> => {
      const res = await apiClient.post('/consent/purposes', data);
      return res.data.data;
    },
    getNotices: async (lang: 'en' | 'hi' | 'kn' = 'en'): Promise<ConsentNotice> => {
      const res = await apiClient.get(`/consent/notices?lang=${lang}`);
      return res.data.data;
    },
    recordConsent: async (data: {
      userRef: string;
      purposeId: string;
      channel?: string;
      noticeLanguage?: 'en' | 'hi' | 'kn';
      affirmativeCheck: boolean;
    }): Promise<ConsentRecord> => {
      const res = await apiClient.post('/consent/records', data);
      return res.data.data;
    },
    withdrawConsent: async (data: { userRef: string; purposeId: string; reason?: string }): Promise<ConsentRecord> => {
      const res = await apiClient.post('/consent/records/withdraw', data);
      return res.data.data;
    },
    getUserLedger: async (userRef: string): Promise<ConsentRecord[]> => {
      const res = await apiClient.get(`/consent/records/user/${encodeURIComponent(userRef)}`);
      return res.data.data.records;
    },
  },
};
