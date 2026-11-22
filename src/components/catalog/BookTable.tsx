import { BookOpen, Eye, Pencil, Trash2 } from 'lucide-react';
import { Book } from '../../types';
import { Badge } from '../common/Badge';

interface BookTableProps {
  books: Book[];
  onSelectDetail: (book: Book) => void;
  onBorrow: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export function BookTable({
  books,
  onSelectDetail,
  onBorrow,
  onEdit,
  onDelete,
}: BookTableProps) {
  if (books.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-parchment-300 bg-white p-10 text-center text-sm text-slate-500">
        Tidak ada buku yang sesuai dengan filter atau pencarian.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">Buku &amp; ISBN</th>
              <th className="px-4 py-3">Penulis</th>
              <th className="px-4 py-3">Kategori</th>
              <th className="px-4 py-3">Rak</th>
              <th className="px-4 py-3 text-center">Tahun</th>
              <th className="px-4 py-3 text-center">Stok</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-parchment-100">
            {books.map((book) => {
              const isAvailable = book.stokTersedia > 0;
              return (
                <tr key={book.id} className="transition hover:bg-parchment-50/60">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-9 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: book.coverColor }}
                      />
                      <div>
                        <p className="font-serif font-semibold text-slate-900">
                          {book.judul}
                        </p>
                        <p className="font-mono text-[11px] text-slate-500">
                          {book.isbn}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700">{book.penulis}</td>
                  <td className="px-4 py-3">
                    <Badge variant="neutral">{book.kategori}</Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                    {book.kodeRak}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-xs text-slate-600">
                    {book.tahunTerbit}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {isAvailable ? (
                      <Badge variant="emerald">
                        {book.stokTersedia} / {book.stokTotal}
                      </Badge>
                    ) : (
                      <Badge variant="rose">Habis (0/{book.stokTotal})</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onSelectDetail(book)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-parchment-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detail</span>
                      </button>
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(book)}
                          className="rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-parchment-100"
                          aria-label={`Edit ${book.judul}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(book)}
                          className="rounded-lg border border-rose-200 bg-rose-50 p-1.5 text-rose-600 hover:bg-rose-100"
                          aria-label={`Hapus ${book.judul}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => onBorrow(book)}
                        className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold ${
                          isAvailable
                            ? 'bg-emerald-900 text-white hover:bg-emerald-950'
                            : 'cursor-not-allowed bg-rose-50 text-rose-400'
                        }`}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{isAvailable ? 'Pinjam' : 'Habis'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
