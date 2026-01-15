import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useActiveGuest } from '@/hooks/useActiveGuest';
import { Room, ReceiptData, ActiveGuest, PaymentMethod } from '@/types/hotel';
import { getRoomTypeInfo, formatCurrency } from '@/data/roomData';
import { PageHeader } from '@/components/PageHeader';
import { RoomCard } from '@/components/RoomCard';
import { Receipt } from '@/components/Receipt';
import { Footer } from '@/components/Footer';
import { ActiveGuestBadge } from '@/components/ActiveGuestBadge';
import { GuestForm } from '@/components/GuestForm';
import { CheckInReceipt } from '@/components/CheckInReceipt';
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

type CheckInStep = 'select' | 'guest-form' | 'preview';

const RoomsPage = () => {
  const { rooms, checkIn, checkOut, getOccupiedRooms, getAvailableRooms } = useRooms();
  const { activeGuest, setGuest, clearGuest, hasActiveGuest, getMaskedKtp } = useActiveGuest();

  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [checkInStep, setCheckInStep] = useState<CheckInStep>('select');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const occupiedCount = getOccupiedRooms().length;
  const availableCount = getAvailableRooms().length;

  // Handle room click
  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    if (!room.isOccupied) {
      // For available rooms, check if we have an active guest
      if (hasActiveGuest) {
        setCheckInStep('preview');
      } else {
        setCheckInStep('guest-form');
      }
    } else {
      setCheckInStep('select');
    }
  };

  // Close dialog and reset state
  const closeDialog = () => {
    setSelectedRoom(null);
    setCheckInStep('select');
  };

  // Handle guest form submission
  const handleGuestSubmit = (guest: ActiveGuest) => {
    setGuest(guest);
    setCheckInStep('preview');
  };

  // Handle check-in confirmation (print & update status)
  const handleCheckInConfirm = (paymentMethod: PaymentMethod) => {
    if (selectedRoom && activeGuest) {
      // Print the receipt
      window.print();
      
      // Update room status AFTER print
      checkIn(selectedRoom.number, activeGuest, paymentMethod);
      
      // Close dialog and return to room selection
      closeDialog();
    }
  };

  // Handle check-out
  const handleCheckOut = () => {
    if (selectedRoom && selectedRoom.isOccupied) {
      const checkedOutRoom = { ...selectedRoom };
      checkOut(selectedRoom.number);

      // Calculate duration and total
      const checkInDate = new Date(checkedOutRoom.checkInTime || new Date());
      const checkOutDate = new Date();
      let nights = differenceInDays(checkOutDate, checkInDate);

      // If less than a day but checked in, count as 1 night
      if (nights === 0 && differenceInHours(checkOutDate, checkInDate) > 0) {
        nights = 1;
      }
      // Minimum 1 night
      nights = Math.max(1, nights);

      const total = nights * checkedOutRoom.rate;
      const typeInfo = getRoomTypeInfo(checkedOutRoom.type);

      setReceipt({
        hotelName: 'Hotel Yonanda',
        timestamp: new Date().toISOString(),
        roomNumber: checkedOutRoom.number,
        guestName: checkedOutRoom.guestName,
        items: [],
        total,
        type: 'room',
        checkInTime: checkedOutRoom.checkInTime,
        checkOutTime: new Date().toISOString(),
        nights,
        roomType: typeInfo?.label,
        roomRate: checkedOutRoom.rate,
      });

      closeDialog();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceipt(null);
  };

  const typeInfo = selectedRoom ? getRoomTypeInfo(selectedRoom.type) : null;

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Manajemen Kamar"
        subtitle={`${availableCount} tersedia · ${occupiedCount} terisi`}
      />

      {/* Active Guest Badge */}
      {hasActiveGuest && activeGuest && (
        <div className="container px-4 pt-4">
          <ActiveGuestBadge guest={activeGuest} onClear={clearGuest} />
        </div>
      )}

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
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
          {rooms.map((room) => (
            <RoomCard key={room.number} room={room} onClick={handleRoomClick} />
          ))}
        </div>
      </main>

      {/* Room Detail Dialog (for occupied rooms) */}
      <Dialog
        open={!!selectedRoom && selectedRoom.isOccupied && checkInStep === 'select'}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Kamar {selectedRoom?.number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate || 0)}/malam
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
              {selectedRoom?.guestName && (
                <p className="text-sm text-muted-foreground">Tamu: {selectedRoom.guestName}</p>
              )}
              {selectedRoom?.checkInTime && (
                <p className="text-sm text-muted-foreground">
                  Check-in: {new Date(selectedRoom.checkInTime).toLocaleString('id-ID')}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="flex gap-2 sm:gap-2">
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
        open={!!selectedRoom && !selectedRoom.isOccupied && checkInStep === 'guest-form'}
        onOpenChange={() => closeDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Check-In Kamar {selectedRoom?.number}</DialogTitle>
            <DialogDescription>
              {typeInfo?.label} - {formatCurrency(selectedRoom?.rate || 0)}/malam
            </DialogDescription>
          </DialogHeader>

          <GuestForm onSubmit={handleGuestSubmit} onCancel={closeDialog} />
        </DialogContent>
      </Dialog>

      {/* Check-In Receipt Preview */}
      {selectedRoom && !selectedRoom.isOccupied && checkInStep === 'preview' && activeGuest && (
        <CheckInReceipt
          room={selectedRoom}
          guest={activeGuest}
          maskedKtp={getMaskedKtp(activeGuest.ktpNumber)}
          onConfirm={handleCheckInConfirm}
          onCancel={closeDialog}
        />
      )}

      {/* Check-Out Receipt Modal */}
      {receipt && <Receipt data={receipt} onClose={closeReceipt} onPrint={handlePrint} />}

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};

export default RoomsPage;
