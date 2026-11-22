import { Book, SearchBenchmarkResult, SearchStep } from '../types';
import { quickSort } from './sorting';

export type SearchField = 'judul' | 'isbn' | 'penulis' | 'all';
export type BinarySearchKey = 'judul' | 'isbn' | 'penulis';

export interface GenericBinarySearchResult<T> {
  result: T | null;
  foundIndex: number;
  item: T | null;
  matchedBooks: T[];
  comparisons: number;
  comparisonsCount: number;
  executionTimeMs: number;
  visitedIndices: number[];
  steps: SearchStep[];
}

/**
 * Pure manual substring check (replaces String.prototype.includes).
 */
function manualContains(haystack: string, needle: string): boolean {
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
 * Pure manual prefix check (replaces String.prototype.startsWith).
 */
function manualStartsWith(haystack: string, prefix: string): boolean {
  if (prefix.length > haystack.length) return false;
  for (let i = 0; i < prefix.length; i += 1) {
    if (haystack.charCodeAt(i) !== prefix.charCodeAt(i)) {
      return false;
    }
  }
  return true;
}

/**
 * Pure Linear Search O(n) scanning index 0 to n - 1 without .find() or .includes().
 */
export function linearSearch(
  books: readonly Book[],
  query: string,
  field: SearchField = 'all',
): SearchBenchmarkResult {
  const normalizedQuery = query.trim().toLowerCase();
  const startTime = performance.now();

  if (!normalizedQuery) {
    const endTime = performance.now();
    const executionTimeMs = Number((endTime - startTime).toFixed(4));
    return {
      algorithm: 'linear',
      algorithmName: 'Linear Search',
      query,
      foundIndex: books.length > 0 ? 0 : -1,
      matchedBooks: [...books],
      visitedIndices: [],
      steps: [],
      comparisons: 0,
      comparisonsCount: 0,
      executionTimeMs,
      itemCount: books.length,
    };
  }

  const matchedBooks: Book[] = [];
  const visitedIndices: number[] = [];
  const steps: SearchStep[] = [];
  let comparisonsCount = 0;
  let foundIndex = -1;

  for (let i = 0; i < books.length; i += 1) {
    const book = books[i];
    comparisonsCount += 1;

    if (visitedIndices.length < 150) {
      visitedIndices.push(i);
    }

    let isMatch = false;
    if (field === 'judul') {
      isMatch = manualContains(book.judul.toLowerCase(), normalizedQuery);
    } else if (field === 'penulis') {
      isMatch = manualContains(book.penulis.toLowerCase(), normalizedQuery);
    } else if (field === 'isbn') {
      isMatch = manualContains(book.isbn.toLowerCase(), normalizedQuery);
    } else {
      isMatch =
        manualContains(book.judul.toLowerCase(), normalizedQuery) ||
        manualContains(book.penulis.toLowerCase(), normalizedQuery) ||
        manualContains(book.isbn.toLowerCase(), normalizedQuery);
    }

    if (isMatch) {
      if (foundIndex === -1) {
        foundIndex = i;
      }
      matchedBooks.push(book);
    }

    if (steps.length < 60) {
      steps.push({
        step: i + 1,
        mid: i,
        value: book.judul,
        matched: isMatch,
        direction: isMatch ? 'found' : 'right',
      });
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  return {
    algorithm: 'linear',
    algorithmName: 'Linear Search',
    query,
    foundIndex,
    matchedBooks,
    visitedIndices,
    steps,
    comparisons: comparisonsCount,
    comparisonsCount,
    executionTimeMs,
    itemCount: books.length,
  };
}

export function linearSearchBooks(
  books: readonly Book[],
  query: string,
  field: SearchField = 'all',
): SearchBenchmarkResult {
  return linearSearch(books, query, field);
}

/**
 * Pure Binary Search O(log n) recording low/mid/high pointers on every iteration.
 * Supports both:
 *  - binarySearch(sortedItems, target, keyExtractor?, matchMode?)
 *  - binarySearchBooks(books, target, field)
 */
export function binarySearch<T>(
  sortedItems: readonly T[],
  target: string,
  keyExtractor: (item: T) => string = (item) => String(item),
  matchMode: 'exact' | 'prefix' = 'exact',
): GenericBinarySearchResult<T> {
  const normalizedTarget = target.trim().toLowerCase();
  const visitedIndices: number[] = [];
  const steps: SearchStep[] = [];
  let comparisonsCount = 0;
  let foundIndex = -1;

  const startTime = performance.now();

  if (sortedItems.length === 0 || !normalizedTarget) {
    const endTime = performance.now();
    const executionTimeMs = Number((endTime - startTime).toFixed(4));
    return {
      result: null,
      foundIndex: -1,
      item: null,
      matchedBooks: [],
      comparisons: 0,
      comparisonsCount: 0,
      executionTimeMs,
      visitedIndices,
      steps,
    };
  }

  let low = 0;
  let high = sortedItems.length - 1;
  let stepNumber = 0;

  while (low <= high) {
    const mid = (low + high) >> 1;
    const rawValue = keyExtractor(sortedItems[mid]);
    const midValue = rawValue.trim().toLowerCase();

    stepNumber += 1;
    comparisonsCount += 1;
    visitedIndices.push(mid);

    const isMatch =
      matchMode === 'prefix'
        ? manualStartsWith(midValue, normalizedTarget)
        : midValue === normalizedTarget;

    if (isMatch) {
      foundIndex = mid;
      steps.push({
        step: stepNumber,
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: true,
        direction: 'found',
      });
      break;
    }

    if (midValue < normalizedTarget) {
      steps.push({
        step: stepNumber,
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: false,
        direction: 'right',
      });
      low = mid + 1;
    } else {
      steps.push({
        step: stepNumber,
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: false,
        direction: 'left',
      });
      high = mid - 1;
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));
  const foundItem = foundIndex !== -1 ? sortedItems[foundIndex] : null;

  return {
    result: foundItem,
    foundIndex,
    item: foundItem,
    matchedBooks: foundItem ? [foundItem] : [],
    comparisons: comparisonsCount,
    comparisonsCount,
    executionTimeMs,
    visitedIndices,
    steps,
  };
}

/**
 * Numeric Binary Search helper for sorted numeric arrays.
 */
export function binarySearchNumber(
  sortedNumbers: readonly number[],
  target: number,
): { foundIndex: number; comparisonsCount: number; visitedIndices: number[] } {
  let low = 0;
  let high = sortedNumbers.length - 1;
  let comparisonsCount = 0;
  const visitedIndices: number[] = [];

  while (low <= high) {
    const mid = (low + high) >> 1;
    comparisonsCount += 1;
    visitedIndices.push(mid);

    if (sortedNumbers[mid] === target) {
      return { foundIndex: mid, comparisonsCount, visitedIndices };
    }
    if (sortedNumbers[mid] < target) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  return { foundIndex: -1, comparisonsCount, visitedIndices };
}

/**
 * Pure Binary Search on Book collection:
 * Ensures sorted order by `searchKey` via pure quickSort (without .sort()),
 * runs O(log n) pointer search, and expands outward for prefix matches.
 */
export function binarySearchBooks(
  books: readonly Book[],
  query: string,
  searchKey: BinarySearchKey = 'judul',
  preSortedBooks?: readonly Book[],
): SearchBenchmarkResult {
  const normalizedQuery = query.trim().toLowerCase();

  const sortedBooks: readonly Book[] =
    preSortedBooks ??
    quickSort(books, (a, b) => {
      const av = a[searchKey].trim().toLowerCase();
      const bv = b[searchKey].trim().toLowerCase();
      if (av < bv) return -1;
      if (av > bv) return 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    }).sorted;

  if (!normalizedQuery) {
    return {
      algorithm: 'binary',
      algorithmName: 'Binary Search',
      query,
      foundIndex: sortedBooks.length > 0 ? 0 : -1,
      matchedBooks: [...sortedBooks],
      visitedIndices: [],
      steps: [],
      comparisons: 0,
      comparisonsCount: 0,
      executionTimeMs: 0,
      itemCount: books.length,
      sortedOrderUsed: [...sortedBooks],
    };
  }

  const result = binarySearch(
    sortedBooks,
    query,
    (book) => book[searchKey],
    'prefix',
  );

  const matchedBooks: Book[] = [];
  if (result.foundIndex !== -1) {
    let idx = result.foundIndex;
    while (
      idx >= 0 &&
      manualStartsWith(sortedBooks[idx][searchKey].trim().toLowerCase(), normalizedQuery)
    ) {
      idx -= 1;
    }
    idx += 1;
    while (
      idx < sortedBooks.length &&
      manualStartsWith(sortedBooks[idx][searchKey].trim().toLowerCase(), normalizedQuery)
    ) {
      matchedBooks.push(sortedBooks[idx]);
      idx += 1;
    }
  }

  return {
    algorithm: 'binary',
    algorithmName: 'Binary Search',
    query,
    foundIndex: result.foundIndex,
    matchedBooks,
    visitedIndices: result.visitedIndices,
    steps: result.steps,
    comparisons: result.comparisonsCount,
    comparisonsCount: result.comparisonsCount,
    executionTimeMs: result.executionTimeMs,
    itemCount: books.length,
    sortedOrderUsed: [...sortedBooks],
  };
}
