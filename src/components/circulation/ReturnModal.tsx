import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RotateCcw } from 'lucide-react';
import { LoanRecord } from '../../types';
import {
  calculateDaysLate,
  calculateFine,
  getTodayDateString,
} from '../../utils/dateUtils';
import { formatDateIndo, formatRupiah } from '../../utils/formatters';
import { Modal } from '../common/Modal';

interface ReturnModalProps {
  loan: LoanRecord | null;
  onClose: () => void;
  onConfirmReturn: (loanId: string, returnDateStr: string) => void;
}

export function ReturnModal({ loan, onClose, onConfirmReturn }: ReturnModalProps) {
  const [returnDate, setReturnDate] = useState(() => getTodayDateString());

  useEffect(() => {
    if (loan) {
      setReturnDate(getTodayDateString());
    }
  }, [loan]);

  if (!loan) return null;

  const daysLate = calculateDaysLate(loan.tenggatKembali, returnDate);
  const fine = calculateFine(loan.tenggatKembali, returnDate);

  return (
    <Modal
      isOpen={Boolean(loan)}
      onClose={onClose}
      title="Konfirmasi Pengembalian Buku"
      subtitle={`Transaksi ${loan.id} · ISBN ${loan.isbnBuku}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-parchment-200 bg-parchment-50/70 p-4 text-xs">
          <p className="font-serif text-sm font-bold text-slate-900">{loan.judulBuku}</p>
          <div className="mt-2.5 grid grid-cols-2 gap-2 text-slate-600">
            <div>
              <span className="text-[11px] text-slate-400">Peminjam</span>
              <p className="font-semibold text-slate-800">{loan.namaPeminjam}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">NIM / ID</span>
              <p className="font-mono font-semibold text-slate-800">{loan.nimAnggota}</p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Tanggal Pinjam</span>
              <p className="font-mono text-slate-800">
                {formatDateIndo(loan.tanggalPinjam)}
              </p>
            </div>
            <div>
              <span className="text-[11px] text-slate-400">Tenggat Kembali</span>
              <p className="font-mono font-semibold text-slate-900">
                {formatDateIndo(loan.tenggatKembali)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="return-date-input"
            className="mb-1 block text-xs font-semibold text-slate-700"
          >
            Tanggal Dikembalikan
          </label>
          <input
            id="return-date-input"
            type="date"
            value={returnDate}
            onChange={(e) => setReturnDate(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs text-slate-900 focus:border-slate-900 focus:outline-none"
          />
        </div>

        {daysLate > 0 ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
              <div className="space-y-1 text-xs">
                <p className="font-bold text-rose-900">
                  Terlambat {daysLate} Hari dari Tenggat
                </p>
                <p className="text-rose-700">
                  Kalkulasi denda: {daysLate} hari &times; Rp 2.000/hari
                </p>
                <p className="font-mono text-base font-bold text-rose-700">
                  Total Denda: {formatRupiah(fine)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2.5 text-xs text-emerald-900">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <p className="font-bold">Tepat Waktu — Bebas Denda</p>
                <p className="text-emerald-700">
                  Total denda yang tercatat: <strong className="font-mono">Rp 0</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 border-t border-parchment-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReturn(loan.id, returnDate);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Konfirmasi Pengembalian</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
