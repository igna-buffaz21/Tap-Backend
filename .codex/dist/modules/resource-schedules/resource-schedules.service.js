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
exports.ResourceSchedulesService = void 0;
const common_1 = require("@nestjs/common");
const resource_schedules_repository_1 = require("./resource-schedules.repository");
let ResourceSchedulesService = class ResourceSchedulesService {
    resourceSchedulesRepository;
    constructor(resourceSchedulesRepository) {
        this.resourceSchedulesRepository = resourceSchedulesRepository;
    }
    create(createResourceScheduleDto) {
        return this.resourceSchedulesRepository.create(createResourceScheduleDto);
    }
    async createForBusiness(createResourceScheduleDto, currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        await this.assertResourceBelongsToBusiness(createResourceScheduleDto.resource_id, access.businessId, access.filter);
        return this.create(createResourceScheduleDto);
    }
    findAll() {
        return this.resourceSchedulesRepository.findAll();
    }
    findAllForBusiness(currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        return this.resourceSchedulesRepository.findAllForBusiness(access.businessId, access.filter);
    }
    findOne(id) {
        return this.resourceSchedulesRepository.findById(id);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const scheduleId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const schedule = await this.resourceSchedulesRepository.findByIdForBusiness(scheduleId, access.businessId, access.filter);
        if (!schedule) {
            throw new common_1.NotFoundException('Resource schedule not found for business');
        }
        return schedule;
    }
    update(id, updateResourceScheduleDto, businessId, accessFilter) {
        return this.resourceSchedulesRepository.update(id, updateResourceScheduleDto, businessId, accessFilter);
    }
    async updateForBusiness(id, updateResourceScheduleDto, currentUser, businessIdValue) {
        const scheduleId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        if (updateResourceScheduleDto.resource_id !== undefined) {
            await this.assertResourceBelongsToBusiness(updateResourceScheduleDto.resource_id, access.businessId, access.filter);
        }
        const updatedSchedule = await this.update(scheduleId, updateResourceScheduleDto, access.businessId, access.filter);
        if (!updatedSchedule) {
            throw new common_1.NotFoundException('Resource schedule not found for business');
        }
        return updatedSchedule;
    }
    remove(id) {
        return this.resourceSchedulesRepository.remove(id);
    }
    async removeForBusiness(id, currentUser, businessIdValue) {
        const scheduleId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const removed = await this.resourceSchedulesRepository.remove(scheduleId, access.businessId, access.filter);
        if (!removed) {
            throw new common_1.NotFoundException('Resource schedule not found for business');
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
        const belongs = await this.resourceSchedulesRepository.resourceBelongsToBusinessAndAccess(resourceId, businessId, accessFilter);
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
exports.ResourceSchedulesService = ResourceSchedulesService;
exports.ResourceSchedulesService = ResourceSchedulesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resource_schedules_repository_1.ResourceSchedulesRepository])
], ResourceSchedulesService);
//# sourceMappingURL=resource-schedules.service.js.map