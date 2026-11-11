import { User } from '../../users/entities/user.entity';

export type UserStatus = 'active' | 'inactive';

export interface AuthRoleSummary {
  id: number;
  name: string;
  status: string;
}

export interface AuthAuthorizationContext {
  userId: number;
  businessId: number | null;
  branchIds: number[];
  roles: AuthRoleSummary[];
}

export interface ClerkJwtPayload {
  sub: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  [claim: string]: unknown;
}

export interface AuthUser {
  clerkId: string;
  claims: ClerkJwtPayload;
  user: User;
  authorization: AuthAuthorizationContext;
}
