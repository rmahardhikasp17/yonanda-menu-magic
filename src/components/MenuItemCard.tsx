import { MenuItem } from '@/types/hotel';
import { formatCurrency } from '@/data/roomData';
import { cn } from '@/lib/utils';
import { Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, quantity, onAdd, onRemove }: MenuItemCardProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-between rounded-xl border bg-card p-4 shadow-sm transition-all',
        quantity > 0 && 'border-primary ring-2 ring-primary/20'
      )}
    >
      <div className="flex-1">
        <h3 className="font-medium text-card-foreground">{item.name}</h3>
        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
      </div>
      <div className="flex items-center gap-2">
        {quantity > 0 && (
          <>
            <Button
              variant="outline"
              size="icon"
              className="touch-button h-10 w-10 rounded-full"
              onClick={onRemove}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-lg font-bold">{quantity}</span>
          </>
        )}
        <Button
          variant="default"
          size="icon"
          className="touch-button h-10 w-10 rounded-full"
          onClick={onAdd}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
