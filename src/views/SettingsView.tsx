import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  Download,
  FileJson,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { useLibrary } from '../context/LibraryContext';
import { useToast } from '../context/ToastContext';
import { BenchmarkScale } from '../types';
import { getTodayDateString } from '../utils/dateUtils';

const PRESETS: { count: BenchmarkScale; label: string; desc: string }[] = [
  { count: 1000, label: 'Muat 1.000 Buku (Default)', desc: 'Skala minimal standar' },
  { count: 5000, label: 'Muat 5.000 Buku', desc: 'Skala menengah' },
  { count: 10000, label: 'Muat 10.000 Buku', desc: 'Skala maksimal akademik' },
];

export function SettingsView() {
  const {
    books,
    loans,
    loadPresetDataset,
    exportBackupJson,
    importBackupJson,
    resetToFactoryData,
  } = useLibrary();
  const { addToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [rawJsonText, setRawJsonText] = useState('');
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const handleDownloadBackup = () => {
    const jsonString = exportBackupJson();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStamp = getTodayDateString().replace(/-/g, '');
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pustakakita_backup_${dateStamp}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
    addToast('Backup JSON berhasil diunduh.', 'success');
  };

  const processImport = (jsonString: string) => {
    const result = importBackupJson(jsonString);
    if (result.success) {
      setRestoreFeedback({ type: 'success', message: result.message });
      addToast(result.message, 'success');
    } else {
      setRestoreFeedback({ type: 'error', message: result.message });
      addToast(result.message, 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = typeof event.target?.result === 'string' ? event.target.result : '';
      setRawJsonText(text);
      processImport(text);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handlePresetSwitch = (count: BenchmarkScale) => {
    const res = loadPresetDataset(count);
    setRestoreFeedback(null);
    addToast(res.message, res.success ? 'success' : 'error');
  };

  const handleConfirmReset = () => {
    resetToFactoryData();
    setIsResetModalOpen(false);
    setRestoreFeedback(null);
    addToast(
      'Data berhasil dikembalikan ke 1.000 buku dan 3 transaksi bawaan.',
      'success',
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
          Portabilitas &amp; Manajemen Skala Data
        </p>
        <h1 className="mt-1 font-serif text-2xl font-bold text-slate-900">
          Pengaturan &amp; Backup Data
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          Ganti ukuran dataset katalog aktif (1.000 / 5.000 / 10.000), ekspor/impor
          backup JSON, atau pulihkan ke dataset bawaan.
        </p>
      </div>

      {/* Current State Snapshot */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">Koleksi Tersimpan</p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
            {books.length.toLocaleString('id-ID')} Judul Buku
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kunci penyimpanan: <code className="font-mono">pustakakita_books</code>
          </p>
        </div>

        <div className="rounded-xl border border-parchment-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-slate-500">
            Catatan Sirkulasi Tersimpan
          </p>
          <p className="mt-2 font-mono text-2xl font-bold text-slate-900">
            {loans.length} Transaksi
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Kunci penyimpanan: <code className="font-mono">pustakakita_loans</code>
          </p>
        </div>
      </div>

      {/* Quick Dataset Size Switcher */}
      <div className="rounded-xl border border-parchment-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-900">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-base font-bold text-slate-900">
              Ganti Ukuran Dataset Katalog Aktif
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Pembangkitan deterministik instan dengan ISBN-13 dan judul 100% unik untuk
              pengujian skala besar di Katalog &amp; Inventaris.
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.count}
              type="button"
              onClick={() => handlePresetSwitch(preset.count)}
              className={`flex flex-col items-start rounded-xl border p-4 text-left transition ${
                books.length === preset.count
                  ? 'border-emerald-900 bg-emerald-900 text-white shadow-sm'
                  : 'border-slate-200 bg-parchment-50 text-slate-800 hover:bg-parchment-100'
              }`}
            >
              <span className="text-xs font-bold">{preset.label}</span>
              <span
                className={`mt-1 text-[11px] ${
                  books.length === preset.count ? 'text-amber-300' : 'text-slate-500'
                }`}
              >
                {preset.desc}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Backup & Restore Grid */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Backup Card */}
        <div className="flex flex-col justify-between rounded-xl border border-parchment-200 bg-white p-6 shadow-sm">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
                <FileJson className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Ekspor Backup JSON
                </h2>
                <p className="text-xs text-slate-500">
                  Simpan salinan penuh state aplikasi ke komputer Anda.
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-600">
              File hasil ekspor bernama{' '}
              <code className="rounded bg-parchment-100 px-1.5 py-0.5 font-mono text-[11px]">
                pustakakita_backup_YYYYMMDD.json
              </code>{' '}
              memuat seluruh array <code className="font-mono">books</code> dan{' '}
              <code className="font-mono">loans</code> beserta metadata versi.
            </p>
          </div>

          <button
            type="button"
            onClick={handleDownloadBackup}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            <Download className="h-4 w-4 text-amber-300" />
            <span>Unduh JSON Backup</span>
          </button>
        </div>

        {/* Restore Card */}
        <div className="flex flex-col justify-between rounded-xl border border-parchment-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-indigo-50 p-2.5 text-indigo-700">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-serif text-base font-bold text-slate-900">
                  Restore Data dari JSON
                </h2>
                <p className="text-xs text-slate-500">
                  Unggah file backup JSON atau tempel konten JSON untuk validasi skema.
                </p>
              </div>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                className="hidden"
                aria-label="Unggah file backup JSON"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 bg-parchment-50 px-4 py-3 text-xs font-semibold text-slate-700 transition hover:border-slate-900 hover:bg-parchment-100"
              >
                <Upload className="h-4 w-4" />
                <span>Pilih File JSON Backup...</span>
              </button>
            </div>

            <div>
              <label
                htmlFor="restore-json-textarea"
                className="mb-1 block text-xs font-semibold text-slate-700"
              >
                Atau Tempel JSON Backup Secara Langsung
              </label>
              <textarea
                id="restore-json-textarea"
                rows={4}
                value={rawJsonText}
                onChange={(e) => setRawJsonText(e.target.value)}
                placeholder='{"version": "2.0.0", "books": [...], "loans": [...]}'
                className="w-full rounded-lg border border-slate-200 bg-parchment-50/50 p-2.5 font-mono text-[11px] text-slate-800 focus:border-emerald-900 focus:bg-white focus:outline-none"
              />
            </div>

            {restoreFeedback && (
              <div
                className={`flex items-start gap-2 rounded-lg border px-3 py-2.5 text-xs ${
                  restoreFeedback.type === 'success'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                    : 'border-rose-200 bg-rose-50 text-rose-800'
                }`}
              >
                {restoreFeedback.type === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                )}
                <span>{restoreFeedback.message}</span>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!rawJsonText.trim()}
            onClick={() => processImport(rawJsonText)}
            className={`mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition ${
              rawJsonText.trim()
                ? 'bg-indigo-700 text-white hover:bg-indigo-800'
                : 'cursor-not-allowed bg-slate-100 text-slate-400'
            }`}
          >
            <Upload className="h-4 w-4" />
            <span>Pulihkan State dari JSON</span>
          </button>
        </div>
      </div>

      {/* Factory Reset Zone */}
      <div className="rounded-xl border border-rose-200 bg-rose-50/60 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-serif text-base font-bold text-rose-950">
              Reset ke 1.000 Buku Bawaan (Factory Reset)
            </h2>
            <p className="mt-1 text-xs text-rose-800">
              Menghapus perubahan lokal dan memulihkan dataset awal (1.000 buku unik dan 3
              catatan sirkulasi awal).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-rose-300 bg-white px-4 py-2.5 text-xs font-semibold text-rose-700 shadow-sm hover:bg-rose-600 hover:text-white"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset ke Data Bawaan</span>
          </button>
        </div>
      </div>

      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Konfirmasi Factory Reset"
        subtitle="Seluruh data kustom di browser akan diganti dengan seed awal."
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="leading-relaxed">
              Apakah Anda yakin ingin mengembalikan seluruh koleksi buku (1.000 judul) dan
              sirkulasi (3 transaksi) ke kondisi bawaan pabrik? Disarankan untuk mengunduh
              backup JSON terlebih dahulu.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsResetModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-parchment-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirmReset}
              className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
            >
              Ya, Reset Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
