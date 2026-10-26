"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const webhookIngressLogger = new common_1.Logger('WhatsappWebhookIngress');
    app.enableCors({
        origin: '*',
        credentials: true,
    });
    app.use('/whatsapp/webhook', (request, _response, next) => {
        webhookIngressLogger.log(`${request.method} /whatsapp/webhook content-type=${request.headers['content-type'] ?? 'unknown'} user-agent=${request.headers['user-agent'] ?? 'unknown'}`);
        next();
    });
    const swaggerConfig = new swagger_1.DocumentBuilder()
        .setTitle('HayLugar API')
        .setDescription('Documentación de la API de Hay Lugar')
        .setVersion('1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, swaggerConfig);
    swagger_1.SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
//# sourceMappingURL=main.js.map