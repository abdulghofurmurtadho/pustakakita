import React from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('Persistensi localStorage 10.000 Buku Acak, Backup/Restore & Integrasi Halaman Inventaris Terpadu', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('saat localStorage kosong, aplikasi otomatis mengisi 10.000 buku unik teracak dan 3 transaksi sirkulasi awal', () => {
    expect(window.localStorage.getItem(BOOKS_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(LOANS_STORAGE_KEY)).toBeNull();

    const { result } = renderHook(() => useLibrary(), { wrapper });

    expect(result.current.books).toHaveLength(10000);
    expect(result.current.loans).toHaveLength(3);
    expect(result.current.books).toEqual(INITIAL_BOOKS);
    expect(result.current.loans).toEqual(INITIAL_LOANS);

    const storedBooks = JSON.parse(
      window.localStorage.getItem(BOOKS_STORAGE_KEY) || '[]',
    );
    const storedLoans = JSON.parse(
      window.localStorage.getItem(LOANS_STORAGE_KEY) || '[]',
    );
    expect(storedBooks).toHaveLength(10000);
    expect(storedLoans).toHaveLength(3);
  });

  it('preset dataset dan shuffleInventoryBooks mampu mengganti serta mengacak ulang rak inventaris', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });

    act(() => {
      result.current.loadPresetDataset(1000);
    });
    expect(result.current.books).toHaveLength(1000);

    const firstIdBefore = result.current.books[0].id;
    act(() => {
      result.current.shuffleInventoryBooks();
    });
    expect(result.current.books).toHaveLength(1000);
    expect(typeof firstIdBefore).toBe('string');

    act(() => {
      result.current.loadPresetDataset(10000);
    });
    expect(result.current.books).toHaveLength(10000);
  });

  it('ekspor JSON backup lalu restore memulihkan state books dan loans 100% presisi', () => {
    const { result } = renderHook(() => useLibrary(), { wrapper });

    act(() => {
      result.current.loadPresetDataset(1000);
    });

    act(() => {
      result.current.addBook({
        isbn: '978-602-4246-94-5',
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
    expect(result.current.books).toHaveLength(10000);
    expect(result.current.loans).toHaveLength(3);

    let importRes: ReturnType<typeof result.current.importBackupJson>;
    act(() => {
      importRes = result.current.importBackupJson(exportedJson);
    });

    expect(importRes!.success).toBe(true);
    expect(result.current.books).toEqual(expectedBooks);
    expect(result.current.loans).toEqual(expectedLoans);
  });

  it('integrasi UI Terpadu 2 Menu Utama: Dashboard Ringkasan Koleksi & Inventaris Uji Algoritma (Progress Bar 0%->100%, Progressive Disclosure & Sinkronisasi CRUD)', () => {
    vi.useFakeTimers();
    try {
      render(React.createElement(App));

      // Menu 1: Dashboard Ringkasan Koleksi opens initially with 10.000 books KPI, Donut Chart (6 Rack Groups) & Year Bar Chart
      expect(
        screen.getByText(/Dashboard Ringkasan Koleksi PustakaKita/i),
      ).toBeInTheDocument();
      expect(screen.getByTestId('kpi-total-judul')).toHaveTextContent('10.000');
      expect(screen.getByTestId('kpi-kategori-rak')).toHaveTextContent('6 Kategori');
      expect(
        screen.getByText(/Proporsi Buku per Kategori & Zona Rak Fisik/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Sebaran Tahun Terbit Buku \(2010–2026\)/i),
      ).toBeInTheDocument();

      // Ensure old Pengaturan & Data menu is removed from Sidebar
      expect(
        screen.queryByRole('button', { name: /Pengaturan & Data/i }),
      ).toBeNull();

      // Switch to Menu 2: Inventaris & Uji Algoritma
      fireEvent.click(
        screen.getAllByRole('button', {
          name: /Inventaris & Uji Algoritma/i,
        })[0],
      );

      expect(
        screen.getByText(/Inventaris Buku & Mesin Sorting \/ Searching Terpadu/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /Acak Ulang Data \(Shuffle\)/i }),
      ).toBeInTheDocument();

      // Separate columns: No. Posisi (Indeks) vs Lokasi Rak
      expect(
        screen.getAllByText(/No\. Posisi \(Indeks\)/i).length,
      ).toBeGreaterThan(0);
      expect(screen.getAllByText(/Lokasi Rak/i).length).toBeGreaterThan(0);

      // Progressive Disclosure: Before & After / Trace / Analysis MUST be hidden initially
      expect(screen.queryByLabelText(/Hasil Eksekusi Sorting/i)).toBeNull();
      expect(screen.queryByLabelText(/Hasil Eksekusi Searching/i)).toBeNull();

      // Select Kecil (50) on Tab 1 Sorting, type Post-Sort Highlight keyword, and click Jalankan Pengurutan
      fireEvent.click(screen.getByRole('button', { name: /Kecil \(50\)/i }));
      const highlightInput = screen.getByPlaceholderText(
        /Ketik judul buku untuk ditandai posisinya setelah urut/i,
      ) as HTMLInputElement;
      fireEvent.change(highlightInput, { target: { value: 'Geografi' } });
      expect(highlightInput.value).toBe('Geografi');

      fireEvent.click(
        screen.getByRole('button', { name: /Jalankan Pengurutan \(Sorting\)/i }),
      );

      // Immediately after click (before 100%), Progress Bar is shown and results are still hidden
      expect(
        screen.getByLabelText(/Progress Eksekusi Algoritma/i),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Hasil Eksekusi Sorting/i)).toBeNull();

      // Advance timers so Progress Bar reaches 100%
      act(() => {
        vi.advanceTimersByTime(150);
      });

      // Now Blok 1, Blok 2, and Blok 3 of Sorting must appear!
      expect(screen.getByLabelText(/Hasil Eksekusi Sorting/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /Blok 1 — Perbandingan Susunan Data: Before vs After Sorting/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Blok 2 — Log Proses Langkah demi Langkah/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Blok 3 — Grafik Perbandingan Ke-4 Algoritma Sorting & Analisis Empiris/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Data telah diurutkan dengan Quick Sort/i),
      ).toBeInTheDocument();

      // Switch to Tab 2: Searching -> Progressive Disclosure must hide previous results
      fireEvent.click(
        screen.getByRole('button', {
          name: /TAB 2: SEARCHING \(Cari Lokasi Buku di Inventaris\)/i,
        }),
      );
      expect(screen.queryByLabelText(/Hasil Eksekusi Sorting/i)).toBeNull();
      expect(screen.queryByLabelText(/Hasil Eksekusi Searching/i)).toBeNull();

      // Clicking Cari Buku with empty keyword shows validation message and keeps results hidden
      fireEvent.click(
        screen.getByRole('button', { name: /Cari Buku \(Searching\)/i }),
      );
      expect(
        screen.getByText(/Silakan ketik kata kunci pencarian terlebih dahulu/i),
      ).toBeInTheDocument();
      expect(screen.queryByLabelText(/Hasil Eksekusi Searching/i)).toBeNull();

      // Type keyword & execute Searching
      const searchInput = screen.getByPlaceholderText(
        /Ketik judul buku yang dicari, misal: Geometri, Geografi/i,
      ) as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Geografi' } });
      fireEvent.click(
        screen.getByRole('button', { name: /Cari Buku \(Searching\)/i }),
      );

      // Before timers finish, results are still hidden while progress bar is active
      expect(screen.queryByLabelText(/Hasil Eksekusi Searching/i)).toBeNull();

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(
        screen.getByLabelText(/Hasil Eksekusi Searching/i),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Blok 1 — Kondisi Ruang Pencarian \(Before\) & Buku Ditemukan \(After\)/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Blok 3 — Grafik Perbandingan Ke-3 Algoritma Searching & Analisis Empiris/i,
        ),
      ).toBeInTheDocument();

      // Navigate back to Menu 1: Dashboard Ringkasan Koleksi
      fireEvent.click(
        screen.getByRole('button', { name: /Dashboard Ringkasan Koleksi/i }),
      );
      expect(
        screen.getByText(/Dashboard Ringkasan Koleksi PustakaKita/i),
      ).toBeInTheDocument();
      expect(screen.getByTestId('kpi-total-judul')).toHaveTextContent('10.000');
    } finally {
      vi.useRealTimers();
    }
  });
});
