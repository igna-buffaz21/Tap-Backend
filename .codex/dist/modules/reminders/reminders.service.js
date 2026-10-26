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
var RemindersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemindersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const whatsapp_service_service_1 = require("../whatsapp-service/whatsapp-service.service");
const reminders_repository_1 = require("./reminders.repository");
const DEFAULT_WORKER_INTERVAL_MS = 60_000;
const DEFAULT_WORKER_BATCH_SIZE = 10;
const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_STUCK_PROCESSING_MINUTES = 15;
const DEFAULT_TEMPLATE_LANGUAGE = 'es_AR';
const NON_WHATSAPP_SENDER_PHONE_NUMBER_CONFIG_KEY = 'WHATSAPP_BOOKING_RECONFIRMATION_NON_WHATSAPP_SENDER_PHONE_NUMBER';
const RECONFIRMATION_REQUIRED_AFTER_MS = 24 * 60 * 60 * 1000;
const RECONFIRMATION_REMINDER_OFFSET_MS = 3 * 60 * 60 * 1000;
const DEFAULT_TEMPLATE_BODY_PARAMS = [
    'reservationName',
    'businessName',
    'date',
    'time',
    'serviceName',
];
const REMINDER_CONFIRM_BUTTON_PREFIX = 'turnero_reminder_confirm_';
const REMINDER_CANCEL_BUTTON_PREFIX = 'turnero_reminder_cancel_';
const TEMPLATE_PARAMETER_VALUES = {
    bookingId: (reminder) => String(reminder.booking_id),
    businessName: (reminder) => reminder.business_name,
    branchName: (reminder) => reminder.branch_name,
    customerName: (reminder) => reminder.customer_name ?? reminder.reservation_name ?? '',
    reservationName: (reminder) => reminder.reservation_name ?? reminder.customer_name ?? '',
    serviceName: (reminder) => reminder.service_name,
    resourceName: (reminder) => reminder.resource_name,
    date: (reminder, startAt) => new Intl.DateTimeFormat('es-AR', {
        timeZone: reminder.business_timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(startAt),
    time: (reminder, startAt) => new Intl.DateTimeFormat('es-AR', {
        timeZone: reminder.business_timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(startAt),
};
let RemindersService = RemindersService_1 = class RemindersService {
    remindersRepository;
    configService;
    whatsappService;
    logger = new common_1.Logger(RemindersService_1.name);
    workerEnabled;
    workerIntervalMs;
    workerBatchSize;
    maxAttempts;
    stuckProcessingMs;
    templateName;
    templateLanguage;
    templateBodyParams;
    templateButtonsEnabled;
    templateCancelButtonEnabled;
    nonWhatsappSenderPhoneNumber;
    workerTimer = null;
    isWorkerRunning = false;
    constructor(remindersRepository, configService, whatsappService) {
        this.remindersRepository = remindersRepository;
        this.configService = configService;
        this.whatsappService = whatsappService;
        this.workerEnabled = this.getBooleanConfig('REMINDERS_WORKER_ENABLED', true);
        this.workerIntervalMs = this.getPositiveIntegerConfig('REMINDERS_WORKER_INTERVAL_MS', DEFAULT_WORKER_INTERVAL_MS);
        this.workerBatchSize = this.getPositiveIntegerConfig('REMINDERS_WORKER_BATCH_SIZE', DEFAULT_WORKER_BATCH_SIZE);
        this.maxAttempts = this.getPositiveIntegerConfig('REMINDERS_MAX_ATTEMPTS', DEFAULT_MAX_ATTEMPTS);
        this.stuckProcessingMs =
            this.getPositiveIntegerConfig('REMINDERS_STUCK_PROCESSING_MINUTES', DEFAULT_STUCK_PROCESSING_MINUTES) *
                60 *
                1000;
        this.templateName = this.getOptionalStringConfig('WHATSAPP_BOOKING_RECONFIRMATION_TEMPLATE_NAME');
        this.templateLanguage =
            this.getOptionalStringConfig('WHATSAPP_BOOKING_RECONFIRMATION_TEMPLATE_LANGUAGE') ?? DEFAULT_TEMPLATE_LANGUAGE;
        this.templateBodyParams = this.getTemplateBodyParams();
        this.templateButtonsEnabled = this.getBooleanConfig('WHATSAPP_BOOKING_RECONFIRMATION_TEMPLATE_BUTTONS_ENABLED', true);
        this.templateCancelButtonEnabled = this.getBooleanConfig('WHATSAPP_BOOKING_RECONFIRMATION_CANCEL_BUTTON_ENABLED', false);
        this.nonWhatsappSenderPhoneNumber = this.getOptionalStringConfig(NON_WHATSAPP_SENDER_PHONE_NUMBER_CONFIG_KEY);
    }
    onModuleInit() {
        if (!this.workerEnabled) {
            this.logger.log('Reminder worker disabled by configuration');
            return;
        }
        if (!this.templateName) {
            this.logger.warn('Reminder worker not started because WHATSAPP_BOOKING_RECONFIRMATION_TEMPLATE_NAME is not configured');
            return;
        }
        this.workerTimer = setInterval(() => {
            void this.processDueWhatsappReminders();
        }, this.workerIntervalMs);
        void this.processDueWhatsappReminders();
        this.logger.log(`Reminder worker started every ${this.workerIntervalMs}ms with batch size ${this.workerBatchSize}`);
    }
    onModuleDestroy() {
        if (!this.workerTimer) {
            return;
        }
        clearInterval(this.workerTimer);
        this.workerTimer = null;
    }
    findAll(businessIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        return this.remindersRepository.findAll(businessId);
    }
    async findAllForBusiness(currentUser, businessIdValue) {
        const access = await this.resolveBusinessAccess(currentUser, businessIdValue);
        return this.remindersRepository.findAll(access.businessId, access.allowedBranchIds, access.allowedResourceIds);
    }
    findOne(id, businessIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        return this.remindersRepository.findById(id, businessId);
    }
    async findOneForBusiness(id, currentUser, businessIdValue) {
        const reminderId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveBusinessAccess(currentUser, businessIdValue);
        const reminder = await this.remindersRepository.findById(reminderId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!reminder) {
            throw new common_1.NotFoundException('Reminder not found for business');
        }
        return reminder;
    }
    update(id, businessIdValue, updateReminderDto) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        return this.remindersRepository.update(id, businessId, updateReminderDto);
    }
    async updateForBusiness(id, updateReminderDto, currentUser, businessIdValue) {
        const reminderId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveBusinessAccess(currentUser, businessIdValue);
        const updatedReminder = await this.remindersRepository.update(reminderId, access.businessId, updateReminderDto, access.allowedBranchIds, access.allowedResourceIds);
        if (!updatedReminder) {
            throw new common_1.NotFoundException('Reminder not found for business');
        }
        return updatedReminder;
    }
    remove(id, businessIdValue) {
        const businessId = this.parsePositiveInteger(businessIdValue, 'businessId');
        return this.remindersRepository.remove(id, businessId);
    }
    async removeForBusiness(id, currentUser, businessIdValue) {
        const reminderId = this.parsePositiveInteger(id, 'id');
        const access = await this.resolveBusinessAccess(currentUser, businessIdValue);
        const removed = await this.remindersRepository.remove(reminderId, access.businessId, access.allowedBranchIds, access.allowedResourceIds);
        if (!removed) {
            throw new common_1.NotFoundException('Reminder not found for business');
        }
        return { deleted: true };
    }
    async processDueWhatsappReminders() {
        if (this.isWorkerRunning) {
            return;
        }
        if (!this.templateName) {
            return;
        }
        this.isWorkerRunning = true;
        try {
            const now = new Date();
            const recoveredCount = await this.remindersRepository.releaseStuckProcessingReminders(new Date(now.getTime() - this.stuckProcessingMs));
            if (recoveredCount > 0) {
                this.logger.warn(`Recovered ${recoveredCount} stuck reminder processing locks`);
            }
            const repairedCount = await this.remindersRepository.repairMissingWhatsappReconfirmationReminders(RECONFIRMATION_REQUIRED_AFTER_MS, RECONFIRMATION_REMINDER_OFFSET_MS);
            if (repairedCount > 0) {
                this.logger.warn(`Repaired ${repairedCount} missing Whatsapp reconfirmation reminders`);
            }
            const reminders = await this.remindersRepository.claimDueWhatsappReconfirmationReminders(this.workerBatchSize, now);
            for (const reminder of reminders) {
                await this.processWhatsappReminder(reminder, now);
            }
        }
        catch (error) {
            this.logger.error('Error processing due reminders', error instanceof Error ? error.stack : String(error));
        }
        finally {
            this.isWorkerRunning = false;
        }
    }
    parsePositiveInteger(value, fieldName) {
        const parsed = typeof value === 'number'
            ? value
            : typeof value === 'string'
                ? Number(value)
                : NaN;
        if (!Number.isInteger(parsed) || parsed <= 0) {
            throw new common_1.BadRequestException(`${fieldName} must be a positive integer`);
        }
        return parsed;
    }
    async resolveBusinessAccess(currentUser, businessIdValue) {
        const authorization = currentUser.authorization;
        if (!authorization) {
            throw new common_1.ForbiddenException('Authorization context is required');
        }
        if (authorization.isSuperadmin) {
            return {
                businessId: this.parsePositiveInteger(businessIdValue, 'businessId'),
            };
        }
        const accessScope = authorization.permissions['booking.manage'];
        if (!accessScope) {
            throw new common_1.ForbiddenException('Missing permission booking.manage');
        }
        const businessId = this.requireBusinessUserBusinessId(authorization.businessId);
        if (businessIdValue !== undefined) {
            const requestedBusinessId = this.parsePositiveInteger(businessIdValue, 'businessId');
            if (requestedBusinessId !== businessId) {
                throw new common_1.ForbiddenException('Cannot access another business');
            }
        }
        const allowedBranchIds = accessScope === 'business' ? undefined : authorization.branchIds;
        const allowedResourceIds = accessScope === 'own'
            ? await this.remindersRepository.findAssignedResourceIds(authorization.userId, businessId, allowedBranchIds)
            : undefined;
        return {
            businessId,
            allowedBranchIds,
            allowedResourceIds,
        };
    }
    requireBusinessUserBusinessId(businessId) {
        if (businessId === undefined || businessId === null || businessId === '') {
            throw new common_1.ForbiddenException('User must belong to a business');
        }
        return this.parsePositiveInteger(businessId, 'businessId');
    }
    async processWhatsappReminder(reminder, now) {
        try {
            if (!this.isReminderStillActionable(reminder, now)) {
                await this.remindersRepository.markCancelled(reminder.id, 'Booking no longer requires reconfirmation');
                return;
            }
            if (!reminder.customer_phone?.trim()) {
                throw new Error('Customer phone is required to send reminder');
            }
            const senderConfig = this.getReminderSenderConfig(reminder);
            this.logger.log([
                'Sending Whatsapp reconfirmation reminder',
                `reminderId=${reminder.id}`,
                `bookingId=${reminder.booking_id}`,
                `businessId=${reminder.business_id}`,
                `bookingSource=${reminder.booking_source ?? 'null'}`,
                `sender=${senderConfig.logValue}`,
                `templateName=${this.templateName}`,
                `templateLanguage=${this.templateLanguage}`,
            ].join(' '));
            const response = await this.whatsappService.sendMessage({
                ...senderConfig.payload,
                messaging_product: 'whatsapp',
                to: reminder.customer_phone,
                type: 'template',
                template: {
                    name: this.templateName,
                    language: {
                        code: this.templateLanguage,
                    },
                    components: this.buildTemplateComponents(reminder),
                },
            });
            await this.remindersRepository.markSent(reminder.id, response.messages?.[0]?.id ?? null);
        }
        catch (error) {
            const errorMessage = this.truncateErrorMessage(error instanceof Error ? error.message : String(error));
            const updated = await this.remindersRepository.markFailedAttempt(reminder.id, errorMessage, this.maxAttempts);
            this.logger.warn(`Reminder ${reminder.id} failed for booking ${reminder.booking_id}: ${errorMessage}. Status: ${updated?.status ?? 'unknown'}`);
        }
    }
    isReminderStillActionable(reminder, now) {
        const bookingStartAt = this.toDate(reminder.booking_start_at);
        return (reminder.booking_status === 'CONFIRMED' &&
            reminder.booking_confirmation_status === 'pending' &&
            bookingStartAt.getTime() > now.getTime());
    }
    getReminderSenderConfig(reminder) {
        if (reminder.booking_source !== 'WHATSAPP') {
            if (!this.nonWhatsappSenderPhoneNumber) {
                throw new Error(`${NON_WHATSAPP_SENDER_PHONE_NUMBER_CONFIG_KEY} is required for non-WhatsApp booking reminders`);
            }
            return {
                payload: {
                    phoneNumberId: this.nonWhatsappSenderPhoneNumber,
                },
                logValue: `phoneNumber=${this.nonWhatsappSenderPhoneNumber}`,
            };
        }
        if (!reminder.whatsapp_account_id) {
            throw new Error('No active Whatsapp account found for reminder');
        }
        return {
            payload: {
                whatsappAccountId: reminder.whatsapp_account_id,
                businessId: reminder.business_id,
            },
            logValue: `whatsappAccountId=${reminder.whatsapp_account_id}`,
        };
    }
    buildTemplateComponents(reminder) {
        const components = [];
        const startAt = this.toDate(reminder.booking_start_at);
        if (this.templateBodyParams.length > 0) {
            components.push({
                type: 'body',
                parameters: this.templateBodyParams.map((paramName) => ({
                    type: 'text',
                    text: this.getTemplateParamValue(paramName, reminder, startAt),
                })),
            });
        }
        if (this.templateButtonsEnabled) {
            components.push({
                type: 'button',
                sub_type: 'quick_reply',
                index: '0',
                parameters: [
                    {
                        type: 'payload',
                        payload: `${REMINDER_CONFIRM_BUTTON_PREFIX}` +
                            `${reminder.business_id}_${reminder.booking_id}`,
                    },
                ],
            });
            if (this.templateCancelButtonEnabled) {
                components.push({
                    type: 'button',
                    sub_type: 'quick_reply',
                    index: '1',
                    parameters: [
                        {
                            type: 'payload',
                            payload: `${REMINDER_CANCEL_BUTTON_PREFIX}` +
                                `${reminder.business_id}_${reminder.booking_id}`,
                        },
                    ],
                });
            }
        }
        return components.length > 0 ? components : undefined;
    }
    getTemplateParamValue(paramName, reminder, startAt) {
        const resolver = TEMPLATE_PARAMETER_VALUES[paramName];
        if (!resolver) {
            this.logger.warn(`Unknown reminder template parameter "${paramName}". Sending an empty value.`);
            return '';
        }
        return resolver(reminder, startAt);
    }
    getTemplateBodyParams() {
        const configuredParams = this.configService.get('WHATSAPP_BOOKING_RECONFIRMATION_TEMPLATE_BODY_PARAMS');
        if (configuredParams === undefined) {
            return DEFAULT_TEMPLATE_BODY_PARAMS;
        }
        return configuredParams
            .split(',')
            .map((value) => value.trim())
            .filter((value) => value.length > 0);
    }
    getBooleanConfig(key, defaultValue) {
        const value = this.configService.get(key);
        if (value === undefined) {
            return defaultValue;
        }
        return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    getPositiveIntegerConfig(key, defaultValue) {
        const value = this.configService.get(key);
        const parsed = value === undefined ? defaultValue : Number(value);
        return Number.isInteger(parsed) && parsed > 0 ? parsed : defaultValue;
    }
    getOptionalStringConfig(key) {
        const value = this.configService.get(key)?.trim();
        return value && value.length > 0 ? value : null;
    }
    toDate(value) {
        return value instanceof Date ? value : new Date(value);
    }
    truncateErrorMessage(message) {
        return message.length <= 1000 ? message : message.slice(0, 1000);
    }
};
exports.RemindersService = RemindersService;
exports.RemindersService = RemindersService = RemindersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reminders_repository_1.RemindersRepository,
        config_1.ConfigService,
        whatsapp_service_service_1.WhatsappServiceService])
], RemindersService);
//# sourceMappingURL=reminders.service.js.map