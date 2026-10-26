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
exports.ResourceServicesService = void 0;
const common_1 = require("@nestjs/common");
const resource_services_repository_1 = require("./resource-services.repository");
let ResourceServicesService = class ResourceServicesService {
    resourceServicesRepository;
    constructor(resourceServicesRepository) {
        this.resourceServicesRepository = resourceServicesRepository;
    }
    create(createResourceServiceDto) {
        return this.resourceServicesRepository.create(createResourceServiceDto);
    }
    async createForBusiness(createResourceServiceDto, currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const resourceId = this.parsePositiveInteger(createResourceServiceDto.resource_id, 'resource_id');
        const serviceId = this.parsePositiveInteger(createResourceServiceDto.service_id, 'service_id');
        const belongs = await this.resourceServicesRepository.resourceAndServiceBelongToBusiness(resourceId, serviceId, access.businessId, access.filter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Resource and service must belong to the same business and branch');
        }
        return this.create(createResourceServiceDto);
    }
    findAll() {
        return this.resourceServicesRepository.findAll();
    }
    findAllForBusiness(currentUser, businessIdValue) {
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        return this.resourceServicesRepository.findAllForBusiness(access.businessId, access.filter);
    }
    remove(resourceId, serviceId) {
        return this.resourceServicesRepository.remove(resourceId, serviceId);
    }
    async removeForBusiness(resourceIdValue, serviceIdValue, currentUser, businessIdValue) {
        const resourceId = this.parsePositiveInteger(resourceIdValue, 'resourceId');
        const serviceId = this.parsePositiveInteger(serviceIdValue, 'serviceId');
        const access = this.resolveResourceAccess(currentUser, businessIdValue);
        const removed = await this.resourceServicesRepository.remove(resourceId, serviceId, access.businessId, access.filter);
        if (!removed) {
            throw new common_1.NotFoundException('Resource-service link not found for business');
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
exports.ResourceServicesService = ResourceServicesService;
exports.ResourceServicesService = ResourceServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [resource_services_repository_1.ResourceServicesRepository])
], ResourceServicesService);
//# sourceMappingURL=resource-services.service.js.map