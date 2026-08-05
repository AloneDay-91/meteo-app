import type { LatestReadings } from "../types";
import { mockLatestReadings } from "./mockData";

// Mocked locally — no real sensors reachable in dev yet.
// To switch to the real backend once available, replace the body below with:
//   const response = await fetch("/api/latest");
//   return response.json();
export async function getLatestReadings(): Promise<LatestReadings> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockLatestReadings;
}
