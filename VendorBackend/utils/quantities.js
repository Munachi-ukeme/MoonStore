const getQuantityEntries = (quantities) => {
    if (!quantities) return [];
    if (quantities instanceof Map) return Array.from(quantities.entries());
    return Object.entries(quantities);
};

module.exports = { getQuantityEntries };