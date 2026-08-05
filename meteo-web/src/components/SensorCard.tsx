import { Thermometer, Droplets, Gauge, Wind } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorReading } from "@/types";

function formatValue(value: number | "--", unit: string): string {
  return value === "--" ? "--" : `${value}${unit}`;
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Thermometer;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 rounded-lg bg-muted/50 py-4 text-center">
      <Icon className="size-5 text-muted-foreground" strokeWidth={1.75} />
      <span className="text-lg font-semibold tabular-nums">{value}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

export function SensorCard({ reading }: { reading: SensorReading }) {
  return (
    <Card className="flex-1 min-w-75 text-left transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-lg">{reading.label}</CardTitle>
            <CardDescription>Capteur environnemental BME680</CardDescription>
          </div>
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: reading.iaq_color }}
            aria-hidden="true"
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Stat icon={Thermometer} label="Température" value={formatValue(reading.temperature, "°C")} />
          <Stat icon={Droplets} label="Humidité" value={formatValue(reading.humidity, "%")} />
          <Stat icon={Gauge} label="Pression" value={formatValue(reading.pressure, "hPa")} />
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <Wind className="size-4" strokeWidth={1.75} />
            Qualité de l'air
          </span>
          <Badge style={{ backgroundColor: reading.iaq_color }} className="text-white">
            {reading.iaq_text}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Valeur brute : {formatValue(reading.gas_resistance, " kOhms")}
        </p>
      </CardContent>
    </Card>
  );
}
