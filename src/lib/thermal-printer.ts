/**
 * ESC/POS Thermal Printer Utility
 * 
 * Direct RAW printing for 58mm thermal printers
 * Supports:
 * - Web Serial API (COM Port) - PRIMARY, no dialog after setup
 * - Web Bluetooth API - FALLBACK
 * 
 * Features:
 * - No page-based printing (no margin, no page breaks)
 * - Line-by-line streaming
 * - Dynamic receipt length
 * - Auto-reconnect to saved port
 */

// ============================================
// ESC/POS Command Constants
// ============================================

export const ESC_POS = {
  // Initialize
  INIT: new Uint8Array([0x1B, 0x40]), // ESC @ - Initialize printer

  // Text alignment
  ALIGN_LEFT: new Uint8Array([0x1B, 0x61, 0x00]),   // ESC a 0
  ALIGN_CENTER: new Uint8Array([0x1B, 0x61, 0x01]), // ESC a 1
  ALIGN_RIGHT: new Uint8Array([0x1B, 0x61, 0x02]),  // ESC a 2

  // Font styles
  FONT_NORMAL: new Uint8Array([0x1B, 0x21, 0x00]),        // ESC ! 0 - Normal
  FONT_BOLD: new Uint8Array([0x1B, 0x21, 0x08]),          // ESC ! 8 - Bold
  FONT_DOUBLE_HEIGHT: new Uint8Array([0x1B, 0x21, 0x10]), // ESC ! 16 - Double height
  FONT_DOUBLE_WIDTH: new Uint8Array([0x1B, 0x21, 0x20]),  // ESC ! 32 - Double width
  FONT_DOUBLE: new Uint8Array([0x1B, 0x21, 0x30]),        // ESC ! 48 - Double height + width
  FONT_BOLD_DOUBLE: new Uint8Array([0x1B, 0x21, 0x38]),   // ESC ! 56 - Bold + Double

  // Line control
  LF: new Uint8Array([0x0A]), // Line feed

  // Paper cut (for printers with cutter)
  CUT_PARTIAL: new Uint8Array([0x1D, 0x56, 0x01]), // GS V 1 - Partial cut
  CUT_FULL: new Uint8Array([0x1D, 0x56, 0x00]),    // GS V 0 - Full cut

  // Character set
  CHARSET_PC437: new Uint8Array([0x1B, 0x74, 0x00]), // ESC t 0 - PC437 (USA)
  CHARSET_PC850: new Uint8Array([0x1B, 0x74, 0x02]), // ESC t 2 - PC850 (Multilingual)
} as const;

// ============================================
// Types & Interfaces
// ============================================

export interface PrinterStatus {
  isConnected: boolean;
  connectionType: 'serial' | 'bluetooth' | null;
  deviceName: string | null;
  portInfo: string | null;
  error: string | null;
}

export interface SerialPortInfo {
  usbVendorId?: number;
  usbProductId?: number;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  subtotal: number;
}

export interface ReceiptPrintData {
  type: 'checkin' | 'checkout' | 'canteen-guest' | 'canteen-direct';
  receiptNumber: string;
  timestamp: string;

  // Optional room info
  roomNumber?: string;
  roomType?: string;
  roomRate?: number;
  nights?: number;

  // Optional guest info
  guestName?: string;
  maskedKtp?: string;

  // Payment
  paymentMethod?: 'cash' | 'qris';

  // Items
  items: ReceiptItem[];
  total: number;
}

// ============================================
// Storage Keys
// ============================================

const STORAGE_KEYS = {
  SERIAL_PORT_INFO: 'thermal_printer_serial_port',
  BLUETOOTH_DEVICE_ID: 'thermal_printer_bluetooth_id',
  BLUETOOTH_DEVICE_NAME: 'thermal_printer_bluetooth_name',
  PREFERRED_MODE: 'thermal_printer_mode',
} as const;

// ============================================
// Serial Port Configuration (COM Port)
// ============================================

const SERIAL_CONFIG: SerialOptions = {
  baudRate: 9600,
  dataBits: 8,
  stopBits: 1,
  parity: 'none',
  flowControl: 'none',
};

