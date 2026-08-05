import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AutoRefreshControl({
  intervalSeconds,
  onRefresh,
}: {
  intervalSeconds: number;
  onRefresh: () => void;
}) {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          onRefresh();
          return intervalSeconds;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalSeconds, onRefresh]);

  function refreshNow() {
    onRefresh();
    setSecondsLeft(intervalSeconds);
  }

  const minutesLeft = Math.floor(secondsLeft / 60);
  const remainderSeconds = secondsLeft % 60;

  return (
    <div className="mt-4 flex items-center justify-center gap-3">
      <Button variant="outline" size="sm" onClick={refreshNow}>
        <RefreshCw className="size-4" strokeWidth={1.75} />
        Actualiser
      </Button>
      <span className="text-xs text-muted-foreground tabular-nums">
        Prochaine actualisation dans {minutesLeft}:{remainderSeconds.toString().padStart(2, "0")}
      </span>
    </div>
  );
}
