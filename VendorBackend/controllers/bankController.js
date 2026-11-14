const { listBanks, resolveBankAccount } = require("../utils/escrowpay");

// GET /api/banks
const getBanks = async (req, res) => {
    try {
        const result = await listBanks();

        if (!result.ok) {
            return res.status(500).json({ message: "Could not load banks" });
        }

        const banks = ((result.data.data && result.data.data.banks) || []).map((bank) => ({
            code: bank.bank_code,
            name: bank.bank_name,
        }));

        res.json({ banks });
    } catch (err) {
        res.status(500).json({ message: "Could not load banks" });
    }
};

// POST /api/banks/resolve
const verifyAccount = async (req, res) => {
    try {
        const { accountNumber, bankCode } = req.body;

        if (typeof accountNumber !== "string" || !/^\d{10}$/.test(accountNumber)) {
            return res.status(400).json({ message: "Enter a valid 10-digit account number" });
        }

        if (typeof bankCode !== "string" || !bankCode.trim() || bankCode.length > 10) {
            return res.status(400).json({ message: "Select a bank" });
        }

        const result = await resolveBankAccount({ bankCode: bankCode.trim(), accountNumber });
        const data = result.data && result.data.data;

        if (!result.ok || !data || data.status !== "verified") {
            return res.status(400).json({ message: "Account not found" });
        }

        res.json({ accountName: data.account_name });
    } catch (err) {
        res.status(500).json({ message: "Could not verify account" });
    }
};

module.exports = { getBanks, verifyAccount };