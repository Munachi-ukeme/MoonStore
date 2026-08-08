// Calculates what a buyer must pay so Paystack's own processing fee
// never eats into the seller's real price or MoonStore's platform fee.
// Paystack NG fee: 1.5% + ₦100 flat (waived under ₦2,500), capped at ₦2,000 total fee.
export const grossUpPrice = (realPrice) => {
    const flatFee = realPrice >= 2500 ? 100 : 0;
    let buyerCharge = Math.ceil((realPrice + flatFee) / (1 - 0.015));

    const actualFee = buyerCharge - realPrice;
    if (actualFee > 2000) {
        buyerCharge = realPrice + 2000;
    }

    return buyerCharge;
};