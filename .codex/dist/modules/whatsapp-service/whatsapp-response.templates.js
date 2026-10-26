"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.whatsappResponseTemplates = void 0;
exports.buildDeterministicWhatsappReply = buildDeterministicWhatsappReply;
const ia_service_types_1 = require("../ia-service/ia-service.types");
const whatsapp_conversation_entity_1 = require("../whatsapp-conversation/entities/whatsapp-conversation.entity");
exports.whatsappResponseTemplates = {
    greeting: () => '¡Hola! ¿Cómo estás? Decime qué día y a qué hora querés reservar, y te busco un turno.',
    askName: () => 'Perfecto. ¿A nombre de quién hago la reserva?',
    askDate: () => '¿Para qué fecha querés reservar?',
    askTime: () => '¿En qué horario te gustaría reservar?',
    askDateAndTime: () => 'Dale. ¿Para qué día y horario querés que te busque turno?',
    askService: () => '¿Qué querés reservar?',
    serviceListBody: () => '¡Hola! ¿Qué te gustaría reservar? Elegí una opción de la lista 👇',
    serviceListButton: () => 'Ver servicios',
    serviceListSectionTitle: () => 'Servicios',
    serviceResourceListBody: () => '¡Hola! ¿Qué te gustaría reservar y con quién? Elegí una opción 👇',
    serviceResourceListButton: () => 'Ver opciones',
    serviceResourceListSectionTitle: () => 'Opciones',
    resourceListBody: (serviceName) => `Perfecto. ¿Con cuál querés reservar ${serviceName}? Elegí una opción 👇`,
    resourceListButton: () => 'Ver opciones',
    resourceListSectionTitle: () => 'Opciones',
    noResourcesForService: () => 'No encontré recursos activos para ese servicio. Probemos con otra opción.',
    customerConfirmation: (name) => `La reserva sería a nombre de ${name}, ¿verdad?`,
    bookingSummary: (data) => {
        const businessType = data.businessType?.trim().toUpperCase();
        const isBeauty = businessType === 'BEAUTY';
        const resourceLabel = isBeauty ? 'Profesional' : 'Cancha';
        const serviceLine = isBeauty
            ? data.serviceName
                ? `✂️ Servicio: ${data.serviceName}`
                : null
            : data.serviceName
                ? `🏟️ Servicio: ${data.serviceName}`
                : null;
        const resourceName = data.resourceName ?? data.branchName;
        const lines = [
            '¡Genial! Te dejo el resumen de la reserva:',
            '',
            serviceLine,
            data.date ? `📅 Fecha: ${data.date}` : null,
            data.time ? `🕘 Horario: ${data.time}` : null,
            resourceName ? `📍 ${resourceLabel}: ${resourceName}` : null,
            data.customerName ? `👤 A nombre de: ${data.customerName}` : null,
            '',
            '¿Confirmás la reserva?',
        ].filter((line) => line !== null);
        return lines.join('\n');
    },
    bookingConfirmed: () => 'Listo ✅ Tu reserva quedó confirmada.',
    bookingRejected: () => 'Dale, no confirmo esa reserva. Si querés buscar otro horario, decime día y hora y lo vemos.',
    error: () => 'Perdón, no pude completar la operación. Probemos de nuevo en un momento.',
    noAvailability: () => 'No encontré disponibilidad para ese horario. ¿Querés que busque opciones cercanas?',
    requestedTimeAvailableAskName: (time) => `Perfecto, hay disponibilidad a las ${time}. ¿A nombre de quién hacemos la reserva?`,
    requestedTimeUnavailable: (requestedTime, slots) => {
        if (slots.length === 0) {
            return `A las ${requestedTime} no tengo disponibilidad y no encontré horarios alternativos para ese día.`;
        }
        const options = slots
            .map((slot, index) => `${index + 1}. ${slot.label ?? slot.startsAt}`)
            .join('\n');
        return `A las ${requestedTime} no tengo disponibilidad. Tengo estas opciones:\n${options}`;
    },
    requestedTimeUnavailableListBody: (requestedTime) => `A las ${requestedTime} no tengo disponibilidad. Te dejo algunas opciones cercanas 👇`,
    cancellationConfirmed: () => 'Listo, la reserva quedó cancelada.',
    customerBookingsEmpty: () => 'No encontré reservas activas a tu nombre.',
    customerBookingsIntro: () => 'Estas son tus próximas reservas:',
    cancelBookingSelectionBody: () => 'Encontré estas reservas activas. Elegí cuál querés cancelar 👇',
    cancelBookingNotMatched: () => 'No pude identificar cuál reserva querés cancelar.',
    bookingCancellationConfirmed: (data) => {
        const details = [
            `${data.date} a las ${data.time}`,
            data.serviceName,
            data.resourceName ?? data.branchName,
        ]
            .filter(Boolean)
            .join(' · ');
        return `Listo, cancelamos tu reserva (${details}). Gracias por avisarnos.`;
    },
    bookingCancellationConfirmationQuestion: (data) => `¿Querés que cancelemos tu reserva del ${data.date} a las ${data.time}?`,
    bookingCancellationKept: () => 'Dale, no cancelo la reserva. Si necesitás otra cosa, escribime.',
    humanRequired: () => 'Te derivo con una persona para que pueda ayudarte mejor.',
    clarification: () => 'No terminé de entender. ¿Querés reservar, ver tus turnos, cancelar o cambiar una reserva?',
    availabilityListBody: () => 'Te paso los horarios que tengo disponibles 👇\nElegí una opción de la lista o escribime el horario.',
    availabilityListButton: () => 'Ver horarios',
    availabilityListSectionTitle: () => 'Horarios disponibles',
    availabilityMessage: (slots) => {
        if (slots.length === 0) {
            return exports.whatsappResponseTemplates.noAvailability();
        }
        const options = slots
            .map((slot, index) => `${index + 1}. ${slot.label ?? slot.startsAt}`)
            .join('\n');
        return `Te paso los horarios que tengo disponibles:\n${options}\nDecime cuál querés y a nombre de quién hacemos la reserva.`;
    },
};
function buildDeterministicWhatsappReply(interpretation) {
    if (interpretation.status === whatsapp_conversation_entity_1.WhatsappConversationStatus.HUMAN_REQUIRED ||
        interpretation.nextAction === ia_service_types_1.IaConversationNextAction.HANDOFF_HUMAN) {
        return exports.whatsappResponseTemplates.humanRequired();
    }
    if (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.ASK_CLARIFICATION) {
        return buildClarificationReply(interpretation);
    }
    if (interpretation.nextAction === ia_service_types_1.IaConversationNextAction.NONE &&
        interpretation.replyText) {
        return interpretation.replyText;
    }
    if (interpretation.intent === whatsapp_conversation_entity_1.WhatsappConversationIntent.UNKNOWN &&
        interpretation.nextAction === ia_service_types_1.IaConversationNextAction.NONE) {
        return exports.whatsappResponseTemplates.greeting();
    }
    return null;
}
function buildClarificationReply(interpretation) {
    const missingFields = new Set(interpretation.missingFields.map((field) => field.toLowerCase()));
    if (missingFields.has('customername') || missingFields.has('name')) {
        return exports.whatsappResponseTemplates.askName();
    }
    if ((missingFields.has('date') || missingFields.has('fecha')) &&
        (missingFields.has('time') ||
            missingFields.has('timepreference') ||
            missingFields.has('horario'))) {
        return exports.whatsappResponseTemplates.askDateAndTime();
    }
    if (missingFields.has('date') || missingFields.has('fecha')) {
        return exports.whatsappResponseTemplates.askDate();
    }
    if (missingFields.has('time') ||
        missingFields.has('timepreference') ||
        missingFields.has('horario')) {
        return exports.whatsappResponseTemplates.askTime();
    }
    if (missingFields.has('service') ||
        missingFields.has('serviceid') ||
        missingFields.has('servicio')) {
        return exports.whatsappResponseTemplates.askService();
    }
    return interpretation.replyText ?? exports.whatsappResponseTemplates.clarification();
}
//# sourceMappingURL=whatsapp-response.templates.js.map