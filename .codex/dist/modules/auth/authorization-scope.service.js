"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthorizationScopeService = void 0;
const common_1 = require("@nestjs/common");
const ACCESS_SCOPE_WEIGHT = {
    own: 1,
    branch: 2,
    business: 3,
};
let AuthorizationScopeService = class AuthorizationScopeService {
    requireAuthorization(currentUser) {
        if (!currentUser.authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        return currentUser.authorization;
    }
    isSuperadmin(currentUser) {
        return this.requireAuthorization(currentUser).isSuperadmin;
    }
    resolveBusinessId(currentUser, requestedBusinessId) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return this.parsePositiveInteger(requestedBusinessId, 'businessId');
        }
        if (authorization.businessId === null) {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        if (requestedBusinessId !== undefined) {
            const parsedBusinessId = this.parsePositiveInteger(requestedBusinessId, 'businessId');
            if (parsedBusinessId !== authorization.businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        return authorization.businessId;
    }
    requirePermission(currentUser, permissionKey) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return {
                key: permissionKey,
                access_scope: 'business',
            };
        }
        const accessScope = authorization.permissions[permissionKey];
        if (!accessScope) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKey}`);
        }
        return {
            key: permissionKey,
            access_scope: accessScope,
        };
    }
    assertCanAccessBranch(currentUser, permissionKey, branchIdValue) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branchId');
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return branchId;
        }
        const permission = this.requirePermission(currentUser, permissionKey);
        if (this.hasAtLeastScope(permission.access_scope, 'business')) {
            return branchId;
        }
        if (!authorization.branchIds.includes(branchId)) {
            throw new common_1.ForbiddenException('Branch is not assigned to user');
        }
        return branchId;
    }
    getAllowedBranchIds(currentUser, permissionKey) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return undefined;
        }
        const permission = this.requirePermission(currentUser, permissionKey);
        if (this.hasAtLeastScope(permission.access_scope, 'business')) {
            return undefined;
        }
        return authorization.branchIds;
    }
    hasOwnScope(currentUser, permissionKey) {
        const authorization = this.requireAuthorization(currentUser);
        if (authorization.isSuperadmin) {
            return false;
        }
        return (this.requirePermission(currentUser, permissionKey).access_scope === 'own');
    }
    hasAtLeastScope(accessScope, minimumScope) {
        return (ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT[minimumScope]);
    }
    parsePositiveInteger(value, field) {
        const parsed = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isInteger(parsed) ||
            parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
    }
};
exports.AuthorizationScopeService = AuthorizationScopeService;
exports.AuthorizationScopeService = AuthorizationScopeService = __decorate([
    (0, common_1.Injectable)()
], AuthorizationScopeService);
//# sourceMappingURL=authorization-scope.service.js.map