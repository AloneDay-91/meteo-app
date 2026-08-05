import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TemperatureHistory } from "@/types";

const chartConfig = {
  sensor1: {
    label: "Capteur Principal",
    color: "var(--primary)",
  },
  sensor2: {
    label: "Capteur Secondaire",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const RANGE_DAYS = { "7d": 7, "30d": 30, "90d": 90 } as const;
type RangeKey = keyof typeof RANGE_DAYS;

export function TemperatureHistoryChart({ history }: { history: TemperatureHistory }) {
  const [range, setRange] = React.useState<RangeKey>("90d");

  const filteredData = history.slice(-RANGE_DAYS[range]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Historique des températures</CardTitle>
        <CardDescription>Comparaison des 2 capteurs</CardDescription>
        <CardAction>
          <Select value={range} onValueChange={(value) => setRange(value as RangeKey)}>
            <SelectTrigger className="w-40" aria-label="Choisir une période">
              <SelectValue placeholder="3 derniers mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="90d">3 derniers mois</SelectItem>
              <SelectItem value="30d">30 derniers jours</SelectItem>
              <SelectItem value="7d">7 derniers jours</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[250px] w-full">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="fillSensor1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sensor1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sensor1)" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="fillSensor2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-sensor2)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-sensor2)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <YAxis domain={["dataMin - 1", "dataMax + 1"]} hide />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value: string) =>
                new Date(value).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
              }
            />
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  labelFormatter={(value) =>
                    new Date(String(value)).toLocaleDateString("fr-FR", { month: "short", day: "numeric" })
                  }
                  indicator="dot"
                />
              }
            />
            <Area
              dataKey="sensor2"
              type="natural"
              fill="url(#fillSensor2)"
              stroke="var(--color-sensor2)"
            />
            <Area
              dataKey="sensor1"
              type="natural"
              fill="url(#fillSensor1)"
              stroke="var(--color-sensor1)"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
