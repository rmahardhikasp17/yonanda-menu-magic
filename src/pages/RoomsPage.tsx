import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useActiveGuest } from '@/hooks/useActiveGuest';
import { useReceiptCounter } from '@/hooks/useReceiptCounter';
import { RoomRecord, GuestRecord } from '@/lib/db';
import { ReceiptData, PaymentMethod } from '@/types/hotel';
import { getRoomTypeInfo } from '@/data/roomData';
import { formatCurrency } from '@/lib/utils';
import { PageHeader } from '@/components/PageHeader';
import { RoomCard } from '@/components/RoomCard';
import { Receipt } from '@/components/Receipt';
import { Footer } from '@/components/Footer';
import { GuestForm } from '@/components/GuestForm';
import { GuestSelector } from '@/components/GuestSelector';
import { CheckInReceipt } from '@/components/CheckInReceipt';
import { AdminGuestPanel } from '@/components/AdminGuestPanel';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { differenceInDays, differenceInHours } from 'date-fns';
import { Eye } from 'lucide-react';

type CheckInStep = 'select' | 'guest-selector' | 'guest-form' | 'preview';

// Legacy Room interface for backward compatibility with UI
interface LegacyRoom {
  number: string;
  type: string;
  rate: number;
  facilities: string[];
  isOccupied: boolean;
  guestName?: string;
  guestAddress?: string;
  guestKtp?: string;
  guestPhone?: string;
  checkInTime?: string;
  paymentMethod?: PaymentMethod;
}

// Legacy ActiveGuest for CheckInReceipt
interface LegacyActiveGuest {
  name: string;
  address: string;
  ktpNumber: string;
  phoneNumber?: string;
}

