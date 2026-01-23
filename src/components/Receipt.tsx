/**
 * Receipt Component - Thermal 58mm Optimized
 * 
 * Professional receipt layout for thermal printers
 * - Uses printer settings from Admin/Owner Menu
 * - Serial (COM Port) for Desktop
 * - Bluetooth for Mobile (Android)
 * - Browser print as fallback
 */

import { useState } from 'react';
import { ReceiptData } from '@/types/hotel';
import { formatCurrency } from '@/data/roomData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X, Loader2, AlertCircle } from 'lucide-react';
import { 
  ReceiptPrintData,
  printReceiptDirect,
  printReceiptBluetooth,
  isSerialSupported,
  isBluetoothSupported,
  isBluetoothPrinterSetup,
} from '@/lib/thermal-printer';
import { getPrinterMode, isPrinterSetupComplete } from '@/components/PrinterSettings';

interface ReceiptProps {
  data: ReceiptData;
  onClose: () => void;
  onPrint: () => void;
}

// Get receipt type label
function getReceiptTypeLabel(type: string): string {
  switch (type) {
    case 'room': return 'CHECK-OUT';
    case 'canteen-guest': return 'KANTIN TAMU';
    case 'canteen-direct': return 'KANTIN NON-TAMU';
    default: return 'NOTA';
  }
}

// Convert ReceiptData to ReceiptPrintData for ESC/POS
function convertToPrintData(data: ReceiptData): ReceiptPrintData {
  let type: ReceiptPrintData['type'];
  switch (data.type) {
    case 'room': type = 'checkout'; break;
    case 'canteen-guest': type = 'canteen-guest'; break;
    case 'canteen-direct': type = 'canteen-direct'; break;
    default: type = 'checkout';
  }

  return {
    type,
    receiptNumber: data.receiptNumber || '-',
    timestamp: data.timestamp,
    roomNumber: data.roomNumber,
    roomType: data.roomType,
    roomRate: data.roomRate,
    nights: data.nights,
    guestName: data.guestName,
    paymentMethod: data.paymentMethod,
    items: data.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      subtotal: item.subtotal,
    })),
    total: data.total,
  };
}

