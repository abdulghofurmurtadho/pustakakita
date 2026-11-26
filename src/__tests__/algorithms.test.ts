import { describe, expect, it } from 'vitest';
import {
  exportBenchmarkToCsv,
  runMultiScaleSortBenchmark,
  runSearchBenchmark,
  runSearchPositionBenchmark,
  runSortBenchmark,
} from '../algorithms/benchmarkRunner';
import {
  binarySearch,
  binarySearchBooks,
  binarySearchNumber,
  jumpSearchBooks,
  linearSearch,
  runDetailedSearch,
} from '../algorithms/searching';
import {
  bubbleSort,
  compareBooks,
  insertionSort,
  mergeSort,
  quickSort,
  runDetailedSort,
} from '../algorithms/sorting';
import { generateBooks, prepareDatasetByCondition } from '../data/bookGenerator';
import { INITIAL_BOOKS } from '../data/initialSeed';
import { SortField, SortOrder } from '../types';
import { getCriterionInputConfig } from '../utils/formatters';

describe('Generator Dataset Besar 1.000 – 10.000 Buku (AC-02)', () => {
  it('generateBooks membangkitkan 1.000, 5.000, dan 10.000 buku dengan ID, ISBN, dan Judul 100% unik', () => {
    const scales = [1000, 5000, 10000];
    for (const count of scales) {
      const books = generateBooks(count);
      expect(books).toHaveLength(count);

      const idSet = new Set<string>();
      const isbnSet = new Set<string>();
      const titleSet = new Set<string>();

      for (const b of books) {
        idSet.add(b.id);
        isbnSet.add(b.isbn);
        titleSet.add(b.judul);
        expect(b.stokTotal).toBeGreaterThanOrEqual(1);
        expect(b.stokTersedia).toBeLessThanOrEqual(b.stokTotal);
      }

      expect(idSet.size).toBe(count);
      expect(isbnSet.size).toBe(count);
      expect(titleSet.size).toBe(count);
    }
  });
});

describe('Keamanan & Akurasi Algoritma Sorting pada Skala 1.000 & 10.000 Data (AC-03 & AC-04)', () => {
  it('quickSort, mergeSort, dan insertionSort identik dengan hasil referensi pada 1.000 buku di seluruh field', () => {
    const sample1k = generateBooks(1000);
    const fields: SortField[] = ['judul', 'tahunTerbit', 'stokTersedia', 'penulis'];
    const orders: SortOrder[] = ['asc', 'desc'];

    for (const field of fields) {
      for (const order of orders) {
        const expectedIds = [...sample1k]
          .sort((a, b) => compareBooks(a, b, field, order))
          .map((b) => b.id);

        const qRes = quickSort(sample1k, field, order);
        const mRes = mergeSort(sample1k, field, order);
        const iRes = insertionSort(sample1k, field, order);
        const bRes = bubbleSort(sample1k, field, order);

        expect(qRes.result.map((b) => b.id)).toEqual(expectedIds);
        expect(mRes.result.map((b) => b.id)).toEqual(expectedIds);
        expect(iRes.result.map((b) => b.id)).toEqual(expectedIds);
        expect(bRes.result.map((b) => b.id)).toEqual(expectedIds);
        expect(qRes.comparisons).toBeGreaterThan(0);
        expect(mRes.comparisons).toBeGreaterThan(0);
        expect(iRes.comparisons).toBeGreaterThan(0);
        expect(bRes.comparisons).toBeGreaterThan(0);
      }
    }
  });

  it('AC-03: quickSort aman dijalankan pada 10.000 buku terurut (ascending) maupun terurut terbalik (reversed) tanpa stack overflow', () => {
    const books10k = generateBooks(10000);
    const reversed10k = prepareDatasetByCondition(books10k, 'reversed', 'judul');
    const sortedAsc10k = quickSort(books10k, 'judul', 'asc').result;

    // Run quickSort on already-sorted 10,000 items
    const qOnSorted = quickSort(sortedAsc10k, 'judul', 'asc');
    expect(qOnSorted.result).toHaveLength(10000);
    expect(qOnSorted.result[0].id).toBe(sortedAsc10k[0].id);
    expect(qOnSorted.result[9999].id).toBe(sortedAsc10k[9999].id);

    // Run quickSort on reversed 10,000 items
    const qOnReversed = quickSort(reversed10k, 'judul', 'asc');
    expect(qOnReversed.result.map((b) => b.id)).toEqual(
      sortedAsc10k.map((b) => b.id),
    );

    // Merge Sort & Insertion Sort on 10,000 nearly_sorted & reversed items
    const mOnReversed = mergeSort(reversed10k, 'judul', 'asc');
    expect(mOnReversed.result.map((b) => b.id)).toEqual(
      sortedAsc10k.map((b) => b.id),
    );

    const nearlySorted10k = prepareDatasetByCondition(books10k, 'nearly_sorted', 'judul');
    const iOnNearly = insertionSort(nearlySorted10k, 'judul', 'asc');
    expect(iOnNearly.result.map((b) => b.id)).toEqual(
      sortedAsc10k.map((b) => b.id),
    );
  });

  it('AC-04: insertionSort & bubbleSort pada 10.000 data acak akurat dan jauh lebih banyak perbandingan daripada quickSort/mergeSort', () => {
    const books10k = generateBooks(10000);
    const metrics = runSortBenchmark(books10k, 'judul', 'asc', 'random');
    expect(metrics).toHaveLength(4);

    const quick = metrics[0];
    const merge = metrics[1];
    const insertion = metrics[2];
    const bubble = metrics[3];

    expect(quick.itemCount).toBe(10000);
    expect(merge.itemCount).toBe(10000);
    expect(insertion.itemCount).toBe(10000);
    expect(bubble.itemCount).toBe(10000);
    // O(n^2) vs O(n log n) empirical separation
    expect(insertion.comparisonsCount).toBeGreaterThan(quick.comparisonsCount * 10);
    expect(bubble.comparisonsCount).toBeGreaterThan(quick.comparisonsCount * 10);
    expect(insertion.comparisonsCount).toBeGreaterThan(merge.comparisonsCount * 10);
  });
});

