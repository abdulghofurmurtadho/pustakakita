import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  BookCopy,
  BookOpen,
  Gauge,
  Layers,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge } from '../components/common/Badge';
import { useLibrary } from '../context/LibraryContext';
import { BOOK_CATEGORIES } from '../data/initialSeed';
import { readLastBenchmarkSummary } from '../hooks/useBenchmark';
import { LoanRecord, ViewRoute } from '../types';
import {
  addDays,
  getEffectiveLoanFine,
  getTodayDateString,
  isLoanOverdue,
} from '../utils/dateUtils';
import { formatDateIndo, formatRupiah } from '../utils/formatters';

interface DashboardViewProps {
  onNavigate: (route: ViewRoute) => void;
  onQuickBorrow: () => void;
  onRequestReturn: (loan: LoanRecord) => void;
}

const PIE_COLORS = ['#064E3B', '#1E3A8A', '#D97706', '#991B1B', '#6B21A8'];

export function DashboardView({
  onNavigate,
  onQuickBorrow,
  onRequestReturn,
}: DashboardViewProps) {
  const { books, loans } = useLibrary();
  const today = getTodayDateString();
  const lastBenchmark = readLastBenchmarkSummary();

  const totalJudul = books.length;
  const totalEksemplar = books.reduce((sum, b) => sum + b.stokTotal, 0);
  const totalTersedia = books.reduce((sum, b) => sum + b.stokTersedia, 0);
  const activeLoans = loans.filter((l) => l.status === 'Dipinjam');
  const overdueLoans = activeLoans.filter((l) => isLoanOverdue(l, today));
  const totalPotentialFine = activeLoans.reduce(
    (sum, l) => sum + getEffectiveLoanFine(l, today),
    0,
  );

  // Category distribution for Donut Chart
  const categoryData = BOOK_CATEGORIES.map((category) => {
    const count = books.filter((b) => b.kategori === category).length;
    return {
      name: category,
      value: count,
    };
  }).filter((item) => item.value > 0);

  // Last 7 days loan trend for Bar Chart
  const trendData = Array.from({ length: 7 }, (_, idx) => {
    const offset = idx - 6;
    const dateStr = addDays(today, offset);
    const shortLabel = formatDateIndo(dateStr).split(' ').slice(0, 2).join(' ');
    const peminjaman = loans.filter((l) => l.tanggalPinjam === dateStr).length;
    const pengembalian = loans.filter(
      (l) => l.tanggalDikembalikan === dateStr,
    ).length;
    return {
      tanggal: shortLabel,
      peminjaman,
      pengembalian,
    };
  });

  // 5 most recent loan records
  const recentLoans = [...loans]
    .sort((a, b) => (b.tanggalPinjam > a.tanggalPinjam ? 1 : b.tanggalPinjam < a.tanggalPinjam ? -1 : b.id > a.id ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Ringkasan Perpustakaan · Skala Akademik
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Dashboard Operasional PustakaKita
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Pantau katalog berskala besar, sirkulasi aktif, denda keterlambatan, dan hasil
            benchmark algoritma struktur data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/benchmark')}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-parchment-50"
          >
            Lab Algoritma
          </button>
          <button
            type="button"
            onClick={onQuickBorrow}
            className="rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-950"
          >
            + Peminjaman Baru
          </button>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Judul Buku</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-900">
            {totalJudul.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Terindeks di {categoryData.length} kategori utama
          </p>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Eksemplar Fisik
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-900">
            {totalEksemplar.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <strong className="text-emerald-700">
              {totalTersedia.toLocaleString('id-ID')}
            </strong>{' '}
            tersedia ·{' '}
            <strong>{(totalEksemplar - totalTersedia).toLocaleString('id-ID')}</strong>{' '}
            dipinjam
          </p>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Sedang Dipinjam</span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <ArrowLeftRight className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 font-mono text-3xl font-bold text-slate-900">
            {activeLoans.length}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            {loans.filter((l) => l.status === 'Dikembalikan').length} transaksi telah
            selesai
          </p>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Terlambat &amp; Estimasi Denda
            </span>
            <div
              className={`rounded-lg p-2 ${
                overdueLoans.length > 0
                  ? 'bg-rose-50 text-rose-600'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p className="font-mono text-2xl font-bold text-rose-700">
              {formatRupiah(totalPotentialFine)}
            </p>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            <strong className="text-rose-700">{overdueLoans.length}</strong> peminjaman
            melewati tenggat 7 hari
          </p>
        </div>
      </div>

      {/* Charts + Latest Benchmark Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Donut Chart: Category Distribution */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-serif text-base font-bold text-slate-900">
                Distribusi 5 Kategori Buku
              </h2>
              <p className="text-xs text-slate-500">
                Sebaran {totalJudul.toLocaleString('id-ID')} judul aktif.
              </p>
            </div>
            <BookCopy className="h-4 w-4 text-slate-400" />
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={3}
                >
                  {categoryData.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={PIE_COLORS[idx % PIE_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} judul`, 'Koleksi']}
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: 7-day Loan Trend */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="font-serif text-base font-bold text-slate-900">
              Tren Sirkulasi (7 Hari Terakhir)
            </h2>
            <p className="text-xs text-slate-500">
              Peminjaman vs pengembalian harian.
            </p>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: '#475569' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '0.75rem',
                    borderColor: '#E2E8F0',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar
                  dataKey="peminjaman"
                  name="Peminjaman"
                  fill="#1E3A8A"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="pengembalian"
                  name="Pengembalian"
                  fill="#064E3B"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Last Benchmark Summary Panel */}
        <div className="flex flex-col justify-between rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Ringkasan Benchmark Terakhir
                </h2>
                <p className="text-xs text-slate-500">
                  Metrik performa algoritma terakhir dijalankan.
                </p>
              </div>
              <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
                <Gauge className="h-4 w-4" />
              </div>
            </div>

            {lastBenchmark ? (
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between rounded-lg bg-parchment-50 px-3 py-2 text-xs">
                  <span className="text-slate-500">Skala &amp; Kondisi</span>
                  <span className="font-mono font-semibold text-slate-900">
                    N = {lastBenchmark.scale.toLocaleString('id-ID')} ({lastBenchmark.condition})
                  </span>
                </div>
                <div className="divide-y divide-parchment-100 rounded-lg border border-parchment-200">
                  {lastBenchmark.sortMetrics.map((m) => (
                    <div
                      key={m.algorithmName}
                      className="flex items-center justify-between px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        {m.algorithmName}
                      </span>
                      <span className="font-mono text-emerald-800">
                        {m.executionTimeMs.toFixed(2)} ms ·{' '}
                        {m.comparisonsCount.toLocaleString('id-ID')} cmp
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-parchment-300 bg-parchment-50/70 p-4 text-xs leading-relaxed text-slate-600">
                Belum ada sesi benchmark tersimpan. Buka <strong>Benchmark Algoritma</strong>{' '}
                untuk menguji skala 1.000, 5.000, dan 10.000 entri buku.
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/benchmark')}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 transition hover:bg-emerald-100"
          >
            <span>Buka Laboratorium Benchmark</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Recent Loans Table */}
      <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-parchment-200 px-5 py-4">
          <div>
            <h2 className="font-serif text-base font-bold text-slate-900">
              5 Transaksi Peminjaman Terbaru
            </h2>
            <p className="text-xs text-slate-500">
              Akses cepat status pengembalian dan kalkulasi denda berjalan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/sirkulasi')}
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-parchment-200 bg-parchment-50/70 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">ID &amp; Buku</th>
                <th className="px-5 py-3">Peminjam</th>
                <th className="px-5 py-3">Tenggat Kembali</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Denda</th>
                <th className="px-5 py-3 text-right">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-parchment-100">
              {recentLoans.map((loan) => {
                const overdue = isLoanOverdue(loan, today);
                const fine = getEffectiveLoanFine(loan, today);
                return (
                  <tr key={loan.id} className="hover:bg-parchment-50/50">
                    <td className="px-5 py-3">
                      <span className="font-mono text-[11px] text-slate-400">
                        {loan.id}
                      </span>
                      <p className="font-serif text-sm font-semibold text-slate-900">
                        {loan.judulBuku}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-semibold text-slate-800">{loan.namaPeminjam}</p>
                      <p className="font-mono text-[11px] text-slate-500">
                        {loan.nimAnggota}
                      </p>
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">
                      {formatDateIndo(loan.tenggatKembali)}
                    </td>
                    <td className="px-5 py-3">
                      {loan.status === 'Dikembalikan' ? (
                        <Badge variant="emerald">Dikembalikan</Badge>
                      ) : overdue ? (
                        <Badge variant="rose">Terlambat</Badge>
                      ) : (
                        <Badge variant="amber">Dipinjam</Badge>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-800">
                      {formatRupiah(fine)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {loan.status === 'Dipinjam' ? (
                        <button
                          type="button"
                          onClick={() => onRequestReturn(loan)}
                          className="rounded-lg border border-slate-200 px-3 py-1 font-semibold text-slate-700 hover:bg-emerald-900 hover:text-white"
                        >
                          Kembalikan
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Selesai</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
