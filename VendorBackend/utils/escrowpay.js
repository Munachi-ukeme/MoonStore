const ESCROWPAY_BASE_URL = process.env.ESCROWPAY_BASE_URL;
const ESCROWPAY_SECRET_KEY = process.env.ESCROW_SECRET_KEY;

const generateIdempotencyKey = () => {
    return crypto.randomUUID();
};

const escrowpayRequest = async (path, method, body) => {
    const response = await fetch(`${ESCROWPAY_BASE_URL}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "X-API-Key": ESCROWPAY_SECRET_KEY,
            "Idempotency-Key": generateIdempotencyKey(),
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    const data = await response.json();

    return { ok: response.ok, data };
};

const onboardParty = async ({ type, identifier, consent, email, name, externalReference }) => {
    return escrowpayRequest("/api/v1/parties/onboard", "POST", {
        type,
        identifier,
        consent,
        email,
        name,
        external_reference: externalReference,
    });
};

const createParty = async ({ name, email }) => {
    return escrowpayRequest("/api/v1/parties", "POST", { name, email });
};

const createPayoutAccount = async ({ partyId, accountNumber, bankCode }) => {
    return escrowpayRequest("/api/v1/payout-accounts", "POST", {
        party_id: partyId,
        account_number: accountNumber,
        bank_code: bankCode,
    });
};

const createTransaction = async ({
    amountMinor,
    payerPartyId,
    beneficiaryPartyId,
    commissionBps,
    description,
    externalReference,
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
        marketplace_commission_bps: commissionBps,
        description,
        external_reference: externalReference,
    });
};

const activateTransaction = async (transactionId) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/activate`, "POST");
};

const createCheckoutSession = async (transactionId) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/checkout-sessions`, "POST", {});
};

const createRelease = async ({ transactionId, amountMinor, reason }) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/releases`, "POST", {
        amount_minor: amountMinor,
        reason,
    });
};

const createRefund = async ({ transactionId, amountMinor, reason }) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}/refunds`, "POST", {
        amount_minor: amountMinor,
        reason,
    });
};

const getTransaction = async (transactionId) => {
    return escrowpayRequest(`/api/v1/transactions/${transactionId}`, "GET");
};

module.exports = {
    onboardParty,
    createParty,
    createPayoutAccount,
    createTransaction,
    activateTransaction,
    createCheckoutSession,
    createRelease,
    createRefund,
    getTransaction,
};