// ============================================
// Text Encoder
// ============================================

const textEncoder = new TextEncoder();

// ============================================
// Serial Port Functions (COM Port)
// ============================================

// Global serial port reference for auto-reconnect
let activeSerialPort: SerialPort | null = null;
let activeWriter: WritableStreamDefaultWriter<Uint8Array> | null = null;

/**
 * Check if Web Serial API is supported
 */
export function isSerialSupported(): boolean {
  return 'serial' in navigator;
}

/**
 * Save port info to localStorage for auto-reconnect
 */
function saveSerialPortInfo(port: SerialPort): void {
  try {
    const info = port.getInfo();
    localStorage.setItem(STORAGE_KEYS.SERIAL_PORT_INFO, JSON.stringify({
      usbVendorId: info.usbVendorId,
      usbProductId: info.usbProductId,
      savedAt: new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('Could not save port info:', e);
  }
}

/**
 * Load saved port info from localStorage
 */
function loadSerialPortInfo(): SerialPortInfo | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SERIAL_PORT_INFO);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.warn('Could not load port info:', e);
  }
  return null;
}

/**
 * Clear saved port info
 */
export function clearSerialPortInfo(): void {
  localStorage.removeItem(STORAGE_KEYS.SERIAL_PORT_INFO);
}

/**
 * Request user to select a serial port (shows dialog ONCE for setup)
 * After this, the port is saved and auto-reconnect will work without dialog
 */
export async function setupSerialPrinter(): Promise<SerialPort> {
  if (!isSerialSupported()) {
    throw new Error('Web Serial API tidak didukung. Gunakan Chrome/Edge.');
  }

  try {
    // This shows the port selection dialog
    const port = await navigator.serial.requestPort();

    // Save port info for future auto-reconnect
    saveSerialPortInfo(port);

    return port;
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'NotFoundError') {
        throw new Error('Tidak ada port yang dipilih');
      }
    }
    throw new Error('Gagal setup printer serial');
  }
}

/**
 * Auto-connect to previously saved port (NO DIALOG)
 * Returns null if no saved port or port not available
 */
export async function autoConnectSerialPort(): Promise<SerialPort | null> {
  if (!isSerialSupported()) {
    return null;
  }

  const savedInfo = loadSerialPortInfo();
  if (!savedInfo) {
    return null;
  }

  try {
    // Get all ports the user has previously granted access to
    // This does NOT show a dialog
    const ports = await navigator.serial.getPorts();

    // Find matching port
    for (const port of ports) {
      const info = port.getInfo();

      // Match by USB vendor/product ID if available
      if (savedInfo.usbVendorId && savedInfo.usbProductId) {
        if (info.usbVendorId === savedInfo.usbVendorId &&
          info.usbProductId === savedInfo.usbProductId) {
          return port;
        }
      }

      // If we have any previously granted port, use it
      // (for Bluetooth serial ports that don't have USB IDs)
      if (!savedInfo.usbVendorId && ports.length === 1) {
        return port;
      }
    }

    // Try first available port if we have saved info but can't match
    if (ports.length > 0) {
      return ports[0];
    }

    return null;
  } catch (error) {
    console.warn('Auto-connect failed:', error);
    return null;
  }
}

/**
 * Connect to serial port (open connection)
 */
export async function connectSerialPort(port: SerialPort): Promise<void> {
  if (port.readable) {
    // Already open
    return;
  }

  await port.open(SERIAL_CONFIG);
  activeSerialPort = port;
}

/**
 * Disconnect from serial port
 */
export async function disconnectSerialPort(): Promise<void> {
  try {
    if (activeWriter) {
      await activeWriter.close();
      activeWriter = null;
    }

    if (activeSerialPort?.readable) {
      await activeSerialPort.close();
    }

    activeSerialPort = null;
  } catch (error) {
    console.warn('Disconnect error:', error);
    activeSerialPort = null;
    activeWriter = null;
  }
}

/**
 * Get current serial port connection status
 */
