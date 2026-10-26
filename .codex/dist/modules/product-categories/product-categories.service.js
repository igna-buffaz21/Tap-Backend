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
exports.ProductCategoriesService = void 0;
const common_1 = require("@nestjs/common");
const product_categories_repository_1 = require("./product-categories.repository");
const STATUSES = ['active', 'inactive'];
let ProductCategoriesService = class ProductCategoriesService {
    productCategoriesRepository;
    constructor(productCategoriesRepository) {
        this.productCategoriesRepository = productCategoriesRepository;
    }
    async createForBusiness(createCategoryDto, currentUser) {
        const businessId = this.resolveStockAccess(currentUser);
        const dto = this.normalizeCreateDto(createCategoryDto);
        try {
            return await this.productCategoriesRepository.create(businessId, dto);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Product category name already exists for business');
            }
            throw error;
        }
    }
    findAllForBusiness(currentUser) {
        const businessId = this.resolveStockAccess(currentUser);
        return this.productCategoriesRepository.findAllForBusiness(businessId);
    }
    async findOneForBusiness(id, currentUser) {
        const categoryId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveStockAccess(currentUser);
        const category = await this.productCategoriesRepository.findByIdForBusiness(categoryId, businessId);
        if (!category) {
            throw new common_1.NotFoundException('Product category not found for business');
        }
        return category;
    }
    async updateForBusiness(id, updateCategoryDto, currentUser) {
        const categoryId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveStockAccess(currentUser);
        const dto = this.normalizeUpdateDto(updateCategoryDto);
        try {
            const category = await this.productCategoriesRepository.updateForBusiness(categoryId, businessId, dto);
            if (!category) {
                throw new common_1.NotFoundException('Product category not found for business');
            }
            return category;
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Product category name already exists for business');
            }
            throw error;
        }
    }
    async updateStatusForBusiness(id, updateStatusDto, currentUser) {
        const categoryId = this.parsePositiveInteger(id, 'id');
        const businessId = this.resolveStockAccess(currentUser);
        const dto = {
            status: this.normalizeRequiredStatus(updateStatusDto.status),
        };
        const category = await this.productCategoriesRepository.updateForBusiness(categoryId, businessId, dto);
        if (!category) {
            throw new common_1.NotFoundException('Product category not found for business');
        }
        return category;
    }
    resolveStockAccess(currentUser) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (!authorization.permissions['stock.manage']) {
            throw new common_1.ForbiddenException('Missing permission stock.manage');
        }
        return this.requireBusinessUserBusinessId(authorization.businessId);
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    normalizeCreateDto(dto) {
        return {
            name: this.normalizeRequiredString(dto.name, 'name'),
            description: this.normalizeOptionalString(dto.description, 'description'),
            status: this.normalizeOptionalStatus(dto.status),
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
        };
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
    normalizeRequiredString(value, field) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException(`${field} must be a string`);
        }
        const normalized = value.trim();
        if (!normalized) {
            throw new common_1.BadRequestException(`${field} is required`);
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
    normalizeOptionalStatus(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.normalizeRequiredStatus(value);
    }
    normalizeRequiredStatus(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('status must be a string');
        }
        const status = value.trim().toLowerCase();
        if (!STATUSES.includes(status)) {
            throw new common_1.BadRequestException('status must be active or inactive');
        }
        return status;
    }
    isUniqueViolation(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '23505');
    }
};
exports.ProductCategoriesService = ProductCategoriesService;
exports.ProductCategoriesService = ProductCategoriesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_categories_repository_1.ProductCategoriesRepository])
], ProductCategoriesService);
//# sourceMappingURL=product-categories.service.js.map