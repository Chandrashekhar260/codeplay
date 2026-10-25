import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { hashPassword, comparePassword } from '../../lib/password';
import { signToken } from '../../lib/jwt';
import { RegisterInput, LoginInput } from './auth.schema';
import { recordAuditEvent } from '../audit/audit.service';

export async function register(input: RegisterInput, ipAddress?: string, userAgent?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (existingUser) {
    const error: any = new Error('An account with this email address already exists');
    error.status = 409;
    error.code = 'EMAIL_ALREADY_EXISTS';
    throw error;
  }

  const hashedPassword = await hashPassword(input.password);

  // Execute multi-entity creation in atomic transaction
  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Create Workspace / Tenant
    const tenant = await tx.tenant.create({
      data: {
        name: input.tenantName.trim(),
        plan: 'STARTER',
        status: 'ACTIVE',
      },
    });

    // 2. Create Default Roles for this Tenant
    const adminRole = await tx.role.create({
      data: {
        tenantId: tenant.id,
        roleCode: 'ADMIN',
        name: 'Workspace Administrator',
        isSystem: true,
      },
    });

    await tx.role.createMany({
      data: [
        {
          tenantId: tenant.id,
          roleCode: 'COMPLIANCE_OFFICER',
          name: 'Data Protection Officer / Compliance Admin',
          isSystem: true,
        },
        {
          tenantId: tenant.id,
          roleCode: 'VIEWER',
          name: 'Read-only Auditor',
          isSystem: true,
        },
      ],
    });

    // 3. Create User
    const user = await tx.user.create({
      data: {
        tenantId: tenant.id,
        email: input.email.toLowerCase().trim(),
        passwordHash: hashedPassword,
        firstName: input.firstName.trim(),
        lastName: input.lastName ? input.lastName.trim() : null,
        isPlatformAdmin: false,
      },
    });

    // 4. Assign Admin Role
    await tx.userRole.create({
      data: {
        tenantId: tenant.id,
        userId: user.id,
        roleCode: adminRole.roleCode,
      },
    });

    return { tenant, user };
  });

  // 5. Record Audit Event
  await recordAuditEvent({
    tenantId: result.tenant.id,
    actorId: result.user.id,
    action: 'AUTH_REGISTER',
    resourceType: 'TENANT',
    resourceId: result.tenant.id,
    diffJson: { tenantName: result.tenant.name, email: result.user.email },
    ipAddress,
    userAgent,
  });

  // 6. Generate JWT
  const token = signToken({
    userId: result.user.id,
    tenantId: result.tenant.id,
    email: result.user.email,
    isPlatformAdmin: result.user.isPlatformAdmin,
  });

  return {
    token,
    user: {
      id: result.user.id,
      email: result.user.email,
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      role: 'ADMIN',
    },
    tenant: {
      id: result.tenant.id,
      name: result.tenant.name,
      plan: result.tenant.plan,
      status: result.tenant.status,
    },
  };
}

export async function login(input: LoginInput, ipAddress?: string, userAgent?: string) {
  const user = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
    include: {
      tenant: true,
      userRoles: true,
    },
  });

  if (!user) {
    const error: any = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (user.tenant.status === 'SUSPENDED' || user.tenant.status === 'DEACTIVATED') {
    const error: any = new Error('This business workspace has been suspended. Please contact support.');
    error.status = 403;
    error.code = 'TENANT_SUSPENDED';
    throw error;
  }

  const isPasswordValid = await comparePassword(input.password, user.passwordHash);
  if (!isPasswordValid) {
    const error: any = new Error('Invalid email or password');
    error.status = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  // Record Audit Event
  await recordAuditEvent({
    tenantId: user.tenantId,
    actorId: user.id,
    action: 'AUTH_LOGIN',
    resourceType: 'USER',
    resourceId: user.id,
    ipAddress,
    userAgent,
  });

  const token = signToken({
    userId: user.id,
    tenantId: user.tenantId,
    email: user.email,
    isPlatformAdmin: user.isPlatformAdmin,
  });

  const primaryRole = user.userRoles[0]?.roleCode || 'USER';

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: primaryRole,
      isPlatformAdmin: user.isPlatformAdmin,
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      plan: user.tenant.plan,
      status: user.tenant.status,
    },
  };
}

export async function getCurrentUser(userId: string, tenantId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      tenantId: tenantId, // Strict tenant isolation check
    },
    include: {
      tenant: true,
      userRoles: true,
    },
  });

  if (!user) {
    const error: any = new Error('User not found');
    error.status = 404;
    error.code = 'NOT_FOUND';
    throw error;
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.userRoles[0]?.roleCode || 'USER',
      isPlatformAdmin: user.isPlatformAdmin,
    },
    tenant: {
      id: user.tenant.id,
      name: user.tenant.name,
      plan: user.tenant.plan,
      status: user.tenant.status,
    },
  };
}
