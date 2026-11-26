import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpDown,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  Footprints,
  ListOrdered,
  Loader2,
  MapPin,
  Pencil,
  Play,
  Plus,
  Repeat,
  Search,
  Shuffle,
  Sparkles,
  Star,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  BinarySearchKey,
  getBookCriterionString,
  runDetailedSearch,
} from '../algorithms/searching';
import { formatBookFieldValue, runDetailedSort } from '../algorithms/sorting';
import { BookDetailModal } from '../components/catalog/BookDetailModal';
import { Badge } from '../components/common/Badge';
import { PageSizeOption, Pagination } from '../components/common/Pagination';
import { BookFormModal } from '../components/inventory/BookFormModal';
import { DeleteConfirmModal } from '../components/inventory/DeleteConfirmModal';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import {
  Book,
  BookInput,
  DatasetSliceScale,
  SearchAlgorithmType,
  SearchExecutionReport,
  SortAlgorithmType,
  SortExecutionReport,
  SortField,
  SortOrder,
} from '../types';

interface InventoryViewProps {
  onBorrowBook?: (book: Book) => void;
}

type ActiveEngineTab = 'sorting' | 'searching';

const SLICE_OPTIONS: {
  value: DatasetSliceScale;
  label: string;
  desc: string;
}[] = [
  { value: 50, label: 'Kecil (50)', desc: '50 buku pertama' },
  { value: 1000, label: 'Menengah (1.000)', desc: '1.000 buku pertama' },
  { value: 10000, label: 'Besar (10.000)', desc: 'Seluruh 10.000 buku' },
];

const CHART_COLORS = ['#064E3B', '#1E3A8A', '#D97706', '#991B1B'];

function getDynamicInputMeta(
  field: SortField | BinarySearchKey,
  mode: 'sorting' | 'searching',
): {
  type: 'text' | 'number';
  placeholder: string;
  helper: string;
  sanitize: (raw: string) => string;
} {
  if (field === 'isbn') {
    return {
      type: 'text',
      placeholder: 'Ketik kode ISBN, misal: 978-602-...',
      helper: 'Khusus kode ISBN: hanya menerima angka (0-9) dan tanda hubung (-)',
      sanitize: (raw: string) => raw.replace(/[^0-9-]/g, ''),
    };
  }
  if (field === 'penulis') {
    return {
      type: 'text',
      placeholder: 'Ketik nama penulis...',
      helper: 'Ketik nama lengkap atau sebagian nama penulis buku',
      sanitize: (raw: string) => raw,
    };
  }
  if (field === 'tahunTerbit') {
    return {
      type: 'number',
      placeholder:
        mode === 'sorting'
          ? 'Ketik tahun terbit, misal: 2024'
          : 'Ketik tahun, misal: 2024',
      helper: 'Khusus angka 4 digit tahun terbit (2010–2026)',
      sanitize: (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 4),
    };
  }
  if (field === 'kodeRak') {
    return {
      type: 'text',
      placeholder:
        mode === 'sorting'
          ? 'Ketik nama rak, misal: Rak A1, Teknologi...'
          : 'Ketik lokasi rak, misal: Rak B2, Pertanian...',
      helper:
        'Ketik kode atau nama lokasi rak fisik (contoh: Rak A1 - Teknologi, Rak B2 - Pertanian)',
      sanitize: (raw: string) => raw,
    };
  }
  return {
    type: 'text',
    placeholder:
      mode === 'sorting'
        ? 'Ketik judul buku untuk ditandai posisinya setelah urut, misal: Geografi...'
        : 'Ketik judul buku yang dicari, misal: Geometri, Geografi...',
    helper:
      mode === 'sorting'
        ? 'Opsional: menandai di No. Posisi berapa buku tersebut berada setelah diurutkan'
        : 'Ketik judul atau kata kunci judul buku yang ingin dicari lokasinya',
    sanitize: (raw: string) => raw,
  };
}

