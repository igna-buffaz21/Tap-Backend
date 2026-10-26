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
exports.BusinessesService = void 0;
const common_1 = require("@nestjs/common");
const businesses_repository_1 = require("./businesses.repository");
let BusinessesService = class BusinessesService {
    businessesRepository;
    constructor(businessesRepository) {
        this.businessesRepository = businessesRepository;
    }
    create(createBusinessDto) {
        return this.businessesRepository.create(createBusinessDto);
    }
    findAll() {
        return this.businessesRepository.findAll();
    }
    findOne(id) {
        return this.businessesRepository.findById(id);
    }
    update(id, updateBusinessDto, currentUser) {
        this.assertCanUpdateBusiness(id, currentUser);
        return this.businessesRepository.update(id, updateBusinessDto);
    }
    remove(id) {
        return this.businessesRepository.remove(id);
    }
    assertCanUpdateBusiness(id, currentUser) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return;
        }
        if (authorization.permissions['business.settings'] !== 'business') {
            throw new common_1.ForbiddenException('Business scope is required');
        }
        if (!authorization.businessId) {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        if (authorization.businessId !== id) {
            throw new common_1.ForbiddenException('Cannot access another business');
        }
    }
};
exports.BusinessesService = BusinessesService;
exports.BusinessesService = BusinessesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [businesses_repository_1.BusinessesRepository])
], BusinessesService);
//# sourceMappingURL=businesses.service.js.map