describe('Algoritma Searching pada 1.000 dan 10.000 Data (AC-04 & AC-05)', () => {
  it('linearSearch dan binarySearch akurat menemukan target & mengembalikan -1 jika tidak ada pada 1.000 & 10.000 data', () => {
    const books10k = generateBooks(10000);
    const sorted10k = quickSort(books10k, 'isbn', 'asc').sorted;
    const targetBook = sorted10k[7321];

    const linHit = linearSearch(books10k, targetBook.isbn, 'isbn');
    expect(linHit.foundIndex).toBeGreaterThanOrEqual(0);
    expect(linHit.matchedBooks[0].id).toBe(targetBook.id);
    expect(linHit.comparisons).toBe(10000);

    const binHit = binarySearch(sorted10k, targetBook.isbn, (b) => b.isbn, 'exact');
    expect(binHit.foundIndex).toBe(7321);
    expect(binHit.item?.id).toBe(targetBook.id);
    expect(binHit.comparisons).toBeLessThanOrEqual(15);
    expect(binHit.steps.length).toBe(binHit.comparisons);
    expect(binHit.steps[0].low).toBe(0);
    expect(binHit.steps[0].high).toBe(9999);

    const binMiss = binarySearch(sorted10k, '978-999-9999999', (b) => b.isbn, 'exact');
    expect(binMiss.foundIndex).toBe(-1);
    expect(binMiss.item).toBeNull();
  });

  it('binarySearchNumber, jumpSearchBooks, dan binarySearchBooks bekerja akurat pada array numerik dan seed 10.000 buku', () => {
    const arr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
    expect(binarySearchNumber(arr, 23).foundIndex).toBe(5);
    expect(binarySearchNumber(arr, 40).foundIndex).toBe(-1);

    const target = INITIAL_BOOKS[250];
    const bookSearchHit = binarySearchBooks(INITIAL_BOOKS, target.judul, 'judul');
    expect(bookSearchHit.foundIndex).toBeGreaterThanOrEqual(0);
    expect(bookSearchHit.matchedBooks.some((b) => b.id === target.id)).toBe(true);
    expect(bookSearchHit.comparisonsCount).toBeLessThanOrEqual(15);

    // Jump Search O(√n) test on 10,000 books
    const jumpHit = jumpSearchBooks(
      INITIAL_BOOKS,
      target.judul,
      'judul',
      bookSearchHit.sortedOrderUsed,
    );
    expect(jumpHit.foundIndex).toBe(bookSearchHit.foundIndex);
    expect(jumpHit.matchedBooks.some((b) => b.id === target.id)).toBe(true);
    expect(jumpHit.jumpStepSize).toBe(100); // floor(sqrt(10000)) = 100
    expect(jumpHit.comparisonsCount).toBeLessThanOrEqual(210);
    expect(jumpHit.steps.length).toBeGreaterThan(0);

    const jumpMiss = jumpSearchBooks(
      INITIAL_BOOKS,
      'ZZZ-BUKU-TIDAK-PERNAH-ADA',
      'judul',
      bookSearchHit.sortedOrderUsed,
    );
    expect(jumpMiss.foundIndex).toBe(-1);
    expect(jumpMiss.matchedBooks).toHaveLength(0);
  });

  it('runDetailedSort dan runDetailedSearch menghasilkan laporan 4 tahap + Head-to-Head perbandingan efisiensi & filter kriteria dinamis', () => {
    const sortRep50 = runDetailedSort(
      INITIAL_BOOKS,
      50,
      'bubble',
      'judul',
      'asc',
      'Geometri',
    );
    expect(sortRep50.totalSliceCount).toBe(50);
    expect(sortRep50.headToHead).toHaveLength(4);
    expect(sortRep50.headToHead.some((h) => h.isWinner)).toBe(true);
    expect(sortRep50.winnerSummary).toContain('paling unggul & efisien');
    expect(sortRep50.narrativeAnalysis).toContain('Data Kecil (50 Buku)');

    const sampleTarget = INITIAL_BOOKS[15].isbn;
    const searchRep1000 = runDetailedSearch(
      INITIAL_BOOKS,
      1000,
      'jump',
      'isbn',
      sampleTarget,
    );
    expect(searchRep1000.itemCount).toBe(1000);
    expect(searchRep1000.requiresPreSort).toBe(true);
    expect(searchRep1000.foundIndex).toBeGreaterThanOrEqual(0);
    expect(searchRep1000.foundBook?.isbn).toBe(sampleTarget);
    expect(searchRep1000.steps.length).toBeGreaterThan(0);
    expect(searchRep1000.headToHead).toHaveLength(3);
    expect(searchRep1000.headToHead.some((h) => h.isLeastSteps)).toBe(true);
    expect(searchRep1000.winnerSummary).toContain('paling unggul & efisien');

    // Test searching by tahunTerbit criterion
    const targetYear = String(INITIAL_BOOKS[10].tahunTerbit);
    const searchByYear = runDetailedSearch(
      INITIAL_BOOKS,
      1000,
      'binary',
      'tahunTerbit',
      targetYear,
    );
    expect(searchByYear.foundIndex).toBeGreaterThanOrEqual(0);
    expect(searchByYear.matchedBooks.length).toBeGreaterThan(0);

    // Test sorting and searching by kodeRak (Lokasi Rak) criterion
    const sortByRack = runDetailedSort(
      INITIAL_BOOKS,
      50,
      'quick',
      'kodeRak',
      'asc',
      'Rak A1',
    );
    expect(sortByRack.totalSliceCount).toBe(50);
    expect(sortByRack.sortedBooks).toHaveLength(50);

    const targetRack = INITIAL_BOOKS[0].kodeRak;
    const searchByRack = runDetailedSearch(
      INITIAL_BOOKS,
      1000,
      'linear',
      'kodeRak',
      targetRack,
    );
    expect(searchByRack.foundIndex).toBeGreaterThanOrEqual(0);
    expect(searchByRack.matchedBooks.length).toBeGreaterThan(0);

    // Test dynamic criterion input sanitizer
    expect(getCriterionInputConfig('isbn').sanitize('978-602-ABC!01')).toBe(
      '978-602-01',
    );
    expect(getCriterionInputConfig('tahunTerbit').sanitize('2024xyz99')).toBe(
      '2024',
    );
    expect(getCriterionInputConfig('kodeRak').label).toContain('Lokasi Rak');
  });

  it('AC-05: Multi-Scale Benchmark (1.000 -> 5.000 -> 10.000) & Ekspor CSV menghasilkan laporan valid', () => {
    const multiRows = runMultiScaleSortBenchmark([1000, 5000, 10000], 'judul', 'asc', 'random');
    expect(multiRows).toHaveLength(3);
    expect(multiRows.map((r) => r.scale)).toEqual([1000, 5000, 10000]);

    const dataset1k = generateBooks(1000);
    const customSearchComp = runSearchBenchmark(dataset1k, dataset1k[250].judul, 'judul');
    expect(customSearchComp.linear.foundIndex).toBeGreaterThanOrEqual(0);
    expect(customSearchComp.binary.foundIndex).toBeGreaterThanOrEqual(0);

    const posRows = runSearchPositionBenchmark(dataset1k, 'judul');
    expect(posRows).toHaveLength(4);
    expect(posRows[0].scenario).toBe('start');
    expect(posRows[2].scenario).toBe('end');
    expect(posRows[3].binary.foundIndex).toBe(-1);

    const csv = exportBenchmarkToCsv(
      [
        multiRows[2].quickSort,
        multiRows[2].mergeSort,
        multiRows[2].insertionSort,
      ],
      multiRows,
      posRows,
      'random',
      'judul',
    );
    expect(csv).toContain('SECTION,SCALE_N,CONDITION,FIELD,ALGORITHM_OR_SCENARIO,TIME_MS,COMPARISONS');
    expect(csv).toContain('MULTI_SCALE_SORT,1000,random,judul,"Quick Sort"');
    expect(csv).toContain('MULTI_SCALE_SORT,5000,random,judul,"Merge Sort"');
    expect(csv).toContain('MULTI_SCALE_SORT,10000,random,judul,"Insertion Sort"');
    expect(csv).toContain('SEARCH_BENCHMARK,1000');
  });
});
