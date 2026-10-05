// ⚠️ NOT YET BUILT — Termii's real API docs (endpoint, auth, request shape)
// have not been reviewed. This is a placeholder so the rest of the code
// has something to call without crashing; it currently does nothing.
const sendSms = async ({ to, message }) => {
    console.log(`[SMS STUB] Would send to ${to}: ${message}`);
    // TODO: real Termii API call once docs are reviewed
    return { ok: false, stub: true };
};

module.exports = { sendSms };