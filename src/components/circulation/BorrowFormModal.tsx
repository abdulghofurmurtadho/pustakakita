import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, BookOpen, Calendar, Search } from 'lucide-react';
import { Book, LoanInput } from '../../types';
import { LOAN_DURATION_DAYS, addDays, getTodayDateString } from '../../utils/dateUtils';
import { formatDateIndo } from '../../utils/formatters';
import { Modal } from '../common/Modal';

interface BorrowFormModalProps {
  isOpen: boolean;
  books: Book[];
  preselectedBook?: Book | null;
  onClose: () => void;
  onSubmit: (input: LoanInput) => { success: boolean; message: string };
}

export function BorrowFormModal({
  isOpen,
  books,
  preselectedBook,
  onClose,
  onSubmit,
}: BorrowFormModalProps) {
  const [bookSearch, setBookSearch] = useState('');
  const [selectedBookId, setSelectedBookId] = useState('');
  const [namaPeminjam, setNamaPeminjam] = useState('');
  const [nimAnggota, setNimAnggota] = useState('');
  const [tanggalPinjam, setTanggalPinjam] = useState(() => getTodayDateString());
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg('');
    setNamaPeminjam('');
    setNimAnggota('');
    setTanggalPinjam(getTodayDateString());
    setBookSearch('');

    if (preselectedBook) {
      setSelectedBookId(preselectedBook.id);
    } else {
      const firstAvailable = books.find((b) => b.stokTersedia > 0);
      setSelectedBookId(firstAvailable?.id || books[0]?.id || '');
    }
  }, [isOpen, preselectedBook, books]);

  const filteredBooks = useMemo(() => {
    const q = bookSearch.trim().toLowerCase();
    const matched = q
      ? books.filter(
          (b) =>
            b.judul.toLowerCase().includes(q) ||
            b.penulis.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q),
        )
      : books;
    const capped = matched.slice(0, 100);
    if (selectedBookId && !capped.some((b) => b.id === selectedBookId)) {
      const active = books.find((b) => b.id === selectedBookId);
      if (active) {
        return [active, ...capped];
      }
    }
    return capped;
  }, [books, bookSearch, selectedBookId]);

  const selectedBook = books.find((b) => b.id === selectedBookId) || null;
  const dueDate = addDays(tanggalPinjam, LOAN_DURATION_DAYS);
  const isOutOfStock = !selectedBook || selectedBook.stokTersedia <= 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) {
      setErrorMsg('Pilih buku yang akan dipinjam.');
      return;
    }
    if (selectedBook.stokTersedia <= 0) {
      setErrorMsg('Stok Eksemplar Habis');
      return;
    }
    if (!namaPeminjam.trim() || !nimAnggota.trim()) {
      setErrorMsg('Nama peminjam dan NIM/Nomor Anggota wajib diisi.');
      return;
    }

    const res = onSubmit({
      bookId: selectedBook.id,
      namaPeminjam,
      nimAnggota,
      tanggalPinjam,
    });
    if (!res.success) {
      setErrorMsg(res.message);
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Catat Peminjaman Baru"
      subtitle="Masa peminjaman standar 7 hari · Denda keterlambatan Rp 2.000/hari"
      maxWidthClass="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label
            htmlFor="borrow-book-search"
            className="mb-1 block text-xs font-semibold text-slate-700"
          >
            Pilih Buku Koleksi *
          </label>
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              id="borrow-book-search"
              type="text"
              value={bookSearch}
              onChange={(e) => setBookSearch(e.target.value)}
              placeholder="Filter daftar buku..."
              className="w-full rounded-lg border border-slate-200 bg-parchment-50/70 py-1.5 pl-8 pr-3 text-xs text-slate-800 focus:border-slate-900 focus:bg-white focus:outline-none"
            />
          </div>
          <select
            aria-label="Daftar Buku"
            value={selectedBookId}
            onChange={(e) => {
              setSelectedBookId(e.target.value);
              setErrorMsg('');
            }}
            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          >
            {filteredBooks.map((book) => (
              <option key={book.id} value={book.id} disabled={book.stokTersedia <= 0}>
                {book.stokTersedia > 0
                  ? `[Tersedia: ${book.stokTersedia}] ${book.judul} (${book.kodeRak})`
                  : `[HABIS] ${book.judul}`}
              </option>
            ))}
          </select>
          {selectedBook && selectedBook.stokTersedia <= 0 && (
            <p className="mt-1.5 text-xs font-semibold text-rose-600">
              Peringatan: Stok Eksemplar Habis untuk buku ini.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="borrow-name"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Nama Peminjam *
            </label>
            <input
              id="borrow-name"
              type="text"
              value={namaPeminjam}
              onChange={(e) => setNamaPeminjam(e.target.value)}
              placeholder="Nama mahasiswa / anggota"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="borrow-nim"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              NIM / No. Anggota *
            </label>
            <input
              id="borrow-nim"
              type="text"
              value={nimAnggota}
              onChange={(e) => setNimAnggota(e.target.value)}
              placeholder="Contoh: 230101001"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 rounded-xl border border-parchment-200 bg-parchment-50/70 p-3.5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="borrow-date"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tanggal Pinjam
            </label>
            <input
              id="borrow-date"
              type="date"
              value={tanggalPinjam}
              onChange={(e) => setTanggalPinjam(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
            />
          </div>

          <div className="flex flex-col justify-center">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Calendar className="h-3.5 w-3.5" />
              <span>Tenggat Kembali (+7 Hari)</span>
            </span>
            <p className="mt-1 font-mono text-sm font-bold text-slate-900">
              {formatDateIndo(dueDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-parchment-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isOutOfStock}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold ${
              isOutOfStock
                ? 'cursor-not-allowed bg-rose-100 text-rose-500'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isOutOfStock ? 'Stok Eksemplar Habis' : 'Konfirmasi Pinjam'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
