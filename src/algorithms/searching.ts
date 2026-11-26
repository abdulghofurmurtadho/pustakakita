import {
  Book,
  DatasetSliceScale,
  IndexedBookSnapshot,
  SearchAlgorithmType,
  SearchBenchmarkResult,
  SearchExecutionReport,
  SearchHeadToHeadItem,
  SearchStep,
} from '../types';
import { quickSort } from './sorting';

export type SearchField =
  | 'judul'
  | 'isbn'
  | 'penulis'
  | 'tahunTerbit'
  | 'kodeRak'
  | 'all';
export type BinarySearchKey =
  | 'judul'
  | 'isbn'
  | 'penulis'
  | 'tahunTerbit'
  | 'kodeRak';

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

export function getBookCriterionString(book: Book, field: BinarySearchKey): string {
  if (field === 'tahunTerbit') {
    return String(book.tahunTerbit);
  }
  if (field === 'kodeRak') {
    return book.kodeRak;
  }
  return book[field];
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
      requiresPreSort: false,
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
    let displayValue = book.judul;
    if (field === 'judul') {
      displayValue = book.judul;
      isMatch = manualContains(book.judul.toLowerCase(), normalizedQuery);
    } else if (field === 'penulis') {
      displayValue = book.penulis;
      isMatch = manualContains(book.penulis.toLowerCase(), normalizedQuery);
    } else if (field === 'isbn') {
      displayValue = book.isbn;
      isMatch = manualContains(book.isbn.toLowerCase(), normalizedQuery);
    } else if (field === 'tahunTerbit') {
      displayValue = `${book.tahunTerbit} (${book.judul})`;
      isMatch = manualContains(String(book.tahunTerbit), normalizedQuery);
    } else if (field === 'kodeRak') {
      displayValue = `${book.kodeRak} — ${book.judul}`;
      isMatch = manualContains(book.kodeRak.toLowerCase(), normalizedQuery);
    } else {
      displayValue = `${book.judul} (${book.isbn})`;
      isMatch =
        manualContains(book.judul.toLowerCase(), normalizedQuery) ||
        manualContains(book.penulis.toLowerCase(), normalizedQuery) ||
        manualContains(book.isbn.toLowerCase(), normalizedQuery) ||
        manualContains(book.kodeRak.toLowerCase(), normalizedQuery) ||
        manualContains(String(book.tahunTerbit), normalizedQuery);
    }

    if (isMatch) {
      if (foundIndex === -1) {
        foundIndex = i;
      }
      matchedBooks.push(book);
    }

    if (steps.length < 25 || (isMatch && steps.length < 35)) {
      steps.push({
        step: i + 1,
        phase: 'linear',
        mid: i,
        value: displayValue,
        matched: isMatch,
        direction: isMatch ? 'found' : 'scan',
        description: isMatch
          ? `Iterasi ${i + 1}: Cek posisi [${i}] "${displayValue}" -> COCOK DITEMUKAN!`
          : `Iterasi ${i + 1}: Cek posisi [${i}] "${displayValue}" -> tidak cocok`,
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
    requiresPreSort: false,
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
 * Pure Jump Search O(√n):
 * 1. Ensures dataset is sorted by `searchKey` ascending via pure Quick Sort.
 * 2. Jumps in blocks of size m = floor(√n) until block boundary >= target.
 * 3. Performs linear scan within the identified candidate block [prev .. blockEnd].
 */
export function jumpSearchBooks(
  books: readonly Book[],
  query: string,
  searchKey: BinarySearchKey = 'judul',
  preSortedBooks?: readonly Book[],
): SearchBenchmarkResult {
  const normalizedQuery = query.trim().toLowerCase();

  let preSortTimeMs = 0;
  let sortedBooks: readonly Book[];
  if (preSortedBooks) {
    sortedBooks = preSortedBooks;
  } else {
    const sortRes = quickSort(books, searchKey, 'asc');
    sortedBooks = sortRes.sorted;
    preSortTimeMs = sortRes.executionTimeMs;
  }

  const n = sortedBooks.length;
  const jumpStepSize = n > 0 ? Math.max(1, Math.floor(Math.sqrt(n))) : 1;

  if (!normalizedQuery || n === 0) {
    return {
      algorithm: 'jump',
      algorithmName: 'Jump Search',
      query,
      foundIndex: n > 0 ? 0 : -1,
      matchedBooks: [...sortedBooks],
      visitedIndices: [],
      steps: [],
      comparisons: 0,
      comparisonsCount: 0,
      executionTimeMs: 0,
      preSortTimeMs,
      requiresPreSort: true,
      jumpStepSize,
      itemCount: n,
      sortedOrderUsed: [...sortedBooks],
    };
  }

  const visitedIndices: number[] = [];
  const steps: SearchStep[] = [];
  let comparisonsCount = 0;
  let foundIndex = -1;

  const startTime = performance.now();

  let prev = 0;
  let curr = 0;

  // Phase 1: Jump by block size m = floor(sqrt(n))
  while (curr < n) {
    const rawVal = getBookCriterionString(sortedBooks[curr], searchKey);
    const normVal = rawVal.trim().toLowerCase();
    comparisonsCount += 1;
    visitedIndices.push(curr);

    const isPrefixHit = manualStartsWith(normVal, normalizedQuery);
    const isGreaterOrEqual = normVal >= normalizedQuery || isPrefixHit;

    if (steps.length < 30) {
      steps.push({
        step: comparisonsCount,
        phase: 'jump',
        blockStart: prev,
        blockEnd: curr,
        jumpSize: jumpStepSize,
        mid: curr,
        value: rawVal,
        matched: isPrefixHit,
        direction: isGreaterOrEqual ? 'found' : 'jump',
        description: isGreaterOrEqual
          ? `Lompat posisi [${prev}] -> [${curr}] (blok √n=${jumpStepSize}): "${rawVal}" >= target "${query}" -> Hentikan lompatan, telusuri blok [${prev}..${curr}]`
          : `Lompat posisi [${curr}] -> [${Math.min(n - 1, curr + jumpStepSize)}] (blok √n=${jumpStepSize}): "${rawVal}" < target`,
      });
    }

    if (isGreaterOrEqual) {
      break;
    }

    prev = curr;
    if (curr === n - 1) {
      prev = n;
      break;
    }
    curr = Math.min(n - 1, curr + jumpStepSize);
  }

  // Phase 2: Linear scan within block [prev .. min(curr, n - 1)]
  const scanEnd = Math.min(curr, n - 1);
  for (let i = prev; i <= scanEnd; i += 1) {
    const rawVal = getBookCriterionString(sortedBooks[i], searchKey);
    const normVal = rawVal.trim().toLowerCase();
    comparisonsCount += 1;
    visitedIndices.push(i);

    const isMatch = manualStartsWith(normVal, normalizedQuery);
    if (steps.length < 35) {
      steps.push({
        step: comparisonsCount,
        phase: 'linear',
        blockStart: prev,
        blockEnd: scanEnd,
        jumpSize: jumpStepSize,
        mid: i,
        value: rawVal,
        matched: isMatch,
        direction: isMatch ? 'found' : 'scan',
        description: isMatch
          ? `Telusuri linear dalam blok [${prev}..${scanEnd}]: cek indeks [${i}] "${rawVal}" → COCOK DITEMUKAN!`
          : `Telusuri linear dalam blok [${prev}..${scanEnd}]: cek indeks [${i}] "${rawVal}" → Belum cocok`,
      });
    }

    if (isMatch) {
      foundIndex = i;
      break;
    }

    if (normVal > normalizedQuery) {
      break;
    }
  }

  // Fallback substring scan if prefix search didn't match (e.g. user typed middle word like "Ruang")
  if (foundIndex === -1) {
    for (let i = 0; i < n; i += 1) {
      const rawVal = getBookCriterionString(sortedBooks[i], searchKey);
      const normVal = rawVal.trim().toLowerCase();
      comparisonsCount += 1;
      if (manualContains(normVal, normalizedQuery)) {
        foundIndex = i;
        if (steps.length < 35) {
          steps.push({
            step: comparisonsCount,
            phase: 'linear',
            mid: i,
            value: rawVal,
            matched: true,
            direction: 'found',
            description: `Sub-kata kunci cocok pada indeks terurut [${i}] "${rawVal}" → COCOK DITEMUKAN!`,
          });
        }
        break;
      }
    }
  }

  const endTime = performance.now();
  const executionTimeMs = Number((endTime - startTime).toFixed(4));

  const matchedBooks: Book[] = [];
  if (foundIndex !== -1) {
    // Collect prefix matches around foundIndex, or substring matches
    let idx = foundIndex;
    while (
      idx >= 0 &&
      manualContains(
        getBookCriterionString(sortedBooks[idx], searchKey).trim().toLowerCase(),
        normalizedQuery,
      )
    ) {
      idx -= 1;
    }
    idx += 1;
    while (
      idx < n &&
      manualContains(
        getBookCriterionString(sortedBooks[idx], searchKey).trim().toLowerCase(),
        normalizedQuery,
      )
    ) {
      matchedBooks.push(sortedBooks[idx]);
      idx += 1;
    }
  }

  return {
    algorithm: 'jump',
    algorithmName: 'Jump Search',
    query,
    foundIndex,
    matchedBooks,
    visitedIndices,
    steps,
    comparisons: comparisonsCount,
    comparisonsCount,
    executionTimeMs,
    preSortTimeMs,
    requiresPreSort: true,
    jumpStepSize,
    itemCount: n,
    sortedOrderUsed: [...sortedBooks],
  };
}

/**
 * Pure Binary Search O(log n) recording low/mid/high pointers on every iteration.
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
        phase: 'binary',
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: true,
        direction: 'found',
        description: `Iterasi #${stepNumber}: Low=${low}, Mid=${mid}, High=${high} → Nilai Mid="${rawValue}" COCOK!`,
      });
      break;
    }

    if (midValue < normalizedTarget) {
      steps.push({
        step: stepNumber,
        phase: 'binary',
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: false,
        direction: 'right',
        description: `Iterasi #${stepNumber}: Low=${low}, Mid=${mid}, High=${high} → "${rawValue}" < target → Geser Low ke ${mid + 1}`,
      });
      low = mid + 1;
    } else {
      steps.push({
        step: stepNumber,
        phase: 'binary',
        left: low,
        right: high,
        low,
        high,
        mid,
        value: rawValue,
        matched: false,
        direction: 'left',
        description: `Iterasi #${stepNumber}: Low=${low}, Mid=${mid}, High=${high} → "${rawValue}" > target → Geser High ke ${mid - 1}`,
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

  let preSortTimeMs = 0;
  let sortedBooks: readonly Book[];
  if (preSortedBooks) {
    sortedBooks = preSortedBooks;
  } else {
    const sortRes = quickSort(books, searchKey, 'asc');
    sortedBooks = sortRes.sorted;
    preSortTimeMs = sortRes.executionTimeMs;
  }

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
      preSortTimeMs,
      requiresPreSort: true,
      itemCount: books.length,
      sortedOrderUsed: [...sortedBooks],
    };
  }

  const result = binarySearch(
    sortedBooks,
    query,
    (book) => getBookCriterionString(book, searchKey),
    'prefix',
  );

  const matchedBooks: Book[] = [];
  if (result.foundIndex !== -1) {
    let idx = result.foundIndex;
    while (
      idx >= 0 &&
      manualStartsWith(
        getBookCriterionString(sortedBooks[idx], searchKey).trim().toLowerCase(),
        normalizedQuery,
      )
    ) {
      idx -= 1;
    }
    idx += 1;
    while (
      idx < sortedBooks.length &&
      manualStartsWith(
        getBookCriterionString(sortedBooks[idx], searchKey).trim().toLowerCase(),
        normalizedQuery,
      )
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
    preSortTimeMs,
    requiresPreSort: true,
    itemCount: books.length,
    sortedOrderUsed: [...sortedBooks],
  };
}

/**
 * Slices directly from the real inventory `books` (50, 1.000, or all 10.000+ books),
 * runs all 3 searching algorithms (Linear Search, Jump Search, Binary Search) head-to-head,
 * and builds the full 4-stage transparent Searching Execution Report:
 * 1. Before Slice -> 2. Step-by-Step Trace -> 3. After Result -> 4. Head-to-Head & Empirical Analysis.
 */
export function runDetailedSearch(
  inventoryBooks: readonly Book[],
  scale: DatasetSliceScale,
  algorithm: SearchAlgorithmType,
  field: BinarySearchKey,
  query: string,
): SearchExecutionReport {
  const actualCount =
    scale >= 10000
      ? inventoryBooks.length
      : Math.min(scale, inventoryBooks.length);
  const sliced = inventoryBooks.slice(0, actualCount);

  // Pre-sort once for Jump & Binary Search so we also measure pre-sort time accurately
  const preSortRes = quickSort(sliced, field, 'asc');
  const preSorted = preSortRes.sorted;
  const preSortTimeMs = preSortRes.executionTimeMs;

  const linearRes = linearSearchBooks(sliced, query, field);
  const jumpRes = {
    ...jumpSearchBooks(sliced, query, field, preSorted),
    preSortTimeMs,
  };
  const binaryRes = {
    ...binarySearchBooks(sliced, query, field, preSorted),
    preSortTimeMs,
  };

  const resultsByAlg: Record<SearchAlgorithmType, SearchBenchmarkResult> = {
    linear: linearRes,
    jump: jumpRes,
    binary: binaryRes,
  };

  const searchRes = resultsByAlg[algorithm];

  // Determine head-to-head winner (fewest comparisons/steps & fastest search time)
  const allAlgs: SearchAlgorithmType[] = ['binary', 'jump', 'linear'];
  let leastStepsAlg: SearchAlgorithmType = 'binary';
  let fastestAlg: SearchAlgorithmType = 'binary';

  for (const alg of allAlgs) {
    if (resultsByAlg[alg].comparisonsCount < resultsByAlg[leastStepsAlg].comparisonsCount) {
      leastStepsAlg = alg;
    }
    if (resultsByAlg[alg].executionTimeMs < resultsByAlg[fastestAlg].executionTimeMs) {
      fastestAlg = alg;
    }
  }

  const headToHead: SearchHeadToHeadItem[] = (
    ['linear', 'jump', 'binary'] as SearchAlgorithmType[]
  ).map((alg) => {
    const r = resultsByAlg[alg];
    const bo = alg === 'linear' ? 'O(n)' : alg === 'jump' ? 'O(√n)' : 'O(log n)';
    return {
      algorithm: alg,
      algorithmName: r.algorithmName,
      bigO: bo,
      executionTimeMs: r.executionTimeMs,
      preSortTimeMs: r.preSortTimeMs ?? 0,
      comparisonsCount: r.comparisonsCount,
      foundIndex: r.foundIndex,
      matchedCount: r.matchedBooks.length,
      isFastest: alg === fastestAlg,
      isLeastSteps: alg === leastStepsAlg,
      isSelected: alg === algorithm,
    };
  });

  const activeDataset = searchRes.sortedOrderUsed ?? sliced;
  const previewCount = Math.min(8, activeDataset.length);
  const beforeSlice: IndexedBookSnapshot[] = [];
  for (let i = 0; i < previewCount; i += 1) {
    beforeSlice.push({
      originalIndex: i,
      book: activeDataset[i],
    });
  }

  const n = sliced.length;
  const maxLogN = n > 0 ? Math.ceil(Math.log2(n)) : 1;
  const sqrtN = n > 0 ? Math.floor(Math.sqrt(n)) : 1;
  const bigO =
    algorithm === 'linear' ? 'O(n)' : algorithm === 'jump' ? 'O(√n)' : 'O(log n)';
  const scaleLabel =
    scale === 50
      ? 'Data Kecil (50 Buku)'
      : scale === 1000
        ? 'Data Menengah (1.000 Buku)'
        : `Data Besar (${n.toLocaleString('id-ID')} Buku Inventaris)`;

  const foundBook =
    searchRes.foundIndex !== -1
      ? activeDataset[searchRes.foundIndex] ?? searchRes.matchedBooks[0] ?? null
      : null;

  const winnerItem = resultsByAlg[leastStepsAlg];
  const winnerBigO =
    leastStepsAlg === 'binary'
      ? 'O(log n)'
      : leastStepsAlg === 'jump'
        ? 'O(√n)'
        : 'O(n)';

  const winnerSummary = !query.trim()
    ? 'Ketik kata kunci pada kotak input di atas lalu klik tombol Cari untuk melihat perbandingan ketiga algoritma.'
    : `Pada pencarian "${query}" di ${scaleLabel}, algoritma ${winnerItem.algorithmName} (${winnerBigO}) paling unggul & efisien karena hanya membutuhkan ${winnerItem.comparisonsCount.toLocaleString('id-ID')} langkah (${winnerItem.executionTimeMs.toFixed(4)} ms), jauh lebih sedikit dibandingkan Jump Search (${jumpRes.comparisonsCount.toLocaleString('id-ID')} langkah, ${jumpRes.executionTimeMs.toFixed(4)} ms) dan Linear Search (${linearRes.comparisonsCount.toLocaleString('id-ID')} langkah, ${linearRes.executionTimeMs.toFixed(4)} ms).`;

  let narrativeAnalysis = '';
  if (algorithm === 'linear') {
    narrativeAnalysis = `Pada ${scaleLabel}, Linear Search (${bigO}) memeriksa elemen satu per satu dari indeks [0] tanpa prasyarat pengurutan awal (${linearRes.comparisonsCount.toLocaleString('id-ID')} langkah, ${linearRes.executionTimeMs.toFixed(4)} ms). Dibandingkan Jump Search (${jumpRes.comparisonsCount.toLocaleString('id-ID')} langkah) dan Binary Search (${binaryRes.comparisonsCount.toLocaleString('id-ID')} langkah), Linear Search melakukan pemeriksaan jauh lebih banyak ketika data berada di tengah/akhir array.`;
  } else if (algorithm === 'jump') {
    narrativeAnalysis = `Pada ${scaleLabel}, Jump Search (${bigO}) mengurutkan data berdasarkan ${field} (${preSortTimeMs.toFixed(2)} ms), lalu melompat per blok sebesar √n = ${sqrtN} indeks sebelum menelusuri linear di dalam blok target. Pencarian "${query}" selesai dalam ${jumpRes.comparisonsCount.toLocaleString('id-ID')} langkah (${jumpRes.executionTimeMs.toFixed(4)} ms) — lebih cepat & hemat langkah dibanding Linear Search (${linearRes.comparisonsCount.toLocaleString('id-ID')} langkah), namun masih kalah efisien dibanding Binary Search yang hanya butuh ${binaryRes.comparisonsCount.toLocaleString('id-ID')} langkah.`;
  } else {
    narrativeAnalysis = `Pada ${scaleLabel}, Binary Search (${bigO}) mengurutkan data berdasarkan ${field} (${preSortTimeMs.toFixed(2)} ms), lalu membelah dua ruang pencarian (Low, Mid, High) secara iteratif. Pencarian "${query}" tuntas hanya dalam ${binaryRes.comparisonsCount.toLocaleString('id-ID')} langkah (${binaryRes.executionTimeMs.toFixed(4)} ms) dari batas teoritis ⌈log₂(${n})⌉ = ${maxLogN} langkah — mengalahkan Jump Search (${jumpRes.comparisonsCount.toLocaleString('id-ID')} langkah) dan Linear Search (${linearRes.comparisonsCount.toLocaleString('id-ID')} langkah).`;
  }

  return {
    algorithm,
    algorithmName: searchRes.algorithmName,
    bigO,
    scaleRequested: scale,
    itemCount: n,
    field,
    query,
    requiresPreSort: Boolean(searchRes.requiresPreSort),
    preSortTimeMs: searchRes.preSortTimeMs ?? 0,
    executionTimeMs: searchRes.executionTimeMs,
    comparisonsCount: searchRes.comparisonsCount,
    jumpStepSize: searchRes.jumpStepSize,
    foundIndex: searchRes.foundIndex,
    foundBook,
    matchedBooks: searchRes.matchedBooks,
    beforeSlice,
    steps: searchRes.steps,
    visitedIndices: searchRes.visitedIndices,
    headToHead,
    winnerSummary,
    narrativeAnalysis,
  };
}
