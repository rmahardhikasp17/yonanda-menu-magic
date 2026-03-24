/**
 * React Hook for Receipt Counter Management
 *
 * Use reserveNumber for preview, confirmNumber ONLY after successful print.
 * All operations are async (IndexedDB backend).
 */

import { useCallback } from 'react';
import { ReceiptType, RECEIPT_PREFIXES } from '@/types/hotel';
import {
    reserveReceiptNumber,
    confirmReceiptNumber,
    generateReceiptNumber,
    getCurrentCounterValue,
    getLastPrintedAt,
    resetCounter,
    getCounterAuditSummary,
    RECEIPT_TYPE_LABELS,
} from '@/lib/receipt-counter';

export function useReceiptCounter() {
    /**
     * Reserve (preview) next receipt number WITHOUT incrementing.
     * Use this for display on receipt preview before printing.
     */
    const reserveNumber = useCallback(async (type: ReceiptType): Promise<string> => {
        return reserveReceiptNumber(type);
    }, []);

    /**
     * Confirm receipt number AFTER successful print.
     * This is the ONLY function that increments the counter.
     * Call this ONLY after the print dialog completes successfully.
     */
    const confirmNumber = useCallback(async (type: ReceiptType): Promise<string> => {
        return confirmReceiptNumber(type);
    }, []);

    /**
     * @deprecated Use reserveNumber + confirmNumber instead
     * Generate next receipt number (increments immediately)
     */
    const getNextReceiptNumber = useCallback(async (type: ReceiptType): Promise<string> => {
        return generateReceiptNumber(type);
    }, []);

    /**
     * Preview what the next number will be without incrementing
     * Alias for reserveNumber for backward compatibility
     */
    const previewNextNumber = useCallback(async (type: ReceiptType): Promise<string> => {
        const current = await getCurrentCounterValue(type);
        return `${RECEIPT_PREFIXES[type]}${(current + 1).toString().padStart(4, '0')}`;
    }, []);

    /**
     * Get current counter value (last printed number)
     */
    const getCounter = useCallback(async (type: ReceiptType): Promise<number> => {
        return getCurrentCounterValue(type);
    }, []);

    /**
     * Get timestamp of last printed receipt
     */
    const getLastPrinted = useCallback(async (type: ReceiptType): Promise<string | null> => {
        return getLastPrintedAt(type);
    }, []);

    /**
     * Reset counter (requires PIN verification in calling component)
     * Returns { from, to } for audit logging
     */
    const resetCounterValue = useCallback(async (type: ReceiptType, newValue?: number): Promise<{ from: number; to: number }> => {
        return resetCounter(type, newValue);
    }, []);

    /**
     * Get audit summary for all counters
     */
    const getAuditSummary = useCallback(async () => {
        return getCounterAuditSummary();
    }, []);

    /**
     * Get human-readable label for a receipt type
     */
    const getTypeLabel = useCallback((type: ReceiptType): string => {
        return RECEIPT_TYPE_LABELS[type];
    }, []);

    return {
        // New reserve/confirm pattern (preferred)
        reserveNumber,
        confirmNumber,
        // Legacy (deprecated)
        getNextReceiptNumber,
        previewNextNumber,
        // Utilities
        getCounter,
        getLastPrinted,
        resetCounterValue,
        getAuditSummary,
        getTypeLabel,
    };
}
