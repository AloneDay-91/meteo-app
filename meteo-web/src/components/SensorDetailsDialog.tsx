import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/DataTable";
import { formatParisDate, formatParisTime } from "@/lib/format";
import type { SensorMetrics, SensorReading } from "@/types";

export interface SensorHistoryRow extends SensorMetrics {
  timestamp: string;
}

const columns: ColumnDef<SensorHistoryRow>[] = [
  {
    id: "date",
    accessorKey: "timestamp",
    header: "Date",
    cell: ({ row }) => formatParisDate(row.original.timestamp),
    filterFn: (row, _columnId, filterValue: string) =>
      formatParisDate(row.original.timestamp).toLowerCase().includes(filterValue.toLowerCase()),
  },
  {
    id: "time",
    header: "Heure",
    cell: ({ row }) => formatParisTime(row.original.timestamp),
  },
  {
    accessorKey: "temperature",
    header: "Température",
    cell: ({ row }) => `${row.original.temperature} °C`,
  },
  {
    accessorKey: "humidity",
    header: "Humidité",
    cell: ({ row }) => `${row.original.humidity} %`,
  },
  {
    accessorKey: "pressure",
    header: "Pression",
    cell: ({ row }) => `${row.original.pressure} hPa`,
  },
  {
    accessorKey: "gas_resistance",
    header: "Résistance gaz",
    cell: ({ row }) => `${row.original.gas_resistance} kOhms`,
  },
];

export function SensorDetailsDialog({
  reading,
  history,
}: {
  reading: SensorReading;
  history: SensorHistoryRow[];
}) {
  const rows = [...history].reverse();

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="secondary" size="lg" />}>Voir les détails</DialogTrigger>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{reading.label}</DialogTitle>
          <DialogDescription>Historique complet des données de ce capteur.</DialogDescription>
        </DialogHeader>
        <DataTable columns={columns} data={rows} filterColumn="date" filterPlaceholder="Filtrer par date (ex. août)…" />
      </DialogContent>
    </Dialog>
  );
}
