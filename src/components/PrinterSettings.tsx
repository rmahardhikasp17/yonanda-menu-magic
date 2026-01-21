/**
 * PrinterSettings Component
 * 
 * Printer configuration for Owner Menu
 * - Serial (COM Port) for Desktop: One-time setup, then direct print
 * - Bluetooth for Mobile (Android): One-time setup, then auto-reconnect
 */

import { useState, useEffect } from 'react';
import { Usb, Bluetooth, Printer, Check, AlertCircle, Trash2, Loader2, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  isSerialSupported,
  isBluetoothSupported,
  setupSerialPrinter,
  autoConnectSerialPort,
  connectSerialPort,
  disconnectSerialPort,
  clearSerialPortInfo,
  setupBluetoothPrinter,
  isBluetoothPrinterSetup,
  getSavedBluetoothDeviceName,
  clearBluetoothDeviceInfo,
  printReceiptBluetooth,
  printReceiptDirect,
} from '@/lib/thermal-printer';

// LocalStorage keys for printer settings
const PRINTER_MODE_KEY = 'thermal_printer_mode';
const PRINTER_SETUP_COMPLETE_KEY = 'thermal_printer_setup_complete';

export type PrinterModeType = 'serial' | 'bluetooth' | 'browser';

interface PrinterSettingsProps {
  onBack: () => void;
}

export function getPrinterMode(): PrinterModeType {
  const saved = localStorage.getItem(PRINTER_MODE_KEY);
  if (saved === 'serial' || saved === 'bluetooth' || saved === 'browser') {
    return saved;
  }
  // Default: Bluetooth for mobile, Serial for desktop
  if (isBluetoothSupported() && !isSerialSupported()) {
    return 'bluetooth';
  }
  if (isSerialSupported()) {
    return 'serial';
  }
  return 'browser';
}

export function setPrinterMode(mode: PrinterModeType): void {
  localStorage.setItem(PRINTER_MODE_KEY, mode);
}

export function isPrinterSetupComplete(): boolean {
  const mode = getPrinterMode();
  if (mode === 'serial') {
    return localStorage.getItem(PRINTER_SETUP_COMPLETE_KEY) === 'true';
  }
  if (mode === 'bluetooth') {
    return isBluetoothPrinterSetup();
  }
  return true; // Browser mode doesn't need setup
}

export function setPrinterSetupComplete(complete: boolean): void {
  localStorage.setItem(PRINTER_SETUP_COMPLETE_KEY, complete ? 'true' : 'false');
}

/**
 * Print using the configured printer mode
 */
export async function printWithConfig(data: any): Promise<void> {
  const mode = getPrinterMode();

  if (mode === 'serial' && isSerialSupported()) {
    await printReceiptDirect(data);
  } else if (mode === 'bluetooth' && isBluetoothSupported()) {
    await printReceiptBluetooth(data);
  } else {
    // Browser mode - caller should handle window.print()
    throw new Error('BROWSER_PRINT');
  }
}

