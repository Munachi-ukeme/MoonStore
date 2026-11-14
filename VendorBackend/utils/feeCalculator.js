const readNumber = (name) => {
    const raw = process.env[name];
    const value = Number(raw);

    if (!raw || Number.isNaN(value) || value < 0) {
        throw new Error(`Missing or invalid ${name} in environment variables`);
    }

    return value;
};

const RATE = readNumber("COMMISSION_RATE");
const MIN_FEE = readNumber("COMMISSION_MIN_NAIRA");
const MAX_FEE = readNumber("COMMISSION_MAX_NAIRA");

if (RATE <= 0 || RATE >= 1) {
    throw new Error("COMMISSION_RATE must be a decimal between 0 and 1 (example: 0.04 for 4%)");
}

if (MIN_FEE > MAX_FEE) {
    throw new Error("COMMISSION_MIN_NAIRA cannot be greater than COMMISSION_MAX_NAIRA");
}

const calculateCommissionNaira = (productAmount) => {
    let commission = productAmount * RATE;

    if (commission < MIN_FEE) commission = MIN_FEE;
    if (commission > MAX_FEE) commission = MAX_FEE;

    return Math.round(commission);
};

const calculateCommissionBps = (totalAmount) => {
    const commission = calculateCommissionNaira(totalAmount);
    const bps = Math.round((commission / totalAmount) * 10000);

    return bps;
};

module.exports = { calculateCommissionNaira, calculateCommissionBps };