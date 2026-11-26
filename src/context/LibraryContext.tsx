import React, { createContext, useCallback, useContext } from 'react';
import { shuffleBooksArray } from '../data/bookGenerator';
import {
  INITIAL_BOOKS,
  INITIAL_LOANS,
  buildInitialBooks,
} from '../data/initialSeed';
import { useLocalStorage } from '../hooks/useLocalStorage';
import {
  ActionResult,
  BenchmarkScale,
  Book,
  BookInput,
  LibraryBackupPayload,
  LoanInput,
  LoanRecord,
} from '../types';
import {
  LOAN_DURATION_DAYS,
  addDays,
  calculateFine,
  getTodayDateString,
} from '../utils/dateUtils';
import { validateBackupPayload, validateBookInput } from '../utils/validators';

export const BOOKS_STORAGE_KEY = 'pustakakita_books_v5';
export const LOANS_STORAGE_KEY = 'pustakakita_loans_v5';

// Clean up legacy localStorage keys so upgraded browsers auto-seed 10.000 shuffled books with varied Lokasi Rak
if (typeof window !== 'undefined') {
  try {
    const legacyKeys = [
      'pustakakita_books',
      'pustakakita_loans',
      'pustakakita_books_v2',
      'pustakakita_loans_v2',
      'pustakakita_books_v3',
      'pustakakita_loans_v3',
      'pustakakita_books_v4',
      'pustakakita_loans_v4',
    ];
    for (const k of legacyKeys) {
      if (window.localStorage.getItem(k) !== null) {
        window.localStorage.removeItem(k);
      }
    }
  } catch {
    // Ignore storage access errors
  }
}

function generateNextId(prefix: string, existingIds: string[]): string {
  let maxNum = 0;
  for (let i = 0; i < existingIds.length; i += 1) {
    const match = existingIds[i].match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }
  return `${prefix}-${String(maxNum + 1).padStart(4, '0')}`;
}

export interface LibraryContextValue {
  books: Book[];
  loans: LoanRecord[];
  addBook: (input: BookInput) => ActionResult<Book>;
  updateBook: (id: string, input: BookInput) => ActionResult<Book>;
  deleteBook: (id: string) => ActionResult;
  borrowBook: (input: LoanInput) => ActionResult<LoanRecord>;
  returnBook: (loanId: string, returnDateStr?: string) => ActionResult<LoanRecord>;
  loadPresetDataset: (count: BenchmarkScale) => ActionResult;
  shuffleInventoryBooks: () => ActionResult;
  applySortedSliceToInventory: (sortedSlice: Book[]) => void;
  exportBackupJson: () => string;
  importBackupJson: (jsonString: string) => ActionResult<LibraryBackupPayload>;
  resetToFactoryData: () => void;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const [books, setBooks] = useLocalStorage<Book[]>(BOOKS_STORAGE_KEY, INITIAL_BOOKS);
  const [loans, setLoans] = useLocalStorage<LoanRecord[]>(LOANS_STORAGE_KEY, INITIAL_LOANS);

  const addBook = useCallback(
    (input: BookInput): ActionResult<Book> => {
      const validation = validateBookInput(input, books);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.firstError || 'Data buku tidak valid.',
        };
      }

      const newBook: Book = {
        id: generateNextId(
          'BK',
          books.map((b) => b.id),
        ),
        isbn: input.isbn.trim(),
        judul: input.judul.trim(),
        penulis: input.penulis.trim(),
        penerbit: input.penerbit.trim(),
        tahunTerbit: input.tahunTerbit,
        kategori: input.kategori,
        kodeRak: input.kodeRak.trim().toUpperCase(),
        stokTotal: input.stokTotal,
        stokTersedia: input.stokTotal,
        coverColor: input.coverColor || '#064E3B',
        deskripsi: input.deskripsi.trim(),
        createdAt: new Date().toISOString(),
      };

