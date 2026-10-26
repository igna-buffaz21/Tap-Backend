"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthModule = void 0;
const common_1 = require("@nestjs/common");
const users_module_1 = require("../users/users.module");
const auth_rbac_repository_1 = require("./auth-rbac.repository");
const auth_controller_1 = require("./auth.controller");
const auth_service_1 = require("./auth.service");
const authorization_scope_service_1 = require("./authorization-scope.service");
const clerk_jwt_service_1 = require("./clerk-jwt.service");
const clerk_auth_guard_1 = require("./guards/clerk-auth.guard");
const permission_guard_1 = require("./guards/permission.guard");
let AuthModule = class AuthModule {
};
exports.AuthModule = AuthModule;
exports.AuthModule = AuthModule = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule],
        controllers: [auth_controller_1.AuthController],
        providers: [
            auth_service_1.AuthService,
            auth_rbac_repository_1.AuthRbacRepository,
            authorization_scope_service_1.AuthorizationScopeService,
            clerk_jwt_service_1.ClerkJwtService,
            clerk_auth_guard_1.ClerkAuthGuard,
            permission_guard_1.PermissionGuard,
        ],
        exports: [
            auth_service_1.AuthService,
            authorization_scope_service_1.AuthorizationScopeService,
            clerk_jwt_service_1.ClerkJwtService,
            clerk_auth_guard_1.ClerkAuthGuard,
            permission_guard_1.PermissionGuard,
        ],
    })
], AuthModule);
//# sourceMappingURL=auth.module.js.map