export function Receipt({ data, onClose, onPrint }: ReceiptProps) {
  const [isPrinting, setIsPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printSuccess, setPrintSuccess] = useState(false);

  // Get printer settings from Admin config
  const printerMode = getPrinterMode();
  const isSetupComplete = isPrinterSetupComplete();

  const canDirectPrintSerial = printerMode === 'serial' && isSerialSupported() && isSetupComplete;
  const canDirectPrintBluetooth = printerMode === 'bluetooth' && isBluetoothSupported() && isBluetoothPrinterSetup();
  const canDirectPrint = canDirectPrintSerial || canDirectPrintBluetooth;

  // Check if this is checkout (only 1 copy needed)
  const isCheckout = data.type === 'room';
  const printCopies = isCheckout ? 1 : 2;

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: id });
  };

  // Direct print handler - prints 2 copies for non-checkout
  const handlePrint = async () => {
    setError(null);
    setPrintSuccess(false);

    if (canDirectPrint) {
      setIsPrinting(true);
      try {
        const printData = convertToPrintData(data);

        // Print multiple copies
        for (let i = 0; i < printCopies; i++) {
          if (canDirectPrintSerial) {
            await printReceiptDirect(printData);
          } else if (canDirectPrintBluetooth) {
            await printReceiptBluetooth(printData);
          }

          // Small delay between copies
          if (i < printCopies - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        }

        onPrint();
        setPrintSuccess(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Gagal mencetak';
        setError(message);
      } finally {
        setIsPrinting(false);
      }
    } else {
      // Browser print fallback
      onPrint();
      window.print();
      setPrintSuccess(true);
    }
  };

  // Get mode indicator text
  const getModeText = () => {
    if (canDirectPrintSerial) return '✓ Cetak langsung ke COM Port';
    if (canDirectPrintBluetooth) return '✓ Cetak langsung via Bluetooth';
    return 'Menggunakan dialog print browser';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl max-h-[95vh] flex flex-col">
        {/* Header actions - NOT PRINTED */}
        <div className="flex items-center justify-between border-b p-3 no-print flex-shrink-0">
          <h2 className="text-base font-bold">Preview Nota</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* ===== PRINT AREA START ===== */}
        <div className="print-area p-4 font-mono text-xs bg-white flex-1 overflow-y-auto">

          {/* Header dengan border = */}
          <div className="receipt-header text-center">
            <div className="text-xs font-mono">=================================</div>
            <div className="text-sm font-bold">HOTEL YONANDA</div>
            <div className="text-[9px]">Jl. Mayor Soeyoto Km 6</div>
            <div className="text-[9px]">Jimbaran-Bandungan</div>
            <div className="text-[9px]">081392506299</div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Transaction Info */}
          <div className="space-y-0.5">
            <div className="receipt-row flex justify-between">
              <span>Tanggal</span>
              <span>{formatDate(data.timestamp)}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Jam</span>
              <span>{formatTime(data.timestamp)}</span>
            </div>
            <div className="receipt-row flex justify-between">
              <span>Jenis</span>
              <span>{getReceiptTypeLabel(data.type)}</span>
            </div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Receipt Number */}
          <div className="receipt-number text-center font-bold text-sm">
            No Nota : {data.receiptNumber || '-'}
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Room info for checkout */}
          {data.type === 'room' && (
            <>
              <div className="space-y-0.5">
                <div className="receipt-row flex justify-between">
                  <span>No. Kamar</span>
                  <span>{data.roomNumber}</span>
                </div>
                {data.roomType && (
                  <div className="receipt-row flex justify-between">
                    <span>Tipe</span>
                    <span>{data.roomType}</span>
                  </div>
                )}
                {data.nights !== undefined && (
                  <div className="receipt-row flex justify-between">
                    <span>Durasi</span>
                    <span>{data.nights} malam</span>
                  </div>
                )}
                {data.roomRate !== undefined && (
                  <div className="receipt-row flex justify-between">
                    <span>Tarif/Mlm</span>
                    <span>{formatCurrency(data.roomRate)}</span>
                  </div>
                )}
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Room info for canteen guest */}
          {data.type === 'canteen-guest' && data.roomNumber && (
            <>
              <div className="receipt-row flex justify-between">
                <span>No. Kamar</span>
                <span>{data.roomNumber}</span>
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Guest Info */}
          {data.guestName && (
            <>
              <div className="receipt-row flex justify-between">
                <span>Nama</span>
                <span className="text-right max-w-[100px] truncate">{data.guestName}</span>
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Order items */}
          {data.items.length > 0 && (
            <>
              <div className="space-y-0.5">
                {data.items.map((item, index) => (
                  <div key={index} className="receipt-item-row flex justify-between text-[10px]">
                    <span className="flex-1 truncate pr-1">
                      {item.name} x{item.quantity}
                    </span>
                    <span className="whitespace-nowrap">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Total */}
          <div className="receipt-total flex justify-between font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Payment Method */}
          {data.paymentMethod && (
            <>
              <div className="receipt-row flex justify-between">
                <span>Bayar</span>
                <span>{data.paymentMethod === 'cash' ? 'CASH' : 'QRIS'}</span>
              </div>
              <hr className="receipt-divider my-2 border-dashed border-gray-400" />
            </>
          )}

          {/* Warning */}
          <div className="receipt-warning text-center text-[10px]">
            <div>** Max Check-out 12.00 WIB **</div>
          </div>

          <hr className="receipt-divider my-2 border-dashed border-gray-400" />

          {/* Footer dengan border = */}
          <div className="receipt-footer text-center text-[9px] text-gray-600">
            <div>=================================</div>
            <div>System by Nekat Digital</div>
            <div>=================================</div>
          </div>

        </div>
        {/* ===== PRINT AREA END ===== */}

        {/* Print button - NOT PRINTED */}
        <div className="border-t p-3 no-print flex-shrink-0 space-y-2">
          {/* Success message */}
          {printSuccess && (
            <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <span>✓ Berhasil mencetak {printCopies} nota!</span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            onClick={handlePrint} 
            className="w-full" 
            size="lg"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mencetak {printCopies} nota...
              </>
            ) : printSuccess ? (
              <>
                <Printer className="mr-2 h-5 w-5" />
                Cetak Ulang ({printCopies}x)
              </>
            ) : (
              <>
                <Printer className="mr-2 h-5 w-5" />
                    Cetak Nota {!isCheckout && `(${printCopies}x)`}
              </>
            )}
          </Button>

          {/* Close button after print */}
          {printSuccess && (
            <Button variant="outline" onClick={onClose} className="w-full">
              Tutup
            </Button>
          )}

          {/* Mode indicator */}
          <p className="text-[10px] text-center text-muted-foreground">
            {getModeText()}
            {!isCheckout && ' • 2 rangkap (tamu & kasir)'}
          </p>
        </div>
      </div>
    </div>
  );
}
