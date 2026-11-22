import { Book, LoanRecord } from '../types';
import {
  BOOK_CATEGORIES,
  COVER_COLOR_PALETTE,
  generateBooks,
} from './bookGenerator';

export { BOOK_CATEGORIES, COVER_COLOR_PALETTE };

const LOANED_BOOK_IDS = new Set(['BK-0001', 'BK-0002', 'BK-0004']);

function buildInitialBooks(count: number = 1000): Book[] {
  const generated = generateBooks(count);
  return generated.map((book) =>
    LOANED_BOOK_IDS.has(book.id)
      ? { ...book, stokTersedia: Math.max(0, book.stokTotal - 1) }
      : book,
  );
}

/**
 * Default seed dataset: 1.000 unique books automatically generated when localStorage is empty.
 */
export const INITIAL_BOOKS: Book[] = buildInitialBooks(1000);

function findBookSnapshot(id: string): Book {
  for (let i = 0; i < INITIAL_BOOKS.length; i += 1) {
    if (INITIAL_BOOKS[i].id === id) {
      return INITIAL_BOOKS[i];
    }
  }
  return INITIAL_BOOKS[0];
}

const book1 = findBookSnapshot('BK-0001');
const book2 = findBookSnapshot('BK-0002');
const book4 = findBookSnapshot('BK-0004');

/**
 * Default 3 initial loan transactions (including 1 overdue loan to demonstrate Rp 2.000/day fine).
 */
export const INITIAL_LOANS: LoanRecord[] = [
  {
    id: 'LN-0001',
    bookId: book1.id,
    judulBuku: book1.judul,
    isbnBuku: book1.isbn,
    namaPeminjam: 'Abdul Ghofur Al-Murtadho',
    nimAnggota: '230101001',
    tanggalPinjam: '2026-11-10',
    tenggatKembali: '2026-11-17',
    tanggalDikembalikan: null,
    status: 'Dipinjam',
    denda: 10000, // Terlambat 5 hari per 22 Nov 2026 (5 * Rp 2.000)
  },
  {
    id: 'LN-0002',
    bookId: book4.id,
    judulBuku: book4.judul,
    isbnBuku: book4.isbn,
    namaPeminjam: 'Siti Nurhaliza',
    nimAnggota: '230101045',
    tanggalPinjam: '2026-11-18',
    tenggatKembali: '2026-11-25',
    tanggalDikembalikan: null,
    status: 'Dipinjam',
    denda: 0,
  },
  {
    id: 'LN-0003',
    bookId: book2.id,
    judulBuku: book2.judul,
    isbnBuku: book2.isbn,
    namaPeminjam: 'Rizky Pratama Putra',
    nimAnggota: '230101078',
    tanggalPinjam: '2026-11-20',
    tenggatKembali: '2026-11-27',
    tanggalDikembalikan: null,
    status: 'Dipinjam',
    denda: 0,
  },
];
