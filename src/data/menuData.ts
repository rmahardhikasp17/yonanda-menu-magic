import { MenuItem, MenuCategoryInfo } from '@/types/hotel';

export const menuCategories: MenuCategoryInfo[] = [
  { id: 'nasi-goreng', label: 'Aneka Nasi Goreng', icon: '🍚' },
  { id: 'gorengan', label: 'Aneka Gorengan', icon: '🍟' },
  { id: 'penyetan', label: 'Aneka Penyetan', icon: '🍗' },
  { id: 'sambal', label: 'Aneka Sambel', icon: '🌶️' },
  { id: 'sayur', label: 'Aneka Sayur', icon: '🥗' },
  { id: 'mie', label: 'Aneka Mie', icon: '🍜' },
  { id: 'minuman', label: 'Aneka Minuman', icon: '☕' },
  { id: 'jus', label: 'Aneka Jus', icon: '🧃' },
];

export const defaultMenuItems: MenuItem[] = [
  // Nasi Goreng
  { id: 'ng-1', name: 'Nasi Putih', price: 5000, category: 'nasi-goreng' },
  { id: 'ng-2', name: 'Nasgor Ayam', price: 16000, category: 'nasi-goreng' },
  { id: 'ng-3', name: 'Nasgor Baso', price: 16000, category: 'nasi-goreng' },
  { id: 'ng-4', name: 'Nasgor Sosis', price: 16000, category: 'nasi-goreng' },
  { id: 'ng-5', name: 'Nasgor Babat', price: 20000, category: 'nasi-goreng' },
  { id: 'ng-6', name: 'Nasgor Udang', price: 25000, category: 'nasi-goreng' },
  { id: 'ng-7', name: 'Nasgor Seafood', price: 25000, category: 'nasi-goreng' },
  { id: 'ng-8', name: 'Nasgor Telor', price: 14000, category: 'nasi-goreng' },
  { id: 'ng-9', name: 'Nasgor Special', price: 20000, category: 'nasi-goreng' },

  // Gorengan
  { id: 'gr-1', name: 'Mendoan', price: 10000, category: 'gorengan' },
  { id: 'gr-2', name: 'Bakwan', price: 10000, category: 'gorengan' },
  { id: 'gr-3', name: 'Tahu / Tempe Goreng', price: 10000, category: 'gorengan' },
  { id: 'gr-4', name: 'Sosis / Nugget Goreng', price: 15000, category: 'gorengan' },
  { id: 'gr-5', name: 'Kentang Goreng', price: 12000, category: 'gorengan' },
  { id: 'gr-6', name: 'Pisang Goreng', price: 10000, category: 'gorengan' },
  { id: 'gr-7', name: 'Pisang Keju', price: 12000, category: 'gorengan' },
  { id: 'gr-8', name: 'Omlet Mie', price: 15000, category: 'gorengan' },

  // Penyetan
  { id: 'py-1', name: 'Ayam Goreng Paha Bawah', price: 9000, category: 'penyetan' },
  { id: 'py-2', name: 'Ayam Goreng Paha Atas', price: 10000, category: 'penyetan' },
  { id: 'py-3', name: 'Ayam Goreng Sayap', price: 7000, category: 'penyetan' },
  { id: 'py-4', name: 'Ikan Goreng Nila / Mujahir', price: 13000, category: 'penyetan' },
  { id: 'py-5', name: 'Ayam Goreng Krispy Paha Bawah', price: 10000, category: 'penyetan' },
  { id: 'py-6', name: 'Ayam Goreng Krispy Paha Atas', price: 12000, category: 'penyetan' },
  { id: 'py-7', name: 'Ayam Goreng Krispy Sayap', price: 8000, category: 'penyetan' },
  { id: 'py-8', name: 'Ayam Goreng Jawa', price: 25000, category: 'penyetan' },
  { id: 'py-9', name: 'Tempe / Tahu Penyet', price: 8000, category: 'penyetan' },
  { id: 'py-10', name: 'Telor Ceplok / Dadar', price: 8000, category: 'penyetan' },

  // Sambal
  { id: 'sb-1', name: 'Sambel Bawang', price: 4000, category: 'sambal' },
  { id: 'sb-2', name: 'Sambel Terasi Mateng', price: 4000, category: 'sambal' },
  { id: 'sb-3', name: 'Sambel Tempe', price: 5000, category: 'sambal' },
  { id: 'sb-4', name: 'Sambel Terong', price: 5000, category: 'sambal' },
  { id: 'sb-5', name: 'Sambel Teri', price: 5000, category: 'sambal' },

  // Sayur
  { id: 'sy-1', name: 'Sop Sayuran', price: 12000, category: 'sayur' },
  { id: 'sy-2', name: 'Sop Ayam', price: 16000, category: 'sayur' },
  { id: 'sy-3', name: 'Sop Baso', price: 16000, category: 'sayur' },
  { id: 'sy-4', name: 'Sop Sosis', price: 16000, category: 'sayur' },
  { id: 'sy-5', name: 'Sop Lengkap', price: 18000, category: 'sayur' },
  { id: 'sy-6', name: 'Tumis Sawi', price: 16000, category: 'sayur' },
  { id: 'sy-7', name: 'Ca Sawi', price: 16000, category: 'sayur' },
  { id: 'sy-8', name: 'Cap Cay', price: 20000, category: 'sayur' },

  // Mie
  { id: 'mi-1', name: 'Mie Goreng / Kuah Jawa', price: 18000, category: 'mie' },
  { id: 'mi-2', name: 'Indomie Rebus / Goreng', price: 13000, category: 'mie' },
  { id: 'mi-3', name: 'Bihun Goreng / Kuah', price: 17000, category: 'mie' },
  { id: 'mi-4', name: 'Kwetiau Goreng / Kuah', price: 17000, category: 'mie' },

  // Minuman
  { id: 'mn-1', name: 'Teh / Kopi Hitam', price: 5000, category: 'minuman' },
  { id: 'mn-2', name: 'Kopi Susu', price: 5000, category: 'minuman' },
  { id: 'mn-3', name: 'Kopi ABC', price: 6000, category: 'minuman' },
  { id: 'mn-4', name: 'Kopi Good Day', price: 5000, category: 'minuman' },
  { id: 'mn-5', name: 'Coffee Mix / White', price: 5000, category: 'minuman' },
  { id: 'mn-6', name: 'Susu Putih / Coklat', price: 5000, category: 'minuman' },
  { id: 'mn-7', name: 'Susu Jahe', price: 6000, category: 'minuman' },
  { id: 'mn-8', name: 'Jeruk', price: 5000, category: 'minuman' },
  { id: 'mn-9', name: 'Wedang Jahe', price: 5000, category: 'minuman' },

  // Jus
  { id: 'js-1', name: 'Jus Jambu', price: 8000, category: 'jus' },
  { id: 'js-2', name: 'Jus Mangga', price: 8000, category: 'jus' },
  { id: 'js-3', name: 'Jus Tomat', price: 8000, category: 'jus' },
  { id: 'js-4', name: 'Jus Alpukat', price: 15000, category: 'jus' },
  { id: 'js-5', name: 'Jus Wortel', price: 8000, category: 'jus' },
  { id: 'js-6', name: 'Jus Mix Tomat Wortel', price: 12000, category: 'jus' },
  { id: 'js-7', name: 'Air Putih', price: 3000, category: 'jus' },
];

export function getMenuByCategory(items: MenuItem[], categoryId: string): MenuItem[] {
  return items.filter((item) => item.category === categoryId);
}
