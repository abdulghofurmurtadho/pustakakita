import { useEffect, useMemo, useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Badge } from '../components/common/Badge';
import { PageSizeOption, Pagination } from '../components/common/Pagination';
import { BookFormModal } from '../components/inventory/BookFormModal';
import { DeleteConfirmModal } from '../components/inventory/DeleteConfirmModal';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { Book, BookInput } from '../types';

export function InventoryView() {
  const { books, loans, addBook, updateBook, deleteBook } = useLibrary();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedTerm = useDebounce(searchTerm, 150);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<PageSizeOption>(25);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [deletingBook, setDeletingBook] = useState<Book | null>(null);

  const filteredBooks = useMemo(() => {
    const q = debouncedTerm.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.judul.toLowerCase().includes(q) ||
        b.penulis.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q) ||
        b.kodeRak.toLowerCase().includes(q),
    );
  }, [books, debouncedTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedTerm, books.length, pageSize]);

  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBooks.slice(start, start + pageSize);
  }, [filteredBooks, currentPage, pageSize]);

  const activeLoanCountByBook = useMemo(() => {
    const map = new Map<string, number>();
    for (let i = 0; i < loans.length; i += 1) {
      if (loans[i].status === 'Dipinjam') {
        map.set(loans[i].bookId, (map.get(loans[i].bookId) || 0) + 1);
      }
    }
    return map;
  }, [loans]);

  const handleFormSubmit = (input: BookInput, editingId?: string) => {
    const result = editingId ? updateBook(editingId, input) : addBook(input);
    addToast(result.message, result.success ? 'success' : 'error');
    return result;
  };

  const handleConfirmDelete = (bookId: string) => {
    const result = deleteBook(bookId);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Manajemen Koleksi
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Inventaris &amp; Stok Buku
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Tambah, ubah, dan kelola {books.length.toLocaleString('id-ID')} entri stok buku
            dengan validasi keunikan ISBN serta proteksi penghapusan buku yang masih
            dipinjam.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingBook(null);
            setIsFormOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-950"
        >
          <Plus className="h-4 w-4 text-amber-300" />
          <span>Tambah Buku Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-parchment-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan ISBN, judul, penulis, atau kode rak..."
            className="w-full rounded-lg border border-slate-200 bg-parchment-50/60 py-2 pl-9 pr-3 text-xs text-slate-900 focus:border-emerald-900 focus:bg-white focus:outline-none"
          />
        </div>
        <p className="font-mono text-xs text-slate-500">
          Total cocok:{' '}
          <strong className="text-slate-900">
            {filteredBooks.length.toLocaleString('id-ID')}
          </strong>{' '}
          dari {books.length.toLocaleString('id-ID')} judul
        </p>
      </div>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredBooks.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      {/* Inventory Table */}
      <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-4 py-3">ISBN</th>
                <th className="px-4 py-3">Judul &amp; Penulis</th>
                <th className="px-4 py-3">Kategori</th>
                <th className="px-4 py-3">Kode Rak</th>
                <th className="px-4 py-3 text-center">Total Stok</th>
                <th className="px-4 py-3 text-center">Stok Tersedia</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {paginatedBooks.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-xs text-slate-500"
                  >
                    Tidak ada data buku yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedBooks.map((book) => {
                  const activeLoans = activeLoanCountByBook.get(book.id) || 0;
                  return (
                    <tr key={book.id} className="transition hover:bg-parchment-50/60">
                      <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                        {book.isbn}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-8 w-2 shrink-0 rounded-sm"
                            style={{ backgroundColor: book.coverColor }}
                          />
                          <div>
                            <p className="font-serif font-semibold text-slate-900">
                              {book.judul}
                            </p>
                            <p className="text-xs text-slate-500">
                              {book.penulis} · {book.tahunTerbit}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">{book.kategori}</Badge>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">
                        {book.kodeRak}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-semibold text-slate-800">
                        {book.stokTotal}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {book.stokTersedia > 0 ? (
                          <Badge variant="emerald">{book.stokTersedia} tersedia</Badge>
                        ) : (
                          <Badge variant="rose">Habis (0)</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingBook(book);
                              setIsFormOpen(true);
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-parchment-100"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingBook(book)}
                            title={
                              activeLoans > 0
                                ? `Sedang dipinjam (${activeLoans} eksemplar)`
                                : 'Hapus buku'
                            }
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalItems={filteredBooks.length}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
      />

      <BookFormModal
        isOpen={isFormOpen}
        editingBook={editingBook}
        existingBooks={books}
        onClose={() => {
          setIsFormOpen(false);
          setEditingBook(null);
        }}
        onSubmit={handleFormSubmit}
      />

      <DeleteConfirmModal
        book={deletingBook}
        activeLoansCount={
          deletingBook ? activeLoanCountByBook.get(deletingBook.id) || 0 : 0
        }
        onClose={() => setDeletingBook(null)}
        onConfirmDelete={handleConfirmDelete}
      />
    </div>
  );
}
