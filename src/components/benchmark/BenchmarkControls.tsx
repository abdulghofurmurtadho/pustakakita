import {
  Activity,
  Database,
  Download,
  FileJson,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import { BinarySearchKey } from '../../algorithms/searching';
import { BenchmarkScale, DataCondition, SortField, SortOrder } from '../../types';

interface BenchmarkControlsProps {
  datasetSize: BenchmarkScale;
  onSelectDatasetSize: (size: BenchmarkScale) => void;
  dataCondition: DataCondition;
  onSelectDataCondition: (condition: DataCondition) => void;
  sortField: SortField;
  onSortFieldChange: (field: SortField) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  onRunSortBenchmark: () => void;
  onRunFullMultiScale: () => void;
  searchKeyword: string;
  onSearchKeywordChange: (keyword: string) => void;
  searchKey: BinarySearchKey;
  onSearchKeyChange: (key: BinarySearchKey) => void;
  onRunSearchBenchmark: () => void;
  onPickSampleKeyword: () => void;
  onDownloadCsv: () => void;
  onDownloadJson: () => void;
}

const DATASET_SCALES: { value: BenchmarkScale; label: string; tag: string }[] = [
  { value: 1000, label: '1.000 Buku', tag: 'Minimal' },
  { value: 5000, label: '5.000 Buku', tag: 'Menengah' },
  { value: 10000, label: '10.000 Buku', tag: 'Maksimal' },
];

const DATA_CONDITIONS: {
  value: DataCondition;
  label: string;
  desc: string;
}[] = [
  { value: 'random', label: 'Random Order', desc: 'Average Case' },
  { value: 'reversed', label: 'Reversed Order', desc: 'Worst Case Insertion' },
  { value: 'nearly_sorted', label: 'Nearly Sorted', desc: 'Best Case Insertion' },
];

export function BenchmarkControls({
  datasetSize,
  onSelectDatasetSize,
  dataCondition,
  onSelectDataCondition,
  sortField,
  onSortFieldChange,
  sortOrder,
  onSortOrderChange,
  onRunSortBenchmark,
  onRunFullMultiScale,
  searchKeyword,
  onSearchKeywordChange,
  searchKey,
  onSearchKeyChange,
  onRunSearchBenchmark,
  onPickSampleKeyword,
  onDownloadCsv,
  onDownloadJson,
}: BenchmarkControlsProps) {
  return (
    <div className="space-y-4">
      {/* Dataset Scale & Multi-Scale Trigger */}
      <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-900">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-slate-900">
                Skala Pengujian Dataset (1.000 – 10.000 Entri)
              </h3>
              <p className="text-xs text-slate-500">
                Pilih skala tunggal atau jalankan pengujian beruntun untuk membentuk kurva
                pertumbuhan kompleksitas O(n log n) vs O(n²).
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {DATASET_SCALES.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => onSelectDatasetSize(item.value)}
                className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 font-mono text-xs font-semibold transition ${
                  datasetSize === item.value
                    ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm'
                    : 'border-slate-200 bg-parchment-50 text-slate-700 hover:bg-parchment-100'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] ${
                    datasetSize === item.value
                      ? 'bg-white/15 text-amber-300'
                      : 'bg-slate-200/70 text-slate-600'
                  }`}
                >
                  {item.tag}
                </span>
              </button>
            ))}

            <button
              type="button"
              onClick={onRunFullMultiScale}
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
            >
              <Activity className="h-4 w-4" />
              <span>Run Full Benchmark (1.000 → 5.000 → 10.000)</span>
            </button>
          </div>
        </div>

        {/* Data condition & Report export row */}
        <div className="mt-4 flex flex-col gap-3 border-t border-parchment-200 pt-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-600">
              Kondisi Data Awal:
            </span>
            {DATA_CONDITIONS.map((cond) => (
              <button
                key={cond.value}
                type="button"
                onClick={() => onSelectDataCondition(cond.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  dataCondition === cond.value
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-parchment-50 text-slate-700 hover:bg-parchment-100'
                }`}
              >
                <span>{cond.label}</span>
                <span className="ml-1.5 opacity-75">({cond.desc})</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onDownloadCsv}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Unduh Laporan CSV</span>
            </button>
            <button
              type="button"
              onClick={onDownloadJson}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-parchment-50"
            >
              <FileJson className="h-3.5 w-3.5" />
              <span>Unduh Laporan JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Two side-by-side control panels: Sorting & Searching */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Sorting Panel */}
        <div className="flex flex-col justify-between rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div>
            <h3 className="font-serif text-base font-bold text-slate-900">
              Panel Uji Pengurutan (Sorting)
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Uji Quick Sort, Merge Sort, dan Insertion Sort pada{' '}
              <strong className="font-mono">{datasetSize.toLocaleString('id-ID')}</strong>{' '}
              entri ({dataCondition}).
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="bench-sort-field"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kunci Pengurutan
                </label>
                <select
                  id="bench-sort-field"
                  value={sortField}
                  onChange={(e) => onSortFieldChange(e.target.value as SortField)}
                  className="w-full rounded-lg border border-slate-200 bg-parchment-50/70 px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-900 focus:outline-none"
                >
                  <option value="judul">Judul Buku</option>
                  <option value="tahunTerbit">Tahun Terbit</option>
                  <option value="stokTersedia">Stok Tersedia</option>
                  <option value="penulis">Penulis</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="bench-sort-order"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Arah Urutan
                </label>
                <select
                  id="bench-sort-order"
                  value={sortOrder}
                  onChange={(e) => onSortOrderChange(e.target.value as SortOrder)}
                  className="w-full rounded-lg border border-slate-200 bg-parchment-50/70 px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-900 focus:outline-none"
                >
                  <option value="asc">Ascending (A–Z / Kecil–Besar)</option>
                  <option value="desc">Descending (Z–A / Besar–Kecil)</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRunSortBenchmark}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Play className="h-3.5 w-3.5 text-amber-300" />
            <span>Jalankan All Sort Algorithms ({datasetSize.toLocaleString('id-ID')})</span>
          </button>
        </div>

        {/* Searching Panel */}
        <div className="flex flex-col justify-between rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-serif text-base font-bold text-slate-900">
                  Panel Uji Pencarian (Searching)
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Bandingkan Linear Search O(n) vs Binary Search O(log n) pada 4 posisi
                  skenario &amp; kata kunci kustom.
                </p>
              </div>
              <button
                type="button"
                onClick={onPickSampleKeyword}
                className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100"
              >
                <Sparkles className="h-3 w-3" />
                <span>Sampel Acak</span>
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <label
                  htmlFor="bench-search-keyword"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Kata Kunci Pencarian
                </label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <input
                    id="bench-search-keyword"
                    type="text"
                    value={searchKeyword}
                    onChange={(e) => onSearchKeywordChange(e.target.value)}
                    placeholder="Masukkan judul / ISBN / penulis..."
                    className="w-full rounded-lg border border-slate-200 bg-parchment-50/70 py-2 pl-8 pr-3 text-xs text-slate-900 focus:border-emerald-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label
                  htmlFor="bench-search-key"
                  className="mb-1 block text-xs font-semibold text-slate-700"
                >
                  Atribut Target
                </label>
                <select
                  id="bench-search-key"
                  value={searchKey}
                  onChange={(e) => onSearchKeyChange(e.target.value as BinarySearchKey)}
                  className="w-full rounded-lg border border-slate-200 bg-parchment-50/70 px-3 py-2 text-xs font-medium text-slate-800 focus:border-emerald-900 focus:outline-none"
                >
                  <option value="judul">Judul</option>
                  <option value="isbn">ISBN</option>
                  <option value="penulis">Penulis</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onRunSearchBenchmark}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-emerald-950"
          >
            <Search className="h-3.5 w-3.5 text-amber-300" />
            <span>Bandingkan Linear vs Binary Search</span>
          </button>
        </div>
      </div>
    </div>
  );
}
