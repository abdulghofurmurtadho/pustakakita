import { ChevronLeft, ChevronRight } from 'lucide-react';

export type PageSizeOption = 25 | 50 | 100;

interface PaginationProps {
  currentPage: number;
  pageSize: PageSizeOption;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: PageSizeOption) => void;
  itemLabel?: string;
}

const PAGE_SIZES: PageSizeOption[] = [25, 50, 100];

export function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'buku',
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, currentPage), totalPages);
  const startItem = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, safePage * pageSize);

  const visiblePages: number[] = [];
  const startPage = Math.max(1, safePage - 2);
  const endPage = Math.min(totalPages, safePage + 2);
  for (let p = startPage; p <= endPage; p += 1) {
    visiblePages.push(p);
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
        <span>
          Menampilkan{' '}
          <strong className="font-mono text-slate-900">
            {startItem.toLocaleString('id-ID')}–{endItem.toLocaleString('id-ID')}
          </strong>{' '}
          dari{' '}
          <strong className="font-mono text-slate-900">
            {totalItems.toLocaleString('id-ID')}
          </strong>{' '}
          {itemLabel}
        </span>

        <div className="flex items-center gap-1.5">
          <label htmlFor="page-size-select" className="text-slate-500">
            Per halaman:
          </label>
          <select
            id="page-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value) as PageSizeOption)}
            className="rounded-md border border-slate-200 bg-parchment-50 px-2 py-1 font-mono text-xs font-semibold text-slate-800 focus:border-emerald-900 focus:outline-none"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-parchment-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman sebelumnya"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Prev</span>
        </button>

        {startPage > 1 && (
          <>
            <button
              type="button"
              onClick={() => onPageChange(1)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-700 hover:bg-parchment-100"
            >
              1
            </button>
            {startPage > 2 && <span className="px-1 text-xs text-slate-400">...</span>}
          </>
        )}

        {visiblePages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold transition ${
              p === safePage
                ? 'bg-emerald-900 text-white shadow-sm'
                : 'border border-slate-200 text-slate-700 hover:bg-parchment-100'
            }`}
          >
            {p}
          </button>
        ))}

        {endPage < totalPages && (
          <>
            {endPage < totalPages - 1 && (
              <span className="px-1 text-xs text-slate-400">...</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(totalPages)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs font-medium text-slate-700 hover:bg-parchment-100"
            >
              {totalPages}
            </button>
          </>
        )}

        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-parchment-100 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Halaman berikutnya"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
