/**
 * Date helpers for the admin. Dates are "YYYY-MM-DD" strings in AD everywhere; BS is
 * only for display and input. All arithmetic is done in UTC so the browser's own
 * timezone never shifts a date. "Today" is today in Asia/Kathmandu.
 *
 * nepali-date-converter supports BS 2000/01/01 – 2090/12/30
 * (AD 1943-04-14 – 2034-04-13). Outside that range BS helpers return null and the UI
 * falls back to AD only.
 */
import NepaliDate, { dateConfigMap } from 'nepali-date-converter';
interface BsDate {year:number;month:number;day:number;monthName:string;}

export const TZ = 'Asia/Kathmandu';
export const BS_MONTHS = [
  'Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Asoj',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra',
];
export const AD_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const WEEKDAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const BS_MIN_AD = '1943-04-14';
export const BS_MAX_AD = '2034-04-13';
export const BS_MIN_YEAR = 2000;
export const BS_MAX_YEAR = 2090;

const DAY = 86_400_000;

export function todayKtm(): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export function toUtc(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function fromUtc(ms: number) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(iso: string, n: number) {
  return fromUtc(toUtc(iso) + n * DAY);
}

export function diffDays(a: string, b: string) {
  return Math.round((toUtc(a) - toUtc(b)) / DAY);
}

export function weekday(iso: string) {
  return new Date(toUtc(iso)).getUTCDay();
}

/** The Sunday–Saturday week containing `iso` (same week layout as the calendar). */
export function weekRange(iso: string) {
  const from = addDays(iso, -weekday(iso));
  return { from, to: addDays(from, 6) };
}

export function isoFromParts(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function adMonthLength(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

export function adToBs(iso: string): BsDate | null {
  if (!iso || iso < BS_MIN_AD || iso > BS_MAX_AD) return null;
  const [y, m, d] = iso.split('-').map(Number);
  try {
    const nd = NepaliDate.fromAD(new Date(y, m - 1, d));
    const month = nd.getMonth() + 1;
    return { year: nd.getYear(), month, day: nd.getDate(), monthName: BS_MONTHS[month - 1] };
  } catch {
    return null;
  }
}

export function bsMonthLength(year: number, month: number): number | null {
  const data = (dateConfigMap as Record<string, Record<string, number>>)[String(year)];
  if (!data) return null;
  return Object.values(data)[month - 1] ?? null;
}

export function bsToAd(year: number, month: number, day: number): string | null {
  const len = bsMonthLength(year, month);
  if (!len || day < 1 || day > len) return null;
  try {
    const js = new NepaliDate(year, month - 1, day).toJsDate();
    return isoFromParts(js.getFullYear(), js.getMonth() + 1, js.getDate());
  } catch {
    return null;
  }
}

export function formatBs(iso: string, withYear = true) {
  const bs = adToBs(iso);
  if (!bs) return null;
  return withYear ? `${bs.day} ${bs.monthName} ${bs.year}` : `${bs.day} ${bs.monthName}`;
}

export function formatAd(iso: string, opts: { weekday?: boolean; year?: boolean } = {}) {
  const { weekday: wd = false, year = true } = opts;
  const [y, m, d] = iso.split('-').map(Number);
  const s = `${d} ${AD_MONTHS[m - 1].slice(0, 3)}${year ? ` ${y}` : ''}`;
  return wd ? `${WEEKDAYS_SHORT[weekday(iso)]}, ${s}` : s;
}

/** "Tue, 29 Sep 2026 · 13 Asoj 2083" */
export function formatDual(iso: string) {
  const bs = formatBs(iso);
  return `${formatAd(iso, { weekday: true })}${bs ? ` · ${bs}` : ''}`;
}

