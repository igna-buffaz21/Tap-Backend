"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAssignedRole = exports.UserRole = void 0;
const role_entity_1 = require("../../roles/entities/role.entity");
class UserRole {
    user_id;
    role_id;
    created_at;
}
exports.UserRole = UserRole;
class UserAssignedRole extends role_entity_1.Role {
    assigned_at;
}
exports.UserAssignedRole = UserAssignedRole;
//# sourceMappingURL=user-role.entity.js.map