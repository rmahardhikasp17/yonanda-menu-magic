import { ReceiptData } from '@/types/hotel';
import { formatCurrency } from '@/data/roomData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';

interface ReceiptProps {
  data: ReceiptData;
  onClose: () => void;
  onPrint: () => void;
}

export function Receipt({ data, onClose, onPrint }: ReceiptProps) {
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMMM yyyy, HH:mm', { locale: id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        {/* Header actions */}
        <div className="flex items-center justify-between border-b p-4 no-print">
          <h2 className="text-lg font-bold text-foreground">Preview Nota</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Receipt content */}
        <div className="print-area p-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">Hotel Yonanda</h1>
            <p className="text-sm text-muted-foreground">Nota Pembayaran</p>
            <p className="mt-2 text-xs text-muted-foreground">{formatDate(data.timestamp)}</p>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          {/* Room info for room checkout */}
          {data.type === 'room' && (
            <div className="mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kamar:</span>
                <span className="font-medium">{data.roomNumber}</span>
              </div>
              {data.guestName && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tamu:</span>
                  <span className="font-medium">{data.guestName}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipe:</span>
                <span className="font-medium">{data.roomType}</span>
              </div>
              {data.checkInTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-in:</span>
                  <span className="font-medium">{formatDate(data.checkInTime)}</span>
                </div>
              )}
              {data.checkOutTime && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Check-out:</span>
                  <span className="font-medium">{formatDate(data.checkOutTime)}</span>
                </div>
              )}
              {data.nights !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durasi:</span>
                  <span className="font-medium">{data.nights} malam</span>
                </div>
              )}
              {data.roomRate !== undefined && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarif/malam:</span>
                  <span className="font-medium">{formatCurrency(data.roomRate)}</span>
                </div>
              )}
            </div>
          )}

          {/* Canteen order room info */}
          {data.type === 'canteen-guest' && data.roomNumber && (
            <div className="mb-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Kamar:</span>
                <span className="font-medium">{data.roomNumber}</span>
              </div>
            </div>
          )}

          {/* Order items */}
          {data.items.length > 0 && (
            <>
              <div className="my-2 border-t border-dashed border-border" />
              <div className="space-y-2">
                {data.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div className="flex-1">
                      <span>{item.name}</span>
                      <span className="ml-2 text-muted-foreground">x{item.quantity}</span>
                    </div>
                    <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="my-4 border-t border-dashed border-border" />

          {/* Total */}
          <div className="flex justify-between text-lg font-bold">
            <span>TOTAL</span>
            <span>{formatCurrency(data.total)}</span>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <p className="text-center text-xs text-muted-foreground">
            Terima kasih atas kunjungan Anda
          </p>
          <p className="mt-1 text-center text-xs text-muted-foreground">
            Maksimal check-out jam 12.00 WIB
          </p>

          <div className="my-4 border-t border-dashed border-border" />

          <p className="text-center text-xs text-muted-foreground">
            Developed System by Nekat Digital
          </p>
        </div>

        {/* Print button */}
        <div className="border-t p-4 no-print">
          <Button onClick={onPrint} className="w-full touch-button" size="lg">
            <Printer className="mr-2 h-5 w-5" />
            Cetak Nota
          </Button>
        </div>
      </div>
    </div>
  );
}