export function getSerialPortStatus(): { isConnected: boolean; portInfo: string | null } {
  return {
    isConnected: activeSerialPort?.readable !== undefined,
    portInfo: activeSerialPort ? 'COM Port' : null,
  };
}

/**
 * Send bytes to serial port
 */
async function sendBytesToSerial(port: SerialPort, data: Uint8Array): Promise<void> {
  if (!port.writable) {
    throw new Error('Port tidak dapat ditulis');
  }

  const writer = port.writable.getWriter();
  try {
    await writer.write(data);
  } finally {
    writer.releaseLock();
  }
}

/**
 * Send text to serial port
 */
async function sendTextToSerial(port: SerialPort, text: string): Promise<void> {
  const bytes = textEncoder.encode(text);
  await sendBytesToSerial(port, bytes);
}

/**
 * Send command to serial port
 */
async function sendCommandToSerial(port: SerialPort, command: Uint8Array): Promise<void> {
  await sendBytesToSerial(port, command);
}

/**
 * Print a line via serial (with line feed)
 */
async function printLineSerial(port: SerialPort, text: string): Promise<void> {
  await sendTextToSerial(port, text);
  await sendCommandToSerial(port, ESC_POS.LF);
}

// ============================================
// Direct Print Function (COM Port - NO DIALOG)
// ============================================

/**
 * Print receipt directly to COM Port
 * This function auto-connects to saved port without showing any dialog
 */
export async function printReceiptDirect(data: ReceiptPrintData): Promise<void> {
  // Try auto-connect first (no dialog)
  const port = await autoConnectSerialPort();

  if (!port) {
    // No saved port - need setup first
    throw new Error('Printer belum disetup. Silakan setup printer di Pengaturan.');
  }

  try {
    // Open connection if not already open
    await connectSerialPort(port);

    // Print the receipt
    await printReceiptToSerial(port, data);

  } catch (error) {
    // Close on error
    await disconnectSerialPort();
    throw error;
  }
}

/**
 * Print receipt to serial port
 * Template sesuai RECEIPT_DESIGNS.md
 */
