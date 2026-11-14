const getEscrowErrorCode = (data) => {
    if (data && data.detail && data.detail.code) return data.detail.code;
    if (data && data.code) return data.code;
    return null;
};

const describeOnboardingError = (data) => {
    const code = getEscrowErrorCode(data);

    if (code === "identity_verification_failed") {
        return {
            status: 422,
            message: "We couldn't verify those details. Check that your NIN and date of birth match your NIN record exactly.",
        };
    }


    if (code === "identity_requires_review") {
        return {
            status: 422,
            message: "Your details need a manual review. Please contact MoonStore support on WhatsApp.",
        };
    }

        if (code === "identity_already_exists") {
        return {
            status: 409,
            message: "This NIN is already registered with MoonStore under another account. Use the same email you used before, or contact MoonStore support.",
        };
    }

    if (code === "date_of_birth_required") {
        return { status: 400, message: "Enter your date of birth." };
    }

    if (code === "provider_capability_unavailable") {
        return {
            status: 500,
            message: "Identity verification is temporarily unavailable. Please try again shortly.",
        };
    }

    if (code === "insufficient_wallet_balance") {
        return {
            status: 500,
            message: "Verification is temporarily unavailable. Please try again later.",
            alertAdmin: true,
        };
    }

    return {
        status: 422,
        message: "We couldn't verify your details. Check your NIN and date of birth, or contact support.",
    };
};

module.exports = { getEscrowErrorCode, describeOnboardingError };