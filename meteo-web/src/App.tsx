import { useEffect, useState } from "react";
import { Thermometer } from "lucide-react";
import { SensorCard } from "@/components/SensorCard";
import { getLatestReadings, getTemperatureHistory } from "@/lib/api";
import type { LatestReadings, TemperatureHistory } from "@/types";

function App() {
  const [readings, setReadings] = useState<LatestReadings | null>(null);
  const [history, setHistory] = useState<TemperatureHistory | null>(null);

  useEffect(() => {
    getLatestReadings().then(setReadings);
    getTemperatureHistory().then(setHistory);
  }, []);

  return (
    <div className="min-h-screen bg-muted/30 px-6 py-14">
      <header className="mx-auto mb-10 max-w-4xl text-center">
        <div className="mb-3 inline-flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Thermometer className="size-6" strokeWidth={1.75} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Tableau de Bord Environnemental
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Suivi en temps réel des capteurs BME680
        </p>
      </header>

      {readings && history && (
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-6">
          <SensorCard reading={readings.sensor1} history={history.sensor1} />
          <SensorCard reading={readings.sensor2} history={history.sensor2} />
        </div>
      )}
    </div>
  );
}

export default App;
