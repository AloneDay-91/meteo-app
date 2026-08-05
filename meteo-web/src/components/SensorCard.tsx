import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/types";

function formatValue(value: number | "--", unit: string): string {
  return value === "--" ? "--" : `${value} ${unit}`;
}

export function SensorCard({ reading }: { reading: SensorReading }) {
  return (
    <Card className="flex-1 min-w-[280px] text-left">
      <CardHeader>
        <CardTitle>{reading.label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>🌡️ Température : <strong>{formatValue(reading.temperature, "°C")}</strong></p>
        <p>💧 Humidité : <strong>{formatValue(reading.humidity, "%")}</strong></p>
        <p>⏱️ Pression : <strong>{formatValue(reading.pressure, "hPa")}</strong></p>
        <hr className="border-t border-border" />
        <p className="flex items-center gap-2">
          🌬️ Qualité de l'air :
          <Badge style={{ backgroundColor: reading.iaq_color }} className="text-white">
            {reading.iaq_text}
          </Badge>
        </p>
        <p className="text-sm text-muted-foreground">
          Valeur brute : {formatValue(reading.gas_resistance, "kOhms")}
        </p>
      </CardContent>
    </Card>
  );
}
