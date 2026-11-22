import { useEffect, useMemo, useState } from 'react';
import { BorrowFormModal } from './components/circulation/BorrowFormModal';
import { ReturnModal } from './components/circulation/ReturnModal';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Book, LoanInput, LoanRecord, ViewRoute } from './types';
import { getTodayDateString, isLoanOverdue } from './utils/dateUtils';
import { BenchmarkView } from './views/BenchmarkView';
import { CatalogView } from './views/CatalogView';
import { CirculationView } from './views/CirculationView';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';
import { SettingsView } from './views/SettingsView';

const VALID_ROUTES: ViewRoute[] = [
  '/',
  '/katalog',
  '/inventaris',
  '/sirkulasi',
  '/benchmark',
  '/pengaturan',
];

function getRouteFromHash(): ViewRoute {
  if (typeof window === 'undefined') return '/';
  const raw = window.location.hash.replace(/^#/, '') as ViewRoute;
  return VALID_ROUTES.includes(raw) ? raw : '/';
}

function AppShell() {
  const { books, loans, borrowBook, returnBook } = useLibrary();
  const { addToast } = useToast();

  const [currentRoute, setCurrentRoute] = useState<ViewRoute>(() => getRouteFromHash());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [preselectedBorrowBook, setPreselectedBorrowBook] = useState<Book | null>(null);
  const [returningLoan, setReturningLoan] = useState<LoanRecord | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (route: ViewRoute) => {
    setCurrentRoute(route);
    if (typeof window !== 'undefined') {
      window.location.hash = route === '/' ? '' : `#${route}`;
    }
  };

  const today = getTodayDateString();
  const activeLoansCount = useMemo(
    () => loans.filter((l) => l.status === 'Dipinjam').length,
    [loans],
  );
  const overdueCount = useMemo(
    () => loans.filter((l) => isLoanOverdue(l, today)).length,
    [loans, today],
  );

  const handleOpenBorrow = (book: Book | null = null) => {
    setPreselectedBorrowBook(book);
    setBorrowModalOpen(true);
  };

  const handleBorrowSubmit = (input: LoanInput) => {
    const result = borrowBook(input);
    addToast(result.message, result.success ? 'success' : 'error');
    return result;
  };

  const handleConfirmReturn = (loanId: string, returnDateStr: string) => {
    const result = returnBook(loanId, returnDateStr);
    addToast(result.message, result.success ? 'success' : 'error');
  };

  return (
    <div className="min-h-screen bg-parchment-50 text-slate-900">
      <Navbar
        overdueCount={overdueCount}
        onQuickBorrow={() => handleOpenBorrow(null)}
        onNavigate={navigate}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={navigate}
          totalBooks={books.length}
          activeLoansCount={activeLoansCount}
          overdueCount={overdueCount}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {currentRoute === '/' && (
            <DashboardView
              onNavigate={navigate}
              onQuickBorrow={() => handleOpenBorrow(null)}
              onRequestReturn={setReturningLoan}
            />
          )}
          {currentRoute === '/katalog' && (
            <CatalogView onBorrowBook={(book) => handleOpenBorrow(book)} />
          )}
          {currentRoute === '/inventaris' && <InventoryView />}
          {currentRoute === '/sirkulasi' && (
            <CirculationView
              onOpenBorrowModal={() => handleOpenBorrow(null)}
              onRequestReturn={setReturningLoan}
            />
          )}
          {currentRoute === '/benchmark' && <BenchmarkView />}
          {currentRoute === '/pengaturan' && <SettingsView />}
        </main>
      </div>

      <BorrowFormModal
        isOpen={borrowModalOpen}
        books={books}
        preselectedBook={preselectedBorrowBook}
        onClose={() => {
          setBorrowModalOpen(false);
          setPreselectedBorrowBook(null);
        }}
        onSubmit={handleBorrowSubmit}
      />

      <ReturnModal
        loan={returningLoan}
        onClose={() => setReturningLoan(null)}
        onConfirmReturn={handleConfirmReturn}
      />

      <ToastContainer />
    </div>
  );
}

export function App() {
  return (
    <ToastProvider>
      <LibraryProvider>
        <AppShell />
      </LibraryProvider>
    </ToastProvider>
  );
}

export default App;
