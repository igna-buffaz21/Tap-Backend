"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceSchedulesModule = void 0;
const common_1 = require("@nestjs/common");
const resource_schedules_service_1 = require("./resource-schedules.service");
const resource_schedules_controller_1 = require("./resource-schedules.controller");
const resource_schedules_repository_1 = require("./resource-schedules.repository");
let ResourceSchedulesModule = class ResourceSchedulesModule {
};
exports.ResourceSchedulesModule = ResourceSchedulesModule;
exports.ResourceSchedulesModule = ResourceSchedulesModule = __decorate([
    (0, common_1.Module)({
        controllers: [resource_schedules_controller_1.ResourceSchedulesController],
        providers: [resource_schedules_service_1.ResourceSchedulesService, resource_schedules_repository_1.ResourceSchedulesRepository],
    })
], ResourceSchedulesModule);
//# sourceMappingURL=resource-schedules.module.js.map