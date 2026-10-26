"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const require_permission_decorator_1 = require("../decorators/require-permission.decorator");
const public_decorator_1 = require("../decorators/public.decorator");
const PATH_PERMISSION_MAP = {
    availability: 'booking.manage',
    bookings: 'booking.manage',
    'recurring-bookings': 'booking.manage',
    reminders: 'booking.manage',
    payments: 'booking.manage',
    customers: 'customer.manage',
    services: 'service.manage',
    resources: 'resource.manage',
    'resource-services': 'resource.manage',
    'resource-schedules': 'resource.manage',
    'resource-blocks': 'resource.manage',
    products: 'stock.manage',
    'product-categories': 'stock.manage',
    'product-stocks': 'stock.manage',
    'stock-movements': 'stock.manage',
    branches: 'branch.manage',
    users: 'user.manage',
    'users/:userId/resources': 'resource.manage',
    'users/:userId/roles': 'user.manage',
    roles: 'role.read',
    permissions: 'role.read',
    businesses: 'business.settings',
    'whatsapp-accounts': 'business.settings',
    'whatsapp-conversations': 'booking.manage',
    'whatsapp-messages': 'booking.manage',
    whatsapp: 'booking.manage',
    'ia-service': 'booking.manage',
};
const ACCESS_SCOPE_WEIGHT = {
    own: 1,
    branch: 2,
    business: 3,
};
const BRANCH_HINT_REQUIRED_SEGMENTS = new Set([
    'availability',
    'recurring-bookings',
    'services',
    'resources',
    'resource-services',
    'resource-schedules',
    'resource-blocks',
    'customers',
    'users',
    'products',
    'product-categories',
    'product-stocks',
    'stock-movements',
]);
const SCOPE_HANDLED_BY_SERVICE_SEGMENTS = new Set([
    'availability',
    'branches',
    'bookings',
    'recurring-bookings',
    'reminders',
    'customers',
    'resources',
    'resource-blocks',
    'resource-schedules',
    'resource-services',
    'services',
    'products',
    'product-categories',
    'product-stocks',
    'stock-movements',
    'users',
]);
let PermissionGuard = class PermissionGuard {
    reflector;
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        if (this.isPublic(context) || this.shouldSkipPermissionCheck(context)) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const auth = request.auth;
        if (!auth) {
            throw new common_1.ForbiddenException('Authenticated user is required');
        }
        if (this.isSuperadminOnly(context)) {
            if (!auth.authorization.isSuperadmin) {
                throw new common_1.ForbiddenException('Superadmin role is required');
            }
            return true;
        }
        if (auth.authorization.isSuperadmin) {
            return true;
        }
        const requiredPermissions = this.resolveRequiredPermissions(context, request);
        const permissionGrant = this.resolvePermissionGrant(requiredPermissions, auth.authorization.permissions);
        if (!permissionGrant) {
            throw new common_1.ForbiddenException(`Missing permission ${requiredPermissions.join(' or ')}`);
        }
        this.validateTenantHints(request);
        this.validateScopeHints(request, permissionGrant.accessScope);
        auth.currentPermission = {
            key: permissionGrant.permission,
            access_scope: permissionGrant.accessScope,
        };
        return true;
    }
    isPublic(context) {
        return Boolean(this.reflector.getAllAndOverride(public_decorator_1.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]));
    }
    shouldSkipPermissionCheck(context) {
        return Boolean(this.reflector.getAllAndOverride(require_permission_decorator_1.SKIP_PERMISSION_CHECK_KEY, [
            context.getHandler(),
            context.getClass(),
        ]));
    }
    isSuperadminOnly(context) {
        return Boolean(this.reflector.getAllAndOverride(require_permission_decorator_1.SUPERADMIN_ONLY_KEY, [
            context.getHandler(),
            context.getClass(),
        ]));
    }
    resolveRequiredPermissions(context, request) {
        const explicitPermission = this.reflector.getAllAndOverride(require_permission_decorator_1.REQUIRED_PERMISSION_KEY, [context.getHandler(), context.getClass()]);
        if (explicitPermission) {
            return Array.isArray(explicitPermission)
                ? explicitPermission
                : [explicitPermission];
        }
        const firstSegment = this.getFirstPathSegment(request);
        const mappedPermission = firstSegment
            ? PATH_PERMISSION_MAP[firstSegment]
            : undefined;
        if (!mappedPermission) {
            throw new common_1.ForbiddenException('Permission is not configured for endpoint');
        }
        return [mappedPermission];
    }
    resolvePermissionGrant(requiredPermissions, permissions) {
        for (const permission of requiredPermissions) {
            const accessScope = permissions[permission];
            if (accessScope) {
                return { permission, accessScope };
            }
        }
        return null;
    }
    validateTenantHints(request) {
        const businessId = request.auth?.authorization.businessId;
        if (businessId === null || businessId === undefined) {
            return;
        }
        for (const value of this.collectValues(request, [
            'businessId',
            'business_id',
        ])) {
            if (this.parsePositiveInteger(value) !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
    }
    validateScopeHints(request, accessScope) {
        if (SCOPE_HANDLED_BY_SERVICE_SEGMENTS.has(this.getFirstPathSegment(request) ?? '')) {
            return;
        }
        if (this.hasAtLeastScope(accessScope, 'business')) {
            return;
        }
        if (this.hasAtLeastScope(accessScope, 'branch')) {
            this.validateBranchHints(request, true);
            return;
        }
        this.validateOwnHints(request);
        this.validateBranchHints(request, false);
    }
    validateBranchHints(request, requireHintForBranchOwnedEndpoint) {
        const branchIds = request.auth?.authorization.branchIds ?? [];
        const values = this.collectValues(request, [
            'branchId',
            'branch_id',
            'branchIds',
            'branch_ids',
        ]);
        if (requireHintForBranchOwnedEndpoint &&
            values.length === 0 &&
            BRANCH_HINT_REQUIRED_SEGMENTS.has(this.getFirstPathSegment(request) ?? '')) {
            throw new common_1.ForbiddenException('Branch scope requires branchId');
        }
        for (const value of values) {
            const branchId = this.parsePositiveInteger(value);
            if (!branchIds.includes(branchId)) {
                throw new common_1.ForbiddenException('Branch is not assigned to user');
            }
        }
    }
    validateOwnHints(request) {
        const userId = request.auth?.authorization.userId;
        const values = this.collectValues(request, [
            'userId',
            'user_id',
            'assignedUserId',
            'assigned_user_id',
            'createdByUserId',
            'created_by_user_id',
        ]);
        if (values.length === 0) {
            throw new common_1.ForbiddenException('Own scope requires userId');
        }
        for (const value of values) {
            if (this.parsePositiveInteger(value) !== userId) {
                throw new common_1.ForbiddenException('Cannot access another user scope');
            }
        }
    }
    hasAtLeastScope(accessScope, minimumScope) {
        return (ACCESS_SCOPE_WEIGHT[accessScope] >= ACCESS_SCOPE_WEIGHT[minimumScope]);
    }
    collectValues(request, keys) {
        const values = [];
        for (const source of [request.params, request.query, request.body]) {
            if (!source || typeof source !== 'object') {
                continue;
            }
            for (const key of keys) {
                const value = source[key];
                if (value !== undefined && value !== null && value !== '') {
                    if (Array.isArray(value)) {
                        values.push(...value);
                    }
                    else {
                        values.push(value);
                    }
                }
            }
        }
        return values;
    }
    getFirstPathSegment(request) {
        const path = request.route?.path;
        const firstSegment = typeof path === 'string'
            ? path.split('/').filter(Boolean)[0]
            : request.path.split('/').filter(Boolean)[0];
        return firstSegment ?? null;
    }
    parsePositiveInteger(value) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.ForbiddenException('Invalid authorization scope value');
        }
        return parsed;
    }
};
exports.PermissionGuard = PermissionGuard;
exports.PermissionGuard = PermissionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionGuard);
//# sourceMappingURL=permission.guard.js.map