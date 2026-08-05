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
import type { SensorMetrics, SensorReading } from "@/types";

export interface SensorHistoryRow extends SensorMetrics {
  date: string;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const columns: ColumnDef<SensorHistoryRow>[] = [
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => formatDate(row.original.date),
    filterFn: (row, _columnId, filterValue: string) =>
      formatDate(row.original.date).toLowerCase().includes(filterValue.toLowerCase()),
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
      <DialogTrigger render={<Button variant="secondary" size="sm" />}>Voir les détails</DialogTrigger>
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
