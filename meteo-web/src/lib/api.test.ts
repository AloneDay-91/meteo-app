import { describe, it, expect } from "vitest";
import { getLatestReadings } from "./api";
import { mockLatestReadings } from "./mockData";

describe("getLatestReadings", () => {
  it("resolves with the mock readings", async () => {
    const result = await getLatestReadings();
    expect(result).toEqual(mockLatestReadings);
  });
});