const RoomsPage = () => {
  const { rooms, checkIn, checkOut, occupiedRooms, availableRooms, refreshRooms } = useRooms();
  const { activeGuest, setGuest, selectExistingGuest, clearGuest, hasActiveGuest, getMaskedKtp } = useActiveGuest();
  const { getNextReceiptNumber } = useReceiptCounter();

  const [selectedRoom, setSelectedRoom] = useState<RoomRecord | null>(null);
  const [checkInStep, setCheckInStep] = useState<CheckInStep>('select');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminGuestId, setAdminGuestId] = useState<string | null>(null);

  const occupiedCount = occupiedRooms.length;
  const availableCount = availableRooms.length;

  // Convert RoomRecord to LegacyRoom for RoomCard
  const convertToLegacyRoom = (room: RoomRecord): LegacyRoom => ({
    number: room.room_number,
    type: room.room_type,
    rate: room.rate_per_night,
    facilities: getRoomTypeInfo(room.room_type)?.facilities || [],
    isOccupied: room.status === 'occupied',
    checkInTime: room.checkin_time ? new Date(room.checkin_time).toISOString() : undefined,
  });

  const legacyRooms = rooms.map(convertToLegacyRoom);

  // Handle room click
  const handleRoomClick = (legacyRoom: LegacyRoom) => {
    const room = rooms.find((r) => r.room_number === legacyRoom.number);
    if (!room) return;

    setSelectedRoom(room);
    if (room.status !== 'occupied') {
      // For available rooms, show guest selector first
      setCheckInStep('guest-selector');
    } else {
      setCheckInStep('select');
    }
  };

  // Close dialog and reset state
  const closeDialog = () => {
    setSelectedRoom(null);
    setCheckInStep('select');
  };

  // Handle new guest selection from GuestSelector
  const handleNewGuest = () => {
    setCheckInStep('guest-form');
  };

  // Handle existing guest selection from GuestSelector
  const handleSelectExistingGuest = (guest: GuestRecord) => {
    selectExistingGuest(guest);
    setCheckInStep('preview');
  };

  // Handle guest form submission (new guest)
  const handleGuestSubmit = async (legacyGuest: LegacyActiveGuest) => {
    try {
      await setGuest({
        name: legacyGuest.name,
        address: legacyGuest.address,
        ktp_number: legacyGuest.ktpNumber,
        phone: legacyGuest.phoneNumber,
      });
      setCheckInStep('preview');
    } catch (err) {
      console.error('Failed to create guest:', err);
    }
  };

  // Handle check-in confirmation (print & update status)
  const handleCheckInConfirm = async (paymentMethod: PaymentMethod) => {
    if (selectedRoom && activeGuest) {
      // Print the receipt
      window.print();

      // Update room status AFTER print
      try {
        await checkIn(activeGuest.id, [selectedRoom.room_number]);
        await refreshRooms();
      } catch (err) {
        console.error('Check-in failed:', err);
      }

      // Close dialog and return to room selection
      closeDialog();
    }
  };

  // Handle check-out
  const handleCheckOut = async () => {
    if (selectedRoom && selectedRoom.status === 'occupied') {
      const checkedOutRoom = { ...selectedRoom };

      try {
        await checkOut(selectedRoom.room_number);
        await refreshRooms();
      } catch (err) {
        console.error('Check-out failed:', err);
      }

      // Calculate duration and total
      const checkInDate = new Date(checkedOutRoom.checkin_time || Date.now());
      const checkOutDate = new Date();
      let nights = differenceInDays(checkOutDate, checkInDate);

      // If less than a day but checked in, count as 1 night
      if (nights === 0 && differenceInHours(checkOutDate, checkInDate) > 0) {
        nights = 1;
      }
      // Minimum 1 night
      nights = Math.max(1, nights);

      const total = nights * checkedOutRoom.rate_per_night;
      const typeInfo = getRoomTypeInfo(checkedOutRoom.room_type);

      // Generate sequential receipt number for checkout
      const receiptNumber = await getNextReceiptNumber('checkout');

      setReceipt({
        receiptNumber,
        hotelName: 'Hotel Yonanda',
        timestamp: new Date().toISOString(),
        roomNumber: checkedOutRoom.room_number,
        items: [],
        total,
        type: 'room',
        checkInTime: checkedOutRoom.checkin_time ? new Date(checkedOutRoom.checkin_time).toISOString() : undefined,
        checkOutTime: new Date().toISOString(),
        nights,
        roomType: typeInfo?.label,
        roomRate: checkedOutRoom.rate_per_night,
      });

      closeDialog();
    }
  };

  // Handle view guest details (Admin)
  const handleViewGuestDetails = () => {
    if (selectedRoom?.guest_id) {
      setAdminGuestId(selectedRoom.guest_id);
      setShowAdminPanel(true);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceipt(null);
  };

  const typeInfo = selectedRoom ? getRoomTypeInfo(selectedRoom.room_type) : null;

  // Convert activeGuest to legacy format for CheckInReceipt
  const legacyActiveGuest: LegacyActiveGuest | null = activeGuest
    ? {
      name: activeGuest.name,
      address: activeGuest.address,
      ktpNumber: activeGuest.ktp_number,
      phoneNumber: activeGuest.phone || undefined,
    }
    : null;

  // Legacy room for CheckInReceipt
  const legacySelectedRoom = selectedRoom ? convertToLegacyRoom(selectedRoom) : null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Manajemen Kamar"
        subtitle={`${availableCount} tersedia · ${occupiedCount} terisi`}
      />


      {/* Legend */}
      <div className="container flex items-center gap-6 px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-hotel-available" />
          <span className="text-sm text-muted-foreground">Tersedia</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-hotel-occupied" />
          <span className="text-sm text-muted-foreground">Terisi</span>
        </div>
      </div>

      {/* Room Grid */}
      <main className="container px-4 pb-8">
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8 tablet:grid-cols-9 tablet-lg:grid-cols-11 lg:grid-cols-10 xl:grid-cols-11">
          {legacyRooms.map((room) => (
            <RoomCard key={room.number} room={room} onClick={handleRoomClick} />
          ))}
        </div>
      </main>

      {/* Guest Selector Dialog */}
      <Dialog
        open={!!selectedRoom && selectedRoom.status !== 'occupied' && checkInStep === 'guest-selector'}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-In Kamar {selectedRoom?.room_number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate_per_night || 0)}/malam
            </DialogDescription>
          </DialogHeader>

          <GuestSelector
            onNewGuest={handleNewGuest}
            onSelectGuest={handleSelectExistingGuest}
            onCancel={closeDialog}
          />
        </DialogContent>
      </Dialog>

      {/* Room Detail Dialog (for occupied rooms) */}
      <Dialog
        open={!!selectedRoom && selectedRoom.status === 'occupied' && checkInStep === 'select'}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kamar {selectedRoom?.room_number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate_per_night || 0)}/malam
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Facilities */}
            <div>
              <h4 className="mb-2 text-sm font-medium text-muted-foreground">Fasilitas:</h4>
              <div className="flex flex-wrap gap-2">
                {typeInfo?.facilities.map((facility, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="rounded-lg bg-hotel-occupied/10 p-4">
              <p className="font-medium text-hotel-occupied">Status: Terisi</p>
              {selectedRoom?.checkin_time && (
                <p className="text-sm text-muted-foreground">
                  Check-in: {new Date(selectedRoom.checkin_time).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
            {selectedRoom?.guest_id && (
              <Button
                variant="outline"
                onClick={handleViewGuestDetails}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Lihat Data Tamu
              </Button>
            )}
            <Button
              onClick={handleCheckOut}
              className="flex-1 touch-button bg-hotel-occupied hover:bg-hotel-occupied/90"
            >
              Check-Out & Cetak Nota
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Guest Form Dialog (for new guests) */}
      <Dialog
        open={!!selectedRoom && selectedRoom.status !== 'occupied' && checkInStep === 'guest-form'}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-In Kamar {selectedRoom?.room_number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate_per_night || 0)}/malam
            </DialogDescription>
          </DialogHeader>

          <GuestForm onSubmit={handleGuestSubmit} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>

      {/* Check-In Receipt Preview */}
      {selectedRoom && selectedRoom.status !== 'occupied' && checkInStep === 'preview' && legacyActiveGuest && legacySelectedRoom && (
        <CheckInReceipt
          room={legacySelectedRoom}
          guest={legacyActiveGuest}
          maskedKtp={getMaskedKtp(legacyActiveGuest.ktpNumber)}
          onConfirm={handleCheckInConfirm}
          onCancel={closeDialog}
        />
      )}

      {/* Check-Out Receipt Modal */}
      {receipt && <Receipt data={receipt} onClose={closeReceipt} onPrint={handlePrint} />}

      {/* Admin Guest Panel */}
      {showAdminPanel && adminGuestId && (
        <AdminGuestPanel
          guestId={adminGuestId}
          onClose={() => {
            setShowAdminPanel(false);
            setAdminGuestId(null);
          }}
        />
      )}

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};

export default RoomsPage;
