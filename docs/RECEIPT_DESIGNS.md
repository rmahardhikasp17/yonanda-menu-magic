# Desain Nota Thermal Printer 58mm

Dokumentasi format nota untuk semua jenis transaksi di Hotel Yonanda POS System.

---

## 📋 Jenis Nota

| Jenis | Prefix | Jumlah Cetak | Keterangan |
|-------|--------|--------------|------------|
| Check-In | CI- | 2x | Tamu & Kasir |
| Check-Out | CO- | 1x | Tamu saja |
| Kantin Tamu | KT- | 2x | Tamu & Kasir |
| Kantin Non-Tamu | KN- | 2x | Tamu & Kasir |

---

## 🧾 Format Nota Check-In (CI-)

```
================================
       HOTEL YONANDA
       Terima Kasih Atas
       Kunjungan Anda
--------------------------------
Tanggal          22/01/2026
Jam                     00:05
Jenis               CHECK-IN
--------------------------------
        No: CI-0047
--------------------------------
         DATA KAMAR
No. Kamar                  101
Tipe                  Superior
Tarif/Mlm           Rp 250.000
--------------------------------
          DATA TAMU
Nama                Budi Santoso
No. KTP           ****5678****
--------------------------------
Bayar                    CASH
--------------------------------
     ** PENTING **
   Max Check-out 12.00 WIB
--------------------------------
================================
    Developed System by
      Nekat Digital
================================
```

---

## 🧾 Format Nota Check-Out (CO-)

```
================================
       HOTEL YONANDA
       Terima Kasih Atas
       Kunjungan Anda
--------------------------------
Tanggal          22/01/2026
Jam                     12:00
Jenis              CHECK-OUT
--------------------------------
        No: CO-0023
--------------------------------
No. Kamar                  101
Tamu             Budi Santoso
Tipe                  Superior
Durasi               2 malam
Tarif/Mlm           Rp 250.000
--------------------------------
Kamar 2 mlm         Rp 500.000
Nasi Goreng x2       Rp 40.000
Es Teh Manis x2      Rp 12.000
--------------------------------
TOTAL               Rp 552.000
--------------------------------
     ** PENTING **
   Max Check-out 12.00 WIB
--------------------------------
================================
    Developed System by
      Nekat Digital
================================
```

---

## 🧾 Format Nota Kantin Tamu (KT-)

```
================================
       HOTEL YONANDA
       Terima Kasih Atas
       Kunjungan Anda
--------------------------------
Tanggal          22/01/2026
Jam                     19:30
Jenis            KANTIN TAMU
--------------------------------
        No: KT-0156
--------------------------------
Kamar                      101
--------------------------------
Nasi Goreng Spesial  Rp 25.000
Mie Goreng x2        Rp 30.000
Es Jeruk x3          Rp 18.000
--------------------------------
TOTAL                Rp 73.000
--------------------------------
     ** PENTING **
   Max Check-out 12.00 WIB
--------------------------------
================================
    Developed System by
      Nekat Digital
================================
```

---

## 🧾 Format Nota Kantin Non-Tamu (KN-)

```
================================
       HOTEL YONANDA
       Terima Kasih Atas
       Kunjungan Anda
--------------------------------
Tanggal          22/01/2026
Jam                     13:45
Jenis        KANTIN NON-TAMU
--------------------------------
        No: KN-0089
--------------------------------
Penyetan Ayam        Rp 18.000
Sayur Asem           Rp 10.000
Es Teh Manis x2      Rp 12.000
--------------------------------
TOTAL                Rp 40.000
Bayar                    QRIS
--------------------------------
     ** PENTING **
   Max Check-out 12.00 WIB
--------------------------------
================================
    Developed System by
      Nekat Digital
================================
```

---

## ⚙️ Pengaturan Pencetakan

### Mode Printer

| Mode | Perangkat | Setup | Dialog |
|------|-----------|-------|--------|
| COM Port (Serial) | Desktop/PC | Sekali | Tidak ada |
| Bluetooth | Android/Tablet | Sekali | Tidak ada |
| Browser | Semua | Tidak perlu | Setiap cetak |

### Cara Setup Printer

1. Buka **Owner Menu** (ikon Settings di Dashboard)
2. Masukkan PIN (default: `0000`)
3. Pilih **"Pengaturan Printer"**
4. Pilih mode (COM Port / Bluetooth)
5. Klik **"Setup"** dan pilih printer
6. Selesai! Selanjutnya langsung cetak tanpa dialog.

### Interval Cetak 2 Nota

- **Jeda 3 detik** antara nota 1 dan nota 2
- Memberikan waktu kasir untuk merobek kertas

---

## 📐 Spesifikasi Printer

- **Lebar kertas**: 58mm
- **Karakter per baris**: 32 karakter
- **Encoding**: ESC/POS RAW
- **Baud Rate**: 9600 (untuk Serial)
- **Chunk Size**: 20 bytes (untuk Bluetooth)

---

## 🔧 ESC/POS Commands

| Command | Hex | Fungsi |
|---------|-----|--------|
| INIT | `1B 40` | Inisialisasi printer |
| LF | `0A` | Line feed (ganti baris) |
| ALIGN_CENTER | `1B 61 01` | Rata tengah |
| ALIGN_LEFT | `1B 61 00` | Rata kiri |
| FONT_BOLD | `1B 21 08` | Teks tebal |
| FONT_NORMAL | `1B 21 00` | Teks normal |
| FONT_DOUBLE | `1B 21 30` | Ukuran 2x |

---

*Dokumentasi ini dibuat untuk referensi desain nota Hotel Yonanda POS System.*
