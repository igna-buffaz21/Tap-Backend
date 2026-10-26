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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const products_repository_1 = require("./products.repository");
const STATUSES = ['active', 'inactive'];
const UNITS = ['unit', 'kg', 'g', 'l', 'ml', 'box', 'pack'];
let ProductsService = class ProductsService {
    productsRepository;
    constructor(productsRepository) {
        this.productsRepository = productsRepository;
    }
    async createForBusiness(createProductDto, currentUser) {
        const access = this.resolveStockAccess(currentUser);
        const dto = this.normalizeCreateDto(createProductDto);
        await this.assertCategoryBelongsToBusiness(dto.category_id, access.businessId);
        await this.assertInitialStockBranchBelongsToBusiness(dto, access.businessId, access.filter);
        try {
            return await this.productsRepository.create(access.businessId, dto);
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Product sku already exists for business');
            }
            throw error;
        }
    }
    findAllForBusiness(currentUser) {
        const access = this.resolveStockAccess(currentUser);
        return this.productsRepository.findAllForBusiness(access.businessId);
    }
    async findOneForBusiness(id, currentUser) {
        const productId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveStockAccess(currentUser);
        const product = await this.productsRepository.findByIdForBusiness(productId, access.businessId);
        if (!product) {
            throw new common_1.NotFoundException('Product not found for business');
        }
        return product;
    }
    async updateForBusiness(id, updateProductDto, currentUser) {
        const productId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveStockAccess(currentUser);
        const dto = this.normalizeUpdateDto(updateProductDto);
        await this.assertCategoryBelongsToBusiness(dto.category_id, access.businessId);
        try {
            const product = await this.productsRepository.updateForBusiness(productId, access.businessId, dto);
            if (!product) {
                throw new common_1.NotFoundException('Product not found for business');
            }
            return product;
        }
        catch (error) {
            if (this.isUniqueViolation(error)) {
                throw new common_1.ConflictException('Product sku already exists for business');
            }
            throw error;
        }
    }
    async updateStatusForBusiness(id, updateStatusDto, currentUser) {
        const productId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveStockAccess(currentUser);
        const product = await this.productsRepository.updateForBusiness(productId, access.businessId, {
            status: this.normalizeRequiredStatus(updateStatusDto.status),
        });
        if (!product) {
            throw new common_1.NotFoundException('Product not found for business');
        }
        return product;
    }
    resolveStockAccess(currentUser) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        const accessScope = authorization.permissions['stock.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission stock.manage');
        }
        return {
            businessId: this.requireBusinessUserBusinessId(authorization.businessId),
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
    async assertCategoryBelongsToBusiness(categoryIdValue, businessId) {
        if (categoryIdValue === undefined ||
            categoryIdValue === null ||
            categoryIdValue === '') {
            return;
        }
        const categoryId = this.parsePositiveInteger(categoryIdValue, 'category_id');
        const belongs = await this.productsRepository.categoryBelongsToBusiness(categoryId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Product category does not belong to business');
        }
    }
    async assertInitialStockBranchBelongsToBusiness(dto, businessId, accessFilter) {
        if (dto.branch_id === undefined &&
            dto.minimum_quantity !== undefined &&
            dto.minimum_quantity !== null) {
            throw new common_1.BadRequestException('branch_id is required for minimum_quantity');
        }
        if (dto.branch_id === undefined) {
            return;
        }
        const belongs = await this.productsRepository.branchBelongsToBusinessAndAccess(dto.branch_id, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    normalizeCreateDto(dto) {
        return {
            category_id: this.normalizeOptionalPositiveInteger(dto.category_id, 'category_id'),
            name: this.normalizeRequiredString(dto.name, 'name'),
            description: this.normalizeOptionalString(dto.description, 'description'),
            sku: this.normalizeOptionalString(dto.sku, 'sku'),
            unit: this.normalizeOptionalUnit(dto.unit),
            cost_price: this.normalizeOptionalNonNegativeNumber(dto.cost_price, 'cost_price'),
            sale_price: this.normalizeOptionalNonNegativeNumber(dto.sale_price, 'sale_price'),
            branch_id: this.normalizeOptionalPositiveIntegerAsUndefined(dto.branch_id, 'branch_id'),
            minimum_quantity: this.normalizeOptionalNonNegativeNumberAsUndefined(dto.minimum_quantity, 'minimum_quantity'),
            status: this.normalizeOptionalStatus(dto.status),
        };
    }
    normalizeUpdateDto(dto) {
        return {
            category_id: Object.prototype.hasOwnProperty.call(dto, 'category_id')
                ? this.normalizeOptionalPositiveInteger(dto.category_id, 'category_id')
                : undefined,
            name: dto.name === undefined
                ? undefined
                : this.normalizeRequiredString(dto.name, 'name'),
            description: Object.prototype.hasOwnProperty.call(dto, 'description')
                ? this.normalizeOptionalString(dto.description, 'description')
                : undefined,
            sku: Object.prototype.hasOwnProperty.call(dto, 'sku')
                ? this.normalizeOptionalString(dto.sku, 'sku')
                : undefined,
            unit: dto.unit === undefined ? undefined : this.normalizeRequiredUnit(dto.unit),
            cost_price: Object.prototype.hasOwnProperty.call(dto, 'cost_price')
                ? this.normalizeOptionalNonNegativeNumber(dto.cost_price, 'cost_price')
                : undefined,
            sale_price: Object.prototype.hasOwnProperty.call(dto, 'sale_price')
                ? this.normalizeOptionalNonNegativeNumber(dto.sale_price, 'sale_price')
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
    normalizeOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        return this.parsePositiveInteger(value, field);
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
    normalizeOptionalNonNegativeNumber(value, field) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative number`);
        }
        return parsed;
    }
    normalizeOptionalPositiveIntegerAsUndefined(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.parsePositiveInteger(value, field);
    }
    normalizeOptionalNonNegativeNumberAsUndefined(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        const parsed = Number(value);
        if (!Number.isFinite(parsed) || parsed < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative number`);
        }
        return parsed;
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
    normalizeOptionalUnit(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.normalizeRequiredUnit(value);
    }
    normalizeRequiredUnit(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('unit must be a string');
        }
        const unit = value.trim().toLowerCase();
        if (!UNITS.includes(unit)) {
            throw new common_1.BadRequestException('unit must be unit, kg, g, l, ml, box or pack');
        }
        return unit;
    }
    isUniqueViolation(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            error.code === '23505');
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [products_repository_1.ProductsRepository])
], ProductsService);
//# sourceMappingURL=products.service.js.map