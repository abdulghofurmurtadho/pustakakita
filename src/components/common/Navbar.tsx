import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Clock, Menu, PlusCircle } from 'lucide-react';
import { ViewRoute } from '../../types';

interface NavbarProps {
  overdueCount: number;
  onQuickBorrow: () => void;
  onNavigate: (route: ViewRoute) => void;
  onToggleMobileMenu: () => void;
}

export function Navbar({
  overdueCount,
  onQuickBorrow,
  onNavigate,
  onToggleMobileMenu,
}: NavbarProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const formattedDate = now.toLocaleDateString('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 border-b border-parchment-200 bg-white/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="rounded-lg border border-slate-200 p-2 text-slate-700 hover:bg-parchment-100 lg:hidden"
            aria-label="Buka menu navigasi"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="flex items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-900 text-amber-300 shadow-sm">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-slate-900">
                  PustakaKita
                </span>
                <span className="hidden rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-emerald-900 sm:inline-block">
                  v2.0
                </span>
              </div>
              <p className="hidden text-[11px] text-slate-500 sm:block">
                Sistem Manajemen Pustaka &amp; Lab Algoritma
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {overdueCount > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('/sirkulasi')}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              title="Lihat peminjaman yang terlambat"
            >
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>{overdueCount} Terlambat</span>
            </button>
          )}

          <div className="hidden items-center gap-2 rounded-lg border border-parchment-200 bg-parchment-50 px-3 py-1.5 text-xs text-slate-600 md:flex">
            <Clock className="h-3.5 w-3.5 text-slate-500" />
            <span>{formattedDate}</span>
            <span className="text-slate-300">|</span>
            <span className="font-mono font-semibold text-slate-800">{formattedTime}</span>
          </div>

          <button
            type="button"
            onClick={onQuickBorrow}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-950 active:scale-[0.99]"
          >
            <PlusCircle className="h-4 w-4 text-amber-300" />
            <span>Pinjam Buku</span>
          </button>
        </div>
      </div>
    </header>
  );
}
