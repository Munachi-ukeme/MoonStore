const crypto = require("crypto");

const ESCROWPAY_BASE_URL = (process.env.ESCROWPAY_BASE_URL || "").trim().replace(/\/+$/, "");
const ESCROWPAY_SECRET_KEY = (process.env.ESCROW_SECRET_KEY || "").trim();
console.log("EscrowPay config:", {
    baseUrl: ESCROWPAY_BASE_URL,
    keyLength: ESCROWPAY_SECRET_KEY ? ESCROWPAY_SECRET_KEY.length : 0,
    keyStart: ESCROWPAY_SECRET_KEY ? ESCROWPAY_SECRET_KEY.slice(0, 7) : null,
    hasSpaceOrQuote: ESCROWPAY_SECRET_KEY ? /[\s"']/.test(ESCROWPAY_SECRET_KEY) : null,
});
const REQUEST_TIMEOUT_MS = 20000;

// Idempotency keys must be 16-255 visible ASCII characters. Calls that move money pass their own
// stable key, so retrying after a timeout returns the stored result instead of posting twice.
const generateIdempotencyKey = () => {
    return crypto.randomUUID();
};

// status 0 means no answer was received (timeout or network error), so the outcome is unknown
const escrowpayRequest = async (path, method, body, idempotencyKey) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
        const headers = {
            "Content-Type": "application/json",
            "X-API-Key": ESCROWPAY_SECRET_KEY,
        };

        if (method !== "GET") {
            headers["Idempotency-Key"] = idempotencyKey || generateIdempotencyKey();
        }

        const response = await fetch(`${ESCROWPAY_BASE_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: controller.signal,
        });

        const data = await response.json().catch(() => ({}));

        return { ok: response.ok, status: response.status, data };
    } catch (err) {
        console.error("EscrowPay request failed:", path, err.message);
        return { ok: false, status: 0, data: { message: err.message } };
    } finally {
        clearTimeout(timer);
    }
};

// retrying is only allowed while the object is in a retryable status,
// and EscrowPay needs the object's current version plus a reason
const retryFailedObject = async (basePath, retryableStatuses, reason) => {
    const current = await escrowpayRequest(basePath, "GET");
    const object = current.data && current.data.data;

    if (!current.ok || !object) {
        return { ok: false, status: current.status, data: current.data };
    }

    if (!retryableStatuses.includes(object.status)) {
        return { ok: false, skipped: true, status: current.status, data: current.data };
    }

    const retried = await escrowpayRequest(`${basePath}/retry`, "POST", { version: object.version, reason });

    // 409 means it already completed or is being processed, so there is nothing left to retry
    if (retried.status === 409) {
        return { ...retried, skipped: true };
    }

    return retried;
};

const onboardParty = async ({ type, identifier, dateOfBirth, consent, email, externalReference }) => {
    return escrowpayRequest("/api/v1/parties/onboard", "POST", {
        type,
        identifier,
        date_of_birth: dateOfBirth,
        consent,
        email,
        external_reference: externalReference,
    });
};

const listBanks = async () => {
    return escrowpayRequest("/api/v1/banks", "GET");
};

const resolveBankAccount = async ({ bankCode, accountNumber }) => {
    return escrowpayRequest("/api/v1/bank-accounts/resolve", "POST", {
        bank_code: bankCode,
        account_number: accountNumber,
    });
};

const createPayoutAccount = async ({ ownerType, ownerId, bankCode, accountNumber, isDefault }) => {
    return escrowpayRequest("/api/v1/payout-accounts", "POST", {
        owner_type: ownerType,
        owner_id: ownerId,
        bank_code: bankCode,
        account_number: accountNumber,
        is_default: isDefault,
    });
};

const createTransaction = async ({
    amountMinor,
    payerPartyId,
    beneficiaryPartyId,
    commissionBps,
    description,
    externalReference,
    idempotencyKey,
}) => {
    return escrowpayRequest("/api/v1/transactions", "POST", {
        type: "standard",
        amount_minor: amountMinor,
        currency: "NGN",
        funding_mode: "exact",
        payer: { party_type: "party", party_id: payerPartyId },
        beneficiary: { party_type: "party", party_id: beneficiaryPartyId },
        release_policy: "manual_only",
        refund_policy: "manual_only",
        payout_preference: "retain_in_wallet",
        marketplace_commission_bps: commissionBps,
        description,
        external_reference: externalReference,
    }, idempotencyKey);
};

const getTransaction = async (transactionId) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}`, "GET");
};

const activateTransaction = async (transactionId, idempotencyKey) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/activate`, "POST", undefined, idempotencyKey);
};

const createCheckoutSession = async (transactionId, idempotencyKey) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/checkout-sessions`, "POST", {}, idempotencyKey);
};

const getCheckoutSession = async (sessionId) => {
    return escrowpayRequest(`/api/v1/checkout-sessions/${sessionId}`, "GET");
};

const createRelease = async ({ transactionId, amountMinor, reason, idempotencyKey }) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/releases`, "POST", {
        amount_minor: amountMinor,
        reason,
    }, idempotencyKey);
};

const getRelease = async (releaseId) => {
    return escrowpayRequest(`/api/v1/releases/${releaseId}`, "GET");
};

const createRefund = async ({ transactionId, amountMinor, reason, idempotencyKey }) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/refunds`, "POST", {
        amount_minor: amountMinor,
        source: "escrow_held",
        reason,
    }, idempotencyKey);
};

const createPayout = async ({ walletId, amountMinor, payoutAccountId, transactionId, idempotencyKey }) => {
    return escrowpayRequest(`/api/v1/wallets/${walletId}/payouts`, "POST", {
        amount_minor: amountMinor,
        payout_account_id: payoutAccountId,
        transaction_id: transactionId,
    }, idempotencyKey);
};

const retryRelease = async (releaseId) => {
    return retryFailedObject(`/api/v1/releases/${releaseId}`, ["failed"], "Retrying failed release");
};

const retryRefund = async (refundId) => {
    return retryFailedObject(`/api/v1/refunds/${refundId}`, ["failed", "requires_action"], "Retrying failed refund");
};

const retryPayout = async (payoutId) => {
    return retryFailedObject(`/api/v1/payouts/${payoutId}`, ["failed", "requires_action"], "Retrying failed payout");
};


// finds a person again by the id we stored as external_reference (exact match; there is no email filter)
const findPartyByExternalReference = async (externalReference) => {
    const result = await escrowpayRequest(
        `/api/v1/parties?external_reference=${encodeURIComponent(externalReference)}`,
        "GET"
    );
    const data = result.data && result.data.data;

    let items = [];
    if (Array.isArray(data)) {
        items = data;
    } else if (data && Array.isArray(data.items)) {
        items = data.items;
    }

    return items.find(
        (party) => party.external_reference === externalReference && party.status === "active"
    ) || null;
};


const getCheckoutBootstrap = async (publicToken) => {
    return escrowpayRequest(`/api/v1/checkout/${encodeURIComponent(publicToken)}`, "GET");
};
module.exports = {
    onboardParty,
    listBanks,
    resolveBankAccount,
    createPayoutAccount,
    createTransaction,
    getTransaction,
    activateTransaction,
    createCheckoutSession,
    getCheckoutSession,
    createRelease,
    getRelease,
    createRefund,
    createPayout,
    retryRelease,
    retryRefund,
    retryPayout,
    findPartyByExternalReference,
    getCheckoutBootstrap,
};