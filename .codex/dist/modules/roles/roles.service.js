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
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const permissions_repository_1 = require("../permissions/permissions.repository");
const role_permissions_repository_1 = require("../role-permissions/role-permissions.repository");
const roles_repository_1 = require("./roles.repository");
const ACCESS_SCOPES = ['own', 'branch', 'business'];
const ROLE_READ_PERMISSIONS = ['role.read', 'role.manage'];
const ROLE_MANAGE_PERMISSIONS = ['role.manage'];
const RESERVED_ROLE_NAMES = new Set(['superadmin']);
let RolesService = class RolesService {
    rolesRepository;
    rolePermissionsRepository;
    permissionsRepository;
    databaseService;
    constructor(rolesRepository, rolePermissionsRepository, permissionsRepository, databaseService) {
        this.rolesRepository = rolesRepository;
        this.rolePermissionsRepository = rolePermissionsRepository;
        this.permissionsRepository = permissionsRepository;
        this.databaseService = databaseService;
    }
    findAllForBusiness(currentUser) {
        const businessId = this.resolveBusinessAccess(currentUser, ROLE_READ_PERMISSIONS);
        return this.rolesRepository.findAllAvailableForBusiness(businessId);
    }
    async findOneForBusiness(id, currentUser) {
        const roleId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveBusinessAccess(currentUser, ROLE_READ_PERMISSIONS);
        const role = await this.rolesRepository.findByIdAvailableWithPermissions(roleId, businessId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        return role;
    }
    async createForBusiness(dto, currentUser) {
        const businessId = this.resolveBusinessAccess(currentUser, ROLE_MANAGE_PERMISSIONS);
        const normalizedDto = this.normalizeCreateDto(dto);
        await this.assertPermissionsExist(normalizedDto.permissions ?? []);
        try {
            const role = await this.databaseService.withTransaction(async (client) => {
                const createdRole = await this.rolesRepository.createCustomRole(businessId, normalizedDto, client);
                await this.rolePermissionsRepository.replaceForRole(createdRole.id, normalizedDto.permissions ?? [], client);
                return createdRole;
            });
            return this.findOneForBusiness(role.id, currentUser);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Role name already exists for business');
            }
            throw error;
        }
    }
    async updateForBusiness(id, dto, currentUser) {
        const roleId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveBusinessAccess(currentUser, ROLE_MANAGE_PERMISSIONS);
        const existingRole = await this.rolesRepository.findByIdAvailableForBusiness(roleId, businessId);
        if (!existingRole) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        if (existingRole.business_id === null) {
            throw new common_1.ForbiddenException('Global roles cannot be modified');
        }
        const normalizedDto = this.normalizeUpdateDto(dto);
        if (normalizedDto.permissions !== undefined) {
            await this.assertPermissionsExist(normalizedDto.permissions);
        }
        try {
            await this.databaseService.withTransaction(async (client) => {
                const updatedRole = await this.rolesRepository.updateCustomRole(roleId, businessId, normalizedDto, client);
                if (!updatedRole) {
                    throw new common_1.NotFoundException('Role not found for business');
                }
                if (normalizedDto.permissions !== undefined) {
                    await this.rolePermissionsRepository.replaceForRole(roleId, normalizedDto.permissions, client);
                }
            });
            return this.findOneForBusiness(roleId, currentUser);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Role name already exists for business');
            }
            throw error;
        }
    }
    async deactivateForBusiness(id, currentUser) {
        const roleId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveBusinessAccess(currentUser, ROLE_MANAGE_PERMISSIONS);
        const existingRole = await this.rolesRepository.findByIdAvailableForBusiness(roleId, businessId);
        if (!existingRole) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        if (existingRole.business_id === null) {
            throw new common_1.ForbiddenException('Global roles cannot be deactivated');
        }
        const role = await this.rolesRepository.deactivateCustomRole(roleId, businessId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        return role;
    }
    normalizeCreateDto(dto) {
        return {
            name: this.normalizeRequiredString(dto.name, 'name'),
            description: this.normalizeOptionalString(dto.description, 'description'),
            permissions: this.normalizePermissions(dto.permissions),
        };
    }
    normalizeUpdateDto(dto) {
        return {
            name: dto.name === undefined
                ? undefined
                : this.normalizeRequiredString(dto.name, 'name'),
            description: Object.prototype.hasOwnProperty.call(dto, 'description')
                ? this.normalizeOptionalString(dto.description, 'description')
                : undefined,
            permissions: Object.prototype.hasOwnProperty.call(dto, 'permissions')
                ? this.normalizePermissions(dto.permissions)
                : undefined,
        };
    }
    normalizePermissions(permissions) {
        if (permissions === undefined || permissions === null) {
            return [];
        }
        if (!Array.isArray(permissions)) {
            throw new common_1.BadRequestException('permissions must be an array');
        }
        const seenPermissionIds = new Set();
        return permissions.map((permission, index) => {
            if (typeof permission !== 'object' || permission === null) {
                throw new common_1.BadRequestException(`permissions[${index}] must be an object`);
            }
            const values = permission;
            const permissionId = this.parsePositiveInteger(values.permission_id, `permissions[${index}].permission_id`);
            if (seenPermissionIds.has(permissionId)) {
                throw new common_1.BadRequestException(`permissions[${index}].permission_id is duplicated`);
            }
            seenPermissionIds.add(permissionId);
            return {
                permission_id: permissionId,
                access_scope: this.normalizeAccessScope(values.access_scope, `permissions[${index}].access_scope`),
            };
        });
    }
    async assertPermissionsExist(permissions) {
        const permissionIds = permissions.map((permission) => permission.permission_id);
        const existingCount = await this.permissionsRepository.countExistingByIds(permissionIds);
        if (existingCount !== permissionIds.length) {
            throw new common_1.BadRequestException('permissions must contain existing permission_id values');
        }
    }
    resolveBusinessAccess(currentUser, permissionKeys) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            throw new common_1.ForbiddenException('Business context is required');
        }
        const hasPermission = permissionKeys.some((permissionKey) => authorization.permissions[permissionKey]);
        if (!hasPermission) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKeys.join(' or ')}`);
        }
        return this.requireBusinessUserBusinessId(authorization.businessId);
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    normalizeRequiredString(value, field) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string`);
        }
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(`${field} is required`);
        }
        if (field === 'name' && RESERVED_ROLE_NAMES.has(normalized.toLowerCase())) {
            throw new common_1.BadRequestException(`${field} is reserved`);
        }
        return normalized;
    }
    normalizeOptionalString(value, field) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string or null`);
        }
        return value.trim() || null;
    }
    normalizeAccessScope(value, field) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string`);
        }
        const normalized = value.trim().toLowerCase();
        if (!ACCESS_SCOPES.includes(normalized)) {
            throw new common_1.BadRequestException(`${field} must be own, branch, or business`);
        }
        return normalized;
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
    isUniqueViolation(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '23505');
    }
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [roles_repository_1.RolesRepository,
        role_permissions_repository_1.RolePermissionsRepository,
        permissions_repository_1.PermissionsRepository,
        database_service_1.DatabaseService])
], RolesService);
//# sourceMappingURL=roles.service.js.map