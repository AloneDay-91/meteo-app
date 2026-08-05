import type { LatestReadings, SensorHistory, SensorMetrics, SensorReading } from "../types";

export const mockLatestReadings: LatestReadings = {
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

// Deterministic PRNG (mulberry32) so the generated mock history below is
// stable across runs/tests instead of changing on every page load.
function mulberry32(seed: number) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function requireNumber(value: number | "--"): number {
  if (value === "--") {
    throw new Error("mockLatestReadings must have numeric values");
  }
  return value;
}

function requireMetrics(reading: SensorReading): SensorMetrics {
  return {
    temperature: requireNumber(reading.temperature),
    humidity: requireNumber(reading.humidity),
    pressure: requireNumber(reading.pressure),
    gas_resistance: requireNumber(reading.gas_resistance),
  };
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

interface SeriesConfig {
  base: number;
  seasonalAmplitude: number;
  walkStep: number;
  decimals: number;
}

const METRIC_CONFIG: Record<keyof SensorMetrics, SeriesConfig> = {
  temperature: { base: 15, seasonalAmplitude: 4, walkStep: 1.2, decimals: 1 },
  humidity: { base: 55, seasonalAmplitude: -10, walkStep: 2.5, decimals: 1 },
  pressure: { base: 1010, seasonalAmplitude: 3, walkStep: 1.5, decimals: 1 },
  gas_resistance: { base: 30, seasonalAmplitude: 8, walkStep: 4, decimals: 1 },
};

// Smooth seasonal drift plus a small day-to-day random walk, so the series
// looks like real weather, then ramped over the last two weeks toward
// `target` so it ends exactly at the current mockLatestReadings value
// without a jarring one-day spike.
function generateSeries(days: number, random: () => number, config: SeriesConfig, target: number): number[] {
  const values: number[] = [];
  let walk = random() * 3;

  for (let i = days - 1; i >= 0; i--) {
    const seasonal = Math.sin(((days - i) / days) * Math.PI) * config.seasonalAmplitude;
    walk += (random() - 0.5) * config.walkStep;
    values.push(round(config.base + seasonal + walk * 0.1, config.decimals));
  }

  const rampDays = Math.min(14, values.length);
  const startIndex = values.length - rampDays;
  const offset = target - values[values.length - 1];
  for (let i = startIndex; i < values.length; i++) {
    const blend = (i - startIndex + 1) / rampDays;
    values[i] = round(values[i] + offset * blend, config.decimals);
  }
  values[values.length - 1] = target;

  return values;
}

function generateSensorSeries(days: number, random: () => number, target: SensorMetrics): SensorMetrics[] {
  const temperature = generateSeries(days, random, METRIC_CONFIG.temperature, target.temperature);
  const humidity = generateSeries(days, random, METRIC_CONFIG.humidity, target.humidity);
  const pressure = generateSeries(days, random, METRIC_CONFIG.pressure, target.pressure);
  const gasResistance = generateSeries(days, random, METRIC_CONFIG.gas_resistance, target.gas_resistance);

  return Array.from({ length: days }, (_, i) => ({
    temperature: temperature[i],
    humidity: humidity[i],
    pressure: pressure[i],
    gas_resistance: gasResistance[i],
  }));
}

function generateDailyHistory(days: number): SensorHistory {
  const random = mulberry32(42);
  const today = new Date();

  const sensor1Series = generateSensorSeries(days, random, requireMetrics(mockLatestReadings.sensor1));
  const sensor2Series = generateSensorSeries(days, random, requireMetrics(mockLatestReadings.sensor2));

  const points: SensorHistory = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const index = days - 1 - i;
    points.push({
      date: date.toISOString().slice(0, 10),
      sensor1: sensor1Series[index],
      sensor2: sensor2Series[index],
    });
  }

  return points;
}

// ~90 days of daily mock history (all metrics per sensor), ending today at
// the current mockLatestReadings values.
export const mockSensorHistory: SensorHistory = generateDailyHistory(90);
