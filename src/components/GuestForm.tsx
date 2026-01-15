import { useState } from 'react';
import { ActiveGuest } from '@/types/hotel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface GuestFormProps {
  onSubmit: (guest: ActiveGuest) => void;
  onCancel: () => void;
}

export function GuestForm({ onSubmit, onCancel }: GuestFormProps) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [ktpNumber, setKtpNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nama tamu wajib diisi';
    }
    if (!address.trim()) {
      newErrors.address = 'Alamat wajib diisi';
    }
    if (!ktpNumber.trim()) {
      newErrors.ktpNumber = 'No KTP wajib diisi';
    } else if (!/^\d{16}$/.test(ktpNumber.replace(/\s/g, ''))) {
      newErrors.ktpNumber = 'No KTP harus 16 digit angka';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        name: name.trim(),
        address: address.trim(),
        ktpNumber: ktpNumber.replace(/\s/g, ''),
        phoneNumber: phoneNumber.trim() || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-primary/5 p-4">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Data Tamu Baru</h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium">
              Nama Tamu <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Masukkan nama lengkap"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium">
              Alamat <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Masukkan alamat lengkap"
              className={errors.address ? 'border-destructive' : ''}
            />
            {errors.address && (
              <p className="mt-1 text-xs text-destructive">{errors.address}</p>
            )}
          </div>

          <div>
            <Label htmlFor="ktp" className="text-sm font-medium">
              No KTP <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ktp"
              value={ktpNumber}
              onChange={(e) => setKtpNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="16 digit nomor KTP"
              className={errors.ktpNumber ? 'border-destructive' : ''}
              maxLength={16}
            />
            {errors.ktpNumber && (
              <p className="mt-1 text-xs text-destructive">{errors.ktpNumber}</p>
            )}
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium">
              No HP <span className="text-muted-foreground">(opsional)</span>
            </Label>
            <Input
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Masukkan nomor HP"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Batal
        </Button>
        <Button type="submit" className="flex-1">
          Lanjut Check-In
        </Button>
      </div>
    </form>
  );
}
