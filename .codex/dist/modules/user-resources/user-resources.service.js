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
exports.UserResourcesService = void 0;
const common_1 = require("@nestjs/common");
const user_resources_repository_1 = require("./user-resources.repository");
const USER_RESOURCE_READ_PERMISSIONS = [
    'user.read',
    'user.manage',
    'resource.manage',
];
const USER_RESOURCE_MANAGE_PERMISSIONS = [
    'user.manage',
    'resource.manage',
];
let UserResourcesService = class UserResourcesService {
    userResourcesRepository;
    constructor(userResourcesRepository) {
        this.userResourcesRepository = userResourcesRepository;
    }
    async findAllForUser(userId, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const access = await this.resolveAccess(currentUser, normalizedUserId, USER_RESOURCE_READ_PERMISSIONS);
        return this.userResourcesRepository.findAllAssignedToUser(normalizedUserId, access.businessId, access.filter);
    }
    async assignResourceToUser(userId, dto, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const resourceId = this.parsePositiveInteger(dto.resource_id, 'resource_id');
        const access = await this.resolveAccess(currentUser, normalizedUserId, USER_RESOURCE_MANAGE_PERMISSIONS);
        await this.assertResourceBelongsToBusinessAndAccess(resourceId, access.businessId, access.filter);
        try {
            await this.userResourcesRepository.assignResourceToUser(normalizedUserId, resourceId);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('User already has this resource');
            }
            throw error;
        }
        return this.userResourcesRepository.findAssignedResource(normalizedUserId, resourceId, access.businessId, access.filter);
    }
    async removeResourceFromUser(userId, resourceIdValue, currentUser) {
        const normalizedUserId = this.parsePositiveInteger(userId, 'userId');
        const resourceId = this.parsePositiveInteger(resourceIdValue, 'resourceId');
        const access = await this.resolveAccess(currentUser, normalizedUserId, USER_RESOURCE_MANAGE_PERMISSIONS);
        const removed = await this.userResourcesRepository.removeResourceFromUser(normalizedUserId, resourceId, access.businessId, access.filter);
        if (!removed) {
            throw new common_1.NotFoundException('User resource not found');
        }
        return { deleted: true };
    }
    async resolveAccess(currentUser, targetUserId, permissionKeys) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            const businessId = await this.userResourcesRepository.findUserBusinessId(targetUserId);
            if (!businessId) {
                throw new common_1.NotFoundException('User not found for business');
            }
            return { businessId, accessScope: 'business' };
        }
        const accessScope = this.resolveAccessScope(authorization.permissions, permissionKeys);
        if (!accessScope) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKeys.join(' or ')}`);
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        await this.assertUserBelongsToBusiness(targetUserId, businessId);
        return {
            businessId,
            accessScope,
            filter: accessScope === 'business'
                ? undefined
                : { allowedBranchIds: authorization.branchIds },
        };
    }
    resolveAccessScope(permissions, permissionKeys) {
        for (const permissionKey of permissionKeys) {
            const accessScope = permissions[permissionKey];
            if (accessScope) {
                return accessScope;
            }
        }
        return null;
    }
    async assertUserBelongsToBusiness(userId, businessId) {
        const belongs = await this.userResourcesRepository.userBelongsToBusiness(userId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('User does not belong to business');
        }
    }
    async assertResourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter) {
        const belongs = await this.userResourcesRepository.resourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Resource does not belong to business');
        }
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
exports.UserResourcesService = UserResourcesService;
exports.UserResourcesService = UserResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_resources_repository_1.UserResourcesRepository])
], UserResourcesService);
//# sourceMappingURL=user-resources.service.js.map