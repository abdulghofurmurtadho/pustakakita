import { BookOpen, Eye, MapPin, Pencil, Trash2 } from 'lucide-react';
import { Book } from '../../types';
import { Badge } from '../common/Badge';

interface BookCardProps {
  book: Book;
  onSelectDetail: (book: Book) => void;
  onBorrow: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export function BookCard({
  book,
  onSelectDetail,
  onBorrow,
  onEdit,
  onDelete,
}: BookCardProps) {
  const isAvailable = book.stokTersedia > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-parchment-300 hover:shadow-md">
      {/* Editorial Book Spine Cover Header */}
      <div
        className="relative flex h-36 flex-col justify-between p-4 text-white"
        style={{ backgroundColor: book.coverColor }}
      >
        <div
          className="pointer-events-none absolute inset-y-0 left-0 w-2.5 bg-black/20"
          aria-hidden="true"
        />
        <div className="flex items-start justify-between gap-2 pl-1.5">
          <span className="rounded bg-black/25 px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wider text-white/95 backdrop-blur-sm">
            {book.kodeRak}
          </span>
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(book)}
                className="rounded bg-black/25 p-1 text-white/85 transition hover:bg-black/45 hover:text-white"
                aria-label={`Edit ${book.judul}`}
                title="Edit buku"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(book)}
                className="rounded bg-black/25 p-1 text-white/85 transition hover:bg-rose-600 hover:text-white"
                aria-label={`Hapus ${book.judul}`}
                title="Hapus buku"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
            <span className="rounded bg-white/15 px-2 py-0.5 font-mono text-[10px] font-medium text-white/95">
              {book.tahunTerbit}
            </span>
          </div>
        </div>

        <div className="pl-1.5">
          <p className="text-[10px] font-medium uppercase tracking-wider text-white/75">
            {book.kategori}
          </p>
          <h3 className="mt-0.5 line-clamp-2 font-serif text-base font-bold leading-snug text-white">
            {book.judul}
          </h3>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-xs font-semibold text-slate-800">{book.penulis}</p>
          <p className="mt-0.5 font-mono text-[11px] text-slate-400">
            ISBN {book.isbn} · {book.penerbit}
          </p>
          <p className="mt-2.5 line-clamp-2 text-xs leading-relaxed text-slate-600">
            {book.deskripsi}
          </p>
        </div>

        <div className="mt-4 space-y-3 border-t border-parchment-100 pt-3">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="font-mono">{book.kodeRak}</span>
            </span>
            {isAvailable ? (
              <Badge variant="emerald">
                Tersedia {book.stokTersedia}/{book.stokTotal}
              </Badge>
            ) : (
              <Badge variant="rose">Stok Eksemplar Habis</Badge>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSelectDetail(book)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-parchment-50 hover:text-slate-900"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Detail</span>
            </button>
            <button
              type="button"
              disabled={!isAvailable}
              onClick={() => onBorrow(book)}
              title={isAvailable ? 'Pinjam buku ini' : 'Stok Eksemplar Habis'}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition ${
                isAvailable
                  ? 'bg-emerald-900 text-white hover:bg-emerald-950'
                  : 'cursor-not-allowed border border-rose-200 bg-rose-50 text-rose-500'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{isAvailable ? 'Pinjam' : 'Habis'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
