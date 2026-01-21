/**
 * Check-In Receipt Component - Thermal 58mm Optimized
 * 
 * Professional check-in receipt for thermal printers
 * - 58mm paper width
 * - Payment method selection
 * - Serial/COM Port printing (PRIMARY - no dialog after setup)
 * - Bluetooth printing (fallback)
 * - Browser print (legacy fallback)
 */

import { useState } from 'react';
import { PaymentMethod } from '@/types/hotel';
import { useReceiptCounter } from '@/hooks/useReceiptCounter';
import { useThermalPrinter, PrinterMode } from '@/hooks/useThermalPrinter';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { ReceiptPrintData } from '@/lib/thermal-printer';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X, Banknote, QrCode, Bluetooth, Loader2, AlertCircle, Usb, Settings } from 'lucide-react';

interface CheckInReceiptRoom {
  number: string;
  type: string;
  rate: number;
}

interface CheckInReceiptGuest {
  name: string;
  address: string;
  ktpNumber: string;
  phoneNumber?: string;
}

interface CheckInReceiptProps {
  room: CheckInReceiptRoom;
  guest: CheckInReceiptGuest;
  maskedKtp: string;
  onConfirm: (paymentMethod: PaymentMethod) => void;
  onCancel: () => void;
}

export function CheckInReceipt({
  room,
  guest,
  maskedKtp,
  onConfirm,
  onCancel,
}: CheckInReceiptProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<string | null>(null);
  const { getNextReceiptNumber, previewNextNumber } = useReceiptCounter();
  const {
    status,
    isSerialSupported,
    isBluetoothSupported,
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
  } = useThermalPrinter();

  const typeInfo = getRoomTypeInfo(room.type);
  const now = new Date();

  // Show preview number, generate actual on confirm
  const displayNumber = receiptNumber || previewNextNumber('checkin');

  // Build print data for ESC/POS
  const buildPrintData = (actualReceiptNumber: string, payment: PaymentMethod): ReceiptPrintData => ({
    type: 'checkin',
    receiptNumber: actualReceiptNumber,
    timestamp: now.toISOString(),
    roomNumber: room.number,
    roomType: typeInfo?.label || room.type,
    roomRate: room.rate,
    guestName: guest.name,
    maskedKtp: maskedKtp,
    paymentMethod: payment,
    items: [],
    total: room.rate,
  });

  // Direct print handler (Serial/COM Port or Bluetooth)
  const handleDirectPrint = async () => {
    if (!paymentMethod) return;

    // Generate actual receipt number
    const actualNumber = getNextReceiptNumber('checkin');
    setReceiptNumber(actualNumber);

    // Print via Serial/Bluetooth
    const printData = buildPrintData(actualNumber, paymentMethod);
    const success = await print(printData);

    if (success) {
      onConfirm(paymentMethod);
    }
  };

  // Browser print handler (fallback)
  const handleBrowserPrint = () => {
    if (!paymentMethod) return;

    // Generate actual receipt number
    const actualNumber = getNextReceiptNumber('checkin');
    setReceiptNumber(actualNumber);

    // Trigger print then confirm
    setTimeout(() => {
      window.print();
      onConfirm(paymentMethod);
    }, 100);
  };

  // Combined confirm handler based on print mode
  const handleConfirm = () => {
    if (!paymentMethod) return;

    if (printerMode === 'serial' && isSerialSupported && hasSavedPort) {
      handleDirectPrint();
    } else if (printerMode === 'bluetooth' && isBluetoothSupported) {
      handleDirectPrint();
    } else {
      handleBrowserPrint();
    }
  };

  // Mode button styles
  const getModeButtonClass = (mode: PrinterMode, isActive: boolean, isDisabled: boolean) => {
    let base = 'flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg border-2 text-xs font-medium transition-all';
    if (isDisabled) base += ' opacity-50 cursor-not-allowed';
    if (isActive) base += ' border-blue-500 bg-blue-50 text-blue-700';
    else base += ' border-gray-200 text-gray-500';
    return base;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-sm max-h-[95vh] flex flex-col rounded-xl bg-white shadow-2xl my-auto">

        {/* Header - NOT PRINTED */}
        <div className="flex items-center justify-between border-b p-3 no-print flex-shrink-0">
          <h2 className="text-base font-bold">Preview Nota Check-In</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ===== PRINT AREA START ===== */}
        <div className="print-area p-4 font-mono text-xs bg-white flex-1 overflow-y-auto">

          {/* Header */}
          <div className="receipt-header text-center">
            <div className="text-sm font-bold">HOTEL YONANDA</div>
            <div className="text-[10px]">Terima Kasih Atas</div>
            <div className="text-[10px]">Kunjungan Anda</div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Date & Time */}
          <div className="space-y-0.5">
            <div className="receipt-row flex justify-between">
              <span>Tanggal</span>
              <span>{format(now, 'dd/MM/yyyy', { locale: id })}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Jam</span>
              <span>{format(now, 'HH:mm', { locale: id })}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Jenis</span>
              <span>CHECK-IN</span>
            </div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Receipt Number */}
          <div className="receipt-number text-center font-bold text-sm">
            No: {displayNumber}
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Room Info */}
          <div className="text-center font-bold text-[11px] mb-1">DATA KAMAR</div>
          <div className="space-y-0.5">
            <div className="receipt-row flex justify-between">
              <span>No. Kamar</span>
              <span>{room.number}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Tipe</span>
              <span>{typeInfo?.label || room.type}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Tarif/Mlm</span>
              <span>{formatCurrency(room.rate)}</span>
            </div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Guest Info */}
          <div className="text-center font-bold text-[11px] mb-1">DATA TAMU</div>
          <div className="space-y-0.5">
            <div className="receipt-row flex justify-between">
              <span>Nama</span>
              <span className="text-right max-w-[100px] truncate">{guest.name}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>No. KTP</span>
              <span>{maskedKtp}</span>
            </div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Payment Method - shown on print */}
          {paymentMethod && (
            <>
              <div className="receipt-row flex justify-between font-bold">
                <span>Bayar</span>
                <span>{paymentMethod === 'cash' ? 'CASH' : 'QRIS'}</span>
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Warning */}
          <div className="receipt-warning border border-dashed border-gray-400 p-1 text-center text-[10px]">
            <div>⚠️ PENTING ⚠️</div>
            <div>Max Check-out 12.00 WIB</div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Footer */}
          <div className="receipt-footer text-center text-[9px] text-gray-600">
            <div>================================</div>
            <div>Developed System by</div>
            <div>Nekat Digital</div>
            <div>================================</div>
          </div>

        </div>
        {/* ===== PRINT AREA END ===== */}

        {/* Payment Selection & Actions - NOT PRINTED */}
        <div className="border-t p-3 no-print flex-shrink-0 space-y-2">
          {/* Payment Method Selection */}
          <div>
            <p className="text-xs font-medium mb-2">Metode Pembayaran:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 transition-all ${paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
              >
                <Banknote className={`h-5 w-5 ${paymentMethod === 'cash' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-blue-500' : 'text-gray-600'}`}>
                  Cash
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-2.5 transition-all ${paymentMethod === 'qris'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                  }`}
              >
                <QrCode className={`h-5 w-5 ${paymentMethod === 'qris' ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'qris' ? 'text-blue-500' : 'text-gray-600'}`}>
                  QRIS
                </span>
              </button>
            </div>
          </div>

          {/* Print Mode Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setPrinterMode('serial')}
              disabled={!isSerialSupported}
              className={getModeButtonClass('serial', printerMode === 'serial', !isSerialSupported)}
            >
              <Usb className="h-3 w-3" />
              COM
            </button>
            <button
              onClick={() => setPrinterMode('bluetooth')}
              disabled={!isBluetoothSupported}
              className={getModeButtonClass('bluetooth', printerMode === 'bluetooth', !isBluetoothSupported)}
            >
              <Bluetooth className="h-3 w-3" />
              BT
            </button>
            <button
              onClick={() => setPrinterMode('browser')}
              className={getModeButtonClass('browser', printerMode === 'browser', false)}
            >
              <Printer className="h-3 w-3" />
              Browser
            </button>
          </div>

          {/* Printer Status (Serial mode) */}
          {printerMode === 'serial' && isSerialSupported && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Usb className={`h-3 w-3 ${hasSavedPort ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={hasSavedPort ? 'text-green-600' : 'text-gray-500'}>
                  {hasSavedPort ? 'COM Port ✓' : 'Belum setup'}
                </span>
              </div>
              {hasSavedPort ? (
                <button onClick={clearSavedPrinter} className="text-xs text-red-500">Reset</button>
              ) : (
                <button onClick={setupPrinter} disabled={isConnecting} className="text-xs text-blue-500 flex items-center gap-1">
                  <Settings className="h-3 w-3" /> Setup
                </button>
              )}
            </div>
          )}

          {/* Printer Status (Bluetooth mode) */}
          {printerMode === 'bluetooth' && isBluetoothSupported && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bluetooth className={`h-3 w-3 ${status.isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={status.isConnected ? 'text-blue-600' : 'text-gray-500'}>
                  {status.isConnected ? `${status.deviceName}` : 'Tidak terhubung'}
                </span>
              </div>
              {status.isConnected ? (
                <button onClick={disconnect} className="text-xs text-red-500">Putus</button>
              ) : (
                <button onClick={connect} disabled={isConnecting} className="text-xs text-blue-500">
                  {isConnecting ? '...' : 'Hubungkan'}
                </button>
              )}
            </div>
          )}

          {/* Error message */}
          {status.error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Batal
            </Button>
            {printerMode === 'serial' && isSerialSupported ? (
              <Button
                onClick={handleConfirm}
                disabled={!paymentMethod || isPrinting || isConnecting || !hasSavedPort}
                className="flex-1"
                size="lg"
              >
                {isPrinting ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Cetak...</>
                ) : !hasSavedPort ? (
                  <><Settings className="mr-1 h-4 w-4" /> Setup</>
                ) : (
                  <><Printer className="mr-1 h-4 w-4" /> Cetak</>
                )}
              </Button>
            ) : printerMode === 'bluetooth' && isBluetoothSupported ? (
              <Button
                onClick={handleConfirm}
                disabled={!paymentMethod || isPrinting || isConnecting}
                className="flex-1"
                size="lg"
              >
                {isPrinting ? (
                  <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Cetak...</>
                ) : (
                  <><Bluetooth className="mr-1 h-4 w-4" /> Cetak</>
                )}
              </Button>
            ) : (
                  <Button
                    onClick={handleConfirm}
                    disabled={!paymentMethod}
                    className="flex-1"
                    size="lg"
                  >
                    <Printer className="mr-1 h-4 w-4" /> Cetak
                  </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
