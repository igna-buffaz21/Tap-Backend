"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserAssignedResource = exports.UserResource = void 0;
const resource_entity_1 = require("../../resources/entities/resource.entity");
class UserResource {
    user_id;
    resource_id;
    created_at;
}
exports.UserResource = UserResource;
class UserAssignedResource extends resource_entity_1.Resource {
    assigned_at;
}
exports.UserAssignedResource = UserAssignedResource;
//# sourceMappingURL=user-resource.entity.js.map