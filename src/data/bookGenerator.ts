import { Book, BookCategory, DataCondition, SortField } from '../types';

export const BOOK_CATEGORIES: BookCategory[] = [
  'Teknologi & Komputer',
  'Sains & Matematika',
  'Sastra & Fiksi',
  'Sejarah & Sosial',
  'Bisnis & Ekonomi',
];

export const COVER_COLOR_PALETTE: { label: string; hex: string }[] = [
  { label: 'Deep Forest Emerald', hex: '#064E3B' },
  { label: 'Emerald Pustaka', hex: '#065F46' },
  { label: 'Navy Akademik', hex: '#1E3A8A' },
  { label: 'Indigo Klasik', hex: '#312E81' },
  { label: 'Crimson Editorial', hex: '#991B1B' },
  { label: 'Amber Gold', hex: '#D97706' },
  { label: 'Forest Sage', hex: '#15803D' },
  { label: 'Ochre Cendekia', hex: '#B45309' },
  { label: 'Royal Slate', hex: '#1F2937' },
  { label: 'Plum Koleksi', hex: '#6B21A8' },
];

const TITLE_PREFIXES_BY_CATEGORY: Record<BookCategory, string[]> = {
  'Teknologi & Komputer': [
    'Algoritma & Struktur Data',
    'Arsitektur Sistem Terdistribusi',
    'Kecerdasan Buatan Modern',
    'Rekayasa Perangkat Lunak',
    'Basis Data Relasional',
    'Komputasi Awan & Mikroservis',
    'Jaringan Komputer Lanjut',
    'Kriptografi & Keamanan Siber',
    'Desain Pola Pemrograman',
    'Pengembangan Aplikasi Web Modern',
    'Sistem Operasi & Kernel',
    'Pembelajaran Mesin Terapan',
  ],
  'Sains & Matematika': [
    'Kalkulus Multivariabel Terapan',
    'Aljabar Linear & Matriks',
    'Matematika Diskrit Komputasional',
    'Fisika Kuantum Modern',
    'Statistika & Probabilitas Lanjut',
    'Kimia Organik Universitas',
    'Biologi Molekuler Sel',
    'Astronomi & Astrofisika',
    'Metode Numerik Rekayasa',
    'Teori Graf & Kombinatorika',
    'Termodinamika Teknik',
  ],
  'Sastra & Fiksi': [
    'Jejak Langkah di Khatulistiwa',
    'Langit Senja di Pelabuhan Lama',
    'Catatan Pustakawan Kota Tua',
    'Kronik Musim Hujan',
    'Antologi Puisi Nusantara',
    'Hikayat Negeri Atas Angin',
    'Surat dari Ruang Baca',
    'Simfoni Dua Masa',
    'Bayang-Bayang Menara Jam',
    'Pengembara Samudra Timur',
    'Seribu Aksara dalam Sunyi',
  ],
  'Sejarah & Sosial': [
    'Sejarah Peradaban Maritim',
    'Sosiologi Masyarakat Digital',
    'Antropologi Budaya Nusantara',
    'Geopolitik Asia Tenggara',
    'Etika & Filsafat Ilmu',
    'Hukum Tata Negara Modern',
    'Dinamika Politik Kontemporer',
    'Arsip Kolonial & Kemerdekaan',
    'Demografi & Pembangunan Kota',
    'Sejarah Pemikiran Pendidikan',
    'Psikologi Sosial Terapan',
  ],
  'Bisnis & Ekonomi': [
    'Ekonomi Makro Nusantara',
    'Manajemen Keuangan Korporat',
    'Strategi Transformasi Digital',
    'Akuntansi Manajerial Lanjut',
    'Kewirausahaan Berbasis Inovasi',
    'Ekonomi Mikro & Pasar Modal',
    'Manajemen Rantai Pasok Global',
    'Analisis Investasi & Portofolio',
    'Pemasaran Strategis Era Data',
    'Ekonomi Syariah & Perbankan',
    'Kepemimpinan Organisasi Modern',
  ],
};

