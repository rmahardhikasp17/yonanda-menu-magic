/**
 * Printer Bridge — Runtime Environment Router
 *
 * Detects if running inside Capacitor (Android) or browser
 * and routes to the correct printer backend.
 */

import { Capacitor } from '@capacitor/core';
import { ReceiptPrintData } from './thermal-printer';

/**
 * Detect if running inside Capacitor (Android) or browser
 */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Print receipt — auto-selects native or web printer
 */
export async function printReceipt(data: ReceiptPrintData): Promise<void> {
  if (isNativeApp()) {
    // Android: use Capacitor Bluetooth Serial
    const { printReceiptNative } = await import('./printer-native');
    return printReceiptNative(data);
  } else {
    // Browser: use existing Web Serial/Bluetooth
    const { printReceiptDirect } = await import('./thermal-printer');
    return printReceiptDirect(data);
  }
}
