import { useMemo, useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { LoanTable } from '../components/circulation/LoanTable';
import { useLibrary } from '../context/LibraryContext';
import { LoanRecord } from '../types';
import { getEffectiveLoanFine, getTodayDateString, isLoanOverdue } from '../utils/dateUtils';
import { formatRupiah } from '../utils/formatters';

interface CirculationViewProps {
  onOpenBorrowModal: () => void;
  onRequestReturn: (loan: LoanRecord) => void;
}

export function CirculationView({
  onOpenBorrowModal,
  onRequestReturn,
}: CirculationViewProps) {
  const { loans } = useLibrary();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [query, setQuery] = useState('');

  const today = getTodayDateString();

  const activeLoans = useMemo(
    () => loans.filter((l) => l.status === 'Dipinjam'),
    [loans],
  );
  const returnedLoans = useMemo(
    () => loans.filter((l) => l.status === 'Dikembalikan'),
    [loans],
  );

  const overdueCount = useMemo(
    () => activeLoans.filter((l) => isLoanOverdue(l, today)).length,
    [activeLoans, today],
  );

  const totalCollectedOrAccruedFine = useMemo(
    () => loans.reduce((sum, l) => sum + getEffectiveLoanFine(l, today), 0),
    [loans, today],
  );

  const displayedLoans = useMemo(() => {
    const base = activeTab === 'active' ? activeLoans : returnedLoans;
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter(
      (l) =>
        l.judulBuku.toLowerCase().includes(q) ||
        l.namaPeminjam.toLowerCase().includes(q) ||
        l.nimAnggota.toLowerCase().includes(q) ||
        l.isbnBuku.toLowerCase().includes(q),
    );
  }, [activeTab, activeLoans, returnedLoans, query]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Transaksi &amp; Keterlambatan
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Sirkulasi Peminjaman &amp; Denda
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Kelola peminjaman aktif (tenggat 7 hari) dan pengembalian otomatis dengan
            kalkulasi denda Rp 2.000/hari keterlambatan.
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenBorrowModal}
          className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800"
        >
          <PlusCircle className="h-4 w-4 text-amber-300" />
          <span>Tambah Peminjaman Baru</span>
        </button>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Sedang Dipinjam
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">
            {activeLoans.length} transaksi
          </p>
        </div>
        <div className="rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Terlambat Saat Ini
          </p>
          <p
            className={`mt-1 font-mono text-xl font-bold ${
              overdueCount > 0 ? 'text-rose-700' : 'text-emerald-700'
            }`}
          >
            {overdueCount} transaksi
          </p>
        </div>
        <div className="rounded-xl border border-parchment-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Denda (Aktif + Riwayat)
          </p>
          <p className="mt-1 font-mono text-xl font-bold text-slate-900">
            {formatRupiah(totalCollectedOrAccruedFine)}
          </p>
        </div>
      </div>

      {/* Tabs + Search */}
      <div className="flex flex-col gap-3 rounded-xl border border-parchment-200 bg-white p-3.5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-slate-200 bg-parchment-50 p-1">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Peminjaman Aktif ({activeLoans.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Riwayat Pengembalian ({returnedLoans.length})
          </button>
        </div>

        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari peminjam, NIM, atau judul buku..."
            className="w-full rounded-lg border border-slate-200 bg-parchment-50/60 py-1.5 pl-8 pr-3 text-xs text-slate-900 focus:border-slate-900 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      <LoanTable
        loans={displayedLoans}
        mode={activeTab}
        onRequestReturn={onRequestReturn}
      />
    </div>
  );
}
