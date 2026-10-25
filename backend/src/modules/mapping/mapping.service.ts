import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';
import {
  CreateActivityInput,
  CreateDataFlowInput,
  CreateRecipientInput,
  CreateRetentionInput,
} from './mapping.schema';
import { calculateDpdpRetention } from './dpdpRetention';

export interface RetentionRecommendationInput {
  sourceId?: string;
  businessFunction?: string;
  purpose?: string;
  piiCategories?: string[];
}

/**
 * Recommends statutory DPDP retention duration by inspecting linked source scan findings
 * or direct PII categories and business purpose.
 */
export async function getRetentionRecommendation(
  tenantId: string,
  input: RetentionRecommendationInput
) {
  const piiCategoriesSet = new Set<string>(input.piiCategories || []);

  if (input.sourceId) {
    const latestJob = await prisma.scanJob.findFirst({
      where: { sourceId: input.sourceId, tenantId },
      orderBy: { startedAt: 'desc' },
      include: { scanFindings: true },
    });

    if (latestJob && latestJob.scanFindings.length > 0) {
      for (const finding of latestJob.scanFindings) {
        piiCategoriesSet.add(finding.piiCategories);
      }
    }
  }

  const piiCategories = Array.from(piiCategoriesSet);
  const recommendation = calculateDpdpRetention(
    piiCategories,
    input.businessFunction,
    input.purpose
  );

  return {
    ...recommendation,
    detectedPiiCategories: piiCategories,
  };
}

export async function createProcessingActivity(
  tenantId: string,
  userId: string,
  input: CreateActivityInput,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. If sourceId is provided, look up findings beforehand to auto-import PII categories
  const elementsToInsert: Array<{
    activityId?: string;
    piiCategory: string;
    dataSubjects: string;
    volumeEstimate: string;
  }> = [];

  const detectedCategories: string[] = [];

  if (input.sourceId) {
    const latestJob = await prisma.scanJob.findFirst({
      where: { sourceId: input.sourceId, tenantId },
      orderBy: { startedAt: 'desc' },
      include: { scanFindings: true },
    });

    if (latestJob && latestJob.scanFindings.length > 0) {
      const uniqueCategories = new Set<string>();
      for (const finding of latestJob.scanFindings) {
        uniqueCategories.add(finding.piiCategories);
      }

      for (const category of uniqueCategories) {
        detectedCategories.push(category);
        elementsToInsert.push({
          piiCategory: category,
          dataSubjects: 'Patients / Customers',
          volumeEstimate: `${latestJob.scanFindings.length} records detected`,
        });
      }
    }
  }

  if (input.dataElements && input.dataElements.length > 0) {
    for (const elemInput of input.dataElements) {
      detectedCategories.push(elemInput.piiCategory);
      elementsToInsert.push({
        piiCategory: elemInput.piiCategory,
        dataSubjects: elemInput.dataSubjects || 'Customers / Patients',
        volumeEstimate: elemInput.volumeEstimate || 'N/A',
      });
    }
  }

  // 2. Calculate DPDP statutory retention
  const dpdpStatutory = calculateDpdpRetention(
    detectedCategories,
    input.businessFunction,
    input.purpose
  );

  const retentionMonths =
    input.retentionMonths ||
    (input.retentionDays ? Math.round(input.retentionDays / 30) : dpdpStatutory.retentionPeriodMonths);
  const retentionDays = input.retentionDays || retentionMonths * 30;
  const triggerEvent = input.triggerEvent || dpdpStatutory.triggerEvent;

  return await prisma.$transaction(
    async (tx) => {
      // 3. Create Processing Activity with purpose, retentionDays, and sourceId
      const activity = await tx.processingActivity.create({
        data: {
          tenantId,
          name: input.name.trim(),
          businessFunction: input.businessFunction.trim(),
          legalBasis: input.legalBasis,
          purpose: input.purpose ? input.purpose.trim() : null,
          retentionDays,
          sourceId: input.sourceId || null,
          status: 'ACTIVE',
        },
      });

      // 4. Automatically create statutory Retention Policy
      await tx.retentionPolicy.create({
        data: {
          activityId: activity.activityId,
          retentionPeriodMonths: retentionMonths,
          triggerEvent,
        },
      });

      // 5. Batch insert data elements in 1 single SQL query
      if (elementsToInsert.length > 0) {
        await tx.dataElement.createMany({
          data: elementsToInsert.map((e) => ({
            activityId: activity.activityId,
            piiCategory: e.piiCategory,
            dataSubjects: e.dataSubjects,
            volumeEstimate: e.volumeEstimate,
          })),
        });
      }

      const [createdElements, retentionPolicies] = await Promise.all([
        tx.dataElement.findMany({
          where: { activityId: activity.activityId },
        }),
        tx.retentionPolicy.findMany({
          where: { activityId: activity.activityId },
        }),
      ]);

      // 6. Record Audit Event
      await recordAuditEvent({
        tenantId,
        actorId: userId,
        action: 'ROPA_ACTIVITY_CREATED',
        resourceType: 'PROCESSING_ACTIVITY',
        resourceId: activity.activityId,
        diffJson: {
          name: activity.name,
          businessFunction: activity.businessFunction,
          legalBasis: activity.legalBasis,
          purpose: activity.purpose,
          sourceId: activity.sourceId,
          retentionMonths,
          retentionTrigger: triggerEvent,
          statutoryReference: dpdpStatutory.statutoryReference,
          elementsCount: createdElements.length,
        },
        ipAddress,
        userAgent,
      });

      return {
        activity,
        dataElements: createdElements,
        retentionPolicies,
        dpdpGuideline: dpdpStatutory,
      };
    },
    {
      maxWait: 15000,
      timeout: 30000,
    }
  );
}

