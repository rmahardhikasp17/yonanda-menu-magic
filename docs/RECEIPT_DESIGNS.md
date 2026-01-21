# Desain Template Nota – Hotel Yonanda

## Tujuan

Dokumen ini berisi **spesifikasi template nota universal** Hotel Yonanda untuk thermal printer 58mm. Template bersifat **single source of truth** – semua jenis transaksi menggunakan struktur yang sama.

---

## 📋 Jenis Transaksi

| Prefix | Jenis Transaksi | Jumlah Cetak | Keterangan |
|--------|-----------------|--------------|------------|
| CI- | Check-In | 2x | Tamu & Kasir |
| CO- | Check-Out | 1x | Tamu saja |
| KT- | Kantin Tamu | 2x | Tamu & Kasir |
| KN- | Kantin Non-Tamu | 2x | Tamu & Kasir |

---

## 🧾 Template Nota Universal

```
================================
        HOTEL YONANDA
   Jl. Mayor Soeyoto Km 6
     Jimbaran-Bandungan
       081392506299
--------------------------------
Tanggal : {{DATE}}
Jam     : {{TIME}}
Jenis   : {{TRANSACTION_TYPE}}
--------------------------------
No Nota : {{PREFIX}}-{{RUNNING_NO}}
--------------------------------
{{ROOM_SECTION}}
{{GUEST_SECTION}}
--------------------------------
{{ITEM_LIST}}
--------------------------------
TOTAL   : Rp {{TOTAL_AMOUNT}}
--------------------------------
Bayar   : {{PAYMENT_METHOD}}
--------------------------------
{{NOTES}}
--------------------------------
================================
Developed System by Nekat Digital
================================
```

---

## 📐 Variabel Template

| Variabel | Deskripsi | Contoh |
|----------|-----------|--------|
| `{{DATE}}` | Tanggal transaksi | `22/01/2026` |
| `{{TIME}}` | Jam transaksi | `13:45` |
| `{{TRANSACTION_TYPE}}` | Jenis transaksi | `CHECK-IN`, `CHECK-OUT`, `KANTIN TAMU`, `KANTIN NON-TAMU` |
| `{{PREFIX}}` | Kode prefix | `CI`, `CO`, `KT`, `KN` |
| `{{RUNNING_NO}}` | Nomor urut (4 digit) | `0047` |
| `{{ROOM_SECTION}}` | Info kamar (conditional) | Lihat di bawah |
| `{{GUEST_SECTION}}` | Info tamu (conditional) | Lihat di bawah |
| `{{ITEM_LIST}}` | Daftar item | Lihat di bawah |
| `{{TOTAL_AMOUNT}}` | Total transaksi | `552.000` |
| `{{PAYMENT_METHOD}}` | Metode bayar | `CASH`, `QRIS` |
| `{{NOTES}}` | Catatan penting | `Max Check-out 12.00 WIB` |

---

## 📦 Section Kondisional

### ROOM_SECTION (Jika ada data kamar)
```
No. Kamar : {{ROOM_NUMBER}}
Tipe      : {{ROOM_TYPE}}
Tarif/Mlm : Rp {{ROOM_RATE}}
Durasi    : {{NIGHTS}} malam
```

### GUEST_SECTION (Jika ada data tamu)
```
Nama      : {{GUEST_NAME}}
No. KTP   : {{MASKED_KTP}}
```

### ITEM_LIST (Daftar item/pembelian)
```
{{ITEM_NAME}} x{{QTY}}    Rp {{SUBTOTAL}}
{{ITEM_NAME}} x{{QTY}}    Rp {{SUBTOTAL}}
...
```

---

## 🖨️ Contoh Output Per Transaksi

### 1. Check-In (CI-)
```
================================
        HOTEL YONANDA
   Jl. Mayor Soeyoto Km 6
     Jimbaran-Bandungan
       081392506299
--------------------------------
Tanggal : 22/01/2026
Jam     : 14:30
Jenis   : CHECK-IN
--------------------------------
No Nota : CI-0047
--------------------------------
No. Kamar : 101
Tipe      : Superior
Tarif/Mlm : Rp 250.000
--------------------------------
Nama      : Budi Santoso
No. KTP   : ****5678****
--------------------------------
TOTAL   : Rp 250.000
--------------------------------
Bayar   : CASH
--------------------------------
** Max Check-out 12.00 WIB **
--------------------------------
================================
Developed System by Nekat Digital
================================
```

