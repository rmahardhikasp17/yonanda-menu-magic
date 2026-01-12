import { OrderItem } from '@/types/hotel';
import { formatCurrency } from '@/data/roomData';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Trash2 } from 'lucide-react';

interface OrderSummaryProps {
  items: OrderItem[];
  total: number;
  onClear: () => void;
  onCheckout: () => void;
  roomNumber?: string;
}

export function OrderSummary({
  items,
  total,
  onClear,
  onCheckout,
  roomNumber,
}: OrderSummaryProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
        <ShoppingCart className="mb-2 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">Belum ada pesanan</p>
        <p className="text-sm text-muted-foreground">Pilih menu untuk memulai</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 shadow-md">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-bold text-card-foreground">Pesanan</h3>
        {roomNumber && (
          <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            Kamar {roomNumber}
          </span>
        )}
      </div>

      <div className="max-h-[300px] space-y-2 overflow-y-auto">
        {items.map((item) => (
          <div
            key={item.menuItem.id}
            className="flex items-center justify-between rounded-lg bg-muted/50 p-2 text-sm"
          >
            <div>
              <span className="font-medium">{item.menuItem.name}</span>
              <span className="ml-2 text-muted-foreground">x{item.quantity}</span>
            </div>
            <span className="font-medium">
              {formatCurrency(item.menuItem.price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 border-t pt-4">
        <div className="mb-4 flex items-center justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-primary">{formatCurrency(total)}</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="touch-button flex-1"
            onClick={onClear}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus
          </Button>
          <Button className="touch-button flex-1" onClick={onCheckout}>
            Cetak Nota
          </Button>
        </div>
      </div>
    </div>
  );
}
