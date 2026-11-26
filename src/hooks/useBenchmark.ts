import { useCallback, useEffect, useState } from 'react';
import {
  SearchBenchmarkComparison,
  exportBenchmarkToCsv,
  runMultiScaleSortBenchmark,
  runSearchBenchmark,
  runSearchPositionBenchmark,
  runSortBenchmark,
} from '../algorithms/benchmarkRunner';
import {
  BinarySearchKey,
  getBookCriterionString,
  runDetailedSearch,
} from '../algorithms/searching';
import { formatBookFieldValue, runDetailedSort } from '../algorithms/sorting';
import { useLibrary } from '../context/LibraryContext';
import {
  AlgorithmMetrics,
  BenchmarkScale,
  DataCondition,
  DatasetSliceScale,
  LastBenchmarkSummary,
  MultiScaleSortRow,
  SearchAlgorithmType,
  SearchExecutionReport,
  SearchPositionBenchmarkRow,
  SortAlgorithmType,
  SortExecutionReport,
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

/**
 * Benchmark hook connected directly to `useLibrary().books` (Single Source of Truth)
 * with completely independent state for Modul Sorting and Modul Searching.
 */
export function useBenchmark() {
  const { books: inventoryBooks } = useLibrary();

  // Independent Modul Sorting State
  const [sortScale, setSortScale] = useState<DatasetSliceScale>(1000);
  const [sortAlgorithm, setSortAlgorithm] = useState<SortAlgorithmType>('quick');
  const [sortField, setSortField] = useState<SortField>('judul');
  const [sortFilterQuery, setSortFilterQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [dataCondition, setDataCondition] = useState<DataCondition>('random');
  const [sortReport, setSortReport] = useState<SortExecutionReport>(() =>
    runDetailedSort(inventoryBooks, 1000, 'quick', 'judul', 'asc', ''),
  );

  // Side-by-side comparison metrics for charts & CSV export
  const [datasetSize, setDatasetSize] = useState<BenchmarkScale>(1000);
  const [sortMetrics, setSortMetrics] = useState<AlgorithmMetrics[]>(() => {
    const slice = inventoryBooks.slice(0, 1000);
    const metrics = runSortBenchmark(slice, 'judul', 'asc', 'random');
    saveLastBenchmarkSummary({
      timestamp: new Date().toISOString(),
      scale: slice.length,
      condition: 'random',
      field: 'judul',
      sortMetrics: metrics,
    });
    return metrics;
  });
  const [multiScaleResults, setMultiScaleResults] = useState<MultiScaleSortRow[]>([]);

  // Independent Modul Searching State
  const [searchScale, setSearchScale] = useState<DatasetSliceScale>(1000);
  const [searchAlgorithm, setSearchAlgorithm] =
    useState<SearchAlgorithmType>('binary');
  const [searchKey, setSearchKey] = useState<BinarySearchKey>('judul');
  const [searchKeyword, setSearchKeyword] = useState<string>(() => {
    const sampleIdx = Math.min(Math.floor(inventoryBooks.length / 2), 499);
    return inventoryBooks[sampleIdx]?.judul || '';
  });
  const [searchReport, setSearchReport] = useState<SearchExecutionReport>(() => {
    const sampleIdx = Math.min(Math.floor(inventoryBooks.length / 2), 499);
    const initialQuery = inventoryBooks[sampleIdx]?.judul || '';
    return runDetailedSearch(inventoryBooks, 1000, 'binary', 'judul', initialQuery);
  });

  const [searchComparison, setSearchComparison] =
    useState<SearchBenchmarkComparison | null>(() => {
      const slice = inventoryBooks.slice(0, 1000);
      const sampleIdx = Math.min(Math.floor(slice.length / 2), 499);
      const q = slice[sampleIdx]?.judul || '';
      return runSearchBenchmark(slice, q, 'judul');
    });
  const [positionSearchResults, setPositionSearchResults] = useState<
    SearchPositionBenchmarkRow[]
  >(() => runSearchPositionBenchmark(inventoryBooks.slice(0, 1000), 'judul'));

  // Re-sync reports automatically when inventoryBooks changes (e.g., book added/edited/deleted in Inventaris)
  useEffect(() => {
    setSortReport((prev) =>
      runDetailedSort(
        inventoryBooks,
        prev.scaleRequested,
        prev.algorithm,
        prev.field,
        prev.order,
        prev.filterQuery,
      ),
    );
    setSearchReport((prev) =>
      runDetailedSearch(
        inventoryBooks,
        prev.scaleRequested,
        prev.algorithm,
        prev.field,
        prev.query,
      ),
    );
  }, [inventoryBooks]);

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

  // Independent Modul Sorting execution
  const executeSingleSortModule = useCallback(
    (
      scale: DatasetSliceScale = sortScale,
      algorithm: SortAlgorithmType = sortAlgorithm,
      field: SortField = sortField,
      order: SortOrder = sortOrder,
      filterKw: string = sortFilterQuery,
    ) => {
      setSortScale(scale);
      setSortAlgorithm(algorithm);
      setSortField(field);
      setSortOrder(order);
      setSortFilterQuery(filterKw);
      const report = runDetailedSort(
        inventoryBooks,
        scale,
        algorithm,
        field,
        order,
        filterKw,
      );
      setSortReport(report);

      // Update chart metrics from the head-to-head execution
      const nextMetrics: AlgorithmMetrics[] = report.headToHead.map((h) => ({
        algorithmName: h.algorithmName,
        executionTimeMs: h.executionTimeMs,
        comparisonsCount: h.comparisonsCount,
        swapsCount: h.swapsCount,
        itemCount: report.itemCount,
      }));
      setSortMetrics(nextMetrics);
      persistSummary(report.itemCount, dataCondition, field, nextMetrics, searchComparison);
      return report;
    },
    [
      inventoryBooks,
      sortScale,
      sortAlgorithm,
      sortField,
      sortOrder,
      sortFilterQuery,
      dataCondition,
      searchComparison,
      persistSummary,
    ],
  );

  const pickSortSampleKeyword = useCallback(() => {
    const actualCount =
      sortScale >= 10000
        ? inventoryBooks.length
        : Math.min(sortScale, inventoryBooks.length);
    const sliced = inventoryBooks.slice(0, actualCount);
    if (sliced.length === 0) return;
    const sampleBook = sliced[Math.floor(Math.random() * sliced.length)];
    let sampleKw = formatBookFieldValue(sampleBook, sortField);
    if (sortField === 'judul') {
      // Take the first word/topic of the title so multiple books match and get sorted!
      sampleKw = sampleBook.judul.split(':')[0].split(' ')[0] || sampleBook.judul;
    } else if (sortField === 'isbn') {
      sampleKw = sampleBook.isbn.slice(0, 9); // e.g. "978-602-0"
    } else if (sortField === 'penulis') {
      sampleKw = sampleBook.penulis.split(' ')[0].replace(/[^A-Za-z]/g, '') || sampleBook.penulis;
    }
    executeSingleSortModule(sortScale, sortAlgorithm, sortField, sortOrder, sampleKw);
  }, [
    inventoryBooks,
    sortScale,
    sortAlgorithm,
    sortField,
    sortOrder,
    executeSingleSortModule,
  ]);

  // Compare all 4 sorting algorithms on active sortScale slice from real inventory
  const executeSortBenchmark = useCallback(
    (
      field: SortField = sortField,
      order: SortOrder = sortOrder,
      condition: DataCondition = dataCondition,
      scaleOverride?: BenchmarkScale,
    ) => {
      const targetScale = scaleOverride ?? sortScale;
      const mappedScale: DatasetSliceScale =
        targetScale === 50 ? 50 : targetScale === 1000 ? 1000 : 10000;
      const report = runDetailedSort(
        inventoryBooks,
        mappedScale,
        sortAlgorithm,
        field,
        order,
        sortFilterQuery,
      );
      setSortReport(report);

      const actualCount =
        targetScale >= 10000
          ? inventoryBooks.length
          : Math.min(targetScale, inventoryBooks.length);
      const sliced = inventoryBooks.slice(0, actualCount);
      setSortField(field);
      setSortOrder(order);
      setDataCondition(condition);
      const metrics = runSortBenchmark(sliced, field, order, condition);
      setSortMetrics(metrics);
      persistSummary(sliced.length, condition, field, metrics, searchComparison);
      return metrics;
    },
    [
      inventoryBooks,
      sortScale,
      sortAlgorithm,
      sortField,
      sortOrder,
      sortFilterQuery,
      dataCondition,
      searchComparison,
      persistSummary,
    ],
  );

  const selectDatasetSize = useCallback(
    (size: BenchmarkScale) => {
      const mappedScale: DatasetSliceScale =
        size === 50 ? 50 : size === 1000 ? 1000 : 10000;
      setDatasetSize(size);
      executeSingleSortModule(
        mappedScale,
        sortAlgorithm,
        sortField,
        sortOrder,
        sortFilterQuery,
      );
    },
    [
      executeSingleSortModule,
      sortAlgorithm,
      sortField,
      sortOrder,
      sortFilterQuery,
    ],
  );

  const selectDataCondition = useCallback(
    (condition: DataCondition) => {
      setDataCondition(condition);
      const actualCount =
        sortScale >= 10000
          ? inventoryBooks.length
          : Math.min(sortScale, inventoryBooks.length);
      const sliced = inventoryBooks.slice(0, actualCount);
      const nextMetrics = runSortBenchmark(sliced, sortField, sortOrder, condition);
      setSortMetrics(nextMetrics);
      persistSummary(sliced.length, condition, sortField, nextMetrics, searchComparison);
    },
    [inventoryBooks, sortScale, sortField, sortOrder, searchComparison, persistSummary],
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
        setSortScale(10000);
        setSortMetrics(lastMetrics);
        persistSummary(10000, condition, field, lastMetrics, searchComparison);
      }
      return rows;
    },
    [sortField, sortOrder, dataCondition, searchComparison, persistSummary],
  );

  // Independent Modul Searching execution
  const executeSingleSearchModule = useCallback(
    (
      scale: DatasetSliceScale = searchScale,
      algorithm: SearchAlgorithmType = searchAlgorithm,
      key: BinarySearchKey = searchKey,
      keyword: string = searchKeyword,
    ) => {
      setSearchScale(scale);
      setSearchAlgorithm(algorithm);
      setSearchKey(key);
      setSearchKeyword(keyword);

      const report = runDetailedSearch(inventoryBooks, scale, algorithm, key, keyword);
      setSearchReport(report);

      const actualCount =
        scale >= 10000
          ? inventoryBooks.length
          : Math.min(scale, inventoryBooks.length);
      const sliced = inventoryBooks.slice(0, actualCount);
      const comp = runSearchBenchmark(sliced, keyword, key);
      setSearchComparison(comp);
      const posRows = runSearchPositionBenchmark(sliced, key);
      setPositionSearchResults(posRows);
      return report;
    },
    [inventoryBooks, searchScale, searchAlgorithm, searchKey, searchKeyword],
  );

  const executeSearchBenchmark = useCallback(
    (keyword: string = searchKeyword, key: BinarySearchKey = searchKey) => {
      const report = executeSingleSearchModule(
        searchScale,
        searchAlgorithm,
        key,
        keyword,
      );
      return report;
    },
    [executeSingleSearchModule, searchScale, searchAlgorithm, searchKey, searchKeyword],
  );

  const pickSampleKeyword = useCallback(
    (targetPosition: 'start' | 'middle' | 'end' | 'random' = 'random') => {
      const actualCount =
        searchScale >= 10000
          ? inventoryBooks.length
          : Math.min(searchScale, inventoryBooks.length);
      const sliced = inventoryBooks.slice(0, actualCount);
      if (sliced.length === 0) return;

      let idx = 0;
      if (targetPosition === 'start') idx = 0;
      else if (targetPosition === 'middle') idx = Math.floor(sliced.length / 2);
      else if (targetPosition === 'end') idx = sliced.length - 1;
      else idx = Math.floor(Math.random() * sliced.length);

      const sample = getBookCriterionString(sliced[idx], searchKey);
      executeSingleSearchModule(searchScale, searchAlgorithm, searchKey, sample);
    },
    [inventoryBooks, searchScale, searchAlgorithm, searchKey, executeSingleSearchModule],
  );

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
        inventoryTotalCount: inventoryBooks.length,
        sortModuleReport: {
          scale: sortReport.scaleRequested,
          itemCount: sortReport.itemCount,
          algorithm: sortReport.algorithmName,
          bigO: sortReport.bigO,
          field: sortReport.field,
          filterQuery: sortReport.filterQuery,
          order: sortReport.order,
          executionTimeMs: sortReport.executionTimeMs,
          comparisonsCount: sortReport.comparisonsCount,
          swapsCount: sortReport.swapsCount,
          headToHead: sortReport.headToHead,
          winnerSummary: sortReport.winnerSummary,
          narrativeAnalysis: sortReport.narrativeAnalysis,
        },
        searchModuleReport: {
          scale: searchReport.scaleRequested,
          itemCount: searchReport.itemCount,
          algorithm: searchReport.algorithmName,
          bigO: searchReport.bigO,
          field: searchReport.field,
          query: searchReport.query,
          foundIndex: searchReport.foundIndex,
          executionTimeMs: searchReport.executionTimeMs,
          comparisonsCount: searchReport.comparisonsCount,
          headToHead: searchReport.headToHead,
          winnerSummary: searchReport.winnerSummary,
          narrativeAnalysis: searchReport.narrativeAnalysis,
        },
        sortMetrics,
        multiScaleResults,
      },
      null,
      2,
    );
  }, [inventoryBooks.length, sortReport, searchReport, sortMetrics, multiScaleResults]);

  return {
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
    // Legacy & Multi-Scale Comparison
    datasetSize,
    dataCondition,
    sortMetrics,
    multiScaleResults,
    searchComparison,
    positionSearchResults,
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
