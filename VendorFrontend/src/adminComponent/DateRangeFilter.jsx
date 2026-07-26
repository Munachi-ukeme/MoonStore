import { useState } from "react";
import { getPresetDateRange, toInputDateString } from "../utils/dateFilter";
import styles from "./DateRangeFilter.module.css";

const PRESETS = [
    { value: "all", label: "All Time" },
    { value: "today", label: "Today" },
    { value: "yesterday", label: "Yesterday" },
    { value: "thisWeek", label: "This Week" },
    { value: "thisMonth", label: "This Month" },
    { value: "lastMonth", label: "Last Month" },
    { value: "thisYear", label: "This Year" },
    { value: "lastYear", label: "Last Year" },
    { value: "custom", label: "Custom Range" },
];

// onChange receives (startDateString, endDateString) — both "" when "All Time"
const DateRangeFilter = ({ onChange }) => {
    const [preset, setPreset] = useState("all");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    const handlePresetChange = (value) => {
        setPreset(value);

        if (value === "all") {
            onChange("", "");
            return;
        }

        if (value === "custom") {
            onChange(customStart, customEnd);
            return;
        }

        const range = getPresetDateRange(value);
        onChange(toInputDateString(range.start), toInputDateString(range.end));
    };

    const handleCustomStartChange = (value) => {
        setCustomStart(value);
        onChange(value, customEnd);
    };

    const handleCustomEndChange = (value) => {
        setCustomEnd(value);
        onChange(customStart, value);
    };

    return (
        <div className={styles.wrapper}>
            <select
                className={styles.select}
                value={preset}
                onChange={(e) => handlePresetChange(e.target.value)}
            >
                {PRESETS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                ))}
            </select>

            {preset === "custom" ? (
                <div className={styles.customRow}>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={customStart}
                        onChange={(e) => handleCustomStartChange(e.target.value)}
                    />
                    <span className={styles.toLabel}>to</span>
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={customEnd}
                        onChange={(e) => handleCustomEndChange(e.target.value)}
                    />
                </div>
            ) : null}
        </div>
    );
};

export default DateRangeFilter;