export async function addDataFlow(
  tenantId: string,
  activityId: string,
  input: CreateDataFlowInput
) {
  const activity = await prisma.processingActivity.findFirst({
    where: { activityId, tenantId },
  });

  if (!activity) {
    const error: any = new Error('Processing activity not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.dataFlow.create({
    data: {
      activityId,
      flowStage: input.flowStage,
      systemName: input.systemName.trim(),
      location: input.location || 'India',
      safeguards: input.safeguards || null,
    },
  });
}

export async function addRecipient(
  tenantId: string,
  activityId: string,
  input: CreateRecipientInput
) {
  const activity = await prisma.processingActivity.findFirst({
    where: { activityId, tenantId },
  });

  if (!activity) {
    const error: any = new Error('Processing activity not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.thirdPartyRecipient.create({
    data: {
      activityId,
      name: input.name.trim(),
      recipientType: input.recipientType,
      country: input.country || 'India',
    },
  });
}

export async function addRetentionPolicy(
  tenantId: string,
  activityId: string,
  input: CreateRetentionInput
) {
  const activity = await prisma.processingActivity.findFirst({
    where: { activityId, tenantId },
  });

  if (!activity) {
    const error: any = new Error('Processing activity not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return prisma.retentionPolicy.create({
    data: {
      activityId,
      retentionPeriodMonths: input.retentionPeriodMonths,
      triggerEvent: input.triggerEvent,
    },
  });
}

