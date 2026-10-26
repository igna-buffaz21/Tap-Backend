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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductStocksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const product_stocks_service_1 = require("./product-stocks.service");
let ProductStocksController = class ProductStocksController {
    productStocksService;
    constructor(productStocksService) {
        this.productStocksService = productStocksService;
    }
    findAll(currentUser, branchId, productId) {
        return this.productStocksService.findAllForBusiness(currentUser, branchId, productId);
    }
    getStats(currentUser, branchId) {
        return this.productStocksService.getStatsForBusiness(currentUser, branchId);
    }
    findOne(id, currentUser) {
        return this.productStocksService.findOneForBusiness(+id, currentUser);
    }
};
exports.ProductStocksController = ProductStocksController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar stock de productos por sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, example: 2 }),
    (0, swagger_1.ApiQuery)({ name: 'productId', required: false, example: 12 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('productId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String]),
    __metadata("design:returntype", void 0)
], ProductStocksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('stats/cards'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener stats principales de stock' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, example: 2 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('branchId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String]),
    __metadata("design:returntype", void 0)
], ProductStocksController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener stock de producto por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductStocksController.prototype, "findOne", null);
exports.ProductStocksController = ProductStocksController = __decorate([
    (0, swagger_1.ApiTags)('product-stocks'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('stock.manage'),
    (0, common_1.Controller)('product-stocks'),
    __metadata("design:paramtypes", [product_stocks_service_1.ProductStocksService])
], ProductStocksController);
//# sourceMappingURL=product-stocks.controller.js.map