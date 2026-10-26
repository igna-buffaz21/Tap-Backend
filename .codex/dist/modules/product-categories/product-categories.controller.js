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
exports.ProductCategoriesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const create_product_category_dto_1 = require("./dto/create-product-category.dto");
const update_product_category_status_dto_1 = require("./dto/update-product-category-status.dto");
const update_product_category_dto_1 = require("./dto/update-product-category.dto");
const product_categories_service_1 = require("./product-categories.service");
let ProductCategoriesController = class ProductCategoriesController {
    productCategoriesService;
    constructor(productCategoriesService) {
        this.productCategoriesService = productCategoriesService;
    }
    create(createCategoryDto, currentUser) {
        return this.productCategoriesService.createForBusiness(createCategoryDto, currentUser);
    }
    findAll(currentUser) {
        return this.productCategoriesService.findAllForBusiness(currentUser);
    }
    findOne(id, currentUser) {
        return this.productCategoriesService.findOneForBusiness(+id, currentUser);
    }
    update(id, updateCategoryDto, currentUser) {
        return this.productCategoriesService.updateForBusiness(+id, updateCategoryDto, currentUser);
    }
    updateStatus(id, updateStatusDto, currentUser) {
        return this.productCategoriesService.updateStatusForBusiness(+id, updateStatusDto, currentUser);
    }
};
exports.ProductCategoriesController = ProductCategoriesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear categoria de producto' }),
    (0, swagger_1.ApiBody)({ type: create_product_category_dto_1.CreateProductCategoryDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_product_category_dto_1.CreateProductCategoryDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductCategoriesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar categorias de producto' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductCategoriesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener categoria de producto por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductCategoriesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar categoria de producto' }),
    (0, swagger_1.ApiBody)({ type: update_product_category_dto_1.UpdateProductCategoryDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_category_dto_1.UpdateProductCategoryDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductCategoriesController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/status'),
    (0, swagger_1.ApiOperation)({ summary: 'Cambiar estado de categoria de producto' }),
    (0, swagger_1.ApiBody)({ type: update_product_category_status_dto_1.UpdateProductCategoryStatusDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_product_category_status_dto_1.UpdateProductCategoryStatusDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], ProductCategoriesController.prototype, "updateStatus", null);
exports.ProductCategoriesController = ProductCategoriesController = __decorate([
    (0, swagger_1.ApiTags)('product-categories'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('stock.manage'),
    (0, common_1.Controller)('product-categories'),
    __metadata("design:paramtypes", [product_categories_service_1.ProductCategoriesService])
], ProductCategoriesController);
//# sourceMappingURL=product-categories.controller.js.map