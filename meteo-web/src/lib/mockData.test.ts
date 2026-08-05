import { describe, it, expect } from "vitest";
import { mockLatestReadings, mockTemperatureHistory } from "./mockData";

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

describe("mockTemperatureHistory", () => {
  it("covers about 90 days", () => {
    expect(mockTemperatureHistory.length).toBe(90);
  });

  it("ends today at the current mockLatestReadings temperature for each sensor", () => {
    const last = mockTemperatureHistory.at(-1);
    expect(last?.date).toBe(new Date().toISOString().slice(0, 10));
    expect(last?.sensor1).toBe(mockLatestReadings.sensor1.temperature);
    expect(last?.sensor2).toBe(mockLatestReadings.sensor2.temperature);
  });

  it("has chronologically ordered, unique dates", () => {
    const dates = mockTemperatureHistory.map((p) => p.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(dates.length);
  });
});
