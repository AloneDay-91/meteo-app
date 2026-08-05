import { describe, it, expect } from "vitest";
import { mockLatestReadings, mockSensorHistory } from "./mockData";

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

describe("mockSensorHistory", () => {
  it("covers about 90 days", () => {
    expect(mockSensorHistory.length).toBe(90);
  });

  it("ends today at the current mockLatestReadings values for each sensor", () => {
    const last = mockSensorHistory.at(-1);
    expect(last?.date).toBe(new Date().toISOString().slice(0, 10));
    expect(last?.sensor1).toEqual({
      temperature: mockLatestReadings.sensor1.temperature,
      humidity: mockLatestReadings.sensor1.humidity,
      pressure: mockLatestReadings.sensor1.pressure,
      gas_resistance: mockLatestReadings.sensor1.gas_resistance,
    });
    expect(last?.sensor2).toEqual({
      temperature: mockLatestReadings.sensor2.temperature,
      humidity: mockLatestReadings.sensor2.humidity,
      pressure: mockLatestReadings.sensor2.pressure,
      gas_resistance: mockLatestReadings.sensor2.gas_resistance,
    });
  });

  it("has chronologically ordered, unique dates", () => {
    const dates = mockSensorHistory.map((p) => p.date);
    const sorted = [...dates].sort();
    expect(dates).toEqual(sorted);
    expect(new Set(dates).size).toBe(dates.length);
  });
});
