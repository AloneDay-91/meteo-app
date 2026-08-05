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

export interface SensorMetrics {
  temperature: number;
  humidity: number;
  pressure: number;
  gas_resistance: number;
}

export interface DailyHistoryPoint {
  date: string;
  sensor1: SensorMetrics;
  sensor2: SensorMetrics;
}

export type SensorHistory = DailyHistoryPoint[];

export interface Measurement {
  timestamp: string;
  sensor1: SensorMetrics;
  sensor2: SensorMetrics;
}

export type Measurements = Measurement[];
