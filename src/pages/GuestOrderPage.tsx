import { useState } from 'react';
import { useRooms } from '@/hooks/useRooms';
import { useMenu } from '@/hooks/useMenu';
import { useOrder } from '@/hooks/useOrder';
import { MenuCategory, ReceiptData } from '@/types/hotel';
import { menuCategories } from '@/data/menuData';
import { PageHeader } from '@/components/PageHeader';
import { CategoryCard } from '@/components/CategoryCard';
import { MenuItemCard } from '@/components/MenuItemCard';
import { OrderSummary } from '@/components/OrderSummary';
import { Receipt } from '@/components/Receipt';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const GuestOrderPage = () => {
  const { getOccupiedRooms } = useRooms();
  const { getMenuByCategory } = useMenu();
  const { orderItems, addItem, removeItem, clearOrder, getTotal, getItemQuantity } = useOrder();
  
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('nasi-goreng');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const occupiedRooms = getOccupiedRooms();
  const menuItems = getMenuByCategory(selectedCategory);

  const handleCheckout = () => {
    if (!selectedRoom || orderItems.length === 0) return;

    setReceipt({
      hotelName: 'Hotel Yonanda',
      timestamp: new Date().toISOString(),
      roomNumber: selectedRoom,
      items: orderItems.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        subtotal: item.menuItem.price * item.quantity,
      })),
      total: getTotal(),
      type: 'canteen-guest',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceipt(null);
    clearOrder();
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Pesanan Tamu Hotel"
        subtitle="Pesanan kantin dengan nomor kamar"
      />

      <main className="container px-4 py-6">
        {/* Step 1: Select Room */}
        {!selectedRoom ? (
          <div>
            <h2 className="mb-4 text-lg font-semibold">Pilih Kamar Tamu</h2>
            {occupiedRooms.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                <p className="text-muted-foreground">Tidak ada kamar yang terisi</p>
                <p className="text-sm text-muted-foreground">
                  Silakan check-in tamu terlebih dahulu
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
                {occupiedRooms.map((room) => (
                  <Button
                    key={room.number}
                    variant="outline"
                    className={cn(
                      'touch-card h-20 flex-col gap-1 border-2',
                      'hover:border-primary hover:bg-primary/5'
                    )}
                    onClick={() => setSelectedRoom(room.number)}
                  >
                    <span className="text-xl font-bold">{room.number}</span>
                    {room.guestName && (
                      <span className="text-xs text-muted-foreground truncate max-w-full">
                        {room.guestName}
                      </span>
                    )}
                  </Button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left: Menu Selection */}
            <div className="lg:col-span-2 space-y-6">
              {/* Room indicator + change button */}
              <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
                <div>
                  <span className="text-sm text-muted-foreground">Pesanan untuk:</span>
                  <p className="text-xl font-bold text-primary">Kamar {selectedRoom}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRoom(null);
                    clearOrder();
                  }}
                >
                  Ganti Kamar
                </Button>
              </div>

              {/* Categories */}
              <div>
                <h3 className="mb-3 font-semibold">Kategori Menu</h3>
                <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                  {menuCategories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      isSelected={selectedCategory === category.id}
                      onClick={() => setSelectedCategory(category.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Menu Items */}
              <div>
                <h3 className="mb-3 font-semibold">
                  {menuCategories.find((c) => c.id === selectedCategory)?.label}
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  {menuItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      quantity={getItemQuantity(item.id)}
                      onAdd={() => addItem(item)}
                      onRemove={() => removeItem(item.id)}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:sticky lg:top-20 lg:self-start">
              <OrderSummary
                items={orderItems}
                total={getTotal()}
                onClear={clearOrder}
                onCheckout={handleCheckout}
                roomNumber={selectedRoom}
              />
            </div>
          </div>
        )}
      </main>

      {/* Receipt Modal */}
      {receipt && (
        <Receipt data={receipt} onClose={closeReceipt} onPrint={handlePrint} />
      )}
    </div>
  );
};

export default GuestOrderPage;
