const MONTHS_ID = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Formats a numeric Rupiah value, e.g. 10000 -> "Rp 10.000".
 */
export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? Math.max(0, Math.round(amount)) : 0;
  const formatted = safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}

/**
 * Formats a YYYY-MM-DD date string to Indonesian readable format, e.g. "22 Nov 2026".
 */
export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = parts[0];
  const monthIdx = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  const monthName = MONTHS_ID[monthIdx] ?? parts[1];
  return `${day} ${monthName} ${year}`;
}

/**
 * Strips hyphens and spaces from an ISBN string to obtain numeric/X characters.
 */
export function normalizeIsbnDigits(isbn: string): string {
  return isbn.replace(/[^0-9Xx]/g, '').toUpperCase();
}

/**
 * Auto-formats raw ISBN input into clean dashed ISBN-13 / ISBN-10 style while typing.
 */
export function formatIsbnInput(raw: string): string {
  const cleaned = raw.replace(/[^0-9Xx]/g, '').toUpperCase();
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.startsWith('978') || cleaned.startsWith('979')) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 13)}`;
  }
  return cleaned.slice(0, 13);
}

export type DynamicCriterionKey =
  | 'judul'
  | 'isbn'
  | 'penulis'
  | 'tahunTerbit'
  | 'kodeRak';

export interface CriterionInputConfig {
  label: string;
  placeholder: string;
  inputMode: 'text' | 'numeric';
  helperHint: string;
  sanitize: (raw: string) => string;
}

/**
 * Returns dynamic input placeholder, inputMode, and character validation/sanitizer
 * for the selected criterion (Judul Buku, ISBN, Penulis, Tahun Terbit, Lokasi Rak).
 */
export function getCriterionInputConfig(field: string): CriterionInputConfig {
  switch (field) {
    case 'isbn':
      return {
        label: 'Kode ISBN',
        placeholder: 'Ketik kode ISBN (contoh: 978-602-...)...',
        inputMode: 'text',
        helperHint: 'Hanya menerima angka (0-9) dan tanda hubung (-)',
        sanitize: (raw: string) => raw.replace(/[^0-9-]/g, ''),
      };
    case 'penulis':
      return {
        label: 'Nama Penulis',
        placeholder: 'Ketik nama penulis...',
        inputMode: 'text',
        helperHint: 'Ketik nama atau sebagian nama penulis buku',
        sanitize: (raw: string) => raw,
      };
    case 'tahunTerbit':
      return {
        label: 'Tahun Terbit (4 Digit)',
        placeholder: 'Ketik tahun terbit (contoh: 2024)...',
        inputMode: 'numeric',
        helperHint: 'Hanya menerima angka tahun hingga 4 digit',
        sanitize: (raw: string) => raw.replace(/[^0-9]/g, '').slice(0, 4),
      };
    case 'kodeRak':
      return {
        label: 'Lokasi Rak',
        placeholder: 'Ketik lokasi rak, misal: Rak A1, Teknologi...',
        inputMode: 'text',
        helperHint: 'Ketik kode atau kategori rak fisik (contoh: Rak A1, Pertanian)',
        sanitize: (raw: string) => raw,
      };
    case 'judul':
    default:
      return {
        label: 'Judul Buku',
        placeholder: 'Ketik judul buku yang dicari (contoh: Geometri, Geografi)...',
        inputMode: 'text',
        helperHint: 'Ketik kata kunci judul buku yang ingin diproses',
        sanitize: (raw: string) => raw,
      };
  }
}
