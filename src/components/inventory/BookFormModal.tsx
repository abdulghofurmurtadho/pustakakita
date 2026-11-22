import React, { useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { BOOK_CATEGORIES, COVER_COLOR_PALETTE } from '../../data/initialSeed';
import { Book, BookCategory, BookInput } from '../../types';
import { formatIsbnInput } from '../../utils/formatters';
import { validateBookInput } from '../../utils/validators';
import { Modal } from '../common/Modal';

interface BookFormModalProps {
  isOpen: boolean;
  editingBook: Book | null;
  existingBooks: Book[];
  onClose: () => void;
  onSubmit: (input: BookInput, editingId?: string) => { success: boolean; message: string };
}

const DEFAULT_FORM: BookInput = {
  isbn: '',
  judul: '',
  penulis: '',
  penerbit: '',
  tahunTerbit: new Date().getFullYear(),
  kategori: 'Teknologi & Komputer',
  kodeRak: 'RAK-A01',
  stokTotal: 1,
  coverColor: '#065F46',
  deskripsi: '',
};

export function BookFormModal({
  isOpen,
  editingBook,
  existingBooks,
  onClose,
  onSubmit,
}: BookFormModalProps) {
  const [form, setForm] = useState<BookInput>(DEFAULT_FORM);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;
    setFieldErrors({});
    setSubmitError('');
    if (editingBook) {
      setForm({
        isbn: editingBook.isbn,
        judul: editingBook.judul,
        penulis: editingBook.penulis,
        penerbit: editingBook.penerbit,
        tahunTerbit: editingBook.tahunTerbit,
        kategori: editingBook.kategori,
        kodeRak: editingBook.kodeRak,
        stokTotal: editingBook.stokTotal,
        coverColor: editingBook.coverColor,
        deskripsi: editingBook.deskripsi,
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        tahunTerbit: new Date().getFullYear(),
      });
    }
  }, [isOpen, editingBook]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateBookInput(form, existingBooks, editingBook?.id);
    if (!validation.valid) {
      setFieldErrors(validation.errors as Record<string, string>);
      setSubmitError(validation.firstError || 'Periksa kembali kolom formulir.');
      return;
    }

    const res = onSubmit(form, editingBook?.id);
    if (!res.success) {
      setSubmitError(res.message);
      return;
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBook ? 'Edit Data Buku' : 'Tambah Koleksi Buku Baru'}
      subtitle={
        editingBook
          ? `Memperbarui entri ${editingBook.id}`
          : 'Lengkapi metadata katalog dan jumlah eksemplar fisik.'
      }
      maxWidthClass="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitError && (
          <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="book-isbn"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              ISBN (10 atau 13 digit) *
            </label>
            <input
              id="book-isbn"
              type="text"
              value={form.isbn}
              onChange={(e) => {
                setForm((prev) => ({
                  ...prev,
                  isbn: formatIsbnInput(e.target.value),
                }));
                setFieldErrors((prev) => ({ ...prev, isbn: '' }));
                setSubmitError('');
              }}
              placeholder="978-0132350884"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.isbn && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.isbn}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="book-rack"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kode Lokasi Rak *
            </label>
            <input
              id="book-rack"
              type="text"
              value={form.kodeRak}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  kodeRak: e.target.value.toUpperCase(),
                }))
              }
              placeholder="RAK-A01"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.kodeRak && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.kodeRak}
              </p>
            )}
          </div>
        </div>

        <div>
          <label
            htmlFor="book-title"
            className="mb-1 block text-xs font-semibold text-slate-700"
          >
            Judul Buku *
          </label>
          <input
            id="book-title"
            type="text"
            value={form.judul}
            onChange={(e) => setForm((prev) => ({ ...prev, judul: e.target.value }))}
            placeholder="Contoh: Clean Code: A Handbook of Agile Software Craftsmanship"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
          {fieldErrors.judul && (
            <p className="mt-1 text-[11px] font-medium text-rose-600">
              {fieldErrors.judul}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="book-author"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Penulis *
            </label>
            <input
              id="book-author"
              type="text"
              value={form.penulis}
              onChange={(e) => setForm((prev) => ({ ...prev, penulis: e.target.value }))}
              placeholder="Nama penulis"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.penulis && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.penulis}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="book-publisher"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Penerbit *
            </label>
            <input
              id="book-publisher"
              type="text"
              value={form.penerbit}
              onChange={(e) => setForm((prev) => ({ ...prev, penerbit: e.target.value }))}
              placeholder="Nama penerbit"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.penerbit && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.penerbit}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label
              htmlFor="book-category"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Kategori *
            </label>
            <select
              id="book-category"
              value={form.kategori}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  kategori: e.target.value as BookCategory,
                }))
              }
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            >
              {BOOK_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="book-year"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Tahun Terbit *
            </label>
            <input
              id="book-year"
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={form.tahunTerbit}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tahunTerbit: Number(e.target.value),
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.tahunTerbit && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.tahunTerbit}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="book-stock"
              className="mb-1 block text-xs font-semibold text-slate-700"
            >
              Stok Total *
            </label>
            <input
              id="book-stock"
              type="number"
              min={1}
              value={form.stokTotal}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  stokTotal: Number(e.target.value),
                }))
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
            />
            {fieldErrors.stokTotal && (
              <p className="mt-1 text-[11px] font-medium text-rose-600">
                {fieldErrors.stokTotal}
              </p>
            )}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            Warna Sampul Katalog
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {COVER_COLOR_PALETTE.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, coverColor: swatch.hex }))}
                title={swatch.label}
                className={`h-7 w-7 rounded-full border-2 transition ${
                  form.coverColor === swatch.hex
                    ? 'scale-110 border-slate-900 ring-2 ring-slate-300'
                    : 'border-white shadow-sm hover:scale-105'
                }`}
                style={{ backgroundColor: swatch.hex }}
                aria-label={`Pilih warna ${swatch.label}`}
              />
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="book-desc"
            className="mb-1 block text-xs font-semibold text-slate-700"
          >
            Sinopsis / Deskripsi Singkat
          </label>
          <textarea
            id="book-desc"
            rows={3}
            value={form.deskripsi}
            onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
            placeholder="Ringkasan materi atau sinopsis buku..."
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none"
          />
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
            className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            {editingBook ? 'Simpan Perubahan' : 'Tambahkan Buku'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
