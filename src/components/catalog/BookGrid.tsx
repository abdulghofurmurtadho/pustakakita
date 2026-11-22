import { BookX } from 'lucide-react';
import { Book } from '../../types';
import { BookCard } from './BookCard';

interface BookGridProps {
  books: Book[];
  onSelectDetail: (book: Book) => void;
  onBorrow: (book: Book) => void;
  onEdit?: (book: Book) => void;
  onDelete?: (book: Book) => void;
}

export function BookGrid({
  books,
  onSelectDetail,
  onBorrow,
  onEdit,
  onDelete,
}: BookGridProps) {
  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-parchment-300 bg-white px-6 py-14 text-center">
        <BookX className="h-10 w-10 text-slate-300" />
        <p className="mt-3 font-serif text-base font-semibold text-slate-800">
          Tidak ada buku yang cocok
        </p>
        <p className="mt-1 max-w-md text-xs text-slate-500">
          Coba ubah kata kunci pencarian, kategori, atau alihkan algoritma pencarian ke
          Linear Search untuk pencarian substring bebas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onSelectDetail={onSelectDetail}
          onBorrow={onBorrow}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
