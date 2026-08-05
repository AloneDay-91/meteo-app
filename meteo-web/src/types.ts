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

export interface TemperaturePoint {
  time: string;
  temperature: number;
}

export interface TemperatureHistory {
  sensor1: TemperaturePoint[];
  sensor2: TemperaturePoint[];
}
