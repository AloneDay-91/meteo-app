export function formatValue(value: number | "--", unit: string): string {
  return value === "--" ? "--" : `${value} ${unit}`;
}
