import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LibraryProvider, useLibrary } from '../context/LibraryContext';
import { ToastProvider } from '../context/ToastContext';
import { BookInput } from '../types';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    ToastProvider,
    null,
    React.createElement(LibraryProvider, null, children),
  );
}

describe('Manajemen Inventaris & Proteksi Penghapusan pada Skala 1.000 Buku', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('menambahkan buku baru ke katalog 10.000 buku berhasil, dan ISBN duplikat memicu error "ISBN sudah terdaftar di sistem"', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });
    expect(result.current.books).toHaveLength(10000);

    const validInput: BookInput = {
      isbn: '978-602-9991234',
      judul: 'Filosofi Teras',
      penulis: 'Henry Manampiring',
      penerbit: 'Kompas Media Nusantara',
      tahunTerbit: 2018,
      kategori: 'Sejarah & Sosial',
      kodeRak: 'RAK-D01',
      stokTotal: 4,
      coverColor: '#064E3B',
      deskripsi: 'Pengantar filsafat Stoa untuk kehidupan modern.',
    };

    let addRes: ReturnType<typeof result.current.addBook>;
    act(() => {
      addRes = result.current.addBook(validInput);
    });

    expect(addRes!.success).toBe(true);
    expect(result.current.books).toHaveLength(10001);
    expect(result.current.books[0].isbn).toBe('978-602-9991234');
    expect(result.current.books[0].stokTersedia).toBe(4);

    // Attempt duplicate ISBN matching BK-0001 ("978-602-0000-00-1")
    const bk1Isbn = result.current.books.find((b) => b.id === 'BK-0001')!.isbn;
    let dupExact: ReturnType<typeof result.current.addBook>;
    act(() => {
      dupExact = result.current.addBook({
        ...validInput,
        isbn: bk1Isbn,
        judul: 'Buku Duplikat',
      });
    });
    expect(dupExact!.success).toBe(false);
    expect(dupExact!.message).toBe('ISBN sudah terdaftar di sistem');

    // Attempt duplicate ISBN without dashes
    let dupDigits: ReturnType<typeof result.current.addBook>;
    act(() => {
      dupDigits = result.current.addBook({
        ...validInput,
        isbn: '9786020000001',
        judul: 'Buku Duplikat Tanpa Strip',
      });
    });
    expect(dupDigits!.success).toBe(false);
    expect(dupDigits!.message).toBe('ISBN sudah terdaftar di sistem');
    expect(result.current.books).toHaveLength(10001);
  });

  it('menghapus buku yang sedang dipinjam aktif ditolak dengan pesan proteksi, sedangkan buku bebas pinjaman berhasil dihapus', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });

    // BK-0001 has active loan LN-0001 in INITIAL_LOANS
    let blockedDelete: ReturnType<typeof result.current.deleteBook>;
    act(() => {
      blockedDelete = result.current.deleteBook('BK-0001');
    });

    expect(blockedDelete!.success).toBe(false);
    expect(blockedDelete!.message).toBe(
      'Buku tidak dapat dihapus karena masih ada 1 eksemplar yang sedang dipinjam.',
    );
    expect(result.current.books.some((b) => b.id === 'BK-0001')).toBe(true);

    // BK-0003 has no active loans
    let allowedDelete: ReturnType<typeof result.current.deleteBook>;
    act(() => {
      allowedDelete = result.current.deleteBook('BK-0003');
    });

    expect(allowedDelete!.success).toBe(true);
    expect(result.current.books.some((b) => b.id === 'BK-0003')).toBe(false);
    expect(result.current.books).toHaveLength(9999);
  });

  it('memperbarui stok buku menjaga jumlah eksemplar yang sedang dipinjam tetap akurat', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });
    const bk1 = result.current.books.find((b) => b.id === 'BK-0001')!;
    const borrowedCount = bk1.stokTotal - bk1.stokTersedia;
    expect(borrowedCount).toBe(1);

    let updateRes: ReturnType<typeof result.current.updateBook>;
    act(() => {
      updateRes = result.current.updateBook('BK-0001', {
        isbn: bk1.isbn,
        judul: bk1.judul,
        penulis: bk1.penulis,
        penerbit: bk1.penerbit,
        tahunTerbit: bk1.tahunTerbit,
        kategori: bk1.kategori,
        kodeRak: 'RAK-A99',
        stokTotal: 10,
        coverColor: bk1.coverColor,
        deskripsi: bk1.deskripsi,
      });
    });

    expect(updateRes!.success).toBe(true);
    const updated = result.current.books.find((b) => b.id === 'BK-0001')!;
    expect(updated.kodeRak).toBe('RAK-A99');
    expect(updated.stokTotal).toBe(10);
    expect(updated.stokTersedia).toBe(9);
  });
});
