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

// 12h of hourly mock history, ending at the current mockLatestReadings values.
export const mockTemperatureHistory: TemperatureHistory = {
  sensor1: [
    { time: "08:00", temperature: 19.1 },
    { time: "09:00", temperature: 19.6 },
    { time: "10:00", temperature: 20.2 },
    { time: "11:00", temperature: 20.8 },
    { time: "12:00", temperature: 21.4 },
    { time: "13:00", temperature: 21.9 },
    { time: "14:00", temperature: 22.1 },
    { time: "15:00", temperature: 21.8 },
    { time: "16:00", temperature: 21.6 },
    { time: "17:00", temperature: 21.5 },
    { time: "18:00", temperature: 21.4 },
    { time: "19:00", temperature: 21.3 },
  ],
  sensor2: [
    { time: "08:00", temperature: 18.7 },
    { time: "09:00", temperature: 19.2 },
    { time: "10:00", temperature: 19.8 },
    { time: "11:00", temperature: 20.3 },
    { time: "12:00", temperature: 20.9 },
    { time: "13:00", temperature: 21.3 },
    { time: "14:00", temperature: 21.5 },
    { time: "15:00", temperature: 21.4 },
    { time: "16:00", temperature: 21.2 },
    { time: "17:00", temperature: 21.1 },
    { time: "18:00", temperature: 21.0 },
    { time: "19:00", temperature: 20.9 },
  ],
};
