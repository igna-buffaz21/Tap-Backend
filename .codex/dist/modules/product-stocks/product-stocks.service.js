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
exports.ProductStocksService = void 0;
const common_1 = require("@nestjs/common");
const product_stocks_repository_1 = require("./product-stocks.repository");
let ProductStocksService = class ProductStocksService {
    productStocksRepository;
    constructor(productStocksRepository) {
        this.productStocksRepository = productStocksRepository;
    }
    async findAllForBusiness(currentUser, branchIdValue, productIdValue) {
        const access = this.resolveStockAccess(currentUser);
        const branchId = this.parseOptionalPositiveInteger(branchIdValue, 'branchId');
        const productId = this.parseOptionalPositiveInteger(productIdValue, 'productId');
        if (branchId !== undefined) {
            await this.assertBranchBelongsToBusiness(branchId, access.businessId, access.filter);
        }
        if (productId !== undefined) {
            await this.assertProductBelongsToBusiness(productId, access.businessId);
        }
        return this.productStocksRepository.findAllForBusiness(access.businessId, branchId, productId, access.filter);
    }
    async getStatsForBusiness(currentUser, branchIdValue) {
        const access = this.resolveStockAccess(currentUser);
        const branchId = this.parseOptionalPositiveInteger(branchIdValue, 'branchId');
        if (branchId !== undefined) {
            await this.assertBranchBelongsToBusiness(branchId, access.businessId, access.filter);
        }
        return this.productStocksRepository.getStatsForBusiness(access.businessId, branchId, access.filter);
    }
    async findOneForBusiness(id, currentUser) {
        const productStockId = this.parsePositiveInteger(id, 'id');
        const access = this.resolveStockAccess(currentUser);
        const productStock = await this.productStocksRepository.findByIdForBusiness(productStockId, access.businessId, access.filter);
        if (!productStock) {
            throw new common_1.NotFoundException('Product stock not found for business');
        }
        return productStock;
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
    async assertBranchBelongsToBusiness(branchIdValue, businessId, accessFilter) {
        const branchId = this.parsePositiveInteger(branchIdValue, 'branch_id');
        const belongs = await this.productStocksRepository.branchBelongsToBusinessAndAccess(branchId, businessId, accessFilter);
        if (!belongs) {
            throw new common_1.ForbiddenException('Branch does not belong to business');
        }
    }
    async assertProductBelongsToBusiness(productIdValue, businessId) {
        const productId = this.parsePositiveInteger(productIdValue, 'product_id');
        const belongs = await this.productStocksRepository.productBelongsToBusiness(productId, businessId);
        if (!belongs) {
            throw new common_1.ForbiddenException('Product does not belong to business');
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
    parseOptionalPositiveInteger(value, field) {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }
        return this.parsePositiveInteger(value, field);
    }
};
exports.ProductStocksService = ProductStocksService;
exports.ProductStocksService = ProductStocksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [product_stocks_repository_1.ProductStocksRepository])
], ProductStocksService);
//# sourceMappingURL=product-stocks.service.js.map