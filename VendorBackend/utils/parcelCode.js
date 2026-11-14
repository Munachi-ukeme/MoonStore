const crypto = require("crypto");

// a short code the seller writes on the parcel; the buyer checks it matches their own screen
const generateParcelCode = () => {
    return crypto.randomInt(1000, 10000).toString();
};

module.exports = { generateParcelCode };