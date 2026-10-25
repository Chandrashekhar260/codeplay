/**
 * Statutory Multilingual DPDP Notice Templates
 *
 * References:
 * - Digital Personal Data Protection Act, 2023 (Section 5 - Notice)
 * - DPDP Rules, 2025 (Rule 3 - Form and manner of giving notice)
 * - Constitution of India (Eighth Schedule languages)
 */

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

export const STATUTORY_NOTICES: Record<'en' | 'hi' | 'kn', ConsentNotice> = {
  en: {
    language: 'en',
    languageName: 'English',
    headline: 'DPDP Act, 2023 — Privacy Notice & Affirmative Consent',
    dataCollected: [
      'Personal Identification (Name, Phone Number, Email)',
      'Clinical & Consultation Records (Dental health history, diagnosis notes, treatment plans)',
      'Invoicing and Payment Records (Tax invoice identifiers, billing details)',
    ],
    specifiedPurpose:
      'To provide clinical consultation, dental diagnosis, lab report dispatch, appointment reminders, and statutory tax invoicing under CGST Act Section 36.',
    rightsNotice:
      'Under the DPDP Act, you have the right to access a summary of your personal data, request correction of inaccurate data, and nominate a representative in case of incapacity.',
    withdrawalInstructions:
      'You may withdraw your consent at any time via WhatsApp, SMS, or our Patient Self-Service Portal. Withdrawal will not affect prior lawful processing or records mandated by statutory tax obligations.',
    grievanceRedressal: {
      officerTitle: 'Data Protection & Grievance Officer',
      email: 'dpo@aarogyadiagnostics.in',
      turnaroundDays: 30,
    },
    affirmativeStatement:
      'I hereby give my free, specific, informed, and unambiguous affirmative consent for processing my personal and diagnostic data for the specified purposes stated above.',
  },

  hi: {
    language: 'hi',
    languageName: 'हिन्दी (Hindi)',
    headline: 'डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम, 2023 — गोपनीयता सूचना एवं सहमति',
    dataCollected: [
      'व्यक्तिगत पहचान (नाम, मोबाइल नंबर, ईमेल)',
      'नैदानिक एवं परामर्श रिकॉर्ड (दंत स्वास्थ्य इतिहास, परीक्षण रिपोर्ट, उपचार विवरण)',
      'बिलिंग एवं कर रिकॉर्ड (वस्तु एवं सेवा कर अधिनियम धारा 36 के अंतर्गत इनवॉइस रिकॉर्ड)',
    ],
    specifiedPurpose:
      'नैदानिक परामर्श, दंत जांच, प्रयोगशाला रिपोर्ट वितरण, अपॉइंटमेंट सूचना तथा वैधानिक कर इनवॉइसिंग प्रदान करने हेतु।',
    rightsNotice:
      'डीपीडीपी अधिनियम के अंतर्गत, आपको अपने व्यक्तिगत डेटा का सारांश प्राप्त करने, त्रुटियों को सुधारने और अपनी अनुपस्थिति में किसी प्रतिनिधि को नामित करने का पूर्ण अधिकार है।',
    withdrawalInstructions:
      'आप किसी भी समय व्हाट्सएप, एसएमएस या मरीज पोर्टल के माध्यम से अपनी सहमति वापस ले सकते हैं। सहमति वापसी पूर्व में किए गए वैध डेटा प्रसंस्करण या कर कानूनों द्वारा अनिवार्य रिकॉर्ड को प्रभावित नहीं करेगी।',
    grievanceRedressal: {
      officerTitle: 'डेटा संरक्षण एवं शिकायत निवारण अधिकारी',
      email: 'dpo@aarogyadiagnostics.in',
      turnaroundDays: 30,
    },
    affirmativeStatement:
      'मैं उपरोक्त निर्दिष्ट उद्देश्यों के लिए अपने व्यक्तिगत एवं नैदानिक डेटा को संसाधित करने हेतु अपनी स्वतंत्र, विशिष्ट, सूचित और स्पष्ट सकारात्मक सहमति प्रदान करता/करती हूँ।',
  },

  kn: {
    language: 'kn',
    languageName: 'ಕನ್ನಡ (Kannada)',
    headline: 'ಡಿಜಿಟಲ್ ವೈಯಕ್ತಿಕ ಡೇಟಾ ಸಂರಕ್ಷಣಾ ಕಾಯ್ದೆ, 2023 — ಗೌಪ್ಯತಾ ಸೂಚನೆ ಮತ್ತು ಒಪ್ಪಿಗೆ',
    dataCollected: [
      'ವೈಯಕ್ತಿಕ ಗುರುತು (ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ಇಮೇಲ್)',
      'ವೈದ್ಯಕೀಯ ಮತ್ತು ರೋಗನಿರ್ಣಯ ದಾಖಲೆಗಳು (ದಂತ ಆರೋಗ್ಯ ಇತಿಹಾಸ, ಚಿಕಿತ್ಸಾ ವಿವರಗಳು)',
      'ತೆರಿಗೆ ಇನ್‌ವಾಯ್ಸ್ ಮತ್ತು ಬಿಲ್ಲಿಂಗ್ ದಾಖಲೆಗಳು (ಸಿಜಿಎಸ್‌ಟಿ ಕಾಯ್ದೆ ಸೆಕ್ಷನ್ 36 ರ ಅಡಿಯಲ್ಲಿ)',
    ],
    specifiedPurpose:
      'ದಂತ ಚಿಕಿತ್ಸಾ ಸಲಹೆ, ಲ್ಯಾಬ್ ವರದಿ ವಿತರಣೆ, ನೇಮಕಾತಿ ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಕಾನೂನುಬದ್ಧ ತೆರಿಗೆ ಇನ್ವಾಯ್ಸಿಂಗ್ ಸೌಲಭ್ಯ ಒದಗಿಸಲು.',
    rightsNotice:
      'ಡಿಪಿಡಿಪಿ ಕಾಯ್ದೆಯ ಅಡಿಯಲ್ಲಿ, ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಡೇಟಾದ ಸಾರಾಂಶವನ್ನು ಪಡೆಯಲು, ತಪ್ಪುಗಳನ್ನು ಸರಿಪಡಿಸಲು ಮತ್ತು ಪ್ರತಿನಿಧಿಯನ್ನು ನಾಮನಿರ್ದೇಶನ ಮಾಡಲು ನಿಮಗೆ ಹಕ್ಕಿದೆ.',
    withdrawalInstructions:
      'ನೀವು ಯಾವುದೇ ಸಮಯದಲ್ಲಿ ವಾಟ್ಸಾಪ್, ಎಸ್‌ಎಂಎಸ್ ಅಥವಾ ರೋಗಿ ಪೋರ್ಟಲ್ ಮೂಲಕ ನಿಮ್ಮ ಒಪ್ಪಿಗೆಯನ್ನು ಹಿಂಪಡೆಯಬಹುದು. ಒಪ್ಪಿಗೆ ಹಿಂಪಡೆಯುವಿಕೆಯು ಹಿಂದಿನ ಕಾನೂನುಬದ್ಧ ಪ್ರಕ್ರಿಯೆ ಅಥವಾ ಶಾಸನಬದ್ಧ ತೆರಿಗೆ ದಾಖಲೆಗಳ ಮೇಲೆ ಪರಿಣಾಮ ಬೀರುವುದಿಲ್ಲ.',
    grievanceRedressal: {
      officerTitle: 'ಡೇಟಾ ಸಂರಕ್ಷಣೆ ಮತ್ತು ಕುಂದುಕೊರತೆ ನಿವಾರಣಾಧಿಕಾರಿ',
      email: 'dpo@aarogyadiagnostics.in',
      turnaroundDays: 30,
    },
    affirmativeStatement:
      'ಮೇಲೆ ತಿಳಿಸಲಾದ ನಿರ್ದಿಷ್ಟ ಉದ್ದೇಶಗಳಿಗಾಗಿ ನನ್ನ ವೈಯಕ್ತಿಕ ಮತ್ತು ಆರೋಗ್ಯ ಡೇಟಾವನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ನಾನು ನನ್ನ ಮುಕ್ತ, ನಿರ್ದಿಷ್ಟ, ತಿಳುವಳಿಕೆಯುಳ್ಳ ಮತ್ತು ಸ್ಪಷ್ಟ ಸಕಾರಾತ್ಮಕ ಒಪ್ಪಿಗೆಯನ್ನು ನೀಡುತ್ತೇನೆ.',
  },
};