### 2. Check-Out (CO-)
```
================================
        HOTEL YONANDA
   Jl. Mayor Soeyoto Km 6
     Jimbaran-Bandungan
       081392506299
--------------------------------
Tanggal : 24/01/2026
Jam     : 11:45
Jenis   : CHECK-OUT
--------------------------------
No Nota : CO-0023
--------------------------------
No. Kamar : 101
Tipe      : Superior
Durasi    : 2 malam
Tarif/Mlm : Rp 250.000
--------------------------------
Nama      : Budi Santoso
--------------------------------
Kamar 2 mlm        Rp 500.000
Nasi Goreng x2      Rp 40.000
Es Teh Manis x2     Rp 12.000
--------------------------------
TOTAL   : Rp 552.000
--------------------------------
** Max Check-out 12.00 WIB **
--------------------------------
================================
Developed System by Nekat Digital
================================
```

### 3. Kantin Tamu (KT-)
```
================================
        HOTEL YONANDA
   Jl. Mayor Soeyoto Km 6
     Jimbaran-Bandungan
       081392506299
--------------------------------
Tanggal : 22/01/2026
Jam     : 19:30
Jenis   : KANTIN TAMU
--------------------------------
No Nota : KT-0156
--------------------------------
No. Kamar : 101
--------------------------------
Nasi Goreng x1      Rp 25.000
Mie Goreng x2       Rp 30.000
Es Jeruk x3         Rp 18.000
--------------------------------
TOTAL   : Rp 73.000
--------------------------------
** Max Check-out 12.00 WIB **
--------------------------------
================================
Developed System by Nekat Digital
================================
```

### 4. Kantin Non-Tamu (KN-)
```
================================
        HOTEL YONANDA
   Jl. Mayor Soeyoto Km 6
     Jimbaran-Bandungan
       081392506299
--------------------------------
Tanggal : 22/01/2026
Jam     : 13:45
Jenis   : KANTIN NON-TAMU
--------------------------------
No Nota : KN-0089
--------------------------------
Penyetan Ayam x1    Rp 18.000
Sayur Asem x1       Rp 10.000
Es Teh Manis x2     Rp 12.000
--------------------------------
TOTAL   : Rp 40.000
--------------------------------
Bayar   : QRIS
--------------------------------
** Max Check-out 12.00 WIB **
--------------------------------
================================
Developed System by Nekat Digital
================================
```

---

## ⚙️ Constraint Teknis

| Parameter | Nilai |
|-----------|-------|
| Lebar kertas | 58mm |
| Karakter per baris | 32 |
| Font | Monospaced |
| Encoding | ESC/POS RAW |
| Baud Rate (Serial) | 9600 |
| Chunk Size (Bluetooth) | 20 bytes |

---

## 🔧 ESC/POS Commands

| Command | Hex | Fungsi |
|---------|-----|--------|
| INIT | `1B 40` | Inisialisasi printer |
| LF | `0A` | Line feed |
| ALIGN_CENTER | `1B 61 01` | Rata tengah |
| ALIGN_LEFT | `1B 61 00` | Rata kiri |
| FONT_BOLD | `1B 21 08` | Teks tebal |
| FONT_NORMAL | `1B 21 00` | Teks normal |
| FONT_DOUBLE | `1B 21 30` | Ukuran 2x |

---

## 📝 Catatan

- Template ini adalah **single source of truth**
- Seluruh variasi transaksi dikontrol oleh **data**, bukan desain
- Perbedaan antar transaksi hanya pada prefix kode nota dan data dinamis
- Interval cetak 2 nota = **3 detik** (waktu merobek kertas)

---

*Dokumentasi Hotel Yonanda POS System – Nekat Digital*
