import { AuthService } from '../auth.service';
import { AuthRbacRepository } from '../auth-rbac.repository';
import { ClerkJwtService } from '../clerk-jwt.service';
import { UsersService } from '../../users/users.service';
import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClerkAuthGuard } from '../guards/clerk-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

describe('Authentication after removing database RBAC', () => {
  const clerk = { verifyToken: jest.fn() };
  const users = { findAuthenticatedByClerkId: jest.fn() };
  const repository = {
    findAssignedBranchIds: jest.fn(),
    findDevelopmentUser: jest.fn(),
  };
  const settings: Record<string, string | undefined> = {};
  const config = {
    get: (key: string) => settings[key],
    set: (key: string, value: string | undefined) => {
      settings[key] = value;
    },
  };
  const service = new AuthService(
    clerk as unknown as ClerkJwtService,
    users as unknown as UsersService,
    repository as unknown as AuthRbacRepository,
    config as unknown as ConfigService,
  );
  beforeEach(() => {
    jest.resetAllMocks();
    config.set('AUTH_DISABLED', 'false');
    config.set('AUTH_DEV_USER_ID', undefined);
    clerk.verifyToken.mockResolvedValue({ sub: 'user_test' });
    users.findAuthenticatedByClerkId.mockResolvedValue({
      id: 7,
      business_id: 10,
      status: 'ACTIVE',
      role: 'SUPERADMIN',
    });
    repository.findAssignedBranchIds.mockResolvedValue([20]);
  });

  it('does not infer elevated access from the free-form role field', async () => {
    const auth = await service.authenticate('Bearer token');
    expect(auth.authorization).toMatchObject({
      businessId: 10,
      branchIds: [20],
      permissions: {},
      isSuperadmin: false,
    });
    expect(repository.findAssignedBranchIds).toHaveBeenCalledWith(7, 10);
  });

  it('rejects inactive users', async () => {
    users.findAuthenticatedByClerkId.mockResolvedValue({
      id: 7,
      business_id: 10,
      status: 'INACTIVE',
    });
    await expect(service.authenticate('Bearer token')).rejects.toThrow(
      'User is not registered',
    );
    expect(repository.findAssignedBranchIds).not.toHaveBeenCalled();
  });

  it('uses a real tenant user without contacting Clerk when disabled', async () => {
    config.set('AUTH_DISABLED', 'true');
    repository.findDevelopmentUser.mockResolvedValue({
      id: 7,
      business_id: 10,
      status: 'ACTIVE',
      clerk_id: null,
    });
    const auth = await service.authenticate(undefined);
    expect(auth.authorization).toMatchObject({
      businessId: 10,
      isSuperadmin: false,
      permissions: { 'stock.manage': 'business' },
    });
    expect(repository.findDevelopmentUser).toHaveBeenCalledWith(undefined);
    expect(clerk.verifyToken).not.toHaveBeenCalled();
    expect(users.findAuthenticatedByClerkId).not.toHaveBeenCalled();
  });

  it('uses the configured user and fails when no active user is available', async () => {
    config.set('AUTH_DISABLED', 'true');
    config.set('AUTH_DEV_USER_ID', '9');
    repository.findDevelopmentUser.mockResolvedValue(null);
    await expect(service.authenticate(undefined)).rejects.toThrow(
      'Token-free mode requires an active app_user',
    );
    expect(repository.findDevelopmentUser).toHaveBeenCalledWith(9);
  });

  it('requires a token again when reenabled', async () => {
    await expect(service.authenticate(undefined)).rejects.toThrow(
      'Authorization bearer token is required',
    );
    expect(repository.findDevelopmentUser).not.toHaveBeenCalled();
  });

  it('does not disable authentication when the setting is absent', async () => {
    config.set('AUTH_DISABLED', undefined);
    await expect(service.authenticate(undefined)).rejects.toThrow(
      'Authorization bearer token is required',
    );
    expect(repository.findDevelopmentUser).not.toHaveBeenCalled();
  });

  it('allows requests without a header while still rejecting cross-tenant hints', async () => {
    config.set('AUTH_DISABLED', 'true');
    repository.findDevelopmentUser.mockResolvedValue({
      id: 7,
      business_id: 10,
      status: 'ACTIVE',
      clerk_id: null,
    });
    const request = {
      headers: {},
      params: {},
      query: {},
      body: {},
      path: '/products',
    } as AuthenticatedRequest;
    const context = {
      getHandler: () => AuthService.prototype.authenticate,
      getClass: () => AuthService,
      switchToHttp: () => ({ getRequest: () => request }),
    } as unknown as ExecutionContext;
    const reflector = new Reflector();
    await expect(
      new ClerkAuthGuard(service, reflector).canActivate(context),
    ).resolves.toBe(true);
    const permissionGuard = new PermissionGuard(reflector);
    expect(permissionGuard.canActivate(context)).toBe(true);
    request.query = { businessId: '11' };
    expect(() => permissionGuard.canActivate(context)).toThrow(
      'Cannot access another business',
    );
  });
});
