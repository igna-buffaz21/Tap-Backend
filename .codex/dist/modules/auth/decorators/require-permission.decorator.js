"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperadminOnly = exports.SkipPermissionCheck = exports.RequireAnyPermission = exports.RequirePermission = exports.SUPERADMIN_ONLY_KEY = exports.SKIP_PERMISSION_CHECK_KEY = exports.REQUIRED_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.REQUIRED_PERMISSION_KEY = 'requiredPermission';
exports.SKIP_PERMISSION_CHECK_KEY = 'skipPermissionCheck';
exports.SUPERADMIN_ONLY_KEY = 'superadminOnly';
const RequirePermission = (permission) => (0, common_1.SetMetadata)(exports.REQUIRED_PERMISSION_KEY, permission);
exports.RequirePermission = RequirePermission;
const RequireAnyPermission = (...permissions) => (0, common_1.SetMetadata)(exports.REQUIRED_PERMISSION_KEY, permissions);
exports.RequireAnyPermission = RequireAnyPermission;
const SkipPermissionCheck = () => (0, common_1.SetMetadata)(exports.SKIP_PERMISSION_CHECK_KEY, true);
exports.SkipPermissionCheck = SkipPermissionCheck;
const SuperadminOnly = () => (0, common_1.SetMetadata)(exports.SUPERADMIN_ONLY_KEY, true);
exports.SuperadminOnly = SuperadminOnly;
//# sourceMappingURL=require-permission.decorator.js.map