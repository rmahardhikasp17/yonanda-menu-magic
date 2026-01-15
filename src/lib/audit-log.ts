/**
 * Audit Log Module
 * 
 * @description Logging system for owner audit trail
 * - Stores print events, counter resets, and PIN changes
 * - Red flag detection for suspicious activity
 * - No transaction amounts stored (privacy by design)
 * 
 * IMPORTANT: Uses shared getDB() from db.ts to avoid version conflicts
 */

import { ReceiptType, RECEIPT_PREFIXES } from '@/types/hotel';
import { RECEIPT_TYPE_LABELS } from '@/lib/receipt-counter';
import { getDB, STORES } from '@/lib/db';

// ============================================
// Types
// ============================================

export type AuditAction =
    | 'PRINT_RECEIPT'
    | 'RESET_COUNTER'
    | 'PIN_CHANGED'
    | 'PIN_SETUP'
    | 'ROOM_UPDATE'
    | 'ROOM_ACTIVATE'
    | 'ROOM_DEACTIVATE';

export interface AuditLogRecord {
    id: string;
    action: AuditAction;
    counterType?: ReceiptType;
    receiptNumber?: number;
    from?: number;
    to?: number;
    reason?: string;
    timestamp: number;
    // Room audit fields
    roomNumber?: string;
    fieldChanged?: string;
    oldValue?: string | number;
    newValue?: string | number;
}

export interface AuditSummary {
    type: ReceiptType;
    label: string;
    prefix: string;
    startNumber: number;
    endNumber: number;
    totalPrinted: number;
    lastPrintedAt: string | null;
    resets: number;
}

export interface RedFlag {
    type: 'MISSING_NUMBERS' | 'UNUSUAL_RESET_TIME' | 'HIGH_VOLUME';
    severity: 'warning' | 'alert';
    message: string;
    details: string;
    timestamp?: number;
}

// ============================================
// Helper
// ============================================

/**
 * Generate UUID
 */
function generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// ============================================
// Audit Logging Functions
// ============================================

/**
 * Log a receipt print event
 */
export async function logPrintEvent(type: ReceiptType, receiptNumber: number): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.AUDIT_LOG, 'readwrite');
        const store = transaction.objectStore(STORES.AUDIT_LOG);

        const record: AuditLogRecord = {
            id: generateId(),
            action: 'PRINT_RECEIPT',
            counterType: type,
            receiptNumber,
            timestamp: Date.now(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to log print event'));
    });
}

/**
 * Log a counter reset event
 */
export async function logResetEvent(
    type: ReceiptType,
    from: number,
    to: number,
    reason: string
): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.AUDIT_LOG, 'readwrite');
        const store = transaction.objectStore(STORES.AUDIT_LOG);

        const record: AuditLogRecord = {
            id: generateId(),
            action: 'RESET_COUNTER',
            counterType: type,
            from,
            to,
            reason,
            timestamp: Date.now(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to log reset event'));
    });
}

/**
 * Log a PIN change event
 */
export async function logPinChanged(): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.AUDIT_LOG, 'readwrite');
        const store = transaction.objectStore(STORES.AUDIT_LOG);

        const record: AuditLogRecord = {
            id: generateId(),
            action: 'PIN_CHANGED',
            timestamp: Date.now(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to log PIN change'));
    });
}

/**
 * Log a room configuration change event
 */
export async function logRoomChange(
    roomNumber: string,
    action: 'ROOM_UPDATE' | 'ROOM_ACTIVATE' | 'ROOM_DEACTIVATE',
    fieldChanged?: string,
    oldValue?: string | number,
    newValue?: string | number
): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.AUDIT_LOG, 'readwrite');
        const store = transaction.objectStore(STORES.AUDIT_LOG);

        const record: AuditLogRecord = {
            id: generateId(),
            action,
            roomNumber,
            fieldChanged,
            oldValue,
            newValue,
            timestamp: Date.now(),
        };

        const request = store.put(record);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to log room change'));
    });
}

/**
 * Get all audit logs, optionally filtered by date
 */
export async function getAuditLogs(dateFilter?: Date): Promise<AuditLogRecord[]> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.AUDIT_LOG, 'readonly');
        const store = transaction.objectStore(STORES.AUDIT_LOG);
        const request = store.getAll();

        request.onsuccess = () => {
            let logs = request.result as AuditLogRecord[];

            // Sort by timestamp descending
            logs.sort((a, b) => b.timestamp - a.timestamp);

            // Filter by date if provided
            if (dateFilter) {
                const startOfDay = new Date(dateFilter);
                startOfDay.setHours(0, 0, 0, 0);
                const endOfDay = new Date(dateFilter);
                endOfDay.setHours(23, 59, 59, 999);

                logs = logs.filter(log =>
                    log.timestamp >= startOfDay.getTime() &&
                    log.timestamp <= endOfDay.getTime()
                );
            }

            resolve(logs);
        };
        request.onerror = () => reject(new Error('Failed to get audit logs'));
    });
}

