"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappConversation = exports.WhatsappConversationStatus = exports.WhatsappConversationIntent = void 0;
var WhatsappConversationIntent;
(function (WhatsappConversationIntent) {
    WhatsappConversationIntent["UNKNOWN"] = "UNKNOWN";
    WhatsappConversationIntent["BOOKING"] = "BOOKING";
    WhatsappConversationIntent["VIEW_BOOKINGS"] = "VIEW_BOOKINGS";
    WhatsappConversationIntent["CANCEL_BOOKING"] = "CANCEL_BOOKING";
})(WhatsappConversationIntent || (exports.WhatsappConversationIntent = WhatsappConversationIntent = {}));
var WhatsappConversationStatus;
(function (WhatsappConversationStatus) {
    WhatsappConversationStatus["ACTIVE"] = "ACTIVE";
    WhatsappConversationStatus["HUMAN_REQUIRED"] = "HUMAN_REQUIRED";
    WhatsappConversationStatus["HUMAN_ACTIVE"] = "HUMAN_ACTIVE";
    WhatsappConversationStatus["COMPLETED"] = "COMPLETED";
    WhatsappConversationStatus["EXPIRED"] = "EXPIRED";
})(WhatsappConversationStatus || (exports.WhatsappConversationStatus = WhatsappConversationStatus = {}));
class WhatsappConversation {
    id;
    whatsapp_account_id;
    business_id;
    branch_id;
    customer_id;
    intent;
    status;
    context;
    assigned_user_id;
    last_message_at;
    expires_at;
    created_at;
    updated_at;
}
exports.WhatsappConversation = WhatsappConversation;
//# sourceMappingURL=whatsapp-conversation.entity.js.map