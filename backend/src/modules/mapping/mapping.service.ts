import { prisma } from '../../lib/prisma';
import { recordAuditEvent } from '../audit/audit.service';
import {
  CreateActivityInput,
  CreateDataFlowInput,
  CreateRecipientInput,
  CreateRetentionInput,
} from './mapping.schema';

export async function createProcessingActivity(
  tenantId: string,
  userId: string,
  input: CreateActivityInput,
  ipAddress?: string,
  userAgent?: string
) {
  // 1. If sourceId is provided, look up findings beforehand to minimize transaction lock time
  const elementsToInsert: Array<{
    activityId?: string;
    piiCategory: string;
    dataSubjects: string;
    volumeEstimate: string;
  }> = [];

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
      elementsToInsert.push({
        piiCategory: elemInput.piiCategory,
        dataSubjects: elemInput.dataSubjects || 'Customers / Patients',
        volumeEstimate: elemInput.volumeEstimate || 'N/A',
      });
    }
  }

  return await prisma.$transaction(async (tx) => {
    // 2. Create Processing Activity
    const activity = await tx.processingActivity.create({
      data: {
        tenantId,
        name: input.name.trim(),
        businessFunction: input.businessFunction.trim(),
        legalBasis: input.legalBasis,
        status: 'ACTIVE',
      },
    });

    // 3. Batch insert data elements in 1 single SQL query
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

    const createdElements = await tx.dataElement.findMany({
      where: { activityId: activity.activityId },
    });

    // 4. Record Audit Event
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
        elementsCount: createdElements.length,
      },
      ipAddress,
      userAgent,
    });

    return {
      activity,
      dataElements: createdElements,
    };
  }, {
    maxWait: 15000,
    timeout: 30000,
  });
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
 * Connecting: Data Sources -> Data Elements -> Processing Activities -> Systems & Recipient Services
 */
export async function getRelationshipGraph(tenantId: string) {
  const [sources, activities] = await Promise.all([
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
        dataElements: true,
        dataFlows: true,
        thirdPartyRecipients: true,
      },
    }),
  ]);

  const nodes: any[] = [];
  const edges: any[] = [];

  // 1. Data Source Nodes (Left column)
  sources.forEach((src, idx) => {
    const sourceNodeId = `source-${src.sourceId}`;
    nodes.push({
      id: sourceNodeId,
      type: 'dataSourceNode',
      data: {
        label: src.name,
        sourceType: src.sourceType,
        status: src.status,
      },
      position: { x: 50, y: 100 + idx * 140 },
    });
  });

  // 2. Processing Activity Nodes (Middle column)
  activities.forEach((act, idx) => {
    const actNodeId = `activity-${act.activityId}`;
    nodes.push({
      id: actNodeId,
      type: 'activityNode',
      data: {
        label: act.name,
        businessFunction: act.businessFunction,
        legalBasis: act.legalBasis,
      },
      position: { x: 450, y: 80 + idx * 180 },
    });

    // 3. Data Elements (attached to activity)
    act.dataElements.forEach((elem, elemIdx) => {
      const elemNodeId = `elem-${elem.elementId}`;
      nodes.push({
        id: elemNodeId,
        type: 'dataElementNode',
        data: {
          label: elem.piiCategory,
          dataSubjects: elem.dataSubjects,
        },
        position: { x: 260, y: 60 + idx * 180 + elemIdx * 50 },
      });

      // Edge from Element to Activity
      edges.push({
        id: `edge-${elemNodeId}-${actNodeId}`,
        source: elemNodeId,
        target: actNodeId,
        animated: true,
      });
    });

    // 4. Data Flow Systems & Recipients (Right column)
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
        position: { x: 800, y: 60 + idx * 180 + flowIdx * 65 },
      });

      // Edge from Activity to Flow System
      edges.push({
        id: `edge-${actNodeId}-${flowNodeId}`,
        source: actNodeId,
        target: flowNodeId,
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
        position: { x: 800, y: 150 + idx * 180 + recIdx * 65 },
      });

      edges.push({
        id: `edge-${actNodeId}-${recNodeId}`,
        source: actNodeId,
        target: recNodeId,
      });
    });
  });

  return { nodes, edges };
}
