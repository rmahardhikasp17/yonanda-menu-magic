/**
 * PrinterSettings Component
 * 
 * Printer configuration for Owner Menu
 * - One-time COM Port setup (dialog only once)
 * - After setup: direct print without any dialog
 */

import { useState, useEffect } from 'react';
import { Usb, Bluetooth, Printer, Check, AlertCircle, Trash2, Loader2 } from 'lucide-react';
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
  return isSerialSupported() ? 'serial' : 'browser';
}

export function setPrinterMode(mode: PrinterModeType): void {
  localStorage.setItem(PRINTER_MODE_KEY, mode);
}

export function isPrinterSetupComplete(): boolean {
  return localStorage.getItem(PRINTER_SETUP_COMPLETE_KEY) === 'true';
}

export function setPrinterSetupComplete(complete: boolean): void {
  localStorage.setItem(PRINTER_SETUP_COMPLETE_KEY, complete ? 'true' : 'false');
}

export function PrinterSettings({ onBack }: PrinterSettingsProps) {
  const [mode, setMode] = useState<PrinterModeType>(getPrinterMode());
  const [isSetupComplete, setIsSetupComplete] = useState(isPrinterSetupComplete());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const serialSupported = isSerialSupported();
  const bluetoothSupported = isBluetoothSupported();

  // Check if port is available on mount
  useEffect(() => {
    if (mode === 'serial' && serialSupported) {
      checkSerialPort();
    }
  }, [mode, serialSupported]);

  const checkSerialPort = async () => {
    try {
      const port = await autoConnectSerialPort();
      setIsSetupComplete(port !== null);
      setPrinterSetupComplete(port !== null);
    } catch {
      setIsSetupComplete(false);
    }
  };

  const handleModeChange = (newMode: PrinterModeType) => {
    setMode(newMode);
    setPrinterMode(newMode);
    setError(null);
    setSuccess(null);
    
    // Reset setup status when changing mode
    if (newMode !== 'serial') {
      setIsSetupComplete(true); // Bluetooth and browser don't need setup
      setPrinterSetupComplete(true);
    } else {
      checkSerialPort();
    }
  };

  const handleSetupPrinter = async () => {
    setIsConnecting(true);
    setError(null);
    setSuccess(null);

    try {
      const port = await setupSerialPrinter();
      await connectSerialPort(port);
      await disconnectSerialPort(); // Close after setup
      
      setIsSetupComplete(true);
      setPrinterSetupComplete(true);
      setSuccess('Printer berhasil disetup! Sekarang bisa langsung cetak tanpa dialog.');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal setup printer';
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleResetPrinter = () => {
    clearSerialPortInfo();
    setIsSetupComplete(false);
    setPrinterSetupComplete(false);
    setSuccess(null);
    setError(null);
  };

  const handleTestPrint = async () => {
    setIsTesting(true);
    setError(null);
    setSuccess(null);

    try {
      // Import dynamically to avoid circular deps
      const { printReceiptDirect } = await import('@/lib/thermal-printer');
      
      await printReceiptDirect({
        type: 'checkout',
        receiptNumber: 'TEST-0001',
        timestamp: new Date().toISOString(),
        items: [
          { name: 'Test Item 1', quantity: 1, subtotal: 10000 },
          { name: 'Test Item 2', quantity: 2, subtotal: 20000 },
        ],
        total: 30000,
      });
      
      setSuccess('Test cetak berhasil!');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal test cetak';
      setError(message);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
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
            {mode === 'serial' && isSetupComplete && (
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
              <Usb className={`h-4 w-4 ${isSetupComplete ? 'text-green-500' : 'text-gray-400'}`} />
              <span className={`text-sm font-medium ${isSetupComplete ? 'text-green-600' : 'text-gray-600'}`}>
                {isSetupComplete ? 'COM Port Tersimpan ✓' : 'Belum disetup'}
              </span>
            </div>
            {isSetupComplete && (
              <Button variant="ghost" size="sm" onClick={handleResetPrinter} className="text-red-500 h-7 px-2">
                <Trash2 className="h-3 w-3 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {!isSetupComplete ? (
            <Button 
              onClick={handleSetupPrinter} 
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
            {isSetupComplete 
              ? 'Printer akan langsung cetak tanpa dialog pemilihan.'
              : 'Klik Setup untuk memilih COM Port printer (dialog muncul sekali).'}
          </p>
        </div>
      )}

      {/* Bluetooth Info */}
      {mode === 'bluetooth' && bluetoothSupported && (
        <div className="rounded-lg border p-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Dialog pemilihan muncul setiap kali cetak</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Mode Bluetooth akan menampilkan dialog pilih perangkat setiap kali mencetak karena keterbatasan Web Bluetooth API.
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

      {/* Back Button */}
      <div className="pt-2">
        <Button variant="outline" onClick={onBack} className="w-full">
          Kembali
        </Button>
      </div>
    </div>
  );
}
