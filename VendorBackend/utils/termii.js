const TERMII_BASE_URL = process.env.TERMII_BASE_URL;
const TERMII_API_KEY = process.env.TERMII_API_KEY;
const TERMII_SENDER_ID = process.env.TERMII_SENDER_ID;

const formatPhoneForTermii = (phone) => {
    if (!phone) return null;
    const digitsOnly = phone.replace(/\D/g, "");

    if (digitsOnly.startsWith("234")) return digitsOnly;
    if (digitsOnly.startsWith("0")) return `234${digitsOnly.slice(1)}`;
    return digitsOnly;
};

const sendSms = async ({ to, message }) => {
    const formattedNumber = formatPhoneForTermii(to);

    if (!formattedNumber) {
        console.error("Termii SMS skipped: no valid phone number provided");
        return { ok: false, error: "No phone number" };
    }

    try {
        const response = await fetch(`${TERMII_BASE_URL}/api/sms/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                api_key: TERMII_API_KEY,
                to: formattedNumber,
                from: TERMII_SENDER_ID,
                sms: message,
                type: "plain",
                channel: "dnd",
            }),
        });

        const data = await response.json();

        if (data.code !== "ok") {
            console.error("Termii SMS failed:", data.message);
            return { ok: false, error: data.message };
        }

        return { ok: true, messageId: data.message_id };
    } catch (err) {
        console.error("Termii SMS error:", err.message);
        return { ok: false, error: err.message };
    }
};

module.exports = { sendSms, formatPhoneForTermii };