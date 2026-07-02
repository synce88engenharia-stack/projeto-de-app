import { describe, it, expect } from "vitest";
import { toDayKey, parseDayKey, formatDayKey, formatDateBR } from "./date";

describe("toDayKey", () => {
  it("normaliza para meia-noite UTC independente do horário de entrada", () => {
    const d1 = toDayKey(new Date("2026-07-15T23:59:59.000Z"));
    const d2 = toDayKey(new Date("2026-07-15T00:00:00.000Z"));
    expect(d1.getTime()).toBe(d2.getTime());
    expect(d1.getUTCHours()).toBe(0);
  });

  it("aceita string ISO", () => {
    const d = toDayKey("2026-01-01T10:30:00.000Z");
    expect(formatDayKey(d)).toBe("2026-01-01");
  });
});

describe("parseDayKey / formatDayKey round-trip", () => {
  it("mantém o mesmo dia independente do timezone local do processo", () => {
    const cases = ["2026-01-01", "2026-02-28", "2028-02-29", "2026-12-31", "2026-07-15", "2026-07-16"];
    for (const iso of cases) {
      const date = parseDayKey(iso);
      expect(formatDayKey(date)).toBe(iso);
    }
  });
});

describe("formatDateBR", () => {
  it("formata como dd/mm/aaaa", () => {
    expect(formatDateBR(parseDayKey("2026-07-02"))).toBe("02/07/2026");
    expect(formatDateBR(parseDayKey("2026-12-31"))).toBe("31/12/2026");
  });
});
