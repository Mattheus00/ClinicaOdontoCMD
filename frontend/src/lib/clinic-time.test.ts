import { describe, expect, it } from "vitest";
import { clinicDate, clinicDateTime, clinicTime } from "./clinic-time";
describe("clinic time independent of device time zone", () => {
  it("converts UTC across midnight into the clinic date", () => {
    expect(clinicDate("2026-11-08T01:30:00Z")).toBe("2026-11-07");
    expect(clinicTime("2026-11-08T01:30:00Z")).toBe("22:30");
  });
  it("preserves legacy wall times and offset times", () => {
    expect(clinicDateTime("2026-11-07T09:30:00")).toBe("2026-11-07T09:30");
    expect(clinicDateTime("2026-11-07T09:30:00-03:00")).toBe(
      "2026-11-07T09:30",
    );
  });
});
