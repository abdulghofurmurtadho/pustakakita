import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import App from '../App';
import {
  BOOKS_STORAGE_KEY,
  LOANS_STORAGE_KEY,
  LibraryProvider,
  useLibrary,
} from '../context/LibraryContext';
import { ToastProvider } from '../context/ToastContext';
import { INITIAL_BOOKS, INITIAL_LOANS } from '../data/initialSeed';

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(
    ToastProvider,
    null,
    React.createElement(LibraryProvider, null, children),
  );
}

describe('Persistensi localStorage 1.000 Buku, Backup/Restore & Integrasi UI (AC-01 & AC-05)', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('AC-01: saat localStorage kosong, aplikasi otomatis mengisi 1.000 buku unik dan 3 transaksi sirkulasi awal', () => {
    expect(window.localStorage.getItem(BOOKS_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(LOANS_STORAGE_KEY)).toBeNull();

    const { result } = renderHook(() => useLibrary(), { wrapper });

    expect(result.current.books).toHaveLength(1000);
    expect(result.current.loans).toHaveLength(3);
    expect(result.current.books).toEqual(INITIAL_BOOKS);
    expect(result.current.loans).toEqual(INITIAL_LOANS);

    const storedBooks = JSON.parse(
      window.localStorage.getItem(BOOKS_STORAGE_KEY) || '[]',
    );
    const storedLoans = JSON.parse(
      window.localStorage.getItem(LOANS_STORAGE_KEY) || '[]',
    );
    expect(storedBooks).toHaveLength(1000);
    expect(storedLoans).toHaveLength(3);
  });

  it('preset dataset mampu mengganti isi katalog aktif ke 5.000 dan 10.000 buku secara langsung', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });

    act(() => {
      result.current.loadPresetDataset(5000);
    });
    expect(result.current.books).toHaveLength(5000);

    act(() => {
      result.current.loadPresetDataset(10000);
    });
    expect(result.current.books).toHaveLength(10000);

    act(() => {
      result.current.loadPresetDataset(1000);
    });
    expect(result.current.books).toHaveLength(1000);
  });

  it('ekspor JSON backup lalu restore memulihkan state books dan loans 100% presisi', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });

    act(() => {
      result.current.addBook({
        isbn: '978-602-4246945',
        judul: 'Laut Bercerita',
        penulis: 'Leila S. Chudori',
        penerbit: 'Kepustakaan Populer Gramedia',
        tahunTerbit: 2017,
        kategori: 'Sastra & Fiksi',
        kodeRak: 'RAK-E01',
        stokTotal: 6,
        coverColor: '#1E3A8A',
        deskripsi: 'Novel sejarah dan kemanusiaan.',
      });
    });

    act(() => {
      result.current.borrowBook({
        bookId: 'BK-0005',
        namaPeminjam: 'Dewi Anggraini',
        nimAnggota: '230101088',
        tanggalPinjam: '2026-11-22',
      });
    });

    const expectedBooks = result.current.books.map((b) => ({ ...b }));
    const expectedLoans = result.current.loans.map((l) => ({ ...l }));
    expect(expectedBooks).toHaveLength(1001);
    expect(expectedLoans).toHaveLength(4);

    const exportedJson = result.current.exportBackupJson();

    act(() => {
      result.current.resetToFactoryData();
    });
    expect(result.current.books).toHaveLength(1000);
    expect(result.current.loans).toHaveLength(3);

    let importRes: ReturnType<typeof result.current.importBackupJson>;
    act(() => {
      importRes = result.current.importBackupJson(exportedJson);
    });

    expect(importRes!.success).toBe(true);
    expect(result.current.books).toEqual(expectedBooks);
    expect(result.current.loans).toEqual(expectedLoans);
  });

  it('integrasi UI App: Dashboard tampilkan 1.000 buku, Katalog mendukung pagination, dan Benchmark menampilkan skala 1.000/5.000/10.000 + ekspor CSV', () => {
    render(React.createElement(App));

    expect(screen.getByText('Dashboard Operasional PustakaKita')).toBeInTheDocument();
    expect(screen.getAllByText('1.000').length).toBeGreaterThanOrEqual(1);

    // Navigate to Katalog & verify pagination info
    fireEvent.click(screen.getByRole('button', { name: /Katalog Buku/i }));
    expect(screen.getByText('Katalog Buku PustakaKita')).toBeInTheDocument();
    expect(screen.getAllByText(/1–25/).length).toBeGreaterThanOrEqual(1);

    // Navigate to Inventaris
    fireEvent.click(screen.getByRole('button', { name: /Inventaris Buku/i }));
    expect(screen.getByText(/Inventaris & Stok Buku/i)).toBeInTheDocument();

    // Navigate to Sirkulasi
    fireEvent.click(screen.getByRole('button', { name: /Sirkulasi & Denda/i }));
    expect(screen.getByText(/Sirkulasi Peminjaman & Denda/i)).toBeInTheDocument();

    // Navigate to Benchmark & check PRD v2.0 controls
    fireEvent.click(screen.getByRole('button', { name: /Benchmark Algoritma/i }));
    expect(
      screen.getByText(/Benchmark Algoritma Searching & Sorting/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Run Full Benchmark \(1\.000 → 5\.000 → 10\.000\)/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unduh Laporan CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Random Order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reversed Order/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Nearly Sorted/i })).toBeInTheDocument();

    // Navigate to Pengaturan
    fireEvent.click(screen.getByRole('button', { name: /Pengaturan & Data/i }));
    expect(screen.getByText(/Pengaturan & Backup Data/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Muat 10\.000 Buku/i }),
    ).toBeInTheDocument();
  });
});
