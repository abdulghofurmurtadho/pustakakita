import { generateBooks, prepareDatasetByCondition } from '../data/bookGenerator';
import {
  AlgorithmMetrics,
  BenchmarkScale,
  Book,
  DataCondition,
  MultiScaleSortRow,
  SearchBenchmarkResult,
  SearchPositionBenchmarkRow,
  SortField,
  SortOrder,
} from '../types';
import {
  BinarySearchKey,
  binarySearchBooks,
  linearSearchBooks,
} from './searching';
import {
  insertionSort,
  mergeSort,
  quickSort,
} from './sorting';

export interface SearchBenchmarkComparison {
  linear: SearchBenchmarkResult;
  binary: SearchBenchmarkResult;
}

/**
 * Generates synthetic dataset of `count` unique Book entries.
 */
export function generateSyntheticBooks(count: number, seed: number = 20261122): Book[] {
  return generateBooks(count, seed);
}

/**
 * Benchmarks Quick Sort, Merge Sort, and Insertion Sort on identical copies of `dataset`
 * prepared with the selected `condition` ('random' | 'reversed' | 'nearly_sorted').
 */
export function runSortBenchmark(
  dataset: readonly Book[],
  field: SortField = 'judul',
  order: SortOrder = 'asc',
  condition: DataCondition = 'random',
): AlgorithmMetrics[] {
  const prepared =
    condition === 'random'
      ? [...dataset]
      : prepareDatasetByCondition(dataset, condition, field);

  const quickRes = quickSort(prepared, field, order);
  const mergeRes = mergeSort(prepared, field, order);
  const insertionRes = insertionSort(prepared, field, order);

  return [quickRes.metrics, mergeRes.metrics, insertionRes.metrics];
}

/**
 * Runs Multi-Scale Sort Benchmark sequentially across scales (1.000 -> 5.000 -> 10.000)
 * to plot empirical growth curves O(n log n) vs O(n^2).
 */
export function runMultiScaleSortBenchmark(
  scales: BenchmarkScale[] = [1000, 5000, 10000],
  field: SortField = 'judul',
  order: SortOrder = 'asc',
  condition: DataCondition = 'random',
): MultiScaleSortRow[] {
  const rows: MultiScaleSortRow[] = [];

  for (let i = 0; i < scales.length; i += 1) {
    const scale = scales[i];
    const raw = generateBooks(scale);
    const prepared = prepareDatasetByCondition(raw, condition, field);

    const q = quickSort(prepared, field, order).metrics;
    const m = mergeSort(prepared, field, order).metrics;
    const ins = insertionSort(prepared, field, order).metrics;

    rows.push({
      scale,
      condition,
      field,
      quickSort: q,
      mergeSort: m,
      insertionSort: ins,
    });
  }

  return rows;
}

/**
 * Benchmarks Linear Search vs Binary Search for a custom keyword on dataset.
 */
export function runSearchBenchmark(
  dataset: readonly Book[],
  keyword: string,
  searchKey: BinarySearchKey = 'judul',
): SearchBenchmarkComparison {
  const linear = linearSearchBooks(dataset, keyword, searchKey);
  const binary = binarySearchBooks(dataset, keyword, searchKey);
  return { linear, binary };
}

/**
 * Benchmarks Linear Search vs Binary Search across 4 canonical academic positions:
 * Start (Best-case Linear), Middle, End (Worst-case Linear), and Not Found.
 */
export function runSearchPositionBenchmark(
  dataset: readonly Book[],
  field: BinarySearchKey = 'judul',
): SearchPositionBenchmarkRow[] {
  if (dataset.length === 0) return [];

  const sortedByField = quickSort(dataset, (a, b) => {
    const av = a[field].trim().toLowerCase();
    const bv = b[field].trim().toLowerCase();
    if (av < bv) return -1;
    if (av > bv) return 1;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }).sorted;

  const firstQuery = dataset[0][field];
  const middleQuery = dataset[Math.floor(dataset.length / 2)][field];
  const lastQuery = dataset[dataset.length - 1][field];
  const missingQuery = field === 'isbn' ? '978-999-9999999' : 'ZZZ-BUKU-TIDAK-DITEMUKAN';

  const scenarios: {
    scenario: SearchPositionBenchmarkRow['scenario'];
    label: string;
    targetQuery: string;
  }[] = [
    { scenario: 'start', label: 'Posisi Awal (Indeks 0)', targetQuery: firstQuery },
    {
      scenario: 'middle',
      label: `Posisi Tengah (Indeks ${Math.floor(dataset.length / 2)})`,
      targetQuery: middleQuery,
    },
    {
      scenario: 'end',
      label: `Posisi Akhir / Worst-Case Linear (Indeks ${dataset.length - 1})`,
      targetQuery: lastQuery,
    },
    {
      scenario: 'not_found',
      label: 'Target Tidak Ditemukan (-1)',
      targetQuery: missingQuery,
    },
  ];

  return scenarios.map((sc) => ({
    scenario: sc.scenario,
    label: sc.label,
    targetQuery: sc.targetQuery,
    field,
    linear: linearSearchBooks(dataset, sc.targetQuery, field),
    binary: binarySearchBooks(dataset, sc.targetQuery, field, sortedByField),
  }));
}

/**
 * Formats benchmark results into CSV ready for Excel / academic reports.
 */
export function exportBenchmarkToCsv(
  sortMetrics: readonly AlgorithmMetrics[],
  multiScaleRows: readonly MultiScaleSortRow[],
  searchRows: readonly SearchPositionBenchmarkRow[],
  condition: DataCondition,
  field: SortField,
): string {
  const lines: string[] = [];

  lines.push('SECTION,SCALE_N,CONDITION,FIELD,ALGORITHM_OR_SCENARIO,TIME_MS,COMPARISONS,SWAPS_OR_FOUND_INDEX');

  for (let i = 0; i < sortMetrics.length; i += 1) {
    const m = sortMetrics[i];
    lines.push(
      `SINGLE_SORT,${m.itemCount},${condition},${field},"${m.algorithmName}",${m.executionTimeMs},${m.comparisonsCount},${m.swapsCount ?? 0}`,
    );
  }

  for (let i = 0; i < multiScaleRows.length; i += 1) {
    const row = multiScaleRows[i];
    const items = [row.quickSort, row.mergeSort, row.insertionSort];
    for (let j = 0; j < items.length; j += 1) {
      const m = items[j];
      lines.push(
        `MULTI_SCALE_SORT,${row.scale},${row.condition},${row.field},"${m.algorithmName}",${m.executionTimeMs},${m.comparisonsCount},${m.swapsCount ?? 0}`,
      );
    }
  }

  for (let i = 0; i < searchRows.length; i += 1) {
    const sr = searchRows[i];
    lines.push(
      `SEARCH_BENCHMARK,${sr.linear.itemCount},dataset,${sr.field},"Linear Search (${sr.label})",${sr.linear.executionTimeMs},${sr.linear.comparisonsCount},${sr.linear.foundIndex}`,
    );
    lines.push(
      `SEARCH_BENCHMARK,${sr.binary.itemCount},sorted,${sr.field},"Binary Search (${sr.label})",${sr.binary.executionTimeMs},${sr.binary.comparisonsCount},${sr.binary.foundIndex}`,
    );
  }

  return lines.join('\n');
}
