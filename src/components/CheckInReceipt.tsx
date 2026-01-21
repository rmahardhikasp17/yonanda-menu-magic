/**
 * Check-In Receipt Component - Thermal 58mm Optimized
 * 
 * Professional check-in receipt for thermal printers
 * - Serial (COM Port) for Desktop
 * - Bluetooth for Mobile (Android)
 * - Browser print as fallback
 */

import { useState } from 'react';
import { PaymentMethod } from '@/types/hotel';
import { useReceiptCounter } from '@/hooks/useReceiptCounter';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { 
  ReceiptPrintData,
  printReceiptDirect,
  printReceiptBluetooth,
  isSerialSupported,
  isBluetoothSupported,
  isBluetoothPrinterSetup,
} from '@/lib/thermal-printer';
import { getPrinterMode, isPrinterSetupComplete } from '@/components/PrinterSettings';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X, Banknote, QrCode, Loader2, AlertCircle } from 'lucide-react';

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
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getNextReceiptNumber, previewNextNumber } = useReceiptCounter();

  const typeInfo = getRoomTypeInfo(room.type);
  const now = new Date();

  // Get printer settings from Admin config
  const printerMode = getPrinterMode();
  const isSetupComplete = isPrinterSetupComplete();

  // Check if we can do direct print
  const canDirectPrintSerial = printerMode === 'serial' && isSerialSupported() && isSetupComplete;
  const canDirectPrintBluetooth = printerMode === 'bluetooth' && isBluetoothSupported() && isBluetoothPrinterSetup();
  const canDirectPrint = canDirectPrintSerial || canDirectPrintBluetooth;

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

  // Combined confirm handler
  const handleConfirm = async () => {
    if (!paymentMethod) return;
    setError(null);

    // Generate actual receipt number
    const actualNumber = getNextReceiptNumber('checkin');
    setReceiptNumber(actualNumber);

    if (canDirectPrint) {
      setIsPrinting(true);
      try {
        const printData = buildPrintData(actualNumber, paymentMethod);

        if (canDirectPrintSerial) {
          await printReceiptDirect(printData);
        } else if (canDirectPrintBluetooth) {
          await printReceiptBluetooth(printData);
        }

        onConfirm(paymentMethod);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mencetak';
        setError(message);
      } finally {
        setIsPrinting(false);
      }
    } else {
      // Browser print fallback
      setTimeout(() => {
        window.print();
        onConfirm(paymentMethod);
      }, 100);
    }
  };

  // Get mode indicator text
  const getModeText = () => {
    if (canDirectPrintSerial) return '✓ Cetak langsung ke COM Port';
    if (canDirectPrintBluetooth) return '✓ Cetak langsung via Bluetooth';
    return 'Menggunakan dialog print browser';
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
        <div className="border-t p-3 no-print flex-shrink-0 space-y-3">
          {/* Payment Method Selection */}
          <div>
            <p className="text-xs font-medium mb-2">Metode Pembayaran:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${paymentMethod === 'cash'
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
                className={`flex items-center justify-center gap-2 rounded-lg border-2 p-3 transition-all ${paymentMethod === 'qris'
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

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Batal
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!paymentMethod || isPrinting}
              className="flex-1"
              size="lg"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-4 w-4" />
                  Cetak & Check-In
                </>
              )}
            </Button>
          </div>

          {/* Mode indicator */}
          <p className="text-[10px] text-center text-muted-foreground">
            {getModeText()}
          </p>
        </div>
      </div>
    </div>
  );
}