async function printReceiptToSerial(port: SerialPort, data: ReceiptPrintData): Promise<void> {
  const LINE_WIDTH = 32;
  const EQUALS_LINE = ''.padStart(LINE_WIDTH, '=');
  const DASH_LINE = ''.padStart(LINE_WIDTH, '-');

  try {
    // 1. Initialize printer (ESC @)
    await sendCommandToSerial(port, ESC_POS.INIT);

    // 2. Header dengan border =
    await sendCommandToSerial(port, ESC_POS.ALIGN_CENTER);
    await printLineSerial(port, EQUALS_LINE);
    await sendCommandToSerial(port, ESC_POS.FONT_BOLD);
    await printLineSerial(port, 'HOTEL YONANDA');
    await sendCommandToSerial(port, ESC_POS.FONT_NORMAL);
    await printLineSerial(port, 'Jl. Mayor Soeyoto Km 6');
    await printLineSerial(port, 'Jimbaran-Bandungan');
    await printLineSerial(port, '081392506299');
    await printLineSerial(port, DASH_LINE);

    // 3. Transaction Info (left align)
    await sendCommandToSerial(port, ESC_POS.ALIGN_LEFT);
    await printLineSerial(port, formatRow('Tanggal', formatDate(data.timestamp), LINE_WIDTH));
    await printLineSerial(port, formatRow('Jam', formatTime(data.timestamp), LINE_WIDTH));
    await printLineSerial(port, formatRow('Jenis', getReceiptTypeLabel(data.type), LINE_WIDTH));
    await printLineSerial(port, DASH_LINE);

    // 4. Receipt Number (centered, bold)
    await sendCommandToSerial(port, ESC_POS.ALIGN_CENTER);
    await sendCommandToSerial(port, ESC_POS.FONT_BOLD);
    await printLineSerial(port, `No Nota : ${data.receiptNumber}`);
    await sendCommandToSerial(port, ESC_POS.FONT_NORMAL);
    await printLineSerial(port, DASH_LINE);

    // 5. Room Info (if applicable)
    if (data.roomNumber) {
      await sendCommandToSerial(port, ESC_POS.ALIGN_LEFT);
      await printLineSerial(port, formatRow('No. Kamar', data.roomNumber, LINE_WIDTH));

      if (data.roomType) {
        await printLineSerial(port, formatRow('Tipe', data.roomType, LINE_WIDTH));
      }

      if (data.roomRate !== undefined) {
        await printLineSerial(port, formatRow('Tarif/Mlm', formatCurrency(data.roomRate), LINE_WIDTH));
      }

      if (data.nights !== undefined) {
        await printLineSerial(port, formatRow('Durasi', `${data.nights} malam`, LINE_WIDTH));
      }

      await printLineSerial(port, DASH_LINE);
    }

    // 6. Guest Info (if applicable)
    if (data.guestName || data.maskedKtp) {
      await sendCommandToSerial(port, ESC_POS.ALIGN_LEFT);

      if (data.guestName) {
        await printLineSerial(port, formatRow('Nama', data.guestName.substring(0, 16), LINE_WIDTH));
      }

      if (data.maskedKtp) {
        await printLineSerial(port, formatRow('No. KTP', data.maskedKtp, LINE_WIDTH));
      }

      await printLineSerial(port, DASH_LINE);
    }

    // 7. Order Items (if any)
    if (data.items.length > 0) {
      await sendCommandToSerial(port, ESC_POS.ALIGN_LEFT);

      for (const item of data.items) {
        const itemName = `${item.name} x${item.quantity}`;
        const itemPrice = formatCurrency(item.subtotal);
        await printLineSerial(port, formatRow(itemName.substring(0, 20), itemPrice, LINE_WIDTH));
      }

      await printLineSerial(port, DASH_LINE);
    }

    // 8. Total (bold)
    await sendCommandToSerial(port, ESC_POS.ALIGN_LEFT);
    await sendCommandToSerial(port, ESC_POS.FONT_BOLD);
    await printLineSerial(port, formatRow('TOTAL', formatCurrency(data.total), LINE_WIDTH));
    await sendCommandToSerial(port, ESC_POS.FONT_NORMAL);
    await printLineSerial(port, DASH_LINE);

    // 9. Payment Method (if applicable)
    if (data.paymentMethod) {
      await printLineSerial(port, formatRow('Bayar', data.paymentMethod === 'cash' ? 'CASH' : 'QRIS', LINE_WIDTH));
      await printLineSerial(port, DASH_LINE);
    }

    // 10. Warning/Notes (centered)
    await sendCommandToSerial(port, ESC_POS.ALIGN_CENTER);
    await printLineSerial(port, '** Max Check-out 12.00 WIB **');
    await printLineSerial(port, DASH_LINE);

    // 11. Footer dengan border =
    await printLineSerial(port, EQUALS_LINE);
    await printLineSerial(port, 'System by Nekat Digital');
    await printLineSerial(port, EQUALS_LINE);

    // 12. Feed paper (just line feeds, NO form feed)
    await sendCommandToSerial(port, ESC_POS.LF);
    await sendCommandToSerial(port, ESC_POS.LF);
    await sendCommandToSerial(port, ESC_POS.LF);
    await sendCommandToSerial(port, ESC_POS.LF);

  } catch (error) {
    console.error('Print error:', error);
    throw new Error('Gagal mencetak. Periksa koneksi printer.');
  }
}

// ============================================
// Helper Functions
// ============================================

function formatRow(left: string, right: string, width: number = 32): string {
  const spaces = width - left.length - right.length;
  if (spaces < 1) {
    return left.substring(0, width - right.length - 1) + ' ' + right;
  }
  return left + ' '.repeat(spaces) + right;
}

function formatCurrency(amount: number): string {
  return 'Rp ' + amount.toLocaleString('id-ID');
}

