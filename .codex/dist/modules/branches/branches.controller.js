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
exports.BranchesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const require_permission_decorator_1 = require("../auth/decorators/require-permission.decorator");
const user_entity_1 = require("../users/entities/user.entity");
const branches_service_1 = require("./branches.service");
const branch_image_upload_signature_dto_1 = require("./dto/branch-image-upload-signature.dto");
const branch_stats_service_1 = require("./branch-stats.service");
const get_branch_demand_stats_query_dto_1 = require("./dto/get-branch-demand-stats-query.dto");
const get_branch_stats_query_dto_1 = require("./dto/get-branch-stats-query.dto");
const create_branch_dto_1 = require("./dto/create-branch.dto");
const create_branch_image_upload_signature_dto_1 = require("./dto/create-branch-image-upload-signature.dto");
const update_branch_dto_1 = require("./dto/update-branch.dto");
let BranchesController = class BranchesController {
    branchesService;
    branchStatsService;
    constructor(branchesService, branchStatsService) {
        this.branchesService = branchesService;
        this.branchStatsService = branchStatsService;
    }
    create(createBranchDto, currentUser) {
        return this.branchesService.createForBusiness(createBranchDto, currentUser);
    }
    findAll(currentUser) {
        return this.branchesService.findAllForBusiness(currentUser);
    }
    getStats(branchId, query, currentUser) {
        return this.branchStatsService.getSummary(branchId, query, currentUser);
    }
    getDemandStats(branchId, query, currentUser) {
        return this.branchStatsService.getDemand(branchId, query, currentUser);
    }
    findOne(id, currentUser) {
        return this.branchesService.findOne(+id, currentUser);
    }
    createImageUploadSignature(id, dto, currentUser) {
        return this.branchesService.createImageUploadSignature(+id, dto, currentUser);
    }
    update(id, updateBranchDto, currentUser) {
        return this.branchesService.update(+id, updateBranchDto, currentUser);
    }
    remove(id, currentUser) {
        return this.branchesService.removeForBusiness(+id, currentUser);
    }
};
exports.BranchesController = BranchesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Crear sucursal' }),
    (0, swagger_1.ApiBody)({ type: create_branch_dto_1.CreateBranchDto }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_branch_dto_1.CreateBranchDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, require_permission_decorator_1.RequireAnyPermission)('branch.manage', 'user.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar sucursales' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':branchId/stats'),
    (0, require_permission_decorator_1.RequirePermission)('analytics.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener KPIs de una sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'period', enum: ['day', 'week', 'month', 'year'] }),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_branch_stats_query_dto_1.GetBranchStatsQueryDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(':branchId/stats/demand'),
    (0, require_permission_decorator_1.RequirePermission)('analytics.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener heatmap de demanda de una sucursal' }),
    (0, swagger_1.ApiQuery)({ name: 'period', enum: ['week', 'month', 'year'] }),
    (0, swagger_1.ApiQuery)({ name: 'resourceId', required: false, example: 123 }),
    (0, swagger_1.ApiQuery)({ name: 'serviceId', required: false, example: 3 }),
    __param(0, (0, common_1.Param)('branchId')),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, get_branch_demand_stats_query_dto_1.GetBranchDemandStatsQueryDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "getDemandStats", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, require_permission_decorator_1.SkipPermissionCheck)(),
    (0, swagger_1.ApiOperation)({ summary: 'Obtener sucursal por id' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/image-upload-signature'),
    (0, require_permission_decorator_1.RequireAnyPermission)('branch.manage', 'business.settings'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generar firma para subir imagen de sucursal a Cloudinary',
    }),
    (0, swagger_1.ApiBody)({ type: create_branch_image_upload_signature_dto_1.CreateBranchImageUploadSignatureDto }),
    (0, swagger_1.ApiResponse)({ status: 201, type: branch_image_upload_signature_dto_1.BranchImageUploadSignatureDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_branch_image_upload_signature_dto_1.CreateBranchImageUploadSignatureDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "createImageUploadSignature", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, require_permission_decorator_1.RequireAnyPermission)('branch.manage', 'business.settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Actualizar informacion editable de una sucursal' }),
    (0, swagger_1.ApiBody)({ type: update_branch_dto_1.UpdateBranchDto }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_branch_dto_1.UpdateBranchDto,
        user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, user_entity_1.User]),
    __metadata("design:returntype", void 0)
], BranchesController.prototype, "remove", null);
exports.BranchesController = BranchesController = __decorate([
    (0, swagger_1.ApiTags)('branches'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, require_permission_decorator_1.RequirePermission)('branch.manage'),
    (0, common_1.Controller)('branches'),
    __metadata("design:paramtypes", [branches_service_1.BranchesService,
        branch_stats_service_1.BranchStatsService])
], BranchesController);
//# sourceMappingURL=branches.controller.js.map