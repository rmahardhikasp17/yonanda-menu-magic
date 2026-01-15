import { useState, useEffect } from 'react';
import { GuestRecord, getGuest, getRoomsByGuestId, RoomRecord } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { X, User, MapPin, CreditCard, Phone, DoorOpen, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface AdminGuestPanelProps {
    guestId: string;
    onClose: () => void;
}

export function AdminGuestPanel({ guestId, onClose }: AdminGuestPanelProps) {
    const [guest, setGuest] = useState<GuestRecord | null>(null);
    const [rooms, setRooms] = useState<RoomRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                const guestData = await getGuest(guestId);
                setGuest(guestData);

                if (guestData) {
                    const guestRooms = await getRoomsByGuestId(guestId);
                    setRooms(guestRooms);
                }
            } catch (err) {
                console.error('Failed to load guest data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, [guestId]);

    const formatDate = (timestamp: number) => {
        return format(new Date(timestamp), 'dd MMM yyyy, HH:mm', { locale: id });
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <p className="text-center text-muted-foreground">Memuat data tamu...</p>
                </div>
            </div>
        );
    }

    if (!guest) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
                    <p className="text-center text-destructive">Data tamu tidak ditemukan</p>
                    <Button onClick={onClose} className="mt-4 w-full">
                        Tutup
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b p-4">
                    <div>
                        <h2 className="text-lg font-bold text-foreground">Data Tamu</h2>
                        <p className="text-xs text-muted-foreground">Admin View - Confidential</p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Warning Banner */}
                    <div className="mb-4 rounded-lg bg-hotel-warning/10 p-3">
                        <p className="text-center text-xs font-medium text-hotel-warning">
                            ⚠️ DATA SENSITIF - HANYA UNTUK ADMIN ⚠️
                        </p>
                    </div>

                    {/* Guest Details */}
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Nama Tamu</p>
                                <p className="font-medium text-foreground">{guest.name}</p>
                            </div>
                        </div>

                        {/* Address */}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                <MapPin className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Alamat</p>
                                <p className="font-medium text-foreground">{guest.address}</p>
                            </div>
                        </div>

                        {/* KTP - FULL, NOT MASKED */}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-destructive/10 p-2">
                                <CreditCard className="h-4 w-4 text-destructive" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">No. KTP (Full)</p>
                                <p className="font-mono font-medium text-foreground">{guest.ktp_number}</p>
                            </div>
                        </div>

                        {/* Phone */}
                        {guest.phone && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                    <Phone className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">No. HP</p>
                                    <p className="font-medium text-foreground">{guest.phone}</p>
                                </div>
                            </div>
                        )}

                        {/* Active Rooms */}
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 rounded-full bg-hotel-available/10 p-2">
                                <DoorOpen className="h-4 w-4 text-hotel-available" />
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Kamar Aktif</p>
                                <p className="font-medium text-foreground">
                                    {guest.active_rooms.length > 0 ? guest.active_rooms.join(', ') : '-'}
                                </p>
                            </div>
                        </div>

                        {/* Check-in Time (from first room) */}
                        {rooms.length > 0 && rooms[0].checkin_time && (
                            <div className="flex items-start gap-3">
                                <div className="mt-0.5 rounded-full bg-primary/10 p-2">
                                    <Clock className="h-4 w-4 text-primary" />
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Check-in</p>
                                    <p className="font-medium text-foreground">{formatDate(rooms[0].checkin_time)}</p>
                                </div>
                            </div>
                        )}

                        {/* Created At */}
                        <div className="mt-4 border-t pt-4">
                            <p className="text-center text-xs text-muted-foreground">
                                Data dibuat: {formatDate(guest.created_at)}
                            </p>
                            <p className="text-center text-xs text-muted-foreground">
                                Status: {guest.is_active ? '✅ Aktif' : '❌ Non-Aktif'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4">
                    <Button onClick={onClose} className="w-full">
                        Tutup
                    </Button>
                </div>
            </div>
        </div>
    );
}
