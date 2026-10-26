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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolePermissionsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'role_permission';
let RolePermissionsRepository = class RolePermissionsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async replaceForRole(roleId, permissions, client) {
        await this.query(client, `
        DELETE FROM ${TABLE_NAME}
        WHERE role_id = $1
      `, [roleId]);
        if (permissions.length === 0) {
            return [];
        }
        const values = [];
        const placeholders = permissions.map((permission, index) => {
            const offset = index * 3;
            values.push(roleId, permission.permission_id, permission.access_scope);
            return `($${offset + 1}, $${offset + 2}, $${offset + 3})`;
        });
        const result = await this.query(client, `
        INSERT INTO ${TABLE_NAME} (
          role_id,
          permission_id,
          access_scope
        )
        VALUES ${placeholders.join(', ')}
        RETURNING *
      `, values);
        return result.rows;
    }
    query(client, text, values = []) {
        return client
            ? client.query(text, values)
            : this.databaseService.query(text, values);
    }
};
exports.RolePermissionsRepository = RolePermissionsRepository;
exports.RolePermissionsRepository = RolePermissionsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], RolePermissionsRepository);
//# sourceMappingURL=role-permissions.repository.js.map