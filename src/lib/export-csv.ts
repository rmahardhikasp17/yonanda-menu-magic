/**
 * CSV Export Module
 * 
 * @description End-of-day export for owner audit
 * - No prices or guest data
 * - Only counter ranges for control
 */

import { getAuditSummary } from '@/lib/audit-log';

/**
 * Generate end-of-day CSV content
 */
export async function generateEndOfDayCSV(date: Date): Promise<string> {
    const summary = await getAuditSummary(date);

    const dateStr = date.toISOString().split('T')[0];

    const header = 'Date,Type,Prefix,Start,End,Total,Resets';
    const rows = summary.map(s =>
        `${dateStr},${s.label},${s.prefix},${s.startNumber.toString().padStart(4, '0')},${s.endNumber.toString().padStart(4, '0')},${s.totalPrinted},${s.resets}`
    );

    return [header, ...rows].join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(content: string, filename: string): void {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Export today's summary
 */
export async function exportTodayCSV(): Promise<void> {
    const today = new Date();
    const content = await generateEndOfDayCSV(today);
    const filename = `hotel-yonanda-audit-${today.toISOString().split('T')[0]}.csv`;
    downloadCSV(content, filename);
}
