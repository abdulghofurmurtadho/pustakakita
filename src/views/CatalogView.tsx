import { useEffect, useMemo, useState } from 'react';
import { Database, Plus } from 'lucide-react';
import {
  BinarySearchKey,
  binarySearchBooks,
  linearSearchBooks,
} from '../algorithms/searching';
import {
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
import { useDebounce } from '../hooks/useDebounce';
import {
  BenchmarkScale,
  Book,
  BookCategory,
  BookInput,
  SearchAlgorithmType,
  SortAlgorithmType,
} from '../types';

interface CatalogViewProps {
  onBorrowBook: (book: Book) => void;
}

const PRESET_COUNTS: { count: BenchmarkScale; label: string }[] = [
  { count: 1000, label: 'Muat 1.000 Buku (Default)' },
  { count: 5000, label: 'Muat 5.000 Buku' },
  { count: 10000, label: 'Muat 10.000 Buku' },
];

export function CatalogView({ onBorrowBook }: CatalogViewProps) {
  const {
    books,
    loans,
    addBook,
    updateBook,
    deleteBook,
    loadPresetDataset,
  } = useLibrary();
  const { addToast } = useToast();

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 150);
  const [searchAlgorithm, setSearchAlgorithm] =
    useState<SearchAlgorithmType>('linear');
  const [binarySearchKey, setBinarySearchKey] = useState<BinarySearchKey>('judul');
  const [selectedCategory, setSelectedCategory] = useState<BookCategory | 'Semua'>(
    'Semua',
  );
  const [availability, setAvailability] = useState<AvailabilityFilter>('Semua');
  const [sortOption, setSortOption] = useState<CatalogSortOption>('judul-asc');
  const [sortAlgorithm, setSortAlgorithm] = useState<SortAlgorithmType>('quick');
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
    if (searchAlgorithm === 'binary') {
      return binarySearchBooks(books, debouncedQuery, binarySearchKey);
    }
    return linearSearchBooks(books, debouncedQuery);
  }, [books, debouncedQuery, searchAlgorithm, binarySearchKey]);

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

  const sortedResult = useMemo(() => {
    const { field, order } = resolveSortParams(sortOption);
    if (sortAlgorithm === 'merge') {
      return sortBooksWithMergeSort(filteredBooks, field, order);
    }
    if (sortAlgorithm === 'insertion') {
      return sortBooksWithInsertionSort(filteredBooks, field, order);
    }
    return sortBooksWithQuickSort(filteredBooks, field, order);
  }, [filteredBooks, sortOption, sortAlgorithm]);

  // Reset to page 1 when search, filters, or dataset changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedQuery, selectedCategory, availability, sortOption, books.length, pageSize]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResult.sorted.slice(start, start + pageSize);
  }, [sortedResult.sorted, currentPage, pageSize]);

  const activeLoanCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < loans.length; i += 1) {
      if (loans[i].status === 'Dipinjam') {
        map.set(loans[i].bookId, (map.get(loans[i].bookId) || 0) + 1);
      }
    }
    return map;
  }, [loans]);

  const handleLoadPreset = (count: BenchmarkScale) => {
    const res = loadPresetDataset(count);
    if (res.success) {
      setCurrentPage(1);
      addToast(res.message, 'success');
    }
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
            Eksplorasi Koleksi · Pagination Aktif
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Katalog Buku PustakaKita
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Jelajahi {books.length.toLocaleString('id-ID')} judul dengan pencarian Linear vs
            Binary Search serta pengurutan Quick/Merge/Insertion Sort murni.
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

      {/* Quick Dataset Size Preset Bar */}
      <div className="flex flex-col gap-2.5 rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <Database className="h-4 w-4 text-emerald-800" />
          <span>
            Preset Dataset Katalog (Aktif:{' '}
            <strong className="font-mono text-slate-900">
              {books.length.toLocaleString('id-ID')}
            </strong>{' '}
            buku):
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESET_COUNTS.map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => handleLoadPreset(preset.count)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                books.length === preset.count
                  ? 'border-emerald-900 bg-emerald-900 text-white'
                  : 'border-slate-200 bg-parchment-50 text-slate-700 hover:bg-parchment-100'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <SearchBar
        query={query}
        onQueryChange={setQuery}
        algorithm={searchAlgorithm}
        onAlgorithmChange={setSearchAlgorithm}
        binarySearchKey={binarySearchKey}
        onBinarySearchKeyChange={setBinarySearchKey}
        executionTimeMs={searchResult.executionTimeMs}
        comparisonsCount={searchResult.comparisonsCount}
        resultCount={sortedResult.sorted.length}
      />

      <FilterPanel
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        availability={availability}
        onAvailabilityChange={setAvailability}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
        sortAlgorithm={sortAlgorithm}
        onSortAlgorithmChange={setSortAlgorithm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        sortTimeMs={sortedResult.metrics.executionTimeMs}
        sortComparisons={sortedResult.metrics.comparisonsCount}
      />

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={sortedResult.sorted.length}
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
        totalItems={sortedResult.sorted.length}
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
