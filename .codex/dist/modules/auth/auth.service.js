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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const auth_rbac_repository_1 = require("./auth-rbac.repository");
const clerk_jwt_service_1 = require("./clerk-jwt.service");
const ACCESS_SCOPE_WEIGHT = {
    own: 1,
    branch: 2,
    business: 3,
};
let AuthService = class AuthService {
    clerkJwtService;
    usersService;
    authRbacRepository;
    constructor(clerkJwtService, usersService, authRbacRepository) {
        this.clerkJwtService = clerkJwtService;
        this.usersService = usersService;
        this.authRbacRepository = authRbacRepository;
    }
    async authenticate(authorizationHeader) {
        const token = this.extractBearerToken(authorizationHeader);
        const claims = await this.clerkJwtService.verifyToken(token);
        const user = await this.usersService.findAuthenticatedByClerkId(claims.sub);
        if (!user) {
            throw new common_1.UnauthorizedException('User is not registered');
        }
        const authorization = await this.buildAuthorizationContext(user);
        user.authorization = authorization;
        return {
            clerkId: claims.sub,
            claims,
            user,
            authorization,
        };
    }
    async toMeResponse(user, authorization) {
        const resolvedAuthorization = authorization ?? (await this.buildAuthorizationContext(user));
        return {
            id: user.id,
            clerkId: user.clerk_id ?? '',
            name: user.name,
            email: user.email,
            photoUrl: user.photo_url ?? '',
            status: this.normalizeStatus(user.status),
            business_id: resolvedAuthorization.businessId,
            branch_id: this.normalizeNullablePositiveInteger(user.branch_id, 'user.branch_id'),
            roles: resolvedAuthorization.roles,
            permissions: resolvedAuthorization.permissions,
        };
    }
    extractBearerToken(authorizationHeader) {
        if (!authorizationHeader) {
            throw new common_1.UnauthorizedException('Authorization bearer token is required');
        }
        const [type, token] = authorizationHeader.split(' ');
        if (type !== 'Bearer' || !token) {
            throw new common_1.UnauthorizedException('Authorization bearer token is required');
        }
        return token;
    }
    normalizeStatus(status) {
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus === 'active' || normalizedStatus === 'inactive') {
            return normalizedStatus;
        }
        throw new common_1.UnauthorizedException('Invalid user status');
    }
    async buildAuthorizationContext(user) {
        const userId = this.normalizeRequiredPositiveInteger(user.id, 'user.id');
        const businessId = this.normalizeNullablePositiveInteger(user.business_id, 'user.business_id');
        const [rows, branchIds] = await Promise.all([
            this.authRbacRepository.findAssignedRolePermissionRows(userId, businessId),
            this.authRbacRepository.findAssignedBranchIds(userId, businessId),
        ]);
        const rolesById = new Map();
        const permissionsByKey = new Map();
        let isSuperadmin = false;
        for (const row of rows) {
            if (row.is_superadmin_role) {
                isSuperadmin = true;
            }
            let role = rolesById.get(row.role_id);
            if (!role) {
                role = {
                    id: this.normalizeRequiredPositiveInteger(row.role_id, 'role.id'),
                    name: row.role_name,
                    status: row.role_status,
                };
                rolesById.set(role.id, role);
            }
            if (row.permission_key === null || row.access_scope === null) {
                continue;
            }
            this.mergeEffectivePermission(permissionsByKey, row.permission_key, row.access_scope);
        }
        return {
            userId,
            businessId,
            branchIds,
            roles: [...rolesById.values()],
            permissions: isSuperadmin ? {} : Object.fromEntries(permissionsByKey),
            isSuperadmin,
        };
    }
    mergeEffectivePermission(permissionsByKey, permissionKey, accessScope) {
        const existingAccessScope = permissionsByKey.get(permissionKey);
        if (!existingAccessScope ||
            ACCESS_SCOPE_WEIGHT[accessScope] >
                ACCESS_SCOPE_WEIGHT[existingAccessScope]) {
            permissionsByKey.set(permissionKey, accessScope);
        }
    }
    normalizeRequiredPositiveInteger(value, field) {
        const parsed = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isInteger(parsed) ||
            parsed <= 0) {
            throw new common_1.UnauthorizedException(`${field} must be a positive integer`);
        }
        return parsed;
    }
    normalizeNullablePositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        return this.normalizeRequiredPositiveInteger(value, field);
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [clerk_jwt_service_1.ClerkJwtService,
        users_service_1.UsersService,
        auth_rbac_repository_1.AuthRbacRepository])
], AuthService);
//# sourceMappingURL=auth.service.js.map