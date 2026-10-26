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
exports.UserRolesService = void 0;
const common_1 = require("@nestjs/common");
const user_roles_repository_1 = require("./user-roles.repository");
let UserRolesService = class UserRolesService {
    userRolesRepository;
    constructor(userRolesRepository) {
        this.userRolesRepository = userRolesRepository;
    }
    async findAllForUser(userId, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const businessId = this.resolveBusinessAccess(currentUser, [
            'user.read',
            'user.manage',
        ]);
        await this.assertUserBelongsToBusiness(normalizedUserId, businessId);
        return this.userRolesRepository.findAllAssignedToUser(normalizedUserId, businessId);
    }
    async assignRoleToUser(userId, dto, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const roleId = this.parsePositiveInteger(dto.role_id, 'role_id');
        const businessId = this.resolveBusinessAccess(currentUser, ['user.manage']);
        await this.assertUserBelongsToBusiness(normalizedUserId, businessId);
        const role = await this.userRolesRepository.findRoleAvailableForBusiness(roleId, businessId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        if (role.status !== 'active') {
            throw new common_1.ConflictException('Role is inactive');
        }
        try {
            await this.userRolesRepository.assignRoleToUser(normalizedUserId, roleId);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('User already has this role');
            }
            throw error;
        }
        return this.userRolesRepository.findAssignedRole(normalizedUserId, roleId, businessId);
    }
    async removeRoleFromUser(userId, roleId, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const normalizedRoleId = this.parsePositiveInteger(roleId, 'roleId');
        const businessId = this.resolveBusinessAccess(currentUser, ['user.manage']);
        await this.assertUserBelongsToBusiness(normalizedUserId, businessId);
        const role = await this.userRolesRepository.findRoleAvailableForBusiness(normalizedRoleId, businessId);
        if (!role) {
            throw new common_1.NotFoundException('Role not found for business');
        }
        const removed = await this.userRolesRepository.removeRoleFromUser(normalizedUserId, normalizedRoleId, businessId);
        if (!removed) {
            throw new common_1.NotFoundException('User role not found');
        }
        return removed;
    }
    async assertUserBelongsToBusiness(userId, businessId) {
        const belongs = await this.userRolesRepository.userBelongsToBusiness(userId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('User does not belong to business');
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
exports.UserRolesService = UserRolesService;
exports.UserRolesService = UserRolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_roles_repository_1.UserRolesRepository])
], UserRolesService);
//# sourceMappingURL=user-roles.service.js.map