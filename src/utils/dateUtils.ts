import { LoanRecord } from '../types';

export const DAILY_FINE_RATE = 2000;
export const LOAN_DURATION_DAYS = 7;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseYmdUtc(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number);
  return Date.UTC(year, (month || 1) - 1, day || 1);
}

/**
 * Returns today's local date in YYYY-MM-DD format.
 */
export function getTodayDateString(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Adds a specified number of calendar days to a YYYY-MM-DD date string.
 */
export function addDays(dateStr: string, days: number): string {
  const utcMs = parseYmdUtc(dateStr) + days * MS_PER_DAY;
  const result = new Date(utcMs);
  const year = result.getUTCFullYear();
  const month = String(result.getUTCMonth() + 1).padStart(2, '0');
  const day = String(result.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates whole days late between tenggatKembali and referenceDateStr.
 */
export function calculateDaysLate(tenggatKembali: string, referenceDateStr: string): number {
  const dueUtc = parseYmdUtc(tenggatKembali);
  const refUtc = parseYmdUtc(referenceDateStr);
  const diffDays = Math.floor((refUtc - dueUtc) / MS_PER_DAY);
  return Math.max(0, diffDays);
}

/**
 * Calculates overdue fine: max(0, (returnOrToday - dueDate)_days) * 2000.
 */
export function calculateFine(tenggatKembali: string, referenceDateStr: string): number {
  return calculateDaysLate(tenggatKembali, referenceDateStr) * DAILY_FINE_RATE;
}

/**
 * Checks whether an active loan is overdue as of referenceDateStr (defaults to today).
 */
export function isLoanOverdue(
  loan: LoanRecord,
  referenceDateStr: string = getTodayDateString(),
): boolean {
  if (loan.status === 'Dikembalikan') {
    return false;
  }
  return calculateDaysLate(loan.tenggatKembali, referenceDateStr) > 0;
}

/**
 * Computes the effective fine of a loan:
 * - For returned loans, returns the locked `loan.denda` recorded at return time.
 * - For active loans, computes live overdue fine against referenceDateStr.
 */
export function getEffectiveLoanFine(
  loan: LoanRecord,
  referenceDateStr: string = getTodayDateString(),
): number {
  if (loan.status === 'Dikembalikan') {
    return loan.denda;
  }
  return calculateFine(loan.tenggatKembali, referenceDateStr);
}
