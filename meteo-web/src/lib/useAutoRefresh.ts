import { useEffect, useState } from "react";

export function useAutoRefresh(intervalSeconds: number, refresh: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(intervalSeconds);

  useEffect(() => {
    const tick = setInterval(() => {
      setSecondsLeft((current) => {
        if (current <= 1) {
          refresh();
          return intervalSeconds;
        }
        return current - 1;
      });
    }, 1000);
    return () => clearInterval(tick);
  }, [intervalSeconds, refresh]);

  function refreshNow() {
    refresh();
    setSecondsLeft(intervalSeconds);
  }

  return { secondsLeft, refreshNow };
}
