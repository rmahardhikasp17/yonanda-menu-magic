/**
 * React Hook for Receipt Counter Management
 * 
 * Use reserveNumber for preview, confirmNumber ONLY after successful print.
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
    const reserveNumber = useCallback((type: ReceiptType): string => {
        return reserveReceiptNumber(type);
    }, []);

    /**
     * Confirm receipt number AFTER successful print.
     * This is the ONLY function that increments the counter.
     * Call this ONLY after the print dialog completes successfully.
     */
    const confirmNumber = useCallback((type: ReceiptType): string => {
        return confirmReceiptNumber(type);
    }, []);

    /**
     * @deprecated Use reserveNumber + confirmNumber instead
     * Generate next receipt number (increments immediately)
     */
    const getNextReceiptNumber = useCallback((type: ReceiptType): string => {
        return generateReceiptNumber(type);
    }, []);

    /**
     * Preview what the next number will be without incrementing
     * Alias for reserveNumber for backward compatibility
     */
    const previewNextNumber = useCallback((type: ReceiptType): string => {
        const current = getCurrentCounterValue(type);
        return `${RECEIPT_PREFIXES[type]}${(current + 1).toString().padStart(4, '0')}`;
    }, []);

    /**
     * Get current counter value (last printed number)
     */
    const getCounter = useCallback((type: ReceiptType): number => {
        return getCurrentCounterValue(type);
    }, []);

    /**
     * Get timestamp of last printed receipt
     */
    const getLastPrinted = useCallback((type: ReceiptType): string | null => {
        return getLastPrintedAt(type);
    }, []);

    /**
     * Reset counter (requires PIN verification in calling component)
     * Returns { from, to } for audit logging
     */
    const resetCounterValue = useCallback((type: ReceiptType, newValue?: number): { from: number; to: number } => {
        return resetCounter(type, newValue);
    }, []);

    /**
     * Get audit summary for all counters
     */
    const getAuditSummary = useCallback(() => {
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

