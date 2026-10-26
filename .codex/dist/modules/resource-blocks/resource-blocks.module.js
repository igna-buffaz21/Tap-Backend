"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceBlocksModule = void 0;
const common_1 = require("@nestjs/common");
const resource_blocks_service_1 = require("./resource-blocks.service");
const resource_blocks_controller_1 = require("./resource-blocks.controller");
const resource_blocks_repository_1 = require("./resource-blocks.repository");
let ResourceBlocksModule = class ResourceBlocksModule {
};
exports.ResourceBlocksModule = ResourceBlocksModule;
exports.ResourceBlocksModule = ResourceBlocksModule = __decorate([
    (0, common_1.Module)({
        controllers: [resource_blocks_controller_1.ResourceBlocksController],
        providers: [resource_blocks_service_1.ResourceBlocksService, resource_blocks_repository_1.ResourceBlocksRepository],
    })
], ResourceBlocksModule);
//# sourceMappingURL=resource-blocks.module.js.map