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
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const resource_selection_types_1 = require("../bookings/resource-selection.types");
const services_repository_1 = require("./services.repository");
const SERVICE_READ_PERMISSIONS = ['service.read', 'service.manage'];
let ServicesService = class ServicesService {
    servicesRepository;
    constructor(servicesRepository) {
        this.servicesRepository = servicesRepository;
    }
    create(createServiceDto) {
        if (Object.prototype.hasOwnProperty.call(createServiceDto, 'icon_key')) {
            createServiceDto.icon_key = this.normalizeOptionalString(createServiceDto.icon_key, 'icon_key');
        }
        if (Object.prototype.hasOwnProperty.call(createServiceDto, 'image_url')) {
            createServiceDto.image_url = this.normalizeOptionalString(createServiceDto.image_url, 'image_url');
        }
        createServiceDto.resource_selection_mode =
            this.validateResourceSelectionMode(createServiceDto.resource_selection_mode) ?? 'AUTO';
        return this.servicesRepository.create(createServiceDto);
    }
    async createForBusiness(createServiceDto, currentUser, businessIdValue) {
        const access = this.resolveServiceAccess(currentUser, businessIdValue);
        await this.assertBranchBelongsToBusiness(createServiceDto.branch_id, access.businessId, access.filter);
        return this.create(createServiceDto);
    }
    findAll() {
        return this.servicesRepository.findAll();
    }
    findAllForBusiness(currentUser, businessIdValue) {
        const access = this.resolveServiceAccess(currentUser, businessIdValue, SERVICE_READ_PERMISSIONS);
        return this.servicesRepository.findAllForBusiness(access.businessId, access.filter);
    }
    findOne(id) {
        return this.servicesRepository.findById(id);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const serviceId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveServiceAccess(currentUser, businessIdValue, SERVICE_READ_PERMISSIONS);
        const service = await this.servicesRepository.findByIdForBusiness(serviceId, access.businessId, access.filter);
        if (!service) {
            throw new common_1.NotFoundException('Service not found for business');
        }
        return service;
    }
    update(id, updateServiceDto, businessId, accessFilter) {
        if (Object.prototype.hasOwnProperty.call(updateServiceDto, 'icon_key')) {
            updateServiceDto.icon_key = this.normalizeOptionalString(updateServiceDto.icon_key, 'icon_key');
        }
        if (Object.prototype.hasOwnProperty.call(updateServiceDto, 'image_url')) {
            updateServiceDto.image_url = this.normalizeOptionalString(updateServiceDto.image_url, 'image_url');
        }
        if (updateServiceDto.resource_selection_mode !== undefined) {
            updateServiceDto.resource_selection_mode =
                this.validateResourceSelectionMode(updateServiceDto.resource_selection_mode);
        }
        return this.servicesRepository.update(id, updateServiceDto, businessId, accessFilter);
    }
    async updateForBusiness(id, updateServiceDto, currentUser, businessIdValue) {
        const serviceId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveServiceAccess(currentUser, businessIdValue);
        if (updateServiceDto.branch_id !== undefined) {
            await this.assertBranchBelongsToBusiness(updateServiceDto.branch_id, access.businessId, access.filter);
        }
        const updatedService = await this.update(serviceId, updateServiceDto, access.businessId, access.filter);
        if (!updatedService) {
            throw new common_1.NotFoundException('Service not found for business');
        }
        return updatedService;
    }
    remove(id) {
        return this.servicesRepository.remove(id);
    }
    resolveServiceAccess(currentUser, businessIdValue, permissionKeys = ['service.manage']) {
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
        const accessScope = this.resolveAccessScope(authorization.permissions, permissionKeys);
        if (!accessScope) {
            throw new common_1.ForbiddenException(`Missing permission ${permissionKeys.join(' or ')}`);
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
    resolveAccessScope(permissions, permissionKeys) {
        for (const permissionKey of permissionKeys) {
            const accessScope = permissions[permissionKey];
            if (accessScope) {
                return accessScope;
            }
        }
        return null;
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    async assertBranchBelongsToBusiness(branchIdValue, businessId, accessFilter) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branch_id');
        const belongs = await this.servicesRepository.branchBelongsToBusinessAndAccess(branchId, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    validateResourceSelectionMode(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        if (typeof value !== 'string' ||
            !resource_selection_types_1.RESOURCE_SELECTION_MODES.includes(value)) {
            throw new common_1.BadRequestException('resource_selection_mode must be AUTO, OPTIONAL or REQUIRED');
        }
        return value;
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
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [services_repository_1.ServicesRepository])
], ServicesService);
//# sourceMappingURL=services.service.js.map