      setBooks((prev) => [newBook, ...prev]);
      return {
        success: true,
        message: `Buku "${newBook.judul}" berhasil ditambahkan.`,
        data: newBook,
      };
    },
    [books, setBooks],
  );

  const updateBook = useCallback(
    (id: string, input: BookInput): ActionResult<Book> => {
      const existing = books.find((b) => b.id === id);
      if (!existing) {
        return { success: false, message: 'Buku tidak ditemukan.' };
      }

      const validation = validateBookInput(input, books, id);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.firstError || 'Data buku tidak valid.',
        };
      }

      const borrowedCount = existing.stokTotal - existing.stokTersedia;
      const nextAvailable = Math.max(0, input.stokTotal - borrowedCount);

      const updated: Book = {
        ...existing,
        isbn: input.isbn.trim(),
        judul: input.judul.trim(),
        penulis: input.penulis.trim(),
        penerbit: input.penerbit.trim(),
        tahunTerbit: input.tahunTerbit,
        kategori: input.kategori,
        kodeRak: input.kodeRak.trim().toUpperCase(),
        stokTotal: input.stokTotal,
        stokTersedia: nextAvailable,
        coverColor: input.coverColor || existing.coverColor,
        deskripsi: input.deskripsi.trim(),
      };

      setBooks((prev) => prev.map((b) => (b.id === id ? updated : b)));
      return {
        success: true,
        message: `Data buku "${updated.judul}" berhasil diperbarui.`,
        data: updated,
      };
    },
    [books, setBooks],
  );

  const deleteBook = useCallback(
    (id: string): ActionResult => {
      const existing = books.find((b) => b.id === id);
      if (!existing) {
        return { success: false, message: 'Buku tidak ditemukan.' };
      }

      const activeLoansCount = loans.filter(
        (loan) => loan.bookId === id && loan.status === 'Dipinjam',
      ).length;

      if (activeLoansCount > 0) {
        return {
          success: false,
          message: `Buku tidak dapat dihapus karena masih ada ${activeLoansCount} eksemplar yang sedang dipinjam.`,
        };
      }

      setBooks((prev) => prev.filter((b) => b.id !== id));
      return {
        success: true,
        message: `Buku "${existing.judul}" berhasil dihapus.`,
      };
    },
    [books, loans, setBooks],
  );

  const borrowBook = useCallback(
    (input: LoanInput): ActionResult<LoanRecord> => {
      const targetBook = books.find((b) => b.id === input.bookId);
      if (!targetBook) {
        return { success: false, message: 'Buku yang dipilih tidak ditemukan.' };
      }

      if (targetBook.stokTersedia <= 0) {
        return { success: false, message: 'Stok Eksemplar Habis' };
      }

      if (!input.namaPeminjam.trim() || !input.nimAnggota.trim()) {
        return {
          success: false,
          message: 'Nama peminjam dan NIM/ID anggota wajib diisi.',
        };
      }

      const tanggalPinjam = input.tanggalPinjam || getTodayDateString();
      const tenggatKembali = addDays(tanggalPinjam, LOAN_DURATION_DAYS);

      const newLoan: LoanRecord = {
        id: generateNextId(
          'LN',
          loans.map((l) => l.id),
        ),
        bookId: targetBook.id,
        judulBuku: targetBook.judul,
        isbnBuku: targetBook.isbn,
        namaPeminjam: input.namaPeminjam.trim(),
        nimAnggota: input.nimAnggota.trim(),
        tanggalPinjam,
        tenggatKembali,
        tanggalDikembalikan: null,
        status: 'Dipinjam',
        denda: 0,
      };

      setBooks((prev) =>
        prev.map((b) =>
          b.id === targetBook.id
            ? { ...b, stokTersedia: Math.max(0, b.stokTersedia - 1) }
            : b,
        ),
      );
      setLoans((prev) => [newLoan, ...prev]);

      return {
        success: true,
        message: `Peminjaman "${targetBook.judul}" oleh ${newLoan.namaPeminjam} berhasil dicatat.`,
        data: newLoan,
      };
    },
    [books, loans, setBooks, setLoans],
  );

  const returnBook = useCallback(
    (loanId: string, returnDateStr?: string): ActionResult<LoanRecord> => {
      const targetLoan = loans.find((l) => l.id === loanId);
      if (!targetLoan) {
        return { success: false, message: 'Transaksi peminjaman tidak ditemukan.' };
      }
      if (targetLoan.status === 'Dikembalikan') {
        return { success: false, message: 'Buku pada transaksi ini sudah dikembalikan.' };
      }

      const tanggalDikembalikan = returnDateStr || getTodayDateString();
      const finalFine = calculateFine(targetLoan.tenggatKembali, tanggalDikembalikan);

      const updatedLoan: LoanRecord = {
        ...targetLoan,
        tanggalDikembalikan,
        status: 'Dikembalikan',
        denda: finalFine,
      };

      setLoans((prev) => prev.map((l) => (l.id === loanId ? updatedLoan : l)));
      setBooks((prev) =>
        prev.map((b) =>
          b.id === targetLoan.bookId
            ? { ...b, stokTersedia: Math.min(b.stokTotal, b.stokTersedia + 1) }
            : b,
        ),
      );

      return {
        success: true,
        message:
          finalFine > 0
            ? `Buku dikembalikan dengan denda keterlambatan sebesar Rp ${finalFine.toLocaleString('id-ID')}.`
            : `Buku "${targetLoan.judulBuku}" berhasil dikembalikan tepat waktu.`,
        data: updatedLoan,
      };
    },
    [loans, setBooks, setLoans],
  );

  const loadPresetDataset = useCallback(
    (count: BenchmarkScale): ActionResult => {
      const generated = buildInitialBooks(count);
      setBooks(generated);
      setLoans(INITIAL_LOANS.map((l) => ({ ...l })));
      return {
        success: true,
        message: `Berhasil memuat ${count.toLocaleString('id-ID')} buku unik (teracak) ke katalog aktif.`,
      };
    },
    [setBooks, setLoans],
  );

  const shuffleInventoryBooks = useCallback((): ActionResult => {
    setBooks((prev) => shuffleBooksArray(prev, Date.now()));
    return {
      success: true,
      message: `Seluruh ${books.length.toLocaleString('id-ID')} buku di rak inventaris berhasil diacak ulang (Fisher-Yates Shuffle).`,
    };
  }, [books.length, setBooks]);

  const applySortedSliceToInventory = useCallback(
    (sortedSlice: Book[]) => {
      setBooks((prev) => {
        if (sortedSlice.length >= prev.length) {
          return [...sortedSlice];
        }
        return [...sortedSlice, ...prev.slice(sortedSlice.length)];
      });
    },
    [setBooks],
  );

  const exportBackupJson = useCallback((): string => {
    const payload: LibraryBackupPayload = {
      version: '2.0.0',
      exportedAt: new Date().toISOString(),
      books,
      loans,
    };
    return JSON.stringify(payload, null, 2);
  }, [books, loans]);

  const importBackupJson = useCallback(
    (jsonString: string): ActionResult<LibraryBackupPayload> => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        return {
          success: false,
          message: 'File backup bukan JSON yang valid.',
        };
      }

      const validation = validateBackupPayload(parsed);
      if (!validation.valid) {
        return {
          success: false,
          message: validation.error,
        };
      }

      const { payload } = validation;
      setBooks(payload.books.map((b) => ({ ...b })));
      setLoans(payload.loans.map((l) => ({ ...l })));

      return {
        success: true,
        message: `Restore berhasil: ${payload.books.length.toLocaleString('id-ID')} buku dan ${payload.loans.length} catatan sirkulasi dimuat.`,
        data: payload,
      };
    },
    [setBooks, setLoans],
  );

  const resetToFactoryData = useCallback(() => {
    setBooks(INITIAL_BOOKS.map((b) => ({ ...b })));
    setLoans(INITIAL_LOANS.map((l) => ({ ...l })));
  }, [setBooks, setLoans]);

  return (
    <LibraryContext.Provider
      value={{
        books,
        loans,
        addBook,
        updateBook,
        deleteBook,
        borrowBook,
        returnBook,
        loadPresetDataset,
        shuffleInventoryBooks,
        applySortedSliceToInventory,
        exportBackupJson,
        importBackupJson,
        resetToFactoryData,
      }}
    >
      {children}
    </LibraryContext.Provider>
  );
}

export function useLibrary(): LibraryContextValue {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within a LibraryProvider');
  }
  return ctx;
}
