import { CheckCircle2, RotateCcw } from 'lucide-react';
import { LoanRecord } from '../../types';
import {
  calculateDaysLate,
  getEffectiveLoanFine,
  getTodayDateString,
  isLoanOverdue,
} from '../../utils/dateUtils';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';
import { Badge } from '../common/Badge';

interface LoanTableProps {
  loans: LoanRecord[];
  mode: 'active' | 'history';
  onRequestReturn?: (loan: LoanRecord) => void;
}

export function LoanTable({ loans, mode, onRequestReturn }: LoanTableProps) {
  const today = getTodayDateString();

  if (loans.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-parchment-300 bg-white px-6 py-12 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-slate-300" />
        <p className="mt-2 font-serif text-sm font-semibold text-slate-800">
          {mode === 'active'
            ? 'Tidak ada peminjaman aktif saat ini'
            : 'Belum ada riwayat pengembalian'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-parchment-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-parchment-200 bg-parchment-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3">ID &amp; Buku</th>
              <th className="px-4 py-3">Peminjam</th>
              <th className="px-4 py-3">Tanggal Pinjam</th>
              <th className="px-4 py-3">Tenggat Kembali</th>
              {mode === 'history' && <th className="px-4 py-3">Dikembalikan</th>}
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Denda</th>
              {mode === 'active' && <th className="px-4 py-3 text-right">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-parchment-100">
            {loans.map((loan) => {
              const overdue = isLoanOverdue(loan, today);
              const daysLate =
                loan.status === 'Dipinjam'
                  ? calculateDaysLate(loan.tenggatKembali, today)
                  : calculateDaysLate(
                      loan.tenggatKembali,
                      loan.tanggalDikembalikan || loan.tenggatKembali,
                    );
              const fine = getEffectiveLoanFine(loan, today);

              return (
                <tr key={loan.id} className="transition hover:bg-parchment-50/60">
                  <td className="px-4 py-3">
                    <p className="font-mono text-[11px] font-semibold text-slate-400">
                      {loan.id} · {loan.isbnBuku}
                    </p>
                    <p className="font-serif font-semibold text-slate-900">
                      {loan.judulBuku}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-slate-900">
                      {loan.namaPeminjam}
                    </p>
                    <p className="font-mono text-[11px] text-slate-500">
                      NIM {loan.nimAnggota}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {formatDateIndo(loan.tanggalPinjam)}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-800">
                    {formatDateIndo(loan.tenggatKembali)}
                  </td>
                  {mode === 'history' && (
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">
                      {loan.tanggalDikembalikan
                        ? formatDateIndo(loan.tanggalDikembalikan)
                        : '-'}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {loan.status === 'Dikembalikan' ? (
                      <Badge variant="emerald">Dikembalikan</Badge>
                    ) : overdue ? (
                      <Badge variant="rose">Terlambat {daysLate} hr</Badge>
                    ) : (
                      <Badge variant="amber">Dipinjam</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold">
                    <span className={fine > 0 ? 'text-rose-600' : 'text-slate-500'}>
                      {formatRupiah(fine)}
                    </span>
                  </td>
                  {mode === 'active' && (
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRequestReturn?.(loan)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-slate-800"
                      >
                        <RotateCcw className="h-3.5 w-3.5 text-amber-300" />
                        <span>Kembalikan Buku</span>
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
