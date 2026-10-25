export interface CreatePurposeInput {
  name: string;
  legalBasis?: string; // default "DPDPA_SEC_6_CONSENT"
  version?: string;    // default "1.0"
  description?: string;
}

export interface RecordConsentInput {
  userRef: string; // Phone number (+91...), email, or customer/patient ID
  purposeId: string;
  channel?: 'WHATSAPP_YES' | 'PAPER_SLIP' | 'WEB_PORTAL' | 'RECEPTION_DESK' | 'SMS_OPTIN';
  noticeLanguage?: 'en' | 'hi' | 'kn';
  affirmativeCheck: boolean; // Under DPDP Sec 6, silence/inactivity is NOT consent
}

export interface WithdrawConsentInput {
  userRef: string;
  purposeId: string;
  reason?: string;
}

export interface CreateCollectionPointInput {
  name: string;
  orgId?: string;
  widgetConfig?: Record<string, any>;
}

export interface CreatePreferenceCentreInput {
  name: string;
  slug: string;
  configJson?: Record<string, any>;
}
