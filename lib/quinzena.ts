import { toDayKey } from "./date";

export type QuinzenaRange = { start: Date; end: Date };

const QUINZENA_ID_RE = /^(\d{4})-(\d{2})-Q([12])$/;

export function getQuinzenaId(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const half = date.getUTCDate() <= 15 ? "1" : "2";
  return `${year}-${month}-Q${half}`;
}

export function getQuinzenaRange(quinzenaId: string): QuinzenaRange {
  const match = QUINZENA_ID_RE.exec(quinzenaId);
  if (!match) {
    throw new Error(`quinzenaId inválido: ${quinzenaId}`);
  }
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const half = match[3];

  if (half === "1") {
    return {
      start: new Date(Date.UTC(year, monthIndex, 1)),
      end: new Date(Date.UTC(year, monthIndex, 15)),
    };
  }

  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return {
    start: new Date(Date.UTC(year, monthIndex, 16)),
    end: new Date(Date.UTC(year, monthIndex, lastDay)),
  };
}

export function listQuinzenasForMonth(year: number, month: number): string[] {
  const mm = String(month).padStart(2, "0");
  return [`${year}-${mm}-Q1`, `${year}-${mm}-Q2`];
}

export function isDateInQuinzena(date: Date, quinzenaId: string): boolean {
  const { start, end } = getQuinzenaRange(quinzenaId);
  const key = toDayKey(date).getTime();
  return key >= start.getTime() && key <= end.getTime();
}