export async function listActivities(tenantId: string) {
  return prisma.processingActivity.findMany({
    where: { tenantId },
    include: {
      source: true,
      dataElements: true,
      dataFlows: true,
      thirdPartyRecipients: true,
      retentionPolicies: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getActivity(tenantId: string, activityId: string) {
  const activity = await prisma.processingActivity.findFirst({
    where: { activityId, tenantId },
    include: {
      source: true,
      dataElements: true,
      dataFlows: true,
      thirdPartyRecipients: true,
      retentionPolicies: true,
    },
  });

  if (!activity) {
    const error: any = new Error('Processing activity not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return activity;
}

/**
 * Builds Nodes and Edges for the React Flow relationship graph
 * Connecting:
 * [Data Source] ──► [Data Elements] ──► [Processing Activity (Purpose & DPDP Retention)] ──► [Systems / 3rd Party Recipients]
 */
export async function getRelationshipGraph(tenantId: string) {
  const [sources, activities, pendingDsrs] = await Promise.all([
    prisma.dataSource.findMany({
      where: { tenantId },
      include: {
        scanJobs: {
          orderBy: { startedAt: 'desc' },
          take: 1,
          include: { scanFindings: true },
        },
      },
    }),
    prisma.processingActivity.findMany({
      where: { tenantId },
      include: {
        source: true,
        dataElements: true,
        dataFlows: true,
        thirdPartyRecipients: true,
        retentionPolicies: true,
      },
    }),
    prisma.dsrRequest.findMany({
      where: {
        tenantId,
        status: { in: ['SUBMITTED', 'IN_REVIEW'] },
      },
    }),
  ]);

  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Data Source Nodes (Left column: x = 50)
  sources.forEach((src, idx) => {
    const sourceNodeId = `source-${src.sourceId}`;
    
    // Check if any active DSR request touches an activity linked to this source
    const touchingDsrs = pendingDsrs.filter((d) => {
      const matchedAct = activities.find((a) => a.activityId === d.affectedActivityId);
      return matchedAct?.sourceId === src.sourceId;
    });

    nodes.push({
      id: sourceNodeId,
      type: 'dataSourceNode',
      data: {
        label: src.name,
        sourceType: src.sourceType,
        status: src.status,
        findingsCount: src.scanJobs[0]?.findingsCount || 0,
        dsrAlert: touchingDsrs.length > 0 ? {
          hasPending: true,
          count: touchingDsrs.length,
          types: Array.from(new Set(touchingDsrs.map((t) => t.requestType))),
          message: `${touchingDsrs.length} Active DSR Action(s) required on this Data Source`,
        } : null,
      },
      position: { x: 50, y: 100 + idx * 180 },
    });
  });

  // 2. Processing Activity Nodes, Data Elements, Systems & Recipients
  activities.forEach((act, idx) => {
    const actNodeId = `activity-${act.activityId}`;
    const retention = act.retentionPolicies[0];
    const retentionMonths =
      retention?.retentionPeriodMonths ||
      (act.retentionDays ? Math.round(act.retentionDays / 30) : 24);

    // Compute statutory guideline reference
    const piiCategories = act.dataElements.map((e) => e.piiCategory);
    const statutoryGuideline = calculateDpdpRetention(
      piiCategories,
      act.businessFunction,
      act.purpose || ''
    );

    // Check if this specific activity has pending DSR requests
    const actDsrs = pendingDsrs.filter((d) => d.affectedActivityId === act.activityId);
    const hasCorrection = actDsrs.some((d) => d.requestType === 'CORRECTION');
    const hasErasure = actDsrs.some((d) => d.requestType === 'ERASURE');
    const hasAccess = actDsrs.some((d) => d.requestType === 'ACCESS');

    nodes.push({
      id: actNodeId,
      type: 'activityNode',
      data: {
        label: act.name,
        businessFunction: act.businessFunction,
        legalBasis: act.legalBasis,
        purpose: act.purpose || 'General business processing',
        retentionMonths,
        retentionTrigger: retention?.triggerEvent || statutoryGuideline.triggerEvent,
        statutoryReference: statutoryGuideline.statutoryReference,
        sourceName: act.source?.name,
        dsrAlert: actDsrs.length > 0 ? {
          hasPending: true,
          count: actDsrs.length,
          hasCorrection,
          hasErasure,
          hasAccess,
          primaryType: hasCorrection ? 'CORRECTION' : hasErasure ? 'ERASURE' : 'ACCESS',
          label: hasCorrection
            ? '⭐ Correction Required'
            : hasErasure
            ? '⭐ Erasure Required'
            : '⭐ Access Requested',
          requests: actDsrs.map((r) => ({
            id: r.requestId,
            userRef: r.userRef,
            type: r.requestType,
            field: r.fieldToCorrect,
            value: r.correctedValue,
          })),
        } : null,
      },
      position: { x: 500, y: 80 + idx * 220 },
    });

    // 3. Data Elements (positioned between Data Source and Activity: x = 280)
    if (act.dataElements.length > 0) {
      act.dataElements.forEach((elem, elemIdx) => {
        const elemNodeId = `elem-${elem.elementId}`;
        nodes.push({
          id: elemNodeId,
          type: 'dataElementNode',
          data: {
            label: elem.piiCategory,
            dataSubjects: elem.dataSubjects,
            volume: elem.volumeEstimate,
          },
          position: { x: 280, y: 60 + idx * 220 + elemIdx * 65 },
        });

        // Edge 1: If activity is linked to a Data Source, draw edge from Source -> Data Element
        if (act.sourceId) {
          edges.push({
            id: `edge-source-${act.sourceId}-elem-${elem.elementId}`,
            source: `source-${act.sourceId}`,
            target: elemNodeId,
            animated: true,
            style: { stroke: '#3b82f6', strokeWidth: 2 },
          });
        }

        // Edge 2: Data Element -> Processing Activity
        edges.push({
          id: `edge-${elemNodeId}-${actNodeId}`,
          source: elemNodeId,
          target: actNodeId,
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
        });
      });
    } else if (act.sourceId) {
      // Direct edge from Source -> Activity if no individual elements
      edges.push({
        id: `edge-source-${act.sourceId}-${actNodeId}`,
        source: `source-${act.sourceId}`,
        target: actNodeId,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
      });
    }

    // 4. Data Flow Systems & 3rd Party Recipients (Right column: x = 900)
    act.dataFlows.forEach((flow, flowIdx) => {
      const flowNodeId = `flow-${flow.flowId}`;
      nodes.push({
        id: flowNodeId,
        type: 'systemNode',
        data: {
          label: flow.systemName,
          stage: flow.flowStage,
          location: flow.location,
        },
        position: { x: 900, y: 60 + idx * 220 + flowIdx * 70 },
      });

      // Edge from Activity -> Flow System
      edges.push({
        id: `edge-${actNodeId}-${flowNodeId}`,
        source: actNodeId,
        target: flowNodeId,
        style: { stroke: '#10b981', strokeWidth: 1.5 },
      });
    });

    act.thirdPartyRecipients.forEach((rec, recIdx) => {
      const recNodeId = `rec-${rec.recipientId}`;
      nodes.push({
        id: recNodeId,
        type: 'recipientNode',
        data: {
          label: rec.name,
          type: rec.recipientType,
          country: rec.country,
        },
        position: { x: 900, y: 150 + idx * 220 + recIdx * 70 },
      });

      // Edge from Activity -> Recipient
      edges.push({
        id: `edge-${actNodeId}-${recNodeId}`,
        source: actNodeId,
        target: recNodeId,
        style: { stroke: '#f59e0b', strokeWidth: 1.5 },
      });
    });
  });

  return { nodes, edges };
}
