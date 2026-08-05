import { describe, it, expect } from "vitest";
import { getLatestReadings, getSensorHistory } from "./api";
import { mockLatestReadings, mockSensorHistory } from "./mockData";

describe("getLatestReadings", () => {
  it("resolves with the mock readings", async () => {
    const result = await getLatestReadings();
    expect(result).toEqual(mockLatestReadings);
  });
});

describe("getSensorHistory", () => {
  it("resolves with the mock sensor history", async () => {
    const result = await getSensorHistory();
    expect(result).toEqual(mockSensorHistory);
  });
});
