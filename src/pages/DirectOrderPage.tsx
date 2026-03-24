import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { useOrder } from '@/hooks/useOrder';
import { useReceiptCounter } from '@/hooks/useReceiptCounter';
import { MenuCategory, ReceiptData } from '@/types/hotel';
import { menuCategories } from '@/data/menuData';
import { PageHeader } from '@/components/PageHeader';
import { CategoryCard } from '@/components/CategoryCard';
import { MenuItemCard } from '@/components/MenuItemCard';
import { OrderSummary } from '@/components/OrderSummary';
import { Receipt } from '@/components/Receipt';
import { Footer } from '@/components/Footer';

const DirectOrderPage = () => {
  const { getMenuByCategory } = useMenu();
  const { orderItems, addItem, removeItem, clearOrder, getTotal, getItemQuantity } = useOrder();
  const { getNextReceiptNumber } = useReceiptCounter();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('nasi-goreng');
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  const menuItems = getMenuByCategory(selectedCategory);

  const handleCheckout = async () => {
    if (orderItems.length === 0) return;

    // Generate sequential receipt number for non-guest canteen orders
    const receiptNumber = await getNextReceiptNumber('kantin_nontamu');

    setReceipt({
      receiptNumber,
      hotelName: 'Hotel Yonanda',
      timestamp: new Date().toISOString(),
      items: orderItems.map((item) => ({
        name: item.menuItem.name,
        quantity: item.quantity,
        price: item.menuItem.price,
        subtotal: item.menuItem.price * item.quantity,
      })),
      total: getTotal(),
      type: 'canteen-direct',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const closeReceipt = () => {
    setReceipt(null);
    clearOrder();
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Pesanan Langsung"
        subtitle="Pesanan non-tamu, langsung bayar"
      />

      <main className="container px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Menu Selection */}
          <div className="lg:col-span-2 space-y-6">
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
            />
          </div>
        </div>
      </main>

      {/* Receipt Modal */}
      {receipt && (
        <Receipt data={receipt} onClose={closeReceipt} onPrint={handlePrint} />
      )}

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};

export default DirectOrderPage;
