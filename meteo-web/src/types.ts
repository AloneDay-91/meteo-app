export interface SensorReading {
  label: string;
  temperature: number | "--";
  humidity: number | "--";
  pressure: number | "--";
  gas_resistance: number | "--";
  iaq_text: string;
  iaq_color: string;
}

export interface LatestReadings {
  sensor1: SensorReading;
  sensor2: SensorReading;
}

export interface TemperatureHistoryPoint {
  date: string;
  sensor1: number;
  sensor2: number;
}

export type TemperatureHistory = TemperatureHistoryPoint[];
