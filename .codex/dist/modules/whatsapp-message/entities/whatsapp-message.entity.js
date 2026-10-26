"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappMessage = exports.WhatsappMessageType = exports.WhatsappMessageStatus = exports.WhatsappMessageDirection = void 0;
var WhatsappMessageDirection;
(function (WhatsappMessageDirection) {
    WhatsappMessageDirection["INBOUND"] = "INBOUND";
    WhatsappMessageDirection["OUTBOUND"] = "OUTBOUND";
})(WhatsappMessageDirection || (exports.WhatsappMessageDirection = WhatsappMessageDirection = {}));
var WhatsappMessageStatus;
(function (WhatsappMessageStatus) {
    WhatsappMessageStatus["RECEIVED"] = "RECEIVED";
    WhatsappMessageStatus["PENDING"] = "PENDING";
    WhatsappMessageStatus["SENT"] = "SENT";
    WhatsappMessageStatus["DELIVERED"] = "DELIVERED";
    WhatsappMessageStatus["READ"] = "READ";
    WhatsappMessageStatus["FAILED"] = "FAILED";
})(WhatsappMessageStatus || (exports.WhatsappMessageStatus = WhatsappMessageStatus = {}));
var WhatsappMessageType;
(function (WhatsappMessageType) {
    WhatsappMessageType["TEXT"] = "TEXT";
    WhatsappMessageType["IMAGE"] = "IMAGE";
    WhatsappMessageType["DOCUMENT"] = "DOCUMENT";
    WhatsappMessageType["AUDIO"] = "AUDIO";
    WhatsappMessageType["VIDEO"] = "VIDEO";
    WhatsappMessageType["INTERACTIVE"] = "INTERACTIVE";
    WhatsappMessageType["TEMPLATE"] = "TEMPLATE";
})(WhatsappMessageType || (exports.WhatsappMessageType = WhatsappMessageType = {}));
class WhatsappMessage {
    id;
    conversation_id;
    whatsapp_account_id;
    customer_id;
    direction;
    message_type;
    provider_message_id;
    content;
    status;
    sent_at;
    received_at;
    created_at;
    updated_at;
}
exports.WhatsappMessage = WhatsappMessage;
//# sourceMappingURL=whatsapp-message.entity.js.map