/**
 * Get audit summary for all counter types
 */
export async function getAuditSummary(dateFilter?: Date): Promise<AuditSummary[]> {
    const logs = await getAuditLogs(dateFilter);

    const types: ReceiptType[] = ['checkin', 'checkout', 'kantin_tamu', 'kantin_nontamu'];

    return types.map(type => {
        const typeLogs = logs.filter(log => log.counterType === type);
        const printLogs = typeLogs.filter(log => log.action === 'PRINT_RECEIPT');
        const resetLogs = typeLogs.filter(log => log.action === 'RESET_COUNTER');

        const receiptNumbers = printLogs
            .map(log => log.receiptNumber || 0)
            .filter(n => n > 0);

        const startNumber = receiptNumbers.length > 0 ? Math.min(...receiptNumbers) : 0;
        const endNumber = receiptNumbers.length > 0 ? Math.max(...receiptNumbers) : 0;

        const lastPrint = printLogs[0];

        return {
            type,
            label: RECEIPT_TYPE_LABELS[type],
            prefix: RECEIPT_PREFIXES[type],
            startNumber,
            endNumber,
            totalPrinted: printLogs.length,
            lastPrintedAt: lastPrint ? new Date(lastPrint.timestamp).toISOString() : null,
            resets: resetLogs.length,
        };
    });
}

/**
 * Detect red flags in audit logs
 */
export function detectRedFlags(logs: AuditLogRecord[]): RedFlag[] {
    const flags: RedFlag[] = [];

    // Group print logs by type
    const types: ReceiptType[] = ['checkin', 'checkout', 'kantin_tamu', 'kantin_nontamu'];

    for (const type of types) {
        const printLogs = logs
            .filter(log => log.counterType === type && log.action === 'PRINT_RECEIPT')
            .sort((a, b) => (a.receiptNumber || 0) - (b.receiptNumber || 0));

        // Check for missing numbers
        for (let i = 1; i < printLogs.length; i++) {
            const prev = printLogs[i - 1].receiptNumber || 0;
            const curr = printLogs[i].receiptNumber || 0;

            if (curr - prev > 1) {
                const missing = curr - prev - 1;
                flags.push({
                    type: 'MISSING_NUMBERS',
                    severity: 'alert',
                    message: `${RECEIPT_TYPE_LABELS[type]}: ${missing} nomor hilang`,
                    details: `Lompat dari ${RECEIPT_PREFIXES[type]}${prev.toString().padStart(4, '0')} ke ${RECEIPT_PREFIXES[type]}${curr.toString().padStart(4, '0')}`,
                    timestamp: printLogs[i].timestamp,
                });
            }
        }

        // Check for unusual reset times (22:00-06:00)
        const resetLogs = logs.filter(log => log.counterType === type && log.action === 'RESET_COUNTER');
        for (const reset of resetLogs) {
            const hour = new Date(reset.timestamp).getHours();
            if (hour >= 22 || hour < 6) {
                flags.push({
                    type: 'UNUSUAL_RESET_TIME',
                    severity: 'warning',
                    message: `${RECEIPT_TYPE_LABELS[type]}: Reset di jam tidak wajar`,
                    details: `Reset pada ${new Date(reset.timestamp).toLocaleString('id-ID')}`,
                    timestamp: reset.timestamp,
                });
            }
        }
    }

    return flags;
}

// ============================================
// Owner PIN Storage
// ============================================

interface OwnerConfig {
    key: string;
    value: string;
}

/**
 * Get owner PIN hash from IndexedDB
 */
export async function getOwnerPinHash(): Promise<string | null> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.OWNER_CONFIG, 'readonly');
        const store = transaction.objectStore(STORES.OWNER_CONFIG);
        const request = store.get('pin_hash');

        request.onsuccess = () => {
            const result = request.result as OwnerConfig | undefined;
            resolve(result?.value || null);
        };
        request.onerror = () => reject(new Error('Failed to get PIN hash'));
    });
}

/**
 * Set owner PIN hash in IndexedDB
 */
export async function setOwnerPinHash(hash: string): Promise<void> {
    const db = await getDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.OWNER_CONFIG, 'readwrite');
        const store = transaction.objectStore(STORES.OWNER_CONFIG);

        const config: OwnerConfig = {
            key: 'pin_hash',
            value: hash,
        };

        const request = store.put(config);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to set PIN hash'));
    });
}

/**
 * Check if PIN has been set up (not default)
 */
export async function isPinSetup(): Promise<boolean> {
    const hash = await getOwnerPinHash();
    return hash !== null;
}
