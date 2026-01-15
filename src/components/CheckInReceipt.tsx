import { useState } from 'react';
import { PaymentMethod } from '@/types/hotel';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Printer, X, Banknote, QrCode } from 'lucide-react';

// Simplified interfaces for CheckInReceipt
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
  const typeInfo = getRoomTypeInfo(room.type);
  const now = new Date();

  const handleConfirm = () => {
    if (paymentMethod) {
      onConfirm(paymentMethod);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-md max-h-[95vh] flex flex-col rounded-2xl bg-white shadow-2xl my-auto">
        {/* Header actions */}
        <div className="flex items-center justify-between border-b p-4 no-print flex-shrink-0">
          <h2 className="text-lg font-bold text-foreground">Preview Nota Check-In</h2>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Receipt content - scrollable */}
        <div className="print-area p-6 flex-1 overflow-y-auto">
          <div className="text-center">
            <img
              src="/logo-small.png"
              alt="Hotel Yonanda"
              className="mx-auto mb-2 h-16 w-16 object-contain"
            />
            <h1 className="text-2xl font-bold text-foreground">HOTEL YONANDA</h1>
            <p className="mt-1 text-sm text-muted-foreground">Terima Kasih Atas Kunjungan Anda</p>
          </div>

          <div className="my-4 text-center text-sm text-muted-foreground">
            <p>{format(now, 'EEEE, dd MMMM yyyy', { locale: id })}</p>
            <p>Jam: {format(now, 'HH:mm', { locale: id })}</p>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <p className="mb-3 text-center font-semibold text-foreground">CHECK-IN KAMAR</p>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. Kamar:</span>
              <span className="font-medium">{room.number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipe:</span>
              <span className="font-medium">{typeInfo?.label}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tarif/Malam:</span>
              <span className="font-medium">{formatCurrency(room.rate)}</span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nama Tamu:</span>
              <span className="font-medium">{guest.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">No. KTP:</span>
              <span className="font-medium">{maskedKtp}</span>
            </div>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          {/* Payment Method Selection */}
          <div className="mb-4">
            <p className="mb-3 text-sm font-medium text-foreground">Metode Pembayaran:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'cash'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <Banknote className={`h-6 w-6 ${paymentMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'cash' ? 'text-primary' : 'text-foreground'}`}>
                  Cash
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${paymentMethod === 'qris'
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
                  }`}
              >
                <QrCode className={`h-6 w-6 ${paymentMethod === 'qris' ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium ${paymentMethod === 'qris' ? 'text-primary' : 'text-foreground'}`}>
                  QRIS
                </span>
              </button>
            </div>
          </div>

          <div className="my-4 rounded-lg bg-hotel-warning/10 p-3">
            <p className="text-center text-sm font-medium text-hotel-warning">
              ⚠️ CATATAN PENTING ⚠️
            </p>
            <p className="mt-1 text-center text-sm text-hotel-warning">
              Maksimal Check-out Jam 12.00 WIB
            </p>
          </div>

          <div className="my-4 border-t border-dashed border-border" />

          <p className="text-center text-sm text-muted-foreground">Terima Kasih</p>
          <p className="text-center text-sm text-muted-foreground">Selamat Menikmati!</p>

          <div className="my-4 border-t border-dashed border-border" />

          <p className="text-center text-xs text-muted-foreground">
            Developed System by Nekat Digital
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 border-t p-4 no-print flex-shrink-0">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Batal
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!paymentMethod}
            className="flex-1 touch-button"
            size="lg"
          >
            <Printer className="mr-2 h-5 w-5" />
            Cetak & Check-In
          </Button>
        </div>
      </div>
    </div>
  );
}
