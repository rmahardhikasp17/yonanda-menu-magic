import { useNavigate } from 'react-router-dom';
import { DashboardCard } from '@/components/DashboardCard';
import { Footer } from '@/components/Footer';
import { BedDouble, UtensilsCrossed, Wallet, Settings } from 'lucide-react';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header with Logo */}
      <header className="border-b bg-card shadow-sm">
        <div className="container flex flex-col items-center justify-center px-4 py-6">
          <img
            src="/logo.png"
            alt="Hotel Yonanda"
            className="mb-3 h-24 w-24 object-contain"
          />
          <h1 className="text-3xl font-bold text-foreground">Hotel Yonanda</h1>
          <p className="text-muted-foreground">Jimbaran - Bandungan</p>
          <p className="mt-1 text-sm text-muted-foreground">Sistem Kasir Operasional</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            title="Kamar Hotel"
            description="Kelola status kamar"
            icon={BedDouble}
            colorClass="bg-category-room"
            onClick={() => navigate('/rooms')}
          />
          <DashboardCard
            title="Pesanan Tamu"
            description="Pesanan kantin untuk tamu hotel"
            icon={UtensilsCrossed}
            colorClass="bg-category-guest"
            onClick={() => navigate('/guest-order')}
          />
          <DashboardCard
            title="Pesanan Langsung"
            description="Pesanan non-tamu, langsung bayar"
            icon={Wallet}
            colorClass="bg-category-direct"
            onClick={() => navigate('/direct-order')}
          />
          <DashboardCard
            title="Admin Menu"
            description="Kelola daftar dan harga menu"
            icon={Settings}
            colorClass="bg-category-admin"
            onClick={() => navigate('/admin')}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-8 rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">Informasi</h2>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-lg bg-muted p-4">
              <p className="text-muted-foreground">Total Kamar</p>
              <p className="text-2xl font-bold text-foreground">43</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-muted-foreground">Tipe Kamar</p>
              <p className="text-2xl font-bold text-foreground">5</p>
            </div>
            <div className="rounded-lg bg-muted p-4">
              <p className="text-muted-foreground">Kategori Menu</p>
              <p className="text-2xl font-bold text-foreground">8</p>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6 rounded-lg bg-hotel-warning/10 p-4 text-sm">
          <p className="font-medium text-hotel-warning">Catatan Penting:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-muted-foreground">
            <li>Maksimal check-out jam 12.00 WIB</li>
            <li>Transaksi tidak disimpan setelah nota dicetak</li>
            <li>Data menu dan status kamar tersimpan di perangkat ini</li>
          </ul>
        </div>
      </main>

      {/* Footer Branding */}
      <Footer />
    </div>
  );
};

export default Dashboard;
