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
exports.ResourcesService = void 0;
const common_1 = require("@nestjs/common");
const resources_repository_1 = require("./resources.repository");
let ResourcesService = class ResourcesService {
    resourcesRepository;
    constructor(resourcesRepository) {
        this.resourcesRepository = resourcesRepository;
    }
    create(createResourceDto) {
        if (Object.prototype.hasOwnProperty.call(createResourceDto, 'photo_url')) {
            createResourceDto.photo_url = this.normalizeOptionalString(createResourceDto.photo_url, 'photo_url');
        }
        createResourceDto.is_indoor = this.validateNullableBoolean(createResourceDto.is_indoor, 'is_indoor');
        createResourceDto.priority =
            this.validateOptionalPositiveInteger(createResourceDto.priority, 'priority') ?? 1;
        return this.resourcesRepository.create(createResourceDto);
    }
    async createForBusiness(createResourceDto, currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        await this.assertBranchBelongsToBusiness(createResourceDto.branch_id, access.businessId, access.filter);
        return this.create(createResourceDto);
    }
    findAll() {
        return this.resourcesRepository.findAll();
    }
    findAllForBusiness(currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        return this.resourcesRepository.findAllForBusiness(access.businessId, access.filter);
    }
    findOne(id) {
        return this.resourcesRepository.findById(id);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const resourceId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const resource = await this.resourcesRepository.findByIdForBusiness(resourceId, access.businessId, access.filter);
        if (!resource) {
            throw new common_1.NotFoundException('Resource not found for business');
        }
        return resource;
    }
    update(id, updateResourceDto, businessId, accessFilter) {
        if (Object.prototype.hasOwnProperty.call(updateResourceDto, 'photo_url')) {
            updateResourceDto.photo_url = this.normalizeOptionalString(updateResourceDto.photo_url, 'photo_url');
        }
        if (updateResourceDto.is_indoor !== undefined) {
            updateResourceDto.is_indoor = this.validateNullableBoolean(updateResourceDto.is_indoor, 'is_indoor');
        }
        if (updateResourceDto.priority !== undefined) {
            updateResourceDto.priority = this.validateOptionalPositiveInteger(updateResourceDto.priority, 'priority');
        }
        return this.resourcesRepository.update(id, updateResourceDto, businessId, accessFilter);
    }
    async updateForBusiness(id, updateResourceDto, currentUser, businessIdValue) {
        const resourceId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        if (updateResourceDto.branch_id !== undefined) {
            await this.assertBranchBelongsToBusiness(updateResourceDto.branch_id, access.businessId, access.filter);
        }
        const updatedResource = await this.update(resourceId, updateResourceDto, access.businessId, access.filter);
        if (!updatedResource) {
            throw new common_1.NotFoundException('Resource not found for business');
        }
        return updatedResource;
    }
    remove(id) {
        return this.resourcesRepository.remove(id);
    }
    resolveResourceAccess(currentUser, businessIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return {
                businessId: this.parsePositiveInteger(businessIdValue, 'businessId'),
                accessScope: 'business',
            };
        }
        const accessScope = authorization.permissions['resource.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission resource.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        if (businessIdValue !== undefined) {
            const requestedBusinessId = this.parsePositiveInteger(businessIdValue, 'businessId');
            if (requestedBusinessId !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        return {
            businessId,
            accessScope,
            filter: accessScope === 'business'
                ? undefined
                : {
                    allowedBranchIds: authorization.branchIds,
                    assignedUserId: accessScope === 'own' ? authorization.userId : undefined,
                },
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    async assertBranchBelongsToBusiness(branchIdValue, businessId, accessFilter) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branch_id');
        const belongs = await this.resourcesRepository.branchBelongsToBusinessAndAccess(branchId, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    validateNullableBoolean(value, field) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        if (typeof value !== 'boolean') {
            throw new common_1.BadRequestException(`${field} must be a boolean or null`);
        }
        return value;
    }
    validateOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive integer`);
        }
        return parsed;
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
    normalizeOptionalString(value, field) {
        if (value === undefined || value === null) {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string or null`);
        }
        return value.trim() || null;
    }
};
exports.ResourcesService = ResourcesService;
exports.ResourcesService = ResourcesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resources_repository_1.ResourcesRepository])
], ResourcesService);
//# sourceMappingURL=resources.service.js.map