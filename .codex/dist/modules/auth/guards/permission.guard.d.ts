import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
export declare class PermissionGuard implements CanActivate {
    private readonly reflector;
    constructor(reflector: Reflector);
    canActivate(context: ExecutionContext): boolean;
    private isPublic;
    private shouldSkipPermissionCheck;
    private isSuperadminOnly;
    private resolveRequiredPermissions;
    private resolvePermissionGrant;
    private validateTenantHints;
    private validateScopeHints;
    private validateBranchHints;
    private validateOwnHints;
    private hasAtLeastScope;
    private collectValues;
    private getFirstPathSegment;
    private parsePositiveInteger;
}
