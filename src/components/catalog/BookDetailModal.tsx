import { AlertTriangle, BookOpen, Calendar, Hash, Layers, MapPin, User } from 'lucide-react';
import { Book, LoanRecord } from '../../types';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';
import { getEffectiveLoanFine, isLoanOverdue } from '../../utils/dateUtils';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

interface BookDetailModalProps {
  book: Book | null;
  loans: LoanRecord[];
  onClose: () => void;
  onBorrow: (book: Book) => void;
}

export function BookDetailModal({
  book,
  loans,
  onClose,
  onBorrow,
}: BookDetailModalProps) {
  if (!book) return null;

  const relatedLoans = loans.filter((l) => l.bookId === book.id);
  const isAvailable = book.stokTersedia > 0;

  return (
    <Modal
      isOpen={Boolean(book)}
      onClose={onClose}
      title="Detail Koleksi Buku"
      subtitle={`ID Koleksi: ${book.id}`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-6">
        <div className="flex flex-col gap-5 sm:flex-row">
          <div
            className="flex h-44 w-full shrink-0 flex-col justify-between rounded-xl p-4 text-white shadow-md sm:w-36"
            style={{ backgroundColor: book.coverColor }}
          >
            <span className="self-start rounded bg-black/25 px-2 py-0.5 font-mono text-[10px] font-semibold">
              {book.kodeRak}
            </span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-white/75">
                {book.tahunTerbit}
              </p>
              <p className="mt-1 line-clamp-3 font-serif text-sm font-bold leading-snug">
                {book.judul}
              </p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="indigo">{book.kategori}</Badge>
              {isAvailable ? (
                <Badge variant="emerald">
                  Tersedia {book.stokTersedia} dari {book.stokTotal} Eksemplar
                </Badge>
              ) : (
                <Badge variant="rose">Stok Eksemplar Habis</Badge>
              )}
            </div>

            <h3 className="font-serif text-xl font-bold text-slate-900">
              {book.judul}
            </h3>

            <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 sm:grid-cols-2">
              <div className="flex items-center gap-2">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Penulis: <strong className="text-slate-900">{book.penulis}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Layers className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Penerbit: <strong className="text-slate-900">{book.penerbit}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono">
                  ISBN: <strong className="text-slate-900">{book.isbn}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span className="font-mono">
                  Lokasi Rak: <strong className="text-slate-900">{book.kodeRak}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  Tahun Terbit:{' '}
                  <strong className="text-slate-900">{book.tahunTerbit}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-parchment-50/70 p-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Sinopsis &amp; Deskripsi
          </h4>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
            {book.deskripsi || 'Tidak ada deskripsi tambahan.'}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Riwayat Sirkulasi Buku ({relatedLoans.length})
          </h4>
          {relatedLoans.length === 0 ? (
            <p className="mt-2 rounded-lg border border-dashed border-slate-200 p-4 text-center text-xs text-slate-500">
              Belum ada catatan peminjaman untuk buku ini.
            </p>
          ) : (
            <div className="mt-2 divide-y divide-parchment-100 rounded-xl border border-parchment-200">
              {relatedLoans.map((loan) => {
                const overdue = isLoanOverdue(loan);
                const fine = getEffectiveLoanFine(loan);
                return (
                  <div
                    key={loan.id}
                    className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {loan.namaPeminjam}{' '}
                        <span className="font-mono text-slate-500">
                          ({loan.nimAnggota})
                        </span>
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Pinjam: {formatDateIndo(loan.tanggalPinjam)} · Tenggat:{' '}
                        {formatDateIndo(loan.tenggatKembali)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {fine > 0 && (
                        <span className="font-mono font-semibold text-rose-600">
                          {formatRupiah(fine)}
                        </span>
                      )}
                      {loan.status === 'Dikembalikan' ? (
                        <Badge variant="emerald">Dikembalikan</Badge>
                      ) : overdue ? (
                        <Badge variant="rose">Terlambat</Badge>
                      ) : (
                        <Badge variant="amber">Dipinjam</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {!isAvailable && (
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Stok Eksemplar Habis — Seluruh eksemplar sedang dipinjam dan belum
              dikembalikan.
            </span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-parchment-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={!isAvailable}
            onClick={() => {
              onClose();
              onBorrow(book);
            }}
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              isAvailable
                ? 'bg-slate-900 text-white hover:bg-slate-800'
                : 'cursor-not-allowed bg-rose-100 text-rose-500'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span>{isAvailable ? 'Pinjam Sekarang' : 'Stok Eksemplar Habis'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