const TOPIC_QUALIFIERS = [
  'Pendekatan Praktis',
  'Studi Kasus Indonesia',
  'Teori & Implementasi',
  'Panduan Akademik',
  'Edisi Revisi',
  'Perspektif Kontemporer',
  'Konsep Fundamental',
  'Analisis Empiris',
  'Model & Simulasi',
  'Integrasi Sistem',
];

const AUTHORS = [
  'Prof. Dr. Budi Santoso',
  'Dr. Ratna Sari Dewi',
  'Andi Wijaya, M.Kom.',
  'Siti Aminah, Ph.D.',
  'Hendro Kusuma, M.Sc.',
  'Dewi Lestari Pratama',
  'Rizky Pratama Putra',
  'Fajar Nugroho, M.T.',
  'Nadia Putri Maharani',
  'Agus Setiawan, Ph.D.',
  'Dr. Wahyu Hidayat',
  'Kartika Wulandari, M.Hum.',
  'Bagus Prakoso, M.B.A.',
  'Lestari Handayani',
  'Irfan Hakim, M.Si.',
  'Taufik Ramadhan',
  'Melati Kusumawati',
  'Dimas Aditya Saputra',
  'Rina Marlina, M.Pd.',
  'Yoga Permana, S.T., M.T.',
  'Dr. Surya Dharma',
  'Anisa Rahmawati',
  'Arif Rahman Hakim',
  'Farah Diba Azhari',
  'Galih Pratama',
  'Hana Salsabila',
  'Ilham Mahendra',
  'Joko Susilo, M.Kom.',
  'Kurnia Wicaksono',
  'Laila Fitriani',
  'Maulana Yusuf',
  'Naufal Akbar',
  'Oktavia Ningrum',
  'Pandu Winata',
  'Qori Azzahra',
  'Reza Pahlevi',
  'Sinta Dewi Astuti',
  'Teguh Santosa',
  'Umar Faruq',
  'Vina Octaviani',
  'Wibowo Laksono',
  'Yulia Anggraini',
  'Zainal Abidin',
  'Robert C. Martin',
  'Thomas H. Cormen',
];

const PUBLISHERS = [
  'Pustaka Akademika',
  'Gramedia Pustaka Utama',
  'ITB Press',
  'UGM Press',
  'UI Publishing',
  'Informatika Bandung',
  'Erlangga Cendekia',
  'Kompas Media Nusantara',
  'Mizan Pustaka',
  'Andi Publisher Yogyakarta',
  'MIT Press International',
  'Addison-Wesley Academic',
];

function createSeededRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getRackLetterForCategory(category: BookCategory): string {
  switch (category) {
    case 'Teknologi & Komputer':
      return 'A';
    case 'Sains & Matematika':
      return 'B';
    case 'Sastra & Fiksi':
      return 'C';
    case 'Sejarah & Sosial':
      return 'D';
    case 'Bisnis & Ekonomi':
      return 'E';
  }
}

/**
 * Generates `count` (1.000, 5.000, 10.000, etc.) realistic Book records
 * with 100% unique IDs, ISBN-13s ("978-602-XXXXXXX"), and titles in < 100ms.
 */
