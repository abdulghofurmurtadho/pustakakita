import { BOOK_CATEGORIES } from '../data/initialSeed';
import { Book, BookCategory, BookInput, LibraryBackupPayload, LoanRecord } from '../types';
import { normalizeIsbnDigits } from './formatters';

export interface BookValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof BookInput | 'general', string>>;
  firstError?: string;
}

/**
 * Validates book creation/edit inputs, enforcing unique ISBN across existing collection.
 */
export function validateBookInput(
  input: BookInput,
  existingBooks: readonly Book[],
  editingBookId?: string,
): BookValidationResult {
  const errors: Partial<Record<keyof BookInput | 'general', string>> = {};
  const digits = normalizeIsbnDigits(input.isbn);

  if (!digits) {
    errors.isbn = 'ISBN wajib diisi.';
  } else if (digits.length !== 10 && digits.length !== 13) {
    errors.isbn = 'ISBN harus terdiri dari 10 atau 13 digit numerik.';
  } else {
    const duplicate = existingBooks.find(
      (b) =>
        b.id !== editingBookId &&
        (normalizeIsbnDigits(b.isbn) === digits || b.isbn.trim() === input.isbn.trim()),
    );
    if (duplicate) {
      errors.isbn = 'ISBN sudah terdaftar di sistem';
    }
  }

  if (!input.judul.trim()) {
    errors.judul = 'Judul buku wajib diisi.';
  }
  if (!input.penulis.trim()) {
    errors.penulis = 'Nama penulis wajib diisi.';
  }
  if (!input.penerbit.trim()) {
    errors.penerbit = 'Nama penerbit wajib diisi.';
  }

  const currentYear = new Date().getFullYear();
  if (
    !Number.isInteger(input.tahunTerbit) ||
    input.tahunTerbit < 1900 ||
    input.tahunTerbit > currentYear
  ) {
    errors.tahunTerbit = `Tahun terbit harus antara 1900 dan ${currentYear}.`;
  }

  if (!BOOK_CATEGORIES.includes(input.kategori)) {
    errors.kategori = 'Kategori buku tidak valid.';
  }

  if (!input.kodeRak.trim()) {
    errors.kodeRak = 'Kode rak wajib diisi (contoh: RAK-A01).';
  }

  if (!Number.isInteger(input.stokTotal) || input.stokTotal < 1) {
    errors.stokTotal = 'Stok total minimal 1 eksemplar.';
  }

  if (editingBookId) {
    const existing = existingBooks.find((b) => b.id === editingBookId);
    if (existing) {
      const currentlyBorrowed = existing.stokTotal - existing.stokTersedia;
      if (input.stokTotal < currentlyBorrowed) {
        errors.stokTotal = `Stok total tidak boleh kurang dari eksemplar yang sedang dipinjam (${currentlyBorrowed}).`;
      }
    }
  }

  const firstError = Object.values(errors)[0];
  return {
    valid: Object.keys(errors).length === 0,
    errors,
    firstError,
  };
}

function isValidBookCategory(value: unknown): value is BookCategory {
  return typeof value === 'string' && BOOK_CATEGORIES.includes(value as BookCategory);
}

function isValidBook(item: unknown): item is Book {
  if (!item || typeof item !== 'object') return false;
  const b = item as Record<string, unknown>;
  return (
    typeof b.id === 'string' &&
    typeof b.isbn === 'string' &&
    typeof b.judul === 'string' &&
    typeof b.penulis === 'string' &&
    typeof b.penerbit === 'string' &&
    typeof b.tahunTerbit === 'number' &&
    isValidBookCategory(b.kategori) &&
    typeof b.kodeRak === 'string' &&
    typeof b.stokTotal === 'number' &&
    typeof b.stokTersedia === 'number' &&
    b.stokTersedia >= 0 &&
    b.stokTersedia <= b.stokTotal &&
    typeof b.coverColor === 'string' &&
    typeof b.deskripsi === 'string' &&
    typeof b.createdAt === 'string'
  );
}

function isValidLoanRecord(item: unknown): item is LoanRecord {
  if (!item || typeof item !== 'object') return false;
  const l = item as Record<string, unknown>;
  return (
    typeof l.id === 'string' &&
    typeof l.bookId === 'string' &&
    typeof l.judulBuku === 'string' &&
    typeof l.isbnBuku === 'string' &&
    typeof l.namaPeminjam === 'string' &&
    typeof l.nimAnggota === 'string' &&
    typeof l.tanggalPinjam === 'string' &&
    typeof l.tenggatKembali === 'string' &&
    (l.tanggalDikembalikan === null || typeof l.tanggalDikembalikan === 'string') &&
    (l.status === 'Dipinjam' || l.status === 'Dikembalikan') &&
    typeof l.denda === 'number'
  );
}

/**
 * Validates JSON backup schema before restoring books and loans state.
 */
export function validateBackupPayload(
  data: unknown,
): { valid: true; payload: LibraryBackupPayload } | { valid: false; error: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Format JSON tidak valid: harus berupa objek.' };
  }

  const record = data as Record<string, unknown>;
  if (!Array.isArray(record.books) || !Array.isArray(record.loans)) {
    return {
      valid: false,
      error: 'Struktur backup tidak valid: properti "books" dan "loans" harus berupa array.',
    };
  }

  for (let i = 0; i < record.books.length; i += 1) {
    if (!isValidBook(record.books[i])) {
      return {
        valid: false,
        error: `Data buku pada indeks ke-${i} tidak memenuhi skema Book.`,
      };
    }
  }

  for (let i = 0; i < record.loans.length; i += 1) {
    if (!isValidLoanRecord(record.loans[i])) {
      return {
        valid: false,
        error: `Data peminjaman pada indeks ke-${i} tidak memenuhi skema LoanRecord.`,
      };
    }
  }

  return {
    valid: true,
    payload: {
      version: typeof record.version === 'string' ? record.version : '1.0.0',
      exportedAt:
        typeof record.exportedAt === 'string' ? record.exportedAt : new Date().toISOString(),
      books: record.books as Book[],
      loans: record.loans as LoanRecord[],
    },
  };
}
