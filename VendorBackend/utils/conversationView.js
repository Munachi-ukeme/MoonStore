// internal payment bookkeeping that must never be sent to a browser
const INTERNAL_FIELDS = [
    "releaseIdemKey",
    "refundIdemKey",
    "payoutIdemKey",
    "releaseId",
    "refundId",
    "payoutId",
    "releaseRequestedAt",
    "refundRequestedAt",
    "payoutRequestedAt",
    "checkoutSessionId",
    "checkoutPublicToken",
];

const PIN_FIELDS = ["deliveryPin", "deliveryPinAttempts", "deliveryPinLockedUntil"];

const removeInternalFields = (conversationObject) => {
    INTERNAL_FIELDS.forEach((field) => {
        delete conversationObject[field];
    });

    return conversationObject;
};

const removePinFields = (conversationObject) => {
    PIN_FIELDS.forEach((field) => {
        delete conversationObject[field];
    });

    return conversationObject;
};

module.exports = { removeInternalFields, removePinFields };