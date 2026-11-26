import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Clock,
  Database,
  Loader2,
  Plus,
  Repeat,
  Zap,
} from 'lucide-react';
import {
  BinarySearchKey,
  binarySearchBooks,
  getBookCriterionString,
  jumpSearchBooks,
  linearSearchBooks,
} from '../algorithms/searching';
import {
  SortResult,
  sortBooksWithBubbleSort,
  sortBooksWithInsertionSort,
  sortBooksWithMergeSort,
  sortBooksWithQuickSort,
} from '../algorithms/sorting';
import { BookDetailModal } from '../components/catalog/BookDetailModal';
import { BookGrid } from '../components/catalog/BookGrid';
import { BookTable } from '../components/catalog/BookTable';
import {
  AvailabilityFilter,
  CatalogSortOption,
  CatalogViewMode,
  FilterPanel,
  resolveSortParams,
} from '../components/catalog/FilterPanel';
import { SearchBar } from '../components/catalog/SearchBar';
import { PageSizeOption, Pagination } from '../components/common/Pagination';
import { BookFormModal } from '../components/inventory/BookFormModal';
import { DeleteConfirmModal } from '../components/inventory/DeleteConfirmModal';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import {
  Book,
  BookCategory,
  BookInput,
  DatasetSliceScale,
  SearchAlgorithmType,
  SortAlgorithmType,
} from '../types';

interface CatalogViewProps {
  onBorrowBook: (book: Book) => void;
}

const SLICE_PRESETS: { scale: DatasetSliceScale; label: string }[] = [
  { scale: 50, label: 'Data Kecil (50 Buku)' },
  { scale: 1000, label: 'Data Menengah (1.000 Buku)' },
  { scale: 10000, label: 'Data Besar (10.000 Buku / Semua Data)' },
];

const SORT_BIG_O: Record<SortAlgorithmType, string> = {
  quick: 'O(n log n)',
  merge: 'O(n log n)',
  bubble: 'O(n²)',
  insertion: 'O(n²)',
};

function runSelectedSort(
  items: readonly Book[],
  algorithm: SortAlgorithmType,
  option: CatalogSortOption,
): SortResult<Book> {
  const { field, order } = resolveSortParams(option);
  if (algorithm === 'bubble') {
    return sortBooksWithBubbleSort(items, field, order);
  }
  if (algorithm === 'merge') {
    return sortBooksWithMergeSort(items, field, order);
  }
  if (algorithm === 'insertion') {
    return sortBooksWithInsertionSort(items, field, order);
  }
  return sortBooksWithQuickSort(items, field, order);
}

