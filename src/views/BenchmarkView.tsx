import { BenchmarkControls } from '../components/benchmark/BenchmarkControls';
import { ExecutionStepVisualizer } from '../components/benchmark/ExecutionStepVisualizer';
import { PerformanceChart } from '../components/benchmark/PerformanceChart';
import { useToast } from '../context/ToastContext';
import { useBenchmark } from '../hooks/useBenchmark';
import { getTodayDateString } from '../utils/dateUtils';

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

export function BenchmarkView() {
  const { addToast } = useToast();
  const {
    datasetSize,
    dataCondition,
    sortField,
    sortOrder,
    sortMetrics,
    multiScaleResults,
    searchKeyword,
    searchKey,
    searchComparison,
    positionSearchResults,
    setSortField,
    setSortOrder,
    setSearchKeyword,
    setSearchKey,
    selectDatasetSize,
    selectDataCondition,
    executeSortBenchmark,
    executeFullMultiScaleBenchmark,
    executeSearchBenchmark,
    pickSampleKeyword,
    buildCsvReport,
    buildJsonReport,
  } = useBenchmark();

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

  const handleRunFullMultiScale = () => {
    executeFullMultiScaleBenchmark();
    addToast(
      'Full Multi-Scale Benchmark (1.000 → 5.000 → 10.000) selesai dijalankan.',
      'success',
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Laboratorium Struktur Data · Skala 1.000 – 10.000
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
          Benchmark Algoritma Searching &amp; Sorting
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Bandingkan performa empiris Quick Sort, Merge Sort, Insertion Sort, Linear Search,
          dan Binary Search secara murni tanpa{' '}
          <code className="font-mono text-[11px]">.sort()</code>,{' '}
          <code className="font-mono text-[11px]">.find()</code>, atau{' '}
          <code className="font-mono text-[11px]">.includes()</code>.
        </p>
      </div>

      <BenchmarkControls
        datasetSize={datasetSize}
        onSelectDatasetSize={selectDatasetSize}
        dataCondition={dataCondition}
        onSelectDataCondition={selectDataCondition}
        sortField={sortField}
        onSortFieldChange={setSortField}
        sortOrder={sortOrder}
        onSortOrderChange={setSortOrder}
        onRunSortBenchmark={() => executeSortBenchmark()}
        onRunFullMultiScale={handleRunFullMultiScale}
        searchKeyword={searchKeyword}
        onSearchKeywordChange={setSearchKeyword}
        searchKey={searchKey}
        onSearchKeyChange={setSearchKey}
        onRunSearchBenchmark={() => executeSearchBenchmark()}
        onPickSampleKeyword={pickSampleKeyword}
        onDownloadCsv={handleDownloadCsv}
        onDownloadJson={handleDownloadJson}
      />

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-slate-900">
          Hasil Uji Performa Pengurutan (Sorting)
        </h2>
        <PerformanceChart
          sortMetrics={sortMetrics}
          multiScaleResults={multiScaleResults}
        />
      </section>

      <section className="space-y-3">
        <h2 className="font-serif text-lg font-bold text-slate-900">
          Hasil Uji Performa Pencarian (Searching)
        </h2>
        <ExecutionStepVisualizer
          comparison={searchComparison}
          positionRows={positionSearchResults}
        />
      </section>
    </div>
  );
}
