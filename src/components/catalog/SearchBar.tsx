import React from 'react';
import { Clock, Cpu, Footprints, Search, Sparkles, X } from 'lucide-react';
import { BinarySearchKey } from '../../algorithms/searching';
import { SearchAlgorithmType } from '../../types';
import { getCriterionInputConfig } from '../../utils/formatters';

interface SearchBarProps {
  query: string;
  activeQuery: string;
  onQueryChange: (val: string) => void;
  onExecuteSearch: () => void;
  onClearSearch: () => void;
  onPickSample: () => void;
  algorithm: SearchAlgorithmType;
  onAlgorithmChange: (alg: SearchAlgorithmType) => void;
  searchField: BinarySearchKey;
  onSearchFieldChange: (key: BinarySearchKey) => void;
  executionTimeMs: number;
  comparisonsCount: number;
  resultCount: number;
  totalDatasetCount: number;
}

export function SearchBar({
  query,
  activeQuery,
  onQueryChange,
  onExecuteSearch,
  onClearSearch,
  onPickSample,
  algorithm,
  onAlgorithmChange,
  searchField,
  onSearchFieldChange,
  executionTimeMs,
  comparisonsCount,
  resultCount,
  totalDatasetCount,
}: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onExecuteSearch();
  };

  const bigO =
    algorithm === 'linear'
      ? 'O(n)'
      : algorithm === 'jump'
        ? 'O(√n)'
        : 'O(log n)';
  const algorithmLabel =
    algorithm === 'linear'
      ? 'Linear Search'
      : algorithm === 'jump'
        ? 'Jump Search'
        : 'Binary Search';
  const hasActiveSearch = activeQuery.trim().length > 0;
  const inputConfig = getCriterionInputConfig(searchField);

  return (
    <div className="space-y-3 rounded-xl border border-parchment-200 bg-white p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <select
          aria-label="Atribut Pencarian"
          value={searchField}
          onChange={(e) => {
            const nextField = e.target.value as BinarySearchKey;
            const nextCfg = getCriterionInputConfig(nextField);
            onSearchFieldChange(nextField);
            onQueryChange(nextCfg.sanitize(query));
          }}
          className="rounded-lg border border-slate-200 bg-parchment-50 px-3 py-2.5 text-xs font-semibold text-slate-700 focus:border-emerald-900 focus:outline-none"
        >
          <option value="judul">Kriteria: Judul Buku</option>
          <option value="isbn">Kriteria: Kode ISBN</option>
          <option value="penulis">Kriteria: Penulis</option>
          <option value="tahunTerbit">Kriteria: Tahun Terbit</option>
        </select>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            inputMode={inputConfig.inputMode}
            value={query}
            onChange={(e) => onQueryChange(inputConfig.sanitize(e.target.value))}
            placeholder={inputConfig.placeholder}
            className="w-full rounded-lg border border-slate-200 bg-parchment-50/50 py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-900"
          />
          {query && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-1.5">
            <label
              htmlFor="catalog-search-algo"
              className="hidden text-[11px] font-semibold text-slate-500 sm:inline"
            >
              Algoritma:
            </label>
            <select
              id="catalog-search-algo"
              aria-label="Pilih Algoritma Pencarian"
              value={algorithm}
              onChange={(e) => onAlgorithmChange(e.target.value as SearchAlgorithmType)}
              className="rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-bold text-emerald-950 focus:border-emerald-900 focus:outline-none"
            >
              <option value="linear">Linear Search — O(n)</option>
              <option value="jump">Jump Search — O(√n)</option>
              <option value="binary">Binary Search — O(log n)</option>
            </select>
          </div>

          <button
            type="button"
            onClick={onPickSample}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100"
            title="Ambil contoh judul/ISBN nyata dari inventaris untuk demo pencarian"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Ambil Contoh dari Inventaris</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-950"
          >
            <Search className="h-3.5 w-3.5 text-amber-300" />
            <span>Cari Buku</span>
          </button>
        </div>
      </form>

      {/* Kartu Metrik Proses Pencarian */}
      <div
        aria-label="Kartu Metrik Proses Pencarian"
        className={`rounded-xl border p-3.5 transition ${
          hasActiveSearch
            ? 'border-emerald-200 bg-emerald-50/50'
            : 'border-parchment-200 bg-parchment-50/70'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-parchment-200/80 pb-2.5">
          <div className="flex items-center gap-2 text-xs">
            <Cpu className="h-4 w-4 text-emerald-800" />
            <span className="font-bold text-slate-900">
              Metrik Proses Pencarian ({algorithmLabel})
            </span>
            <span className="rounded bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
              {bigO}
            </span>
          </div>
          <span className="text-xs font-medium text-slate-600">
            {hasActiveSearch ? (
              resultCount > 0 ? (
                <>
                  Ditemukan dalam{' '}
                  <strong className="font-mono text-emerald-900">
                    {comparisonsCount.toLocaleString('id-ID')} langkah
                  </strong>{' '}
                  dari{' '}
                  <strong className="font-mono text-slate-900">
                    {totalDatasetCount.toLocaleString('id-ID')} buku
                  </strong>
                </>
              ) : (
                <>
                  Diperiksa{' '}
                  <strong className="font-mono text-rose-700">
                    {comparisonsCount.toLocaleString('id-ID')} langkah
                  </strong>{' '}
                  dari {totalDatasetCount.toLocaleString('id-ID')} buku (tidak ditemukan)
                </>
              )
            ) : (
              <>
                Siap mencari di{' '}
                <strong className="font-mono text-slate-900">
                  {totalDatasetCount.toLocaleString('id-ID')}
                </strong>{' '}
                entri buku — masukkan kata kunci lalu klik <strong>Cari Buku</strong>
              </>
            )}
          </span>
        </div>

        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          <div className="rounded-lg bg-white px-3 py-2 shadow-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Algoritma
            </p>
            <p className="mt-0.5 text-xs font-bold text-slate-900">
              {algorithmLabel}{' '}
              <span className="font-mono text-emerald-800">({bigO})</span>
            </p>
          </div>

          <div className="rounded-lg bg-white px-3 py-2 shadow-xs">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Clock className="h-3 w-3 text-emerald-700" />
              <span>Waktu Proses</span>
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-emerald-800">
              {executionTimeMs.toFixed(4)} ms
            </p>
          </div>

          <div className="rounded-lg bg-white px-3 py-2 shadow-xs">
            <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              <Footprints className="h-3 w-3 text-amber-600" />
              <span>Langkah / Iterasi</span>
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-slate-900">
              {comparisonsCount.toLocaleString('id-ID')} langkah
            </p>
          </div>

          <div className="rounded-lg bg-white px-3 py-2 shadow-xs">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Buku Ditemukan
            </p>
            <p className="mt-0.5 font-mono text-sm font-bold text-indigo-800">
              {resultCount.toLocaleString('id-ID')} buku
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
