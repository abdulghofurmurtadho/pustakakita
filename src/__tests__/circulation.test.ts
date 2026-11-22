import React from 'react';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { LibraryProvider, useLibrary } from '../context/LibraryContext';
import { ToastProvider } from '../context/ToastContext';
import { calculateFine } from '../utils/dateUtils';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    ToastProvider,
    null,
    React.createElement(LibraryProvider, null, children),
  );
}

describe('Alur Transaksi Sirkulasi & Kalkulasi Denda', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('peminjaman menurunkan stokTersedia sebesar 1 dan menetapkan tenggat +7 hari', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });
    const initialBook = result.current.books.find((b) => b.id === 'BK-0003')!;
    const prevAvailable = initialBook.stokTersedia;

    let borrowRes: ReturnType<typeof result.current.borrowBook>;
    act(() => {
      borrowRes = result.current.borrowBook({
        bookId: 'BK-0003',
        namaPeminjam: 'Budi Santoso',
        nimAnggota: '230101099',
        tanggalPinjam: '2026-11-10',
      });
    });

    expect(borrowRes!.success).toBe(true);
    expect(borrowRes!.data?.tenggatKembali).toBe('2026-11-17');
    expect(borrowRes!.data?.status).toBe('Dipinjam');

    const updatedBook = result.current.books.find((b) => b.id === 'BK-0003')!;
    expect(updatedBook.stokTersedia).toBe(prevAvailable - 1);
  });

  it('memproteksi peminjaman ketika stokTersedia === 0 dengan pesan "Stok Eksemplar Habis"', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });
    const target = result.current.books.find((b) => b.id === 'BK-0005')!;
    const availableCount = target.stokTersedia;

    // Borrow until stock reaches 0
    for (let i = 0; i < availableCount; i += 1) {
      act(() => {
        const res = result.current.borrowBook({
          bookId: 'BK-0005',
          namaPeminjam: `Peminjam ${i + 1}`,
          nimAnggota: `23010110${i}`,
          tanggalPinjam: '2026-11-20',
        });
        expect(res.success).toBe(true);
      });
    }

    expect(result.current.books.find((b) => b.id === 'BK-0005')?.stokTersedia).toBe(0);

    let blockedBorrow: ReturnType<typeof result.current.borrowBook>;
    act(() => {
      blockedBorrow = result.current.borrowBook({
        bookId: 'BK-0005',
        namaPeminjam: 'Peminjam Ekstra',
        nimAnggota: '230101999',
        tanggalPinjam: '2026-11-20',
      });
    });

    expect(blockedBorrow!.success).toBe(false);
    expect(blockedBorrow!.message).toBe('Stok Eksemplar Habis');
  });

  it('pengembalian buku menaikkan stokTersedia sebesar 1 dan mengunci denda = hariTerlambat * 2000', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });
    const bk1Before = result.current.books.find((b) => b.id === 'BK-0001')!;
    const bk4Before = result.current.books.find((b) => b.id === 'BK-0004')!;

    expect(calculateFine('2026-11-17', '2026-11-22')).toBe(10000);
    expect(calculateFine('2026-11-17', '2026-11-17')).toBe(0);

    // LN-0001 has tenggatKembali: '2026-11-17', return on '2026-11-22' -> 5 days late -> Rp 10.000
    let lateReturnRes: ReturnType<typeof result.current.returnBook>;
    act(() => {
      lateReturnRes = result.current.returnBook('LN-0001', '2026-11-22');
    });

    expect(lateReturnRes!.success).toBe(true);
    expect(lateReturnRes!.data?.status).toBe('Dikembalikan');
    expect(lateReturnRes!.data?.tanggalDikembalikan).toBe('2026-11-22');
    expect(lateReturnRes!.data?.denda).toBe(10000);

    const bk1After = result.current.books.find((b) => b.id === 'BK-0001')!;
    expect(bk1After.stokTersedia).toBe(bk1Before.stokTersedia + 1);

    // LN-0002 has tenggatKembali: '2026-11-25', return on '2026-11-22' -> denda = 0
    let onTimeReturnRes: ReturnType<typeof result.current.returnBook>;
    act(() => {
      onTimeReturnRes = result.current.returnBook('LN-0002', '2026-11-22');
    });

    expect(onTimeReturnRes!.success).toBe(true);
    expect(onTimeReturnRes!.data?.denda).toBe(0);
    expect(onTimeReturnRes!.data?.status).toBe('Dikembalikan');

    const bk4After = result.current.books.find((b) => b.id === 'BK-0004')!;
    expect(bk4After.stokTersedia).toBe(bk4Before.stokTersedia + 1);
  });
});
