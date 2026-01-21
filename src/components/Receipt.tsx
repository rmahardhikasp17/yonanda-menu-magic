/**
 * Receipt Component - Thermal 58mm Optimized
 * 
 * Professional receipt layout for thermal printers
 * - 58mm paper width (~48mm printable)
 * - Monospace font
 * - Serial/COM Port printing (PRIMARY - no dialog after setup)
 * - Bluetooth printing (fallback)
 * - Browser print (legacy fallback)
 */

import { ReceiptData } from '@/types/hotel';
import { formatCurrency } from '@/data/roomData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X, Bluetooth, Loader2, AlertCircle, Usb, Settings } from 'lucide-react';
import { useThermalPrinter, PrinterMode } from '@/hooks/useThermalPrinter';
import { ReceiptPrintData } from '@/lib/thermal-printer';

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

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: id });
  };

  const formatTime = (dateString: string) => {
    return format(new Date(dateString), 'HH:mm', { locale: id });
  };

  // Direct print handler (Serial/COM Port - no dialog!)
  const handleDirectPrint = async () => {
    const printData = convertToPrintData(data);
    const success = await print(printData);

    if (success) {
      onPrint();
    }
  };

  // Browser print handler (fallback)
  const handleBrowserPrint = () => {
    onPrint();
    window.print();
  };

  // Mode button styles
  const getModeButtonClass = (mode: PrinterMode, isActive: boolean, isDisabled: boolean) => {
    let base = 'flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-lg border-2 text-xs font-medium transition-all';
    if (isDisabled) {
      base += ' opacity-50 cursor-not-allowed';
    }
    if (isActive) {
      base += ' border-blue-500 bg-blue-50 text-blue-700';
    } else {
      base += ' border-gray-200 text-gray-500';
    }
    return base;
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

          {/* Header */}
          <div className="receipt-header text-center">
            <div className="text-sm font-bold">HOTEL YONANDA</div>
            <div className="text-[10px]">Terima Kasih Atas</div>
            <div className="text-[10px]">Kunjungan Anda</div>
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
            No: {data.receiptNumber || '-'}
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
                {data.guestName && (
                  <div className="receipt-row flex justify-between">
                    <span>Tamu</span>
                    <span className="text-right max-w-[100px] truncate">{data.guestName}</span>
                  </div>
                )}
                <div className="receipt-row flex justify-between">
                  <span>Tipe</span>
                  <span>{data.roomType}</span>
                </div>
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
                <span>Kamar</span>
                <span>{data.roomNumber}</span>
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

        {/* Print options - NOT PRINTED */}
        <div className="border-t p-3 no-print flex-shrink-0 space-y-3">

          {/* Printer Status (Serial mode) */}
          {printerMode === 'serial' && isSerialSupported && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Usb className={`h-4 w-4 ${hasSavedPort ? 'text-green-500' : 'text-gray-400'}`} />
                <span className={hasSavedPort ? 'text-green-600' : 'text-gray-500'}>
                  {hasSavedPort ? 'COM Port tersimpan' : 'Belum setup'}
                </span>
              </div>
              {hasSavedPort ? (
                <button
                  onClick={clearSavedPrinter}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Reset
                </button>
              ) : (
                <button
                  onClick={setupPrinter}
                  disabled={isConnecting}
                  className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50 flex items-center gap-1"
                >
                  <Settings className="h-3 w-3" />
                  Setup Printer
                </button>
              )}
            </div>
          )}

          {/* Printer Status (Bluetooth mode) */}
          {printerMode === 'bluetooth' && isBluetoothSupported && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Bluetooth className={`h-4 w-4 ${status.isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
                <span className={status.isConnected ? 'text-blue-600' : 'text-gray-500'}>
                  {status.isConnected
                    ? `Terhubung: ${status.deviceName}`
                    : 'Tidak terhubung'}
                </span>
              </div>
              {status.isConnected ? (
                <button
                  onClick={disconnect}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Putuskan
                </button>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  className="text-xs text-blue-500 hover:text-blue-700 disabled:opacity-50"
                >
                  {isConnecting ? 'Menghubungkan...' : 'Hubungkan'}
                </button>
              )}
            </div>
          )}

          {/* Error message */}
          {status.error && (
            <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 p-2 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{status.error}</span>
            </div>
          )}

          {/* Print Mode Toggle */}
          <div className="flex gap-1">
            <button
              onClick={() => setPrinterMode('serial')}
              disabled={!isSerialSupported}
              className={getModeButtonClass('serial', printerMode === 'serial', !isSerialSupported)}
            >
              <Usb className="h-3 w-3" />
              COM Port
            </button>
            <button
              onClick={() => setPrinterMode('bluetooth')}
              disabled={!isBluetoothSupported}
              className={getModeButtonClass('bluetooth', printerMode === 'bluetooth', !isBluetoothSupported)}
            >
              <Bluetooth className="h-3 w-3" />
              Bluetooth
            </button>
            <button
              onClick={() => setPrinterMode('browser')}
              className={getModeButtonClass('browser', printerMode === 'browser', false)}
            >
              <Printer className="h-3 w-3" />
              Browser
            </button>
          </div>

          {/* Print Button */}
          {printerMode === 'serial' && isSerialSupported ? (
            <Button
              onClick={handleDirectPrint}
              className="w-full"
              size="lg"
              disabled={isPrinting || isConnecting || !hasSavedPort}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mencetak...
                </>
              ) : !hasSavedPort ? (
                <>
                  <Settings className="mr-2 h-5 w-5" />
                  Setup Printer Dulu
                </>
              ) : (
                <>
                  <Printer className="mr-2 h-5 w-5" />
                  Cetak Langsung
                </>
              )}
            </Button>
          ) : printerMode === 'bluetooth' && isBluetoothSupported ? (
            <Button
              onClick={handleDirectPrint}
              className="w-full"
              size="lg"
              disabled={isPrinting || isConnecting}
            >
              {isPrinting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Mencetak...
                </>
              ) : isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Menghubungkan...
                </>
              ) : (
                <>
                  <Bluetooth className="mr-2 h-5 w-5" />
                  Cetak Bluetooth
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleBrowserPrint} className="w-full" size="lg">
              <Printer className="mr-2 h-5 w-5" />
              Cetak Nota
            </Button>
          )}

          {/* Mode-specific notes */}
          {printerMode === 'serial' && !hasSavedPort && (
            <p className="text-[10px] text-amber-600 text-center">
              Klik "Setup Printer" untuk memilih COM Port (sekali saja)
            </p>
          )}
          {printerMode === 'serial' && hasSavedPort && (
            <p className="text-[10px] text-green-600 text-center">
              ✓ Printer langsung cetak tanpa dialog
            </p>
          )}
          {printerMode === 'browser' && (
            <p className="text-[10px] text-gray-500 text-center">
              Pastikan printer thermal sudah terpasang sebagai printer default
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
