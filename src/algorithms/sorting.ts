import {
  AlgorithmMetrics,
  Book,
  DatasetSliceScale,
  IndexedBookSnapshot,
  PostSortHighlightMatch,
  SortAlgorithmType,
  SortExecutionReport,
  SortField,
  SortHeadToHeadItem,
  SortOrder,
  SortTraceStep,
} from '../types';

export type Comparator<T> = (a: T, b: T) => number;

export interface SortResult<T> {
  result: T[];
  sorted: T[];
  executionTimeMs: number;
  comparisons: number;
  comparisonsCount: number;
  swaps: number;
  swapsCount: number;
  traceSteps?: SortTraceStep[];
  metrics: AlgorithmMetrics;
}

/**
 * Default comparator for primitive values or stringifiable objects.
 */
export function defaultCompare<T>(a: T, b: T): number {
  if (typeof a === 'number' && typeof b === 'number') {
    return a - b;
  }
  const sa = String(a).toLowerCase();
  const sb = String(b).toLowerCase();
  if (sa < sb) return -1;
  if (sa > sb) return 1;
  return 0;
}

/**
 * Deterministic, fast comparator for Book records by field and order,
 * breaking ties by Book.id without calling localeCompare.
 */
export function compareBooks(
  a: Book,
  b: Book,
  field: SortField,
  order: SortOrder = 'asc',
): number {
  const dir = order === 'asc' ? 1 : -1;
  let cmp = 0;

  if (field === 'judul') {
    const av = a.judul.toLowerCase();
    const bv = b.judul.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'penulis') {
    const av = a.penulis.toLowerCase();
    const bv = b.penulis.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'isbn') {
    const av = a.isbn.toLowerCase();
    const bv = b.isbn.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'kodeRak') {
    const av = a.kodeRak.toLowerCase();
    const bv = b.kodeRak.toLowerCase();
    cmp = av < bv ? -1 : av > bv ? 1 : 0;
  } else if (field === 'tahunTerbit') {
    cmp = a.tahunTerbit - b.tahunTerbit;
  } else if (field === 'stokTersedia') {
    cmp = a.stokTersedia - b.stokTersedia;
  }

  if (cmp !== 0) {
    return cmp * dir;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function buildBookKeyComparator(field: SortField, order: SortOrder): Comparator<Book> {
  return (a: Book, b: Book) => compareBooks(a, b, field, order);
}

function resolveSortArguments<T>(
  secondArg?: Comparator<T> | SortField,
  thirdArg: SortOrder = 'asc',
): Comparator<T> {
  if (typeof secondArg === 'function') {
    return secondArg;
  }
  if (typeof secondArg === 'string') {
    return buildBookKeyComparator(secondArg, thirdArg) as unknown as Comparator<T>;
  }
  return defaultCompare;
}

function extractFastBookKey(book: Book, field: SortField): string | number {
  if (field === 'judul') return book.judul.toLowerCase();
  if (field === 'penulis') return book.penulis.toLowerCase();
  if (field === 'isbn') return book.isbn.toLowerCase();
  if (field === 'kodeRak') return book.kodeRak.toLowerCase();
  if (field === 'tahunTerbit') return book.tahunTerbit;
  return book.stokTersedia;
}

export function formatBookFieldValue(book: Book, field: SortField): string {
  if (field === 'judul') return book.judul;
  if (field === 'penulis') return book.penulis;
  if (field === 'isbn') return book.isbn;
  if (field === 'kodeRak') return book.kodeRak;
  if (field === 'tahunTerbit') return String(book.tahunTerbit);
  return String(book.stokTersedia);
}

/**
 * Pure Quick Sort using median-of-three pivot selection and Hoare partitioning
 * with tail-call optimization (max recursion depth <= log2(N)).
 */
export function quickSort(
  books: readonly Book[],
  key?: SortField,
  order?: SortOrder,
): SortResult<Book>;
export function quickSort<T>(
  items: readonly T[],
  compareFn?: Comparator<T>,
): SortResult<T>;
export function quickSort<T>(
  items: readonly T[],
  keyOrCompare?: Comparator<T> | SortField,
  order: SortOrder = 'asc',
): SortResult<T> {
  const n = items.length;
  const arr = [...items];
  let comparisonsCount = 0;
  let swapsCount = 0;
  const traceSteps: SortTraceStep[] = [];

  const isBookFieldMode = typeof keyOrCompare === 'string';
  const field = isBookFieldMode ? (keyOrCompare as SortField) : null;
  const dir = order === 'asc' ? 1 : -1;

  const keys: (string | number)[] | null =
    isBookFieldMode && field
      ? arr.map((item) => extractFastBookKey(item as unknown as Book, field))
      : null;

  const ids: string[] | null = isBookFieldMode
    ? arr.map((item) => (item as unknown as Book).id)
    : null;

  const compareFn = isBookFieldMode ? null : resolveSortArguments(keyOrCompare, order);

  const cmpIdx = (i: number, j: number): number => {
    comparisonsCount += 1;
    if (keys && ids) {
      const ka = keys[i];
      const kb = keys[j];
      if (ka < kb) return -dir;
      if (ka > kb) return dir;
      return ids[i] < ids[j] ? -1 : ids[i] > ids[j] ? 1 : 0;
    }
    return compareFn!(arr[i], arr[j]);
  };

  const cmpPivot = (
    i: number,
    pivotVal: T,
    pivotKey: string | number,
    pivotId: string,
  ): number => {
    comparisonsCount += 1;
    if (keys && ids) {
      const ka = keys[i];
      if (ka < pivotKey) return -dir;
      if (ka > pivotKey) return dir;
      return ids[i] < pivotId ? -1 : ids[i] > pivotId ? 1 : 0;
    }
    return compareFn!(arr[i], pivotVal);
  };

  const swap = (i: number, j: number, recordStep: boolean = true) => {
    if (i === j) return;
    if (recordStep && traceSteps.length < 30 && isBookFieldMode && field) {
      const valA = formatBookFieldValue(arr[i] as unknown as Book, field);
      const valB = formatBookFieldValue(arr[j] as unknown as Book, field);
      traceSteps.push({
        step: traceSteps.length + 1,
        action: 'swap',
        indexA: i,
        indexB: j,
        valueA: valA,
        valueB: valB,
        description: `Compare & Swap [${i}] "${valA}" ↔ [${j}] "${valB}"`,
      });
    }
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
    if (keys && ids) {
      const tk = keys[i];
      keys[i] = keys[j];
      keys[j] = tk;
      const ti = ids[i];
      ids[i] = ids[j];
      ids[j] = ti;
    }
    swapsCount += 1;
  };

  const sortRange = (low: number, high: number) => {
    while (low < high) {
      const mid = (low + high) >> 1;

      if (cmpIdx(low, mid) > 0) swap(low, mid);
      if (cmpIdx(low, high) > 0) swap(low, high);
      if (cmpIdx(mid, high) > 0) swap(mid, high);

      const pivotVal = arr[mid];
      const pivotKey = keys ? keys[mid] : 0;
      const pivotId = ids ? ids[mid] : '';

      if (traceSteps.length < 30 && isBookFieldMode && field) {
        const pLabel = formatBookFieldValue(pivotVal as unknown as Book, field);
        traceSteps.push({
          step: traceSteps.length + 1,
          action: 'pivot',
          indexA: mid,
          indexB: high,
          valueA: pLabel,
          description: `Partisi rentang [${low}..${high}] dengan pivot median [${mid}] "${pLabel}"`,
        });
      }

      let i = low - 1;
      let j = high + 1;

      while (true) {
        do {
          i += 1;
        } while (cmpPivot(i, pivotVal, pivotKey, pivotId) < 0);

        do {
          j -= 1;
        } while (cmpPivot(j, pivotVal, pivotKey, pivotId) > 0);

        if (i >= j) break;
        swap(i, j);
      }

      if (j - low < high - j) {
        sortRange(low, j);
        low = j + 1;
      } else {
        sortRange(j + 1, high);
        high = j;
      }
    }
  };

  const startTime = performance.now();
  if (n > 1) {
    sortRange(0, n - 1);
  }
  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  return {
    result: arr,
    sorted: arr,
    executionTimeMs,
    comparisons: comparisonsCount,
    comparisonsCount,
    swaps: swapsCount,
    swapsCount,
    traceSteps,
    metrics: {
      algorithmName: 'Quick Sort',
      executionTimeMs,
      comparisonsCount,
      swapsCount,
      itemCount: n,
    },
  };
}

/**
 * Pure Merge Sort (Divide and Conquer, guaranteed O(n log n) across all cases).
 */
export function mergeSort(
  books: readonly Book[],
  key?: SortField,
  order?: SortOrder,
): SortResult<Book>;
export function mergeSort<T>(
  items: readonly T[],
  compareFn?: Comparator<T>,
): SortResult<T>;
export function mergeSort<T>(
  items: readonly T[],
  keyOrCompare?: Comparator<T> | SortField,
  order: SortOrder = 'asc',
): SortResult<T> {
  const n = items.length;
  let comparisonsCount = 0;
  let swapsCount = 0;
  const traceSteps: SortTraceStep[] = [];

  const isBookFieldMode = typeof keyOrCompare === 'string';
  const field = isBookFieldMode ? (keyOrCompare as SortField) : null;
  const dir = order === 'asc' ? 1 : -1;
  const compareFn = isBookFieldMode ? null : resolveSortArguments(keyOrCompare, order);

  interface IndexedItem<U> {
    item: U;
    key: string | number;
    id: string;
    origIdx: number;
  }

  const startTime = performance.now();
  let sorted: T[];

  if (n <= 1) {
    sorted = [...items];
  } else if (isBookFieldMode && field) {
    const wrapped: IndexedItem<T>[] = items.map((item, idx) => {
      const b = item as unknown as Book;
      return {
        item,
        key: extractFastBookKey(b, field),
        id: b.id,
        origIdx: idx,
      };
    });

    const mergeWrapped = (
      left: IndexedItem<T>[],
      right: IndexedItem<T>[],
    ): IndexedItem<T>[] => {
      const merged: IndexedItem<T>[] = new Array(left.length + right.length);
      let i = 0;
      let j = 0;
      let k = 0;
      while (i < left.length && j < right.length) {
        comparisonsCount += 1;
        const a = left[i];
        const b = right[j];
        let cmp = 0;
        if (a.key < b.key) cmp = -dir;
        else if (a.key > b.key) cmp = dir;
        else cmp = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

        if (traceSteps.length < 30) {
          const valA = formatBookFieldValue(a.item as unknown as Book, field);
          const valB = formatBookFieldValue(b.item as unknown as Book, field);
          traceSteps.push({
            step: traceSteps.length + 1,
            action: 'merge',
            indexA: a.origIdx,
            indexB: b.origIdx,
            valueA: valA,
            valueB: valB,
            description: `Compare [${a.origIdx}] "${valA}" vs [${b.origIdx}] "${valB}" → pilih ${cmp <= 0 ? `[${a.origIdx}]` : `[${b.origIdx}]`}`,
          });
        }

        if (cmp <= 0) {
          merged[k++] = left[i++];
        } else {
          merged[k++] = right[j++];
        }
        swapsCount += 1;
      }
      while (i < left.length) {
        merged[k++] = left[i++];
        swapsCount += 1;
      }
      while (j < right.length) {
        merged[k++] = right[j++];
        swapsCount += 1;
      }
      return merged;
    };

    const divideWrapped = (slice: IndexedItem<T>[]): IndexedItem<T>[] => {
      if (slice.length <= 1) return slice;
      const mid = slice.length >> 1;
      return mergeWrapped(
        divideWrapped(slice.slice(0, mid)),
        divideWrapped(slice.slice(mid)),
      );
    };

    sorted = divideWrapped(wrapped).map((w) => w.item);
  } else {
    const mergeGeneric = (left: T[], right: T[]): T[] => {
      const merged: T[] = new Array(left.length + right.length);
      let i = 0;
      let j = 0;
      let k = 0;
      while (i < left.length && j < right.length) {
        comparisonsCount += 1;
        if (compareFn!(left[i], right[j]) <= 0) {
          merged[k++] = left[i++];
        } else {
          merged[k++] = right[j++];
        }
        swapsCount += 1;
      }
      while (i < left.length) {
        merged[k++] = left[i++];
        swapsCount += 1;
      }
      while (j < right.length) {
        merged[k++] = right[j++];
        swapsCount += 1;
      }
      return merged;
    };

    const divideGeneric = (slice: T[]): T[] => {
      if (slice.length <= 1) return slice;
      const mid = slice.length >> 1;
      return mergeGeneric(
        divideGeneric(slice.slice(0, mid)),
        divideGeneric(slice.slice(mid)),
      );
    };

    sorted = divideGeneric([...items]);
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  return {
    result: sorted,
    sorted,
    executionTimeMs,
    comparisons: comparisonsCount,
    comparisonsCount,
    swaps: swapsCount,
    swapsCount,
    traceSteps,
    metrics: {
      algorithmName: 'Merge Sort',
      executionTimeMs,
      comparisonsCount,
      swapsCount,
      itemCount: n,
    },
  };
}

/**
 * Pure Insertion Sort (O(n^2) average/worst case, O(n) best case).
 */
export function insertionSort(
  books: readonly Book[],
  key?: SortField,
  order?: SortOrder,
): SortResult<Book>;
export function insertionSort<T>(
  items: readonly T[],
  compareFn?: Comparator<T>,
): SortResult<T>;
export function insertionSort<T>(
  items: readonly T[],
  keyOrCompare?: Comparator<T> | SortField,
  order: SortOrder = 'asc',
): SortResult<T> {
  const n = items.length;
  const arr = [...items];
  let comparisonsCount = 0;
  let swapsCount = 0;
  const traceSteps: SortTraceStep[] = [];

  const isBookFieldMode = typeof keyOrCompare === 'string';
  const field = isBookFieldMode ? (keyOrCompare as SortField) : null;
  const dir = order === 'asc' ? 1 : -1;
  const compareFn = isBookFieldMode ? null : resolveSortArguments(keyOrCompare, order);

  const startTime = performance.now();

  if (isBookFieldMode && field) {
    const keys: (string | number)[] = arr.map((item) =>
      extractFastBookKey(item as unknown as Book, field),
    );
    const ids: string[] = arr.map((item) => (item as unknown as Book).id);

    for (let i = 1; i < n; i += 1) {
      const curItem = arr[i];
      const curKey = keys[i];
      const curId = ids[i];
      let j = i - 1;

      while (j >= 0) {
        comparisonsCount += 1;
        const kj = keys[j];
        let cmp = 0;
        if (kj < curKey) cmp = -dir;
        else if (kj > curKey) cmp = dir;
        else cmp = ids[j] < curId ? -1 : ids[j] > curId ? 1 : 0;

        if (cmp > 0) {
          if (traceSteps.length < 30) {
            const valA = formatBookFieldValue(arr[j] as unknown as Book, field);
            const valB = formatBookFieldValue(curItem as unknown as Book, field);
            traceSteps.push({
              step: traceSteps.length + 1,
              action: 'shift',
              indexA: j,
              indexB: j + 1,
              valueA: valA,
              valueB: valB,
              description: `Compare [${j}] "${valA}" > sisipan "${valB}" → Geser ke [${j + 1}]`,
            });
          }
          arr[j + 1] = arr[j];
          keys[j + 1] = keys[j];
          ids[j + 1] = ids[j];
          swapsCount += 1;
          j -= 1;
        } else {
          if (traceSteps.length < 30) {
            const valA = formatBookFieldValue(arr[j] as unknown as Book, field);
            const valB = formatBookFieldValue(curItem as unknown as Book, field);
            traceSteps.push({
              step: traceSteps.length + 1,
              action: 'compare',
              indexA: j,
              indexB: j + 1,
              valueA: valA,
              valueB: valB,
              description: `Compare [${j}] "${valA}" <= "${valB}" → Sisipkan di indeks [${j + 1}]`,
            });
          }
          break;
        }
      }
      arr[j + 1] = curItem;
      keys[j + 1] = curKey;
      ids[j + 1] = curId;
    }
  } else {
    for (let i = 1; i < n; i += 1) {
      const key = arr[i];
      let j = i - 1;
      while (j >= 0) {
        comparisonsCount += 1;
        if (compareFn!(arr[j], key) > 0) {
          arr[j + 1] = arr[j];
          swapsCount += 1;
          j -= 1;
        } else {
          break;
        }
      }
      arr[j + 1] = key;
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  return {
    result: arr,
    sorted: arr,
    executionTimeMs,
    comparisons: comparisonsCount,
    comparisonsCount,
    swaps: swapsCount,
    swapsCount,
    traceSteps,
    metrics: {
      algorithmName: 'Insertion Sort',
      executionTimeMs,
      comparisonsCount,
      swapsCount,
      itemCount: n,
    },
  };
}

/**
 * Pure Bubble Sort (O(n^2) average/worst case, O(n) best case with early-exit flag).
 */
export function bubbleSort(
  books: readonly Book[],
  key?: SortField,
  order?: SortOrder,
): SortResult<Book>;
export function bubbleSort<T>(
  items: readonly T[],
  compareFn?: Comparator<T>,
): SortResult<T>;
export function bubbleSort<T>(
  items: readonly T[],
  keyOrCompare?: Comparator<T> | SortField,
  order: SortOrder = 'asc',
): SortResult<T> {
  const n = items.length;
  const arr = [...items];
  let comparisonsCount = 0;
  let swapsCount = 0;
  const traceSteps: SortTraceStep[] = [];

  const isBookFieldMode = typeof keyOrCompare === 'string';
  const field = isBookFieldMode ? (keyOrCompare as SortField) : null;
  const dir = order === 'asc' ? 1 : -1;
  const compareFn = isBookFieldMode ? null : resolveSortArguments(keyOrCompare, order);

  const startTime = performance.now();

  if (isBookFieldMode && field) {
    const keys: (string | number)[] = arr.map((item) =>
      extractFastBookKey(item as unknown as Book, field),
    );
    const ids: string[] = arr.map((item) => (item as unknown as Book).id);

    for (let i = 0; i < n - 1; i += 1) {
      let swapped = false;
      const limit = n - 1 - i;
      for (let j = 0; j < limit; j += 1) {
        comparisonsCount += 1;
        const ka = keys[j];
        const kb = keys[j + 1];
        let cmp = 0;
        if (ka < kb) cmp = -dir;
        else if (ka > kb) cmp = dir;
        else cmp = ids[j] < ids[j + 1] ? -1 : ids[j] > ids[j + 1] ? 1 : 0;

        if (cmp > 0) {
          if (traceSteps.length < 30) {
            const valA = formatBookFieldValue(arr[j] as unknown as Book, field);
            const valB = formatBookFieldValue(arr[j + 1] as unknown as Book, field);
            traceSteps.push({
              step: traceSteps.length + 1,
              action: 'swap',
              indexA: j,
              indexB: j + 1,
              valueA: valA,
              valueB: valB,
              description: `Compare [${j}] "${valA}" vs [${j + 1}] "${valB}" → Swap`,
            });
          }

          const tmpItem = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = tmpItem;

          const tmpKey = keys[j];
          keys[j] = keys[j + 1];
          keys[j + 1] = tmpKey;

          const tmpId = ids[j];
          ids[j] = ids[j + 1];
          ids[j + 1] = tmpId;

          swapsCount += 1;
          swapped = true;
        } else if (traceSteps.length < 15 && i === 0 && j < 6) {
          const valA = formatBookFieldValue(arr[j] as unknown as Book, field);
          const valB = formatBookFieldValue(arr[j + 1] as unknown as Book, field);
          traceSteps.push({
            step: traceSteps.length + 1,
            action: 'compare',
            indexA: j,
            indexB: j + 1,
            valueA: valA,
            valueB: valB,
            description: `Compare [${j}] "${valA}" vs [${j + 1}] "${valB}" → Tetap (Sudah Urut)`,
          });
        }
      }
      if (!swapped) break;
    }
  } else {
    for (let i = 0; i < n - 1; i += 1) {
      let swapped = false;
      const limit = n - 1 - i;
      for (let j = 0; j < limit; j += 1) {
        comparisonsCount += 1;
        if (compareFn!(arr[j], arr[j + 1]) > 0) {
          const tmp = arr[j];
          arr[j] = arr[j + 1];
          arr[j + 1] = tmp;
          swapsCount += 1;
          swapped = true;
        }
      }
      if (!swapped) break;
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  return {
    result: arr,
    sorted: arr,
    executionTimeMs,
    comparisons: comparisonsCount,
    comparisonsCount,
    swaps: swapsCount,
    swapsCount,
    traceSteps,
    metrics: {
      algorithmName: 'Bubble Sort',
      executionTimeMs,
      comparisonsCount,
      swapsCount,
      itemCount: n,
    },
  };
}

export function sortBooksWithBubbleSort(
  books: readonly Book[],
  field: SortField,
  order: SortOrder = 'asc',
): SortResult<Book> {
  return bubbleSort(books, field, order);
}

export function sortBooksWithQuickSort(
  books: readonly Book[],
  field: SortField,
  order: SortOrder = 'asc',
): SortResult<Book> {
  return quickSort(books, field, order);
}

export function sortBooksWithMergeSort(
  books: readonly Book[],
  field: SortField,
  order: SortOrder = 'asc',
): SortResult<Book> {
  return mergeSort(books, field, order);
}

export function sortBooksWithInsertionSort(
  books: readonly Book[],
  field: SortField,
  order: SortOrder = 'asc',
): SortResult<Book> {
  return insertionSort(books, field, order);
}

const SORT_BIG_O_MAP: Record<
  SortAlgorithmType,
  { name: string; best: string; average: string; worst: string }
> = {
  bubble: {
    name: 'Bubble Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  insertion: {
    name: 'Insertion Sort',
    best: 'O(n)',
    average: 'O(n²)',
    worst: 'O(n²)',
  },
  merge: {
    name: 'Merge Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n log n)',
  },
  quick: {
    name: 'Quick Sort',
    best: 'O(n log n)',
    average: 'O(n log n)',
    worst: 'O(n²)',
  },
};

/**
 * Pure manual substring check (without String.prototype.includes).
 */
function manualContainsText(haystack: string, needle: string): boolean {
  if (needle.length === 0) return true;
  if (needle.length > haystack.length) return false;
  const maxStart = haystack.length - needle.length;
  for (let i = 0; i <= maxStart; i += 1) {
    let match = true;
    for (let j = 0; j < needle.length; j += 1) {
      if (haystack.charCodeAt(i + j) !== needle.charCodeAt(j)) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

/**
 * Slices directly from the real inventory `books` (50, 1.000, or all 10.000+ books),
 * sorts the ENTIRE slice with all 4 sorting algorithms head-to-head (never filtering before sorting),
 * and performs Post-Sort Highlighting if `highlightQuery` is provided!
 */
export function runDetailedSort(
  inventoryBooks: readonly Book[],
  scale: DatasetSliceScale,
  algorithm: SortAlgorithmType,
  field: SortField,
  order: SortOrder,
  highlightQuery: string = '',
): SortExecutionReport {
  const actualCount =
    scale >= 10000
      ? inventoryBooks.length
      : Math.min(scale, inventoryBooks.length);
  const sliced = inventoryBooks.slice(0, actualCount);
  const normalizedHighlight = highlightQuery.trim().toLowerCase();

  const origIndexMap = new Map<string, number>();
  for (let i = 0; i < sliced.length; i += 1) {
    origIndexMap.set(sliced[i].id, i);
  }

  const beforePreviewCount = Math.min(10, sliced.length);
  const beforeSlice: IndexedBookSnapshot[] = [];
  for (let i = 0; i < beforePreviewCount; i += 1) {
    const b = sliced[i];
    beforeSlice.push({
      originalIndex: i,
      book: b,
    });
  }

  // Run all 4 sorting algorithms on the FULL slice for authentic head-to-head benchmark
  const bubbleRes = bubbleSort(sliced, field, order);
  const insertionRes = insertionSort(sliced, field, order);
  const mergeRes = mergeSort(sliced, field, order);
  const quickRes = quickSort(sliced, field, order);

  const resultsByAlg: Record<SortAlgorithmType, SortResult<Book>> = {
    bubble: bubbleRes,
    insertion: insertionRes,
    merge: mergeRes,
    quick: quickRes,
  };

  const sortRes = resultsByAlg[algorithm];

  // Determine the winner
  const allOrder: SortAlgorithmType[] = ['quick', 'merge', 'insertion', 'bubble'];
  let winnerAlg: SortAlgorithmType = 'quick';
  let slowestAlg: SortAlgorithmType = 'bubble';

  for (const alg of allOrder) {
    const cur = resultsByAlg[alg];
    const win = resultsByAlg[winnerAlg];
    if (
      cur.comparisonsCount < win.comparisonsCount ||
      (cur.comparisonsCount === win.comparisonsCount &&
        cur.executionTimeMs < win.executionTimeMs)
    ) {
      winnerAlg = alg;
    }
    const slow = resultsByAlg[slowestAlg];
    if (
      cur.comparisonsCount > slow.comparisonsCount ||
      (cur.comparisonsCount === slow.comparisonsCount &&
        cur.executionTimeMs > slow.executionTimeMs)
    ) {
      slowestAlg = alg;
    }
  }

  const headToHead: SortHeadToHeadItem[] = (
    ['quick', 'merge', 'insertion', 'bubble'] as SortAlgorithmType[]
  ).map((alg) => {
    const r = resultsByAlg[alg];
    const meta = SORT_BIG_O_MAP[alg];
    return {
      algorithm: alg,
      algorithmName: meta.name,
      bigO: meta.average,
      executionTimeMs: r.executionTimeMs,
      comparisonsCount: r.comparisonsCount,
      swapsCount: r.swapsCount,
      isWinner: alg === winnerAlg,
      isSelected: alg === algorithm,
    };
  });

  // Post-Sort Highlighting: find positions of books matching highlightQuery AFTER sorting
  const highlightedPositions: PostSortHighlightMatch[] = [];
  if (normalizedHighlight) {
    for (let i = 0; i < sortRes.sorted.length; i += 1) {
      const b = sortRes.sorted[i];
      const candidate = formatBookFieldValue(b, field).toLowerCase();
      if (manualContainsText(candidate, normalizedHighlight)) {
        highlightedPositions.push({
          rackNumber: i + 1,
          index: i,
          originalIndex: origIndexMap.get(b.id) ?? i,
          book: b,
        });
      }
    }
  }

  const afterPreviewCount = Math.min(10, sortRes.sorted.length);
  const afterSlice: IndexedBookSnapshot[] = [];
  for (let i = 0; i < afterPreviewCount; i += 1) {
    const b = sortRes.sorted[i];
    afterSlice.push({
      finalIndex: i,
      originalIndex: origIndexMap.get(b.id) ?? i,
      book: b,
    });
  }

  const n = sliced.length;
  const nLogN = n > 1 ? Math.round(n * Math.log2(n)) : 1;
  const nSquaredHalf = Math.round((n * (n - 1)) / 2);
  const info = SORT_BIG_O_MAP[algorithm];
  const winnerInfo = SORT_BIG_O_MAP[winnerAlg];
  const winnerRes = resultsByAlg[winnerAlg];
  const slowestInfo = SORT_BIG_O_MAP[slowestAlg];
  const slowestRes = resultsByAlg[slowestAlg];

  const scaleLabel =
    scale === 50
      ? 'Data Kecil (50 Buku)'
      : scale === 1000
        ? 'Data Menengah (1.000 Buku)'
        : `Data Besar (${n.toLocaleString('id-ID')} Buku Inventaris)`;

  let highlightSummary = '';
  if (normalizedHighlight) {
    if (highlightedPositions.length > 0) {
      const sampleRanks = highlightedPositions
        .slice(0, 6)
        .map((m) => `#${m.rackNumber} (Indeks [${m.index}])`)
        .join(', ');
      const moreSuffix =
        highlightedPositions.length > 6
          ? ` dan ${highlightedPositions.length - 6} posisi lainnya`
          : '';
      highlightSummary = `Data telah diurutkan dengan ${info.name}. Buku "${highlightQuery}" ditemukan tersusun pada No. Posisi ${sampleRanks}${moreSuffix}!`;
    } else {
      highlightSummary = `Data telah diurutkan dengan ${info.name}, namun buku dengan kata kunci "${highlightQuery}" tidak ditemukan pada ${scaleLabel}.`;
    }
  }

  const winnerSummary = `Algoritma ${winnerInfo.name} (${winnerInfo.average}) paling unggul & efisien (${winnerRes.executionTimeMs.toFixed(4)} ms, ${winnerRes.comparisonsCount.toLocaleString('id-ID')} perbandingan) dibandingkan algoritma lainnya pada dataset ini (${n.toLocaleString('id-ID')} buku), mengungguli ${slowestInfo.name} yang membutuhkan ${slowestRes.executionTimeMs.toFixed(4)} ms dan ${slowestRes.comparisonsCount.toLocaleString('id-ID')} perbandingan.`;

  const isQuadratic = algorithm === 'bubble' || algorithm === 'insertion';
  const narrativeAnalysis = isQuadratic
    ? `Pada ${scaleLabel}, ${info.name} memiliki kompleksitas rata-rata ${info.average} dan mencatat ${sortRes.comparisonsCount.toLocaleString('id-ID')} perbandingan serta ${sortRes.swapsCount.toLocaleString('id-ID')} pertukaran/pergeseran dalam ${sortRes.executionTimeMs.toFixed(4)} ms (estimasi teoritis n(n-1)/2 ≈ ${nSquaredHalf.toLocaleString('id-ID')} operasi). Dibandingkan ${winnerInfo.name} (${winnerRes.executionTimeMs.toFixed(4)} ms, ${winnerRes.comparisonsCount.toLocaleString('id-ID')} perbandingan), algoritma kuadratik O(n²) melakukan operasi jauh lebih banyak seiring bertambahnya ukuran data.`
    : `Pada ${scaleLabel}, ${info.name} bekerja dengan kompleksitas ${info.average} (Divide & Conquer) dan menuntaskan pengurutan ${n.toLocaleString('id-ID')} buku nyata hanya dalam ${sortRes.executionTimeMs.toFixed(4)} ms dengan ${sortRes.comparisonsCount.toLocaleString('id-ID')} perbandingan (mendekati skala teoritis n log₂ n ≈ ${nLogN.toLocaleString('id-ID')}). Hal ini membuktikan efisiensi jauh lebih unggul dibandingkan ${slowestInfo.name} O(n²) yang membutuhkan ${slowestRes.comparisonsCount.toLocaleString('id-ID')} perbandingan (${slowestRes.executionTimeMs.toFixed(4)} ms) pada dataset yang sama.`;

  return {
    algorithm,
    algorithmName: info.name,
    bigO: {
      best: info.best,
      average: info.average,
      worst: info.worst,
    },
    scaleRequested: scale,
    itemCount: n,
    totalSliceCount: n,
    field,
    filterQuery: highlightQuery,
    highlightedPositions,
    highlightSummary,
    order,
    executionTimeMs: sortRes.executionTimeMs,
    comparisonsCount: sortRes.comparisonsCount,
    swapsCount: sortRes.swapsCount,
    beforeSlice,
    steps: (sortRes.traceSteps || []).slice(0, 35),
    totalOperationsLogged: sortRes.comparisonsCount + sortRes.swapsCount,
    afterSlice,
    sortedBooks: sortRes.sorted,
    headToHead,
    winnerSummary,
    narrativeAnalysis,
  };
}
