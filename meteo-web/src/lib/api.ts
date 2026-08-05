import type { LatestReadings, TemperatureHistory } from "../types";
import { mockLatestReadings, mockTemperatureHistory } from "./mockData";

// Mocked locally — no real sensors reachable in dev yet.
// To switch to the real backend once available, replace the body below with:
//   const response = await fetch("/api/latest");
//   return response.json();
export async function getLatestReadings(): Promise<LatestReadings> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockLatestReadings;
}

// Mocked locally — there is no backend endpoint for historical readings yet.
export async function getTemperatureHistory(): Promise<TemperatureHistory> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockTemperatureHistory;
}
