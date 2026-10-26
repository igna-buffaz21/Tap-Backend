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
exports.StockMovementsService = void 0;
const common_1 = require("@nestjs/common");
const stock_movements_repository_1 = require("./stock-movements.repository");
const MOVEMENT_TYPES = ['IN', 'OUT', 'ADJUSTMENT'];
const BULK_MOVEMENT_TYPES = ['IN', 'OUT'];
const MOVEMENT_REASONS = [
    'PURCHASE',
    'SALE',
    'INTERNAL_USE',
    'LOSS',
    'DAMAGE',
    'RETURN',
    'MANUAL_ADJUSTMENT',
    'OTHER',
];
let StockMovementsService = class StockMovementsService {
    stockMovementsRepository;
    constructor(stockMovementsRepository) {
        this.stockMovementsRepository = stockMovementsRepository;
    }
    async createForBusiness(createMovementDto, currentUser) {
        const access = this.resolveStockAccess(currentUser);
        const dto = this.normalizeCreateDto(createMovementDto);
        await this.assertBranchBelongsToBusiness(dto.branch_id, access.businessId, access.filter);
        await this.assertProductBelongsToBusiness(dto.product_id, access.businessId);
        const result = await this.stockMovementsRepository.createAndApply(access.businessId, dto, currentUser.id);
        if ('insufficientStock' in result) {
            throw new common_1.BadRequestException('Stock cannot be negative');
        }
        if ('noStockChange' in result) {
            throw new common_1.BadRequestException('Stock movement must change stock');
        }
        return result.movement;
    }
    async createBulkForBusiness(createBulkMovementDto, currentUser) {
        const access = this.resolveStockAccess(currentUser);
        const payload = this.normalizeBulkCreateDto(createBulkMovementDto);
        await this.assertBranchBelongsToBusiness(payload.branch_id, access.businessId, access.filter);
        for (const productId of new Set(payload.items.map((item) => item.product_id))) {
            await this.assertProductBelongsToBusiness(productId, access.businessId);
        }
        try {
            const movements = await this.stockMovementsRepository.createBulkAndApply(access.businessId, payload, currentUser.id);
            return {
                count: movements.length,
                movements,
            };
        }
        catch (error) {
            if (error instanceof stock_movements_repository_1.BulkStockMovementInsufficientStockError) {
                throw new common_1.BadRequestException(`Stock cannot be negative for product ${error.productId}`);
            }
            if (error instanceof stock_movements_repository_1.BulkStockMovementNoStockChangeError) {
                throw new common_1.BadRequestException(`Stock movement must change stock for product ${error.productId}`);
            }
            throw error;
        }
    }
    async findAllForBusiness(currentUser, branchIdValue, productIdValue, userIdValue, categoryIdValue, typeValue, pageValue, limitValue) {
        const access = this.resolveStockAccess(currentUser);
        const branchId = this.parseOptionalPositiveInteger(branchIdValue, 'branchId');
        const productId = this.parseOptionalPositiveInteger(productIdValue, 'productId');
        const userId = this.parseOptionalPositiveInteger(userIdValue, 'userId');
        const categoryId = this.parseOptionalPositiveInteger(categoryIdValue, 'categoryId');
        const type = this.normalizeOptionalMovementType(typeValue);
        const { page, limit, offset } = this.parsePagination(pageValue, limitValue, 100, 10);
        if (branchId !== undefined) {
            await this.assertBranchBelongsToBusiness(branchId, access.businessId, access.filter);
        }
        if (productId !== undefined) {
            await this.assertProductBelongsToBusiness(productId, access.businessId);
        }
        if (userId !== undefined) {
            await this.assertUserBelongsToBusiness(userId, access.businessId);
        }
        if (categoryId !== undefined) {
            await this.assertCategoryBelongsToBusiness(categoryId, access.businessId);
        }
        const result = await this.stockMovementsRepository.findAllForBusiness(access.businessId, {
            branchId,
            productId,
            userId,
            categoryId,
            type,
        }, { limit, offset }, access.filter);
        return this.buildPaginatedResponse(result, page, limit);
    }
    async findOneForBusiness(id, currentUser) {
        const movementId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveStockAccess(currentUser);
        const movement = await this.stockMovementsRepository.findByIdForBusiness(movementId, access.businessId, access.filter);
        if (!movement) {
            throw new common_1.NotFoundException('Stock movement not found for business');
        }
        return movement;
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
        const filter = accessScope === 'business'
            ? undefined
            : {
                allowedBranchIds: authorization.branchIds,
                createdByUserId: authorization.userId,
                ownOnly: accessScope === 'own',
            };
        return {
            businessId: this.requireBusinessUserBusinessId(authorization.businessId),
            accessScope,
            filter,
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
        const belongs = await this.stockMovementsRepository.branchBelongsToBusinessAndAccess(branchId, businessId, accessFilter
            ? { allowedBranchIds: accessFilter.allowedBranchIds }
            : undefined);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    async assertProductBelongsToBusiness(productIdValue, businessId) {
        const productId = this.parsePositiveInteger(productIdValue, 'product_id');
        const belongs = await this.stockMovementsRepository.productBelongsToBusiness(productId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Product does not belong to business');
        }
    }
    async assertUserBelongsToBusiness(userIdValue, businessId) {
        const userId = this.parsePositiveInteger(userIdValue, 'userId');
        const belongs = await this.stockMovementsRepository.userBelongsToBusiness(userId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('User does not belong to business');
        }
    }
    async assertCategoryBelongsToBusiness(categoryIdValue, businessId) {
        const categoryId = this.parsePositiveInteger(categoryIdValue, 'categoryId');
        const belongs = await this.stockMovementsRepository.categoryBelongsToBusiness(categoryId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Category does not belong to business');
        }
    }
    normalizeCreateDto(dto) {
        if (Object.prototype.hasOwnProperty.call(dto, 'new_quantity')) {
            throw new common_1.BadRequestException('new_quantity is calculated by backend');
        }
        const type = this.normalizeMovementType(dto.type);
        const normalizedDto = {
            branch_id: this.parsePositiveInteger(dto.branch_id, 'branch_id'),
            product_id: this.parsePositiveInteger(dto.product_id, 'product_id'),
            type,
            reason: this.normalizeOptionalMovementReason(dto.reason),
            notes: this.normalizeOptionalString(dto.notes, 'notes'),
            unit_cost: this.parseOptionalNonNegativeNumber(dto.unit_cost, 'unit_cost'),
        };
        if (type === 'ADJUSTMENT') {
            normalizedDto.quantity = this.parseNonNegativeNumber(dto.quantity, 'quantity');
            return normalizedDto;
        }
        normalizedDto.quantity = this.parsePositiveNumber(dto.quantity, 'quantity');
        return normalizedDto;
    }
    normalizeBulkCreateDto(dto) {
        const type = this.normalizeBulkMovementType(dto.type);
        const items = this.normalizeBulkItems(dto.items);
        return {
            branch_id: this.parsePositiveInteger(dto.branchId, 'branchId'),
            type,
            reason: this.normalizeOptionalMovementReason(dto.reason),
            notes: this.normalizeOptionalString(dto.notes, 'notes'),
            items,
        };
    }
    normalizeBulkItems(itemsValue) {
        if (!Array.isArray(itemsValue) || itemsValue.length === 0) {
            throw new common_1.BadRequestException('items must be a non-empty array');
        }
        return itemsValue.map((item, index) => {
            if (typeof item !== 'object' || item === null) {
                throw new common_1.BadRequestException(`items[${index}] must be an object`);
            }
            const values = item;
            const unitCostValue = Object.prototype.hasOwnProperty.call(values, 'unitCost')
                ? values.unitCost
                : values.unit_cost;
            return {
                product_id: this.parsePositiveInteger(values.productId, `items[${index}].productId`),
                quantity: this.parsePositiveNumber(values.quantity, `items[${index}].quantity`),
                unit_cost: this.parseOptionalNonNegativeNumber(unitCostValue, `items[${index}].unitCost`),
            };
        });
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
    parseOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.parsePositiveInteger(value, field);
    }
    parsePagination(pageValue, limitValue, maxLimit, defaultLimit) {
        const page = pageValue === undefined || pageValue === null || pageValue === ''
            ? 1
            : this.parsePositiveInteger(pageValue, 'page');
        const limit = limitValue === undefined || limitValue === null || limitValue === ''
            ? defaultLimit
            : this.parsePositiveInteger(limitValue, 'limit');
        if (limit > maxLimit) {
            throw new common_1.BadRequestException(`limit must be less than or equal to ${maxLimit}`);
        }
        return {
            page,
            limit,
            offset: (page - 1) * limit,
        };
    }
    buildPaginatedResponse(result, page, limit) {
        return {
            data: result.movements,
            pagination: this.buildPagination(page, limit, result.total),
        };
    }
    buildPagination(page, limit, total) {
        return {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }
    parsePositiveNumber(value, field) {
        const parsed = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isFinite(parsed) ||
            parsed <= 0) {
            throw new common_1.BadRequestException(`${field} must be a positive number`);
        }
        return parsed;
    }
    parseNonNegativeNumber(value, field) {
        const parsed = Number(value);
        if (value === undefined ||
            value === null ||
            value === '' ||
            !Number.isFinite(parsed) ||
            parsed < 0) {
            throw new common_1.BadRequestException(`${field} must be a non-negative number`);
        }
        return parsed;
    }
    parseOptionalNonNegativeNumber(value, field) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        return this.parseNonNegativeNumber(value, field);
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
    normalizeMovementType(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('type must be a string');
        }
        const type = value.trim().toUpperCase();
        if (!MOVEMENT_TYPES.includes(type)) {
            throw new common_1.BadRequestException('type must be IN, OUT or ADJUSTMENT');
        }
        return type;
    }
    normalizeOptionalMovementType(value) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.normalizeMovementType(value);
    }
    normalizeBulkMovementType(value) {
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('type must be a string');
        }
        const type = value.trim().toUpperCase();
        if (!BULK_MOVEMENT_TYPES.includes(type)) {
            throw new common_1.BadRequestException('type must be IN or OUT');
        }
        return type;
    }
    normalizeOptionalMovementReason(value) {
        if (value === undefined || value === null || value === '') {
            return null;
        }
        if (typeof value !== 'string') {
            throw new common_1.BadRequestException('reason must be a string or null');
        }
        const reason = value.trim().toUpperCase();
        if (!MOVEMENT_REASONS.includes(reason)) {
            throw new common_1.BadRequestException('Invalid stock movement reason');
        }
        return reason;
    }
};
exports.StockMovementsService = StockMovementsService;
exports.StockMovementsService = StockMovementsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [stock_movements_repository_1.StockMovementsRepository])
], StockMovementsService);
//# sourceMappingURL=stock-movements.service.js.map