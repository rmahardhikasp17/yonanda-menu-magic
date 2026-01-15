import { useState } from 'react';
import { useMenu } from '@/hooks/useMenu';
import { MenuItem, MenuCategory } from '@/types/hotel';
import { menuCategories } from '@/data/menuData';
import { formatCurrency } from '@/data/roomData';
import { PageHeader } from '@/components/PageHeader';
import { CategoryCard } from '@/components/CategoryCard';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RoomManagement } from '@/components/RoomManagement';

const AdminPage = () => {
  const { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, resetMenu, getMenuByCategory } = useMenu();
  const { toast } = useToast();

  const [selectedCategory, setSelectedCategory] = useState<MenuCategory>('nasi-goreng');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formPrice, setFormPrice] = useState('');

  const categoryItems = getMenuByCategory(selectedCategory);

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormPrice(item.price.toString());
    setIsAdding(false);
  };

  const openAdd = () => {
    setEditingItem(null);
    setFormName('');
    setFormPrice('');
    setIsAdding(true);
  };

  const closeDialog = () => {
    setEditingItem(null);
    setIsAdding(false);
    setFormName('');
    setFormPrice('');
  };

  const handleSave = () => {
    const price = parseInt(formPrice, 10);
    if (!formName.trim() || isNaN(price) || price <= 0) {
      toast({
        title: 'Error',
        description: 'Nama dan harga harus diisi dengan benar',
        variant: 'destructive',
      });
      return;
    }

    if (isAdding) {
      addMenuItem({
        name: formName.trim(),
        price,
        category: selectedCategory,
      });
      toast({
        title: 'Berhasil',
        description: 'Menu baru ditambahkan',
      });
    } else if (editingItem) {
      updateMenuItem(editingItem.id, {
        name: formName.trim(),
        price,
      });
      toast({
        title: 'Berhasil',
        description: 'Menu diperbarui',
      });
    }
    closeDialog();
  };

  const handleDelete = (item: MenuItem) => {
    if (confirm(`Hapus menu "${item.name}"?`)) {
      deleteMenuItem(item.id);
      toast({
        title: 'Berhasil',
        description: 'Menu dihapus',
      });
    }
  };

  const handleReset = () => {
    if (confirm('Reset semua menu ke default? Data perubahan akan hilang.')) {
      resetMenu();
      toast({
        title: 'Berhasil',
        description: 'Menu dikembalikan ke default',
      });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <PageHeader
        title="Admin Menu"
        subtitle="Kelola daftar dan harga menu"
        rightContent={
          <Button variant="outline" onClick={handleReset} className="touch-button">
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
        }
      />

      <main className="container px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Left: Categories */}
          <div>
            <h3 className="mb-3 font-semibold">Kategori</h3>
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
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

          {/* Right: Menu Items */}
          <div className="lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">
                {menuCategories.find((c) => c.id === selectedCategory)?.label}
              </h3>
              <Button onClick={openAdd} className="touch-button">
                <Plus className="mr-2 h-4 w-4" />
                Tambah Menu
              </Button>
            </div>

            <div className="space-y-2">
              {categoryItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center">
                  <p className="text-muted-foreground">Belum ada menu di kategori ini</p>
                </div>
              ) : (
                categoryItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between rounded-xl border bg-card p-4"
                  >
                    <div>
                      <p className="font-medium text-card-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatCurrency(item.price)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="touch-button h-10 w-10"
                        onClick={() => openEdit(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="touch-button h-10 w-10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleDelete(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-8 border-t-2 border-border" />

        {/* Room Management Section */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <span className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
              🛏️
            </span>
            Kelola Kamar Hotel
          </h2>
          <RoomManagement onBack={() => { }} />
        </div>
      </main>

      {/* Edit/Add Dialog */}
      <Dialog open={isAdding || !!editingItem} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAdding ? 'Tambah Menu Baru' : 'Edit Menu'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Nama Menu</label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Masukkan nama menu"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Harga (Rp)</label>
              <Input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="Masukkan harga"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Batal
            </Button>
            <Button onClick={handleSave}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};

export default AdminPage;
