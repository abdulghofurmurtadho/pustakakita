import {
  ArrowLeftRight,
  BookMarked,
  Gauge,
  LayoutDashboard,
  PackageCheck,
  Settings,
  X,
} from 'lucide-react';
import { ViewRoute } from '../../types';

interface SidebarProps {
  currentRoute: ViewRoute;
  onNavigate: (route: ViewRoute) => void;
  totalBooks: number;
  activeLoansCount: number;
  overdueCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  route: ViewRoute;
  label: string;
  description: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  {
    route: '/',
    label: 'Dashboard',
    description: 'Ringkasan KPI & tren',
    icon: LayoutDashboard,
  },
  {
    route: '/katalog',
    label: 'Katalog Buku',
    description: 'Cari & jelajah koleksi',
    icon: BookMarked,
  },
  {
    route: '/inventaris',
    label: 'Inventaris Buku',
    description: 'Kelola CRUD & stok',
    icon: PackageCheck,
  },
  {
    route: '/sirkulasi',
    label: 'Sirkulasi & Denda',
    description: 'Peminjaman & kembali',
    icon: ArrowLeftRight,
  },
  {
    route: '/benchmark',
    label: 'Benchmark Algoritma',
    description: 'Lab Sort & Search',
    icon: Gauge,
  },
  {
    route: '/pengaturan',
    label: 'Pengaturan & Data',
    description: 'Backup JSON & reset',
    icon: Settings,
  },
];

export function Sidebar({
  currentRoute,
  onNavigate,
  totalBooks,
  activeLoansCount,
  overdueCount,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const handleSelect = (route: ViewRoute) => {
    onNavigate(route);
    onCloseMobile();
  };

  const renderBadge = (route: ViewRoute) => {
    if (route === '/katalog' || route === '/inventaris') {
      return (
        <span className="rounded-full bg-parchment-200/80 px-2 py-0.5 font-mono text-[11px] font-medium text-slate-700">
          {totalBooks.toLocaleString('id-ID')}
        </span>
      );
    }
    if (route === '/sirkulasi') {
      return (
        <span
          className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold ${
            overdueCount > 0
              ? 'bg-rose-100 text-rose-700'
              : 'bg-parchment-200/80 text-slate-700'
          }`}
        >
          {activeLoansCount}
        </span>
      );
    }
    return null;
  };

  const navContent = (
    <div className="flex h-full flex-col justify-between px-3 py-5">
      <div className="space-y-1.5">
        <div className="mb-3 flex items-center justify-between px-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Menu Navigasi
          </p>
          <button
            type="button"
            onClick={onCloseMobile}
            className="rounded-lg p-1 text-slate-500 hover:bg-parchment-100 lg:hidden"
            aria-label="Tutup sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              type="button"
              onClick={() => handleSelect(item.route)}
              className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all ${
                isActive
                  ? 'bg-emerald-900 text-white shadow-sm'
                  : 'text-slate-700 hover:bg-parchment-100 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`h-4 w-4 shrink-0 ${
                    isActive ? 'text-amber-300' : 'text-slate-500 group-hover:text-slate-800'
                  }`}
                />
                <div>
                  <p className="text-sm font-semibold leading-tight">{item.label}</p>
                  <p
                    className={`mt-0.5 text-[11px] ${
                      isActive ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
              {renderBadge(item.route)}
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-parchment-200 bg-parchment-100/70 p-3.5">
        <p className="font-serif text-xs font-bold text-slate-800">PustakaKita Lab</p>
        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
          Penyimpanan lokal aktif via <code className="font-mono text-[10px]">localStorage</code>.
          Denda keterlambatan: <strong>Rp 2.000/hari</strong> (tenggat 7 hari).
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-parchment-200 bg-white lg:block">
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">{navContent}</div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onCloseMobile}
          />
          <aside className="relative z-50 h-full w-72 border-r border-parchment-200 bg-white shadow-xl">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