function getReceiptTypeLabel(type: string): string {
  switch (type) {
    case 'checkin': return 'CHECK-IN';
    case 'checkout': return 'CHECK-OUT';
    case 'canteen-guest': return 'KANTIN TAMU';
    case 'canteen-direct': return 'KANTIN NON-TAMU';
    default: return 'NOTA';
  }
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// ============================================
// Bluetooth Functions with Auto-Reconnect
// ============================================

export interface ThermalPrinterDevice {
  device: BluetoothDevice;
  characteristic: BluetoothRemoteGATTCharacteristic;
}

const ALT_SERVICE_UUIDS = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
];

// Global Bluetooth printer reference for persistence
let activeBluetoothPrinter: ThermalPrinterDevice | null = null;

export function isBluetoothSupported(): boolean {
  return 'bluetooth' in navigator;
}

/**
 * Save Bluetooth device info to localStorage
 */
function saveBluetoothDeviceInfo(device: BluetoothDevice): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BLUETOOTH_DEVICE_ID, device.id);
    localStorage.setItem(STORAGE_KEYS.BLUETOOTH_DEVICE_NAME, device.name || 'Bluetooth Printer');
  } catch (e) {
    console.warn('Could not save Bluetooth device info:', e);
  }
}

/**
 * Load saved Bluetooth device info
 */
export function loadBluetoothDeviceInfo(): { id: string; name: string } | null {
  try {
    const id = localStorage.getItem(STORAGE_KEYS.BLUETOOTH_DEVICE_ID);
    const name = localStorage.getItem(STORAGE_KEYS.BLUETOOTH_DEVICE_NAME);
    if (id) {
      return { id, name: name || 'Bluetooth Printer' };
    }
  } catch (e) {
    console.warn('Could not load Bluetooth device info:', e);
  }
  return null;
}

/**
 * Clear saved Bluetooth device info
 */
export function clearBluetoothDeviceInfo(): void {
  localStorage.removeItem(STORAGE_KEYS.BLUETOOTH_DEVICE_ID);
  localStorage.removeItem(STORAGE_KEYS.BLUETOOTH_DEVICE_NAME);
  activeBluetoothPrinter = null;
}

/**
 * Check if Bluetooth printer is setup
 */
export function isBluetoothPrinterSetup(): boolean {
  return loadBluetoothDeviceInfo() !== null;
}

/**
 * Get saved Bluetooth device name
 */
export function getSavedBluetoothDeviceName(): string | null {
  const info = loadBluetoothDeviceInfo();
  return info?.name || null;
}

/**
 * Connect to a Bluetooth device and find writable characteristic
 */
async function connectToBluetoothDevice(device: BluetoothDevice): Promise<ThermalPrinterDevice> {
  if (!device.gatt) {
    throw new Error('GATT tidak tersedia pada perangkat ini');
  }

  const server = await device.gatt.connect();
  let characteristic: BluetoothRemoteGATTCharacteristic | null = null;

  for (const serviceUuid of ALT_SERVICE_UUIDS) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const chars = await service.getCharacteristics();

      for (const char of chars) {
        if (char.properties.write || char.properties.writeWithoutResponse) {
          characteristic = char;
          break;
        }
      }

      if (characteristic) break;
    } catch {
      continue;
    }
  }

  if (!characteristic) {
    throw new Error('Tidak dapat menemukan karakteristik printer.');
  }

  return { device, characteristic };
}

/**
 * Setup Bluetooth printer (shows dialog ONCE)
 * After this, auto-reconnect will work without dialog
 */
export async function setupBluetoothPrinter(): Promise<ThermalPrinterDevice> {
  if (!isBluetoothSupported()) {
    throw new Error('Web Bluetooth tidak didukung. Gunakan Chrome Android.');
  }

  try {
    // Request device with dialog
    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: ALT_SERVICE_UUIDS,
    });

    // Connect and find characteristic
    const printer = await connectToBluetoothDevice(device);

    // Save for auto-reconnect
    saveBluetoothDeviceInfo(device);
    activeBluetoothPrinter = printer;

    return printer;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('User cancelled')) {
        throw new Error('Pemilihan printer dibatalkan');
      }
      throw error;
    }
    throw new Error('Gagal setup printer Bluetooth');
  }
}

/**
 * Auto-reconnect to saved Bluetooth printer (NO DIALOG on Android Chrome)
 * Note: getDevices() returns previously paired devices
 */
