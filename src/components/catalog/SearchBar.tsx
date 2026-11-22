import { Cpu, Search, X } from 'lucide-react';
import { BinarySearchKey } from '../../algorithms/searchAlgorithms';
import { SearchAlgorithmType } from '../../types';

interface SearchBarProps {
  query: string;
  onQueryChange: (val: string) => void;
  algorithm: SearchAlgorithmType;
  onAlgorithmChange: (alg: SearchAlgorithmType) => void;
  binarySearchKey: BinarySearchKey;
  onBinarySearchKeyChange: (key: BinarySearchKey) => void;
  executionTimeMs: number;
  comparisonsCount: number;
  resultCount: number;
}

export function SearchBar({
  query,
  onQueryChange,
  algorithm,
  onAlgorithmChange,
  binarySearchKey,
  onBinarySearchKeyChange,
  executionTimeMs,
  comparisonsCount,
  resultCount,
}: SearchBarProps) {
  return (
    <div className="rounded-xl border border-parchment-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder={
              algorithm === 'binary'
                ? `Cari awalan ${binarySearchKey} (Binary Search membutuhkan array terurut)...`
                : 'Cari judul buku, penulis, atau ISBN...'
            }
            className="w-full rounded-lg border border-slate-200 bg-parchment-50/50 py-2.5 pl-10 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
          {query && (
            <button
              type="button"
              onClick={() => onQueryChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Hapus pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-parchment-50 p-1">
            <button
              type="button"
              onClick={() => onAlgorithmChange('linear')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                algorithm === 'linear'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Linear Search
            </button>
            <button
              type="button"
              onClick={() => onAlgorithmChange('binary')}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                algorithm === 'binary'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Binary Search
            </button>
          </div>

          {algorithm === 'binary' && (
            <select
              value={binarySearchKey}
              onChange={(e) => onBinarySearchKeyChange(e.target.value as BinarySearchKey)}
              aria-label="Kunci Binary Search"
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-slate-900 focus:outline-none"
            >
              <option value="judul">Kunci: Judul</option>
              <option value="penulis">Kunci: Penulis</option>
              <option value="isbn">Kunci: ISBN</option>
            </select>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-parchment-100 pt-2.5 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-amber-600" />
          <span>
            Algoritma aktif:{' '}
            <strong className="text-slate-800">
              {algorithm === 'linear' ? 'Linear Search O(n)' : 'Binary Search O(log n)'}
            </strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono text-[11px]">
          <span>
            Hasil: <strong className="text-slate-900">{resultCount}</strong> buku
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Perbandingan: <strong className="text-slate-900">{comparisonsCount}</strong>
          </span>
          <span className="text-slate-300">|</span>
          <span>
            Waktu: <strong className="text-emerald-700">{executionTimeMs.toFixed(3)} ms</strong>
          </span>
        </div>
      </div>
    </div>
  );
}
