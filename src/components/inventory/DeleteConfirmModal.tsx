import { AlertTriangle, ShieldAlert, Trash2 } from 'lucide-react';
import { Book } from '../../types';
import { Modal } from '../common/Modal';

interface DeleteConfirmModalProps {
  book: Book | null;
  activeLoansCount: number;
  onClose: () => void;
  onConfirmDelete: (bookId: string) => void;
}

export function DeleteConfirmModal({
  book,
  activeLoansCount,
  onClose,
  onConfirmDelete,
}: DeleteConfirmModalProps) {
  if (!book) return null;

  const isBlocked = activeLoansCount > 0;

  return (
    <Modal
      isOpen={Boolean(book)}
      onClose={onClose}
      title={isBlocked ? 'Penghapusan Buku Diblokir' : 'Konfirmasi Hapus Buku'}
      subtitle={`ID Koleksi: ${book.id} · ISBN ${book.isbn}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        {isBlocked ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-rose-900">
                  Buku tidak dapat dihapus karena masih ada {activeLoansCount} eksemplar yang
                  sedang dipinjam.
                </p>
                <p className="text-xs leading-relaxed text-rose-700">
                  Selesaikan pengembalian seluruh transaksi peminjaman aktif untuk{' '}
                  <strong>{book.judul}</strong> di menu Sirkulasi sebelum menghapusnya
                  dari inventaris.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-amber-950">
                  Hapus &ldquo;{book.judul}&rdquo; dari inventaris?
                </p>
                <p className="text-xs leading-relaxed text-amber-800">
                  Tindakan ini akan menghapus entri buku beserta seluruh {book.stokTotal}{' '}
                  eksemplar terdaftarnya dari penyimpanan lokal.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
          >
            {isBlocked ? 'Mengerti' : 'Batal'}
          </button>
          {!isBlocked && (
            <button
              type="button"
              onClick={() => {
                onConfirmDelete(book.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Ya, Hapus Buku</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