export async function autoConnectBluetoothPrinter(): Promise<ThermalPrinterDevice | null> {
  if (!isBluetoothSupported()) {
    return null;
  }

  // Return cached connection if still valid
  if (activeBluetoothPrinter && activeBluetoothPrinter.device.gatt?.connected) {
    return activeBluetoothPrinter;
  }

  const savedInfo = loadBluetoothDeviceInfo();
  if (!savedInfo) {
    return null;
  }

  try {
    // getDevices() returns previously granted devices WITHOUT showing dialog
    // This is supported on Chrome Android 85+
    if ('getDevices' in navigator.bluetooth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const devices = await (navigator.bluetooth as any).getDevices();

      // Find matching device by ID
      const device = devices.find((d: BluetoothDevice) => d.id === savedInfo.id);

      if (device) {
        // Watch for advertisements to auto-connect
        if ('watchAdvertisements' in device) {
          try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (device as any).watchAdvertisements();
          } catch {
            // watchAdvertisements may not be supported, continue anyway
          }
        }

        const printer = await connectToBluetoothDevice(device);
        activeBluetoothPrinter = printer;
        return printer;
      }
    }

    return null;
  } catch (error) {
    console.warn('Bluetooth auto-connect failed:', error);
    return null;
  }
}

/**
 * Print receipt directly via Bluetooth
 * Uses auto-reconnect if possible, falls back to cached connection
 */
export async function printReceiptBluetooth(data: ReceiptPrintData): Promise<void> {
  // Try to get connected printer
  let printer = activeBluetoothPrinter;

  // Check if still connected
  if (!printer || !printer.device.gatt?.connected) {
    // Try auto-reconnect
    printer = await autoConnectBluetoothPrinter();
  }

  if (!printer) {
    throw new Error('Printer Bluetooth belum disetup. Buka Pengaturan Printer di menu Admin.');
  }

  // Print the receipt
  await printReceipt(printer, data);
}

/**
 * Legacy connect function (shows dialog every time)
 */
export async function connectPrinter(): Promise<ThermalPrinterDevice> {
  return setupBluetoothPrinter();
}

export function disconnectPrinter(printer: ThermalPrinterDevice): void {
  if (printer.device.gatt?.connected) {
    printer.device.gatt.disconnect();
  }
}

