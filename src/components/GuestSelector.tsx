import { useState, useEffect } from 'react';
import { GuestRecord, getActiveGuests } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { UserPlus, RotateCcw, User, MapPin, DoorOpen } from 'lucide-react';

interface GuestSelectorProps {
    onNewGuest: () => void;
    onSelectGuest: (guest: GuestRecord) => void;
    onCancel: () => void;
}

export function GuestSelector({ onNewGuest, onSelectGuest, onCancel }: GuestSelectorProps) {
    const [activeGuests, setActiveGuests] = useState<GuestRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadGuests = async () => {
            setIsLoading(true);
            try {
                const guests = await getActiveGuests();
                setActiveGuests(guests);
            } catch (err) {
                console.error('Failed to load active guests:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadGuests();
    }, []);

    // Truncate address for display
    const truncateAddress = (address: string, maxLength = 25) => {
        if (address.length <= maxLength) return address;
        return address.slice(0, maxLength) + '...';
    };

    return (
        <div className="space-y-4">
            <div className="rounded-lg bg-primary/5 p-4">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Pilih Tamu</h3>

                {/* New Guest Option */}
                <Button
                    variant="outline"
                    className="mb-4 w-full justify-start gap-3 border-2 border-dashed border-primary/30 py-6 hover:border-primary hover:bg-primary/10"
                    onClick={onNewGuest}
                >
                    <UserPlus className="h-5 w-5 text-primary" />
                    <span className="font-medium">Tamu Baru</span>
                </Button>

                {/* Divider */}
                {activeGuests.length > 0 && (
                    <>
                        <div className="relative mb-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    <RotateCcw className="mr-1 inline h-3 w-3" />
                                    Tamu Aktif
                                </span>
                            </div>
                        </div>

                        {/* Active Guests List */}
                        <div className="max-h-64 space-y-2 overflow-y-auto">
                            {isLoading ? (
                                <div className="py-4 text-center text-sm text-muted-foreground">
                                    Memuat data tamu...
                                </div>
                            ) : (
                                activeGuests.map((guest) => (
                                    <button
                                        key={guest.id}
                                        type="button"
                                        onClick={() => onSelectGuest(guest)}
                                        className="w-full rounded-lg border border-border p-3 text-left transition-all hover:border-primary hover:bg-primary/5"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="mt-0.5 rounded-full bg-hotel-available/20 p-2">
                                                <User className="h-4 w-4 text-hotel-available" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium text-foreground">{guest.name}</p>
                                                <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                                    <MapPin className="h-3 w-3" />
                                                    <span>{truncateAddress(guest.address)}</span>
                                                </div>
                                                <div className="mt-1 flex items-center gap-1 text-xs text-hotel-available">
                                                    <DoorOpen className="h-3 w-3" />
                                                    <span>
                                                        Kamar: {guest.active_rooms.length > 0 ? guest.active_rooms.join(', ') : '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </>
                )}

                {!isLoading && activeGuests.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                        Tidak ada tamu aktif. Silakan input data tamu baru.
                    </p>
                )}
            </div>

            <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                Batal
            </Button>
        </div>
    );
}
