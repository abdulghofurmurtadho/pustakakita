import { LayoutGrid, List, SlidersHorizontal } from 'lucide-react';
import { BOOK_CATEGORIES } from '../../data/initialSeed';
import { BookCategory, SortAlgorithmType, SortField, SortOrder } from '../../types';

export type AvailabilityFilter = 'Semua' | 'Tersedia' | 'Habis';
export type CatalogSortOption =
  | 'judul-asc'
  | 'tahun-desc'
  | 'stok-desc'
  | 'penulis-asc';
export type CatalogViewMode = 'grid' | 'table';

interface FilterPanelProps {
  selectedCategory: BookCategory | 'Semua';
  onCategoryChange: (category: BookCategory | 'Semua') => void;
  availability: AvailabilityFilter;
  onAvailabilityChange: (status: AvailabilityFilter) => void;
  sortOption: CatalogSortOption;
  onSortOptionChange: (option: CatalogSortOption) => void;
  sortAlgorithm: SortAlgorithmType;
  onSortAlgorithmChange: (alg: SortAlgorithmType) => void;
  viewMode: CatalogViewMode;
  onViewModeChange: (mode: CatalogViewMode) => void;
  sortTimeMs: number;
  sortComparisons: number;
}

export function resolveSortParams(option: CatalogSortOption): {
  field: SortField;
  order: SortOrder;
} {
  switch (option) {
    case 'tahun-desc':
      return { field: 'tahunTerbit', order: 'desc' };
    case 'stok-desc':
      return { field: 'stokTersedia', order: 'desc' };
    case 'penulis-asc':
      return { field: 'penulis', order: 'asc' };
    case 'judul-asc':
    default:
      return { field: 'judul', order: 'asc' };
  }
}

export function FilterPanel({
  selectedCategory,
  onCategoryChange,
  availability,
  onAvailabilityChange,
  sortOption,
  onSortOptionChange,
  sortAlgorithm,
  onSortAlgorithmChange,
  viewMode,
  onViewModeChange,
  sortTimeMs,
  sortComparisons,
}: FilterPanelProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span>Filter:</span>
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value as BookCategory | 'Semua')}
          aria-label="Filter Kategori"
          className="rounded-lg border border-slate-200 bg-parchment-50/70 px-3 py-1.5 text-xs font-medium text-slate-700 focus:border-emerald-900 focus:outline-none"
        >
          <option value="Semua">Semua Kategori</option>
          {BOOK_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <div className="inline-flex rounded-lg border border-slate-200 bg-parchment-50 p-0.5">
          {(['Semua', 'Tersedia', 'Habis'] as AvailabilityFilter[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onAvailabilityChange(item)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                availability === item
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2.5 xl:justify-end">
        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="Algoritma Sort"
            value={sortAlgorithm}
            onChange={(e) => onSortAlgorithmChange(e.target.value as SortAlgorithmType)}
            className="rounded-lg border border-slate-200 bg-parchment-50/70 px-2.5 py-1.5 text-xs font-semibold text-emerald-900 focus:border-emerald-900 focus:outline-none"
          >
            <option value="quick">Quick Sort O(n log n)</option>
            <option value="merge">Merge Sort O(n log n)</option>
            <option value="insertion">Insertion Sort O(n²)</option>
          </select>

          <select
            id="catalog-sort"
            aria-label="Urutan Buku"
            value={sortOption}
            onChange={(e) => onSortOptionChange(e.target.value as CatalogSortOption)}
            className="rounded-lg border border-slate-200 bg-parchment-50/70 px-3 py-1.5 text-xs font-medium text-slate-800 focus:border-emerald-900 focus:outline-none"
          >
            <option value="judul-asc">Judul (A–Z)</option>
            <option value="tahun-desc">Tahun Terbit (Terbaru)</option>
            <option value="stok-desc">Stok Terbanyak</option>
            <option value="penulis-asc">Penulis (A–Z)</option>
          </select>

          <span className="rounded-md bg-parchment-100 px-2 py-1 font-mono text-[11px] text-slate-600">
            {sortTimeMs.toFixed(2)} ms · {sortComparisons.toLocaleString('id-ID')} cmp
          </span>
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-parchment-50 p-0.5">
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Tampilan Grid"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Grid</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition ${
              viewMode === 'table'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            aria-label="Tampilan Tabel"
          >
            <List className="h-3.5 w-3.5" />
            <span>Tabel</span>
          </button>
        </div>
      </div>
    </div>
  );
}