async function sendBytes(
  characteristic: BluetoothRemoteGATTCharacteristic,
  data: Uint8Array
): Promise<void> {
  const CHUNK_SIZE = 20;

  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    const chunk = data.slice(i, i + CHUNK_SIZE);

    if (characteristic.properties.writeWithoutResponse) {
      await characteristic.writeValueWithoutResponse(chunk);
    } else {
      await characteristic.writeValue(chunk);
    }

    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

async function sendText(
  characteristic: BluetoothRemoteGATTCharacteristic,
  text: string
): Promise<void> {
  const bytes = textEncoder.encode(text);
  await sendBytes(characteristic, bytes);
}

async function sendCommand(
  characteristic: BluetoothRemoteGATTCharacteristic,
  command: Uint8Array
): Promise<void> {
  await sendBytes(characteristic, command);
}

async function printLine(
  characteristic: BluetoothRemoteGATTCharacteristic,
  text: string
): Promise<void> {
  await sendText(characteristic, text);
  await sendCommand(characteristic, ESC_POS.LF);
}

export async function printReceipt(
  printer: ThermalPrinterDevice,
  data: ReceiptPrintData
): Promise<void> {
  const char = printer.characteristic;
  const LINE_WIDTH = 32;
  const EQUALS_LINE = ''.padStart(LINE_WIDTH, '=');
  const DASH_LINE = ''.padStart(LINE_WIDTH, '-');

  try {
    await sendCommand(char, ESC_POS.INIT);

    // Header dengan border =
    await sendCommand(char, ESC_POS.ALIGN_CENTER);
    await printLine(char, EQUALS_LINE);
    await sendCommand(char, ESC_POS.FONT_BOLD);
    await printLine(char, 'HOTEL YONANDA');
    await sendCommand(char, ESC_POS.FONT_NORMAL);
    await printLine(char, 'Jl. Mayor Soeyoto Km 6');
    await printLine(char, 'Jimbaran-Bandungan');
    await printLine(char, '081392506299');
    await printLine(char, DASH_LINE);

    // Transaction Info
    await sendCommand(char, ESC_POS.ALIGN_LEFT);
    await printLine(char, formatRow('Tanggal', formatDate(data.timestamp), LINE_WIDTH));
    await printLine(char, formatRow('Jam', formatTime(data.timestamp), LINE_WIDTH));
    await printLine(char, formatRow('Jenis', getReceiptTypeLabel(data.type), LINE_WIDTH));
    await printLine(char, DASH_LINE);

    // Receipt Number
    await sendCommand(char, ESC_POS.ALIGN_CENTER);
    await sendCommand(char, ESC_POS.FONT_BOLD);
    await printLine(char, `No Nota : ${data.receiptNumber}`);
    await sendCommand(char, ESC_POS.FONT_NORMAL);
    await printLine(char, DASH_LINE);

    // Room Info
    if (data.roomNumber) {
      await sendCommand(char, ESC_POS.ALIGN_LEFT);
      await printLine(char, formatRow('No. Kamar', data.roomNumber, LINE_WIDTH));

      if (data.roomType) {
        await printLine(char, formatRow('Tipe', data.roomType, LINE_WIDTH));
      }

      if (data.roomRate !== undefined) {
        await printLine(char, formatRow('Tarif/Mlm', formatCurrency(data.roomRate), LINE_WIDTH));
      }

      if (data.nights !== undefined) {
        await printLine(char, formatRow('Durasi', `${data.nights} malam`, LINE_WIDTH));
      }

      await printLine(char, DASH_LINE);
    }

    // Guest Info
    if (data.guestName || data.maskedKtp) {
      await sendCommand(char, ESC_POS.ALIGN_LEFT);

      if (data.guestName) {
        await printLine(char, formatRow('Nama', data.guestName.substring(0, 16), LINE_WIDTH));
      }

      if (data.maskedKtp) {
        await printLine(char, formatRow('No. KTP', data.maskedKtp, LINE_WIDTH));
      }

      await printLine(char, DASH_LINE);
    }

    // Order Items
    if (data.items.length > 0) {
      await sendCommand(char, ESC_POS.ALIGN_LEFT);

      for (const item of data.items) {
        const itemName = `${item.name} x${item.quantity}`;
        const itemPrice = formatCurrency(item.subtotal);
        await printLine(char, formatRow(itemName.substring(0, 20), itemPrice, LINE_WIDTH));
      }

      await printLine(char, DASH_LINE);
    }

    // Total
    await sendCommand(char, ESC_POS.ALIGN_LEFT);
    await sendCommand(char, ESC_POS.FONT_BOLD);
    await printLine(char, formatRow('TOTAL', formatCurrency(data.total), LINE_WIDTH));
    await sendCommand(char, ESC_POS.FONT_NORMAL);
    await printLine(char, DASH_LINE);

    // Payment Method
    if (data.paymentMethod) {
      await printLine(char, formatRow('Bayar', data.paymentMethod === 'cash' ? 'CASH' : 'QRIS', LINE_WIDTH));
      await printLine(char, DASH_LINE);
    }

    // Warning/Notes
    await sendCommand(char, ESC_POS.ALIGN_CENTER);
    await printLine(char, '** Max Check-out 12.00 WIB **');
    await printLine(char, DASH_LINE);

    // Footer dengan border =
    await printLine(char, EQUALS_LINE);
    await printLine(char, 'System by Nekat Digital');
    await printLine(char, EQUALS_LINE);

    // Feed paper
    await sendCommand(char, ESC_POS.LF);
    await sendCommand(char, ESC_POS.LF);
    await sendCommand(char, ESC_POS.LF);
    await sendCommand(char, ESC_POS.LF);

  } catch (error) {
    console.error('Print error:', error);
    throw new Error('Gagal mencetak. Periksa koneksi printer.');
  }
}
