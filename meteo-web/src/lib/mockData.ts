import type { LatestReadings, TemperatureHistory } from "../types";

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
    throw new Error("mockLatestReadings must have numeric temperature values");
  }
  return value;
}

function generateDailyHistory(days: number): TemperatureHistory {
  const random = mulberry32(42);
  const points: TemperatureHistory = [];
  const today = new Date();

  let sensor1 = 15 + random() * 3;
  let sensor2 = sensor1 - 0.5;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    // Smooth seasonal drift (warmer toward the middle of the window) plus a
    // small day-to-day random walk, so the chart looks like real weather.
    const seasonal = Math.sin(((days - i) / days) * Math.PI) * 4;
    sensor1 += (random() - 0.5) * 1.2;
    sensor2 += (random() - 0.5) * 1.2;

    points.push({
      date: date.toISOString().slice(0, 10),
      sensor1: Math.round((15 + seasonal + sensor1 * 0.1) * 10) / 10,
      sensor2: Math.round((14.5 + seasonal + sensor2 * 0.1) * 10) / 10,
    });
  }

  // Smoothly ramp the last two weeks toward the current mockLatestReadings
  // values, so the chart's endpoint matches the sensor cards above it
  // without a jarring one-day spike.
  const rampDays = Math.min(14, points.length);
  const targetSensor1 = requireNumber(mockLatestReadings.sensor1.temperature);
  const targetSensor2 = requireNumber(mockLatestReadings.sensor2.temperature);
  const startIndex = points.length - rampDays;
  const offsetSensor1 = targetSensor1 - points[points.length - 1].sensor1;
  const offsetSensor2 = targetSensor2 - points[points.length - 1].sensor2;

  for (let i = startIndex; i < points.length; i++) {
    const blend = (i - startIndex + 1) / rampDays;
    points[i] = {
      date: points[i].date,
      sensor1: Math.round((points[i].sensor1 + offsetSensor1 * blend) * 10) / 10,
      sensor2: Math.round((points[i].sensor2 + offsetSensor2 * blend) * 10) / 10,
    };
  }
  points[points.length - 1] = {
    date: points[points.length - 1].date,
    sensor1: targetSensor1,
    sensor2: targetSensor2,
  };

  return points;
}

// ~90 days of daily mock history, ending today at the current
// mockLatestReadings values.
export const mockTemperatureHistory: TemperatureHistory = generateDailyHistory(90);
