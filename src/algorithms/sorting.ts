import { AlgorithmMetrics, Book, SortField, SortOrder } from '../types';

export type Comparator<T> = (a: T, b: T) => number;

export interface SortResult<T> {
  result: T[];
  sorted: T[];
  executionTimeMs: number;
  comparisons: number;
  comparisonsCount: number;
  swaps: number;
  swapsCount: number;
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
 * breaking ties by Book.id without calling localeCompare (ensuring smooth 10k-item runs).
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
  if (field === 'tahunTerbit') return book.tahunTerbit;
  return book.stokTersedia;
}

/**
 * Pure Quick Sort using median-of-three pivot selection and Hoare partitioning
 * with tail-call optimization (max recursion depth <= log2(N)).
 * Safe on 10.000 sorted or reversed items without stack overflow.
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

  // When sorting Book[] by field, pre-extract normalized keys for fast O(n log n) comparison
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

  const cmpPivot = (i: number, pivotVal: T, pivotKey: string | number, pivotId: string): number => {
    comparisonsCount += 1;
    if (keys && ids) {
      const ka = keys[i];
      if (ka < pivotKey) return -dir;
      if (ka > pivotKey) return dir;
      return ids[i] < pivotId ? -1 : ids[i] > pivotId ? 1 : 0;
    }
    return compareFn!(arr[i], pivotVal);
  };

  const swap = (i: number, j: number) => {
    if (i === j) return;
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

      // Median-of-three pivot ordering
      if (cmpIdx(low, mid) > 0) swap(low, mid);
      if (cmpIdx(low, high) > 0) swap(low, high);
      if (cmpIdx(mid, high) > 0) swap(mid, high);

      const pivotVal = arr[mid];
      const pivotKey = keys ? keys[mid] : 0;
      const pivotId = ids ? ids[mid] : '';

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

      // Recurse into smaller half only, iterate on larger half (tail recursion elimination)
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
 * Does NOT use Array.prototype.sort() and does NOT mutate the input array.
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

  const isBookFieldMode = typeof keyOrCompare === 'string';
  const field = isBookFieldMode ? (keyOrCompare as SortField) : null;
  const dir = order === 'asc' ? 1 : -1;
  const compareFn = isBookFieldMode ? null : resolveSortArguments(keyOrCompare, order);

  interface IndexedItem<U> {
    item: U;
    key: string | number;
    id: string;
  }

  const startTime = performance.now();
  let sorted: T[];

  if (n <= 1) {
    sorted = [...items];
  } else if (isBookFieldMode && field) {
    const wrapped: IndexedItem<T>[] = items.map((item) => {
      const b = item as unknown as Book;
      return {
        item,
        key: extractFastBookKey(b, field),
        id: b.id,
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
 * Does NOT use Array.prototype.sort() and does NOT mutate the input array.
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
          arr[j + 1] = arr[j];
          keys[j + 1] = keys[j];
          ids[j + 1] = ids[j];
          swapsCount += 1;
          j -= 1;
        } else {
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
    metrics: {
      algorithmName: 'Insertion Sort',
      executionTimeMs,
      comparisonsCount,
      swapsCount,
      itemCount: n,
    },
  };
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
