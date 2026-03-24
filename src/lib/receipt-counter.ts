/**
 * Receipt Counter Management — IndexedDB Backend
 *
 * @description Anti-fraud receipt numbering system.
 * - Sequential counters per receipt type
 * - Counters increment ONLY on successful print (confirm pattern)
 * - Counters persist in IndexedDB (owner_config store)
 * - Missing numbers indicate potential fraud
 *
 * MIGRATION: Previously stored in LocalStorage under 'receipt_counters'.
 * Now stored in IndexedDB owner_config store with key 'receipt_counters'.
 */

import { ReceiptType, ReceiptCounters, RECEIPT_PREFIXES } from '@/types/hotel';
import { getDB, STORES } from '@/lib/db';

const CONFIG_KEY = 'receipt_counters';
const LS_LEGACY_KEY = 'receipt_counters'; // For migration

// Default state for new installations (start from 0000)
const DEFAULT_COUNTERS: ReceiptCounters = {
    checkin: { lastNumber: 0, lastPrintedAt: '' },
    checkout: { lastNumber: 0, lastPrintedAt: '' },
    kantin_tamu: { lastNumber: 0, lastPrintedAt: '' },
    kantin_nontamu: { lastNumber: 0, lastPrintedAt: '' },
};

/**
 * Get all receipt counters from IndexedDB
 * On first call, migrates from LocalStorage if existing data is found.
 */
export async function getReceiptCounters(): Promise<ReceiptCounters> {
    try {
        const db = await getDB();

        const stored = await new Promise<{ key: string; value: ReceiptCounters } | undefined>((resolve, reject) => {
            const tx = db.transaction(STORES.OWNER_CONFIG, 'readonly');
            const store = tx.objectStore(STORES.OWNER_CONFIG);
            const request = store.get(CONFIG_KEY);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(new Error('Failed to read receipt counters'));
        });

        if (stored?.value) {
            // Validate structure
            const parsed = stored.value;
            if (parsed.checkin && parsed.checkout && parsed.kantin_tamu && parsed.kantin_nontamu) {
                return parsed;
            }
        }

        // Try to migrate from LocalStorage
        const legacyData = localStorage.getItem(LS_LEGACY_KEY);
        if (legacyData) {
            try {
                const parsed = JSON.parse(legacyData) as ReceiptCounters;
                if (parsed.checkin && parsed.checkout && parsed.kantin_tamu && parsed.kantin_nontamu) {
                    // Save to IndexedDB
                    await saveReceiptCounters(parsed);
                    // Remove from LocalStorage after successful migration
                    localStorage.removeItem(LS_LEGACY_KEY);
                    console.log('[ReceiptCounter] Migrated from LocalStorage → IndexedDB');
                    return parsed;
                }
            } catch {
                // Invalid legacy data, use defaults
            }
        }

        // No data found, initialize with defaults
        await saveReceiptCounters(DEFAULT_COUNTERS);
        return { ...DEFAULT_COUNTERS };
    } catch (error) {
        console.error('Failed to get receipt counters:', error);
        return { ...DEFAULT_COUNTERS };
    }
}

/**
 * Save receipt counters to IndexedDB
 */
async function saveReceiptCounters(counters: ReceiptCounters): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORES.OWNER_CONFIG, 'readwrite');
        const store = tx.objectStore(STORES.OWNER_CONFIG);
        const request = store.put({ key: CONFIG_KEY, value: counters });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to save receipt counters'));
    });
}

/**
 * Reserve (preview) the next receipt number WITHOUT incrementing.
 * Use this for display on receipt preview before printing.
 */
export async function reserveReceiptNumber(type: ReceiptType): Promise<string> {
    const counters = await getReceiptCounters();
    const nextNumber = counters[type].lastNumber + 1;
    const prefix = RECEIPT_PREFIXES[type];
    return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
}

/**
 * Confirm receipt number AFTER successful print.
 * This is the ONLY function that increments the counter.
 * Call this ONLY after the print dialog completes successfully.
 */
export async function confirmReceiptNumber(type: ReceiptType): Promise<string> {
    const counters = await getReceiptCounters();

    // Increment counter
    counters[type].lastNumber += 1;
    counters[type].lastPrintedAt = new Date().toISOString();

    // Save after successful print
    await saveReceiptCounters(counters);

    // Format with prefix and zero-padding
    const prefix = RECEIPT_PREFIXES[type];
    const number = counters[type].lastNumber.toString().padStart(4, '0');

    return `${prefix}${number}`;
}

/**
 * @deprecated Use reserveReceiptNumber + confirmReceiptNumber instead
 * Generate next receipt number (legacy - increments immediately)
 */
export async function generateReceiptNumber(type: ReceiptType): Promise<string> {
    return confirmReceiptNumber(type);
}

/**
 * Get current counter value without incrementing
 * For display/audit purposes only
 */
export async function getCurrentCounterValue(type: ReceiptType): Promise<number> {
    const counters = await getReceiptCounters();
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
export async function getLastPrintedAt(type: ReceiptType): Promise<string | null> {
    const counters = await getReceiptCounters();
    return counters[type].lastPrintedAt || null;
}

/**
 * Reset a specific counter (ADMIN ONLY)
 * This should only be called from the Owner Admin Menu with PIN verification
 */
export async function resetCounter(type: ReceiptType, newValue: number = 0): Promise<{ from: number; to: number }> {
    const counters = await getReceiptCounters();
    const previousValue = counters[type].lastNumber;

    counters[type].lastNumber = newValue;
    counters[type].lastPrintedAt = ''; // Clear timestamp on reset
    await saveReceiptCounters(counters);

    return { from: previousValue, to: newValue };
}

/**
 * Reset ALL counters (ADMIN ONLY)
 * Use with extreme caution - this is typically only for new fiscal year or audit reset
 */
export async function resetAllCounters(): Promise<void> {
    await saveReceiptCounters({ ...DEFAULT_COUNTERS });
}

/**
 * Get audit summary for all counters
 */
export async function getCounterAuditSummary(): Promise<{
    type: ReceiptType;
    prefix: string;
    lastNumber: number;
    lastPrintedAt: string | null;
    nextNumber: string;
}[]> {
    const counters = await getReceiptCounters();

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
