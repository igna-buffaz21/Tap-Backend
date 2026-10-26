import { SetMetadata } from '@nestjs/common';

export const REQUIRED_PERMISSION_KEY = 'requiredPermission';
export const SKIP_PERMISSION_CHECK_KEY = 'skipPermissionCheck';
export const SUPERADMIN_ONLY_KEY = 'superadminOnly';

export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permission);

export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata(REQUIRED_PERMISSION_KEY, permissions);

export const SkipPermissionCheck = () =>
  SetMetadata(SKIP_PERMISSION_CHECK_KEY, true);

export const SuperadminOnly = () => SetMetadata(SUPERADMIN_ONLY_KEY, true);
