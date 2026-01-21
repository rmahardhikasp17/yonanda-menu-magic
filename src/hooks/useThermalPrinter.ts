/**
 * useThermalPrinter Hook
 * 
 * React hook for managing thermal printer connection
 * Supports:
 * - Serial Port (COM Port) - PRIMARY, no dialog after setup
 * - Bluetooth - FALLBACK
 */

import { useState, useCallback, useEffect } from 'react';
import {
  ThermalPrinterDevice,
  PrinterStatus,
  ReceiptPrintData,
  // Serial (COM Port) functions
  isSerialSupported,
  setupSerialPrinter,
  autoConnectSerialPort,
  connectSerialPort,
  disconnectSerialPort,
  printReceiptDirect,
  clearSerialPortInfo,
  // Bluetooth functions (fallback)
  isBluetoothSupported,
  connectPrinter,
  disconnectPrinter,
  printReceipt,
} from '@/lib/thermal-printer';

// LocalStorage key for connection mode preference
const MODE_STORAGE_KEY = 'thermal_printer_preferred_mode';

export type PrinterMode = 'serial' | 'bluetooth' | 'browser';

export interface UseThermalPrinterReturn {
  // Status
  status: PrinterStatus;
  isSerialSupported: boolean;
  isBluetoothSupported: boolean;
  isConnecting: boolean;
  isPrinting: boolean;
  printerMode: PrinterMode;
  hasSavedPort: boolean;

  // Actions
  setPrinterMode: (mode: PrinterMode) => void;
  setupPrinter: () => Promise<boolean>;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  print: (data: ReceiptPrintData) => Promise<boolean>;
  clearSavedPrinter: () => void;
}

export function useThermalPrinter(): UseThermalPrinterReturn {
  // Bluetooth printer reference (legacy)
  const [bluetoothPrinter, setBluetoothPrinter] = useState<ThermalPrinterDevice | null>(null);

  // Connection states
  const [isSerialConnected, setIsSerialConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const [hasSavedPort, setHasSavedPort] = useState(false);

  // Printer mode
  const [printerMode, setPrinterModeState] = useState<PrinterMode>(() => {
    const saved = localStorage.getItem(MODE_STORAGE_KEY);
    if (saved === 'serial' || saved === 'bluetooth' || saved === 'browser') {
      return saved;
    }
    // Default to serial if supported
    return isSerialSupported() ? 'serial' : 'browser';
  });

  const serialSupported = isSerialSupported();
  const bluetoothSupported = isBluetoothSupported();

  // Check if we have a saved port on mount
  useEffect(() => {
    const checkSavedPort = async () => {
      if (!serialSupported) return;

      try {
        const port = await autoConnectSerialPort();
        setHasSavedPort(port !== null);
        if (port) {
          setDeviceName('COM Port (tersimpan)');
        }
      } catch {
        setHasSavedPort(false);
      }
    };

    checkSavedPort();
  }, [serialSupported]);

  // Build status object
  const status: PrinterStatus = {
    isConnected: printerMode === 'serial'
      ? isSerialConnected
      : (bluetoothPrinter !== null && bluetoothPrinter.device.gatt?.connected === true),
    connectionType: printerMode === 'serial' ? 'serial' : printerMode === 'bluetooth' ? 'bluetooth' : null,
    deviceName,
    portInfo: printerMode === 'serial' && isSerialConnected ? 'COM Port' : null,
    error,
  };

  // Handle Bluetooth device disconnection
  useEffect(() => {
    if (!bluetoothPrinter) return;

    const handleDisconnect = () => {
      setBluetoothPrinter(null);
      setError('Printer Bluetooth terputus');
    };

    bluetoothPrinter.device.addEventListener('gattserverdisconnected', handleDisconnect);

    return () => {
      bluetoothPrinter.device.removeEventListener('gattserverdisconnected', handleDisconnect);
    };
  }, [bluetoothPrinter]);

  // Set printer mode
  const setPrinterMode = useCallback((mode: PrinterMode) => {
    setPrinterModeState(mode);
    localStorage.setItem(MODE_STORAGE_KEY, mode);
    setError(null);
  }, []);

  // Setup printer (ONE TIME - shows dialog)
  const setupPrinter = useCallback(async (): Promise<boolean> => {
    if (printerMode !== 'serial' || !serialSupported) {
      setError('Setup hanya untuk mode Serial/COM Port');
      return false;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const port = await setupSerialPrinter();
      await connectSerialPort(port);
      setIsSerialConnected(true);
      setHasSavedPort(true);
      setDeviceName('COM Port');
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal setup printer';
      setError(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [printerMode, serialSupported]);

  // Connect to printer (auto-connect for serial, dialog for bluetooth)
  const connect = useCallback(async (): Promise<boolean> => {
    setIsConnecting(true);
    setError(null);

    try {
      if (printerMode === 'serial') {
        // Try auto-connect first (no dialog)
        const port = await autoConnectSerialPort();
        if (port) {
          await connectSerialPort(port);
          setIsSerialConnected(true);
          setDeviceName('COM Port');
          return true;
        } else {
          // No saved port - need setup
          setError('Printer belum disetup. Klik "Setup Printer" terlebih dahulu.');
          return false;
        }
      } else if (printerMode === 'bluetooth') {
        const printer = await connectPrinter();
        setBluetoothPrinter(printer);
        setDeviceName(printer.device.name || 'Bluetooth Printer');
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal terhubung ke printer';
      setError(message);
      return false;
    } finally {
      setIsConnecting(false);
    }
  }, [printerMode]);

  // Disconnect from printer
  const disconnect = useCallback(() => {
    if (printerMode === 'serial') {
      disconnectSerialPort();
      setIsSerialConnected(false);
    } else if (printerMode === 'bluetooth' && bluetoothPrinter) {
      disconnectPrinter(bluetoothPrinter);
      setBluetoothPrinter(null);
    }
    setError(null);
  }, [printerMode, bluetoothPrinter]);

  // Print receipt - DIRECT (no dialog for serial)
  const print = useCallback(async (data: ReceiptPrintData): Promise<boolean> => {
    setIsPrinting(true);
    setError(null);

    try {
      if (printerMode === 'serial') {
        // Direct print via COM Port (no dialog!)
        await printReceiptDirect(data);
        return true;
      } else if (printerMode === 'bluetooth') {
        if (!bluetoothPrinter) {
          // Try to connect first
          const connected = await connect();
          if (!connected) return false;
        }

        if (bluetoothPrinter) {
          await printReceipt(bluetoothPrinter, data);
          return true;
        }
      } else if (printerMode === 'browser') {
        // Browser print - just trigger window.print()
        // This is handled by the component
        return true;
      }

      return false;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mencetak';
      setError(message);
      return false;
    } finally {
      setIsPrinting(false);
    }
  }, [printerMode, bluetoothPrinter, connect]);

  // Clear saved printer settings
  const clearSavedPrinter = useCallback(() => {
    clearSerialPortInfo();
    setHasSavedPort(false);
    setDeviceName(null);
    setIsSerialConnected(false);
    setError(null);
  }, []);

  return {
    status,
    isSerialSupported: serialSupported,
    isBluetoothSupported: bluetoothSupported,
    isConnecting,
    isPrinting,
    printerMode,
    hasSavedPort,
    setPrinterMode,
    setupPrinter,
    connect,
    disconnect,
    print,
    clearSavedPrinter,
  };
}
