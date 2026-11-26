import { useMemo } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  Calendar,
  FolderKanban,
  Layers,
  MapPin,
  PackageCheck,
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
import { useLibrary } from '../context/LibraryContext';
import { Book, ViewRoute } from '../types';

interface DashboardViewProps {
  onNavigate: (route: ViewRoute) => void;
}

export type RackGroupKey =
  | 'Teknologi'
  | 'Pertanian'
  | 'Kebumian'
  | 'Matematika'
  | 'Sains'
  | 'Umum';

const RACK_GROUP_CONFIG: {
  key: RackGroupKey;
  label: string;
  rackRange: string;
  color: string;
}[] = [
  {
    key: 'Teknologi',
    label: 'Teknologi (Rak A)',
    rackRange: 'Rak A1 – A4 (Teknologi & Komputer)',
    color: '#064E3B',
  },
  {
    key: 'Pertanian',
    label: 'Pertanian (Rak B)',
    rackRange: 'Rak B1 – B3 (Pertanian & Agribisnis)',
    color: '#15803D',
  },
  {
    key: 'Kebumian',
    label: 'Kebumian (Rak C)',
    rackRange: 'Rak C1 – C3 (Kebumian & Geografi)',
    color: '#0284C7',
  },
  {
    key: 'Matematika',
    label: 'Matematika (Rak D)',
    rackRange: 'Rak D1 – D3 (Matematika & Geometri)',
    color: '#1E3A8A',
  },
  {
    key: 'Sains',
    label: 'Sains (Rak E)',
    rackRange: 'Rak E1 – E2 (Sains Alam & Fisika)',
    color: '#D97706',
  },
  {
    key: 'Umum',
    label: 'Umum (Rak F–H)',
    rackRange: 'Rak F – H (Umum, Sastra, Sosial & Ekonomi)',
    color: '#7C3AED',
  },
];