export function generateBooks(count: number, seed: number = 20261122): Book[] {
  const rng = createSeededRng(seed);
  const books: Book[] = new Array(count);
  const baseTimestamp = Date.UTC(2026, 0, 1, 8, 0, 0);

  for (let i = 0; i < count; i += 1) {
    const num = i + 1;
    const serial4 = String(num).padStart(4, '0');
    const isbnSuffix = String(num).padStart(7, '0');
    const category = BOOK_CATEGORIES[i % BOOK_CATEGORIES.length];
    const prefixes = TITLE_PREFIXES_BY_CATEGORY[category];
    const prefix = prefixes[Math.floor(rng() * prefixes.length)];
    const qualifier = TOPIC_QUALIFIERS[Math.floor(rng() * TOPIC_QUALIFIERS.length)];
    const author = AUTHORS[Math.floor(rng() * AUTHORS.length)];
    const publisher = PUBLISHERS[Math.floor(rng() * PUBLISHERS.length)];
    const year = 1995 + Math.floor(rng() * 32); // 1995..2026
    const stokTotal = 2 + Math.floor(rng() * 14); // 2..15 (ensures headroom for initial loans)
    const rackLetter = getRackLetterForCategory(category);
    const rackSlot = String((Math.floor(i / 5) % 20) + 1).padStart(2, '0');
    const color = COVER_COLOR_PALETTE[i % COVER_COLOR_PALETTE.length].hex;

    books[i] = {
      id: `BK-${serial4}`,
      isbn: `978-602-${isbnSuffix}`,
      judul: `${prefix}: ${qualifier} (Vol. ${serial4})`,
      penulis: author,
      penerbit: publisher,
      tahunTerbit: year,
      kategori: category,
      kodeRak: `RAK-${rackLetter}${rackSlot}`,
      stokTotal,
      stokTersedia: stokTotal,
      coverColor: color,
      deskripsi: `Buku rujukan ${category.toLowerCase()} seri ${serial4} tentang ${prefix.toLowerCase()} dengan pendekatan ${qualifier.toLowerCase()}.`,
      createdAt: new Date(baseTimestamp + i * 60000).toISOString(),
    };
  }

  // Deterministic Fisher-Yates shuffle so initial catalog & random benchmark start unsorted
  for (let i = books.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = books[i];
    books[i] = books[j];
    books[j] = tmp;
  }

  return books;
}

function compareFieldAsc(a: Book, b: Book, field: SortField): number {
  let cmp = 0;
  if (field === 'judul') {
    const av = a.judul.toLowerCase();
    const bv = b.judul.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'penulis') {
    const av = a.penulis.toLowerCase();
    const bv = b.penulis.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'isbn') {
    const av = a.isbn.toLowerCase();
    const bv = b.isbn.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'tahunTerbit') {
    cmp = a.tahunTerbit - b.tahunTerbit;
  } else {
    cmp = a.stokTersedia - b.stokTersedia;
  }
  if (cmp !== 0) return cmp;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Prepares a copy of `books` according to the requested benchmark data condition:
 * - 'random': Fisher-Yates shuffled (Average Case)
 * - 'reversed': Sorted descending by `field` (Worst Case for ascending Insertion Sort)
 * - 'nearly_sorted': Sorted ascending with ~2% local swaps (Best Case for Insertion Sort)
 */
export function prepareDatasetByCondition(
  books: readonly Book[],
  condition: DataCondition,
  field: SortField = 'judul',
  seed: number = 99911,
): Book[] {
  const copy = books.map((b) => ({ ...b }));
  const rng = createSeededRng(seed + copy.length);

  if (condition === 'random') {
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  // Merge sort in pure JS without Array.prototype.sort()
  const mergeSortAsc = (arr: Book[]): Book[] => {
    if (arr.length <= 1) return arr;
    const mid = Math.floor(arr.length / 2);
    const left = mergeSortAsc(arr.slice(0, mid));
    const right = mergeSortAsc(arr.slice(mid));
    const merged: Book[] = new Array(left.length + right.length);
    let i = 0;
    let j = 0;
    let k = 0;
    while (i < left.length && j < right.length) {
      if (compareFieldAsc(left[i], right[j], field) <= 0) {
        merged[k++] = left[i++];
      } else {
        merged[k++] = right[j++];
      }
    }
    while (i < left.length) merged[k++] = left[i++];
    while (j < right.length) merged[k++] = right[j++];
    return merged;
  };

  const sortedAsc = mergeSortAsc(copy);

  if (condition === 'reversed') {
    const reversed: Book[] = new Array(sortedAsc.length);
    for (let i = 0; i < sortedAsc.length; i += 1) {
      reversed[i] = sortedAsc[sortedAsc.length - 1 - i];
    }
    return reversed;
  }

  // 'nearly_sorted': ~2% small adjacent swaps
  const swapCount = Math.max(1, Math.floor(sortedAsc.length * 0.02));
  for (let s = 0; s < swapCount; s += 1) {
    const idx = Math.floor(rng() * Math.max(1, sortedAsc.length - 1));
    const tmp = sortedAsc[idx];
    sortedAsc[idx] = sortedAsc[idx + 1];
    sortedAsc[idx + 1] = tmp;
  }
  return sortedAsc;
}
