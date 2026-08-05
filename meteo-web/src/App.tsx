import { useCallback, useEffect, useState } from "react";
import { Thermometer, WifiOff } from "lucide-react";
import { AutoRefreshControl } from "@/components/AutoRefreshControl";
import { SensorCard } from "@/components/SensorCard";
import { TemperatureHistoryChart } from "@/components/TemperatureHistoryChart";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getLatestReadings, getMeasurements } from "@/lib/api";
import type { LatestReadings, Measurements } from "@/types";

const REFRESH_INTERVAL_SECONDS = 600;

function App() {
  const [readings, setReadings] = useState<LatestReadings | null>(null);
  const [measurements, setMeasurements] = useState<Measurements | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(() => {
    getLatestReadings()
      .then(setReadings)
      .catch(() => setError("Impossible de charger les données des capteurs."));
    getMeasurements()
      .then(setMeasurements)
      .catch(() => setError("Impossible de charger les mesures des capteurs."));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
        <AutoRefreshControl intervalSeconds={REFRESH_INTERVAL_SECONDS} onRefresh={loadData} />
      </header>

      {error && (
        <Alert className="mx-auto mb-6 max-w-4xl">
          <WifiOff />
          <AlertTitle>Connexion impossible</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!error && readings && measurements && (
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <div className="flex flex-wrap justify-center gap-6">
            <SensorCard
              reading={readings.sensor1}
              history={measurements.map((m) => ({ timestamp: m.timestamp, ...m.sensor1 }))}
            />
            <SensorCard
              reading={readings.sensor2}
              history={measurements.map((m) => ({ timestamp: m.timestamp, ...m.sensor2 }))}
            />
          </div>
          <TemperatureHistoryChart measurements={measurements} />
        </div>
      )}
    </div>
  );
}

export default App;
