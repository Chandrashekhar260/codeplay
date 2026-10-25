/**
 * DPDP Act 2023 - Statutory Data Retention Guidelines Engine
 * 
 * Under Section 8(7) of the Digital Personal Data Protection Act, 2023:
 * "A Data Fiduciary shall, unless retention is necessary for compliance with any law for the
 *  time being in force, erase personal data, upon the Data Principal withdrawing her consent
 *  or as soon as it is reasonable to assume that the specified purpose is no longer being served,
 *  whichever is earlier."
 *
 * This engine maps identified PII categories, business functions, and purposes
 * to statutory minimums and maximums according to Indian law.
 */

export interface DpdpRetentionRule {
  key: string;
  categoryPattern: RegExp;
  functionPattern: RegExp;
  retentionPeriodMonths: number;
  triggerEvent: string;
  statutoryReference: string;
  description: string;
}

export const DPDP_RETENTION_RULES: DpdpRetentionRule[] = [
  {
    key: 'FINANCIAL_TAX',
    categoryPattern: /(financial|bank|account|salary|pan|gst|tax|payment|invoice|credit|debit)/i,
    functionPattern: /(finance|billing|accounts|payroll|tax|invoicing|payment)/i,
    retentionPeriodMonths: 84, // 7 years
    triggerEvent: 'STATUTORY_TAX_AUDIT_COMPLETION',
    statutoryReference: 'Income Tax Act 1961 Sec 44AA / Companies Act 2013 Sec 128 r/w DPDP Sec 8(7)',
    description: 'Statutory mandate to retain financial books of accounts for 7-8 financial years.',
  },
  {
    key: 'KYC_AML',
    categoryPattern: /(aadhaar|passport|voter|driving|identity|kyc|national_id)/i,
    functionPattern: /(kyc|compliance|verification|onboarding|legal)/i,
    retentionPeriodMonths: 60, // 5 years
    triggerEvent: 'ACCOUNT_CLOSURE_OR_CESSATION_OF_RELATIONSHIP',
    statutoryReference: 'PMLA 2002 Sec 12 r/w RBI Master Directions on KYC & DPDP Sec 8(7)',
    description: 'Mandatory 5-year retention post account closure under Prevention of Money Laundering Act.',
  },
  {
    key: 'HEALTH_DIAGNOSTICS',
    categoryPattern: /(health|medical|biometric|blood|genetic|diagnosis|prescription|patient|clinical)/i,
    functionPattern: /(diagnostic|medical|clinical|healthcare|hospital|pathology|consultation)/i,
    retentionPeriodMonths: 36, // 3 years
    triggerEvent: 'PURPOSE_COMPLETION_OR_STATUTORY_CLINICAL_PERIOD',
    statutoryReference: 'National Medical Commission (NMC) Regulations r/w DPDP Act Sec 8(7)',
    description: 'Clinical consultations, lab diagnostics, and patient history retained for 3 years from treatment.',
  },
  {
    key: 'EMPLOYMENT_HR',
    categoryPattern: /(employee|resume|appraisal|performance|offer|contract|provident)/i,
    functionPattern: /(hr|human resources|people|recruitment|talent)/i,
    retentionPeriodMonths: 36, // 3 years
    triggerEvent: 'EMPLOYMENT_TERMINATION',
    statutoryReference: 'Payment of Gratuity Act / EPF Act r/w DPDP Act Sec 8(7)',
    description: 'Personnel records retained for 3 years after employment cessation for dispute resolution.',
  },
  {
    key: 'MARKETING_PROMOTIONS',
    categoryPattern: /(email|phone|mobile|interest|device|cookie|tracking|advertising)/i,
    functionPattern: /(marketing|growth|outreach|crm|newsletter|promotions|campaign)/i,
    retentionPeriodMonths: 12, // 1 year
    triggerEvent: 'CONSENT_WITHDRAWAL_OR_PURPOSE_FULFILLMENT',
    statutoryReference: 'DPDP Act 2023 Sec 8(7) Purpose Limitation & Prompt Erasure',
    description: 'Marketing personal data must be erased immediately upon consent withdrawal or after 12 months of inactivity.',
  },
  {
    key: 'GENERAL_CUSTOMER_SERVICE',
    categoryPattern: /.*/,
    functionPattern: /.*/,
    retentionPeriodMonths: 24, // 2 years default
    triggerEvent: 'TICKET_RESOLUTION_OR_CONSENT_WITHDRAWAL',
    statutoryReference: 'DPDP Act 2023 Sec 8(7) Reasonable Purpose Period',
    description: 'General business interaction data retained for up to 24 months unless consent is withdrawn earlier.',
  },
];

export interface DpdpRetentionRecommendation {
  retentionPeriodMonths: number;
  retentionDays: number;
  triggerEvent: string;
  statutoryReference: string;
  matchedRule: string;
  description: string;
}

/**
 * Computes recommended DPDP data retention duration based on discovered PII categories,
 * business function, and activity purpose.
 */
export function calculateDpdpRetention(
  piiCategories: string[] = [],
  businessFunction: string = '',
  purpose: string = ''
): DpdpRetentionRecommendation {
  const combinedContext = `${businessFunction} ${purpose}`.toLowerCase();
  const joinedPii = piiCategories.join(' ').toLowerCase();

  // 1. Check for Highest Priority Statutory Obligations first (Financial/Tax > KYC > Health > HR > Marketing)
  for (const rule of DPDP_RETENTION_RULES) {
    if (rule.key === 'GENERAL_CUSTOMER_SERVICE') continue; // Skip default until others fail

    const matchesPii = piiCategories.length > 0 && rule.categoryPattern.test(joinedPii);
    const matchesFunction = rule.functionPattern.test(combinedContext);

    // If either PII matches this sensitive statutory category or the business function explicitly matches
    if (matchesPii || matchesFunction) {
      return {
        retentionPeriodMonths: rule.retentionPeriodMonths,
        retentionDays: rule.retentionPeriodMonths * 30,
        triggerEvent: rule.triggerEvent,
        statutoryReference: rule.statutoryReference,
        matchedRule: rule.key,
        description: rule.description,
      };
    }
  }

  // Fallback to general customer service guideline
  const defaultRule = DPDP_RETENTION_RULES.find((r) => r.key === 'GENERAL_CUSTOMER_SERVICE')!;
  return {
    retentionPeriodMonths: defaultRule.retentionPeriodMonths,
    retentionDays: defaultRule.retentionPeriodMonths * 30,
    triggerEvent: defaultRule.triggerEvent,
    statutoryReference: defaultRule.statutoryReference,
    matchedRule: defaultRule.key,
    description: defaultRule.description,
  };
}
