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
exports.BranchImageUploadSignatureDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class BranchImageUploadSignatureDto {
    cloud_name;
    api_key;
    upload_url;
    resource_type;
    timestamp;
    public_id;
    signature;
}
exports.BranchImageUploadSignatureDto = BranchImageUploadSignatureDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'demo' }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "cloud_name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456789012345' }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "api_key", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'https://api.cloudinary.com/v1_1/demo/image/upload' }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "upload_url", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'image' }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "resource_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 1787654321 }),
    __metadata("design:type", Number)
], BranchImageUploadSignatureDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        example: 'turnero/branches/1/2/logo-1787654321',
    }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "public_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'c3d2d4a0a2c4f1b4e8f7c6a5b4d3e2f1a0b9c8d7' }),
    __metadata("design:type", String)
], BranchImageUploadSignatureDto.prototype, "signature", void 0);
//# sourceMappingURL=branch-image-upload-signature.dto.js.map