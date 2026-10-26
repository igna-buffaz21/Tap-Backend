"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoleWithPermissions = exports.RolePermissionDetail = exports.Role = void 0;
const permission_entity_1 = require("../../permissions/entities/permission.entity");
class Role {
    id;
    business_id;
    name;
    description;
    status;
    created_at;
    updated_at;
}
exports.Role = Role;
class RolePermissionDetail extends permission_entity_1.Permission {
    access_scope;
    assigned_at;
}
exports.RolePermissionDetail = RolePermissionDetail;
class RoleWithPermissions extends Role {
    permissions;
}
exports.RoleWithPermissions = RoleWithPermissions;
//# sourceMappingURL=role.entity.js.map