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
  it("ends at the current mockLatestReadings temperature for each sensor", () => {
    const sensor1Last = mockTemperatureHistory.sensor1.at(-1);
    const sensor2Last = mockTemperatureHistory.sensor2.at(-1);
    expect(sensor1Last?.temperature).toBe(mockLatestReadings.sensor1.temperature);
    expect(sensor2Last?.temperature).toBe(mockLatestReadings.sensor2.temperature);
  });
});
