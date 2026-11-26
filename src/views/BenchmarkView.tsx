import {
  Activity,
  ArrowRight,
  ArrowUpDown,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Cpu,
  Database,
  Download,
  FileJson,
  Footprints,
  ListOrdered,
  Play,
  Repeat,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { BinarySearchKey } from '../algorithms/searching';
import { ExecutionStepVisualizer } from '../components/benchmark/ExecutionStepVisualizer';
import { PerformanceChart } from '../components/benchmark/PerformanceChart';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';
import { useBenchmark } from '../hooks/useBenchmark';
import {
  DatasetSliceScale,
  SearchAlgorithmType,
  SortAlgorithmType,
  SortField,
  SortOrder,
} from '../types';
import { getTodayDateString } from '../utils/dateUtils';
import { getCriterionInputConfig } from '../utils/formatters';

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

const SLICE_SCALES: {
  value: DatasetSliceScale;
  title: string;
  subtitle: string;
}[] = [
  { value: 50, title: 'Data Kecil (50 Buku)', subtitle: '50 entri nyata inventaris' },
  {
    value: 1000,
    title: 'Data Menengah (1.000 Buku)',
    subtitle: '1.000 entri nyata inventaris',
  },
  {
    value: 10000,
    title: 'Data Besar (10.000 Buku)',
    subtitle: 'Semua data inventaris nyata',
  },
];

export function BenchmarkView() {
  const { addToast } = useToast();
  const {
    inventoryBooks,
    // Independent Sort Module
    sortScale,
    setSortScale,
    sortAlgorithm,
    setSortAlgorithm,
    sortField,
    setSortField,
    sortFilterQuery,
    setSortFilterQuery,
    sortOrder,
    setSortOrder,
    sortReport,
    executeSingleSortModule,
    pickSortSampleKeyword,
    // Independent Search Module
    searchScale,
    setSearchScale,
    searchAlgorithm,
    setSearchAlgorithm,
    searchKey,
    setSearchKey,
    searchKeyword,
    setSearchKeyword,
    searchReport,
    executeSingleSearchModule,
    // Comparison & Export
    sortMetrics,
    multiScaleResults,
    searchComparison,
    positionSearchResults,
    executeFullMultiScaleBenchmark,
    pickSampleKeyword,
    buildCsvReport,
    buildJsonReport,
  } = useBenchmark();

  const sortInputConfig = getCriterionInputConfig(sortField);
  const searchInputConfig = getCriterionInputConfig(searchKey);

  const handleRunSortModule = () => {
    const rep = executeSingleSortModule(
      sortScale,
      sortAlgorithm,
      sortField,
      sortOrder,
      sortFilterQuery,
    );
    addToast(
      `${rep.algorithmName} selesai mengurutkan ${rep.itemCount.toLocaleString('id-ID')} buku nyata dalam ${rep.executionTimeMs.toFixed(4)} ms.`,
      'success',
    );
  };

  const handleRunFullMultiScale = () => {
    executeFullMultiScaleBenchmark();
    addToast(
      'Full Multi-Scale Benchmark (1.000 → 5.000 → 10.000) selesai dijalankan.',
      'success',
    );
  };

  const handleRunSearchModule = () => {
    const rep = executeSingleSearchModule(
      searchScale,
      searchAlgorithm,
      searchKey,
      searchKeyword,
    );
    addToast(
      `${rep.algorithmName} selesai memeriksa ${rep.comparisonsCount.toLocaleString('id-ID')} langkah dalam ${rep.executionTimeMs.toFixed(4)} ms.`,
      'success',
    );
  };

  const handleDownloadCsv = () => {
    const csv = buildCsvReport();
    const stamp = getTodayDateString().replace(/-/g, '');
    triggerDownload(csv, `pustakakita_benchmark_${stamp}.csv`, 'text/csv;charset=utf-8;');
    addToast('Laporan benchmark CSV berhasil diunduh.', 'success');
  };

  const handleDownloadJson = () => {
    const json = buildJsonReport();
    const stamp = getTodayDateString().replace(/-/g, '');
    triggerDownload(json, `pustakakita_benchmark_${stamp}.json`, 'application/json');
    addToast('Laporan benchmark JSON berhasil diunduh.', 'success');
  };

  const latestBook = inventoryBooks[0];

  return (
    <div className="space-y-8">
      {/* Page Header & Single Source of Truth Sync Status */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Single Source of Truth · Transparansi Algoritma 4 Tahap
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Laboratorium Independen Sorting &amp; Searching
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Seluruh pengujian membaca langsung dari{' '}
            <strong className="text-slate-800">
              {inventoryBooks.length.toLocaleString('id-ID')} data buku nyata di
              Inventaris
            </strong>{' '}
            dengan urutan proses transparan:{' '}
            <strong>1. Before → 2. Step-by-Step Trace → 3. After → 4. Analisis Perbandingan</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleRunFullMultiScale}
            className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-amber-700"
          >
            <Activity className="h-3.5 w-3.5" />
            <span>Run Full Benchmark (1.000 → 5.000 → 10.000)</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
          >
            <FileJson className="h-3.5 w-3.5" />
            <span>Unduh JSON</span>
          </button>
        </div>
      </div>

      {/* Single Source of Truth Live Banner */}
      <div className="flex flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-950 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 shrink-0 text-emerald-800" />
          <span>
            <strong>Sumber Data Terhubung (Inventaris Nyata):</strong> Total{' '}
            <strong className="font-mono">
              {inventoryBooks.length.toLocaleString('id-ID')}
            </strong>{' '}
            buku aktif. Setiap penambahan/edit/hapus buku di menu Inventaris otomatis
            tersinkronisasi ke modul di bawah ini.
          </span>
        </div>
        {latestBook && (
          <span className="shrink-0 rounded-md bg-white px-2.5 py-1 font-mono text-[11px] text-slate-700 shadow-xs">
            Entri #0: {latestBook.id} · {latestBook.isbn}
          </span>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODUL 1: MODUL SORTING INDEPENDEN (1. Before -> 2. Step-by-Step -> 3. After -> 4. Analisis) */}
      {/* ===================================================================== */}
      <section
        aria-label="Modul Sorting Independen"
        className="space-y-5 rounded-2xl border-2 border-indigo-200/80 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-parchment-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-900 text-amber-300">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                Modul 1 · Independen
              </span>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Modul Pengurutan Data (Sorting)
              </h2>
            </div>
          </div>
          <Badge variant="indigo">
            Diproses: {sortReport.itemCount.toLocaleString('id-ID')} dari{' '}
            {sortReport.totalSliceCount.toLocaleString('id-ID')} Buku Slice
          </Badge>
        </div>

        {/* Controls: Scale, Criterion + Dynamic Input Box, Order, Algorithm */}
        <div className="space-y-4 rounded-xl border border-parchment-200 bg-parchment-50/60 p-4">
          <div>
            <span className="mb-2 block text-xs font-bold text-slate-700">
              1. Pilih Skala Data (Potongan Langsung dari Inventaris Nyata):
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SLICE_SCALES.map((sc) => {
                const isSelected = sortScale === sc.value;
                const countDisplay =
                  sc.value >= 10000
                    ? `${inventoryBooks.length.toLocaleString('id-ID')} Buku (Semua Data)`
                    : sc.title;
                return (
                  <button
                    key={sc.value}
                    type="button"
                    onClick={() => {
                      setSortScale(sc.value);
                      executeSingleSortModule(
                        sc.value,
                        sortAlgorithm,
                        sortField,
                        sortOrder,
                        sortFilterQuery,
                      );
                    }}
                    className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-indigo-900 bg-indigo-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-parchment-100'
                    }`}
                  >
                    <span className="text-xs font-bold">{countDisplay}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? 'text-indigo-200' : 'text-slate-500'
                      }`}
                    >
                      {sc.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pasangan "Pilih Kriteria + Kotak Input Ketik Dinamis" untuk Modul Sorting */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label
                htmlFor="mod-sort-field"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                2. Pilih Kriteria Sorting
              </label>
              <select
                id="mod-sort-field"
                value={sortField}
                onChange={(e) => {
                  const nextField = e.target.value as SortField;
                  const nextCfg = getCriterionInputConfig(nextField);
                  const sanitizedKw = nextCfg.sanitize(sortFilterQuery);
                  setSortField(nextField);
                  setSortFilterQuery(sanitizedKw);
                  executeSingleSortModule(
                    sortScale,
                    sortAlgorithm,
                    nextField,
                    sortOrder,
                    sanitizedKw,
                  );
                }}
                className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-900 focus:outline-none"
              >
                <option value="judul">Judul Buku</option>
                <option value="isbn">ISBN</option>
                <option value="penulis">Penulis</option>
                <option value="tahunTerbit">Tahun Terbit</option>
              </select>
            </div>

            <div className="lg:col-span-5">
              <label
                htmlFor="mod-sort-keyword"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                3. Ketik Kata Kunci {sortInputConfig.label} (Opsional / Filter Data yang
                Diurutkan)
              </label>
              <div className="relative">
                <input
                  id="mod-sort-keyword"
                  type="text"
                  inputMode={sortInputConfig.inputMode}
                  value={sortFilterQuery}
                  onChange={(e) => {
                    const cleanVal = sortInputConfig.sanitize(e.target.value);
                    setSortFilterQuery(cleanVal);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunSortModule();
                    }
                  }}
                  placeholder={sortInputConfig.placeholder}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-900"
                />
                {sortFilterQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSortFilterQuery('');
                      executeSingleSortModule(
                        sortScale,
                        sortAlgorithm,
                        sortField,
                        sortOrder,
                        '',
                      );
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Bersihkan kata kunci sorting"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {sortInputConfig.helperHint} (Kosongkan jika ingin mengurutkan seluruh{' '}
                {sortReport.totalSliceCount.toLocaleString('id-ID')} buku).
              </p>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="mod-sort-algo"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                4. Algoritma Sorting
              </label>
              <select
                id="mod-sort-algo"
                value={sortAlgorithm}
                onChange={(e) => {
                  const nextAlg = e.target.value as SortAlgorithmType;
                  setSortAlgorithm(nextAlg);
                  executeSingleSortModule(
                    sortScale,
                    nextAlg,
                    sortField,
                    sortOrder,
                    sortFilterQuery,
                  );
                }}
                className="w-full rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-bold text-indigo-950 focus:border-indigo-900 focus:outline-none"
              >
                <option value="bubble">Bubble Sort — O(n²)</option>
                <option value="insertion">Insertion Sort — O(n²)</option>
                <option value="merge">Merge Sort — O(n log n)</option>
                <option value="quick">Quick Sort — O(n log n)</option>
              </select>
            </div>

            <div className="lg:col-span-2">
              <label
                htmlFor="mod-sort-order"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                5. Arah Urutan
              </label>
              <select
                id="mod-sort-order"
                value={sortOrder}
                onChange={(e) => {
                  const nextOrder = e.target.value as SortOrder;
                  setSortOrder(nextOrder);
                  executeSingleSortModule(
                    sortScale,
                    sortAlgorithm,
                    sortField,
                    nextOrder,
                    sortFilterQuery,
                  );
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:border-indigo-900 focus:outline-none"
              >
                <option value="asc">Ascending (A–Z / Kecil–Besar)</option>
                <option value="desc">Descending (Z–A / Besar–Kecil)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-parchment-200 pt-3">
            <button
              type="button"
              onClick={pickSortSampleKeyword}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Isi Contoh Kata Kunci Sorting</span>
            </button>
            <button
              type="button"
              onClick={handleRunSortModule}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-950"
            >
              <Play className="h-3.5 w-3.5 text-amber-300" />
              <span>Proses &amp; Urutkan Data</span>
            </button>
          </div>
        </div>

        {/* URUTAN TRANSPARAN 1 -> 2 -> 3 -> 4 UNTUK MODUL SORTING */}
        {/* TAHAP 1: BEFORE (DATA AWAL) */}
        <div className="rounded-xl border border-parchment-200 bg-parchment-50/40 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 font-mono text-[10px] text-white">
                1
              </span>
              <span>Kondisi Awal (Before Sorting)</span>
            </span>
            <span className="font-mono text-[11px] text-slate-500">
              {sortReport.filterQuery
                ? `Ditemukan ${sortReport.itemCount} buku cocok dengan "${sortReport.filterQuery}" sebelum diurutkan`
                : `Urutan asli di Inventaris (Menampilkan 10 sampel awal dari ${sortReport.itemCount.toLocaleString('id-ID')} buku)`}
            </span>
          </div>
          <div className="max-h-56 overflow-y-auto rounded-lg border border-parchment-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-parchment-50 text-[10px] font-semibold uppercase text-slate-500">
                  <th className="px-3 py-2 font-mono">Indeks Asli</th>
                  <th className="px-3 py-2">ISBN</th>
                  <th className="px-3 py-2">Judul Buku</th>
                  <th className="px-3 py-2">Penulis</th>
                  <th className="px-3 py-2 text-center">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {sortReport.beforeSlice.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-slate-400">
                      Tidak ada buku yang cocok dengan kata kunci filter &ldquo;
                      {sortReport.filterQuery}&rdquo;.
                    </td>
                  </tr>
                ) : (
                  sortReport.beforeSlice.map((item) => (
                    <tr key={`before-${item.book.id}-${item.originalIndex}`}>
                      <td className="px-3 py-1.5 font-mono font-semibold text-slate-600">
                        [{item.originalIndex}]
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                        {item.book.isbn}
                      </td>
                      <td className="max-w-xs truncate px-3 py-1.5 font-medium text-slate-900">
                        {item.book.judul}
                      </td>
                      <td className="px-3 py-1.5 text-slate-600">{item.book.penulis}</td>
                      <td className="px-3 py-1.5 text-center font-mono text-slate-600">
                        {item.book.tahunTerbit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAHAP 2: PROSES EKSEKUSI (STEP-BY-STEP TRACE) */}
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-indigo-950">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900 font-mono text-[10px] text-white">
                2
              </span>
              <span>
                Proses Eksekusi Langkah demi Langkah ({sortReport.algorithmName} Trace)
              </span>
            </span>
            <span className="font-mono text-xs text-slate-600">
              Menampilkan {sortReport.steps.length} sampel langkah dari total{' '}
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
            {sortReport.steps.length === 0 ? (
              <p className="text-slate-400">
                Dataset sudah terurut atau memiliki kurang dari 2 elemen untuk
                dibandingkan.
              </p>
            ) : (
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
            )}
          </div>
        </div>

        {/* TAHAP 3: AFTER (HASIL AKHIR PENGURUTAN) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 font-mono text-[10px] text-white">
                3
              </span>
              <span>
                Hasil Akhir Pengurutan (After Sorting — {sortReport.field.toUpperCase()}{' '}
                {sortReport.order.toUpperCase()})
              </span>
            </span>
            <span className="font-mono text-[11px] text-emerald-800">
              Terurut rapi ({sortReport.afterSlice.length} teratas dari{' '}
              {sortReport.itemCount.toLocaleString('id-ID')} buku)
            </span>
          </div>
          <div className="max-h-60 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-emerald-50/60 text-[10px] font-semibold uppercase text-emerald-900">
                  <th className="px-3 py-2 font-mono">Urutan Baru</th>
                  <th className="px-3 py-2 font-mono">Indeks Asal</th>
                  <th className="px-3 py-2">ISBN</th>
                  <th className="px-3 py-2">Judul Buku</th>
                  <th className="px-3 py-2">Penulis</th>
                  <th className="px-3 py-2 text-center">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {sortReport.afterSlice.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-6 text-center text-slate-400">
                      Tidak ada hasil untuk ditampilkan.
                    </td>
                  </tr>
                ) : (
                  sortReport.afterSlice.map((item) => (
                    <tr key={`after-${item.book.id}-${item.finalIndex}`}>
                      <td className="px-3 py-1.5 font-mono font-bold text-emerald-800">
                        #{item.finalIndex}
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                        dari [{item.originalIndex}]
                      </td>
                      <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">
                        {item.book.isbn}
                      </td>
                      <td className="max-w-xs truncate px-3 py-1.5 font-semibold text-slate-900">
                        {item.book.judul}
                      </td>
                      <td className="px-3 py-1.5 text-slate-700">{item.book.penulis}</td>
                      <td className="px-3 py-1.5 text-center font-mono font-semibold text-slate-800">
                        {item.book.tahunTerbit}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAHAP 4: ANALISIS PERBANDINGAN EFISIENSI ANTAR ALGORITMA SORTING */}
        <div className="space-y-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-950">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900 font-mono text-[10px] text-white">
                4
              </span>
              <span>
                Analisis &amp; Perbandingan Head-to-Head Ke-4 Algoritma Sorting
              </span>
            </div>
            <Badge variant="indigo">
              Pilihan Aktif: {sortReport.algorithmName} ({sortReport.bigO.average})
            </Badge>
          </div>

          {/* Selected Algorithm Metrics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3 shadow-xs">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                <Clock className="h-3 w-3 text-emerald-700" />
                <span>Waktu ({sortReport.algorithmName})</span>
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
                Avg: {sortReport.bigO.average}{' '}
                <span className="text-[11px] font-normal text-slate-500">
                  (Best {sortReport.bigO.best})
                </span>
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
                <span>Pertukaran / Geser</span>
              </p>
              <p className="mt-1 font-mono text-base font-bold text-amber-800">
                {sortReport.swapsCount.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Head-to-Head Comparison Table of all 4 Sorting Algorithms */}
          <div className="overflow-x-auto rounded-lg border border-indigo-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-indigo-50/70 text-[10px] font-bold uppercase text-indigo-950">
                  <th className="px-3 py-2">Algoritma Sorting</th>
                  <th className="px-3 py-2">Big-O (Rata-rata)</th>
                  <th className="px-3 py-2 text-right">Waktu Eksekusi</th>
                  <th className="px-3 py-2 text-right">Jumlah Perbandingan</th>
                  <th className="px-3 py-2 text-right">Pertukaran / Geser</th>
                  <th className="px-3 py-2 text-center">Status Efisiensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {sortReport.headToHead.map((row) => (
                  <tr
                    key={row.algorithm}
                    className={
                      row.isWinner
                        ? 'bg-emerald-50/70 font-semibold'
                        : row.isSelected
                          ? 'bg-indigo-50/40'
                          : ''
                    }
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

          <div className="space-y-1.5 rounded-lg border border-indigo-200/80 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-emerald-900">
              🏆 Kesimpulan Perbandingan Kecepatan:{' '}
              <span className="font-normal text-slate-800">
                {sortReport.winnerSummary}
              </span>
            </p>
            <p>
              <strong>Analisis Detail ({sortReport.algorithmName}):</strong>{' '}
              {sortReport.narrativeAnalysis}
            </p>
          </div>
        </div>
      </section>

      {/* ===================================================================== */}
      {/* MODUL 2: MODUL SEARCHING INDEPENDEN (1. Before -> 2. Step-by-Step -> 3. After -> 4. Analisis) */}
      {/* ===================================================================== */}
      <section
        aria-label="Modul Searching Independen"
        className="space-y-5 rounded-2xl border-2 border-emerald-200/80 bg-white p-5 shadow-sm sm:p-6"
      >
        <div className="flex flex-col gap-2 border-b border-parchment-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-900 text-amber-300">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
                Modul 2 · Independen
              </span>
              <h2 className="font-serif text-xl font-bold text-slate-900">
                Modul Pencarian Buku (Linear vs Jump vs Binary Search)
              </h2>
            </div>
          </div>
          <Badge variant="emerald">
            Dataset Aktif: {searchReport.itemCount.toLocaleString('id-ID')} Buku Nyata
          </Badge>
        </div>

        {/* Controls: Scale, Criterion + Dynamic Input Box, Algorithm */}
        <div className="space-y-4 rounded-xl border border-parchment-200 bg-parchment-50/60 p-4">
          <div>
            <span className="mb-2 block text-xs font-bold text-slate-700">
              1. Pilih Skala Data (Potongan Langsung dari Inventaris Nyata):
            </span>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {SLICE_SCALES.map((sc) => {
                const isSelected = searchScale === sc.value;
                const countDisplay =
                  sc.value >= 10000
                    ? `${inventoryBooks.length.toLocaleString('id-ID')} Buku (Semua Data)`
                    : sc.title;
                return (
                  <button
                    key={sc.value}
                    type="button"
                    onClick={() => {
                      setSearchScale(sc.value);
                      executeSingleSearchModule(
                        sc.value,
                        searchAlgorithm,
                        searchKey,
                        searchKeyword,
                      );
                    }}
                    className={`flex flex-col items-start rounded-xl border px-3.5 py-2.5 text-left transition ${
                      isSelected
                        ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-800 hover:bg-parchment-100'
                    }`}
                  >
                    <span className="text-xs font-bold">{countDisplay}</span>
                    <span
                      className={`text-[11px] ${
                        isSelected ? 'text-emerald-200' : 'text-slate-500'
                      }`}
                    >
                      {sc.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pasangan "Pilih Kriteria + Kotak Input Ketik Dinamis" untuk Modul Searching */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="lg:col-span-3">
              <label
                htmlFor="mod-search-field"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                2. Pilih Kriteria Pencarian
              </label>
              <select
                id="mod-search-field"
                value={searchKey}
                onChange={(e) => {
                  const nextKey = e.target.value as BinarySearchKey;
                  const nextCfg = getCriterionInputConfig(nextKey);
                  const sanitized = nextCfg.sanitize(searchKeyword);
                  setSearchKey(nextKey);
                  setSearchKeyword(sanitized);
                }}
                className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-950 focus:border-emerald-900 focus:outline-none"
              >
                <option value="judul">Judul Buku</option>
                <option value="isbn">ISBN</option>
                <option value="penulis">Penulis</option>
                <option value="tahunTerbit">Tahun Terbit</option>
              </select>
            </div>

            <div className="lg:col-span-6">
              <label
                htmlFor="mod-search-keyword"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                3. Ketik {searchInputConfig.label} yang Dicari
              </label>
              <div className="relative">
                <input
                  id="mod-search-keyword"
                  type="text"
                  inputMode={searchInputConfig.inputMode}
                  value={searchKeyword}
                  onChange={(e) => {
                    const cleanVal = searchInputConfig.sanitize(e.target.value);
                    setSearchKeyword(cleanVal);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunSearchModule();
                    }
                  }}
                  placeholder={searchInputConfig.placeholder}
                  className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-emerald-900 focus:outline-none focus:ring-1 focus:ring-emerald-900"
                />
                {searchKeyword && (
                  <button
                    type="button"
                    onClick={() => setSearchKeyword('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Bersihkan kata kunci pencarian"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {searchInputConfig.helperHint}
              </p>
            </div>

            <div className="lg:col-span-3">
              <label
                htmlFor="mod-search-algo"
                className="mb-1 block text-xs font-bold text-slate-700"
              >
                4. Algoritma Searching
              </label>
              <select
                id="mod-search-algo"
                value={searchAlgorithm}
                onChange={(e) => {
                  const nextAlg = e.target.value as SearchAlgorithmType;
                  setSearchAlgorithm(nextAlg);
                  executeSingleSearchModule(
                    searchScale,
                    nextAlg,
                    searchKey,
                    searchKeyword,
                  );
                }}
                className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-bold text-emerald-950 focus:border-emerald-900 focus:outline-none"
              >
                <option value="linear">Linear Search — O(n)</option>
                <option value="jump">Jump Search — O(√n)</option>
                <option value="binary">Binary Search — O(log n)</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-parchment-200 pt-3">
            <button
              type="button"
              onClick={() => pickSampleKeyword('random')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100"
              title="Ambil contoh nyata dari slice inventaris aktif sesuai kriteria"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ambil Contoh dari Inventaris</span>
            </button>
            <button
              type="button"
              onClick={handleRunSearchModule}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-950"
            >
              <Search className="h-3.5 w-3.5 text-amber-300" />
              <span>Proses &amp; Cari Buku</span>
            </button>
          </div>
        </div>

        {/* URUTAN TRANSPARAN 1 -> 2 -> 3 -> 4 UNTUK MODUL SEARCHING */}
        {/* TAHAP 1: BEFORE (DATA AWAL SEBELUM SEARCHING) */}
        <div className="rounded-xl border border-parchment-200 bg-parchment-50/40 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-800 font-mono text-[10px] text-white">
                1
              </span>
              <span>Kondisi Awal Dataset (Before Searching)</span>
            </span>
            {searchReport.requiresPreSort ? (
              <Badge variant="indigo">
                Pre-Sorted via Quick Sort ({searchReport.preSortTimeMs.toFixed(2)} ms)
              </Badge>
            ) : (
              <Badge variant="neutral">Urutan Asli Inventaris (Tanpa Pre-Sort)</Badge>
            )}
          </div>

          <p className="mb-2.5 rounded-lg border border-parchment-200 bg-white px-3 py-2 text-xs text-slate-600">
            {searchReport.requiresPreSort ? (
              <>
                <strong>Prasyarat {searchReport.algorithmName}:</strong> Dataset{' '}
                {searchReport.itemCount.toLocaleString('id-ID')} buku diurutkan terlebih
                dahulu berdasarkan <strong>{searchReport.field}</strong> (Ascending)
                sebelum ruang pencarian dilompati/dibelah untuk mencari{' '}
                <strong>&ldquo;{searchReport.query}&rdquo;</strong>.
              </>
            ) : (
              <>
                <strong>Linear Search:</strong> Langsung memindai urutan asli inventaris
                dari indeks <code className="font-mono">[0]</code> hingga{' '}
                <code className="font-mono">[{searchReport.itemCount - 1}]</code> untuk
                mencari <strong>&ldquo;{searchReport.query}&rdquo;</strong> tanpa
                pengurutan awal.
              </>
            )}
          </p>

          <div className="max-h-48 overflow-y-auto rounded-lg border border-parchment-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-parchment-50 text-[10px] font-semibold uppercase text-slate-500">
                  <th className="px-3 py-1.5 font-mono">Indeks</th>
                  <th className="px-3 py-1.5">ISBN</th>
                  <th className="px-3 py-1.5">Judul Buku</th>
                  <th className="px-3 py-1.5">Penulis</th>
                  <th className="px-3 py-1.5 text-center">Tahun</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {searchReport.beforeSlice.map((item) => (
                  <tr key={`s-before-${item.book.id}-${item.originalIndex}`}>
                    <td className="px-3 py-1.5 font-mono font-semibold text-slate-600">
                      [{item.originalIndex}]
                    </td>
                    <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                      {item.book.isbn}
                    </td>
                    <td className="max-w-xs truncate px-3 py-1.5 text-slate-800">
                      {item.book.judul}
                    </td>
                    <td className="px-3 py-1.5 text-slate-600">{item.book.penulis}</td>
                    <td className="px-3 py-1.5 text-center font-mono text-slate-600">
                      {item.book.tahunTerbit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TAHAP 2: PROSES EKSEKUSI (STEP-BY-STEP SEARCH TRACE) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/20 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-950">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-900 font-mono text-[10px] text-white">
                2
              </span>
              <span>
                Proses Eksekusi Langkah demi Langkah ({searchReport.algorithmName} Trace)
              </span>
            </span>
            <span className="font-mono text-xs text-slate-600">
              Total pemeriksaan:{' '}
              <strong>
                {searchReport.comparisonsCount.toLocaleString('id-ID')} langkah
              </strong>{' '}
              dari {searchReport.itemCount.toLocaleString('id-ID')} buku
              {searchReport.jumpStepSize
                ? ` (Ukuran blok lompatan √n = ${searchReport.jumpStepSize})`
                : ''}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto rounded-lg border border-emerald-200/80 bg-white p-3 font-mono text-xs">
            {searchReport.steps.length === 0 ? (
              <p className="text-slate-400">
                Ketik kata kunci pencarian di atas lalu klik Proses &amp; Cari Buku.
              </p>
            ) : (
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
                      Langkah #{st.step}
                    </span>
                    <span>
                      {st.description ||
                        `Indeks [${st.mid}] "${st.value}" ${st.matched ? '→ COCOK!' : ''}`}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>

        {/* TAHAP 3: AFTER (HASIL AKHIR PENCARIAN) */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-4">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-900">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-800 font-mono text-[10px] text-white">
                3
              </span>
              <span>
                Hasil Akhir Pencarian (After Searching — &ldquo;{searchReport.query}
                &rdquo;)
              </span>
            </span>
            {searchReport.foundIndex !== -1 ? (
              <Badge variant="emerald">
                <CheckCircle2 className="h-3 w-3" />
                <span>
                  Ditemukan {searchReport.matchedBooks.length} Buku (Pertama di Indeks #
                  {searchReport.foundIndex})
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
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-white p-4 shadow-xs">
                <div className="flex items-start gap-3.5">
                  <div
                    className="flex h-24 w-16 shrink-0 flex-col justify-between rounded-lg p-2 text-white shadow-xs"
                    style={{ backgroundColor: searchReport.foundBook.coverColor }}
                  >
                    <span className="font-mono text-[9px] font-bold">
                      {searchReport.foundBook.kodeRak}
                    </span>
                    <BookOpen className="h-4 w-4 opacity-85" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="rounded bg-emerald-900 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-300">
                        Indeks Dataset #{searchReport.foundIndex}
                      </span>
                      <span className="rounded bg-parchment-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-700">
                        ID: {searchReport.foundBook.id}
                      </span>
                      <Badge variant="neutral">{searchReport.foundBook.kategori}</Badge>
                    </div>
                    <h3 className="mt-1.5 font-serif text-base font-bold text-slate-900">
                      {searchReport.foundBook.judul}
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-600">
                      Penulis: <strong>{searchReport.foundBook.penulis}</strong> · Tahun:{' '}
                      <strong>{searchReport.foundBook.tahunTerbit}</strong>
                    </p>
                    <p className="mt-1 font-mono text-xs text-slate-500">
                      ISBN: {searchReport.foundBook.isbn} · Stok:{' '}
                      {searchReport.foundBook.stokTersedia}/
                      {searchReport.foundBook.stokTotal}
                    </p>
                  </div>
                </div>
              </div>

              {searchReport.matchedBooks.length > 1 && (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-emerald-200 bg-white">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-parchment-200 bg-emerald-50/50 text-[10px] font-semibold uppercase text-emerald-900">
                        <th className="px-3 py-1.5">ID</th>
                        <th className="px-3 py-1.5">ISBN</th>
                        <th className="px-3 py-1.5">Judul Buku yang Cocok</th>
                        <th className="px-3 py-1.5">Penulis</th>
                        <th className="px-3 py-1.5 text-center">Tahun</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-parchment-100">
                      {searchReport.matchedBooks.slice(0, 15).map((b) => (
                        <tr key={b.id}>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-500">
                            {b.id}
                          </td>
                          <td className="px-3 py-1.5 font-mono text-[11px] text-slate-600">
                            {b.isbn}
                          </td>
                          <td className="max-w-xs truncate px-3 py-1.5 font-semibold text-slate-900">
                            {b.judul}
                          </td>
                          <td className="px-3 py-1.5 text-slate-600">{b.penulis}</td>
                          <td className="px-3 py-1.5 text-center font-mono text-slate-700">
                            {b.tahunTerbit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center rounded-xl border border-dashed border-rose-200 bg-white p-6 text-center">
              <XCircle className="h-8 w-8 text-rose-400" />
              <p className="mt-2 text-xs font-bold text-slate-800">
                Target &ldquo;{searchReport.query}&rdquo; Tidak Ditemukan
              </p>
              <p className="mt-1 text-[11px] text-slate-500">
                Klik tombol &ldquo;Ambil Contoh dari Inventaris&rdquo; atau ketik kata
                kunci lain yang tersedia di dalam slice dataset aktif.
              </p>
            </div>
          )}
        </div>

        {/* TAHAP 4: ANALISIS & PERBANDINGAN HEAD-TO-HEAD KE-3 ALGORITMA SEARCHING */}
        <div className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-900 font-mono text-[10px] text-white">
                4
              </span>
              <span>
                Analisis &amp; Perbandingan Head-to-Head Ke-3 Algoritma Pencarian
              </span>
            </div>
            <Badge variant="emerald">
              Pilihan Aktif: {searchReport.algorithmName} ({searchReport.bigO})
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-3 shadow-xs">
              <p className="flex items-center gap-1 text-[10px] font-semibold uppercase text-slate-400">
                <Clock className="h-3 w-3 text-emerald-700" />
                <span>Waktu ({searchReport.algorithmName})</span>
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
                <span>Posisi Indeks</span>
              </p>
              <p className="mt-1 font-mono text-base font-bold text-emerald-800">
                {searchReport.foundIndex !== -1
                  ? `Indeks #${searchReport.foundIndex}`
                  : 'Tidak Ada (-1)'}
              </p>
            </div>
          </div>

          {/* Head-to-Head Comparison Table of Linear vs Jump vs Binary Search */}
          <div className="overflow-x-auto rounded-lg border border-emerald-200 bg-white">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-parchment-200 bg-emerald-50/70 text-[10px] font-bold uppercase text-emerald-950">
                  <th className="px-3 py-2">Algoritma Pencarian</th>
                  <th className="px-3 py-2">Kompleksitas Big-O</th>
                  <th className="px-3 py-2 text-right">Waktu Pencarian</th>
                  <th className="px-3 py-2 text-right">Jumlah Langkah / Iterasi</th>
                  <th className="px-3 py-2 text-center">Indeks Ditemukan</th>
                  <th className="px-3 py-2 text-center">Status Efisiensi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-parchment-100">
                {searchReport.headToHead.map((row) => (
                  <tr
                    key={row.algorithm}
                    className={
                      row.isLeastSteps
                        ? 'bg-emerald-50/70 font-semibold'
                        : row.isSelected
                          ? 'bg-amber-50/40'
                          : ''
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
                      {row.foundIndex !== -1 ? `#${row.foundIndex}` : '-1'}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.isLeastSteps ? (
                        <Badge variant="emerald">
                          <Award className="h-3 w-3" />
                          <span>Paling Efisien (Langkah Terendah)</span>
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

          <div className="space-y-1.5 rounded-lg border border-emerald-200/80 bg-white px-3.5 py-3 text-xs leading-relaxed text-slate-700">
            <p className="font-semibold text-emerald-900">
              🏆 Kesimpulan Head-to-Head Ke-3 Algoritma:{' '}
              <span className="font-normal text-slate-800">
                {searchReport.winnerSummary}
              </span>
            </p>
            <p>
              <strong>Analisis Detail ({searchReport.algorithmName}):</strong>{' '}
              {searchReport.narrativeAnalysis}
            </p>
          </div>
        </div>
      </section>

      {/* Visual Charts & Multi-Position Comparison Matrix */}
      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-slate-900">
          Grafik Komparasi Visual Keempat Algoritma Sorting
        </h2>
        <PerformanceChart
          sortMetrics={sortMetrics}
          multiScaleResults={multiScaleResults}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-slate-900">
          Matriks Komparasi Multi-Posisi Pencarian
        </h2>
        <ExecutionStepVisualizer
          comparison={searchComparison}
          positionRows={positionSearchResults}
        />
      </section>
    </div>
  );
}
