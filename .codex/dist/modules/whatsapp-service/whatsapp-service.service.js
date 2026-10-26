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
var WhatsappServiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappServiceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const availability_service_1 = require("../availability/availability.service");
const bookings_service_1 = require("../bookings/bookings.service");
const customers_service_1 = require("../customers/customers.service");
const ia_service_service_1 = require("../ia-service/ia-service.service");
const ia_service_types_1 = require("../ia-service/ia-service.types");
const whatsapp_accounts_service_1 = require("../whatsapp-accounts/whatsapp-accounts.service");
const whatsapp_conversation_entity_1 = require("../whatsapp-conversation/entities/whatsapp-conversation.entity");
const whatsapp_conversation_service_1 = require("../whatsapp-conversation/whatsapp-conversation.service");
const whatsapp_message_entity_1 = require("../whatsapp-message/entities/whatsapp-message.entity");
const whatsapp_message_service_1 = require("../whatsapp-message/whatsapp-message.service");
const timezone_1 = require("../../common/utils/timezone");
const whatsapp_response_templates_1 = require("./whatsapp-response.templates");
const IA_RECENT_MESSAGE_LIMIT = 12;
const MAX_AVAILABILITY_OPTIONS = 10;
const MAX_INTERACTIVE_LIST_ROWS = 10;
const MAX_COMBINED_SERVICE_RESOURCE_OPTIONS = 6;
const DEFAULT_MAX_INBOUND_MESSAGE_AGE_MINUTES = 15;
const CONVERSATION_CONTEXT_SENDER_PHONE_NUMBER_ID = 'senderPhoneNumberId';
const NON_WHATSAPP_SENDER_PHONE_NUMBER_CONFIG_KEY = 'WHATSAPP_BOOKING_RECONFIRMATION_NON_WHATSAPP_SENDER_PHONE_NUMBER';
const REMINDER_RECONFIRMATION_ACTION_PATTERN = /turnero_reminder_(confirm|cancel)_(?:(\d+)_)?(\d+)/;
let WhatsappServiceService = WhatsappServiceService_1 = class WhatsappServiceService {
    configService;
    availabilityService;
    bookingsService;
    customersService;
    iaServiceService;
    whatsappAccountsService;
    whatsappConversationService;
    whatsappMessageService;
    logger = new common_1.Logger(WhatsappServiceService_1.name);
    verifyToken;
    apiVersion;
    maxInboundMessageAgeMs;
    reminderCancelButtonEnabled;
    nonWhatsappReminderSenderPhoneNumber;
    constructor(configService, availabilityService, bookingsService, customersService, iaServiceService, whatsappAccountsService, whatsappConversationService, whatsappMessageService) {
        this.configService = configService;
        this.availabilityService = availabilityService;
        this.bookingsService = bookingsService;
        this.customersService = customersService;
        this.iaServiceService = iaServiceService;
        this.whatsappAccountsService = whatsappAccountsService;
        this.whatsappConversationService = whatsappConversationService;
        this.whatsappMessageService = whatsappMessageService;
        this.verifyToken = this.configService.get('WHATSAPP_VERIFY_TOKEN');
        this.apiVersion = this.configService.get('WHATSAPP_API_VERSION', 'v25.0');
        this.maxInboundMessageAgeMs = this.getMaxInboundMessageAgeMs();
        this.reminderCancelButtonEnabled = this.getBooleanConfig('WHATSAPP_BOOKING_RECONFIRMATION_CANCEL_BUTTON_ENABLED', false);
        this.nonWhatsappReminderSenderPhoneNumber =
            this.configService
                .get(NON_WHATSAPP_SENDER_PHONE_NUMBER_CONFIG_KEY)
                ?.trim() || null;
        if (!this.verifyToken) {
            this.logger.error('WHATSAPP_VERIFY_TOKEN no está configurado en las variables de entorno');
        }
    }
    verifyWebhook(mode, challenge, verifyToken) {
        if (mode === 'subscribe' && verifyToken === this.verifyToken) {
            this.logger.log('Webhook verificado correctamente');
            return challenge;
        }
        this.logger.error('Token de verificación inválido');
        return null;
    }
    async getIaContextSnapshot(conversationId, businessId, messageText) {
        const parsedConversationId = this.parsePositiveIntegerValue(conversationId);
        const parsedBusinessId = this.parsePositiveIntegerValue(businessId);
        if (!parsedConversationId) {
            throw new common_1.BadRequestException('conversationId must be a positive integer');
        }
        if (!parsedBusinessId) {
            throw new common_1.BadRequestException('businessId must be a positive integer');
        }
        const conversation = await this.whatsappConversationService.findById(parsedConversationId, parsedBusinessId);
        if (!conversation) {
            throw new common_1.NotFoundException('Whatsapp conversation not found');
        }
        const recentMessages = await this.buildRecentMessagesForIa(conversation.id, parsedBusinessId);
        return this.buildIaContextSnapshot(conversation, parsedBusinessId, recentMessages, messageText);
    }
    async handleIncomingMessage(payload) {
        try {
            this.logger.log('Webhook de WhatsApp recibido');
            if (payload.object !== 'whatsapp_business_account') {
                return;
            }
            for (const entry of payload.entry) {
                for (const change of entry.changes) {
                    if (change.field === 'messages') {
                        const messages = change.value.messages;
                        const contacts = change.value.contacts || [];
                        const metadata = change.value.metadata;
                        const whatsappAccount = await this.findWhatsappAccountForWebhook(metadata, entry.id);
                        if (!whatsappAccount) {
                            continue;
                        }
                        if (messages && messages.length > 0) {
                            for (const message of messages) {
                                await this.processMessage(message, contacts, metadata, whatsappAccount);
                            }
                        }
                        const statuses = change.value.statuses;
                        if (statuses && statuses.length > 0) {
                            for (const status of statuses) {
                                await this.processMessageStatus(status, whatsappAccount);
                            }
                        }
                    }
                }
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error al procesar mensaje de WhatsApp:', errorMessage);
            throw error;
        }
    }
    async processMessage(message, contacts, metadata, whatsappAccount) {
        try {
            const senderPhoneNumber = message.from ?? contacts?.[0]?.wa_id;
            const senderName = contacts?.[0]?.profile?.name;
            const messageId = message.id;
            const messageType = message.type;
            const messageAt = this.parseWhatsappTimestamp(message.timestamp) ?? new Date();
            if (this.shouldIgnoreWebhookMessage(message)) {
                this.logger.log(`Mensaje ${messageId} de tipo ${messageType} ignorado`);
                return;
            }
            if (this.isStaleInboundMessage(messageAt)) {
                this.logger.warn(`Mensaje ${messageId} ignorado por antiguedad: ${messageAt.toISOString()}`);
                return;
            }
            if (!senderPhoneNumber) {
                this.logger.warn(`Mensaje ${messageId} sin telefono de remitente`);
                return;
            }
            if (await this.handleNonWhatsappReminderSenderMessage(message, metadata, whatsappAccount)) {
                return;
            }
            this.logger.log(`Procesando mensaje ${messageId} de ${senderPhoneNumber}`);
            const customer = await this.customersService.getOrCreateByPhone({
                phone: senderPhoneNumber,
                name: senderName,
            });
            const conversation = await this.whatsappConversationService.getOrCreateActiveConversation({
                whatsappAccountId: whatsappAccount.id,
                businessId: whatsappAccount.business_id,
                branchId: whatsappAccount.branch_id,
                customerId: customer.id,
                lastMessageAt: messageAt,
            });
            const conversationForAccountBranch = await this.syncConversationBranchFromWhatsappAccount(conversation, whatsappAccount);
            await this.storeSenderPhoneNumberIdIfNeeded(conversationForAccountBranch, whatsappAccount.business_id, metadata.phone_number_id);
            const inboundMessageResult = await this.whatsappMessageService.createInboundMessageIfNotExists({
                businessId: whatsappAccount.business_id,
                conversationId: conversationForAccountBranch.id,
                messageType: this.getPersistedInboundMessageType(message),
                providerMessageId: messageId,
                content: this.buildInboundMessageContent(message),
                receivedAt: messageAt,
            });
            if (inboundMessageResult.isDuplicate) {
                this.logger.log([
                    'Mensaje duplicado ignorado despues de insert atomico',
                    `providerMessageId=${messageId}`,
                    `storedMessageId=${inboundMessageResult.message.id}`,
                    `conversationId=${inboundMessageResult.message.conversation_id}`,
                    `createdAt=${inboundMessageResult.message.created_at.toISOString()}`,
                ].join(' '));
                return;
            }
            await this.whatsappConversationService.touchConversation(conversationForAccountBranch.id, whatsappAccount.business_id, messageAt);
            const currentConversation = (await this.whatsappConversationService.findById(conversationForAccountBranch.id, whatsappAccount.business_id)) ?? conversationForAccountBranch;
            const currentConversationWithDefaults = await this.assignSingleActiveServiceBeforeIaIfNeeded(currentConversation, whatsappAccount.business_id, whatsappAccount.branch_id);
            const userMessageText = this.extractUserMessageText(message) ?? '';
            const currentConversationWithPreservedScheduling = await this.preserveSchedulingContextFromMessageIfNeeded(currentConversationWithDefaults, whatsappAccount.business_id, userMessageText, messageAt);
            if (await this.handleLocalConversationActionBeforeIa(message, currentConversationWithPreservedScheduling, senderPhoneNumber, whatsappAccount.business_id)) {
                this.handleSupportedMessage(message, senderPhoneNumber, senderName);
                return;
            }
            await this.interpretTextMessageWithIa(message, currentConversationWithPreservedScheduling, whatsappAccount, senderPhoneNumber);
            this.handleSupportedMessage(message, senderPhoneNumber, senderName);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error al procesar mensaje individual:', errorMessage);
        }
    }
    handleTextMessage(text, phoneNumber, name) {
        this.logger.log(`Mensaje de texto recibido de ${phoneNumber} (${name}): "${text}"`);
    }
    handleSupportedMessage(message, senderPhoneNumber, senderName) {
        const messageType = message.type;
        const displayName = senderName ?? senderPhoneNumber;
        switch (messageType) {
            case 'text':
                this.handleTextMessage(message.text?.body ?? '', senderPhoneNumber, displayName);
                break;
            case 'interactive':
            case 'button':
                this.handleInteractiveMessage(message.type === 'button' ? message.button : message.interactive, senderPhoneNumber, displayName);
                break;
            case 'image':
            case 'document':
            case 'audio':
            case 'video':
                this.handleMediaMessage(messageType, this.getMessageTypedPayload(message, messageType), senderPhoneNumber, displayName);
                break;
            default:
                this.logger.warn(`Tipo de mensaje no soportado: ${messageType}`);
        }
    }
    handleInteractiveMessage(interactive, phoneNumber, name) {
        const interactiveType = this.getRecordStringValue(interactive, 'type');
        this.logger.log(`Mensaje interactivo recibido de ${phoneNumber} (${name}): ${interactiveType ?? 'unknown'}`);
    }
    handleMediaMessage(type, media, phoneNumber, name) {
        const mediaId = this.getRecordStringValue(media, 'id');
        this.logger.log(`Mensaje de ${type} recibido de ${phoneNumber} (${name}): ${mediaId ?? 'unknown'}`);
    }
    async syncConversationBranchFromWhatsappAccount(conversation, whatsappAccount) {
        const accountBranchId = this.parsePositiveIntegerValue(whatsappAccount.branch_id);
        if (!accountBranchId || conversation.branch_id === accountBranchId) {
            return conversation;
        }
        return this.whatsappConversationService.updateConversationState(conversation.id, whatsappAccount.business_id, {
            branchId: accountBranchId,
        });
    }
    shouldIgnoreWebhookMessage(message) {
        return message.type === 'reaction';
    }
    async handleNonWhatsappReminderSenderMessage(message, metadata, whatsappAccount) {
        if (!this.isNonWhatsappReminderSender(metadata, whatsappAccount)) {
            return false;
        }
        const interactiveSelection = this.extractInteractiveSelection(message);
        const action = this.extractReminderReconfirmationAction(interactiveSelection?.id ?? '');
        if (!action) {
            return true;
        }
        const businessId = action.businessId ?? whatsappAccount.business_id;
        try {
            if (action.type === 'confirm') {
                await this.bookingsService.reconfirm(action.bookingId, businessId);
                return true;
            }
            await this.bookingsService.cancelFromReminder(action.bookingId, businessId);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo aplicar accion de recordatorio web booking=${action.bookingId} businessId=${businessId}: ${errorMessage}`);
            return true;
        }
    }
    isNonWhatsappReminderSender(metadata, whatsappAccount) {
        if (!this.nonWhatsappReminderSenderPhoneNumber) {
            return false;
        }
        const configuredValue = this.nonWhatsappReminderSenderPhoneNumber;
        const normalizedConfiguredValue = this.normalizePhoneIdentifier(configuredValue);
        const candidates = [
            metadata.display_phone_number,
            metadata.phone_number_id,
            whatsappAccount.phone_number,
            whatsappAccount.phone_number_id,
        ];
        return candidates.some((candidate) => {
            if (!candidate) {
                return false;
            }
            return (candidate === configuredValue ||
                this.normalizePhoneIdentifier(candidate) === normalizedConfiguredValue);
        });
    }
    getPersistedInboundMessageType(message) {
        return message.type === 'button' ? 'interactive' : message.type;
    }
    async handleLocalConversationActionBeforeIa(message, conversation, senderPhoneNumber, businessId) {
        const messageText = this.extractUserMessageText(message);
        const interactiveSelection = this.extractInteractiveSelection(message);
        if (!messageText) {
            return false;
        }
        if (await this.handleReminderReconfirmationReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection)) {
            return true;
        }
        if (await this.handlePendingCancellationConfirmationReply(conversation, senderPhoneNumber, businessId, messageText)) {
            return true;
        }
        if (await this.handleBookingCancellationSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection)) {
            return true;
        }
        if (await this.completePendingBookingIfConfirmed(conversation, senderPhoneNumber, businessId, messageText)) {
            return true;
        }
        if (this.isStaleBookingSummaryConfirmationReply(messageText)) {
            this.logger.warn(`Confirmacion de reserva sin pendingBooking consumida para conversacion ${conversation.id}`);
            return true;
        }
        if (await this.handlePendingBookingRejection(conversation, senderPhoneNumber, businessId, messageText)) {
            return true;
        }
        if (await this.prepareBookingConfirmationIfSlotSelected(conversation, senderPhoneNumber, businessId, messageText)) {
            return true;
        }
        if (await this.handleAlternativeAvailabilityRequest(conversation, senderPhoneNumber, businessId, messageText)) {
            return true;
        }
        if (await this.handleServiceResourceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection)) {
            return true;
        }
        if (await this.handleServiceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection)) {
            return true;
        }
        if (await this.handleResourceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection)) {
            return true;
        }
        if (!this.shouldLetIaExtractSchedulingContext(messageText) &&
            (await this.promptServiceSelectionBeforeIa(conversation, senderPhoneNumber, businessId, messageText))) {
            return true;
        }
        return false;
    }
    async handleReminderReconfirmationReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection) {
        const action = this.extractReminderReconfirmationAction(interactiveSelection?.id ?? messageText);
        if (!action) {
            return false;
        }
        try {
            const actionBusinessId = action.businessId ?? businessId;
            if (actionBusinessId !== businessId) {
                this.logger.warn(`Accion de recordatorio ignorada por businessId inconsistente booking=${action.bookingId} actionBusinessId=${actionBusinessId} conversationBusinessId=${businessId}`);
                return true;
            }
            if (action.type === 'confirm') {
                await this.bookingsService.reconfirm(action.bookingId, actionBusinessId);
                await this.sendTextMessage(senderPhoneNumber, 'Listo, tu reserva quedó reconfirmada. ¡Te esperamos!', actionBusinessId, conversation.id);
                return true;
            }
            if (!this.reminderCancelButtonEnabled) {
                return false;
            }
            await this.bookingsService.cancelFromReminder(action.bookingId, actionBusinessId);
            await this.sendTextMessage(senderPhoneNumber, 'Listo, cancelamos tu reserva. Gracias por avisarnos.', actionBusinessId, conversation.id);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo aplicar accion de recordatorio booking=${action.bookingId}: ${errorMessage}`);
            await this.sendTextMessage(senderPhoneNumber, 'No pude actualizar esa reserva. Si necesitás ayuda, escribinos y te damos una mano.', businessId, conversation.id);
            return true;
        }
    }
    async handleBookingCancellationSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection) {
        const selectedText = interactiveSelection?.id ?? messageText;
        const selectedBookingId = this.extractInteractiveBookingId(selectedText) ??
            this.getSelectedCustomerBookingIdFromContext(conversation.context, selectedText) ??
            this.getContextPositiveInteger(conversation.context, 'cancelBookingId');
        const isAwaitingCancellation = conversation.context.awaitingBookingCancellation === true;
        if (!isAwaitingCancellation && !selectedBookingId) {
            return false;
        }
        await this.handleCancelBookingAction(conversation, senderPhoneNumber, businessId, selectedText, selectedBookingId);
        return true;
    }
    async handlePendingCancellationConfirmationReply(conversation, senderPhoneNumber, businessId, messageText) {
        if (conversation.context.awaitingBookingCancellationConfirmation !== true) {
            return false;
        }
        const bookingId = this.getContextPositiveInteger(conversation.context, 'pendingCancellationBookingId');
        if (!bookingId) {
            return false;
        }
        if (this.isBookingRejectionMessage(messageText)) {
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                awaitingBookingCancellationConfirmation: null,
                pendingCancellationBookingId: null,
                customerBookings: null,
            });
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingCancellationKept(), businessId, conversation.id);
            return true;
        }
        if (!this.isConfirmationMessage(messageText)) {
            return false;
        }
        await this.cancelAndConfirmCustomerBooking(conversation, senderPhoneNumber, businessId, bookingId);
        return true;
    }
    async handleAlternativeAvailabilityRequest(conversation, senderPhoneNumber, businessId, messageText) {
        if (!this.isAlternativeAvailabilityRequest(messageText)) {
            return false;
        }
        const availabilitySlots = this.getAvailabilitySlotsFromContext(conversation.context);
        if (availabilitySlots.length === 0) {
            return false;
        }
        const selectedSlot = this.getSelectedSlotFromContext(conversation.context);
        const alternativeSlots = selectedSlot
            ? availabilitySlots.filter((slot) => slot.startAt !== selectedSlot.startAt)
            : availabilitySlots;
        const slotsToShow = alternativeSlots.length > 0 ? alternativeSlots : availabilitySlots;
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            selectedSlot: null,
            pendingBooking: null,
        });
        await this.sendAvailabilityOptionsMessage(senderPhoneNumber, slotsToShow.map((slot) => ({
            startsAt: slot.startAt,
            label: `${this.formatSlotTime(slot.startAt)} - ${slot.resourceName}`,
        })), businessId, conversation.id);
        return true;
    }
    async handlePendingBookingRejection(conversation, senderPhoneNumber, businessId, messageText) {
        if (!this.hasPendingBookingSelection(conversation)) {
            return false;
        }
        if (!this.isBookingRejectionMessage(messageText)) {
            return false;
        }
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            selectedSlot: null,
            pendingBooking: null,
            availabilitySearchCriteria: null,
            lastAvailabilitySearch: null,
        });
        await this.whatsappConversationService.completeConversation(conversation.id, businessId);
        await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingRejected(), businessId, conversation.id);
        return true;
    }
    async handleServiceResourceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection) {
        if (this.getContextPositiveInteger(conversation.context, 'serviceId') ||
            this.getContextPositiveInteger(conversation.context, 'resourceId')) {
            return false;
        }
        const branchId = conversation.branch_id;
        if (!branchId) {
            return false;
        }
        const selectedIds = this.extractInteractiveServiceResourceIds(interactiveSelection?.id ?? messageText);
        if (!selectedIds) {
            return false;
        }
        const [selectedService, selectedResource] = await Promise.all([
            this.availabilityService.findActiveServiceForBranch(businessId, branchId, selectedIds.serviceId),
            this.availabilityService.findActiveResourceForService(businessId, branchId, selectedIds.serviceId, selectedIds.resourceId),
        ]);
        if (!selectedService || !selectedResource) {
            this.logger.warn(`No se pudo resolver seleccion combinada para conversacion ${conversation.id}: serviceId=${selectedIds.serviceId}, resourceId=${selectedIds.resourceId}`);
            return false;
        }
        const updatedConversation = await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            serviceResourceSelectionMode: selectedService.resource_selection_mode,
            resourceId: selectedResource.id,
            resourceName: selectedResource.name,
            awaitingServiceSelection: null,
            awaitingServiceResourceSelection: null,
            awaitingResourceSelection: null,
            serviceResourceOptions: null,
            resourceOptions: null,
            availabilitySlots: null,
            selectedSlot: null,
            pendingBooking: null,
            availabilitySearchCriteria: null,
            lastAvailabilitySearch: null,
        });
        if (this.getContextString(updatedConversation.context, 'date')) {
            await this.handleSearchAvailabilityAction(updatedConversation, senderPhoneNumber, businessId);
            return true;
        }
        await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askDateAndTime(), businessId, conversation.id);
        return true;
    }
    async handleServiceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection) {
        if (this.getContextPositiveInteger(conversation.context, 'serviceId')) {
            return false;
        }
        const branchId = conversation.branch_id;
        if (!branchId) {
            await this.sendTextMessage(senderPhoneNumber, 'Para que sede queres consultar disponibilidad?', businessId, conversation.id);
            return true;
        }
        const selectedServiceId = this.extractInteractiveEntityId(interactiveSelection?.id ?? messageText, 'service');
        const selectedService = selectedServiceId
            ? await this.availabilityService.findActiveServiceForBranch(businessId, branchId, selectedServiceId)
            : await this.findSelectedServiceByText(businessId, branchId, interactiveSelection?.text ?? messageText);
        if (!selectedService) {
            if (interactiveSelection) {
                this.logger.warn(`No se pudo resolver seleccion interactiva de servicio para conversacion ${conversation.id}: id=${interactiveSelection.id ?? 'null'}, title=${interactiveSelection.title ?? 'null'}, description=${interactiveSelection.description ?? 'null'}`);
            }
            return false;
        }
        const updatedConversation = await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            serviceId: selectedService.id,
            serviceName: selectedService.name,
            serviceResourceSelectionMode: selectedService.resource_selection_mode,
            awaitingServiceSelection: null,
            awaitingResourceSelection: null,
            resourceId: null,
            resourceName: null,
            availabilitySlots: null,
            selectedSlot: null,
            pendingBooking: null,
            availabilitySearchCriteria: null,
            lastAvailabilitySearch: null,
        });
        if (selectedService.resource_selection_mode === 'REQUIRED') {
            await this.sendRequiredResourceSelection(updatedConversation, senderPhoneNumber, businessId, selectedService.id, selectedService.name);
            return true;
        }
        if (this.getContextString(updatedConversation.context, 'date')) {
            await this.handleSearchAvailabilityAction(updatedConversation, senderPhoneNumber, businessId);
            return true;
        }
        await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askDateAndTime(), businessId, conversation.id);
        return true;
    }
    async handleResourceSelectionReply(conversation, senderPhoneNumber, businessId, messageText, interactiveSelection) {
        const branchId = conversation.branch_id;
        const serviceId = this.getContextPositiveInteger(conversation.context, 'serviceId');
        const currentResourceId = this.getContextPositiveInteger(conversation.context, 'resourceId');
        const serviceName = this.getContextString(conversation.context, 'serviceName') ?? 'servicio';
        if (!branchId) {
            await this.sendTextMessage(senderPhoneNumber, 'Para que sede queres consultar disponibilidad?', businessId, conversation.id);
            return true;
        }
        if (!serviceId) {
            const prompted = await this.promptServiceSelectionBeforeIa(conversation, senderPhoneNumber, businessId, messageText);
            if (!prompted) {
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askService(), businessId, conversation.id);
            }
            return true;
        }
        if (currentResourceId) {
            return false;
        }
        const selectedResourceId = this.extractInteractiveEntityId(interactiveSelection?.id ?? messageText, 'resource');
        const shouldResolveResourceByText = !selectedResourceId &&
            (interactiveSelection !== null ||
                conversation.context.awaitingResourceSelection === true);
        if (!selectedResourceId && !shouldResolveResourceByText) {
            return false;
        }
        const selectedResource = selectedResourceId
            ? await this.availabilityService.findActiveResourceForService(businessId, branchId, serviceId, selectedResourceId)
            : shouldResolveResourceByText
                ? await this.findSelectedResourceByText(businessId, branchId, serviceId, interactiveSelection?.text ?? messageText)
                : null;
        if (!selectedResource) {
            const resources = await this.availabilityService.findEligibleResourcesForService(businessId, branchId, serviceId);
            if (interactiveSelection) {
                this.logger.warn(`No se pudo resolver seleccion interactiva de recurso para conversacion ${conversation.id}: id=${interactiveSelection.id ?? 'null'}, title=${interactiveSelection.title ?? 'null'}, description=${interactiveSelection.description ?? 'null'}, serviceId=${serviceId}`);
            }
            if (resources.length > 0) {
                await this.sendResourceOptionsMessage(senderPhoneNumber, serviceName, resources, businessId, conversation.id);
            }
            else {
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.noResourcesForService(), businessId, conversation.id);
            }
            return true;
        }
        const updatedConversation = await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            resourceId: selectedResource.id,
            resourceName: selectedResource.name,
            awaitingResourceSelection: null,
            availabilitySlots: null,
            selectedSlot: null,
            pendingBooking: null,
            availabilitySearchCriteria: null,
            lastAvailabilitySearch: null,
        });
        if (this.getContextString(updatedConversation.context, 'date')) {
            await this.handleSearchAvailabilityAction(updatedConversation, senderPhoneNumber, businessId);
            return true;
        }
        await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askDateAndTime(), businessId, conversation.id);
        return true;
    }
    async promptServiceSelectionBeforeIa(conversation, senderPhoneNumber, businessId, messageText) {
        if (!this.shouldPromptServiceSelectionBeforeIa(conversation, messageText)) {
            return false;
        }
        const conversationWithSchedulingContext = await this.preserveSchedulingContextFromMessageIfNeeded(conversation, businessId, messageText);
        if (this.getContextPositiveInteger(conversationWithSchedulingContext.context, 'serviceId')) {
            return false;
        }
        const branchId = conversationWithSchedulingContext.branch_id;
        if (!branchId) {
            return false;
        }
        const services = await this.getSelectableServicesForBranch(businessId, branchId);
        if (services.length <= 1) {
            return false;
        }
        const serviceResourceOptions = await this.getSelectableServiceResourceOptionsForBranch(businessId, branchId);
        if (serviceResourceOptions.length > 0 &&
            serviceResourceOptions.length <= MAX_COMBINED_SERVICE_RESOURCE_OPTIONS) {
            await this.whatsappConversationService.updateContext(conversationWithSchedulingContext.id, businessId, {
                awaitingServiceResourceSelection: true,
                awaitingServiceSelection: null,
                serviceResourceOptions: this.toJsonValue(serviceResourceOptions.map((option) => ({
                    serviceId: option.service_id,
                    serviceName: option.service_name,
                    serviceDurationMinutes: option.service_duration_minutes,
                    serviceResourceSelectionMode: option.service_resource_selection_mode,
                    resourceId: option.resource_id,
                    resourceName: option.resource_name,
                    resourcePriority: option.resource_priority,
                    resourceIsIndoor: option.resource_is_indoor,
                }))),
                resourceId: null,
                resourceName: null,
                availabilitySlots: null,
                selectedSlot: null,
                pendingBooking: null,
                availabilitySearchCriteria: null,
                lastAvailabilitySearch: null,
            });
            await this.sendServiceResourceOptionsMessage(senderPhoneNumber, serviceResourceOptions, businessId, conversationWithSchedulingContext.id);
            return true;
        }
        await this.whatsappConversationService.updateContext(conversationWithSchedulingContext.id, businessId, {
            awaitingServiceSelection: true,
            serviceOptions: this.toJsonValue(services.map((service) => ({
                id: service.id,
                name: service.name,
                durationMinutes: service.duration_minutes,
                resourceSelectionMode: service.resource_selection_mode,
            }))),
            resourceId: null,
            resourceName: null,
            availabilitySlots: null,
            selectedSlot: null,
            pendingBooking: null,
            availabilitySearchCriteria: null,
            lastAvailabilitySearch: null,
        });
        await this.sendServiceOptionsMessage(senderPhoneNumber, services, businessId, conversationWithSchedulingContext.id);
        return true;
    }
    async preserveSchedulingContextFromMessageIfNeeded(conversation, businessId, messageText, referenceInstant = new Date()) {
        if (messageText.trim().length === 0) {
            return conversation;
        }
        const inferredSchedulingPatch = await this.inferSchedulingContextPatchFromMessage(messageText, businessId, {
            currentContext: conversation.context,
            referenceInstant,
        });
        const contextPatch = this.buildSchedulingContextUpdatePatch(conversation.context, inferredSchedulingPatch);
        if (Object.keys(contextPatch).length === 0) {
            return conversation;
        }
        this.logger.log(`Contexto fecha/hora preservado antes de seleccionar servicio: conversation=${conversation.id}, date=${typeof contextPatch.date === 'string' ? contextPatch.date : 'sin-cambios'}, timePreference=${this.isRecord(contextPatch.timePreference) ? `${contextPatch.timePreference.type}:${contextPatch.timePreference.time}` : 'sin-cambios'}`);
        return this.whatsappConversationService.updateContext(conversation.id, businessId, contextPatch);
    }
    async inferSchedulingContextPatchFromMessage(messageText, businessId, options = {}) {
        const contextPatch = {};
        const inferredDate = await this.inferRequestedDateFromMessage(messageText, businessId, options);
        const inferredTimePreference = this.inferRequestedTimePreferenceFromMessage(messageText);
        if (inferredDate) {
            contextPatch.date = inferredDate;
        }
        if (inferredTimePreference) {
            contextPatch.timePreference = inferredTimePreference;
        }
        return contextPatch;
    }
    buildSchedulingContextUpdatePatch(currentContext, schedulingPatch) {
        const contextPatch = {};
        let changedScheduling = false;
        const date = typeof schedulingPatch.date === 'string' ? schedulingPatch.date : null;
        const timePreference = schedulingPatch.timePreference;
        if (date && this.getContextString(currentContext, 'date') !== date) {
            contextPatch.date = date;
            changedScheduling = true;
        }
        if (this.isRecord(timePreference) &&
            typeof timePreference.type === 'string' &&
            typeof timePreference.time === 'string' &&
            (this.getContextTimePreferenceType(currentContext) !==
                timePreference.type ||
                this.getContextTimePreferenceTime(currentContext) !==
                    timePreference.time)) {
            contextPatch.timePreference = {
                type: timePreference.type,
                time: timePreference.time,
            };
            changedScheduling = true;
        }
        if (changedScheduling && this.hasBookingSelectionContext(currentContext)) {
            contextPatch.availabilitySlots = null;
            contextPatch.selectedSlot = null;
            contextPatch.pendingBooking = null;
            contextPatch.availabilitySearchCriteria = null;
            contextPatch.lastAvailabilitySearch = null;
        }
        return contextPatch;
    }
    hasSchedulingContextPatch(contextPatch) {
        return (typeof contextPatch.date === 'string' ||
            this.isRecord(contextPatch.timePreference));
    }
    mergeIaContextPatchWithLocalScheduling(iaContextPatch, localSchedulingPatch, currentContext) {
        if (!this.hasSchedulingContextPatch(localSchedulingPatch)) {
            return iaContextPatch;
        }
        return {
            ...iaContextPatch,
            ...localSchedulingPatch,
            ...this.buildSchedulingContextUpdatePatch(currentContext, localSchedulingPatch),
        };
    }
    async inferRequestedDateFromMessage(messageText, businessId, options = {}) {
        const normalizedText = this.normalizeHumanText(messageText);
        const today = await this.getBusinessLocalToday(businessId, options.referenceInstant);
        const pendingBookingDate = options.currentContext &&
            this.hasBookingSelectionContext(options.currentContext)
            ? this.getContextLocalDate(options.currentContext, 'date')
            : null;
        const relativeDateBase = pendingBookingDate ?? today;
        const explicitDate = this.extractExplicitDate(normalizedText, today);
        if (explicitDate) {
            return explicitDate;
        }
        if (/\bpasado manana\b/.test(normalizedText)) {
            return this.formatLocalDate((0, timezone_1.addDays)(relativeDateBase, 2));
        }
        if (/\bmanana\b/.test(normalizedText)) {
            return this.formatLocalDate((0, timezone_1.addDays)(relativeDateBase, 1));
        }
        if (/\bhoy\b/.test(normalizedText)) {
            return this.formatLocalDate(today);
        }
        return this.inferWeekdayDateFromMessage(normalizedText, today);
    }
    async getBusinessLocalToday(businessId, referenceInstant = new Date()) {
        const business = await this.availabilityService.getBusinessOrFail(businessId);
        return (0, timezone_1.getLocalDateFromInstant)(referenceInstant, business.timezone);
    }
    extractExplicitDate(normalizedText, today) {
        const isoMatch = /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/.exec(normalizedText);
        if (isoMatch) {
            const date = {
                year: Number(isoMatch[1]),
                month: Number(isoMatch[2]),
                day: Number(isoMatch[3]),
            };
            return this.isValidLocalDate(date) ? this.formatLocalDate(date) : null;
        }
        const dayMonthMatch = /\b([0-3]?\d)[/-]([01]?\d)(?:[/-](\d{2,4}))?\b/.exec(normalizedText);
        if (!dayMonthMatch) {
            return null;
        }
        let year = dayMonthMatch[3] ? Number(dayMonthMatch[3]) : today.year;
        if (year < 100) {
            year += 2000;
        }
        let date = {
            year,
            month: Number(dayMonthMatch[2]),
            day: Number(dayMonthMatch[1]),
        };
        if (!this.isValidLocalDate(date)) {
            return null;
        }
        if (!dayMonthMatch[3] && this.compareLocalDates(date, today) < 0) {
            date = {
                ...date,
                year: date.year + 1,
            };
        }
        return this.formatLocalDate(date);
    }
    inferWeekdayDateFromMessage(normalizedText, today) {
        const weekdayByName = {
            domingo: 0,
            lunes: 1,
            martes: 2,
            miercoles: 3,
            jueves: 4,
            viernes: 5,
            sabado: 6,
        };
        const match = /\b(?:el|este|esta|para|proximo|proxima)?\s*(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/.exec(normalizedText);
        if (!match) {
            return null;
        }
        const targetDayOfWeek = weekdayByName[match[1]];
        const currentDayOfWeek = (0, timezone_1.getDayOfWeek)(today);
        let daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        const hasNextModifier = /\b(proximo|proxima)\b/.test(normalizedText) ||
            new RegExp(`\\b${match[1]}\\s+que\\s+viene\\b`).test(normalizedText);
        if (daysToAdd === 0 && hasNextModifier) {
            daysToAdd = 7;
        }
        return this.formatLocalDate((0, timezone_1.addDays)(today, daysToAdd));
    }
    inferRequestedTimePreferenceFromMessage(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        const timeCue = 'a partir de las|a partir de|desde las|desde|despues de las|despues de|tipo|cerca de las|alrededor de las|a eso de las|a las|las';
        const cuedMatch = new RegExp(`\\b(${timeCue})\\s*([01]?\\d|2[0-3])(?:(?::|\\.)([0-5]\\d))?\\b`).exec(normalizedText);
        const suffixedMatch = /\b([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d)|\s*h?s)\b/.exec(normalizedText);
        const match = cuedMatch ?? suffixedMatch;
        if (!match) {
            return null;
        }
        const prefix = cuedMatch?.[1] ?? '';
        const hour = Number(cuedMatch?.[2] ?? suffixedMatch?.[1]);
        const minute = cuedMatch?.[3] ?? suffixedMatch?.[2] ?? '00';
        const type = /\b(a partir|desde|despues)\b/.test(prefix)
            ? 'FROM'
            : /\b(tipo|cerca de las|alrededor de las|a eso de las)\b/.test(prefix)
                ? 'AROUND'
                : 'EXACT';
        return {
            type,
            time: `${String(hour).padStart(2, '0')}:${minute}`,
        };
    }
    isValidLocalDate(date) {
        const utcDate = new Date(Date.UTC(date.year, date.month - 1, date.day));
        return (utcDate.getUTCFullYear() === date.year &&
            utcDate.getUTCMonth() === date.month - 1 &&
            utcDate.getUTCDate() === date.day);
    }
    compareLocalDates(left, right) {
        return (Date.UTC(left.year, left.month - 1, left.day) -
            Date.UTC(right.year, right.month - 1, right.day));
    }
    formatLocalDate(date) {
        return `${String(date.year).padStart(4, '0')}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
    }
    shouldPromptServiceSelectionBeforeIa(conversation, messageText) {
        if (conversation.intent !== whatsapp_conversation_entity_1.WhatsappConversationIntent.UNKNOWN &&
            conversation.intent !== whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING) {
            return false;
        }
        const normalizedText = this.normalizeHumanText(messageText);
        return !/\b(cancelar|cancela|cancelame|anular|anula|borrar|ver|mostrar|consultar|mis turnos|mis reservas|reserva existente|cambiar|cambio|reprogramar|mover|soporte|humano|persona|ayuda)\b/.test(normalizedText);
    }
    shouldLetIaExtractSchedulingContext(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return (this.extractRequestedTime(messageText) !== null ||
            /\b(hoy|manana|pasado manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|finde|semana|fecha|dia|turno)\b/.test(normalizedText) ||
            /\b\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?\b/.test(normalizedText));
    }
    async sendRequiredResourceSelection(conversation, senderPhoneNumber, businessId, serviceId, serviceName) {
        const branchId = conversation.branch_id;
        if (!branchId) {
            await this.sendTextMessage(senderPhoneNumber, 'Para que sede queres consultar disponibilidad?', businessId, conversation.id);
            return;
        }
        const resources = await this.availabilityService.findEligibleResourcesForService(businessId, branchId, serviceId);
        if (resources.length === 0) {
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                awaitingResourceSelection: null,
                resourceOptions: null,
            });
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.noResourcesForService(), businessId, conversation.id);
            return;
        }
        if (resources.length === 1) {
            const selectedResource = resources[0];
            const updatedConversation = await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                resourceId: selectedResource.id,
                resourceName: selectedResource.name,
                awaitingResourceSelection: null,
                resourceOptions: null,
            });
            if (this.getContextString(updatedConversation.context, 'date')) {
                await this.handleSearchAvailabilityAction(updatedConversation, senderPhoneNumber, businessId);
                return;
            }
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askDateAndTime(), businessId, conversation.id);
            return;
        }
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            awaitingResourceSelection: true,
            resourceOptions: this.toJsonValue(resources.slice(0, MAX_INTERACTIVE_LIST_ROWS).map((resource) => ({
                id: resource.id,
                name: resource.name,
                priority: resource.priority,
                isIndoor: resource.is_indoor,
            }))),
        });
        await this.sendResourceOptionsMessage(senderPhoneNumber, serviceName, resources, businessId, conversation.id);
    }
    async getSelectableServicesForBranch(businessId, branchId) {
        return this.availabilityService.findActiveServicesForBranch(businessId, branchId, MAX_INTERACTIVE_LIST_ROWS);
    }
    async getSelectableServiceResourceOptionsForBranch(businessId, branchId) {
        return this.availabilityService.findActiveServiceResourceOptionsForBranch(businessId, branchId, MAX_COMBINED_SERVICE_RESOURCE_OPTIONS + 1);
    }
    async findSelectedServiceByText(businessId, branchId, messageText) {
        const services = await this.getSelectableServicesForBranch(businessId, branchId);
        return this.findSelectedServiceFromMessage(services, messageText);
    }
    async findSelectedResourceByText(businessId, branchId, serviceId, messageText) {
        const resources = await this.availabilityService.findEligibleResourcesForService(businessId, branchId, serviceId);
        return this.findSelectedResourceFromMessage(resources, messageText);
    }
    async interpretTextMessageWithIa(message, conversation, whatsappAccount, senderPhoneNumber) {
        const messageText = this.extractUserMessageText(message);
        if (!messageText) {
            return;
        }
        try {
            const conversationWithDefaultService = await this.assignSingleActiveServiceBeforeIaIfNeeded(conversation, whatsappAccount.business_id, whatsappAccount.branch_id);
            const recentMessages = await this.buildRecentMessagesForIa(conversationWithDefaultService.id, whatsappAccount.business_id);
            const iaContextSnapshot = this.buildIaContextSnapshot(conversationWithDefaultService, whatsappAccount.business_id, recentMessages, messageText);
            this.logger.debug(`Contexto IA conversacion ${conversationWithDefaultService.id}: date=${this.getContextString(conversationWithDefaultService.context, 'date') ?? 'null'}, serviceId=${this.getContextPositiveInteger(conversationWithDefaultService.context, 'serviceId') ?? 'null'}, availabilitySlots=${this.getAvailabilitySlotsFromContext(conversationWithDefaultService.context).length}`);
            this.logger.debug(`Payload IA: ${JSON.stringify(iaContextSnapshot)}`);
            const interpretation = await this.iaServiceService.interpretWhatsappMessage({
                messageText,
                currentIntent: conversationWithDefaultService.intent,
                currentStatus: conversationWithDefaultService.status,
                currentContext: conversationWithDefaultService.context,
                businessId: whatsappAccount.business_id,
                branchId: conversationWithDefaultService.branch_id,
                recentMessages,
            });
            const localSchedulingPatch = await this.inferSchedulingContextPatchFromMessage(messageText, whatsappAccount.business_id, {
                currentContext: conversationWithDefaultService.context,
                referenceInstant: this.parseWhatsappTimestamp(message.timestamp) ?? new Date(),
            });
            const contextPatch = this.mergeIaContextPatchWithLocalScheduling(interpretation.contextPatch, localSchedulingPatch, conversationWithDefaultService.context);
            const updatedConversation = await this.whatsappConversationService.updateConversationState(conversationWithDefaultService.id, whatsappAccount.business_id, {
                intent: interpretation.intent,
                status: interpretation.status,
                context: contextPatch,
            });
            this.logger.log(`IA interpreto mensaje ${message.id}: intent=${interpretation.intent}, nextAction=${interpretation.nextAction}, confidence=${interpretation.confidence}`);
            await this.handleInterpretedConversationAction(interpretation, updatedConversation, senderPhoneNumber, whatsappAccount.business_id, messageText);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo interpretar con IA el mensaje ${message.id}: ${errorMessage}`);
        }
    }
    async assignSingleActiveServiceBeforeIaIfNeeded(conversation, businessId, whatsappAccountBranchId) {
        let updatedConversation = conversation;
        const accountBranchId = this.parsePositiveIntegerValue(whatsappAccountBranchId);
        if (accountBranchId && updatedConversation.branch_id !== accountBranchId) {
            updatedConversation =
                await this.whatsappConversationService.updateConversationState(updatedConversation.id, businessId, {
                    branchId: accountBranchId,
                });
        }
        if (!updatedConversation.branch_id) {
            const singleBranch = await this.availabilityService.findSingleActiveBranchForBusiness(businessId);
            if (!singleBranch) {
                this.logger.debug(`No se precarga servicio unico para conversacion ${conversation.id}: whatsapp_account.branch_id=null y no hay exactamente una sede activa`);
                return updatedConversation;
            }
            updatedConversation =
                await this.whatsappConversationService.updateConversationState(updatedConversation.id, businessId, {
                    branchId: singleBranch.id,
                });
        }
        if (!updatedConversation.branch_id) {
            this.logger.debug(`No se precarga servicio unico para conversacion ${updatedConversation.id}: branch_id=null`);
            return updatedConversation;
        }
        const existingServiceId = this.getContextPositiveInteger(updatedConversation.context, 'serviceId');
        if (existingServiceId) {
            const existingService = await this.availabilityService.findActiveServiceForBranch(businessId, updatedConversation.branch_id, existingServiceId);
            if (existingService) {
                return this.whatsappConversationService.updateContext(updatedConversation.id, businessId, {
                    serviceId: existingService.id,
                    serviceName: existingService.name,
                    serviceResourceSelectionMode: existingService.resource_selection_mode,
                    awaitingServiceSelection: null,
                    awaitingServiceResourceSelection: null,
                    awaitingResourceSelection: existingService.resource_selection_mode === 'REQUIRED'
                        ? updatedConversation.context.awaitingResourceSelection
                        : null,
                });
            }
        }
        const activeServices = await this.availabilityService.findActiveServicesForBranch(businessId, updatedConversation.branch_id, 2);
        this.logger.log(`Servicios activos para precarga: business_id=${businessId}, branch_id=${updatedConversation.branch_id}, count=${activeServices.length}, services=${activeServices
            .map((service) => `${service.id}:${service.name}`)
            .join('|')}`);
        if (activeServices.length !== 1) {
            this.logger.debug(`No se precarga servicio unico para conversacion ${updatedConversation.id}: no hay exactamente un servicio activo en branch_id=${updatedConversation.branch_id}`);
            return updatedConversation;
        }
        const singleService = activeServices[0];
        return this.whatsappConversationService.updateContext(updatedConversation.id, businessId, {
            serviceId: singleService.id,
            serviceName: singleService.name,
            serviceResourceSelectionMode: singleService.resource_selection_mode,
            awaitingServiceSelection: null,
            awaitingServiceResourceSelection: null,
        });
    }
    async buildRecentMessagesForIa(conversationId, businessId) {
        const messages = await this.whatsappMessageService.findRecentByConversationId(conversationId, businessId, IA_RECENT_MESSAGE_LIMIT);
        return messages.map((message) => this.formatMessageForIa(message));
    }
    buildIaContextSnapshot(conversation, businessId, recentMessages, messageText) {
        return {
            messageText: messageText ?? null,
            businessId,
            branchId: conversation.branch_id,
            currentConversation: {
                id: conversation.id,
                intent: conversation.intent,
                status: conversation.status,
                context: conversation.context,
            },
            recentMessages,
        };
    }
    formatMessageForIa(message) {
        const speaker = message.direction === whatsapp_message_entity_1.WhatsappMessageDirection.INBOUND
            ? 'Cliente'
            : 'Turnero';
        const text = this.extractTextFromMessageContent(message.content);
        if (text) {
            return `${speaker}: ${text}`;
        }
        return `${speaker}: [${message.message_type}]`;
    }
    extractTextFromMessageContent(content) {
        const textValue = content.text;
        if (typeof textValue === 'string') {
            return textValue;
        }
        if (this.isRecord(textValue) && typeof textValue.body === 'string') {
            return textValue.body;
        }
        const interactiveValue = content.interactive;
        if (this.isRecord(interactiveValue)) {
            const listReply = interactiveValue.list_reply;
            const buttonReply = interactiveValue.button_reply;
            const reply = this.isRecord(listReply)
                ? listReply
                : this.isRecord(buttonReply)
                    ? buttonReply
                    : null;
            if (reply) {
                const title = typeof reply.title === 'string' ? reply.title : null;
                const id = typeof reply.id === 'string' ? reply.id : null;
                return [title, id].filter(Boolean).join(' ');
            }
            const body = interactiveValue.body;
            if (this.isRecord(body) && typeof body.text === 'string') {
                return body.text;
            }
        }
        const buttonValue = content.button;
        if (this.isRecord(buttonValue)) {
            const text = typeof buttonValue.text === 'string' ? buttonValue.text : null;
            const payload = typeof buttonValue.payload === 'string' ? buttonValue.payload : null;
            return [text, payload].filter(Boolean).join(' ') || null;
        }
        return null;
    }
    extractUserMessageText(message) {
        if (message.type === 'text' && message.text?.body) {
            return message.text.body;
        }
        if (message.type === 'button') {
            return ([message.button?.text, message.button?.payload]
                .filter(Boolean)
                .join(' ') || null);
        }
        if (message.type !== 'interactive') {
            return null;
        }
        const reply = message.interactive?.list_reply ?? message.interactive?.button_reply;
        if (!reply) {
            return null;
        }
        return [reply.title, reply.id].filter(Boolean).join(' ') || null;
    }
    extractInteractiveSelection(message) {
        if (message.type === 'button') {
            const id = typeof message.button?.payload === 'string'
                ? message.button.payload
                : null;
            const title = typeof message.button?.text === 'string' ? message.button.text : null;
            const text = [id, title].filter(Boolean).join(' ');
            return {
                id,
                title,
                description: null,
                text,
            };
        }
        if (message.type !== 'interactive') {
            return null;
        }
        const reply = message.interactive?.list_reply ?? message.interactive?.button_reply;
        if (!reply) {
            return null;
        }
        const id = typeof reply.id === 'string' ? reply.id : null;
        const title = typeof reply.title === 'string' ? reply.title : null;
        const description = typeof reply.description === 'string' ? reply.description : null;
        const text = [id, title, description].filter(Boolean).join(' ');
        return {
            id,
            title,
            description,
            text,
        };
    }
    async handleInterpretedConversationAction(interpretation, conversation, senderPhoneNumber, businessId, messageText) {
        if (await this.completePendingBookingIfConfirmed(conversation, senderPhoneNumber, businessId, messageText)) {
            return;
        }
        if (await this.prepareBookingConfirmationIfSlotSelected(conversation, senderPhoneNumber, businessId, messageText)) {
            return;
        }
        if (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.VIEW_BOOKINGS ||
            interpretation.intent === whatsapp_conversation_entity_1.WhatsappConversationIntent.VIEW_BOOKINGS) {
            await this.handleViewBookingsAction(conversation, senderPhoneNumber, businessId);
            return;
        }
        if (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.CANCEL_BOOKING ||
            interpretation.intent === whatsapp_conversation_entity_1.WhatsappConversationIntent.CANCEL_BOOKING) {
            await this.handleCancelBookingAction(conversation, senderPhoneNumber, businessId, messageText);
            return;
        }
        if (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.SEARCH_AVAILABILITY) {
            await this.handleSearchAvailabilityAction(conversation, senderPhoneNumber, businessId);
            return;
        }
        const replyText = (0, whatsapp_response_templates_1.buildDeterministicWhatsappReply)(interpretation);
        if (await this.resolveSingleServiceClarificationAndContinue(interpretation, conversation, senderPhoneNumber, businessId, replyText)) {
            return;
        }
        if (await this.promptServiceSelectionAfterIaIfNeeded(interpretation, conversation, senderPhoneNumber, businessId, messageText, replyText)) {
            return;
        }
        if (!replyText) {
            this.logger.log(`Sin respuesta automatica para nextAction=${interpretation.nextAction}; queda pendiente del motor conversacional`);
            return;
        }
        try {
            await this.sendTextMessage(senderPhoneNumber, replyText, businessId, conversation.id);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo enviar respuesta automatica para conversacion ${conversation.id}: ${errorMessage}`);
        }
    }
    async resolveSingleServiceClarificationAndContinue(interpretation, conversation, senderPhoneNumber, businessId, replyText) {
        if (this.getContextPositiveInteger(conversation.context, 'serviceId')) {
            return false;
        }
        const missingFields = new Set(interpretation.missingFields.map((field) => field.toLowerCase()));
        const isMissingService = missingFields.has('service') ||
            missingFields.has('serviceid') ||
            missingFields.has('servicio');
        const isAskingService = replyText?.trim() === whatsapp_response_templates_1.whatsappResponseTemplates.askService();
        const isBookingFlow = interpretation.intent === whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING ||
            interpretation.nextAction ===
                ia_service_types_1.IaConversationNextAction.ASK_CLARIFICATION ||
            isMissingService ||
            isAskingService;
        if (!isBookingFlow) {
            return false;
        }
        if (!conversation.branch_id) {
            const conversationWithDefaults = await this.assignSingleActiveServiceBeforeIaIfNeeded(conversation, businessId);
            if (!this.getContextPositiveInteger(conversationWithDefaults.context, 'serviceId')) {
                return false;
            }
            await this.handleSearchAvailabilityAction(conversationWithDefaults, senderPhoneNumber, businessId);
            return true;
        }
        const singleService = await this.availabilityService.findSingleActiveServiceForBranch(businessId, conversation.branch_id);
        if (!singleService) {
            return false;
        }
        const updatedConversation = await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            serviceId: singleService.id,
            serviceName: singleService.name,
            serviceResourceSelectionMode: singleService.resource_selection_mode,
            awaitingServiceSelection: null,
            awaitingServiceResourceSelection: null,
        });
        await this.handleSearchAvailabilityAction(updatedConversation, senderPhoneNumber, businessId);
        return true;
    }
    async promptServiceSelectionAfterIaIfNeeded(interpretation, conversation, senderPhoneNumber, businessId, messageText, replyText) {
        if (this.getContextPositiveInteger(conversation.context, 'serviceId')) {
            return false;
        }
        const missingFields = new Set(interpretation.missingFields.map((field) => field.toLowerCase()));
        const isMissingService = missingFields.has('service') ||
            missingFields.has('serviceid') ||
            missingFields.has('servicio');
        const isAskingService = replyText?.trim() === whatsapp_response_templates_1.whatsappResponseTemplates.askService();
        if (!isMissingService && !isAskingService) {
            return false;
        }
        return this.promptServiceSelectionBeforeIa(conversation, senderPhoneNumber, businessId, messageText);
    }
    async handleViewBookingsAction(conversation, senderPhoneNumber, businessId) {
        try {
            const bookings = await this.findUpcomingCustomerBookings(conversation, businessId);
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                awaitingBookingCancellation: null,
                customerBookings: this.toJsonValue(bookings.map((booking) => this.toCustomerBookingContext(booking))),
            });
            if (bookings.length === 0) {
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.customerBookingsEmpty(), businessId, conversation.id);
                return;
            }
            await this.sendTextMessage(senderPhoneNumber, this.formatCustomerBookingsMessage(bookings), businessId, conversation.id);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudieron listar reservas para conversacion ${conversation.id}: ${errorMessage}`);
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.error(), businessId, conversation.id);
        }
    }
    async handleCancelBookingAction(conversation, senderPhoneNumber, businessId, messageText, selectedBookingId) {
        try {
            const cancellation = await this.bookingsService.resolveCustomerCancellation({
                businessId,
                customerId: conversation.customer_id,
                branchId: conversation.branch_id ?? undefined,
                date: this.getContextString(conversation.context, 'date') ?? undefined,
                limit: 5,
                messageText,
                selectedBookingId: selectedBookingId ??
                    this.extractInteractiveBookingId(messageText) ??
                    undefined,
            });
            if (cancellation.action === 'NO_ACTIVE_BOOKINGS') {
                await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                    awaitingBookingCancellation: null,
                    awaitingBookingCancellationConfirmation: null,
                    customerBookings: null,
                    cancelBookingId: null,
                    pendingCancellationBookingId: null,
                });
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.customerBookingsEmpty(), businessId, conversation.id);
                return;
            }
            if (cancellation.action === 'CANCELLED') {
                await this.clearCancellationContext(conversation, businessId, cancellation.booking.id);
                await this.whatsappConversationService.completeConversation(conversation.id, businessId);
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingCancellationConfirmed(this.toBookingSummaryData(cancellation.booking)), businessId, conversation.id);
                return;
            }
            if (cancellation.action === 'CONFIRM_CANCELLATION') {
                await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                    awaitingBookingCancellation: null,
                    awaitingBookingCancellationConfirmation: true,
                    pendingCancellationBookingId: cancellation.booking.id,
                    customerBookings: this.toJsonValue(cancellation.bookings.map((booking) => this.toCustomerBookingContext(booking))),
                    cancelBookingId: null,
                });
                await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingCancellationConfirmationQuestion(this.toBookingSummaryData(cancellation.booking)), businessId, conversation.id);
                return;
            }
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                awaitingBookingCancellation: true,
                awaitingBookingCancellationConfirmation: null,
                customerBookings: this.toJsonValue(cancellation.bookings.map((booking) => this.toCustomerBookingContext(booking))),
                cancelBookingId: null,
                pendingCancellationBookingId: null,
            });
            await this.sendCustomerBookingOptionsMessage(senderPhoneNumber, cancellation.bookings, businessId, conversation.id, whatsapp_response_templates_1.whatsappResponseTemplates.cancelBookingSelectionBody());
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo cancelar reserva para conversacion ${conversation.id}: ${errorMessage}`);
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.error(), businessId, conversation.id);
        }
    }
    async findUpcomingCustomerBookings(conversation, businessId) {
        return this.bookingsService.findUpcomingForCustomer({
            businessId,
            customerId: conversation.customer_id,
            branchId: conversation.branch_id ?? undefined,
            date: this.getContextString(conversation.context, 'date') ?? undefined,
            limit: 5,
        });
    }
    async cancelAndConfirmCustomerBooking(conversation, senderPhoneNumber, businessId, bookingId) {
        const cancelledBooking = await this.bookingsService.cancelActiveForCustomer({
            bookingId,
            businessId,
            customerId: conversation.customer_id,
        });
        await this.clearCancellationContext(conversation, businessId, cancelledBooking.id);
        await this.whatsappConversationService.completeConversation(conversation.id, businessId);
        await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingCancellationConfirmed(this.toBookingSummaryData(cancelledBooking)), businessId, conversation.id);
    }
    async clearCancellationContext(conversation, businessId, cancelledBookingId = null) {
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            awaitingBookingCancellation: null,
            awaitingBookingCancellationConfirmation: null,
            customerBookings: null,
            cancelBookingId: null,
            pendingCancellationBookingId: null,
            cancelledBookingId,
        });
    }
    async handleSearchAvailabilityAction(conversation, senderPhoneNumber, businessId) {
        const branchId = conversation.branch_id;
        let serviceId = this.getContextPositiveInteger(conversation.context, 'serviceId');
        let resourceId = this.getContextPositiveInteger(conversation.context, 'resourceId');
        const date = this.getContextString(conversation.context, 'date');
        const resourcePreferenceIsIndoor = this.getContextResourcePreferenceIsIndoor(conversation.context);
        if (!branchId) {
            await this.sendTextMessage(senderPhoneNumber, 'Para que sede queres consultar disponibilidad?', businessId, conversation.id);
            return;
        }
        if (!serviceId) {
            const singleService = await this.availabilityService.findSingleActiveServiceForBranch(businessId, branchId);
            if (!singleService) {
                const prompted = await this.promptServiceSelectionBeforeIa(conversation, senderPhoneNumber, businessId, whatsapp_response_templates_1.whatsappResponseTemplates.askService());
                if (!prompted) {
                    await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askService(), businessId, conversation.id);
                }
                return;
            }
            serviceId = singleService.id;
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                serviceId: singleService.id,
                serviceName: singleService.name,
                serviceResourceSelectionMode: singleService.resource_selection_mode,
            });
        }
        if (!resourceId) {
            const resourceName = this.getContextString(conversation.context, 'resourceName');
            const matchedResource = resourceName
                ? await this.findEligibleResourceByName(businessId, branchId, serviceId, resourceName, resourcePreferenceIsIndoor)
                : null;
            if (matchedResource) {
                resourceId = matchedResource.id;
                await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                    resourceId: matchedResource.id,
                    resourceName: matchedResource.name,
                });
            }
        }
        if (!date) {
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askDate(), businessId, conversation.id);
            return;
        }
        try {
            const availability = await this.availabilityService.findAvailability({
                businessId: String(businessId),
                branchId: String(branchId),
                serviceId: String(serviceId),
                date,
                resourceId: resourceId ? String(resourceId) : undefined,
                resourceIsIndoor: resourcePreferenceIsIndoor,
            });
            const resourceSelectionMode = availability.service.resourceSelectionMode;
            const timePreferenceType = this.getContextTimePreferenceType(conversation.context);
            const preferredTime = this.getContextTimePreferenceTime(conversation.context);
            const exactPreferredTime = this.getContextExactTimePreferenceTime(conversation.context);
            const selectedSlots = this.selectAvailabilitySlots(availability, preferredTime, timePreferenceType);
            const formattedSelectedSlots = selectedSlots.map((slot) => ({
                startsAt: slot.startAt,
                label: `${this.formatSlotTime(slot.startAt)} - ${slot.resourceName}`,
            }));
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                availabilitySlots: selectedSlots.map((slot) => ({
                    resourceId: slot.resourceId,
                    resourceName: slot.resourceName,
                    resourcePriority: slot.resourcePriority,
                    resourceIsIndoor: slot.resourceIsIndoor,
                    startAt: slot.startAt,
                    endAt: slot.endAt,
                })),
                lastAvailabilitySearch: {
                    branchId,
                    date: availability.date,
                    serviceId: availability.service.id,
                    serviceName: availability.service.name,
                    resourceId,
                    timePreference: this.toJsonValue(this.getAvailabilitySearchCriteriaTimePreference(conversation.context)),
                    resourceSelectionMode,
                },
                availabilitySearchCriteria: this.toJsonValue(this.buildAvailabilitySearchCriteria(conversation.context, branchId, serviceId, resourceId, date)),
                serviceResourceSelectionMode: resourceSelectionMode,
            });
            if (exactPreferredTime) {
                const requestedSlots = availability.slots.filter((slot) => this.formatSlotTime(slot.startAt) === exactPreferredTime);
                const requestedSlot = requestedSlots[0];
                if (requestedSlot) {
                    if (resourceSelectionMode === 'REQUIRED' && !resourceId) {
                        await this.sendAvailabilityOptionsMessage(senderPhoneNumber, requestedSlots.map((slot) => ({
                            startsAt: slot.startAt,
                            label: `${this.formatSlotTime(slot.startAt)} - ${slot.resourceName}`,
                        })), businessId, conversation.id, 'Tengo disponibilidad en ese horario. Elegí con qué opción querés reservar 👇');
                        return;
                    }
                    await this.handleAvailableRequestedTimeSlot(conversation, senderPhoneNumber, businessId, {
                        resourceId: requestedSlot.resourceId,
                        resourceName: requestedSlot.resourceName,
                        resourcePriority: requestedSlot.resourcePriority,
                        resourceIsIndoor: requestedSlot.resourceIsIndoor,
                        startAt: requestedSlot.startAt,
                        endAt: requestedSlot.endAt,
                    }, availability.service.id, availability.service.name, exactPreferredTime);
                    return;
                }
                if (formattedSelectedSlots.length > 0) {
                    await this.sendAvailabilityOptionsMessage(senderPhoneNumber, formattedSelectedSlots, businessId, conversation.id, whatsapp_response_templates_1.whatsappResponseTemplates.requestedTimeUnavailableListBody(exactPreferredTime));
                }
                else {
                    await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.requestedTimeUnavailable(exactPreferredTime, formattedSelectedSlots), businessId, conversation.id);
                }
                return;
            }
            await this.sendAvailabilityOptionsMessage(senderPhoneNumber, formattedSelectedSlots, businessId, conversation.id);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo consultar disponibilidad para conversacion ${conversation.id}: ${errorMessage}`);
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.error(), businessId, conversation.id);
        }
    }
    async prepareBookingConfirmationIfSlotSelected(conversation, senderPhoneNumber, businessId, messageText) {
        if (this.getPendingBookingFromContext(conversation.context)) {
            return false;
        }
        const availabilitySlots = this.getAvailabilitySlotsFromContext(conversation.context);
        if (availabilitySlots.length === 0) {
            return false;
        }
        if (!this.storedAvailabilitySearchMatchesCurrentContext(conversation)) {
            return false;
        }
        const storedSelectedSlot = this.getSelectedSlotFromContext(conversation.context);
        const explicitSelectedSlot = this.findSelectedAvailabilitySlot(messageText, availabilitySlots);
        if (this.isAlternativeAvailabilityRequest(messageText) &&
            !explicitSelectedSlot) {
            return false;
        }
        const selectedSlot = explicitSelectedSlot ?? storedSelectedSlot;
        if (!selectedSlot) {
            return false;
        }
        const reservationName = await this.resolveReservationName(conversation, messageText, Boolean(storedSelectedSlot));
        if (!reservationName) {
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                selectedSlot: this.toJsonValue(selectedSlot),
            });
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askName(), businessId, conversation.id);
            return true;
        }
        const serviceId = this.getContextPositiveInteger(conversation.context, 'serviceId');
        const serviceName = this.getContextString(conversation.context, 'serviceName') ?? 'Cancha';
        if (!serviceId) {
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askService(), businessId, conversation.id);
            return true;
        }
        const pendingBooking = {
            resourceId: selectedSlot.resourceId,
            resourceName: selectedSlot.resourceName,
            serviceId,
            serviceName,
            startAt: selectedSlot.startAt,
            endAt: selectedSlot.endAt,
            reservationName,
        };
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            customerName: reservationName,
            reservationName,
            selectedSlot: this.toJsonValue(selectedSlot),
            pendingBooking: this.toJsonValue(pendingBooking),
        });
        await this.sendBookingConfirmationMessage(senderPhoneNumber, {
            customerName: reservationName,
            serviceName,
            date: selectedSlot.startAt.slice(0, 10),
            time: this.formatSlotTime(selectedSlot.startAt),
            resourceName: selectedSlot.resourceName,
        }, businessId, conversation.id);
        return true;
    }
    async handleAvailableRequestedTimeSlot(conversation, senderPhoneNumber, businessId, selectedSlot, serviceId, serviceName, requestedTime) {
        const reservationName = await this.resolveReservationName(conversation, '', false);
        if (!reservationName) {
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                selectedSlot: this.toJsonValue(selectedSlot),
            });
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.requestedTimeAvailableAskName(requestedTime), businessId, conversation.id);
            return;
        }
        const pendingBooking = {
            resourceId: selectedSlot.resourceId,
            resourceName: selectedSlot.resourceName,
            serviceId,
            serviceName,
            startAt: selectedSlot.startAt,
            endAt: selectedSlot.endAt,
            reservationName,
        };
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            selectedSlot: this.toJsonValue(selectedSlot),
            customerName: reservationName,
            reservationName,
            pendingBooking: this.toJsonValue(pendingBooking),
        });
        await this.sendBookingConfirmationMessage(senderPhoneNumber, {
            customerName: reservationName,
            serviceName,
            date: selectedSlot.startAt.slice(0, 10),
            time: this.formatSlotTime(selectedSlot.startAt),
            resourceName: selectedSlot.resourceName,
        }, businessId, conversation.id);
    }
    async completePendingBookingIfConfirmed(conversation, senderPhoneNumber, businessId, messageText) {
        if (!this.isConfirmationMessage(messageText)) {
            return false;
        }
        const pendingBooking = this.getPendingBookingFromContext(conversation.context);
        if (!pendingBooking || !conversation.branch_id) {
            this.logger.warn([
                'Whatsapp booking confirmation ignored because pending booking context is missing',
                `conversationId=${conversation.id}`,
                `businessId=${businessId}`,
                `hasPendingBooking=${pendingBooking !== null}`,
                `branchId=${conversation.branch_id ?? 'null'}`,
            ].join(' '));
            return false;
        }
        try {
            this.logger.log([
                'Whatsapp booking confirmation received, creating booking',
                `conversationId=${conversation.id}`,
                `businessId=${businessId}`,
                `branchId=${conversation.branch_id}`,
                `customerId=${conversation.customer_id}`,
                `serviceId=${pendingBooking.serviceId}`,
                `resourceId=${pendingBooking.resourceId}`,
                `startAt=${pendingBooking.startAt}`,
            ].join(' '));
            const booking = await this.bookingsService.create({
                businessId,
                branchId: conversation.branch_id,
                resourceId: pendingBooking.resourceId,
                serviceId: pendingBooking.serviceId,
                customerId: conversation.customer_id,
                startAt: pendingBooking.startAt,
                source: 'WHATSAPP',
                reservationName: pendingBooking.reservationName,
                notes: `Reserva por WhatsApp a nombre de ${pendingBooking.reservationName}`,
            });
            await this.whatsappConversationService.updateContext(conversation.id, businessId, {
                bookingId: booking.id,
                pendingBooking: null,
                selectedSlot: null,
                availabilitySlots: null,
                availabilitySearchCriteria: null,
                lastAvailabilitySearch: null,
            });
            await this.whatsappConversationService.completeConversation(conversation.id, businessId);
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.bookingConfirmed(), businessId, conversation.id);
            return true;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo crear reserva para conversacion ${conversation.id}: ${errorMessage}`);
            await this.sendTextMessage(senderPhoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.error(), businessId, conversation.id);
            return true;
        }
    }
    selectAvailabilitySlots(availability, preferredTime, preferenceType) {
        const slots = [...availability.slots];
        if (!preferredTime) {
            return slots.slice(0, MAX_AVAILABILITY_OPTIONS);
        }
        const preferredMinutes = this.parseHourMinuteToMinutes(preferredTime);
        if (preferredMinutes === null) {
            return slots.slice(0, MAX_AVAILABILITY_OPTIONS);
        }
        if (preferenceType === 'FROM') {
            return slots
                .filter((slot) => {
                const slotMinutes = this.parseSlotStartToMinutes(slot.startAt);
                return slotMinutes !== null && slotMinutes >= preferredMinutes;
            })
                .sort((left, right) => left.startAt.localeCompare(right.startAt))
                .slice(0, MAX_AVAILABILITY_OPTIONS);
        }
        return slots
            .sort((left, right) => {
            const leftMinutes = this.parseSlotStartToMinutes(left.startAt);
            const rightMinutes = this.parseSlotStartToMinutes(right.startAt);
            const leftDistance = leftMinutes === null
                ? Number.MAX_SAFE_INTEGER
                : Math.abs(leftMinutes - preferredMinutes);
            const rightDistance = rightMinutes === null
                ? Number.MAX_SAFE_INTEGER
                : Math.abs(rightMinutes - preferredMinutes);
            if (leftDistance !== rightDistance) {
                return leftDistance - rightDistance;
            }
            return left.startAt.localeCompare(right.startAt);
        })
            .slice(0, MAX_AVAILABILITY_OPTIONS);
    }
    getContextPositiveInteger(context, key) {
        return this.parsePositiveIntegerValue(context[key]);
    }
    parsePositiveIntegerValue(value) {
        const parsedValue = typeof value === 'string' ? Number(value) : value;
        if (typeof parsedValue !== 'number' || !Number.isInteger(parsedValue)) {
            return null;
        }
        return parsedValue > 0 ? parsedValue : null;
    }
    getContextString(context, key) {
        const value = context[key];
        if (typeof value !== 'string' || value.trim().length === 0) {
            return null;
        }
        return value.trim();
    }
    getContextLocalDate(context, key) {
        const value = this.getContextString(context, key);
        return value ? (0, timezone_1.parseDateOnly)(value) : null;
    }
    buildAvailabilitySearchCriteria(context, branchId, serviceId, resourceId, date) {
        return {
            branchId,
            serviceId,
            resourceId,
            date,
            timePreference: this.getAvailabilitySearchCriteriaTimePreference(context),
        };
    }
    getAvailabilitySearchCriteriaTimePreference(context) {
        const time = this.getContextTimePreferenceTime(context);
        if (!time) {
            return null;
        }
        return {
            type: this.getContextTimePreferenceType(context),
            time,
        };
    }
    storedAvailabilitySearchMatchesCurrentContext(conversation) {
        const storedCriteria = this.getStoredAvailabilitySearchCriteria(conversation.context);
        if (!storedCriteria) {
            return false;
        }
        const currentCriteria = this.buildAvailabilitySearchCriteria(conversation.context, conversation.branch_id, this.getContextPositiveInteger(conversation.context, 'serviceId'), this.getContextPositiveInteger(conversation.context, 'resourceId'), this.getContextString(conversation.context, 'date'));
        return this.availabilitySearchCriteriaEqual(storedCriteria, currentCriteria);
    }
    getStoredAvailabilitySearchCriteria(context) {
        const criteria = context.availabilitySearchCriteria;
        if (this.isRecord(criteria)) {
            return this.normalizeAvailabilitySearchCriteria(criteria);
        }
        const lastAvailabilitySearch = context.lastAvailabilitySearch;
        return this.isRecord(lastAvailabilitySearch)
            ? this.normalizeAvailabilitySearchCriteria(lastAvailabilitySearch)
            : null;
    }
    normalizeAvailabilitySearchCriteria(value) {
        const date = typeof value.date === 'string' ? value.date : null;
        const timePreference = this.normalizeAvailabilitySearchTimePreference(value.timePreference);
        return {
            branchId: this.parsePositiveIntegerValue(value.branchId),
            serviceId: this.parsePositiveIntegerValue(value.serviceId),
            resourceId: this.parsePositiveIntegerValue(value.resourceId),
            date,
            timePreference,
        };
    }
    normalizeAvailabilitySearchTimePreference(value) {
        if (!this.isRecord(value)) {
            return null;
        }
        const time = typeof value.time === 'string' ? value.time : null;
        if (!time) {
            return null;
        }
        return {
            type: typeof value.type === 'string' ? value.type : null,
            time,
        };
    }
    availabilitySearchCriteriaEqual(left, right) {
        return (left.branchId === right.branchId &&
            left.serviceId === right.serviceId &&
            left.resourceId === right.resourceId &&
            left.date === right.date &&
            this.availabilitySearchTimePreferenceEqual(left.timePreference, right.timePreference));
    }
    availabilitySearchTimePreferenceEqual(left, right) {
        if (!left || !right) {
            return left === right;
        }
        return left.type === right.type && left.time === right.time;
    }
    getContextTimePreferenceTime(context) {
        const timePreference = context.timePreference;
        if (!this.isRecord(timePreference)) {
            return null;
        }
        return typeof timePreference.time === 'string' ? timePreference.time : null;
    }
    getContextTimePreferenceType(context) {
        const timePreference = context.timePreference;
        if (!this.isRecord(timePreference)) {
            return null;
        }
        return typeof timePreference.type === 'string' ? timePreference.type : null;
    }
    getContextExactTimePreferenceTime(context) {
        const timePreference = context.timePreference;
        if (!this.isRecord(timePreference)) {
            return null;
        }
        if (timePreference.type !== 'EXACT') {
            return null;
        }
        return typeof timePreference.time === 'string' ? timePreference.time : null;
    }
    getContextResourcePreferenceIsIndoor(context) {
        const resourcePreferences = context.resourcePreferences;
        if (!this.isRecord(resourcePreferences)) {
            return undefined;
        }
        return typeof resourcePreferences.isIndoor === 'boolean'
            ? resourcePreferences.isIndoor
            : undefined;
    }
    async findEligibleResourceByName(businessId, branchId, serviceId, resourceName, resourcePreferenceIsIndoor) {
        const resources = await this.availabilityService.findEligibleResourcesForService(businessId, branchId, serviceId, {
            isIndoor: resourcePreferenceIsIndoor,
        });
        const normalizedResourceName = this.normalizeHumanText(resourceName);
        const matchedResource = resources.find((resource) => {
            const normalizedCandidate = this.normalizeHumanText(resource.name);
            return (normalizedCandidate === normalizedResourceName ||
                normalizedCandidate.includes(normalizedResourceName) ||
                normalizedResourceName.includes(normalizedCandidate));
        });
        if (!matchedResource) {
            return null;
        }
        return matchedResource;
    }
    isAlternativeAvailabilityRequest(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return /\b(otro|otros|otra|otras|alternativa|alternativas|opciones|horarios|disponibles|sino|si no)\b/.test(normalizedText);
    }
    getAvailabilitySlotsFromContext(context) {
        const availabilitySlots = context.availabilitySlots;
        if (!Array.isArray(availabilitySlots)) {
            return [];
        }
        return availabilitySlots
            .map((slot) => this.normalizeAvailabilitySlot(slot))
            .filter((slot) => slot !== null);
    }
    getSelectedSlotFromContext(context) {
        const selectedSlot = context.selectedSlot;
        if (typeof selectedSlot !== 'object' ||
            selectedSlot === null ||
            Array.isArray(selectedSlot)) {
            return null;
        }
        return this.normalizeAvailabilitySlot(selectedSlot);
    }
    normalizeAvailabilitySlot(value) {
        if (!this.isRecord(value)) {
            return null;
        }
        const resourceId = this.parsePositiveIntegerValue(value.resourceId);
        const resourceName = typeof value.resourceName === 'string' ? value.resourceName : null;
        const resourcePriority = this.parsePositiveIntegerValue(value.resourcePriority);
        const resourceIsIndoor = typeof value.resourceIsIndoor === 'boolean' ||
            value.resourceIsIndoor === null
            ? value.resourceIsIndoor
            : undefined;
        const startAt = typeof value.startAt === 'string' ? value.startAt : null;
        const endAt = typeof value.endAt === 'string' ? value.endAt : null;
        if (!resourceId || !resourceName || !startAt || !endAt) {
            return null;
        }
        return {
            resourceId,
            resourceName,
            resourcePriority: resourcePriority ?? undefined,
            resourceIsIndoor,
            startAt,
            endAt,
        };
    }
    findSelectedAvailabilitySlot(messageText, availabilitySlots) {
        const requestedTime = this.extractRequestedTime(messageText);
        if (requestedTime) {
            const slotByTime = availabilitySlots.find((slot) => this.formatSlotTime(slot.startAt) === requestedTime);
            if (slotByTime) {
                return slotByTime;
            }
        }
        const ordinalIndex = this.extractSelectedOrdinalIndex(messageText);
        if (ordinalIndex !== null &&
            ordinalIndex >= 0 &&
            ordinalIndex < availabilitySlots.length) {
            return availabilitySlots[ordinalIndex];
        }
        return null;
    }
    extractInteractiveEntityId(messageText, entity) {
        const normalizedIdentifierText = messageText.replace(/\\/g, '');
        const match = new RegExp(`\\b(?:turnero[_-])?${entity}[_-]([1-9]\\d*)\\b`, 'i').exec(normalizedIdentifierText);
        if (!match) {
            return null;
        }
        return Number(match[1]);
    }
    extractInteractiveBookingId(messageText) {
        const normalizedIdentifierText = messageText.replace(/\\/g, '');
        const match = /\bturnero[_-]booking[_-]([1-9]\d*)\b/i.exec(normalizedIdentifierText);
        if (!match) {
            return null;
        }
        return Number(match[1]);
    }
    extractReminderReconfirmationAction(messageText) {
        const normalizedIdentifierText = messageText.replace(/\\/g, '');
        const match = REMINDER_RECONFIRMATION_ACTION_PATTERN.exec(normalizedIdentifierText);
        if (!match) {
            return null;
        }
        return {
            type: match[1] === 'confirm' ? 'confirm' : 'cancel',
            businessId: match[2] ? Number(match[2]) : null,
            bookingId: Number(match[3]),
        };
    }
    extractInteractiveServiceResourceIds(messageText) {
        const normalizedIdentifierText = messageText.replace(/\\/g, '');
        const match = /\bturnero[_-]service[_-]([1-9]\d*)[_-]resource[_-]([1-9]\d*)\b/i.exec(normalizedIdentifierText);
        if (!match) {
            return null;
        }
        return {
            serviceId: Number(match[1]),
            resourceId: Number(match[2]),
        };
    }
    findSelectedServiceFromMessage(services, messageText) {
        const selectedServiceId = this.extractInteractiveEntityId(messageText, 'service');
        if (selectedServiceId) {
            return (services.find((service) => service.id === selectedServiceId) ?? null);
        }
        const matchedServiceId = this.findBestTextMatchedOptionId(services.map((service) => ({
            id: service.id,
            name: service.name,
            extraLabels: [`${service.name} ${service.duration_minutes} min`],
        })), messageText);
        return matchedServiceId
            ? (services.find((service) => service.id === matchedServiceId) ?? null)
            : null;
    }
    findSelectedResourceFromMessage(resources, messageText) {
        const selectedResourceId = this.extractInteractiveEntityId(messageText, 'resource');
        if (selectedResourceId) {
            return (resources.find((resource) => resource.id === selectedResourceId) ?? null);
        }
        const matchedResourceId = this.findBestTextMatchedOptionId(resources.map((resource) => ({
            id: resource.id,
            name: resource.name,
        })), messageText);
        return matchedResourceId
            ? (resources.find((resource) => resource.id === matchedResourceId) ??
                null)
            : null;
    }
    findBestTextMatchedOptionId(options, messageText) {
        const normalizedMessage = this.normalizeHumanText(messageText);
        const matchedOptions = options
            .map((option) => {
            const normalizedName = this.normalizeHumanText(option.name);
            const normalizedLabels = [
                normalizedName,
                this.normalizeHumanText(this.truncateInteractiveText(option.name, 24)),
                ...(option.extraLabels ?? []).map((label) => this.normalizeHumanText(label)),
            ].filter((label, index, labels) => label && labels.indexOf(label) === index);
            const exactMatch = normalizedLabels.some((label) => normalizedMessage === label);
            const containsMatch = normalizedLabels.some((label) => normalizedMessage.includes(label));
            if (exactMatch) {
                return { id: option.id, score: 1_000 + normalizedName.length };
            }
            if (containsMatch) {
                return { id: option.id, score: 100 + normalizedName.length };
            }
            return null;
        })
            .filter((option) => option !== null)
            .sort((left, right) => right.score - left.score);
        return matchedOptions[0]?.id ?? null;
    }
    extractSelectedOrdinalIndex(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        const interactiveSlotMatch = /\bslot[_-]([1-9]\d*)\b/.exec(normalizedText);
        if (interactiveSlotMatch) {
            return Number(interactiveSlotMatch[1]) - 1;
        }
        const ordinalByWord = {
            primera: 0,
            primero: 0,
            primer: 0,
            segunda: 1,
            segundo: 1,
            tercera: 2,
            tercero: 2,
            cuarta: 3,
            cuarto: 3,
            quinta: 4,
            quinto: 4,
        };
        for (const [word, index] of Object.entries(ordinalByWord)) {
            if (new RegExp(`\\b${word}\\b`).test(normalizedText)) {
                return index;
            }
        }
        const numericMatch = /\b(?:opcion|numero|nro)\s*(10|[1-9])\b/.exec(normalizedText) ??
            /^\s*(10|[1-9])\s*$/.exec(normalizedText);
        if (numericMatch) {
            return Number(numericMatch[1]) - 1;
        }
        return null;
    }
    extractRequestedTime(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        const match = /\b(?:de las|a las|las|tipo)?\s*([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d)|\s*h?s?)\b/.exec(normalizedText);
        if (!match) {
            return null;
        }
        return `${String(Number(match[1])).padStart(2, '0')}:${match[2] ?? '00'}`;
    }
    extractCustomerName(messageText) {
        const match = /(?:a nombre de|nombre de)\s+(.+)$/i.exec(messageText);
        if (!match) {
            return null;
        }
        const name = this.cleanReservationName(match[1]);
        return this.isReservationNameCandidate(name) ? name : null;
    }
    async resolveReservationName(conversation, messageText, allowStandaloneName) {
        const explicitName = this.extractCustomerName(messageText);
        if (explicitName) {
            return explicitName;
        }
        const standaloneName = allowStandaloneName
            ? this.extractStandaloneCustomerName(messageText)
            : null;
        if (standaloneName) {
            return standaloneName;
        }
        const contextName = this.getContextString(conversation.context, 'reservationName') ??
            this.getContextString(conversation.context, 'customerName');
        if (contextName && this.isReservationNameCandidate(contextName)) {
            return contextName;
        }
        const customer = await this.customersService.findOne(conversation.customer_id);
        const customerName = customer?.name?.trim();
        return customerName && this.isReservationNameCandidate(customerName)
            ? customerName
            : null;
    }
    cleanReservationName(value) {
        return value
            .replace(/[?.!,]+$/g, '')
            .replace(/\s+(?:quiero\s+que\s+)?(?:sea|quede)\s+(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\s+(?:es|para)\s+(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\s+(?:es\s+)?(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\b(confirmo|gracias|por favor)\b/gi, '')
            .trim();
    }
    extractStandaloneCustomerName(messageText) {
        const text = this.cleanReservationName(messageText).replace(/\s+/g, ' ');
        if (!text || !this.isReservationNameCandidate(text)) {
            return null;
        }
        return text.length > 1 ? text : null;
    }
    isReservationNameCandidate(value) {
        const text = value.trim();
        const normalizedText = this.normalizeHumanText(text);
        if (!text || text.length <= 1 || /\d/.test(text)) {
            return false;
        }
        return !/\b(quiero|turno|reserv|cancha|padel|futbol|opcion|horario|confirmo|si|ok|dale|hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|proximo|proxima|fecha|hora|hs?)\b/.test(normalizedText);
    }
    getPendingBookingFromContext(context) {
        const pendingBooking = context.pendingBooking;
        if (!this.isRecord(pendingBooking)) {
            return null;
        }
        const resourceId = this.parsePositiveIntegerValue(pendingBooking.resourceId);
        const resourceName = typeof pendingBooking.resourceName === 'string'
            ? pendingBooking.resourceName
            : null;
        const serviceId = this.parsePositiveIntegerValue(pendingBooking.serviceId);
        const serviceName = typeof pendingBooking.serviceName === 'string'
            ? pendingBooking.serviceName
            : null;
        const startAt = typeof pendingBooking.startAt === 'string'
            ? pendingBooking.startAt
            : null;
        const endAt = typeof pendingBooking.endAt === 'string' ? pendingBooking.endAt : null;
        const reservationName = typeof pendingBooking.reservationName === 'string'
            ? pendingBooking.reservationName
            : typeof pendingBooking.customerName === 'string'
                ? pendingBooking.customerName
                : null;
        if (!resourceId ||
            !resourceName ||
            !serviceId ||
            !serviceName ||
            !startAt ||
            !endAt ||
            !reservationName) {
            return null;
        }
        return {
            resourceId,
            resourceName,
            serviceId,
            serviceName,
            startAt,
            endAt,
            reservationName,
        };
    }
    toCustomerBookingContext(booking) {
        return {
            id: booking.id,
            startAt: booking.startAt,
            endAt: booking.endAt,
            serviceName: booking.service.name,
            resourceName: booking.resource.name,
            branchName: booking.branch.name,
        };
    }
    getSelectedCustomerBookingIdFromContext(context, messageText) {
        const selectedIndex = this.extractSelectedOrdinalIndex(messageText);
        if (selectedIndex === null) {
            return null;
        }
        const customerBookings = context.customerBookings;
        if (!Array.isArray(customerBookings)) {
            return null;
        }
        const selectedBooking = customerBookings[selectedIndex];
        if (!this.isRecord(selectedBooking)) {
            return null;
        }
        return this.parsePositiveIntegerValue(selectedBooking.id);
    }
    toBookingSummaryData(booking) {
        return {
            date: this.formatBookingDisplayDate(booking.startAt),
            time: this.formatSlotTime(booking.startAt),
            serviceName: booking.service.name,
            resourceName: booking.resource.name,
            branchName: booking.branch.name,
        };
    }
    formatCustomerBookingsMessage(bookings) {
        const lines = bookings.map((booking, index) => `${index + 1}. ${this.formatCustomerBookingLine(booking)}`);
        return [whatsapp_response_templates_1.whatsappResponseTemplates.customerBookingsIntro(), ...lines].join('\n');
    }
    formatCustomerBookingLine(booking) {
        const summary = this.toBookingSummaryData(booking);
        return [
            `${summary.date} ${summary.time}`,
            summary.serviceName,
            summary.resourceName ?? summary.branchName,
        ]
            .filter(Boolean)
            .join(' · ');
    }
    formatBookingDisplayDate(startAt) {
        const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(startAt);
        if (!match) {
            return startAt.slice(0, 10);
        }
        return `${match[3]}/${match[2]}/${match[1]}`;
    }
    isConfirmationMessage(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return /\b(si|sí|confirmo|dale|ok|okay|correcto|esta bien|confirmar)\b/.test(normalizedText);
    }
    isStaleBookingSummaryConfirmationReply(messageText) {
        const normalizedText = this.normalizeHumanText(messageText);
        return (this.isConfirmationMessage(messageText) &&
            /\b(genial|resumen de la reserva|confirmas la reserva|servicio|fecha|horario|a nombre de)\b/.test(normalizedText));
    }
    hasPendingBookingSelection(conversation) {
        return this.hasBookingSelectionContext(conversation.context);
    }
    hasBookingSelectionContext(context) {
        return (this.getAvailabilitySlotsFromContext(context).length > 0 ||
            this.getPendingBookingFromContext(context) !== null ||
            this.getSelectedSlotFromContext(context) !== null);
    }
    isBookingRejectionMessage(messageText) {
        const normalizedText = this.normalizeHumanText(messageText).trim();
        if (/^(no|nop|nope)$/i.test(normalizedText)) {
            return true;
        }
        return /\b(no quiero|no confirmo|no reservar|no reserves|cancelalo|cancela|cancelar|dejalo|olvidate)\b/.test(normalizedText);
    }
    normalizeHumanText(value) {
        return value
            .toLowerCase()
            .replace(/&(?:#x20|#32|nbsp);/g, ' ')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    parseSlotStartToMinutes(startAt) {
        return this.parseHourMinuteToMinutes(startAt.slice(11, 16));
    }
    parseHourMinuteToMinutes(value) {
        const match = /^(\d{2}):(\d{2})$/.exec(value);
        if (!match) {
            return null;
        }
        const hour = Number(match[1]);
        const minute = Number(match[2]);
        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return null;
        }
        return hour * 60 + minute;
    }
    formatSlotTime(startAt) {
        return startAt.slice(11, 16);
    }
    async processMessageStatus(status, whatsappAccount) {
        const messageId = status.id;
        const statusValue = status.status;
        this.logger.log(`Estado del mensaje ${messageId} actualizado a: ${statusValue}`);
        const mappedStatus = this.mapProviderMessageStatus(statusValue);
        if (!mappedStatus) {
            this.logger.warn(`Estado de mensaje no soportado: ${statusValue}`);
            return;
        }
        try {
            await this.whatsappMessageService.updateMessageStatus(messageId, whatsappAccount.business_id, mappedStatus);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`No se pudo actualizar el estado del mensaje ${messageId}: ${errorMessage}`);
        }
    }
    async sendMessage(payload) {
        let outboundMessage = null;
        let outboundBusinessId = null;
        try {
            const whatsappAccount = await this.resolveWhatsappAccountForSend(payload);
            const metaRecipientPhoneNumber = this.normalizeMetaRecipientPhoneNumber(payload.to);
            this.logger.debug(`Enviando mensaje a ${payload.to} (Meta: ${metaRecipientPhoneNumber}) con tipo ${payload.type}`);
            this.logger.debug(`Whatsapp account resolved accountId=${whatsappAccount.id} businessId=${whatsappAccount.business_id} phone=${whatsappAccount.phone_number} wabaId=${whatsappAccount.waba_id ?? 'null'} apiVersion=${this.apiVersion}`);
            const senderPhoneNumberId = whatsappAccount.sender_phone_number_id ??
                (await this.resolveMetaSenderPhoneNumberId(whatsappAccount));
            const outboundPersistence = await this.createOutboundPersistenceRecord(payload, whatsappAccount);
            outboundMessage = outboundPersistence?.message ?? null;
            outboundBusinessId = outboundPersistence?.businessId ?? null;
            const url = `https://graph.facebook.com/${this.apiVersion}/${senderPhoneNumberId}/messages`;
            this.logger.debug(`URL de solicitud: ${url}`);
            const metaPayload = this.buildMetaSendPayload(payload);
            this.logTemplateSendDetails(payload, whatsappAccount, senderPhoneNumberId, metaPayload);
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${whatsappAccount.access_token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(metaPayload),
            });
            const data = this.normalizeSendResponse(await response.json());
            if (!response.ok) {
                const errorMessage = data.error?.message || JSON.stringify(data);
                const errorCode = data?.error?.code;
                let detailedError = `Error WhatsApp (${response.status}): ${errorMessage}`;
                if (errorCode === 132001) {
                    await this.logMetaTemplateDiagnostics(payload, whatsappAccount);
                }
                if (errorCode === 190) {
                    detailedError +=
                        '\n\n📌 SOLUCIÓN - Error de Token (Código 190):\n' +
                            '1. El token de acceso está expirado o es inválido\n' +
                            '2. Genere un nuevo token en:\n' +
                            '   https://developers.facebook.com/apps/ > Settings > Tokens > System User Token\n' +
                            '3. Actualice access_token en la fila correspondiente de whatsapp_account\n' +
                            '4. Reinicie la aplicación si el token se cachea fuera de la base\n' +
                            '5. Asegúrese de que el token tenga permisos de: whatsapp_business_messaging';
                }
                else if (errorCode === 100) {
                    detailedError +=
                        '\n\n📌 SOLUCIÓN - Parámetro Inválido (Código 100):\n' +
                            '1. Verifique que whatsapp_account.phone_number corresponda a un numero del WABA\n' +
                            '2. Verifique que whatsapp_account.waba_id sea correcto\n' +
                            '3. Verifique el formato del número de teléfono destino (con código de país)';
                }
                throw new Error(detailedError);
            }
            this.logger.log(`Mensaje enviado exitosamente a ${metaRecipientPhoneNumber}: ${data.messages?.[0]?.id}`);
            const providerMessageId = data.messages?.[0]?.id;
            if (outboundMessage && providerMessageId && outboundBusinessId) {
                await this.whatsappMessageService.updateProviderMessageId(outboundMessage.id, outboundBusinessId, providerMessageId);
                await this.whatsappMessageService.updateMessageStatus(providerMessageId, outboundBusinessId, whatsapp_message_entity_1.WhatsappMessageStatus.SENT);
            }
            return data;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error('Error al enviar mensaje de WhatsApp:', errorMessage);
            if (outboundMessage && outboundBusinessId) {
                try {
                    await this.whatsappMessageService.updateMessageStatusById(outboundMessage.id, outboundBusinessId, whatsapp_message_entity_1.WhatsappMessageStatus.FAILED);
                }
                catch (persistenceError) {
                    const persistenceErrorMessage = persistenceError instanceof Error
                        ? persistenceError.message
                        : String(persistenceError);
                    this.logger.warn(`No se pudo marcar el mensaje ${outboundMessage.id} como FAILED: ${persistenceErrorMessage}`);
                }
            }
            throw error;
        }
    }
    async sendTextMessage(phoneNumber, text, businessId, conversationId) {
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'text',
            text: { body: text },
        };
        return this.sendMessage(payload);
    }
    async sendBookingConfirmationMessage(phoneNumber, summary, businessId, conversationId) {
        const business = await this.availabilityService.getBusinessOrFail(businessId);
        const bodyText = whatsapp_response_templates_1.whatsappResponseTemplates.bookingSummary({
            ...summary,
            businessType: business.business_type,
        });
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'button',
                body: {
                    text: bodyText,
                },
                action: {
                    buttons: [
                        {
                            type: 'reply',
                            reply: {
                                id: 'turnero_booking_confirm',
                                title: 'Sí',
                            },
                        },
                        {
                            type: 'reply',
                            reply: {
                                id: 'turnero_booking_cancel',
                                title: 'Cancelar',
                            },
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendServiceOptionsMessage(phoneNumber, services, businessId, conversationId) {
        if (services.length === 0) {
            return this.sendTextMessage(phoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askService(), businessId, conversationId);
        }
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: whatsapp_response_templates_1.whatsappResponseTemplates.serviceListBody(),
                },
                action: {
                    button: whatsapp_response_templates_1.whatsappResponseTemplates.serviceListButton(),
                    sections: [
                        {
                            title: whatsapp_response_templates_1.whatsappResponseTemplates.serviceListSectionTitle(),
                            rows: services
                                .slice(0, MAX_INTERACTIVE_LIST_ROWS)
                                .map((service) => ({
                                id: `turnero_service_${service.id}`,
                                title: this.truncateInteractiveText(service.name, 24),
                                description: this.truncateInteractiveText(`${service.duration_minutes} min`, 72),
                            })),
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendServiceResourceOptionsMessage(phoneNumber, options, businessId, conversationId) {
        if (options.length === 0) {
            return this.sendTextMessage(phoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.askService(), businessId, conversationId);
        }
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: whatsapp_response_templates_1.whatsappResponseTemplates.serviceResourceListBody(),
                },
                action: {
                    button: whatsapp_response_templates_1.whatsappResponseTemplates.serviceResourceListButton(),
                    sections: [
                        {
                            title: whatsapp_response_templates_1.whatsappResponseTemplates.serviceResourceListSectionTitle(),
                            rows: options
                                .slice(0, MAX_COMBINED_SERVICE_RESOURCE_OPTIONS)
                                .map((option) => ({
                                id: `turnero_service_${option.service_id}_resource_${option.resource_id}`,
                                title: this.truncateInteractiveText(option.service_name, 24),
                                description: this.truncateInteractiveText(`${option.resource_name} · ${option.service_duration_minutes} min`, 72),
                            })),
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendResourceOptionsMessage(phoneNumber, serviceName, resources, businessId, conversationId) {
        if (resources.length === 0) {
            return this.sendTextMessage(phoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.noResourcesForService(), businessId, conversationId);
        }
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: whatsapp_response_templates_1.whatsappResponseTemplates.resourceListBody(serviceName),
                },
                action: {
                    button: whatsapp_response_templates_1.whatsappResponseTemplates.resourceListButton(),
                    sections: [
                        {
                            title: whatsapp_response_templates_1.whatsappResponseTemplates.resourceListSectionTitle(),
                            rows: resources
                                .slice(0, MAX_INTERACTIVE_LIST_ROWS)
                                .map((resource) => ({
                                id: `turnero_resource_${resource.id}`,
                                title: this.truncateInteractiveText(resource.name, 24),
                                description: this.truncateInteractiveText(this.formatInteractiveResourceDescription(resource), 72),
                            })),
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendAvailabilityOptionsMessage(phoneNumber, slots, businessId, conversationId, bodyText = whatsapp_response_templates_1.whatsappResponseTemplates.availabilityListBody()) {
        if (slots.length === 0) {
            return this.sendTextMessage(phoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.noAvailability(), businessId, conversationId);
        }
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: bodyText,
                },
                footer: {
                    text: 'También podés responder escribiendo el horario.',
                },
                action: {
                    button: whatsapp_response_templates_1.whatsappResponseTemplates.availabilityListButton(),
                    sections: [
                        {
                            title: whatsapp_response_templates_1.whatsappResponseTemplates.availabilityListSectionTitle(),
                            rows: slots.slice(0, 10).map((slot, index) => ({
                                id: `slot_${index + 1}`,
                                title: this.truncateInteractiveText(slot.label ?? slot.startsAt, 24),
                                description: this.truncateInteractiveText(this.formatInteractiveSlotDescription(slot.startsAt), 72),
                            })),
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendCustomerBookingOptionsMessage(phoneNumber, bookings, businessId, conversationId, bodyText = whatsapp_response_templates_1.whatsappResponseTemplates.cancelBookingSelectionBody()) {
        if (bookings.length === 0) {
            return this.sendTextMessage(phoneNumber, whatsapp_response_templates_1.whatsappResponseTemplates.customerBookingsEmpty(), businessId, conversationId);
        }
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'interactive',
            interactive: {
                type: 'list',
                body: {
                    text: bodyText,
                },
                action: {
                    button: 'Ver reservas',
                    sections: [
                        {
                            title: 'Reservas activas',
                            rows: bookings
                                .slice(0, MAX_INTERACTIVE_LIST_ROWS)
                                .map((booking) => ({
                                id: `turnero_booking_${booking.id}`,
                                title: this.truncateInteractiveText(`${this.formatBookingDisplayDate(booking.startAt)} ${this.formatSlotTime(booking.startAt)}`, 24),
                                description: this.truncateInteractiveText([
                                    booking.service.name,
                                    booking.resource.name,
                                    booking.branch.name,
                                ]
                                    .filter(Boolean)
                                    .join(' · '), 72),
                            })),
                        },
                    ],
                },
            },
        };
        return this.sendMessage(payload);
    }
    async sendTemplateMessage(phoneNumber, templateName, languageCode = 'es', businessId, conversationId, components) {
        const payload = {
            businessId,
            conversationId,
            messaging_product: 'whatsapp',
            to: phoneNumber,
            type: 'template',
            template: {
                name: templateName,
                language: {
                    code: languageCode,
                },
                components,
            },
        };
        return this.sendMessage(payload);
    }
    async findWhatsappAccountForWebhook(metadata, wabaId) {
        const whatsappAccount = await this.whatsappAccountsService.findByWebhookReference(metadata.display_phone_number, metadata.phone_number_id, wabaId);
        if (!whatsappAccount) {
            this.logger.warn(`No se encontro WhatsappAccount ACTIVE para phone_number=${metadata.phone_number_id} waba_id=${wabaId} display_phone_number=${metadata.display_phone_number}`);
        }
        else {
            this.logger.debug(`WhatsappAccount webhook resuelta: id=${whatsappAccount.id}, business_id=${whatsappAccount.business_id}, phone_number=${whatsappAccount.phone_number}, metadata_phone_number_id=${metadata.phone_number_id}, display_phone_number=${metadata.display_phone_number}`);
        }
        return whatsappAccount;
    }
    async resolveWhatsappAccountForSend(payload) {
        let whatsappAccount = null;
        let senderPhoneNumberId = null;
        const whatsappAccountId = this.parseSendWhatsappAccountId(payload.whatsappAccountId, 'whatsappAccountId');
        if (whatsappAccountId !== null) {
            whatsappAccount =
                await this.whatsappAccountsService.findActiveById(whatsappAccountId);
        }
        else if (payload.id !== undefined) {
            whatsappAccount = await this.findWhatsappAccountByTestId(payload.id);
        }
        else if (payload.phoneNumberId) {
            whatsappAccount = await this.whatsappAccountsService.findByPhoneNumber(payload.phoneNumberId);
        }
        else if (payload.businessId && payload.conversationId) {
            const conversation = await this.whatsappConversationService.findById(payload.conversationId, payload.businessId);
            if (!conversation) {
                throw new common_1.BadRequestException('Whatsapp conversation not found');
            }
            whatsappAccount = await this.whatsappAccountsService.findActiveById(conversation.whatsapp_account_id);
            senderPhoneNumberId = this.getContextString(conversation.context, CONVERSATION_CONTEXT_SENDER_PHONE_NUMBER_ID);
        }
        else if (payload.businessId) {
            const accounts = await this.whatsappAccountsService.findActiveByBusinessId(payload.businessId);
            if (accounts.length > 1) {
                throw new common_1.BadRequestException('Multiple active Whatsapp accounts found for business. Provide whatsappAccountId or phoneNumberId.');
            }
            whatsappAccount = accounts[0] ?? null;
        }
        if (!whatsappAccount) {
            throw new common_1.BadRequestException(`No active Whatsapp account found for this message (${this.describeWhatsappAccountLookup(payload)}). Provide whatsappAccountId, phoneNumberId, or a valid businessId/conversationId pair.`);
        }
        if (payload.businessId &&
            whatsappAccount.business_id !== payload.businessId) {
            throw new common_1.BadRequestException('Whatsapp account does not belong to the provided businessId.');
        }
        if (!whatsappAccount.access_token?.trim()) {
            throw new common_1.BadRequestException('Whatsapp account access_token is not configured.');
        }
        return {
            id: whatsappAccount.id,
            business_id: whatsappAccount.business_id,
            branch_id: whatsappAccount.branch_id,
            phone_number: whatsappAccount.phone_number,
            waba_id: whatsappAccount.waba_id,
            access_token: whatsappAccount.access_token,
            sender_phone_number_id: senderPhoneNumberId ?? undefined,
        };
    }
    async storeSenderPhoneNumberIdIfNeeded(conversation, businessId, senderPhoneNumberId) {
        const currentSenderPhoneNumberId = this.getContextString(conversation.context, CONVERSATION_CONTEXT_SENDER_PHONE_NUMBER_ID);
        if (currentSenderPhoneNumberId === senderPhoneNumberId) {
            return;
        }
        await this.whatsappConversationService.updateContext(conversation.id, businessId, {
            [CONVERSATION_CONTEXT_SENDER_PHONE_NUMBER_ID]: senderPhoneNumberId,
        });
    }
    async resolveMetaSenderPhoneNumberId(whatsappAccount) {
        const configuredPhoneNumber = whatsappAccount.phone_number.trim();
        if (configuredPhoneNumber.length === 0) {
            throw new common_1.BadRequestException('Whatsapp account phone_number is not configured.');
        }
        const phoneNumbers = await this.fetchMetaPhoneNumbers(whatsappAccount);
        const normalizedConfiguredPhoneNumber = this.normalizePhoneIdentifier(configuredPhoneNumber);
        const matchingPhoneNumber = phoneNumbers.find((phoneNumber) => {
            const displayPhoneNumber = phoneNumber.display_phone_number ?? '';
            return (phoneNumber.id === configuredPhoneNumber ||
                displayPhoneNumber === configuredPhoneNumber ||
                this.normalizePhoneIdentifier(displayPhoneNumber) ===
                    normalizedConfiguredPhoneNumber);
        });
        if (!matchingPhoneNumber) {
            throw new common_1.BadRequestException(`No Meta phone number found for whatsapp_account.phone_number=${configuredPhoneNumber} in waba_id=${whatsappAccount.waba_id}.`);
        }
        this.logger.debug(`Phone sender resuelto: ${configuredPhoneNumber} -> ${matchingPhoneNumber.id}`);
        return matchingPhoneNumber.id;
    }
    async fetchMetaPhoneNumbers(whatsappAccount) {
        const url = `https://graph.facebook.com/${this.apiVersion}/${whatsappAccount.waba_id}/phone_numbers?fields=id,display_phone_number`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${whatsappAccount.access_token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            const errorMessage = this.extractMetaErrorMessage(data);
            throw new common_1.BadRequestException(`No se pudieron obtener los numeros del WABA ${whatsappAccount.waba_id}: ${errorMessage}`);
        }
        if (!this.isRecord(data) || !Array.isArray(data.data)) {
            return [];
        }
        return data.data
            .filter((value) => this.isRecord(value))
            .map((value) => ({
            id: typeof value.id === 'string' ? value.id : '',
            display_phone_number: typeof value.display_phone_number === 'string'
                ? value.display_phone_number
                : undefined,
        }))
            .filter((phoneNumber) => phoneNumber.id.length > 0);
    }
    async logMetaTemplateDiagnostics(payload, whatsappAccount) {
        if (payload.type !== 'template' || !payload.template?.name) {
            return;
        }
        try {
            const templates = await this.fetchMetaMessageTemplatesForDiagnostics(whatsappAccount);
            const requestedTemplateName = payload.template.name;
            const requestedLanguage = payload.template.language?.code;
            const matchingTemplates = templates.filter((template) => template.name === requestedTemplateName);
            const availableTemplates = templates
                .map((template) => `${template.name}:${template.language}:${template.status ?? 'unknown'}`)
                .join(',');
            this.logger.warn([
                'Whatsapp template diagnostics',
                `wabaId=${whatsappAccount.waba_id}`,
                `requested=${requestedTemplateName}:${requestedLanguage ?? 'null'}`,
                `matches=${matchingTemplates.length > 0 ? matchingTemplates.map((template) => `${template.language}:${template.status ?? 'unknown'}`).join(',') : 'none'}`,
                `availableTemplates=${availableTemplates || 'none'}`,
            ].join(' '));
        }
        catch (error) {
            this.logger.warn([
                'Could not fetch Whatsapp template diagnostics',
                `wabaId=${whatsappAccount.waba_id}`,
                `templateName=${payload.template.name}`,
                `error=${error instanceof Error ? error.message : String(error)}`,
            ].join(' '));
        }
    }
    async fetchMetaMessageTemplatesForDiagnostics(whatsappAccount) {
        const url = `https://graph.facebook.com/${this.apiVersion}/${whatsappAccount.waba_id}/message_templates?fields=name,language,status&limit=100`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${whatsappAccount.access_token}`,
            },
        });
        const data = await response.json();
        if (!response.ok) {
            throw new common_1.BadRequestException(this.extractMetaErrorMessage(data));
        }
        if (!this.isRecord(data) || !Array.isArray(data.data)) {
            return [];
        }
        return data.data
            .filter((value) => this.isRecord(value))
            .map((value) => ({
            name: typeof value.name === 'string' ? value.name : '',
            language: typeof value.language === 'string' ? value.language : '',
            status: typeof value.status === 'string' ? value.status : undefined,
        }))
            .filter((template) => template.name.length > 0 && template.language.length > 0);
    }
    normalizePhoneIdentifier(value) {
        return value.replace(/\D/g, '');
    }
    extractMetaErrorMessage(value) {
        if (!this.isRecord(value) || !this.isRecord(value.error)) {
            return JSON.stringify(value);
        }
        return typeof value.error.message === 'string'
            ? value.error.message
            : JSON.stringify(value.error);
    }
    async findWhatsappAccountByTestId(id) {
        const normalizedId = String(id).trim();
        if (normalizedId.length === 0) {
            throw new common_1.BadRequestException('id is required.');
        }
        const accountByPhoneNumber = await this.whatsappAccountsService.findByPhoneNumber(normalizedId);
        if (accountByPhoneNumber) {
            return accountByPhoneNumber;
        }
        const whatsappAccountId = this.parseSendWhatsappAccountId(normalizedId, 'id');
        if (whatsappAccountId === null) {
            return null;
        }
        return this.whatsappAccountsService.findActiveById(whatsappAccountId);
    }
    describeWhatsappAccountLookup(payload) {
        if (payload.whatsappAccountId !== undefined) {
            return `whatsappAccountId=${payload.whatsappAccountId}`;
        }
        if (payload.id !== undefined) {
            return `id=${payload.id}`;
        }
        if (payload.phoneNumberId) {
            return `phoneNumberId=${payload.phoneNumberId}`;
        }
        if (payload.businessId && payload.conversationId) {
            return `businessId=${payload.businessId}, conversationId=${payload.conversationId}`;
        }
        if (payload.businessId) {
            return `businessId=${payload.businessId}`;
        }
        return 'no account lookup fields provided';
    }
    parseSendWhatsappAccountId(value, field) {
        if (value === undefined) {
            return null;
        }
        const whatsappAccountId = this.parsePositiveIntegerValue(value);
        if (whatsappAccountId === null) {
            throw new common_1.BadRequestException(`${field} must be a positive integer or a valid phone_number.`);
        }
        return whatsappAccountId;
    }
    async createOutboundPersistenceRecord(payload, whatsappAccount) {
        if (payload.businessId && payload.conversationId) {
            const message = await this.whatsappMessageService.createOutboundMessage({
                businessId: payload.businessId,
                conversationId: payload.conversationId,
                messageType: payload.type,
                content: this.buildOutboundMessageContent(payload),
            });
            await this.whatsappConversationService.touchConversation(payload.conversationId, payload.businessId);
            return {
                message,
                businessId: payload.businessId,
                conversationId: payload.conversationId,
            };
        }
        const customer = await this.customersService.getOrCreateByPhone({
            phone: payload.to,
            name: payload.to,
        });
        const conversation = await this.whatsappConversationService.getOrCreateActiveConversation({
            whatsappAccountId: whatsappAccount.id,
            businessId: whatsappAccount.business_id,
            branchId: whatsappAccount.branch_id,
            customerId: customer.id,
        });
        const message = await this.whatsappMessageService.createOutboundMessage({
            businessId: whatsappAccount.business_id,
            conversationId: conversation.id,
            messageType: payload.type,
            content: this.buildOutboundMessageContent(payload),
        });
        await this.whatsappConversationService.touchConversation(conversation.id, whatsappAccount.business_id);
        return {
            message,
            businessId: whatsappAccount.business_id,
            conversationId: conversation.id,
        };
    }
    logTemplateSendDetails(payload, whatsappAccount, senderPhoneNumberId, metaPayload) {
        if (payload.type !== 'template') {
            return;
        }
        const template = metaPayload.template && typeof metaPayload.template === 'object'
            ? metaPayload.template
            : {};
        const language = template.language && typeof template.language === 'object'
            ? template.language
            : {};
        const components = Array.isArray(template.components)
            ? template.components
            : [];
        const componentSummary = components
            .map((component) => {
            if (!component || typeof component !== 'object') {
                return 'unknown';
            }
            const typedComponent = component;
            const type = typeof typedComponent.type === 'string'
                ? typedComponent.type
                : 'unknown';
            const subType = typeof typedComponent.sub_type === 'string'
                ? `:${typedComponent.sub_type}`
                : '';
            const index = typeof typedComponent.index === 'string'
                ? `[${typedComponent.index}]`
                : '';
            return `${type}${subType}${index}`;
        })
            .join(',');
        this.logger.log([
            'Sending Whatsapp template',
            `businessId=${payload.businessId ?? whatsappAccount.business_id}`,
            `conversationId=${payload.conversationId ?? 'null'}`,
            `whatsappAccountId=${whatsappAccount.id}`,
            `wabaId=${whatsappAccount.waba_id ?? 'null'}`,
            `senderPhoneNumberId=${senderPhoneNumberId}`,
            `templateName=${typeof template.name === 'string' ? template.name : 'null'}`,
            `templateLanguage=${typeof language.code === 'string' ? language.code : 'null'}`,
            `components=${componentSummary || 'none'}`,
        ].join(' '));
    }
    buildMetaSendPayload(payload) {
        const { id, whatsappAccountId, phoneNumberId, businessId, conversationId, messaging_product, to, type, text, image, document, template, interactive, } = payload;
        void id;
        void whatsappAccountId;
        void phoneNumberId;
        void businessId;
        void conversationId;
        return this.removeUndefinedValues({
            messaging_product,
            to: this.normalizeMetaRecipientPhoneNumber(to),
            type,
            text,
            image,
            document,
            template,
            interactive,
        });
    }
    buildInboundMessageContent(message) {
        if (message.type === 'text') {
            return {
                text: message.text?.body ?? '',
            };
        }
        const typedPayload = this.getMessageTypedPayload(message, message.type);
        if (typedPayload !== undefined) {
            return {
                [message.type]: this.toJsonValue(typedPayload),
            };
        }
        return {
            raw: this.toJsonValue(message),
        };
    }
    buildOutboundMessageContent(payload) {
        const metaPayload = this.buildMetaSendPayload(payload);
        const typedPayload = metaPayload[payload.type];
        if (typedPayload !== undefined) {
            return {
                [payload.type]: this.toJsonValue(typedPayload),
            };
        }
        return {
            payload: this.toJsonValue(metaPayload),
        };
    }
    getMessageTypedPayload(message, messageType) {
        const valuesByType = {
            interactive: message.interactive,
            button: message.button,
            image: message.image,
            document: message.document,
            audio: message.audio,
            video: message.video,
        };
        return valuesByType[messageType];
    }
    parseWhatsappTimestamp(timestamp) {
        if (!timestamp) {
            return null;
        }
        const seconds = Number(timestamp);
        if (!Number.isFinite(seconds)) {
            return null;
        }
        return new Date(seconds * 1000);
    }
    isStaleInboundMessage(messageAt) {
        return Date.now() - messageAt.getTime() > this.maxInboundMessageAgeMs;
    }
    getMaxInboundMessageAgeMs() {
        const configuredMinutes = this.configService.get('WHATSAPP_MAX_INBOUND_MESSAGE_AGE_MINUTES');
        const minutes = configuredMinutes
            ? Number(configuredMinutes)
            : DEFAULT_MAX_INBOUND_MESSAGE_AGE_MINUTES;
        if (!Number.isFinite(minutes) || minutes <= 0) {
            return DEFAULT_MAX_INBOUND_MESSAGE_AGE_MINUTES * 60_000;
        }
        return minutes * 60_000;
    }
    getBooleanConfig(key, defaultValue) {
        const value = this.configService.get(key);
        if (value === undefined) {
            return defaultValue;
        }
        return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
    }
    normalizeMetaRecipientPhoneNumber(phoneNumber) {
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.startsWith('549') && digits.length >= 12) {
            return `54${digits.slice(3)}`;
        }
        return digits;
    }
    truncateInteractiveText(value, maxLength) {
        const normalizedValue = value.replace(/\s+/g, ' ').trim();
        if (normalizedValue.length <= maxLength) {
            return normalizedValue;
        }
        return normalizedValue.slice(0, maxLength - 1).trimEnd();
    }
    formatInteractiveSlotDescription(startsAt) {
        const date = startsAt.slice(0, 10);
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
        if (!match) {
            return startsAt;
        }
        return `${match[3]}/${match[2]}/${match[1]}`;
    }
    formatInteractiveResourceDescription(resource) {
        if (resource.is_indoor === true) {
            return 'Cubierto';
        }
        if (resource.is_indoor === false) {
            return 'Exterior';
        }
        return 'Disponible para este servicio';
    }
    mapProviderMessageStatus(status) {
        switch (status.toLowerCase()) {
            case 'sent':
                return whatsapp_message_entity_1.WhatsappMessageStatus.SENT;
            case 'delivered':
                return whatsapp_message_entity_1.WhatsappMessageStatus.DELIVERED;
            case 'read':
                return whatsapp_message_entity_1.WhatsappMessageStatus.READ;
            case 'failed':
                return whatsapp_message_entity_1.WhatsappMessageStatus.FAILED;
            default:
                return null;
        }
    }
    normalizeSendResponse(value) {
        if (!this.isRecord(value)) {
            return {};
        }
        const response = {};
        if (Array.isArray(value.messages)) {
            response.messages = value.messages
                .filter((message) => this.isRecord(message))
                .map((message) => ({
                id: typeof message.id === 'string' ? message.id : undefined,
            }));
        }
        if (this.isRecord(value.error)) {
            response.error = {
                message: typeof value.error.message === 'string'
                    ? value.error.message
                    : undefined,
                code: typeof value.error.code === 'number' ? value.error.code : undefined,
                type: typeof value.error.type === 'string' ? value.error.type : undefined,
            };
        }
        return response;
    }
    getRecordStringValue(value, key) {
        if (!this.isRecord(value)) {
            return null;
        }
        const fieldValue = value[key];
        return typeof fieldValue === 'string' ? fieldValue : null;
    }
    removeUndefinedValues(value) {
        return Object.fromEntries(Object.entries(value).filter(([, entryValue]) => entryValue !== undefined));
    }
    toJsonValue(value) {
        return JSON.parse(JSON.stringify(value));
    }
    isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
};
exports.WhatsappServiceService = WhatsappServiceService;
exports.WhatsappServiceService = WhatsappServiceService = WhatsappServiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        availability_service_1.AvailabilityService,
        bookings_service_1.BookingsService,
        customers_service_1.CustomersService,
        ia_service_service_1.IaServiceService,
        whatsapp_accounts_service_1.WhatsappAccountsService,
        whatsapp_conversation_service_1.WhatsappConversationService,
        whatsapp_message_service_1.WhatsappMessageService])
], WhatsappServiceService);
//# sourceMappingURL=whatsapp-service.service.js.map