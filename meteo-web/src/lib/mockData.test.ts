import { describe, it, expect } from "vitest";
import { mockLatestReadings } from "./mockData";

describe("mockLatestReadings", () => {
  it("has realistic numeric values for both sensors", () => {
    expect(typeof mockLatestReadings.sensor1.temperature).toBe("number");
    expect(typeof mockLatestReadings.sensor2.temperature).toBe("number");
    expect(mockLatestReadings.sensor1.temperature).toBeGreaterThan(-10);
    expect(mockLatestReadings.sensor1.temperature).toBeLessThan(50);
  });

  it("has the expected sensor labels", () => {
    expect(mockLatestReadings.sensor1.label).toBe("Capteur Principal (0x77)");
    expect(mockLatestReadings.sensor2.label).toBe("Capteur Secondaire (0x76)");
  });

  it("has valid hex colors for IAQ badges", () => {
    expect(mockLatestReadings.sensor1.iaq_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(mockLatestReadings.sensor2.iaq_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
