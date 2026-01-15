/**
 * Room Management Component - Full CRUD
 * 
 * Admin room management interface
 * - Add new rooms
 * - Edit room price/type
 * - Delete rooms (if not occupied)
 * - Audit trail for all changes
 */

import { useState, useEffect } from 'react';
import { RoomRecord, getAllRooms, updateRoom, getRoom, generateId } from '@/lib/db';
import { logRoomChange } from '@/lib/audit-log';
import { roomTypesData, formatCurrency } from '@/data/roomData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import put for adding rooms
import { getDB, STORES } from '@/lib/db';

interface RoomManagementProps {
    onBack: () => void;
}

interface EditingRoom {
    room: RoomRecord | null;
    roomNumber: string;
    newPrice: string;
    newType: string;
    isNew: boolean;
}

// Helper to add room directly
async function addRoom(room: RoomRecord): Promise<RoomRecord> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.ROOMS, 'readwrite');
        const store = transaction.objectStore(STORES.ROOMS);
        const request = store.put(room);
        request.onsuccess = () => resolve(room);
        request.onerror = () => reject(new Error('Failed to add room'));
    });
}

// Helper to delete room
async function deleteRoom(roomNumber: string): Promise<void> {
    const db = await getDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORES.ROOMS, 'readwrite');
        const store = transaction.objectStore(STORES.ROOMS);
        const request = store.delete(roomNumber);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error('Failed to delete room'));
    });
}

