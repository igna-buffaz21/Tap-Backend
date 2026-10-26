"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentAuthorization = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentAuthorization = (0, common_1.createParamDecorator)((_data, context) => {
    const request = context.switchToHttp().getRequest();
    return request.auth?.authorization;
});
//# sourceMappingURL=current-authorization.decorator.js.map