export function CatalogView({ onBorrowBook }: CatalogViewProps) {
  const { books, loans, addBook, updateBook, deleteBook } = useLibrary();
  const { addToast } = useToast();

  // Active non-destructive slice scale from the Single Source of Truth `books`
  const [activeSliceScale, setActiveSliceScale] =
    useState<DatasetSliceScale>(10000);

  const slicedInventoryBooks = useMemo(() => {
    if (activeSliceScale >= 10000) return books;
    return books.slice(0, Math.min(activeSliceScale, books.length));
  }, [books, activeSliceScale]);

  // Search controls (explicit "Cari Buku" + live sync)
  const [queryInput, setQueryInput] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [searchAlgorithm, setSearchAlgorithm] =
    useState<SearchAlgorithmType>('linear');
  const [searchField, setSearchField] = useState<BinarySearchKey>('judul');
  const [searchNonce, setSearchNonce] = useState(0);

  // Filter & Sort controls
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'Semua'>(
    'Semua',
  );
  const [availability, setAvailability] = useState<AvailabilityFilter>('Semua');
  const [sortOption, setSortOption] = useState<CatalogSortOption>('judul-asc');
  const [sortAlgorithm, setSortAlgorithm] = useState<SortAlgorithmType>('quick');
  const [sortNonce, setSortNonce] = useState(0);
  const [isSorting, setIsSorting] = useState(false);
  const [viewMode, setViewMode] = useState<CatalogViewMode>('grid');

  // Pagination state (25 / 50 / 100 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  // Modals for detail + CRUD
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const searchResult = useMemo(() => {
    void searchNonce;
    if (searchAlgorithm === 'binary') {
      return binarySearchBooks(slicedInventoryBooks, activeQuery, searchField);
    }
    if (searchAlgorithm === 'jump') {
      return jumpSearchBooks(slicedInventoryBooks, activeQuery, searchField);
    }
    return linearSearchBooks(slicedInventoryBooks, activeQuery, searchField);
  }, [slicedInventoryBooks, activeQuery, searchAlgorithm, searchField, searchNonce]);

  const filteredBooks = useMemo(() => {
    return searchResult.matchedBooks.filter((book) => {
      if (selectedCategory !== 'Semua' && book.kategori !== selectedCategory) {
        return false;
      }
      if (availability === 'Tersedia' && book.stokTersedia <= 0) {
        return false;
      }
      if (availability === 'Habis' && book.stokTersedia > 0) {
        return false;
      }
      return true;
    });
  }, [searchResult.matchedBooks, selectedCategory, availability]);

  const [sortedState, setSortedState] = useState<SortResult<Book>>(() =>
    runSelectedSort(filteredBooks, sortAlgorithm, sortOption),
  );

  // Sync live typing to activeQuery with brief debounce while keeping explicit "Cari Buku" instant
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActiveQuery(queryInput);
    }, 150);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  // Execute sorting with a brief loading indicator when running O(n^2) on large datasets
  useEffect(() => {
    const isHeavyQuadratic =
      (sortAlgorithm === 'bubble' || sortAlgorithm === 'insertion') &&
      filteredBooks.length >= 2000;

    if (!isHeavyQuadratic) {
      setIsSorting(false);
      setSortedState(runSelectedSort(filteredBooks, sortAlgorithm, sortOption));
      return;
    }

    setIsSorting(true);
    const timer = window.setTimeout(() => {
      const next = runSelectedSort(filteredBooks, sortAlgorithm, sortOption);
      setSortedState(next);
      setIsSorting(false);
    }, 24);

    return () => window.clearTimeout(timer);
  }, [filteredBooks, sortAlgorithm, sortOption, sortNonce]);

  // Reset to page 1 when search, filters, or dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeQuery, selectedCategory, availability, sortOption, books.length, pageSize]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedState.sorted.slice(start, start + pageSize);
  }, [sortedState.sorted, currentPage, pageSize]);

  const activeLoanCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < loans.length; i += 1) {
      if (loans[i].status === 'Dipinjam') {
        map.set(loans[i].bookId, (map.get(loans[i].bookId) || 0) + 1);
      }
    }
    return map;
  }, [loans]);

  const handleSelectSlice = (scale: DatasetSliceScale) => {
    setActiveSliceScale(scale);
    setCurrentPage(1);
    const label =
      scale >= 10000
        ? `Semua Data Inventaris (${books.length.toLocaleString('id-ID')} buku)`
        : `${scale.toLocaleString('id-ID')} buku nyata dari inventaris`;
    addToast(`Skala katalog aktif diatur ke ${label}.`, 'info');
  };

  const handleExecuteSearch = () => {
    setActiveQuery(queryInput);
    setSearchNonce((n) => n + 1);
  };

  const handleClearSearch = () => {
    setQueryInput('');
    setActiveQuery('');
    setSearchNonce((n) => n + 1);
  };

  const handlePickSample = () => {
    if (slicedInventoryBooks.length === 0) return;
    const randomIdx = Math.floor(Math.random() * slicedInventoryBooks.length);
    const sample = getBookCriterionString(
      slicedInventoryBooks[randomIdx],
      searchField,
    );
    setQueryInput(sample);
    setActiveQuery(sample);
    setSearchNonce((n) => n + 1);
  };

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
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Demonstrasi Interaktif Sorting &amp; Searching · Pagination Aktif
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Katalog Buku PustakaKita
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Uji langsung pencarian (Linear vs Binary Search) dan pengurutan (Bubble Sort vs
            Quick/Merge/Insertion Sort) pada {books.length.toLocaleString('id-ID')} entri
            buku dengan pengukuran waktu nyata.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setEditingBook(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-950"
          >
            <Plus className="h-3.5 w-3.5 text-amber-300" />
            <span>Tambah Buku</span>
          </button>
        </div>
      </div>

      {/* Top Dataset Scale Selector (Non-destructive slice from Single Source of Truth) */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Database className="h-4 w-4 text-emerald-800" />
          <span>
            Skala Slice dari Inventaris Nyata (Diproses:{' '}
            <strong className="font-mono text-slate-900">
              {slicedInventoryBooks.length.toLocaleString('id-ID')}
            </strong>{' '}
            dari {books.length.toLocaleString('id-ID')} buku):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {SLICE_PRESETS.map((preset) => (
            <button
              key={preset.scale}
              type="button"
              onClick={() => handleSelectSlice(preset.scale)}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition ${
                activeSliceScale === preset.scale
                  ? 'border-emerald-900 bg-emerald-900 text-white'
                  : 'border-slate-200 bg-parchment-50 text-slate-700 hover:bg-parchment-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar + Kartu Metrik Proses Pencarian */}
      <SearchBar
        query={queryInput}
        activeQuery={activeQuery}
        onQueryChange={setQueryInput}
        onExecuteSearch={handleExecuteSearch}
        onClearSearch={handleClearSearch}
        onPickSample={handlePickSample}
        algorithm={searchAlgorithm}
        onAlgorithmChange={(alg) => {
          setSearchAlgorithm(alg);
          setSearchNonce((n) => n + 1);
        }}
        searchField={searchField}
        onSearchFieldChange={(field) => {
          setSearchField(field);
          setSearchNonce((n) => n + 1);
        }}
        executionTimeMs={searchResult.executionTimeMs}
        comparisonsCount={searchResult.comparisonsCount}
        resultCount={sortedState.sorted.length}
        totalDatasetCount={slicedInventoryBooks.length}
      />

      {/* Filter & Sort Algorithm Controls */}
      <FilterPanel
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        sortAlgorithm={sortAlgorithm}
        onSortAlgorithmChange={setSortAlgorithm}
        onTriggerSort={() => setSortNonce((n) => n + 1)}
        isSorting={isSorting}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {/* Panel Hasil Proses Sorting */}
      <section
        aria-label="Panel Hasil Proses Sorting"
        className="rounded-xl border border-indigo-200/80 bg-white p-4 shadow-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-200 pb-2.5">
          <div className="flex items-center gap-2 text-xs">
            <ArrowUpDown className="h-4 w-4 text-indigo-700" />
            <span className="font-bold text-slate-900">
              Panel Hasil Proses Sorting ({sortedState.metrics.algorithmName})
            </span>
            <span className="rounded bg-indigo-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              {SORT_BIG_O[sortAlgorithm]}
            </span>
          </div>
          {isSorting ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>
                Sedang mengurutkan {filteredBooks.length.toLocaleString('id-ID')} data...
              </span>
            </span>
          ) : (
            <span className="font-mono text-xs text-slate-500">
              Dataset diurutkan:{' '}
              <strong className="text-slate-900">
                {sortedState.metrics.itemCount.toLocaleString('id-ID')} buku
              </strong>
            </span>
          )}
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-lg bg-parchment-50/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Algoritma &amp; Big-O
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-900">
              {sortedState.metrics.algorithmName}{' '}
              <span className="font-mono text-indigo-700">
                ({SORT_BIG_O[sortAlgorithm]})
              </span>
            </p>
          </div>

          <div className="rounded-lg bg-parchment-50/80 px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Clock className="h-3 w-3 text-emerald-700" />
              <span>Waktu Eksekusi</span>
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-800">
              {sortedState.executionTimeMs.toFixed(4)} ms
            </p>
          </div>

          <div className="rounded-lg bg-parchment-50/80 px-3 py-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Jumlah Perbandingan
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">
              {sortedState.comparisonsCount.toLocaleString('id-ID')}
            </p>
          </div>

          <div className="rounded-lg bg-parchment-50/80 px-3 py-2">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Repeat className="h-3 w-3 text-amber-600" />
              <span>Pertukaran / Pergeseran</span>
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-amber-800">
              {sortedState.swapsCount.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </section>

      {/* Banner Lencana Waktu Proses Real-Time (Gabungan Search & Sort tepat di atas hasil buku) */}
      <div
        role="status"
        aria-label="Banner Waktu Proses Real-Time"
        className="flex flex-col gap-2.5 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-950 via-emerald-900 to-slate-900 px-4 py-3 text-white shadow-sm lg:flex-row lg:items-center lg:justify-between"
      >
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-300">
            <Zap className="h-3.5 w-3.5" />
            <span>REAL-TIME BENCHMARK</span>
          </span>
          <span>
            Ditemukan{' '}
            <strong className="font-mono text-amber-300">
              {sortedState.sorted.length.toLocaleString('id-ID')}
            </strong>{' '}
            dari {slicedInventoryBooks.length.toLocaleString('id-ID')} buku
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
          <span className="rounded-lg bg-white/10 px-2.5 py-1">
            Search:{' '}
            <strong className="text-amber-300">
              {searchAlgorithm === 'linear'
                ? 'Linear O(n)'
                : searchAlgorithm === 'jump'
                  ? 'Jump O(√n)'
                  : 'Binary O(log n)'}
            </strong>{' '}
            · {searchResult.executionTimeMs.toFixed(4)} ms ·{' '}
            {searchResult.comparisonsCount.toLocaleString('id-ID')} langkah
          </span>
          <span className="rounded-lg bg-white/10 px-2.5 py-1">
            Sort:{' '}
            <strong className="text-emerald-300">
              {sortedState.metrics.algorithmName} ({SORT_BIG_O[sortAlgorithm]})
            </strong>{' '}
            · {sortedState.executionTimeMs.toFixed(4)} ms ·{' '}
            {sortedState.comparisonsCount.toLocaleString('id-ID')} cmp
          </span>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={sortedState.sorted.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {viewMode === 'grid' ? (
        <BookGrid
          books={paginatedBooks}
          onSelectDetail={setSelectedBook}
          onBorrow={onBorrowBook}
          onEdit={(book) => {
            setEditingBook(book);
            setIsFormOpen(true);
          }}
          onDelete={setDeletingBook}
        />
      ) : (
        <BookTable
          books={paginatedBooks}
          onSelectDetail={setSelectedBook}
          onBorrow={onBorrowBook}
          onEdit={(book) => {
            setEditingBook(book);
            setIsFormOpen(true);
          }}
          onDelete={setDeletingBook}
        />
      )}

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={sortedState.sorted.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <BookDetailModal
        book={selectedBook}
        loans={loans}
        onClose={() => setSelectedBook(null)}
        onBorrow={onBorrowBook}
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
