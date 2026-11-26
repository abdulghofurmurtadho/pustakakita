import { useEffect, useState } from 'react';
import { BorrowFormModal } from './components/circulation/BorrowFormModal';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { LibraryProvider, useLibrary } from './context/LibraryContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { Book, LoanInput, ViewRoute } from './types';
import { DashboardView } from './views/DashboardView';
import { InventoryView } from './views/InventoryView';

function getRouteFromHash(): ViewRoute {
  if (typeof window === 'undefined') return '/';
  const raw = window.location.hash.replace(/^#/, '') as ViewRoute;
  if (raw === '/inventaris' || raw === '/katalog' || raw === '/benchmark') {
    return '/inventaris';
  }
  return '/';
}

function AppShell() {
  const { books, borrowBook } = useLibrary();
  const { addToast } = useToast();

  const [currentRoute, setCurrentRoute] = useState<ViewRoute>(() => getRouteFromHash());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [borrowModalOpen, setBorrowModalOpen] = useState(false);
  const [preselectedBorrowBook, setPreselectedBorrowBook] = useState<Book | null>(null);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (route: ViewRoute) => {
    const normalized: ViewRoute = route === '/' ? '/' : '/inventaris';
    setCurrentRoute(normalized);
    if (typeof window !== 'undefined') {
      window.location.hash = `#${normalized}`;
    }
  };

  const handleOpenBorrow = (book: Book | null = null) => {
    setPreselectedBorrowBook(book);
    setBorrowModalOpen(true);
  };

  const handleBorrowSubmit = (input: LoanInput) => {
    const result = borrowBook(input);
    addToast(result.message, result.success ? 'success' : 'error');
    return result;
  };

  const isInventoryRoute =
    currentRoute === '/inventaris' ||
    currentRoute === '/katalog' ||
    currentRoute === '/benchmark';

  return (
    <div className="min-h-screen bg-parchment-50 text-slate-900">
      <Navbar
        totalBooks={books.length}
        currentRoute={currentRoute}
        onNavigate={navigate}
        onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
      />

      <div className="mx-auto flex max-w-[1600px]">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={navigate}
          totalBooks={books.length}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {currentRoute === '/' && <DashboardView onNavigate={navigate} />}
          {isInventoryRoute && (
            <InventoryView onBorrowBook={(book) => handleOpenBorrow(book)} />
          )}
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
