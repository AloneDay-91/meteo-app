import { afterEach, describe, expect, it, vi } from "vitest";
import { getLatestReadings, getMeasurements, getSensorHistory } from "./api";
import type { LatestReadings, Measurements, SensorHistory } from "../types";

const sampleReadings: LatestReadings = {
  sensor1: {
    label: "Capteur Principal (0x77)",
    temperature: 21.3,
    humidity: 45.2,
    pressure: 1013.1,
    gas_resistance: 52.3,
    iaq_text: "Excellente",
    iaq_color: "#28a745",
  },
  sensor2: {
    label: "Capteur Secondaire (0x76)",
    temperature: 20.9,
    humidity: 47.8,
    pressure: 1012.8,
    gas_resistance: 38.1,
    iaq_text: "Bonne",
    iaq_color: "#17a2b8",
  },
};

const sampleHistory: SensorHistory = [
  {
    date: "2026-08-05",
    sensor1: { temperature: 21.3, humidity: 45.2, pressure: 1013.1, gas_resistance: 52.3 },
    sensor2: { temperature: 20.9, humidity: 47.8, pressure: 1012.8, gas_resistance: 38.1 },
  },
];

function mockFetchOnce(body: unknown, ok = true) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => Promise.resolve(body),
    })
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getLatestReadings", () => {
  it("fetches /api/latest and returns the parsed JSON", async () => {
    mockFetchOnce(sampleReadings);
    const result = await getLatestReadings();
    expect(result).toEqual(sampleReadings);
    expect(fetch).toHaveBeenCalledWith("/api/latest");
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({}, false);
    await expect(getLatestReadings()).rejects.toThrow("GET /api/latest failed: 500");
  });
});

describe("getSensorHistory", () => {
  it("fetches /api/history and returns the parsed JSON", async () => {
    mockFetchOnce(sampleHistory);
    const result = await getSensorHistory();
    expect(result).toEqual(sampleHistory);
    expect(fetch).toHaveBeenCalledWith("/api/history");
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({}, false);
    await expect(getSensorHistory()).rejects.toThrow("GET /api/history failed: 500");
  });
});

const sampleMeasurements: Measurements = [
  {
    timestamp: "2026-08-05 12:00:00",
    sensor1: { temperature: 21.3, humidity: 45.2, pressure: 1013.1, gas_resistance: 52.3 },
    sensor2: { temperature: 20.9, humidity: 47.8, pressure: 1012.8, gas_resistance: 38.1 },
  },
];

describe("getMeasurements", () => {
  it("fetches /api/measures and returns the parsed JSON", async () => {
    mockFetchOnce(sampleMeasurements);
    const result = await getMeasurements();
    expect(result).toEqual(sampleMeasurements);
    expect(fetch).toHaveBeenCalledWith("/api/measures");
  });

  it("throws when the response is not ok", async () => {
    mockFetchOnce({}, false);
    await expect(getMeasurements()).rejects.toThrow("GET /api/measures failed: 500");
  });
});
