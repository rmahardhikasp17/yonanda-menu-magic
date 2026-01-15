/**
 * Receipt Counter Management
 * 
 * @description Anti-fraud receipt numbering system.
 * - Sequential counters per receipt type
 * - Counters increment ONLY on successful print (confirm pattern)
 * - Counters persist in LocalStorage
 * - Missing numbers indicate potential fraud
 */

import { ReceiptType, ReceiptCounter, ReceiptCounters, RECEIPT_PREFIXES } from '@/types/hotel';

const STORAGE_KEY = 'receipt_counters';

// Default state for new installations (start from 0000)
const DEFAULT_COUNTERS: ReceiptCounters = {
    checkin: { lastNumber: 0, lastPrintedAt: '' },
    checkout: { lastNumber: 0, lastPrintedAt: '' },
    kantin_tamu: { lastNumber: 0, lastPrintedAt: '' },
    kantin_nontamu: { lastNumber: 0, lastPrintedAt: '' },
};

/**
 * Get all receipt counters from LocalStorage
 */
export function getReceiptCounters(): ReceiptCounters {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) return { ...DEFAULT_COUNTERS };

        const parsed = JSON.parse(stored) as ReceiptCounters;

        // Validate structure to prevent tampering
        if (!parsed.checkin || !parsed.checkout ||
            !parsed.kantin_tamu || !parsed.kantin_nontamu) {
            console.warn('Invalid counter structure detected, using defaults');
            return { ...DEFAULT_COUNTERS };
        }

        return parsed;
    } catch (error) {
        console.error('Failed to parse receipt counters:', error);
        return { ...DEFAULT_COUNTERS };
    }
}

/**
 * Save receipt counters to LocalStorage
 */
function saveReceiptCounters(counters: ReceiptCounters): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(counters));
}

/**
 * Reserve (preview) the next receipt number WITHOUT incrementing.
 * Use this for display on receipt preview before printing.
 * 
 * @param type - Receipt type to preview
 * @returns Formatted receipt number that WILL be assigned on confirm
 */
export function reserveReceiptNumber(type: ReceiptType): string {
    const counters = getReceiptCounters();
    const nextNumber = counters[type].lastNumber + 1;
    const prefix = RECEIPT_PREFIXES[type];
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Confirm receipt number AFTER successful print.
 * This is the ONLY function that increments the counter.
 * Call this ONLY after the print dialog completes successfully.
 * 
 * @param type - Receipt type to confirm
 * @returns The confirmed receipt number
 */
export function confirmReceiptNumber(type: ReceiptType): string {
    const counters = getReceiptCounters();

    // Increment counter
    counters[type].lastNumber += 1;
    counters[type].lastPrintedAt = new Date().toISOString();

    // Save after successful print
    saveReceiptCounters(counters);

    // Format with prefix and zero-padding
    const prefix = RECEIPT_PREFIXES[type];
    const number = counters[type].lastNumber.toString().padStart(4, '0');

    return `${prefix}${number}`;
}

/**
 * @deprecated Use reserveReceiptNumber + confirmReceiptNumber instead
 * Generate next receipt number (legacy - increments immediately)
 */
export function generateReceiptNumber(type: ReceiptType): string {
    return confirmReceiptNumber(type);
}

/**
 * Get current counter value without incrementing
 * For display/audit purposes only
 */
export function getCurrentCounterValue(type: ReceiptType): number {
    const counters = getReceiptCounters();
    return counters[type].lastNumber;
}

/**
 * Format a counter value with prefix
 */
export function formatReceiptNumber(type: ReceiptType, number: number): string {
    const prefix = RECEIPT_PREFIXES[type];
    return `${prefix}${number.toString().padStart(4, '0')}`;
}

/**
 * Get last printed timestamp for a counter
 */
export function getLastPrintedAt(type: ReceiptType): string | null {
    const counters = getReceiptCounters();
    return counters[type].lastPrintedAt || null;
}

/**
 * Reset a specific counter (ADMIN ONLY)
 * This should only be called from the Owner Admin Menu with PIN verification
 * 
 * @param type - Receipt type to reset
 * @param newValue - Optional new starting value (default: 0)
 * @returns Object with previous and new values for audit logging
 */
export function resetCounter(type: ReceiptType, newValue: number = 0): { from: number; to: number } {
    const counters = getReceiptCounters();
    const previousValue = counters[type].lastNumber;

    counters[type].lastNumber = newValue;
    counters[type].lastPrintedAt = ''; // Clear timestamp on reset
    saveReceiptCounters(counters);

    return { from: previousValue, to: newValue };
}

/**
 * Reset ALL counters (ADMIN ONLY)
 * Use with extreme caution - this is typically only for new fiscal year or audit reset
 */
export function resetAllCounters(): void {
    saveReceiptCounters({ ...DEFAULT_COUNTERS });
}

/**
 * Get audit summary for all counters
 * Returns current state of all counters for owner review
 */
export function getCounterAuditSummary(): {
    type: ReceiptType;
    prefix: string;
    lastNumber: number;
    lastPrintedAt: string | null;
    nextNumber: string;
}[] {
    const counters = getReceiptCounters();

    return (Object.keys(counters) as ReceiptType[]).map(type => ({
        type,
        prefix: RECEIPT_PREFIXES[type],
        lastNumber: counters[type].lastNumber,
        lastPrintedAt: counters[type].lastPrintedAt || null,
        nextNumber: `${RECEIPT_PREFIXES[type]}${(counters[type].lastNumber + 1).toString().padStart(4, '0')}`,
    }));
}

/**
 * Get all counter labels for display
 */
export const RECEIPT_TYPE_LABELS: Record<ReceiptType, string> = {
    checkin: 'Check-In',
    checkout: 'Check-Out',
    kantin_tamu: 'Kantin Tamu',
    kantin_nontamu: 'Kantin Non-Tamu',
};

