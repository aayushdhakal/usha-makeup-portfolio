declare module "bikram-sambat" {
  export function toBik(date: string): { year: number; month: number; day: number };
  export function toGreg_text(year: number, month: number, day: number): string;
  export function daysInMonth(year: number, month: number): number;
}
