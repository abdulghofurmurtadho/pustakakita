export type BookCategory =
  | 'Teknologi & Komputer'
  | 'Sains & Matematika'
  | 'Sastra & Fiksi'
  | 'Sejarah & Sosial'
  | 'Bisnis & Ekonomi';

export interface Book {
  id: string;             // Format: "BK-XXXX" (Unique String)
  isbn: string;           // Unik, 10 atau 13 digit numerik (e.g. "978-602-0000001")
  judul: string;          // Judul buku unik
  penulis: string;        // Nama penulis
  penerbit: string;       // Nama penerbit
  tahunTerbit: number;    // Tahun terbit (1900 - Tahun Berjalan)
  kategori: BookCategory; // Kategori koleksi
  kodeRak: string;        // Format lokasi rak: "RAK-A01" s/d "RAK-E20"
  stokTotal: number;      // Total eksemplar fisik
  stokTersedia: number;   // Eksemplar yang tersedia di rak (0 <= stokTersedia <= stokTotal)
  coverColor: string;     // Kode Hex warna sampul
  deskripsi: string;      // Sinopsis/Deskripsi singkat
  createdAt: string;      // ISO Date String
}

export interface LoanRecord {
  id: string;                  // Format: "LN-XXXX"
  bookId: string;              // Foreign Key ke Book.id
  judulBuku: string;           // Snapshot judul buku saat peminjaman
  isbnBuku: string;            // Snapshot ISBN
  namaPeminjam: string;        // Nama anggota/mahasiswa
  nimAnggota: string;          // Nomor Induk Mahasiswa/Anggota
  tanggalPinjam: string;       // YYYY-MM-DD
  tenggatKembali: string;      // YYYY-MM-DD (tanggalPinjam + 7 Hari)
  tanggalDikembalikan: string | null; // YYYY-MM-DD atau null jika belum kembali
  status: 'Dipinjam' | 'Dikembalikan';
  denda: number;               // Rp 2.000 per hari keterlambatan
}

export type SortField = 'judul' | 'tahunTerbit' | 'stokTersedia' | 'penulis' | 'isbn';
export type SortOrder = 'asc' | 'desc';
export type SearchAlgorithmType = 'linear' | 'binary';
export type SortAlgorithmType = 'quick' | 'merge' | 'insertion';

export type BenchmarkScale = 1000 | 5000 | 10000;
export type DataCondition = 'random' | 'reversed' | 'nearly_sorted';
export type SearchPositionScenario = 'start' | 'middle' | 'end' | 'not_found';

export interface AlgorithmMetrics {
  algorithmName: string;
  executionTimeMs: number;
  comparisonsCount: number;
  swapsCount?: number;
  itemCount: number;
}

export type ViewRoute =
  | '/'
  | '/katalog'
  | '/inventaris'
  | '/sirkulasi'
  | '/benchmark'
  | '/pengaturan';

export interface SearchStep {
  step: number;
  left?: number;
  right?: number;
  low?: number;
  high?: number;
  mid: number;
  value: string;
  matched: boolean;
  direction?: 'left' | 'right' | 'found';
}

export interface SearchBenchmarkResult {
  algorithm: SearchAlgorithmType;
  algorithmName: string;
  query: string;
  foundIndex: number;
  matchedBooks: Book[];
  visitedIndices: number[];
  steps: SearchStep[];
  comparisons: number;
  comparisonsCount: number;
  executionTimeMs: number;
  itemCount: number;
  sortedOrderUsed?: Book[];
}

export interface MultiScaleSortRow {
  scale: BenchmarkScale;
  condition: DataCondition;
  field: SortField;
  quickSort: AlgorithmMetrics;
  mergeSort: AlgorithmMetrics;
  insertionSort: AlgorithmMetrics;
}

export interface SearchPositionBenchmarkRow {
  scenario: SearchPositionScenario;
  label: string;
  targetQuery: string;
  field: 'judul' | 'isbn' | 'penulis';
  linear: SearchBenchmarkResult;
  binary: SearchBenchmarkResult;
}

export interface LastBenchmarkSummary {
  timestamp: string;
  scale: number;
  condition: DataCondition;
  field: SortField;
  sortMetrics: AlgorithmMetrics[];
  searchSample?: {
    query: string;
    linearMs: number;
    linearComparisons: number;
    binaryMs: number;
    binaryComparisons: number;
  };
}

export interface LibraryBackupPayload {
  version: string;
  exportedAt: string;
  books: Book[];
  loans: LoanRecord[];
}

export interface BookInput {
  isbn: string;
  judul: string;
  penulis: string;
  penerbit: string;
  tahunTerbit: number;
  kategori: BookCategory;
  kodeRak: string;
  stokTotal: number;
  coverColor: string;
  deskripsi: string;
}

export interface LoanInput {
  bookId: string;
  namaPeminjam: string;
  nimAnggota: string;
  tanggalPinjam?: string;
}

export interface ActionResult<T = void> {
  success: boolean;
  message: string;
  data?: T;
}
