// converts a preset label into an actual start/end date
export const getPresetDateRange = (preset) => {
    const now = new Date();

    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const endOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    if (preset === "today") {
        return { start: startOfDay(now), end: endOfDay(now) };
    }

    if (preset === "yesterday") {
        const y = new Date(now);
        y.setDate(y.getDate() - 1);
        return { start: startOfDay(y), end: endOfDay(y) };
    }

    if (preset === "thisWeek") {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - now.getDay()); // getDay(): Sunday = 0
        return { start: startOfDay(weekStart), end: endOfDay(now) };
    }

    if (preset === "thisMonth") {
        return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: endOfDay(now),
        };
    }

    if (preset === "lastMonth") {
        return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
        };
    }

    if (preset === "thisYear") {
        return { start: new Date(now.getFullYear(), 0, 1), end: endOfDay(now) };
    }

    if (preset === "lastYear") {
        return {
            start: new Date(now.getFullYear() - 1, 0, 1),
            end: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
        };
    }

    return null; // "custom" — caller handles this separately
};

// turns a Date into "YYYY-MM-DD" for <input type="date"> — using LOCAL time, not UTC,
// so it doesn't shift a day off depending on timezone
export const toInputDateString = (date) => {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
};