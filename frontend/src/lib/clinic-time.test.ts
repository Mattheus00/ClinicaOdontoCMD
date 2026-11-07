import { describe, expect, it } from "vitest";
import {
  clinicDate,
  clinicTime,
  clinicInstant,
  clinicDateTime,
} from "./clinic-time";
describe("Horários da clínica", () => {
  it("mantém a data de Brasília na virada UTC e interpreta o contrato sem offset", () => {
    expect(clinicDate("2026-11-01T01:30:00Z")).toBe("2026-10-31");
    expect(clinicTime("2026-11-01T01:30:00Z")).toBe("22:30");
    expect(clinicInstant("2026-10-31T09:00:00").toISOString()).toBe(
      "2026-10-31T12:00:00.000Z",
    );
  });
  it("mostra o mesmo horário para um instante UTC e sua representação na clínica", () => {
    expect(clinicDateTime("2026-10-31T12:00:00Z")).toBe(
      clinicDateTime("2026-10-31T09:00:00-03:00"),
    );
  });
});
