import { describe, it, expect } from "vitest";
import { getQuinzenaId, getQuinzenaRange, listQuinzenasForMonth, isDateInQuinzena } from "./quinzena";
import { parseDayKey, formatDayKey } from "./date";

describe("getQuinzenaId", () => {
  it("dia 1 e dia 15 caem em Q1", () => {
    expect(getQuinzenaId(parseDayKey("2026-07-01"))).toBe("2026-07-Q1");
    expect(getQuinzenaId(parseDayKey("2026-07-15"))).toBe("2026-07-Q1");
  });

  it("dia 16 e último dia do mês caem em Q2", () => {
    expect(getQuinzenaId(parseDayKey("2026-07-16"))).toBe("2026-07-Q2");
    expect(getQuinzenaId(parseDayKey("2026-07-31"))).toBe("2026-07-Q2");
  });

  it("funciona para meses de 28, 29 e 30 dias", () => {
    expect(getQuinzenaId(parseDayKey("2026-02-28"))).toBe("2026-02-Q2"); // 2026 não é bissexto
    expect(getQuinzenaId(parseDayKey("2028-02-29"))).toBe("2028-02-Q2"); // 2028 é bissexto
    expect(getQuinzenaId(parseDayKey("2026-04-30"))).toBe("2026-04-Q2");
  });

  it("virada de ano", () => {
    expect(getQuinzenaId(parseDayKey("2026-12-31"))).toBe("2026-12-Q2");
    expect(getQuinzenaId(parseDayKey("2027-01-01"))).toBe("2027-01-Q1");
  });
});

describe("getQuinzenaRange", () => {
  it("Q1 vai do dia 1 ao dia 15", () => {
    const { start, end } = getQuinzenaRange("2026-07-Q1");
    expect(formatDayKey(start)).toBe("2026-07-01");
    expect(formatDayKey(end)).toBe("2026-07-15");
  });

  it("Q2 vai do dia 16 até o último dia do mês, incluindo fevereiro bissexto", () => {
    expect(formatDayKey(getQuinzenaRange("2026-07-Q2").end)).toBe("2026-07-31");
    expect(formatDayKey(getQuinzenaRange("2026-02-Q2").end)).toBe("2026-02-28");
    expect(formatDayKey(getQuinzenaRange("2028-02-Q2").end)).toBe("2028-02-29");
    expect(formatDayKey(getQuinzenaRange("2026-04-Q2").end)).toBe("2026-04-30");
  });

  it("lança erro para id inválido", () => {
    expect(() => getQuinzenaRange("2026-07-Q3")).toThrow();
    expect(() => getQuinzenaRange("not-a-quinzena")).toThrow();
  });
});

describe("listQuinzenasForMonth", () => {
  it("retorna os dois ids do mês", () => {
    expect(listQuinzenasForMonth(2026, 7)).toEqual(["2026-07-Q1", "2026-07-Q2"]);
    expect(listQuinzenasForMonth(2026, 1)).toEqual(["2026-01-Q1", "2026-01-Q2"]);
  });
});

describe("isDateInQuinzena", () => {
  it("identifica corretamente dentro e fora do período", () => {
    expect(isDateInQuinzena(parseDayKey("2026-07-05"), "2026-07-Q1")).toBe(true);
    expect(isDateInQuinzena(parseDayKey("2026-07-20"), "2026-07-Q1")).toBe(false);
    expect(isDateInQuinzena(parseDayKey("2026-07-20"), "2026-07-Q2")).toBe(true);
  });
});
