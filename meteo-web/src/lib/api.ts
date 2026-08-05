import type { LatestReadings, SensorHistory } from "../types";

export async function getLatestReadings(): Promise<LatestReadings> {
  const response = await fetch("/api/latest");
  if (!response.ok) {
    throw new Error(`GET /api/latest failed: ${response.status}`);
  }
  return response.json();
}

export async function getSensorHistory(): Promise<SensorHistory> {
  const response = await fetch("/api/history");
  if (!response.ok) {
    throw new Error(`GET /api/history failed: ${response.status}`);
  }
  return response.json();
}
