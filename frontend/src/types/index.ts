// ==========================================
// User & Tenant Types
// ==========================================
export interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tenantId: string;
}

export interface AuthResponse {
  user: User;
  tenant: Tenant;
  token: string;
}

// ==========================================
// Discovery & PII Scanner Types
// ==========================================
export interface DataSource {
  sourceId: string;
  name: string;
  sourceType: string;
  status: string;
  lastScannedAt?: string;
}

export interface ScanFinding {
  findingId: string;
  jobId: string;
  objectName: string;
  fieldName: string;
  piiCategories: string;
  sensitivityLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface RemediationFlag {
  flagId: string;
  sourceId: string;
  flagType: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
}

// ==========================================
// RoPA Mapping & Graph Types
// ==========================================
export interface DataElement {
  elementId: string;
  piiCategory: string;
  dataSubjects: string;
  volumeEstimate?: string;
}

export interface DataFlow {
  flowId: string;
  flowStage: string;
  systemName: string;
  location: string;
}

export interface ProcessingActivity {
  activityId: string;
  name: string;
  businessFunction: string;
  legalBasis: string;
  status: string;
  createdAt: string;
  dataElements: DataElement[];
  dataFlows: DataFlow[];
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: {
    label: string;
    sublabel?: string;
    badge?: string;
    level?: string;
    category?: string;
    system?: string;
  };
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  animated?: boolean;
}

export interface RopaGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// ==========================================
// Governance & Classification Types
// ==========================================
export type Classification = 'RESTRICTED' | 'CONFIDENTIAL' | 'INTERNAL' | 'PUBLIC';

export interface DataAsset {
  assetId: string;
  name: string;
  type: string;
  classification: Classification;
  owner: string;
  steward?: string;
  retentionDays?: number | null;
  createdAt: string;
}

export interface ClassificationRule {
  classification: Classification;
  reason: string;
  legalReferences: string[];
  controls: string[];
}

export interface RetentionRule {
  retentionMonths: number | null;
  statutoryLaw: string[];
  triggerEvent: string;
  description: string;
  requiresLegalReview: boolean;
}

// ==========================================
// Consent Ledger & Multilingual Notices
// ==========================================
export interface Purpose {
  purposeId: string;
  name: string;
  legalBasis: string;
  version: string;
  description?: string;
  consentCount: number;
  createdAt: string;
}

export interface ConsentRecord {
  recordId: string;
  userRef: string;
  purposeId: string;
  purposeName: string;
  legalBasis: string;
  status: 'GIVEN' | 'WITHDRAWN' | 'EXPIRED';
  channel: string;
  noticeLanguage: 'en' | 'hi' | 'kn';
  capturedAt: string;
  withdrawnAt?: string | null;
}

export interface ConsentNotice {
  language: 'en' | 'hi' | 'kn';
  languageName: string;
  headline: string;
  dataCollected: string[];
  specifiedPurpose: string;
  rightsNotice: string;
  withdrawalInstructions: string;
  grievanceRedressal: {
    officerTitle: string;
    email: string;
    turnaroundDays: number;
  };
  affirmativeStatement: string;
}

// ==========================================
// Audit Event Type
// ==========================================
export interface AuditEvent {
  eventId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  diffJson?: string;
  ipAddress?: string;
  createdAt: string;
}
