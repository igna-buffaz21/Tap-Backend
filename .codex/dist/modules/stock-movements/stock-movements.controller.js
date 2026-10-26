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
exports.StockMovementsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_bulk_stock_movement_dto_1 = require("./dto/create-bulk-stock-movement.dto");
const create_stock_movement_dto_1 = require("./dto/create-stock-movement.dto");
const stock_movements_service_1 = require("./stock-movements.service");
let StockMovementsController = class StockMovementsController {
    stockMovementsService;
    constructor(stockMovementsService) {
        this.stockMovementsService = stockMovementsService;
    }
    create(createMovementDto, currentUser) {
        return this.stockMovementsService.createForBusiness(createMovementDto, currentUser);
    }
    createBulk(createBulkMovementDto, currentUser) {
        return this.stockMovementsService.createBulkForBusiness(createBulkMovementDto, currentUser);
    }
    findAll(currentUser, branchId, productId, userId, categoryId, type, page, limit) {
        return this.stockMovementsService.findAllForBusiness(currentUser, branchId, productId, userId, categoryId, type, page, limit);
    }
    findOne(id, currentUser) {
        return this.stockMovementsService.findOneForBusiness(+id, currentUser);
    }
};
exports.StockMovementsController = StockMovementsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear movimiento de stock',
        description: 'Actualiza product_stock y crea stock_movement en la misma transaccion.',
    }),
    (0, swagger_1.ApiBody)({ type: create_stock_movement_dto_1.CreateStockMovementDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_stock_movement_dto_1.CreateStockMovementDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('bulk'),
    (0, swagger_1.ApiOperation)({
        summary: 'Crear movimientos de stock masivos',
        description: 'Aplica entradas o salidas de mercaderia para varios productos en una misma transaccion.',
    }),
    (0, swagger_1.ApiBody)({ type: create_bulk_stock_movement_dto_1.CreateBulkStockMovementDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_bulk_stock_movement_dto_1.CreateBulkStockMovementDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar movimientos de stock' }),
    (0, swagger_1.ApiQuery)({ name: 'branchId', required: false, example: 2 }),
    (0, swagger_1.ApiQuery)({ name: 'productId', required: false, example: 12 }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, example: 7 }),
    (0, swagger_1.ApiQuery)({ name: 'categoryId', required: false, example: 4 }),
    (0, swagger_1.ApiQuery)({
        name: 'type',
        required: false,
        enum: ['IN', 'OUT', 'ADJUSTMENT'],
        example: 'IN',
    }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, example: 10 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('branchId')),
    __param(2, (0, common_1.Query)('productId')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('categoryId')),
    __param(5, (0, common_1.Query)('type')),
    __param(6, (0, common_1.Query)('page')),
    __param(7, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User, String, String, String, String, String, String, String]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener movimiento de stock por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], StockMovementsController.prototype, "findOne", null);
exports.StockMovementsController = StockMovementsController = __decorate([
    (0, swagger_1.ApiTags)('stock-movements'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('stock.manage'),
    (0, common_1.Controller)('stock-movements'),
    __metadata("design:paramtypes", [stock_movements_service_1.StockMovementsService])
], StockMovementsController);
//# sourceMappingURL=stock-movements.controller.js.map