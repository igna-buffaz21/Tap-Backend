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
exports.ResourceBlocksService = void 0;
const common_1 = require("@nestjs/common");
const resource_blocks_repository_1 = require("./resource-blocks.repository");
let ResourceBlocksService = class ResourceBlocksService {
    resourceBlocksRepository;
    constructor(resourceBlocksRepository) {
        this.resourceBlocksRepository = resourceBlocksRepository;
    }
    create(createResourceBlockDto) {
        return this.resourceBlocksRepository.create(createResourceBlockDto);
    }
    async createForBusiness(createResourceBlockDto, currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        await this.assertResourceBelongsToBusiness(createResourceBlockDto.resource_id, access.businessId, access.filter);
        return this.create(createResourceBlockDto);
    }
    findAll() {
        return this.resourceBlocksRepository.findAll();
    }
    findAllForBusiness(currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        return this.resourceBlocksRepository.findAllForBusiness(access.businessId, access.filter);
    }
    findOne(id) {
        return this.resourceBlocksRepository.findById(id);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const blockId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const block = await this.resourceBlocksRepository.findByIdForBusiness(blockId, access.businessId, access.filter);
        if (!block) {
            throw new common_1.NotFoundException('Resource block not found for business');
        }
        return block;
    }
    update(id, updateResourceBlockDto, businessId, accessFilter) {
        return this.resourceBlocksRepository.update(id, updateResourceBlockDto, businessId, accessFilter);
    }
    async updateForBusiness(id, updateResourceBlockDto, currentUser, businessIdValue) {
        const blockId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        if (updateResourceBlockDto.resource_id !== undefined) {
            await this.assertResourceBelongsToBusiness(updateResourceBlockDto.resource_id, access.businessId, access.filter);
        }
        const updatedBlock = await this.update(blockId, updateResourceBlockDto, access.businessId, access.filter);
        if (!updatedBlock) {
            throw new common_1.NotFoundException('Resource block not found for business');
        }
        return updatedBlock;
    }
    remove(id) {
        return this.resourceBlocksRepository.remove(id);
    }
    async removeForBusiness(id, currentUser, businessIdValue) {
        const blockId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const removed = await this.resourceBlocksRepository.remove(blockId, access.businessId, access.filter);
        if (!removed) {
            throw new common_1.NotFoundException('Resource block not found for business');
        }
        return { deleted: true };
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
                : { allowedBranchIds: authorization.branchIds },
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    async assertResourceBelongsToBusiness(resourceIdValue, businessId, accessFilter) {
        const resourceId = this.parsePositiveInteger(resourceIdValue, 'resource_id');
        const belongs = await this.resourceBlocksRepository.resourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Resource does not belong to business');
        }
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
exports.ResourceBlocksService = ResourceBlocksService;
exports.ResourceBlocksService = ResourceBlocksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resource_blocks_repository_1.ResourceBlocksRepository])
], ResourceBlocksService);
//# sourceMappingURL=resource-blocks.service.js.map