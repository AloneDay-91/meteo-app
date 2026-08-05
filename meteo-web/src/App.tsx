import { useEffect, useState } from "react";
import { SensorCard } from "@/components/SensorCard";
import { getLatestReadings } from "@/lib/api";
import type { LatestReadings } from "@/types";

function App() {
  const [readings, setReadings] = useState<LatestReadings | null>(null);

  useEffect(() => {
    getLatestReadings().then(setReadings);
  }, []);

  return (
    <div className="min-h-screen bg-muted/40 p-10">
      <h1 className="text-2xl font-semibold text-center mb-8">
        🌡️ Tableau de Bord Environnemental
      </h1>
      {readings && (
        <div className="flex flex-wrap justify-center gap-5 max-w-4xl mx-auto">
          <SensorCard reading={readings.sensor1} />
          <SensorCard reading={readings.sensor2} />
        </div>
      )}
    </div>
  );
}

export default App;