export function classifyBookRackGroup(book: Book): RackGroupKey {
  const rakLower = (book.kodeRak || '').toLowerCase();
  const titleLower = (book.judul || '').toLowerCase();

  if (
    rakLower.includes('teknologi') ||
    rakLower.includes('komputer') ||
    rakLower.includes('rekayasa') ||
    rakLower.startsWith('rak a') ||
    rakLower.startsWith('rak-a')
  ) {
    return 'Teknologi';
  }
  if (
    rakLower.includes('pertanian') ||
    rakLower.includes('agribisnis') ||
    rakLower.startsWith('rak b') ||
    rakLower.startsWith('rak-b') ||
    titleLower.includes('pertanian')
  ) {
    return 'Pertanian';
  }
  if (
    rakLower.includes('kebumian') ||
    rakLower.includes('geografi') ||
    rakLower.startsWith('rak c') ||
    rakLower.startsWith('rak-c') ||
    titleLower.includes('kebumian') ||
    titleLower.includes('geografi')
  ) {
    return 'Kebumian';
  }
  if (
    rakLower.includes('matematika') ||
    rakLower.startsWith('rak d') ||
    rakLower.startsWith('rak-d') ||
    titleLower.includes('geometri') ||
    titleLower.includes('matematika') ||
    titleLower.includes('kalkulus') ||
    titleLower.includes('aljabar')
  ) {
    return 'Matematika';
  }
  if (
    rakLower.includes('sains') ||
    rakLower.startsWith('rak e') ||
    rakLower.startsWith('rak-e')
  ) {
    return 'Sains';
  }
  if (book.kategori === 'Teknologi & Komputer') {
    return 'Teknologi';
  }
  if (book.kategori === 'Sains & Matematika') {
    return 'Sains';
  }
  return 'Umum';
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { books } = useLibrary();

  const {
    totalJudul,
    totalEksemplar,
    totalTersedia,
    uniqueRackLocationsCount,
    activeRackGroupCount,
    latestYear,
    latestYearCount,
    latestBookSample,
    rackDistributionData,
    yearDistributionData,
  } = useMemo(() => {
    let eksemplar = 0;
    let tersedia = 0;
    let maxYear = 0;
    let maxYearBooksCount = 0;
    let newestBook: Book | null = null;

    const uniqueRacks = new Set<string>();
    const rackGroupCounts = new Map<RackGroupKey, number>();
    const rackGroupStock = new Map<RackGroupKey, number>();
    for (const cfg of RACK_GROUP_CONFIG) {
      rackGroupCounts.set(cfg.key, 0);
      rackGroupStock.set(cfg.key, 0);
    }

    const yearCounts = new Map<number, number>();
    for (let y = 2010; y <= 2026; y += 1) {
      yearCounts.set(y, 0);
    }

    for (let i = 0; i < books.length; i += 1) {
      const b = books[i];
      eksemplar += b.stokTotal;
      tersedia += b.stokTersedia;
      if (b.kodeRak) {
        uniqueRacks.add(b.kodeRak.trim());
      }

      const groupKey = classifyBookRackGroup(b);
      rackGroupCounts.set(groupKey, (rackGroupCounts.get(groupKey) || 0) + 1);
      rackGroupStock.set(
        groupKey,
        (rackGroupStock.get(groupKey) || 0) + b.stokTotal,
      );

      if (b.tahunTerbit > maxYear) {
        maxYear = b.tahunTerbit;
        maxYearBooksCount = 1;
        newestBook = b;
      } else if (b.tahunTerbit === maxYear) {
        maxYearBooksCount += 1;
        if (!newestBook) {
          newestBook = b;
        }
      }

      yearCounts.set(b.tahunTerbit, (yearCounts.get(b.tahunTerbit) || 0) + 1);
    }

    const total = books.length;
    const rackDist = RACK_GROUP_CONFIG.map((cfg) => {
      const count = rackGroupCounts.get(cfg.key) || 0;
      const stock = rackGroupStock.get(cfg.key) || 0;
      const percentage = total > 0 ? Number(((count / total) * 100).toFixed(1)) : 0;
      return {
        key: cfg.key,
        name: cfg.key,
        fullLabel: cfg.label,
        rackRange: cfg.rackRange,
        value: count,
        stock,
        percentage,
        color: cfg.color,
      };
    });

    const activeGroups = rackDist.filter((item) => item.value > 0).length;

    const sortedYears = Array.from(yearCounts.keys()).sort((a, b) => a - b);
    const yearDist = sortedYears.map((yr) => ({
      tahun: String(yr),
      yearNum: yr,
      jumlah: yearCounts.get(yr) || 0,
    }));

    return {
      totalJudul: total,
      totalEksemplar: eksemplar,
      totalTersedia: tersedia,
      uniqueRackLocationsCount: uniqueRacks.size,
      activeRackGroupCount: activeGroups,
      latestYear: maxYear || 2026,
      latestYearCount: maxYearBooksCount,
      latestBookSample: newestBook,
      rackDistributionData: rackDist,
      yearDistributionData: yearDist,
    };
  }, [books]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Menu 1 · Single Source of Truth ({totalJudul.toLocaleString('id-ID')} Buku Aktif)
          </p>
          <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
            Dashboard Ringkasan Koleksi PustakaKita
          </h1>
          <p className="mt-1 text-xs text-slate-600">
            Seluruh metrik KPI, diagram lingkaran kategori lokasi rak, dan grafik sebaran tahun
            terbit dihitung secara dinamis dari sumber data tunggal inventaris.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('/inventaris')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-950"
          >
            <PackageCheck className="h-4 w-4 text-amber-300" />
            <span>Buka Inventaris &amp; Uji Algoritma</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* 4 Main Dynamic KPI Cards */}
      <section
        aria-label="Kartu KPI Ringkasan Koleksi"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {/* KPI 1: Total Judul Buku */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Judul Buku</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-900">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <p
            data-testid="kpi-total-judul"
            className="mt-3 font-mono text-3xl font-bold text-slate-900"
          >
            {totalJudul.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Tersimpan acak (Fisher-Yates) di memori utama
          </p>
        </div>

        {/* KPI 2: Total Stok Eksemplar */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Total Stok Eksemplar
            </span>
            <div className="rounded-lg bg-indigo-50 p-2 text-indigo-700">
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <p
            data-testid="kpi-total-eksemplar"
            className="mt-3 font-mono text-3xl font-bold text-slate-900"
          >
            {totalEksemplar.toLocaleString('id-ID')}
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            <strong className="text-emerald-700">
              {totalTersedia.toLocaleString('id-ID')}
            </strong>{' '}
            eksemplar tersedia siap dipinjam
          </p>
        </div>

        {/* KPI 3: Jumlah Kategori Rak */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Jumlah Kategori Rak
            </span>
            <div className="rounded-lg bg-amber-50 p-2 text-amber-700">
              <FolderKanban className="h-4 w-4" />
            </div>
          </div>
          <p
            data-testid="kpi-kategori-rak"
            className="mt-3 font-mono text-3xl font-bold text-slate-900"
          >
            {activeRackGroupCount} Kategori
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Tersebar di{' '}
            <strong className="text-slate-800">{uniqueRackLocationsCount}</strong> kode
            lokasi rak fisik
          </p>
        </div>

        {/* KPI 4: Buku Terbitan Terbaru */}
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Buku Terbitan Terbaru
            </span>
            <div className="rounded-lg bg-purple-50 p-2 text-purple-700">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <p
              data-testid="kpi-tahun-terbaru"
              className="font-mono text-3xl font-bold text-emerald-900"
            >
              {latestYear}
            </p>
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-800">
              {latestYearCount.toLocaleString('id-ID')} judul
            </span>
          </div>
          <p
            className="mt-1 truncate text-[11px] text-slate-500"
            title={latestBookSample?.judul || '-'}
          >
            Contoh: <strong className="text-slate-700">{latestBookSample?.judul || '-'}</strong>
          </p>
        </div>
      </section>

      {/* Visual Analytics Section: Donut Chart (Kategori / Lokasi Rak) + Bar Chart (Sebaran Tahun Terbit 2010–2026) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* Donut Chart + Detailed Percentage Breakdown Table */}
        <section
          aria-label="Diagram Lingkaran Distribusi Kategori dan Lokasi Rak"
          className="rounded-2xl border border-parchment-200 bg-white p-5 shadow-sm xl:col-span-6"
        >
          <div className="mb-4 flex items-start justify-between gap-2">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-900">
                <MapPin className="h-3 w-3" />
                Distribusi Kategori / Lokasi Rak
              </span>
              <h2 className="mt-1 font-serif text-lg font-bold text-slate-900">
                Proporsi Buku per Kategori &amp; Zona Rak Fisik
              </h2>
              <p className="text-xs text-slate-500">
                Persentase distribusi {totalJudul.toLocaleString('id-ID')} buku pada 6 zona rak:
                Teknologi, Pertanian, Kebumian, Matematika, Sains, dan Umum.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-12">
            <div className="h-64 w-full md:col-span-6">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={rackDistributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={86}
                    paddingAngle={3}
                  >
                    {rackDistributionData.map((entry) => (
                      <Cell key={entry.key} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      const found = rackDistributionData.find((item) => item.name === name);
                      const pct = found ? found.percentage : 0;
                      return [
                        `${value.toLocaleString('id-ID')} buku (${pct}%)`,
                        found?.fullLabel || name,
                      ];
                    }}
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

            <div className="space-y-2 md:col-span-6">
              {rackDistributionData.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between rounded-xl border border-parchment-200 bg-parchment-50/60 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900">{item.key}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {item.rackRange}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className="font-mono font-bold text-slate-900">
                      {item.value.toLocaleString('id-ID')} buku
                    </p>
                    <p className="font-mono text-[11px] font-semibold text-emerald-800">
                      {item.percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bar Chart: Sebaran Tahun Terbit Buku (2010–2026) */}
        <section
          aria-label="Grafik Batang Sebaran Tahun Terbit Buku"
          className="flex flex-col justify-between rounded-2xl border border-parchment-200 bg-white p-5 shadow-sm xl:col-span-6"
        >
          <div>
            <div className="mb-4 flex items-start justify-between gap-2">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-semibold text-indigo-900">
                  <BarChart3 className="h-3 w-3" />
                  Rentang Tahun Terbit 2010 – 2026
                </span>
                <h2 className="mt-1 font-serif text-lg font-bold text-slate-900">
                  Sebaran Tahun Terbit Buku (2010–2026)
                </h2>
                <p className="text-xs text-slate-500">
                  Distribusi jumlah judul buku berdasarkan tahun terbit pada koleksi aktif.
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={yearDistributionData}
                  margin={{ top: 8, right: 12, left: -12, bottom: 4 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="tahun"
                    tick={{ fontSize: 11, fill: '#475569' }}
                    interval={0}
                    angle={-30}
                    textAnchor="end"
                    height={42}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [
                      `${value.toLocaleString('id-ID')} judul buku`,
                      'Jumlah Koleksi',
                    ]}
                    labelFormatter={(label) => `Tahun Terbit ${label}`}
                    contentStyle={{
                      borderRadius: '0.75rem',
                      borderColor: '#E2E8F0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="jumlah"
                    name="Jumlah Buku"
                    fill="#064E3B"
                    radius={[5, 5, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 text-xs text-slate-700">
            <div>
              <span className="font-semibold text-emerald-950">
                Terhubung Langsung ke Mesin Algoritma:
              </span>{' '}
              Setiap penambahan, perubahan, atau penghapusan buku di menu{' '}
              <strong>Inventaris &amp; Uji Algoritma</strong> langsung memperbarui grafik ini.
            </div>
            <button
              type="button"
              onClick={() => onNavigate('/inventaris')}
              className="inline-flex items-center gap-1 font-semibold text-emerald-900 underline decoration-emerald-600/60 underline-offset-4 hover:text-emerald-950"
            >
              <span>Uji Sorting &amp; Searching</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
