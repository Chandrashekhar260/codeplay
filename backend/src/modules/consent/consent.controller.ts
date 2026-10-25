import { Request, Response } from 'express';
import * as consentService from './consent.service';

export async function createPurposeHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || req.user?.id || 'system-user';
    const { name, legalBasis, version, description } = req.body;

    if (!name || typeof name !== 'string') {
      res.status(400).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Field "name" is required for processing purpose.' },
      });
      return;
    }

    const purpose = await consentService.createPurpose(
      tenantId,
      userId,
      { name, legalBasis, version, description },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: purpose,
      message: 'Processing purpose registered successfully under DPDP Act.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'PURPOSE_CREATION_FAILED', message: err.message },
    });
  }
}

export async function getPurposesHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const purposes = await consentService.getPurposes(tenantId);

    res.status(200).json({
      success: true,
      data: {
        purposes,
        total: purposes.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_PURPOSES_FAILED', message: err.message },
    });
  }
}

export async function recordConsentHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || req.user?.id || 'system-user';
    const { userRef, purposeId, channel, noticeLanguage, affirmativeCheck } = req.body;

    if (!userRef || !purposeId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Fields "userRef" and "purposeId" are required.' },
      });
      return;
    }

    if (affirmativeCheck !== true) {
      res.status(400).json({
        success: false,
        error: {
          code: 'DPDP_SEC_6_VIOLATION',
          message:
            'DPDP Act Section 6 mandates clear affirmative action. Silence, pre-ticked checkboxes, or inaction do not constitute consent.',
        },
      });
      return;
    }

    const consentRecord = await consentService.recordConsent(
      tenantId,
      userId,
      { userRef, purposeId, channel, noticeLanguage, affirmativeCheck },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: consentRecord,
      message: 'Affirmative consent recorded successfully in compliance ledger.',
    });
  } catch (err: any) {
    const isClientErr = err.message.includes('NOT_FOUND') || err.message.includes('VIOLATION');
    res.status(isClientErr ? 400 : 500).json({
      success: false,
      error: { code: 'RECORD_CONSENT_FAILED', message: err.message },
    });
  }
}

export async function withdrawConsentHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || req.user?.id || 'system-user';
    const { userRef, purposeId, reason } = req.body;

    if (!userRef || !purposeId) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Fields "userRef" and "purposeId" are required.' },
      });
      return;
    }

    const updatedRecord = await consentService.withdrawConsent(
      tenantId,
      userId,
      { userRef, purposeId, reason },
      req.ip,
      req.headers['user-agent']
    );

    res.status(200).json({
      success: true,
      data: updatedRecord,
      message: 'Consent withdrawn successfully in accordance with DPDP Act Section 6(4).',
    });
  } catch (err: any) {
    const isClientErr = err.message.includes('NOT_FOUND');
    res.status(isClientErr ? 404 : 500).json({
      success: false,
      error: { code: 'WITHDRAW_CONSENT_FAILED', message: err.message },
    });
  }
}

export async function getUserLedgerHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { userRef } = req.params;

    if (!userRef) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_USER_REF', message: 'Param userRef is required.' },
      });
      return;
    }

    const records = await consentService.getUserConsentLedger(tenantId, userRef);

    res.status(200).json({
      success: true,
      data: {
        userRef,
        records,
        total: records.length,
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_LEDGER_FAILED', message: err.message },
    });
  }
}

export async function createCollectionPointHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || req.user?.id || 'system-user';
    const { name, orgId, widgetConfig } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_NAME', message: 'Field "name" is required for Collection Point.' },
      });
      return;
    }

    const cp = await consentService.createCollectionPoint(
      tenantId,
      userId,
      { name, orgId, widgetConfig },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: cp,
      message: 'Collection point created successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_COLLECTION_POINT_FAILED', message: err.message },
    });
  }
}

export async function getCollectionPointsHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const points = await consentService.getCollectionPoints(tenantId);

    res.status(200).json({
      success: true,
      data: { collectionPoints: points, total: points.length },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'FETCH_POINTS_FAILED', message: err.message },
    });
  }
}

export async function createPreferenceCentreHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const userId = req.user?.userId || req.user?.id || 'system-user';
    const { name, slug, configJson } = req.body;

    if (!name || !slug) {
      res.status(400).json({
        success: false,
        error: { code: 'MISSING_FIELDS', message: 'Fields "name" and "slug" are required.' },
      });
      return;
    }

    const pc = await consentService.createPreferenceCentre(
      tenantId,
      userId,
      { name, slug, configJson },
      req.ip,
      req.headers['user-agent']
    );

    res.status(201).json({
      success: true,
      data: pc,
      message: 'Preference Centre created successfully.',
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'CREATE_PREFERENCE_CENTRE_FAILED', message: err.message },
    });
  }
}

export async function getPreferenceCentreHandler(req: Request, res: Response) {
  try {
    const tenantId = req.tenantId!;
    const { slug } = req.params;

    const pc = await consentService.getPreferenceCentreBySlug(tenantId, slug);

    res.status(200).json({
      success: true,
      data: pc,
    });
  } catch (err: any) {
    const isNotFound = err.message.includes('NOT_FOUND');
    res.status(isNotFound ? 404 : 500).json({
      success: false,
      error: { code: 'PREFERENCE_CENTRE_FAILED', message: err.message },
    });
  }
}

export function getStatutoryNoticeHandler(req: Request, res: Response) {
  const lang = (req.query.lang as 'en' | 'hi' | 'kn') || 'en';
  const notice = consentService.getStatutoryNotice(lang);

  res.status(200).json({
    success: true,
    data: notice,
    availableLanguages: ['en', 'hi', 'kn'],
  });
}
