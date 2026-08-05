import { describe, it, expect } from "vitest";
import { getLatestReadings, getTemperatureHistory } from "./api";
import { mockLatestReadings, mockTemperatureHistory } from "./mockData";

describe("getLatestReadings", () => {
  it("resolves with the mock readings", async () => {
    const result = await getLatestReadings();
    expect(result).toEqual(mockLatestReadings);
  });
});

describe("getTemperatureHistory", () => {
  it("resolves with the mock temperature history", async () => {
    const result = await getTemperatureHistory();
    expect(result).toEqual(mockTemperatureHistory);
  });
});