export function InventoryView({ onBorrowBook }: InventoryViewProps) {
  const {
    books,
    loans,
    addBook,
    updateBook,
    deleteBook,
    shuffleInventoryBooks,
    applySortedSliceToInventory,
  } = useLibrary();
  const { addToast } = useToast();

  // Active tab: 'sorting' (Tab 1) or 'searching' (Tab 2)
  const [activeTab, setActiveTab] = useState<ActiveEngineTab>('sorting');

  // ==================== REAL-TIME PROGRESS BAR STATE (0% -> 100%) ====================
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [progressStageLabel, setProgressStageLabel] = useState<string>('');
  const progressTimersRef = useRef<number[]>([]);

  const clearProgressTimers = () => {
    for (const id of progressTimersRef.current) {
      window.clearTimeout(id);
    }
    progressTimersRef.current = [];
  };

  useEffect(() => {
    return () => clearProgressTimers();
  }, []);

  // ==================== TAB 1: SORTING STATE ====================
  const [sortScale, setSortScale] = useState<DatasetSliceScale>(10000);
  const [sortField, setSortField] = useState<SortField>('judul');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [sortAlgorithm, setSortAlgorithm] = useState<SortAlgorithmType>('quick');
  const [sortHighlightQuery, setSortHighlightQuery] = useState<string>('');
  const [hasExecutedSort, setHasExecutedSort] = useState<boolean>(false);
  const [sortReport, setSortReport] = useState<SortExecutionReport | null>(null);
  const [showOnlyHighlightedRows, setShowOnlyHighlightedRows] =
    useState<boolean>(false);

  // ==================== TAB 2: SEARCHING STATE ====================
  const [searchScale, setSearchScale] = useState<DatasetSliceScale>(10000);
  const [searchField, setSearchField] = useState<BinarySearchKey>('judul');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchAlgorithm, setSearchAlgorithm] =
    useState<SearchAlgorithmType>('binary');
  const [searchValidationError, setSearchValidationError] = useState<string>('');
  const [hasExecutedSearch, setHasExecutedSearch] = useState<boolean>(false);
  const [searchReport, setSearchReport] =
    useState<SearchExecutionReport | null>(null);

  // ==================== MAIN INVENTORY TABLE & CRUD STATE ====================
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);
  const [selectedDetailBook, setSelectedDetailBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const sortInputMeta = getDynamicInputMeta(sortField, 'sorting');
  const searchInputMeta = getDynamicInputMeta(searchField, 'searching');

  // Progressive Disclosure: Switching tabs hides post-execution analysis panels until user clicks execute
  const handleSwitchTab = (nextTab: ActiveEngineTab) => {
    clearProgressTimers();
    setIsProcessing(false);
    setProgressPercent(0);
    setProgressStageLabel('');
    setActiveTab(nextTab);
    setHasExecutedSort(false);
    setHasExecutedSearch(false);
    setSearchValidationError('');
    setShowOnlyHighlightedRows(false);
  };

  // Shuffle all 10.000 books via Fisher-Yates
  const handleShuffleRack = () => {
    clearProgressTimers();
    setIsProcessing(false);
    setProgressPercent(0);
    const res = shuffleInventoryBooks();
    setHasExecutedSort(false);
    setHasExecutedSearch(false);
    setSortReport(null);
    setSearchReport(null);
    setShowOnlyHighlightedRows(false);
    setCurrentPage(1);
    addToast(res.message, 'info');
  };

  // Helper to run chunked async progress bar (0% -> 100%) while keeping pure algorithm time separate
  const runWithChunkedProgress = (
    stages: { percent: number; label: string; delayMs: number }[],
    onCompleteAt100: () => void,
  ) => {
    clearProgressTimers();
    setIsProcessing(true);
    setProgressPercent(0);
    setProgressStageLabel(stages[0]?.label || 'Memulai pemrosesan...');

    for (const st of stages) {
      const tid = window.setTimeout(() => {
        setProgressPercent(st.percent);
        setProgressStageLabel(st.label);
        if (st.percent >= 100) {
          setIsProcessing(false);
          onCompleteAt100();
        }
      }, st.delayMs);
      progressTimersRef.current.push(tid);
    }
  };

  // Execute Tab 1: Sorting
  const handleExecuteSorting = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    // Hide previous analysis while progress is < 100%
    setHasExecutedSort(false);
    setShowOnlyHighlightedRows(false);

    // Measure pure algorithm computation separately from UI animation frames
    const report = runDetailedSort(
      books,
      sortScale,
      sortAlgorithm,
      sortField,
      sortOrder,
      sortHighlightQuery,
    );

    const finalizeSortAt100 = () => {
      setSortReport(report);
      setHasExecutedSort(true);
      applySortedSliceToInventory(report.sortedBooks);

      if (report.highlightedPositions.length > 0) {
        const firstMatchIdx = report.highlightedPositions[0].index;
        const targetPage = Math.floor(firstMatchIdx / pageSize) + 1;
        setCurrentPage(targetPage);
      } else {
        setCurrentPage(1);
      }

      addToast(
        `100% Selesai: ${report.algorithmName} mengurutkan ${report.itemCount.toLocaleString('id-ID')} buku dalam ${report.executionTimeMs.toFixed(4)} ms (waktu komputasi murni).`,
        'success',
      );
    };

    runWithChunkedProgress(
      [
        {
          percent: 12,
          label: `Menyiapkan snapshot Before (${report.itemCount.toLocaleString('id-ID')} buku)...`,
          delayMs: 15,
        },
        {
          percent: 38,
          label: `Mengeksekusi ${report.algorithmName} (${report.bigO.average})...`,
          delayMs: 40,
        },
        {
          percent: 72,
          label: `Merekam jejak langkah & membandingkan 4 algoritma Sorting...`,
          delayMs: 70,
        },
        {
          percent: 94,
          label: `Menyusun hasil After & Post-Sort Highlighting...`,
          delayMs: 95,
        },
        {
          percent: 100,
          label: `100% — Proses Sorting Selesai (${report.executionTimeMs.toFixed(4)} ms waktu komputasi murni)`,
          delayMs: 120,
        },
      ],
      finalizeSortAt100,
    );
  };

  // Execute Tab 2: Searching
  const handleExecuteSearching = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isProcessing) return;

    if (!searchQuery.trim()) {
      setSearchValidationError(
        'Silakan ketik kata kunci pencarian terlebih dahulu sebelum menekan tombol Cari Buku (Searching).',
      );
      setHasExecutedSearch(false);
      return;
    }

    setSearchValidationError('');
    setHasExecutedSearch(false);

    // Measure pure algorithm computation separately from UI animation frames
    const report = runDetailedSearch(
      books,
      searchScale,
      searchAlgorithm,
      searchField,
      searchQuery,
    );

    const finalizeSearchAt100 = () => {
      setSearchReport(report);
      setHasExecutedSearch(true);

      addToast(
        `100% Selesai: ${report.algorithmName} memeriksa ${report.comparisonsCount.toLocaleString('id-ID')} langkah dalam ${report.executionTimeMs.toFixed(4)} ms (waktu komputasi murni).`,
        report.foundIndex !== -1 ? 'success' : 'warning',
      );
    };

    runWithChunkedProgress(
      [
        {
          percent: 18,
          label: `Menyiapkan ruang pencarian (${report.itemCount.toLocaleString('id-ID')} buku)...`,
          delayMs: 15,
        },
        {
          percent: 54,
          label: `Menjalankan ${report.algorithmName} (${report.bigO}) untuk "${searchQuery}"...`,
          delayMs: 45,
        },
        {
          percent: 86,
          label: `Membandingkan Head-to-Head Linear, Jump & Binary Search...`,
          delayMs: 75,
        },
        {
          percent: 100,
          label: `100% — Proses Searching Selesai (${report.executionTimeMs.toFixed(4)} ms waktu komputasi murni)`,
          delayMs: 105,
        },
      ],
      finalizeSearchAt100,
    );
  };

  const handlePickSearchSample = () => {
    const limit =
      searchScale >= 10000
        ? books.length
        : Math.min(searchScale, books.length);
    if (limit === 0) return;
    const sampleBook = books[Math.floor(Math.random() * limit)];
    let sampleVal = getBookCriterionString(sampleBook, searchField);
    if (searchField === 'judul') {
      sampleVal = sampleBook.judul.split(':')[0] || sampleBook.judul;
    }
    setSearchQuery(sampleVal);
    setSearchValidationError('');
  };

  const handlePickSortHighlightSample = () => {
    const limit =
      sortScale >= 10000 ? books.length : Math.min(sortScale, books.length);
    if (limit === 0) return;
    const sampleBook = books[Math.floor(Math.random() * limit)];
    let sampleVal = formatBookFieldValue(sampleBook, sortField);
    if (sortField === 'judul') {
      sampleVal = sampleBook.judul.split(':')[0] || sampleBook.judul;
    }
    setSortHighlightQuery(sampleVal);
  };

  // Map of highlighted book ID -> 1-based position number after sorting
  const highlightedPositionByBookId = useMemo(() => {
    const map = new Map<string, number>();
    if (activeTab === 'sorting' && hasExecutedSort && sortReport) {
      for (let i = 0; i < sortReport.highlightedPositions.length; i += 1) {
        const hp = sortReport.highlightedPositions[i];
        map.set(hp.book.id, hp.rackNumber);
      }
    } else if (activeTab === 'searching' && hasExecutedSearch && searchReport) {
      for (let i = 0; i < searchReport.matchedBooks.length; i += 1) {
        const mb = searchReport.matchedBooks[i];
        map.set(mb.id, searchReport.foundIndex + 1 + i);
      }
    }
    return map;
  }, [
    activeTab,
    hasExecutedSort,
    sortReport,
    hasExecutedSearch,
    searchReport,
  ]);

  // Active books displayed in the main Inventory table (respecting active scale slice or full 10.000)
  const activeScaleLimit = activeTab === 'sorting' ? sortScale : searchScale;
  const tableBooksWithPositionIndex = useMemo(() => {
    const limit =
      activeScaleLimit >= 10000
        ? books.length
        : Math.min(activeScaleLimit, books.length);
    const slice = books.slice(0, limit);
    const indexed = slice.map((book, idx) => ({
      book,
      positionNumber: idx + 1,
      zeroIndex: idx,
      isHighlighted: highlightedPositionByBookId.has(book.id),
    }));

    if (showOnlyHighlightedRows && highlightedPositionByBookId.size > 0) {
      return indexed.filter((item) => item.isHighlighted);
    }
    return indexed;
  }, [
    books,
    activeScaleLimit,
    highlightedPositionByBookId,
    showOnlyHighlightedRows,
  ]);

  useEffect(() => {
    const maxPage = Math.max(
      1,
      Math.ceil(tableBooksWithPositionIndex.length / pageSize),
    );
    if (currentPage > maxPage) {
      setCurrentPage(1);
    }
  }, [tableBooksWithPositionIndex.length, pageSize, currentPage]);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return tableBooksWithPositionIndex.slice(start, start + pageSize);
  }, [tableBooksWithPositionIndex, currentPage, pageSize]);

  const activeLoanCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < loans.length; i += 1) {
      if (loans[i].status === 'Dipinjam') {
        map.set(loans[i].bookId, (map.get(loans[i].bookId) || 0) + 1);
      }
    }
    return map;
  }, [loans]);

  const handleFormSubmit = (input: BookInput, editingId?: string) => {
    const result = editingId ? updateBook(editingId, input) : addBook(input);
    addToast(result.message, result.success ? 'success' : 'error');
    return result;
  };

  const handleConfirmDelete = (bookId: string) => {
    const result = deleteBook(bookId);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER HALAMAN INVENTARIS TERPADU                                   */}
      {/* =================================================================== */}
      <div className="flex flex-col gap-4 rounded-2xl border border-parchment-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-emerald-900 px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase tracking-wider text-amber-300">
              Single Source of Truth
            </span>
            <Badge variant="emerald">
              Total Koleksi Nyata: {books.length.toLocaleString('id-ID')} Buku Acak
            </Badge>
          </div>
          <h1 className="mt-1.5 font-serif text-2xl font-bold text-slate-900">
            Inventaris Buku &amp; Mesin Sorting / Searching Terpadu
          </h1>
          <p className="mt-0.5 text-xs text-slate-500">
            Seluruh 10.000 buku nyata diacak dengan Fisher-Yates Shuffle (lengkap dengan{' '}
            <strong>No. Posisi Indeks</strong> dinamis &amp; <strong>Lokasi Rak</strong>{' '}
            fisik bervariasi).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleShuffleRack}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-950 shadow-xs transition hover:bg-amber-100"
            title="Acak ulang seluruh 10.000 buku menggunakan Fisher-Yates Shuffle"
          >
            <Shuffle className="h-4 w-4 text-amber-700" />
            <span>Acak Ulang Data (Shuffle)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-950"
          >
            <Plus className="h-4 w-4 text-amber-300" />
            <span>+ Tambah Buku</span>
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* PANEL KONTROL 2 TAB INDEPENDEN (TAB 1: SORTING | TAB 2: SEARCHING)  */}
      {/* =================================================================== */}
      <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
        {/* Tab Switcher Header */}
        <div className="grid grid-cols-1 border-b border-parchment-200 bg-parchment-50 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleSwitchTab('sorting')}
            className={`flex items-center justify-center gap-2.5 px-5 py-4 text-left text-xs font-bold transition ${
              activeTab === 'sorting'
                ? 'border-b-2 border-indigo-900 bg-white text-indigo-950 shadow-xs'
                : 'text-slate-600 hover:bg-parchment-100 hover:text-slate-900'
            }`}
          >
            <ArrowUpDown
              className={`h-4 w-4 ${
                activeTab === 'sorting' ? 'text-indigo-800' : 'text-slate-400'
              }`}
            />
            <div>
              <p className="text-sm font-bold">
                TAB 1: SORTING (Urutkan Data + Penunjuk Posisi Buku Setelah Urut)
              </p>
              <p className="text-[11px] font-normal text-slate-500">
                Bubble · Insertion · Merge · Quick Sort + Post-Sort Highlighting
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleSwitchTab('searching')}
            className={`flex items-center justify-center gap-2.5 px-5 py-4 text-left text-xs font-bold transition ${
              activeTab === 'searching'
                ? 'border-b-2 border-emerald-900 bg-white text-emerald-950 shadow-xs'
                : 'text-slate-600 hover:bg-parchment-100 hover:text-slate-900'
            }`}
          >
            <Search
              className={`h-4 w-4 ${
                activeTab === 'searching' ? 'text-emerald-800' : 'text-slate-400'
              }`}
            />
            <div>
              <p className="text-sm font-bold">
                TAB 2: SEARCHING (Cari Lokasi Buku di Inventaris)
              </p>
              <p className="text-[11px] font-normal text-slate-500">
                Linear Search O(n) · Jump Search O(√n) · Binary Search O(log n)
              </p>
            </div>
          </button>
        </div>

        {/* ==================== KONTROL TAB 1: SORTING ==================== */}
        {activeTab === 'sorting' && (
          <form onSubmit={handleExecuteSorting} className="space-y-4 p-5">
            {/* 1. Skala Data */}
            <div>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                1. Pilih Skala Data Uji (Dari Array Inventaris Aktif):
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SLICE_OPTIONS.map((opt) => {
                  const isSelected = sortScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setSortScale(opt.value);
                        setHasExecutedSort(false);
                      }}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-indigo-900 bg-indigo-900 text-white shadow-sm'
                          : 'border-slate-200 bg-parchment-50 text-slate-800 hover:bg-parchment-100'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p
                          className={`text-[11px] ${
                            isSelected ? 'text-indigo-200' : 'text-slate-500'
                          }`}
                        >
                          {opt.desc}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold">
                        {opt.value.toLocaleString('id-ID')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Atribut, 3. Arah Urutan, 4. Algoritma Sorting */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="tab-sort-field"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  2. Urutkan Berdasarkan (Atribut)
                </label>
                <select
                  id="tab-sort-field"
                  disabled={isProcessing}
                  value={sortField}
                  onChange={(e) => {
                    const nextField = e.target.value as SortField;
                    const nextMeta = getDynamicInputMeta(nextField, 'sorting');
                    setSortField(nextField);
                    setSortHighlightQuery(nextMeta.sanitize(sortHighlightQuery));
                    setHasExecutedSort(false);
                  }}
                  className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-900 focus:outline-none"
                >
                  <option value="judul">Judul Buku</option>
                  <option value="isbn">Kode ISBN</option>
                  <option value="penulis">Penulis</option>
                  <option value="tahunTerbit">Tahun Terbit</option>
                  <option value="kodeRak">Lokasi Rak</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="tab-sort-order"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  3. Arah Urutan
                </label>
                <select
                  id="tab-sort-order"
                  disabled={isProcessing}
                  value={sortOrder}
                  onChange={(e) => {
                    setSortOrder(e.target.value as SortOrder);
                    setHasExecutedSort(false);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-900 focus:outline-none"
                >
                  <option value="asc">Ascending (A–Z / Kecil–Besar)</option>
                  <option value="desc">Descending (Z–A / Besar–Kecil)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="tab-sort-algorithm"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  4. Pilih Algoritma Sorting
                </label>
                <select
                  id="tab-sort-algorithm"
                  aria-label="Pilih Algoritma Sorting"
                  disabled={isProcessing}
                  value={sortAlgorithm}
                  onChange={(e) => {
                    setSortAlgorithm(e.target.value as SortAlgorithmType);
                    setHasExecutedSort(false);
                  }}
                  className="w-full rounded-lg border border-indigo-300 bg-indigo-50/60 px-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-900 focus:outline-none"
                >
                  <option value="bubble">Bubble Sort — O(n²)</option>
                  <option value="insertion">Insertion Sort — O(n²)</option>
                  <option value="merge">Merge Sort — O(n log n)</option>
                  <option value="quick">Quick Sort — O(n log n)</option>
                </select>
              </div>
            </div>

            {/* 5. Kotak Input Dinamis Pendamping — Post-Sort Highlighting */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-3.5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <label
                  htmlFor="tab-sort-highlight-input"
                  className="text-xs font-bold text-indigo-950"
                >
                  5. Tandai Posisi Buku Setelah Diurutkan (Opsional — Post-Sort
                  Highlighting):
                </label>
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handlePickSortHighlightSample}
                  className="inline-flex items-center gap-1 self-start rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                >
                  <Sparkles className="h-3 w-3" />
                  <span>Isi Contoh Buku dari Rak</span>
                </button>
              </div>

              <div className="mt-2 flex flex-col gap-2.5 sm:flex-row">
                <div className="relative flex-1">
                  <input
                    id="tab-sort-highlight-input"
                    type={sortInputMeta.type}
                    value={sortHighlightQuery}
                    onChange={(e) =>
                      setSortHighlightQuery(sortInputMeta.sanitize(e.target.value))
                    }
                    placeholder={sortInputMeta.placeholder}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                  />
                  {sortHighlightQuery && (
                    <button
                      type="button"
                      onClick={() => setSortHighlightQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Hapus kata kunci penanda"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-950 disabled:cursor-wait disabled:opacity-60"
                >
                  {isProcessing ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-amber-300" />
                  )}
                  <span>
                    {isProcessing
                      ? `Memproses (${progressPercent}%)...`
                      : 'Jalankan Pengurutan (Sorting)'}
                  </span>
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">{sortInputMeta.helper}</p>
            </div>
          </form>
        )}

        {/* ==================== KONTROL TAB 2: SEARCHING ==================== */}
        {activeTab === 'searching' && (
          <form onSubmit={handleExecuteSearching} className="space-y-4 p-5">
            {/* 1. Skala Data */}
            <div>
              <span className="mb-1.5 block text-xs font-bold text-slate-700">
                1. Pilih Skala Ruang Pencarian (Dari Array Inventaris Aktif):
              </span>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {SLICE_OPTIONS.map((opt) => {
                  const isSelected = searchScale === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isProcessing}
                      onClick={() => {
                        setSearchScale(opt.value);
                        setHasExecutedSearch(false);
                      }}
                      className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-left transition ${
                        isSelected
                          ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm'
                          : 'border-slate-200 bg-parchment-50 text-slate-800 hover:bg-parchment-100'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-bold">{opt.label}</p>
                        <p
                          className={`text-[11px] ${
                            isSelected ? 'text-emerald-200' : 'text-slate-500'
                          }`}
                        >
                          {opt.desc}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold">
                        {opt.value.toLocaleString('id-ID')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Kriteria + Kotak Input Dinamis + 3. Algoritma Searching */}
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <label
                  htmlFor="tab-search-field"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  2. Cari Berdasarkan (Kriteria)
                </label>
                <select
                  id="tab-search-field"
                  disabled={isProcessing}
                  value={searchField}
                  onChange={(e) => {
                    const nextField = e.target.value as BinarySearchKey;
                    const nextMeta = getDynamicInputMeta(nextField, 'searching');
                    setSearchField(nextField);
                    setSearchQuery(nextMeta.sanitize(searchQuery));
                    setSearchValidationError('');
                    setHasExecutedSearch(false);
                  }}
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-950 focus:border-emerald-900 focus:outline-none"
                >
                  <option value="judul">Judul Buku</option>
                  <option value="isbn">Kode ISBN</option>
                  <option value="penulis">Penulis</option>
                  <option value="tahunTerbit">Tahun Terbit</option>
                  <option value="kodeRak">Lokasi Rak</option>
                </select>
              </div>

              <div className="lg:col-span-6">
                <div className="mb-1 flex items-center justify-between">
                  <label
                    htmlFor="tab-search-keyword-input"
                    className="text-xs font-bold text-slate-700"
                  >
                    3. Kata Kunci Pencarian
                  </label>
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handlePickSearchSample}
                    className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-900 hover:bg-amber-100"
                  >
                    <Sparkles className="h-3 w-3" />
                    <span>Ambil Contoh dari Rak</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="tab-search-keyword-input"
                    type={searchInputMeta.type}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(searchInputMeta.sanitize(e.target.value));
                      setSearchValidationError('');
                    }}
                    placeholder={searchInputMeta.placeholder}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-900"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setHasExecutedSearch(false);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Hapus kata kunci pencarian"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {searchInputMeta.helper}
                </p>
              </div>

              <div className="lg:col-span-3">
                <label
                  htmlFor="tab-search-algorithm"
                  className="mb-1 block text-xs font-bold text-slate-700"
                >
                  4. Pilih Algoritma Searching
                </label>
                <select
                  id="tab-search-algorithm"
                  aria-label="Pilih Algoritma Pencarian"
                  disabled={isProcessing}
                  value={searchAlgorithm}
                  onChange={(e) => {
                    setSearchAlgorithm(e.target.value as SearchAlgorithmType);
                    setHasExecutedSearch(false);
                  }}
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50/60 px-3 py-2 text-xs font-bold text-emerald-950 focus:border-emerald-900 focus:outline-none"
                >
                  <option value="linear">Linear Search — O(n)</option>
                  <option value="jump">Jump Search — O(√n)</option>
                  <option value="binary">Binary Search — O(log n)</option>
                </select>
              </div>
            </div>

            {searchValidationError && (
              <div className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-800">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{searchValidationError}</span>
              </div>
            )}

            <div className="flex justify-end border-t border-parchment-200 pt-3">
              <button
                type="submit"
                disabled={isProcessing}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-900 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-950 disabled:cursor-wait disabled:opacity-60"
              >
                {isProcessing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                ) : (
                  <Search className="h-3.5 w-3.5 text-amber-300" />
                )}
                <span>
                  {isProcessing
                    ? `Mencari (${progressPercent}%)...`
                    : 'Cari Buku (Searching)'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ==================== REAL-TIME PROGRESS BAR (0% -> 100%) ==================== */}
        {(isProcessing || progressPercent === 100) &&
          (isProcessing || hasExecutedSort || hasExecutedSearch) && (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progressPercent}
              aria-label="Progress Eksekusi Algoritma"
              className="border-t border-parchment-200 bg-slate-900 px-5 py-3 text-white"
            >
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {progressPercent < 100 ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-300" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  )}
                  <span className="font-medium text-slate-200">
                    {progressStageLabel}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold text-amber-300">
                  {progressPercent}%
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-700">
                <div
                  className={`h-full transition-all duration-150 ${
                    progressPercent >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}
      </div>

      {/* =================================================================== */}
      {/* PROGRESSIVE DISCLOSURE: HASIL EKSEKUSI TAB 1 (SORTING)              */}
      {/* Muncul HANYA setelah progress mencapai 100%                         */}
      {/* =================================================================== */}
      {activeTab === 'sorting' &&
        !isProcessing &&
        progressPercent === 100 &&
        hasExecutedSort &&
        sortReport && (
          <section
            aria-label="Hasil Eksekusi Sorting"
            className="space-y-5 rounded-2xl border-2 border-indigo-200 bg-white p-5 shadow-md"
          >
            {/* Post-Sort Highlighting Banner (jika user mengisi kata kunci) */}
            {sortReport.filterQuery.trim() !== '' && (
              <div
                role="status"
                className={`flex flex-col gap-2 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
                  sortReport.highlightedPositions.length > 0
                    ? 'border-amber-300 bg-amber-50 text-amber-950'
                    : 'border-rose-200 bg-rose-50 text-rose-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <Star className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                  <div className="text-xs leading-relaxed">
                    <p className="font-bold">{sortReport.highlightSummary}</p>
                    {sortReport.highlightedPositions.length > 0 && (
                      <p className="mt-0.5 text-[11px] opacity-85">
                        Total {sortReport.highlightedPositions.length} buku yang cocok
                        telah ditandai dengan lencana bintang pada kolom{' '}
                        <strong>No. Posisi (Indeks)</strong> di tabel utama bawah.
                      </p>
                    )}
                  </div>
                </div>
                {sortReport.highlightedPositions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowOnlyHighlightedRows((prev) => !prev)}
                    className="shrink-0 rounded-lg bg-amber-900 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-amber-950"
                  >
                    {showOnlyHighlightedRows
                      ? `Tampilkan Semua Data (${sortReport.itemCount.toLocaleString('id-ID')})`
                      : `Filter Hanya Baris Ditandai (${sortReport.highlightedPositions.length})`}
                  </button>
                )}
              </div>
            )}

            {/* BLOK 1 — BEFORE & AFTER COMPARISON */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-900 font-mono text-xs text-white">
                  1
                </span>
                <span>
                  Blok 1 — Perbandingan Susunan Data: Before vs After Sorting
                </span>
              </h3>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Before Table */}
                <div className="rounded-xl border border-parchment-200 bg-parchment-50/50 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-700">
                      Kondisi Awal (Before — Acak)
                    </span>
                    <span className="font-mono text-[11px] text-slate-500">
                      10 sampel pertama sebelum diurutkan
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-parchment-200 bg-white">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-parchment-200 bg-parchment-50 text-[10px] font-semibold uppercase text-slate-500">
                          <th className="px-2.5 py-1.5 font-mono">No. Posisi Awal</th>
                          <th className="px-2.5 py-1.5">Judul Buku</th>
                          <th className="px-2.5 py-1.5">Lokasi Rak</th>
                          <th className="px-2.5 py-1.5 text-center">Tahun</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-parchment-100">
                        {sortReport.beforeSlice.map((item) => (
                          <tr key={`b-${item.book.id}-${item.originalIndex}`}>
                            <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-600">
                              #{item.originalIndex + 1} [{item.originalIndex}]
                            </td>
                            <td className="max-w-xs truncate px-2.5 py-1.5 text-slate-900">
                              {item.book.judul}
                            </td>
                            <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-500">
                              {item.book.kodeRak}
                            </td>
                            <td className="px-2.5 py-1.5 text-center font-mono text-slate-600">
                              {item.book.tahunTerbit}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* After Table */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3.5">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-emerald-900">
                      Hasil Akhir (After — Terurut {sortReport.field.toUpperCase()}{' '}
                      {sortReport.order.toUpperCase()})
                    </span>
                    <span className="font-mono text-[11px] text-emerald-800">
                      10 urutan teratas setelah sorting
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-parchment-200 bg-emerald-50/60 text-[10px] font-semibold uppercase text-emerald-900">
                          <th className="px-2.5 py-1.5 font-mono">No. Posisi Baru</th>
                          <th className="px-2.5 py-1.5 font-mono">Posisi Asal</th>
                          <th className="px-2.5 py-1.5">Judul Buku</th>
                          <th className="px-2.5 py-1.5">Lokasi Rak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-parchment-100">
                        {sortReport.afterSlice.map((item) => (
                          <tr key={`a-${item.book.id}-${item.finalIndex}`}>
                            <td className="px-2.5 py-1.5 font-mono font-bold text-emerald-800">
                              #{(item.finalIndex ?? 0) + 1} [{item.finalIndex}]
                            </td>
                            <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-400">
                              dari #{item.originalIndex + 1}
                            </td>
                            <td className="max-w-xs truncate px-2.5 py-1.5 font-semibold text-slate-900">
                              {item.book.judul}
                            </td>
                            <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-600">
                              {item.book.kodeRak}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* BLOK 2 — LOG PROSES LANGKAH DEMI LANGKAH (STEP-BY-STEP TRACE) */}
            <div className="space-y-2.5 rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-900 font-mono text-xs text-white">
                    2
                  </span>
                  <span>
                    Blok 2 — Log Proses Langkah demi Langkah (
                    {sortReport.algorithmName} Trace)
                  </span>
                </h3>
                <span className="font-mono text-xs text-slate-600">
                  Sampel {sortReport.steps.length} langkah dari total{' '}
                  <strong>
                    {sortReport.comparisonsCount.toLocaleString('id-ID')} perbandingan
                  </strong>{' '}
                  &amp;{' '}
                  <strong>
                    {sortReport.swapsCount.toLocaleString('id-ID')} pertukaran/geser
                  </strong>
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-indigo-200/80 bg-white p-3 font-mono text-xs">
                <ol className="space-y-1.5">
                  {sortReport.steps.map((st) => (
                    <li
                      key={st.step}
                      className="flex items-start gap-2 border-b border-parchment-100 pb-1 last:border-none"
                    >
                      <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900">
                        Langkah #{st.step}
                      </span>
                      <span className="text-slate-700">{st.description}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* BLOK 3 — GRAFIK PERBANDINGAN & ANALISIS EMPIRIS OTOMATIS */}
            <div className="space-y-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-900 font-mono text-xs text-white">
                    3
                  </span>
                  <span>
                    Blok 3 — Grafik Perbandingan Ke-4 Algoritma Sorting &amp; Analisis
                    Empiris
                  </span>
                </h3>
                <Badge variant="indigo">
                  Algoritma Aktif: {sortReport.algorithmName} ({sortReport.bigO.average})
                </Badge>
              </div>

              {/* 4 Metric Summary Cards */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Clock className="h-3 w-3 text-emerald-700" />
                    <span>Waktu Murni ({sortReport.algorithmName})</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                    {sortReport.executionTimeMs.toFixed(4)} ms
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Cpu className="h-3 w-3 text-indigo-700" />
                    <span>Kompleksitas Big-O</span>
                  </p>
                  <p className="mt-1 font-mono text-sm font-bold text-indigo-900">
                    {sortReport.bigO.average}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <ListOrdered className="h-3 w-3 text-slate-600" />
                    <span>Perbandingan</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-slate-900">
                    {sortReport.comparisonsCount.toLocaleString('id-ID')}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Repeat className="h-3 w-3 text-amber-600" />
                    <span>Pertukaran (Swaps)</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-amber-800">
                    {sortReport.swapsCount.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Bar Charts: Time (ms) & Comparisons */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-parchment-200 bg-white p-4">
                  <h4 className="mb-2 text-xs font-bold text-slate-800">
                    Grafik Perbandingan Waktu Eksekusi Murni Sorting (ms)
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortReport.headToHead.map((h) => ({
                          name: h.algorithmName,
                          waktuMs: h.executionTimeMs,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: number) => [`${val.toFixed(4)} ms`, 'Waktu']}
                        />
                        <Bar dataKey="waktuMs" radius={[5, 5, 0, 0]}>
                          {sortReport.headToHead.map((entry, idx) => (
                            <Cell
                              key={entry.algorithm}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-parchment-200 bg-white p-4">
                  <h4 className="mb-2 text-xs font-bold text-slate-800">
                    Grafik Jumlah Operasi Perbandingan (Comparisons)
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortReport.headToHead.map((h) => ({
                          name: h.algorithmName,
                          comparisons: h.comparisonsCount,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis
                          tick={{ fontSize: 11 }}
                          tickFormatter={(v: number) =>
                            v >= 1_000_000
                              ? `${(v / 1_000_000).toFixed(1)}M`
                              : v >= 1000
                                ? `${(v / 1000).toFixed(0)}k`
                                : String(v)
                          }
                        />
                        <Tooltip
                          formatter={(val: number) => [
                            val.toLocaleString('id-ID'),
                            'Perbandingan',
                          ]}
                        />
                        <Bar dataKey="comparisons" radius={[5, 5, 0, 0]}>
                          {sortReport.headToHead.map((entry, idx) => (
                            <Cell
                              key={entry.algorithm}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Head-to-Head Table */}
              <div className="overflow-x-auto rounded-lg border border-indigo-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-parchment-200 bg-indigo-50/70 text-[10px] font-bold uppercase text-indigo-950">
                      <th className="px-3 py-2">Algoritma Sorting</th>
                      <th className="px-3 py-2">Big-O</th>
                      <th className="px-3 py-2 text-right">Waktu Komputasi Murni</th>
                      <th className="px-3 py-2 text-right">Perbandingan</th>
                      <th className="px-3 py-2 text-right">Pertukaran</th>
                      <th className="px-3 py-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {sortReport.headToHead.map((row) => (
                      <tr
                        key={row.algorithm}
                        className={row.isWinner ? 'bg-emerald-50/70 font-semibold' : ''}
                      >
                        <td className="px-3 py-2 text-slate-900">
                          <span>{row.algorithmName}</span>
                          {row.isSelected && (
                            <span className="ml-1.5 rounded bg-indigo-100 px-1.5 py-0.5 text-[10px] font-bold text-indigo-900">
                              Dipilih
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">{row.bigO}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                          {row.executionTimeMs.toFixed(4)} ms
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-800">
                          {row.comparisonsCount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-600">
                          {row.swapsCount.toLocaleString('id-ID')}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.isWinner ? (
                            <Badge variant="emerald">
                              <Award className="h-3 w-3" />
                              <span>Paling Efisien</span>
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-500">Pembanding</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Automatic Conclusion Card */}
              <div className="space-y-1.5 rounded-lg border border-indigo-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-emerald-900">
                  🏆 Kesimpulan Perbandingan Kecepatan:{' '}
                  <span className="font-normal text-slate-800">
                    {sortReport.winnerSummary}
                  </span>
                </p>
                <p>
                  <strong>Analisis Empiris ({sortReport.algorithmName}):</strong>{' '}
                  {sortReport.narrativeAnalysis}
                </p>
              </div>
            </div>
          </section>
        )}

      {/* =================================================================== */}
      {/* PROGRESSIVE DISCLOSURE: HASIL EKSEKUSI TAB 2 (SEARCHING)            */}
      {/* Muncul HANYA setelah progress mencapai 100%                         */}
      {/* =================================================================== */}
      {activeTab === 'searching' &&
        !isProcessing &&
        progressPercent === 100 &&
        hasExecutedSearch &&
        searchReport && (
          <section
            aria-label="Hasil Eksekusi Searching"
            className="space-y-5 rounded-2xl border-2 border-emerald-200 bg-white p-5 shadow-md"
          >
            {/* BLOK 1 — BEFORE & AFTER SEARCH COMPARISON */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 font-mono text-xs text-white">
                  1
                </span>
                <span>
                  Blok 1 — Kondisi Ruang Pencarian (Before) &amp; Buku Ditemukan (After)
                </span>
              </h3>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Before Search Space */}
                <div className="rounded-xl border border-parchment-200 bg-parchment-50/50 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-slate-700">
                      Kondisi Ruang Pencarian (Before)
                    </span>
                    {searchReport.requiresPreSort ? (
                      <Badge variant="indigo">
                        Salinan Terurut via Quick Sort (
                        {searchReport.preSortTimeMs.toFixed(2)} ms)
                      </Badge>
                    ) : (
                      <Badge variant="neutral">Susunan Data Aktif (Tanpa Pre-Sort)</Badge>
                    )}
                  </div>

                  <p className="mb-2.5 rounded-lg border border-parchment-200 bg-white px-3 py-2 text-xs text-slate-600">
                    {searchReport.requiresPreSort ? (
                      <>
                        <strong>{searchReport.algorithmName}:</strong> Mengurutkan salinan{' '}
                        {searchReport.itemCount.toLocaleString('id-ID')} buku berdasarkan{' '}
                        <strong>{searchReport.field}</strong> terlebih dahulu tanpa
                        mengubah urutan permanen tabel inventaris utama.
                      </>
                    ) : (
                      <>
                        <strong>Linear Search:</strong> Menelusuri langsung dari posisi{' '}
                        <code className="font-mono">[0]</code> hingga{' '}
                        <code className="font-mono">[{searchReport.itemCount - 1}]</code>{' '}
                        pada kondisi susunan data aktif.
                      </>
                    )}
                  </p>

                  <div className="max-h-44 overflow-y-auto rounded-lg border border-parchment-200 bg-white">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead>
                        <tr className="border-b border-parchment-200 bg-parchment-50 text-[10px] font-semibold uppercase text-slate-500">
                          <th className="px-2.5 py-1.5 font-mono">No. Posisi</th>
                          <th className="px-2.5 py-1.5">Judul Buku</th>
                          <th className="px-2.5 py-1.5">Lokasi Rak</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-parchment-100">
                        {searchReport.beforeSlice.map((item) => (
                          <tr key={`sb-${item.book.id}-${item.originalIndex}`}>
                            <td className="px-2.5 py-1.5 font-mono font-semibold text-slate-600">
                              #{item.originalIndex + 1} [{item.originalIndex}]
                            </td>
                            <td className="max-w-xs truncate px-2.5 py-1.5 text-slate-800">
                              {item.book.judul}
                            </td>
                            <td className="px-2.5 py-1.5 font-mono text-[11px] text-slate-500">
                              {item.book.kodeRak}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* After Search Found Book Card */}
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase text-emerald-900">
                      Hasil Pencarian (After — &ldquo;{searchReport.query}&rdquo;)
                    </span>
                    {searchReport.foundIndex !== -1 ? (
                      <Badge variant="emerald">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>
                          Ditemukan pada No. Posisi #{searchReport.foundIndex + 1} (Indeks [
                          {searchReport.foundIndex}])
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant="rose">
                        <XCircle className="h-3 w-3" />
                        <span>Tidak Ditemukan (Indeks -1)</span>
                      </Badge>
                    )}
                  </div>

                  {searchReport.foundBook ? (
                    <div className="space-y-2.5">
                      <div className="rounded-xl border border-emerald-200 bg-white p-3.5 shadow-xs">
                        <div className="flex items-start gap-3">
                          <div
                            className="flex h-20 w-14 shrink-0 flex-col justify-between rounded-lg p-2 text-white"
                            style={{ backgroundColor: searchReport.foundBook.coverColor }}
                          >
                            <span className="line-clamp-2 font-mono text-[8px] font-bold leading-tight">
                              {searchReport.foundBook.kodeRak}
                            </span>
                            <BookOpen className="h-4 w-4 opacity-85" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="rounded bg-emerald-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                                No. Posisi #{searchReport.foundIndex + 1} · Indeks [
                                {searchReport.foundIndex}]
                              </span>
                              <span className="inline-flex items-center gap-1 rounded bg-parchment-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                                <MapPin className="h-2.5 w-2.5 text-emerald-700" />
                                {searchReport.foundBook.kodeRak}
                              </span>
                            </div>
                            <h4 className="mt-1 font-serif text-sm font-bold text-slate-900">
                              {searchReport.foundBook.judul}
                            </h4>
                            <p className="text-xs text-slate-600">
                              {searchReport.foundBook.penulis} ·{' '}
                              <strong>{searchReport.foundBook.tahunTerbit}</strong>
                            </p>
                            <p className="font-mono text-[11px] text-slate-500">
                              ISBN: {searchReport.foundBook.isbn} · Stok:{' '}
                              {searchReport.foundBook.stokTersedia}/
                              {searchReport.foundBook.stokTotal}
                            </p>
                          </div>
                        </div>
                      </div>
                      {searchReport.matchedBooks.length > 1 && (
                        <p className="text-xs font-semibold text-emerald-900">
                          Total {searchReport.matchedBooks.length} buku cocok dengan kata
                          kunci &ldquo;{searchReport.query}&rdquo;.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-44 flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-white p-4 text-center">
                      <XCircle className="h-7 w-7 text-rose-400" />
                      <p className="mt-2 text-xs font-bold text-slate-800">
                        Buku dengan kata kunci &ldquo;{searchReport.query}&rdquo; tidak
                        ditemukan
                      </p>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Klik &ldquo;Ambil Contoh dari Rak&rdquo; untuk menguji kata kunci
                        yang ada di dalam skala data ini.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* BLOK 2 — LOG PROSES LANGKAH DEMI LANGKAH (STEP-BY-STEP TRACE) */}
            <div className="space-y-2.5 rounded-xl border border-emerald-200 bg-emerald-50/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 font-mono text-xs text-white">
                    2
                  </span>
                  <span>
                    Blok 2 — Log Proses Langkah demi Langkah (
                    {searchReport.algorithmName} Trace)
                  </span>
                </h3>
                <span className="font-mono text-xs text-slate-600">
                  Total pemeriksaan:{' '}
                  <strong>
                    {searchReport.comparisonsCount.toLocaleString('id-ID')} langkah
                  </strong>{' '}
                  dari {searchReport.itemCount.toLocaleString('id-ID')} buku
                  {searchReport.jumpStepSize
                    ? ` (Lompatan blok √n = ${searchReport.jumpStepSize})`
                    : ''}
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto rounded-lg border border-emerald-200 bg-white p-3 font-mono text-xs">
                <ol className="space-y-1.5">
                  {searchReport.steps.map((st) => (
                    <li
                      key={`${st.step}-${st.mid}`}
                      className={`flex items-start gap-2 rounded px-2 py-1 ${
                        st.matched
                          ? 'bg-emerald-50 font-bold text-emerald-900'
                          : 'border-b border-parchment-100 text-slate-700'
                      }`}
                    >
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          st.matched
                            ? 'bg-emerald-700 text-white'
                            : st.phase === 'jump'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        Iterasi #{st.step}
                      </span>
                      <span>{st.description}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* BLOK 3 — GRAFIK PERBANDINGAN & ANALISIS EMPIRIS OTOMATIS */}
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="flex items-center gap-2 font-serif text-base font-bold text-slate-900">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900 font-mono text-xs text-white">
                    3
                  </span>
                  <span>
                    Blok 3 — Grafik Perbandingan Ke-3 Algoritma Searching &amp; Analisis
                    Empiris
                  </span>
                </h3>
                <Badge variant="emerald">
                  Algoritma Aktif: {searchReport.algorithmName} ({searchReport.bigO})
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Clock className="h-3 w-3 text-emerald-700" />
                    <span>Waktu Murni ({searchReport.algorithmName})</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                    {searchReport.executionTimeMs.toFixed(4)} ms
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Cpu className="h-3 w-3 text-indigo-700" />
                    <span>Kompleksitas Big-O</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-indigo-900">
                    {searchReport.bigO}
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <Footprints className="h-3 w-3 text-amber-600" />
                    <span>Jumlah Langkah</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-slate-900">
                    {searchReport.comparisonsCount.toLocaleString('id-ID')} langkah
                  </p>
                </div>
                <div className="rounded-lg bg-white p-3 shadow-xs">
                  <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                    <ArrowRight className="h-3 w-3 text-slate-500" />
                    <span>No. Posisi (Indeks)</span>
                  </p>
                  <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                    {searchReport.foundIndex !== -1
                      ? `#${searchReport.foundIndex + 1} [${searchReport.foundIndex}]`
                      : 'Tidak Ada (-1)'}
                  </p>
                </div>
              </div>

              {/* Side-by-Side Bar Charts: Search Time (ms) & Steps (Comparisons) */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-parchment-200 bg-white p-4">
                  <h4 className="mb-2 text-xs font-bold text-slate-800">
                    Grafik Perbandingan Waktu Eksekusi Murni Searching (ms)
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={searchReport.headToHead.map((h) => ({
                          name: h.algorithmName,
                          waktuMs: h.executionTimeMs,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: number) => [`${val.toFixed(4)} ms`, 'Waktu']}
                        />
                        <Bar dataKey="waktuMs" radius={[5, 5, 0, 0]}>
                          {searchReport.headToHead.map((entry, idx) => (
                            <Cell
                              key={entry.algorithm}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="rounded-xl border border-parchment-200 bg-white p-4">
                  <h4 className="mb-2 text-xs font-bold text-slate-800">
                    Grafik Jumlah Operasi Langkah / Iterasi (Comparisons)
                  </h4>
                  <div className="h-52 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={searchReport.headToHead.map((h) => ({
                          name: h.algorithmName,
                          langkah: h.comparisonsCount,
                        }))}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip
                          formatter={(val: number) => [
                            `${val.toLocaleString('id-ID')} langkah`,
                            'Langkah',
                          ]}
                        />
                        <Bar dataKey="langkah" radius={[5, 5, 0, 0]}>
                          {searchReport.headToHead.map((entry, idx) => (
                            <Cell
                              key={entry.algorithm}
                              fill={CHART_COLORS[idx % CHART_COLORS.length]}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Head-to-Head Table */}
              <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-parchment-200 bg-emerald-50/70 text-[10px] font-bold uppercase text-emerald-950">
                      <th className="px-3 py-2">Algoritma Pencarian</th>
                      <th className="px-3 py-2">Big-O</th>
                      <th className="px-3 py-2 text-right">Waktu Komputasi Murni</th>
                      <th className="px-3 py-2 text-right">Jumlah Langkah</th>
                      <th className="px-3 py-2 text-center">No. Posisi</th>
                      <th className="px-3 py-2 text-center">Status Efisiensi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-parchment-100">
                    {searchReport.headToHead.map((row) => (
                      <tr
                        key={row.algorithm}
                        className={
                          row.isLeastSteps ? 'bg-emerald-50/70 font-semibold' : ''
                        }
                      >
                        <td className="px-3 py-2 text-slate-900">
                          <span>{row.algorithmName}</span>
                          {row.isSelected && (
                            <span className="ml-1.5 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-900">
                              Dipilih
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">{row.bigO}</td>
                        <td className="px-3 py-2 text-right font-mono font-bold text-emerald-800">
                          {row.executionTimeMs.toFixed(4)} ms
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-800">
                          {row.comparisonsCount.toLocaleString('id-ID')} langkah
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {row.foundIndex !== -1
                            ? `#${row.foundIndex + 1} [${row.foundIndex}]`
                            : '-1'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {row.isLeastSteps ? (
                            <Badge variant="emerald">
                              <Award className="h-3 w-3" />
                              <span>Paling Efisien</span>
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-slate-500">Pembanding</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Automatic Conclusion Card */}
              <div className="space-y-1.5 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-700">
                <p className="font-semibold text-emerald-900">
                  🏆 Kesimpulan Perbandingan Ke-3 Algoritma:{' '}
                  <span className="font-normal text-slate-800">
                    {searchReport.winnerSummary}
                  </span>
                </p>
                <p>
                  <strong>Analisis Empiris ({searchReport.algorithmName}):</strong>{' '}
                  {searchReport.narrativeAnalysis}
                </p>
              </div>
            </div>
          </section>
        )}

      {/* =================================================================== */}
      {/* TABEL UTAMA INVENTARIS BUKU (10.000 ENTRI DENGAN PAGINATION)        */}
      {/* Pemisahan Kolom "No. Posisi (Indeks)" vs Kolom "Lokasi Rak"         */}
      {/* =================================================================== */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg font-bold text-slate-900">
              Tabel Utama Inventaris Buku (
              {tableBooksWithPositionIndex.length.toLocaleString('id-ID')} Entri Aktif)
            </h2>
            <p className="text-xs text-slate-500">
              Kolom <strong>No. Posisi (Indeks)</strong> berubah dinamis saat Shuffle /
              Sorting, sedangkan kolom <strong>Lokasi Rak</strong> menampilkan atribut
              rak fisik buku.
            </p>
          </div>

          {highlightedPositionByBookId.size > 0 && (
            <Badge variant="amber">
              <Star className="h-3 w-3" />
              <span>{highlightedPositionByBookId.size} Baris Buku Ditandai</span>
            </Badge>
          )}
        </div>

        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={tableBooksWithPositionIndex.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />

        <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="px-4 py-3 font-mono">No. Posisi (Indeks)</th>
                  <th className="px-4 py-3">Kode ISBN</th>
                  <th className="px-4 py-3">Judul Buku &amp; Penulis</th>
                  <th className="px-4 py-3">Kategori</th>
                  <th className="px-4 py-3">Lokasi Rak</th>
                  <th className="px-4 py-3 text-center">Tahun</th>
                  <th className="px-4 py-3 text-center">Stok</th>
                  <th className="px-4 py-3 text-right">Aksi CRUD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {paginatedRows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-xs text-slate-500"
                    >
                      Tidak ada data buku yang ditampilkan.
                    </td>
                  </tr>
                ) : (
                  paginatedRows.map(
                    ({ book, positionNumber, zeroIndex, isHighlighted }) => {
                      const activeLoans = activeLoanCountByBook.get(book.id) || 0;
                      return (
                        <tr
                          key={book.id}
                          className={`transition ${
                            isHighlighted
                              ? 'bg-amber-50/90 ring-1 ring-inset ring-amber-300'
                              : 'hover:bg-parchment-50/60'
                          }`}
                        >
                          <td className="px-4 py-3 font-mono text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900">
                                #{positionNumber.toLocaleString('id-ID')}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                [{zeroIndex}]
                              </span>
                            </div>
                            {isHighlighted && (
                              <span className="mt-0.5 inline-flex items-center gap-1 rounded bg-amber-200/80 px-1.5 py-0.5 font-sans text-[10px] font-bold text-amber-950">
                                <Star className="h-2.5 w-2.5" />
                                <span>Ditandai</span>
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                            {book.isbn}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <span
                                className="h-8 w-2 shrink-0 rounded-sm"
                                style={{ backgroundColor: book.coverColor }}
                              />
                              <div>
                                <p className="font-serif font-semibold text-slate-900">
                                  {book.judul}
                                </p>
                                <p className="text-xs text-slate-500">{book.penulis}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="neutral">{book.kategori}</Badge>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 rounded-md border border-parchment-300 bg-parchment-50 px-2 py-1 font-mono text-xs font-semibold text-slate-800">
                              <MapPin className="h-3 w-3 text-emerald-700" />
                              <span>{book.kodeRak}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-slate-700">
                            {book.tahunTerbit}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {book.stokTersedia > 0 ? (
                              <Badge variant="emerald">
                                {book.stokTersedia}/{book.stokTotal}
                              </Badge>
                            ) : (
                              <Badge variant="rose">Habis (0/{book.stokTotal})</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setSelectedDetailBook(book)}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-parchment-100"
                                title="Lihat detail buku"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                <span className="hidden xl:inline">Detail</span>
                              </button>
                              {onBorrowBook && (
                                <button
                                  type="button"
                                  disabled={book.stokTersedia <= 0}
                                  onClick={() => onBorrowBook(book)}
                                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold ${
                                    book.stokTersedia > 0
                                      ? 'bg-emerald-900 text-white hover:bg-emerald-950'
                                      : 'cursor-not-allowed bg-rose-50 text-rose-400'
                                  }`}
                                >
                                  <BookOpen className="h-3.5 w-3.5" />
                                  <span className="hidden xl:inline">Pinjam</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBook(book);
                                  setIsFormOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-semibold text-slate-700 hover:bg-parchment-100"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingBook(book)}
                                title={
                                  activeLoans > 0
                                    ? `Sedang dipinjam (${activeLoans} eksemplar)`
                                    : 'Hapus buku'
                                }
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    },
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>

        <Pagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={tableBooksWithPositionIndex.length}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      </div>

      {/* Modals for Detail, Create/Edit, and Protected Delete */}
      <BookDetailModal
        book={selectedDetailBook}
        loans={loans}
        onClose={() => setSelectedDetailBook(null)}
        onBorrow={(book) => {
          setSelectedDetailBook(null);
          if (onBorrowBook) onBorrowBook(book);
        }}
      />

      <BookFormModal
        isOpen={isFormOpen}
        editingBook={editingBook}
        existingBooks={books}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBook(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmModal
        book={deletingBook}
        activeLoansCount={
          deletingBook ? activeLoanCountByBook.get(deletingBook.id) || 0 : 0
        }
        onClose={() => setDeletingBook(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
