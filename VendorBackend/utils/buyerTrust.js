const MAX_TRUSTED_SESSIONS = 20;
const SESSION_ID_PATTERN = /^[A-Za-z0-9-]{10,100}$/;

const isValidSessionId = (value) => {
    return typeof value === "string" && SESSION_ID_PATTERN.test(value);
};

const isSessionTrusted = (buyer, sessionId) => {
    return !!buyer && isValidSessionId(sessionId) && buyer.trustedSessionIds.includes(sessionId);
};

const addTrustedSessions = (buyer, sessionIds) => {
    sessionIds.forEach((sessionId) => {
        if (isValidSessionId(sessionId) && !buyer.trustedSessionIds.includes(sessionId)) {
            buyer.trustedSessionIds.push(sessionId);
        }
    });

    if (buyer.trustedSessionIds.length > MAX_TRUSTED_SESSIONS) {
        buyer.trustedSessionIds = buyer.trustedSessionIds.slice(-MAX_TRUSTED_SESSIONS);
    }
};

module.exports = { isValidSessionId, isSessionTrusted, addTrustedSessions };