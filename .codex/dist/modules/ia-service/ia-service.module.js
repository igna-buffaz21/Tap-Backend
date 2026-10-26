"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IaServiceModule = void 0;
const common_1 = require("@nestjs/common");
const ia_error_logger_service_1 = require("./ia-error-logger.service");
const ia_service_controller_1 = require("./ia-service.controller");
const ia_service_service_1 = require("./ia-service.service");
let IaServiceModule = class IaServiceModule {
};
exports.IaServiceModule = IaServiceModule;
exports.IaServiceModule = IaServiceModule = __decorate([
    (0, common_1.Module)({
        controllers: [ia_service_controller_1.IaServiceController],
        providers: [ia_service_service_1.IaServiceService, ia_error_logger_service_1.IaErrorLoggerService],
        exports: [ia_service_service_1.IaServiceService, ia_error_logger_service_1.IaErrorLoggerService],
    })
], IaServiceModule);
//# sourceMappingURL=ia-service.module.js.map