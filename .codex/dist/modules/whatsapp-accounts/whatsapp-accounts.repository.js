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
exports.WhatsappAccountsRepository = void 0;
const common_1 = require("@nestjs/common");
const database_service_1 = require("../../database/database.service");
const TABLE_NAME = 'whatsapp_account';
const UPDATE_COLUMNS = [
    'business_id',
    'branch_id',
    'phone_number',
    'phone_number_id',
    'waba_id',
    'meta_business_id',
    'access_token',
    'status',
];
const SELECT_COLUMNS = `
  id,
  business_id,
  branch_id,
  phone_number,
  phone_number_id,
  waba_id,
  meta_business_id,
  access_token,
  status,
  created_at,
  updated_at
`;
const ACTIVE_STATUS_CONDITION = `UPPER(status) = 'ACTIVE'`;
let WhatsappAccountsRepository = class WhatsappAccountsRepository {
    databaseService;
    constructor(databaseService) {
        this.databaseService = databaseService;
    }
    async create(createWhatsappAccountDto) {
        const result = await this.databaseService.query(`
        INSERT INTO ${TABLE_NAME} (
          business_id,
          branch_id,
          phone_number,
          phone_number_id,
          waba_id,
          meta_business_id,
          access_token,
          status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING ${SELECT_COLUMNS}
      `, [
            createWhatsappAccountDto.business_id,
            createWhatsappAccountDto.branch_id,
            createWhatsappAccountDto.phone_number,
            createWhatsappAccountDto.phone_number_id ?? null,
            createWhatsappAccountDto.waba_id,
            createWhatsappAccountDto.meta_business_id ?? null,
            createWhatsappAccountDto.access_token,
            createWhatsappAccountDto.status ?? 'ACTIVE',
        ]);
        return result.rows[0];
    }
    async findAll() {
        const result = await this.databaseService.query(`
      SELECT ${SELECT_COLUMNS}
      FROM ${TABLE_NAME}
    `);
        return result.rows;
    }
    async findById(id) {
        const result = await this.databaseService.query(`
        SELECT ${SELECT_COLUMNS}
        FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rows[0] ?? null;
    }
    async findByWebhookReference(displayPhoneNumber, phoneNumberId, wabaId) {
        const normalizedDisplayPhoneNumber = displayPhoneNumber.replace(/\D/g, '');
        const normalizedPhoneNumberId = phoneNumberId.replace(/\D/g, '');
        const result = await this.databaseService.query(`
        SELECT ${SELECT_COLUMNS}
        FROM ${TABLE_NAME}
        WHERE ${ACTIVE_STATUS_CONDITION}
          AND (
            phone_number_id = $1
            OR phone_number = $1
            OR regexp_replace(phone_number, '\\D', '', 'g') = $2
            OR regexp_replace(phone_number, '\\D', '', 'g') = $3
            OR phone_number = $4
            OR waba_id = $5
          )
        ORDER BY
          CASE
            WHEN phone_number_id = $1 THEN 0
            WHEN phone_number = $1 THEN 1
            WHEN regexp_replace(phone_number, '\\D', '', 'g') = $2 THEN 2
            WHEN regexp_replace(phone_number, '\\D', '', 'g') = $3 THEN 3
            WHEN phone_number = $4 THEN 4
            WHEN waba_id = $5 THEN 5
            ELSE 5
          END
        LIMIT 1
      `, [
            phoneNumberId,
            normalizedPhoneNumberId,
            normalizedDisplayPhoneNumber,
            displayPhoneNumber,
            wabaId,
        ]);
        return result.rows[0] ?? null;
    }
    async findByPhoneNumber(phoneNumber) {
        const result = await this.databaseService.query(`
        SELECT ${SELECT_COLUMNS}
        FROM ${TABLE_NAME}
        WHERE phone_number = $1
          AND ${ACTIVE_STATUS_CONDITION}
        LIMIT 1
      `, [phoneNumber]);
        return result.rows[0] ?? null;
    }
    async findActiveById(id) {
        const result = await this.databaseService.query(`
        SELECT ${SELECT_COLUMNS}
        FROM ${TABLE_NAME}
        WHERE id = $1
          AND ${ACTIVE_STATUS_CONDITION}
      `, [id]);
        return result.rows[0] ?? null;
    }
    async findActiveByBusinessId(businessId) {
        const result = await this.databaseService.query(`
        SELECT ${SELECT_COLUMNS}
        FROM ${TABLE_NAME}
        WHERE business_id = $1
          AND ${ACTIVE_STATUS_CONDITION}
        ORDER BY id ASC
      `, [businessId]);
        return result.rows;
    }
    async businessExists(businessId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM business
          WHERE id = $1
        )
      `, [businessId]);
        return result.rows[0]?.exists ?? false;
    }
    async branchBelongsToBusiness(branchId, businessId) {
        const result = await this.databaseService.query(`
        SELECT EXISTS (
          SELECT 1
          FROM branch
          WHERE id = $1
            AND business_id = $2
        )
      `, [branchId, businessId]);
        return result.rows[0]?.exists ?? false;
    }
    async update(id, updateWhatsappAccountDto) {
        const values = [id];
        const assignments = [];
        for (const column of UPDATE_COLUMNS) {
            if (!Object.prototype.hasOwnProperty.call(updateWhatsappAccountDto, column)) {
                continue;
            }
            const value = updateWhatsappAccountDto[column];
            if (value === undefined) {
                continue;
            }
            values.push(value);
            assignments.push(`${column} = $${values.length}`);
        }
        if (assignments.length === 0) {
            return this.findById(id);
        }
        const result = await this.databaseService.query(`
        UPDATE ${TABLE_NAME}
        SET
          ${assignments.join(',\n          ')}
        WHERE id = $1
        RETURNING ${SELECT_COLUMNS}
      `, values);
        return result.rows[0] ?? null;
    }
    async remove(id) {
        const result = await this.databaseService.query(`
        DELETE FROM ${TABLE_NAME}
        WHERE id = $1
      `, [id]);
        return result.rowCount === 1;
    }
};
exports.WhatsappAccountsRepository = WhatsappAccountsRepository;
exports.WhatsappAccountsRepository = WhatsappAccountsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_service_1.DatabaseService])
], WhatsappAccountsRepository);
//# sourceMappingURL=whatsapp-accounts.repository.js.map