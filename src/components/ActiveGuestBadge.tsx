import { ActiveGuest } from '@/types/hotel';
import { User, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActiveGuestBadgeProps {
  guest: ActiveGuest;
  onClear: () => void;
}

export function ActiveGuestBadge({ guest, onClear }: ActiveGuestBadgeProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2">
      <User className="h-5 w-5 text-primary" />
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">Tamu Aktif: {guest.name}</p>
        <p className="text-xs text-muted-foreground">{guest.address}</p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="h-8 px-2 text-muted-foreground hover:text-destructive"
      >
        <X className="h-4 w-4" />
        <span className="ml-1 text-xs">Reset</span>
      </Button>
    </div>
  );
}
