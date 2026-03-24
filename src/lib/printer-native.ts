/**
 * Native Android Printer — Capacitor Bluetooth Serial
 *
 * Uses @nicepaytech/capacitor-bluetooth-serial to send ESC/POS
 * commands over Bluetooth to a thermal printer on Android.
 *
 * NOTE: This module is only imported dynamically when running in Capacitor.
 * The import will fail in browser — that's expected (printer-bridge.ts handles routing).
 */

// @ts-expect-error — This package only exists when installed for Android build
import { BluetoothSerial } from '@nicepaytech/capacitor-bluetooth-serial';
import { ESC_POS, ReceiptPrintData } from './thermal-printer';

const PRINTER_STORAGE_KEY = 'native_printer_address';

/**
 * Scan for paired Bluetooth devices
 */
export async function scanDevices(): Promise<{ name: string; address: string }[]> {
  const result = await BluetoothSerial.list();
  return result.devices || [];
}

/**
 * Connect to a Bluetooth printer by MAC address
 */
export async function connectPrinter(address: string): Promise<void> {
  await BluetoothSerial.connect({ address });
  localStorage.setItem(PRINTER_STORAGE_KEY, address);
}

/**
 * Auto-reconnect to saved printer
 */
export async function autoConnect(): Promise<boolean> {
  const address = localStorage.getItem(PRINTER_STORAGE_KEY);
  if (!address) return false;

  try {
    const connected = await BluetoothSerial.isConnected();
    if (connected.connected) return true;

    await BluetoothSerial.connect({ address });
    return true;
  } catch {
    return false;
  }
}

/**
 * Send raw bytes to printer
 */
async function sendBytes(data: Uint8Array): Promise<void> {
  const binary = String.fromCharCode(...data);
  const base64 = btoa(binary);
  await BluetoothSerial.write({ data: base64 });
}

/**
 * Send text + line feed
 */
async function printLine(text: string): Promise<void> {
  const encoder = new TextEncoder();
  await sendBytes(encoder.encode(text));
  await sendBytes(ESC_POS.LF);
}

/**
 * Print receipt using ESC/POS commands via native Bluetooth
 */
export async function printReceiptNative(data: ReceiptPrintData): Promise<void> {
  // Ensure connection
  const connected = await autoConnect();
  if (!connected) {
    throw new Error('Printer Bluetooth belum terhubung. Buka Pengaturan Printer.');
  }

  const LINE_WIDTH = 32;
  const EQUALS_LINE = '='.repeat(LINE_WIDTH);
  const DASH_LINE = '-'.repeat(LINE_WIDTH);

  // Initialize printer
  await sendBytes(ESC_POS.INIT);

  // Header
  await sendBytes(ESC_POS.ALIGN_CENTER);
  await printLine(EQUALS_LINE);
  await sendBytes(ESC_POS.FONT_BOLD);
  await printLine('HOTEL YONANDA');
  await sendBytes(ESC_POS.FONT_NORMAL);
  await printLine('Jl. Mayor Soeyoto Km 6');
  await printLine('Jimbaran-Bandungan');
  await printLine('081392506299');
  await printLine(DASH_LINE);

  // Receipt number
  await sendBytes(ESC_POS.FONT_BOLD);
  await printLine(`No Nota : ${data.receiptNumber}`);
  await sendBytes(ESC_POS.FONT_NORMAL);
  await printLine(DASH_LINE);

  // Items
  await sendBytes(ESC_POS.ALIGN_LEFT);
  for (const item of data.items) {
    const name = `${item.name} x${item.quantity}`;
    const price = `Rp ${item.subtotal.toLocaleString('id-ID')}`;
    const spaces = LINE_WIDTH - name.length - price.length;
    await printLine(name.substring(0, 20) + ' '.repeat(Math.max(1, spaces)) + price);
  }

  // Total
  await sendBytes(ESC_POS.FONT_BOLD);
  const totalStr = `Rp ${data.total.toLocaleString('id-ID')}`;
  await printLine(`TOTAL${' '.repeat(LINE_WIDTH - 5 - totalStr.length)}${totalStr}`);
  await sendBytes(ESC_POS.FONT_NORMAL);

  // Footer + paper feed
  await sendBytes(ESC_POS.ALIGN_CENTER);
  await printLine(EQUALS_LINE);
  await printLine('System by Nekat Digital');
  await printLine(EQUALS_LINE);
  await sendBytes(ESC_POS.LF);
  await sendBytes(ESC_POS.LF);
  await sendBytes(ESC_POS.LF);
}
