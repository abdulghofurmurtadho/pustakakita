import { useCallback, useState } from 'react';
import {
  SearchBenchmarkComparison,
  exportBenchmarkToCsv,
  generateSyntheticBooks,
  runMultiScaleSortBenchmark,
  runSearchBenchmark,
  runSearchPositionBenchmark,
  runSortBenchmark,
} from '../algorithms/benchmarkRunner';
import { BinarySearchKey } from '../algorithms/searching';
import {
  AlgorithmMetrics,
  BenchmarkScale,
  Book,
  DataCondition,
  LastBenchmarkSummary,
  MultiScaleSortRow,
  SearchPositionBenchmarkRow,
  SortField,
  SortOrder,
} from '../types';

export const LAST_BENCHMARK_STORAGE_KEY = 'pustakakita_last_benchmark';

function saveLastBenchmarkSummary(summary: LastBenchmarkSummary): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(LAST_BENCHMARK_STORAGE_KEY, JSON.stringify(summary));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function readLastBenchmarkSummary(): LastBenchmarkSummary | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(LAST_BENCHMARK_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LastBenchmarkSummary;
  } catch {
    return null;
  }
}

export function useBenchmark() {
  const [datasetSize, setDatasetSize] = useState<BenchmarkScale>(1000);
  const [dataCondition, setDataCondition] = useState<DataCondition>('random');
  const [dataset, setDataset] = useState<Book[]>(() => generateSyntheticBooks(1000));
  const [sortField, setSortField] = useState<SortField>('judul');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [sortMetrics, setSortMetrics] = useState<AlgorithmMetrics[]>(() => {
    const initial = generateSyntheticBooks(1000);
    const metrics = runSortBenchmark(initial, 'judul', 'asc', 'random');
    saveLastBenchmarkSummary({
      timestamp: new Date().toISOString(),
      scale: 1000,
      condition: 'random',
      field: 'judul',
      sortMetrics: metrics,
    });
    return metrics;
  });

  const [multiScaleResults, setMultiScaleResults] = useState<MultiScaleSortRow[]>([]);

  const [searchKeyword, setSearchKeyword] = useState<string>(() => {
    const initial = generateSyntheticBooks(1000);
    return initial[Math.floor(initial.length / 2)].judul;
  });
  const [searchKey, setSearchKey] = useState<BinarySearchKey>('judul');
  const [searchComparison, setSearchComparison] =
    useState<SearchBenchmarkComparison | null>(() => {
      const initial = generateSyntheticBooks(1000);
      return runSearchBenchmark(
        initial,
        initial[Math.floor(initial.length / 2)].judul,
        'judul',
      );
    });
  const [positionSearchResults, setPositionSearchResults] = useState<
    SearchPositionBenchmarkRow[]
  >(() => runSearchPositionBenchmark(generateSyntheticBooks(1000), 'judul'));

  const persistSummary = useCallback(
    (
      scale: number,
      condition: DataCondition,
      field: SortField,
      metrics: AlgorithmMetrics[],
      searchComp?: SearchBenchmarkComparison | null,
    ) => {
      saveLastBenchmarkSummary({
        timestamp: new Date().toISOString(),
        scale,
        condition,
        field,
        sortMetrics: metrics,
        searchSample: searchComp
          ? {
              query: searchComp.linear.query,
              linearMs: searchComp.linear.executionTimeMs,
              linearComparisons: searchComp.linear.comparisonsCount,
              binaryMs: searchComp.binary.executionTimeMs,
              binaryComparisons: searchComp.binary.comparisonsCount,
            }
          : undefined,
      });
    },
    [],
  );

  const selectDatasetSize = useCallback(
    (size: BenchmarkScale) => {
      const nextData = generateSyntheticBooks(size);
      setDatasetSize(size);
      setDataset(nextData);
      const nextMetrics = runSortBenchmark(nextData, sortField, sortOrder, dataCondition);
      setSortMetrics(nextMetrics);
      const nextPos = runSearchPositionBenchmark(nextData, searchKey);
      setPositionSearchResults(nextPos);
      const nextComp = searchKeyword.trim()
        ? runSearchBenchmark(nextData, searchKeyword, searchKey)
        : null;
      setSearchComparison(nextComp);
      persistSummary(size, dataCondition, sortField, nextMetrics, nextComp);
    },
    [sortField, sortOrder, dataCondition, searchKeyword, searchKey, persistSummary],
  );

  const selectDataCondition = useCallback(
    (condition: DataCondition) => {
      setDataCondition(condition);
      const nextMetrics = runSortBenchmark(dataset, sortField, sortOrder, condition);
      setSortMetrics(nextMetrics);
      persistSummary(datasetSize, condition, sortField, nextMetrics, searchComparison);
    },
    [dataset, datasetSize, sortField, sortOrder, searchComparison, persistSummary],
  );

  const executeSortBenchmark = useCallback(
    (
      field: SortField = sortField,
      order: SortOrder = sortOrder,
      condition: DataCondition = dataCondition,
    ) => {
      setSortField(field);
      setSortOrder(order);
      setDataCondition(condition);
      const metrics = runSortBenchmark(dataset, field, order, condition);
      setSortMetrics(metrics);
      persistSummary(datasetSize, condition, field, metrics, searchComparison);
      return metrics;
    },
    [
      dataset,
      datasetSize,
      sortField,
      sortOrder,
      dataCondition,
      searchComparison,
      persistSummary,
    ],
  );

  const executeFullMultiScaleBenchmark = useCallback(
    (
      field: SortField = sortField,
      order: SortOrder = sortOrder,
      condition: DataCondition = dataCondition,
    ) => {
      const rows = runMultiScaleSortBenchmark([1000, 5000, 10000], field, order, condition);
      setMultiScaleResults(rows);
      if (rows.length > 0) {
        const last = rows[rows.length - 1];
        const lastMetrics = [last.quickSort, last.mergeSort, last.insertionSort];
        setDatasetSize(10000);
        setDataset(generateSyntheticBooks(10000));
        setSortMetrics(lastMetrics);
        persistSummary(10000, condition, field, lastMetrics, searchComparison);
      }
      return rows;
    },
    [sortField, sortOrder, dataCondition, searchComparison, persistSummary],
  );

  const executeSearchBenchmark = useCallback(
    (keyword: string = searchKeyword, key: BinarySearchKey = searchKey) => {
      setSearchKeyword(keyword);
      setSearchKey(key);
      const comparison = runSearchBenchmark(dataset, keyword, key);
      setSearchComparison(comparison);
      const posRows = runSearchPositionBenchmark(dataset, key);
      setPositionSearchResults(posRows);
      persistSummary(datasetSize, dataCondition, sortField, sortMetrics, comparison);
      return comparison;
    },
    [
      dataset,
      datasetSize,
      dataCondition,
      sortField,
      sortMetrics,
      searchKeyword,
      searchKey,
      persistSummary,
    ],
  );

  const pickSampleKeyword = useCallback(() => {
    if (dataset.length === 0) return;
    const midBook = dataset[Math.floor(dataset.length / 2)];
    const sample = midBook[searchKey];
    setSearchKeyword(sample);
    const comp = runSearchBenchmark(dataset, sample, searchKey);
    setSearchComparison(comp);
  }, [dataset, searchKey]);

  const buildCsvReport = useCallback(() => {
    return exportBenchmarkToCsv(
      sortMetrics,
      multiScaleResults,
      positionSearchResults,
      dataCondition,
      sortField,
    );
  }, [sortMetrics, multiScaleResults, positionSearchResults, dataCondition, sortField]);

  const buildJsonReport = useCallback(() => {
    return JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        activeScale: datasetSize,
        condition: dataCondition,
        sortField,
        sortOrder,
        sortMetrics,
        multiScaleResults,
        searchPositions: positionSearchResults.map((row) => ({
          scenario: row.scenario,
          label: row.label,
          targetQuery: row.targetQuery,
          linearMs: row.linear.executionTimeMs,
          linearComparisons: row.linear.comparisonsCount,
          binaryMs: row.binary.executionTimeMs,
          binaryComparisons: row.binary.comparisonsCount,
          binaryFoundIndex: row.binary.foundIndex,
        })),
      },
      null,
      2,
    );
  }, [
    datasetSize,
    dataCondition,
    sortField,
    sortOrder,
    sortMetrics,
    multiScaleResults,
    positionSearchResults,
  ]);

  return {
    datasetSize,
    dataCondition,
    dataset,
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
  };
}