export function RoomManagement({ onBack }: RoomManagementProps) {
    const { toast } = useToast();
    const [rooms, setRooms] = useState<RoomRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<EditingRoom | null>(null);
    const [submitting, setSubmitting] = useState(false);

    // Load rooms
    useEffect(() => {
        loadRooms();
    }, []);

    const loadRooms = async () => {
        try {
            const allRooms = await getAllRooms();
            allRooms.sort((a, b) => parseInt(a.room_number) - parseInt(b.room_number));
            setRooms(allRooms);
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Gagal memuat data kamar',
                variant: 'destructive',
            });
        } finally {
            setLoading(false);
        }
    };

    const openAdd = () => {
        setEditing({
            room: null,
            roomNumber: '',
            newPrice: roomTypesData[0]?.rate.toString() || '100000',
            newType: roomTypesData[0]?.type || 'standar',
            isNew: true,
        });
    };

    const openEdit = (room: RoomRecord) => {
        setEditing({
            room,
            roomNumber: room.room_number,
            newPrice: room.rate_per_night.toString(),
            newType: room.room_type,
            isNew: false,
        });
    };

    const closeEdit = () => {
        setEditing(null);
    };

    const handleSave = async () => {
        if (!editing) return;

        const newPrice = parseInt(editing.newPrice, 10);
        if (isNaN(newPrice) || newPrice <= 0) {
            toast({
                title: 'Error',
                description: 'Harga harus lebih dari 0',
                variant: 'destructive',
            });
            return;
        }

        if (editing.isNew && !editing.roomNumber.trim()) {
            toast({
                title: 'Error',
                description: 'Nomor kamar wajib diisi',
                variant: 'destructive',
            });
            return;
        }

        // Check duplicate room number for new rooms
        if (editing.isNew) {
            const existing = rooms.find(r => r.room_number === editing.roomNumber.trim());
            if (existing) {
                toast({
                    title: 'Error',
                    description: 'Nomor kamar sudah ada',
                    variant: 'destructive',
                });
                return;
            }
        }

        setSubmitting(true);
        try {
            if (editing.isNew) {
                // Add new room
                const newRoom: RoomRecord = {
                    room_number: editing.roomNumber.trim(),
                    room_type: editing.newType,
                    rate_per_night: newPrice,
                    status: 'available',
                    guest_id: null,
                    checkin_time: null,
                    checkout_deadline: null,
                };

                await addRoom(newRoom);
                await logRoomChange(newRoom.room_number, 'ROOM_ACTIVATE', 'new_room', 0, newPrice);

                toast({
                    title: 'Berhasil',
                    description: `Kamar ${newRoom.room_number} ditambahkan`,
                });
            } else {
                // Edit existing room
                const oldRoom = editing.room!;

                if (newPrice !== oldRoom.rate_per_night) {
                    await logRoomChange(
                        oldRoom.room_number,
                        'ROOM_UPDATE',
                        'rate_per_night',
                        oldRoom.rate_per_night,
                        newPrice
                    );
                }

                if (editing.newType !== oldRoom.room_type) {
                    await logRoomChange(
                        oldRoom.room_number,
                        'ROOM_UPDATE',
                        'room_type',
                        oldRoom.room_type,
                        editing.newType
                    );
                }

                await updateRoom(oldRoom.room_number, {
                    rate_per_night: newPrice,
                    room_type: editing.newType,
                });

                toast({
                    title: 'Berhasil',
                    description: `Kamar ${oldRoom.room_number} diperbarui`,
                });
            }

            await loadRooms();
            closeEdit();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Gagal menyimpan perubahan',
                variant: 'destructive',
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (room: RoomRecord) => {
        if (room.status === 'occupied') {
            toast({
                title: 'Error',
                description: 'Tidak bisa hapus kamar yang sedang terisi',
                variant: 'destructive',
            });
            return;
        }

        if (!confirm(`Hapus kamar "${room.room_number}"?`)) {
            return;
        }

        try {
            await deleteRoom(room.room_number);
            await logRoomChange(room.room_number, 'ROOM_DEACTIVATE', 'deleted', room.rate_per_night, 0);

            toast({
                title: 'Berhasil',
                description: `Kamar ${room.room_number} dihapus`,
            });

            await loadRooms();
        } catch (err) {
            toast({
                title: 'Error',
                description: 'Gagal menghapus kamar',
                variant: 'destructive',
            });
        }
    };

    const getRoomTypeLabel = (type: string): string => {
        const found = roomTypesData.find(t => t.type === type);
        return found?.label || type;
    };

    const isRoomOccupied = (room: RoomRecord): boolean => {
        return room.status === 'occupied';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <p className="text-muted-foreground">Memuat data kamar...</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with Add Button */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {rooms.length} kamar terdaftar
                </p>
                <Button onClick={openAdd} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Kamar
                </Button>
            </div>

            {/* Room List */}
            <div className="space-y-2">
                {rooms.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                        <p className="text-muted-foreground">Belum ada kamar terdaftar</p>
                    </div>
                ) : (
                    rooms.map((room) => {
                        const occupied = isRoomOccupied(room);
                        return (
                            <div
                                key={room.room_number}
                                className="flex items-center justify-between rounded-xl border bg-card p-4"
                            >
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-mono font-bold text-card-foreground">
                                            Kamar {room.room_number}
                                        </p>
                                        {occupied && (
                                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                                                TERISI
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {getRoomTypeLabel(room.room_type)} • {formatCurrency(room.rate_per_night)}/malam
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10"
                                        onClick={() => openEdit(room)}
                                        disabled={occupied}
                                        title={occupied ? 'Tidak bisa edit kamar terisi' : 'Edit kamar'}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-10 w-10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                        onClick={() => handleDelete(room)}
                                        disabled={occupied}
                                        title={occupied ? 'Tidak bisa hapus kamar terisi' : 'Hapus kamar'}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Info */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                    <div className="text-xs text-amber-700">
                        <p className="font-medium">Catatan:</p>
                        <ul className="mt-1 space-y-0.5 list-disc list-inside">
                            <li>Kamar yang sedang TERISI tidak bisa diubah/hapus</li>
                            <li>Perubahan harga berlaku untuk check-in berikutnya</li>
                            <li>Semua perubahan dicatat di audit log</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={!!editing} onOpenChange={() => closeEdit()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editing?.isNew ? 'Tambah Kamar Baru' : `Edit Kamar ${editing?.room?.room_number}`}
                        </DialogTitle>
                        <DialogDescription>
                            {editing?.isNew
                                ? 'Tambahkan kamar baru ke sistem.'
                                : 'Ubah harga atau tipe kamar.'}
                        </DialogDescription>
                    </DialogHeader>

                    {editing && (
                        <div className="space-y-4">
                            {editing.isNew && (
                                <div className="space-y-2">
                                    <Label>Nomor Kamar</Label>
                                    <Input
                                        value={editing.roomNumber}
                                        onChange={(e) =>
                                            setEditing({ ...editing, roomNumber: e.target.value })
                                        }
                                        placeholder="Contoh: 101, 202, dll"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Tipe Kamar</Label>
                                <Select
                                    value={editing.newType}
                                    onValueChange={(val) =>
                                        setEditing({ ...editing, newType: val })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roomTypesData.map((type) => (
                                            <SelectItem key={type.type} value={type.type}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Harga per Malam (Rp)</Label>
                                <Input
                                    type="number"
                                    value={editing.newPrice}
                                    onChange={(e) =>
                                        setEditing({ ...editing, newPrice: e.target.value })
                                    }
                                    placeholder="Masukkan harga"
                                    min={1}
                                />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button variant="outline" onClick={closeEdit}>
                            Batal
                        </Button>
                        <Button onClick={handleSave} disabled={submitting}>
                            {submitting ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