export function PrinterSettings({ onBack }: PrinterSettingsProps) {
  const [mode, setMode] = useState<PrinterModeType>(getPrinterMode());
  const [isSerialSetup, setIsSerialSetup] = useState(false);
  const [isBluetoothSetup, setIsBluetoothSetup] = useState(false);
  const [bluetoothDeviceName, setBluetoothDeviceName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const serialSupported = isSerialSupported();
  const bluetoothSupported = isBluetoothSupported();
  const isMobile = !serialSupported && bluetoothSupported;

  // Check setup status on mount
  useEffect(() => {
    checkSetupStatus();
  }, [mode]);

  const checkSetupStatus = async () => {
    // Check Serial
    if (serialSupported) {
      try {
        const port = await autoConnectSerialPort();
        setIsSerialSetup(port !== null);
        setPrinterSetupComplete(port !== null);
      } catch {
        setIsSerialSetup(false);
      }
    }

    // Check Bluetooth
    if (bluetoothSupported) {
      const btSetup = isBluetoothPrinterSetup();
      setIsBluetoothSetup(btSetup);
      if (btSetup) {
        setBluetoothDeviceName(getSavedBluetoothDeviceName());
      }
    }
  };

  const handleModeChange = (newMode: PrinterModeType) => {
    setMode(newMode);
    setPrinterMode(newMode);
    setError(null);
    setSuccess(null);
  };

  // Setup Serial Printer
  const handleSetupSerial = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const port = await setupSerialPrinter();
      await connectSerialPort(port);
      await disconnectSerialPort();

      setIsSerialSetup(true);
      setPrinterSetupComplete(true);
      setSuccess('COM Port berhasil disetup! Sekarang bisa langsung cetak.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal setup printer';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Setup Bluetooth Printer
  const handleSetupBluetooth = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const printer = await setupBluetoothPrinter();
      
      setIsBluetoothSetup(true);
      setBluetoothDeviceName(printer.device.name || 'Bluetooth Printer');
      setSuccess('Printer Bluetooth berhasil disetup! Sekarang bisa langsung cetak.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal setup printer';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  // Reset Serial
  const handleResetSerial = () => {
    clearSerialPortInfo();
    setIsSerialSetup(false);
    setPrinterSetupComplete(false);
    setSuccess(null);
    setError(null);
  };

  // Reset Bluetooth
  const handleResetBluetooth = () => {
    clearBluetoothDeviceInfo();
    setIsBluetoothSetup(false);
    setBluetoothDeviceName(null);
    setSuccess(null);
    setError(null);
  };

  // Test Print
  const handleTestPrint = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      const testData = {
        type: 'checkout' as const,
        receiptNumber: 'TEST-0001',
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Test Item 1', quantity: 1, subtotal: 10000 },
          { name: 'Test Item 2', quantity: 2, subtotal: 20000 },
        ],
        total: 30000,
      };

      if (mode === 'serial') {
        await printReceiptDirect(testData);
      } else if (mode === 'bluetooth') {
        await printReceiptBluetooth(testData);
      }
      
      setSuccess('Test cetak berhasil!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal test cetak';
      setError(message);
    } finally {
      setIsTesting(false);
    }
  };

  const isCurrentModeSetup = mode === 'serial' ? isSerialSetup : mode === 'bluetooth' ? isBluetoothSetup : true;

  return (
    <div className="space-y-4">
      {/* Mobile Detection Info */}
      {isMobile && (
        <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-3 rounded-lg">
          <Smartphone className="h-4 w-4" />
          <span>Mode mobile terdeteksi. Gunakan Bluetooth untuk cetak.</span>
        </div>
      )}

      {/* Mode Selection */}
      <div className="space-y-2">
        <Label>Mode Printer</Label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleModeChange('serial')}
            disabled={!serialSupported}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              mode === 'serial'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-500'
            } ${!serialSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Usb className="h-5 w-5" />
            <span className="text-xs font-medium">COM Port</span>
            {mode === 'serial' && isSerialSetup && (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </button>
          
          <button
            onClick={() => handleModeChange('bluetooth')}
            disabled={!bluetoothSupported}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              mode === 'bluetooth'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-500'
            } ${!bluetoothSupported ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Bluetooth className="h-5 w-5" />
            <span className="text-xs font-medium">Bluetooth</span>
            {mode === 'bluetooth' && isBluetoothSetup && (
              <Check className="h-3 w-3 text-green-500" />
            )}
          </button>
          
          <button
            onClick={() => handleModeChange('browser')}
            className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
              mode === 'browser'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-500'
            }`}
          >
            <Printer className="h-5 w-5" />
            <span className="text-xs font-medium">Browser</span>
          </button>
        </div>
      </div>

      {/* Serial Port Setup */}
      {mode === 'serial' && serialSupported && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Usb className={`h-4 w-4 ${isSerialSetup ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isSerialSetup ? 'text-green-600' : 'text-gray-600'}`}>
                {isSerialSetup ? 'COM Port Tersimpan ✓' : 'Belum disetup'}
              </span>
            </div>
            {isSerialSetup && (
              <Button variant="ghost" size="sm" onClick={handleResetSerial} className="text-red-500 h-7 px-2">
                <Trash2 className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {!isSerialSetup ? (
            <Button 
              onClick={handleSetupSerial} 
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghubungkan...</>
              ) : (
                <><Usb className="mr-2 h-4 w-4" /> Setup COM Port</>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleTestPrint} 
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mencetak...</>
              ) : (
                <><Printer className="mr-2 h-4 w-4" /> Test Cetak</>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {isSerialSetup 
              ? 'Printer akan langsung cetak tanpa dialog pemilihan.'
              : 'Klik Setup untuk memilih COM Port printer (dialog muncul sekali).'}
          </p>
        </div>
      )}

      {/* Bluetooth Setup */}
      {mode === 'bluetooth' && bluetoothSupported && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bluetooth className={`h-4 w-4 ${isBluetoothSetup ? 'text-green-500' : 'text-gray-400'}`} />
              <div>
                <span className={`text-sm font-medium ${isBluetoothSetup ? 'text-green-600' : 'text-gray-600'}`}>
                  {isBluetoothSetup ? 'Bluetooth Tersimpan ✓' : 'Belum disetup'}
                </span>
                {bluetoothDeviceName && (
                  <p className="text-xs text-muted-foreground">{bluetoothDeviceName}</p>
                )}
              </div>
            </div>
            {isBluetoothSetup && (
              <Button variant="ghost" size="sm" onClick={handleResetBluetooth} className="text-red-500 h-7 px-2">
                <Trash2 className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {!isBluetoothSetup ? (
            <Button
              onClick={handleSetupBluetooth}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menghubungkan...</>
              ) : (
                <><Bluetooth className="mr-2 h-4 w-4" /> Setup Bluetooth</>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleTestPrint}
              disabled={isTesting}
              variant="outline"
              className="w-full"
            >
              {isTesting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mencetak...</>
              ) : (
                <><Printer className="mr-2 h-4 w-4" /> Test Cetak</>
              )}
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            {isBluetoothSetup
              ? 'Printer akan auto-reconnect saat mencetak.'
              : 'Klik Setup untuk memilih printer Bluetooth (dialog muncul sekali).'}
          </p>
        </div>
      )}

      {/* Browser Info */}
      {mode === 'browser' && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Printer className="h-4 w-4" />
            <span className="text-sm">Menggunakan dialog print browser</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Pastikan printer thermal sudah terpasang sebagai printer default sistem.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-red-500 bg-red-50 p-3 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
          <Check className="h-4 w-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Status Summary */}
      {isCurrentModeSetup && mode !== 'browser' && (
        <div className="rounded-lg bg-green-50 border border-green-200 p-3">
          <p className="text-sm text-green-700 font-medium">✓ Siap Cetak Langsung</p>
          <p className="text-xs text-green-600">
            {mode === 'serial' ? 'COM Port' : 'Bluetooth'} sudah disetup.
            Semua nota akan langsung dicetak tanpa dialog pemilihan printer.
          </p>
        </div>
      )}

      {/* Back Button */}
      <div className="pt-2">
        <Button variant="outline" onClick={onBack} className="w-full">
          Kembali
        </Button>
      </div>
    </div>
  );
}
