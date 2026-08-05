export function formatValue(value: number | "--", unit: string): string {
  return value === "--" ? "--" : `${value} ${unit}`;
}

const PARIS_TIME_ZONE = "Europe/Paris";

// SQLite's CURRENT_TIMESTAMP stores UTC as "YYYY-MM-DD HH:MM:SS" with no
// timezone marker. `new Date(...)` parses that exact format as local time,
// not UTC, so we append "Z" to force correct UTC parsing before converting
// to Paris time for display.
export function parseUtcTimestamp(timestamp: string): Date {
  return new Date(`${timestamp.replace(" ", "T")}Z`);
}

export function formatParisDate(timestamp: string): string {
  return parseUtcTimestamp(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: PARIS_TIME_ZONE,
  });
}

export function formatParisShortDate(timestamp: string): string {
  return parseUtcTimestamp(timestamp).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    timeZone: PARIS_TIME_ZONE,
  });
}

export function formatParisTime(timestamp: string): string {
  return parseUtcTimestamp(timestamp).toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: PARIS_TIME_ZONE,
  });
}
