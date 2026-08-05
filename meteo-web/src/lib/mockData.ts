import type { LatestReadings } from "../types";

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
