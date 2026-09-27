"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.daysBetween = daysBetween;
exports.isConsistentWithHistory = isConsistentWithHistory;
/**
 * Helper to calculate day difference between two dates
 */
function daysBetween(date1, date2) {
    const d1 = new Date(date1).getTime();
    const d2 = new Date(date2).getTime();
    const diffTime = Math.abs(d1 - d2);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
/**
 * Checks whether current outcome is consistent with previous history
 */
function isConsistentWithHistory(currentOutcome, previousOutcomes) {
    if (!previousOutcomes || previousOutcomes.length === 0)
        return true;
    // If previously employed in same sector or progressive wages
    const prev = previousOutcomes[0];
    if (prev.jobRole && currentOutcome.jobRole && prev.jobRole.toLowerCase() === currentOutcome.jobRole.toLowerCase()) {
        return true;
    }
    if (currentOutcome.wageBandLow && prev.wageBandLow && currentOutcome.wageBandLow >= prev.wageBandLow) {
        return true;
    }
    return true;
}
