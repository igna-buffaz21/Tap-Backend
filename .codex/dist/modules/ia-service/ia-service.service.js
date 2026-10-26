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
var IaServiceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IaServiceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const whatsapp_conversation_entity_1 = require("../whatsapp-conversation/entities/whatsapp-conversation.entity");
const ia_service_prompt_1 = require("./ia-service.prompt");
const ia_service_types_1 = require("./ia-service.types");
const ia_error_logger_service_1 = require("./ia-error-logger.service");
const DEFAULT_PROMPT_TIME_ZONE = 'America/Argentina/Cordoba';
let IaServiceService = IaServiceService_1 = class IaServiceService {
    configService;
    iaErrorLoggerService;
    logger = new common_1.Logger(IaServiceService_1.name);
    apiKey;
    model;
    requestTimeoutMs;
    constructor(configService, iaErrorLoggerService) {
        this.configService = configService;
        this.iaErrorLoggerService = iaErrorLoggerService;
        this.apiKey = this.configService.get('GEMINI_API_KEY');
        this.model = this.configService.get('GEMINI_MODEL', 'gemini-3.1-flash-lite');
        this.requestTimeoutMs = this.parseRequestTimeout(this.configService.get('GEMINI_TIMEOUT_MS'));
        if (!this.apiKey) {
            this.logger.warn('GEMINI_API_KEY no esta configurado');
        }
    }
    async interpretWhatsappMessage(input) {
        const messageText = input.messageText.trim();
        if (messageText.length === 0) {
            throw new common_1.BadRequestException('messageText is required');
        }
        const normalizedInput = {
            ...input,
            messageText,
        };
        try {
            const responseText = await this.generateJson(this.buildWhatsappInterpretationPrompt(normalizedInput));
            return this.applyBookingFallbacks(normalizedInput, this.normalizeInterpretation(responseText));
        }
        catch (error) {
            const fallback = this.buildLocalConversationFallback(normalizedInput);
            await this.iaErrorLoggerService.logGeminiFailure({
                source: 'whatsapp-message-interpretation',
                error,
                model: this.model,
                timeoutMs: this.requestTimeoutMs,
                fallbackUsed: fallback !== null,
                messageText: normalizedInput.messageText,
                businessId: normalizedInput.businessId,
                branchId: normalizedInput.branchId ?? null,
                conversation: {
                    intent: normalizedInput.currentIntent,
                    status: normalizedInput.currentStatus,
                    context: normalizedInput.currentContext,
                },
                recentMessages: normalizedInput.recentMessages ?? [],
            });
            if (!fallback) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.warn(`Gemini no respondio correctamente; usando fallback local: ${errorMessage}`);
            return fallback;
        }
    }
    async generateJson(userPrompt) {
        if (!this.apiKey) {
            throw new common_1.ServiceUnavailableException('GEMINI_API_KEY is not configured');
        }
        const abortController = new AbortController();
        const timeout = setTimeout(() => abortController.abort(), this.requestTimeoutMs);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                signal: abortController.signal,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    systemInstruction: {
                        parts: [
                            {
                                text: ia_service_prompt_1.WHATSAPP_INTERPRETATION_SYSTEM_PROMPT,
                            },
                        ],
                    },
                    contents: [
                        {
                            role: 'user',
                            parts: [
                                {
                                    text: userPrompt,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        responseSchema: this.getWhatsappInterpretationSchema(),
                    },
                }),
            });
            const data = this.normalizeGeminiResponse(await response.json());
            if (!response.ok) {
                throw new common_1.ServiceUnavailableException(data.error?.message ?? 'Gemini request failed');
            }
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                throw new common_1.ServiceUnavailableException('Gemini returned an empty response');
            }
            return text;
        }
        catch (error) {
            if (this.isAbortError(error)) {
                throw new common_1.ServiceUnavailableException('Gemini request timed out');
            }
            throw error;
        }
        finally {
            clearTimeout(timeout);
        }
    }
    buildWhatsappInterpretationPrompt(input) {
        return JSON.stringify({
            now: new Date().toISOString(),
            businessId: input.businessId,
            branchId: input.branchId ?? null,
            currentConversation: {
                intent: input.currentIntent,
                status: input.currentStatus,
                context: input.currentContext,
            },
            recentMessages: input.recentMessages ?? [],
            userMessage: input.messageText,
        });
    }
    getWhatsappInterpretationSchema() {
        return {
            type: 'OBJECT',
            properties: {
                intent: {
                    type: 'STRING',
                    enum: Object.values(whatsapp_conversation_entity_1.WhatsappConversationIntent),
                },
                status: {
                    type: 'STRING',
                    enum: Object.values(whatsapp_conversation_entity_1.WhatsappConversationStatus),
                },
                contextPatch: {
                    type: 'OBJECT',
                },
                missingFields: {
                    type: 'ARRAY',
                    items: {
                        type: 'STRING',
                    },
                },
                nextAction: {
                    type: 'STRING',
                    enum: Object.values(ia_service_types_1.IaConversationNextAction),
                },
                replyText: {
                    type: 'STRING',
                    nullable: true,
                },
                confidence: {
                    type: 'NUMBER',
                },
            },
            required: [
                'intent',
                'status',
                'contextPatch',
                'missingFields',
                'nextAction',
                'replyText',
                'confidence',
            ],
        };
    }
    normalizeInterpretation(responseText) {
        const parsedResponse = this.parseJsonObject(responseText);
        const intent = this.normalizeIntent(parsedResponse.intent);
        const status = this.normalizeStatus(parsedResponse.status);
        const nextAction = this.normalizeNextAction(parsedResponse.nextAction);
        const confidence = this.normalizeConfidence(parsedResponse.confidence);
        return {
            intent,
            status,
            contextPatch: this.normalizeJsonObject(parsedResponse.contextPatch),
            missingFields: this.normalizeStringArray(parsedResponse.missingFields),
            nextAction,
            replyText: typeof parsedResponse.replyText === 'string'
                ? parsedResponse.replyText
                : null,
            confidence,
        };
    }
    buildLocalConversationFallback(input) {
        return (this.buildLocalBookingManagementFallback(input) ??
            this.buildLocalBookingFallback(input));
    }
    buildLocalBookingManagementFallback(input) {
        const contextPatch = this.inferBookingContextPatch(input.messageText);
        if (this.looksLikeCancelBookingMessage(input.messageText)) {
            return {
                intent: whatsapp_conversation_entity_1.WhatsappConversationIntent.CANCEL_BOOKING,
                status: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
                contextPatch,
                missingFields: [],
                nextAction: ia_service_types_1.IaConversationNextAction.CANCEL_BOOKING,
                replyText: null,
                confidence: 0.75,
            };
        }
        if (this.looksLikeViewBookingsMessage(input.messageText)) {
            return {
                intent: whatsapp_conversation_entity_1.WhatsappConversationIntent.VIEW_BOOKINGS,
                status: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
                contextPatch,
                missingFields: [],
                nextAction: ia_service_types_1.IaConversationNextAction.VIEW_BOOKINGS,
                replyText: null,
                confidence: 0.75,
            };
        }
        return null;
    }
    buildLocalBookingFallback(input) {
        const contextPatch = this.inferBookingContextPatch(input.messageText);
        const mergedContext = {
            ...input.currentContext,
            ...contextPatch,
        };
        const hasDate = this.hasStringValue(mergedContext.date);
        const hasTimePreference = this.hasTimePreference(mergedContext);
        const shouldSearchWithoutTime = hasDate && this.shouldSearchAvailabilityWithoutTime(input.messageText);
        if (!this.looksLikeBookingMessage(input.messageText) && !hasDate) {
            return null;
        }
        if ((hasDate && hasTimePreference) || shouldSearchWithoutTime) {
            return {
                intent: whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING,
                status: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
                contextPatch,
                missingFields: [],
                nextAction: ia_service_types_1.IaConversationNextAction.SEARCH_AVAILABILITY,
                replyText: null,
                confidence: 0.75,
            };
        }
        return {
            intent: whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING,
            status: whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE,
            contextPatch,
            missingFields: this.mergeMissingFields([], hasDate ? [] : ['date'], hasTimePreference ? [] : ['timePreference']),
            nextAction: ia_service_types_1.IaConversationNextAction.ASK_CLARIFICATION,
            replyText: this.buildBookingClarificationText(hasDate, hasTimePreference),
            confidence: 0.65,
        };
    }
    looksLikeBookingMessage(messageText) {
        const normalizedText = messageText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return /\b(turno|reserv|cancha|padel|futbol|horario|horarios|disponibilidad|disponible|tenes algo|hay algo|cualquiera)\b/.test(normalizedText);
    }
    looksLikeCancelBookingMessage(messageText) {
        const normalizedText = messageText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return (/\b(cancelar|cancela|cancelame|anular|anula|dalo de baja|dar de baja|borrar)\b/.test(normalizedText) ||
            /\b(no voy a poder ir|al final no puedo|no puedo ir|no llego|no voy a ir|no puedo asistir|no voy a asistir)\b/.test(normalizedText));
    }
    looksLikeViewBookingsMessage(messageText) {
        const normalizedText = messageText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return (/\b(mis reservas|mis turnos|mi reserva|mi turno)\b/.test(normalizedText) &&
            /\b(ver|mostrar|consultar|pasame|cuales|cuando|tengo)\b/.test(normalizedText));
    }
    shouldSearchAvailabilityWithoutTime(messageText) {
        const normalizedText = messageText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        return (/\b(?:que|qué)?\s*horarios?\s+(?:tenes|tenés|hay|disponibles?|quedan?)\b/.test(normalizedText) ||
            /\b(?:tenes|tenés|hay|queda|quedan)\s+(?:algun|algún|turnos?|horarios?|disponibilidad)\b/.test(normalizedText) ||
            /\b(cualquiera|cualquier horario|el que tengas|el que haya|pasame opciones|mostrame opciones|ver opciones)\b/.test(normalizedText));
    }
    applyBookingFallbacks(input, interpretation) {
        const inferredContextPatch = this.inferBookingContextPatch(input.messageText);
        const contextPatch = {
            ...inferredContextPatch,
            ...interpretation.contextPatch,
        };
        const bookingManagementFallback = this.buildLocalBookingManagementFallback(input);
        if (bookingManagementFallback &&
            interpretation.status !== whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_REQUIRED) {
            return {
                ...bookingManagementFallback,
                contextPatch: {
                    ...bookingManagementFallback.contextPatch,
                    ...contextPatch,
                },
            };
        }
        const inferredTimePreference = inferredContextPatch.timePreference;
        if (this.isRecord(inferredTimePreference) &&
            inferredTimePreference.type === 'FROM') {
            contextPatch.timePreference = inferredTimePreference;
        }
        if (interpretation.intent !== whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING) {
            return {
                ...interpretation,
                contextPatch,
            };
        }
        const mergedContext = {
            ...input.currentContext,
            ...contextPatch,
        };
        const hasDate = this.hasStringValue(mergedContext.date);
        const hasTimePreference = this.hasTimePreference(mergedContext);
        const shouldSearchWithoutTime = hasDate && this.shouldSearchAvailabilityWithoutTime(input.messageText);
        if (interpretation.intent !== whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING &&
            shouldSearchWithoutTime) {
            return {
                ...interpretation,
                intent: whatsapp_conversation_entity_1.WhatsappConversationIntent.BOOKING,
                contextPatch,
                nextAction: ia_service_types_1.IaConversationNextAction.SEARCH_AVAILABILITY,
                replyText: null,
                missingFields: interpretation.missingFields.filter((field) => !this.isDateTimeServiceOrResourceField(field)),
            };
        }
        if (this.shouldApplyBookingFallback(interpretation)) {
            if ((hasDate && hasTimePreference) || shouldSearchWithoutTime) {
                return {
                    ...interpretation,
                    contextPatch,
                    nextAction: ia_service_types_1.IaConversationNextAction.SEARCH_AVAILABILITY,
                    replyText: null,
                    missingFields: interpretation.missingFields.filter((field) => !this.isDateTimeServiceOrResourceField(field)),
                };
            }
            return {
                ...interpretation,
                contextPatch,
                nextAction: ia_service_types_1.IaConversationNextAction.ASK_CLARIFICATION,
                replyText: this.buildBookingClarificationText(hasDate, hasTimePreference),
                missingFields: this.mergeMissingFields(interpretation.missingFields, hasDate ? [] : ['date'], hasTimePreference ? [] : ['timePreference']),
            };
        }
        return {
            ...interpretation,
            contextPatch,
        };
    }
    shouldApplyBookingFallback(interpretation) {
        return (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.NONE ||
            interpretation.nextAction ===
                ia_service_types_1.IaConversationNextAction.ASK_CLARIFICATION ||
            this.hasOnlyServiceOrResourceMissing(interpretation.missingFields));
    }
    inferBookingContextPatch(messageText) {
        const contextPatch = {};
        const normalizedText = messageText
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        const inferredDate = this.inferDate(normalizedText);
        const inferredTime = this.inferTime(normalizedText);
        const inferredResourcePreferences = this.inferResourcePreferences(normalizedText);
        const inferredCustomerName = this.inferCustomerName(messageText);
        if (inferredDate) {
            contextPatch.date = inferredDate;
        }
        if (inferredTime) {
            contextPatch.timePreference = {
                type: inferredTime.type,
                time: inferredTime.time,
            };
        }
        if (inferredCustomerName) {
            contextPatch.customerName = inferredCustomerName;
        }
        if (inferredResourcePreferences) {
            contextPatch.resourcePreferences = inferredResourcePreferences;
        }
        return contextPatch;
    }
    inferResourcePreferences(normalizedText) {
        if (/\b(techad[ao]s?|indoor|cubiert[ao]s?|bajo techo|adentro)\b/.test(normalizedText)) {
            return {
                isIndoor: true,
            };
        }
        if (/\b(aire libre|outdoor|afuera|exterior|descubiert[ao]s?)\b/.test(normalizedText)) {
            return {
                isIndoor: false,
            };
        }
        return null;
    }
    inferDate(normalizedText) {
        if (/\bmanana\b/.test(normalizedText)) {
            return this.formatDateInTimeZone(1);
        }
        if (/\bhoy\b/.test(normalizedText)) {
            return this.formatDateInTimeZone(0);
        }
        return this.inferWeekdayDate(normalizedText);
    }
    inferWeekdayDate(normalizedText) {
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
        const today = this.getCurrentLocalDateParts();
        const currentDayOfWeek = new Date(Date.UTC(today.year, today.month - 1, today.day)).getUTCDay();
        let daysToAdd = (targetDayOfWeek - currentDayOfWeek + 7) % 7;
        const hasNextModifier = /\b(proximo|proxima)\b/.test(normalizedText) ||
            new RegExp(`\\b${match[1]}\\s+que\\s+viene\\b`).test(normalizedText);
        if (daysToAdd === 0 && hasNextModifier) {
            daysToAdd = 7;
        }
        return this.formatDateInTimeZone(daysToAdd);
    }
    inferTime(normalizedText) {
        const match = /\b(?:a partir de las|a partir de|desde las|desde|despues de las|despues de|tipo|cerca de las|alrededor de las|a eso de las|a las|las)?\s*([01]?\d|2[0-3])(?:(?::|\.)([0-5]\d)|\s*h?s?)\b/.exec(normalizedText);
        if (!match) {
            return null;
        }
        const hour = Number(match[1]);
        const minute = match[2] ?? '00';
        const isFrom = /\b(a partir de|desde|despues de)\b/.test(match[0]);
        const isAround = /\b(tipo|cerca de las|alrededor de las|a eso de las)\b/.test(match[0]);
        return {
            type: isFrom ? 'FROM' : isAround ? 'AROUND' : 'EXACT',
            time: `${String(hour).padStart(2, '0')}:${minute}`,
        };
    }
    inferCustomerName(messageText) {
        const match = /(?:a nombre de|nombre de)\s+(.+)$/i.exec(messageText);
        if (!match) {
            return null;
        }
        const name = match[1]
            .replace(/[?.!,]+$/g, '')
            .replace(/\s+(?:quiero\s+que\s+)?(?:sea|quede)\s+(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\s+(?:es|para)\s+(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\s+(?:es\s+)?(?:la\s+)?reserva\b.*$/i, '')
            .replace(/\b(confirmo|gracias|por favor)\b/gi, '')
            .trim();
        const normalizedName = name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
        if (name.length <= 1 ||
            /\d/.test(name) ||
            /\b(hoy|manana|lunes|martes|miercoles|jueves|viernes|sabado|domingo|proximo|proxima|fecha|hora|hs?)\b/.test(normalizedName)) {
            return null;
        }
        return name;
    }
    formatDateInTimeZone(daysToAdd) {
        const today = this.getCurrentLocalDateParts();
        const date = new Date();
        date.setUTCFullYear(today.year, today.month - 1, today.day + daysToAdd);
        date.setUTCHours(12, 0, 0, 0);
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: DEFAULT_PROMPT_TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .formatToParts(date)
            .reduce((result, part) => {
            if (part.type !== 'literal') {
                result[part.type] = part.value;
            }
            return result;
        }, {});
        return `${parts.year}-${parts.month}-${parts.day}`;
    }
    getCurrentLocalDateParts() {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: DEFAULT_PROMPT_TIME_ZONE,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        })
            .formatToParts(new Date())
            .reduce((result, part) => {
            if (part.type !== 'literal') {
                result[part.type] = part.value;
            }
            return result;
        }, {});
        return {
            year: Number(parts.year),
            month: Number(parts.month),
            day: Number(parts.day),
        };
    }
    hasStringValue(value) {
        return typeof value === 'string' && value.trim().length > 0;
    }
    hasTimePreference(context) {
        const timePreference = context.timePreference;
        return (this.isRecord(timePreference) &&
            typeof timePreference.time === 'string' &&
            /^\d{2}:\d{2}$/.test(timePreference.time));
    }
    hasOnlyServiceOrResourceMissing(missingFields) {
        return (missingFields.length > 0 &&
            missingFields.every((field) => this.isServiceOrResourceField(field)));
    }
    isDateTimeServiceOrResourceField(field) {
        return (this.isServiceOrResourceField(field) ||
            ['date', 'fecha', 'time', 'timepreference', 'horario'].includes(field.toLowerCase()));
    }
    isServiceOrResourceField(field) {
        return [
            'service',
            'serviceid',
            'servicio',
            'resource',
            'resourceid',
        ].includes(field.toLowerCase());
    }
    buildBookingClarificationText(hasDate, hasTimePreference) {
        if (!hasDate && !hasTimePreference) {
            return 'Para que fecha y horario queres reservar?';
        }
        if (!hasDate) {
            return 'Para que fecha queres reservar?';
        }
        return 'En que horario te gustaria reservar?';
    }
    mergeMissingFields(current, ...fieldsToAdd) {
        return Array.from(new Set([...current, ...fieldsToAdd.flat()]));
    }
    parseRequestTimeout(timeoutValue) {
        const parsedTimeout = timeoutValue ? Number(timeoutValue) : 8000;
        if (!Number.isInteger(parsedTimeout) || parsedTimeout <= 0) {
            return 8000;
        }
        return parsedTimeout;
    }
    normalizeGeminiResponse(value) {
        if (!this.isRecord(value)) {
            return {};
        }
        const response = {};
        if (Array.isArray(value.candidates)) {
            response.candidates = value.candidates
                .filter((candidate) => this.isRecord(candidate))
                .map((candidate) => ({
                content: this.normalizeGeminiContent(candidate.content),
            }));
        }
        if (this.isRecord(value.error)) {
            response.error = {
                message: typeof value.error.message === 'string'
                    ? value.error.message
                    : undefined,
                code: typeof value.error.code === 'number' ? value.error.code : undefined,
                status: typeof value.error.status === 'string'
                    ? value.error.status
                    : undefined,
            };
        }
        return response;
    }
    normalizeGeminiContent(value) {
        if (!this.isRecord(value) || !Array.isArray(value.parts)) {
            return undefined;
        }
        return {
            parts: value.parts
                .filter((part) => this.isRecord(part))
                .map((part) => ({
                text: typeof part.text === 'string' ? part.text : undefined,
            })),
        };
    }
    parseJsonObject(value) {
        const parsedValue = JSON.parse(value);
        if (!this.isRecord(parsedValue)) {
            throw new common_1.ServiceUnavailableException('Gemini response is not an object');
        }
        return parsedValue;
    }
    normalizeIntent(value) {
        if (typeof value === 'string' &&
            Object.values(whatsapp_conversation_entity_1.WhatsappConversationIntent).includes(value)) {
            return value;
        }
        return whatsapp_conversation_entity_1.WhatsappConversationIntent.UNKNOWN;
    }
    normalizeStatus(value) {
        if (typeof value === 'string' &&
            Object.values(whatsapp_conversation_entity_1.WhatsappConversationStatus).includes(value)) {
            return value;
        }
        return whatsapp_conversation_entity_1.WhatsappConversationStatus.ACTIVE;
    }
    normalizeNextAction(value) {
        if (typeof value === 'string' &&
            Object.values(ia_service_types_1.IaConversationNextAction).includes(value)) {
            return value;
        }
        return ia_service_types_1.IaConversationNextAction.NONE;
    }
    normalizeConfidence(value) {
        if (typeof value !== 'number' || !Number.isFinite(value)) {
            return 0;
        }
        return Math.min(Math.max(value, 0), 1);
    }
    normalizeJsonObject(value) {
        if (!this.isRecord(value)) {
            return {};
        }
        return JSON.parse(JSON.stringify(value));
    }
    normalizeStringArray(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
    }
    isRecord(value) {
        return typeof value === 'object' && value !== null && !Array.isArray(value);
    }
    isAbortError(error) {
        return error instanceof Error && error.name === 'AbortError';
    }
};
exports.IaServiceService = IaServiceService;
exports.IaServiceService = IaServiceService = IaServiceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        ia_error_logger_service_1.IaErrorLoggerService])
], IaServiceService);
//# sourceMappingURL=ia-service.service.js.map