# Meteo Web Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a modern Vite + React + TypeScript + Tailwind + shadcn/ui dashboard (`meteo-web/`) that displays the 2-sensor readings currently shown by the Flask app's server-rendered page, using mocked data locally, plus a new `GET /api/latest` JSON endpoint on the Flask server for future real integration.

**Architecture:** `meteo-serveur/app.py` gets a new `GET /api/latest` route (reusing the existing `evaluate_iaq` logic) that returns both sensors' latest readings as JSON, without changing the existing `/` and `/update` routes' behavior. A new sibling project `meteo-web/` (Vite + React + TS + Tailwind + shadcn/ui) renders two sensor cards. The frontend's data source is abstracted behind a single `getLatestReadings()` function backed by static mock data for now, so swapping in the real `/api/latest` call later is a one-file change.

**Tech Stack:** Python 3 / Flask (existing), pytest (backend tests), Vite, React, TypeScript, Tailwind CSS, shadcn/ui, Vitest (frontend logic tests).

## Global Constraints

- `meteo-serveur/` routes `/` and `/update` must keep their exact current behavior (spec: "Backend").
- `/api/latest` JSON shape is fixed as specified (spec: "Backend — GET /api/latest").
- Frontend lives in a new `meteo-web/` directory, independent from `meteo-serveur/` (spec: "Architecture").
- No Containerfile / deployment changes in this plan (spec: "Hors scope").
- No dark mode, no historical charts, no live-varying mock data in this plan (spec: "Hors scope").
- `api.ts` must be the only file that needs to change to switch from mock data to the real API later (spec: "Frontend — structure de fichiers").

---

### Task 1: Flask `GET /api/latest` endpoint

**Files:**
- Modify: `meteo-serveur/app.py`
- Create: `meteo-serveur/test_app.py`

**Interfaces:**
- Produces: `GET /api/latest` → JSON `{"sensor1": {...}, "sensor2": {...}}` per the shape below. Consumed later by `meteo-web/src/lib/api.ts` (Task 4), but not in this task.

Current `app.py` hardcodes `DB_PATH = '/app/db/meteo.db'`, which doesn't exist outside the container, making it untestable locally. This task makes the DB path configurable via an env var (defaulting to the current path, so production behavior is unchanged) and extracts the existing query + IAQ logic into a shared helper so `/` and the new `/api/latest` stay in sync.

- [ ] **Step 1: Write the failing tests**

Create `meteo-serveur/test_app.py`:

```python
import sqlite3

import pytest


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "meteo.db"
    monkeypatch.setenv("METEO_DB_PATH", str(db_path))

    import importlib
    import app as app_module
    importlib.reload(app_module)

    app_module.app.config["TESTING"] = True
    with app_module.app.test_client() as test_client:
        yield test_client, app_module


def test_api_latest_returns_placeholders_when_db_empty(client):
    test_client, _ = client
    response = test_client.get("/api/latest")
    assert response.status_code == 200
    data = response.get_json()
    assert data["sensor1"]["label"] == "Capteur Principal (0x77)"
    assert data["sensor1"]["temperature"] == "--"
    assert data["sensor1"]["iaq_text"] == "En attente..."
    assert data["sensor2"]["label"] == "Capteur Secondaire (0x76)"
    assert data["sensor2"]["temperature"] == "--"


def test_api_latest_returns_latest_measurement(client):
    test_client, app_module = client
    conn = sqlite3.connect(app_module.DB_PATH)
    c = conn.cursor()
    c.execute(
        """INSERT INTO mesures
           (temperature, humidity, pressure, gas_resistance,
            temp_2, humidity_2, pressure_2, gas_resistance_2)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
        (21.3, 45.2, 1013.1, 52.3, 20.9, 47.8, 1012.8, 38.1),
    )
    conn.commit()
    conn.close()

    response = test_client.get("/api/latest")
    data = response.get_json()
    assert data["sensor1"]["temperature"] == 21.3
    assert data["sensor1"]["gas_resistance"] == 52.3
    assert data["sensor1"]["iaq_text"] == "Excellente"
    assert data["sensor1"]["iaq_color"] == "#28a745"
    assert data["sensor2"]["temperature"] == 20.9
    assert data["sensor2"]["gas_resistance"] == 38.1
    assert data["sensor2"]["iaq_text"] == "Bonne"
    assert data["sensor2"]["iaq_color"] == "#17a2b8"
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd meteo-serveur && pytest test_app.py -v`
Expected: FAIL (`/api/latest` doesn't exist yet → 404, or `METEO_DB_PATH` not respected)

- [ ] **Step 3: Make `DB_PATH` configurable and extract the shared readings helper**

In `meteo-serveur/app.py`, replace:

```python
import sqlite3
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)
DB_PATH = '/app/db/meteo.db'
```

with:

```python
import os
import sqlite3
from flask import Flask, request, jsonify, render_template_string

app = Flask(__name__)
DB_PATH = os.environ.get('METEO_DB_PATH', '/app/db/meteo.db')
```

Then, after the `evaluate_iaq` function definition, add a shared helper:

```python
def get_latest_readings():
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute('''SELECT temperature, humidity, pressure, gas_resistance,
                        temp_2, humidity_2, pressure_2, gas_resistance_2
                 FROM mesures ORDER BY timestamp DESC LIMIT 1''')
    row = c.fetchone()
    conn.close()

    if row:
        d = {
            "temperature": row[0], "humidity": row[1], "pressure": row[2], "gas_resistance": row[3],
            "temp_2": row[4], "humidity_2": row[5], "pressure_2": row[6], "gas_resistance_2": row[7]
        }
    else:
        d = {k: "--" for k in ["temperature", "humidity", "pressure", "gas_resistance",
                               "temp_2", "humidity_2", "pressure_2", "gas_resistance_2"]}

    iaq_text_1, iaq_color_1 = evaluate_iaq(d["gas_resistance"])
    iaq_text_2, iaq_color_2 = evaluate_iaq(d["gas_resistance_2"])
    return d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2
```

Replace the body of `index()` (the query + IAQ block, before `html_template = """`) with a call to the helper:

```python
@app.route('/')
def index():
    d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2 = get_latest_readings()

    html_template = """
    ...
```

(Keep everything else in `index()` — the `html_template` string and the `render_template_string(...)` call — exactly as-is.)

- [ ] **Step 4: Add the `/api/latest` route**

Add this route anywhere after `get_latest_readings` is defined (e.g. right before `@app.route('/')`):

```python
@app.route('/api/latest')
def api_latest():
    d, iaq_text_1, iaq_color_1, iaq_text_2, iaq_color_2 = get_latest_readings()
    return jsonify({
        "sensor1": {
            "label": "Capteur Principal (0x77)",
            "temperature": d["temperature"],
            "humidity": d["humidity"],
            "pressure": d["pressure"],
            "gas_resistance": d["gas_resistance"],
            "iaq_text": iaq_text_1,
            "iaq_color": iaq_color_1,
        },
        "sensor2": {
            "label": "Capteur Secondaire (0x76)",
            "temperature": d["temp_2"],
            "humidity": d["humidity_2"],
            "pressure": d["pressure_2"],
            "gas_resistance": d["gas_resistance_2"],
            "iaq_text": iaq_text_2,
            "iaq_color": iaq_color_2,
        }
    })
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `cd meteo-serveur && pytest test_app.py -v`
Expected: PASS (2 passed)

- [ ] **Step 6: Commit**

```bash
git add meteo-serveur/app.py meteo-serveur/test_app.py
git commit -m "feat(meteo-serveur): add GET /api/latest JSON endpoint"
```

(If the directory isn't a git repo yet, skip this step and tell the user — do not run `git init` without asking.)

---

### Task 2: Scaffold `meteo-web/` (Vite + React + TS + Tailwind + shadcn/ui)

**Files:**
- Create: `meteo-web/` (full Vite project scaffold)

**Interfaces:**
- Produces: a working Vite dev server at `meteo-web/`, with Tailwind CSS and shadcn/ui configured, ready for `Card`/`Badge` components to be added in Task 5.

- [ ] **Step 1: Scaffold the Vite React+TS project**

Run from `meteo-app/`:

```bash
npm create vite@latest meteo-web -- --template react-ts
cd meteo-web
npm install
```

- [ ] **Step 2: Verify the default Vite app runs**

```bash
npm run dev -- --port 5173 &
sleep 2
curl -s http://localhost:5173 | grep -o '<title>[^<]*</title>'
kill %1
```

Expected: prints `<title>Vite + React + TS</title>` (or similar default title), confirming the dev server serves the app.

- [ ] **Step 3: Add Tailwind CSS and shadcn/ui**

Use the `vercel:shadcn` skill for the current, correct CLI commands and config for this Vite project (Tailwind plugin setup, `tsconfig` path aliases, `npx shadcn@latest init`). Target: Tailwind CSS working, `@/*` import alias resolving to `src/*`, and shadcn/ui initialized with defaults (neutral base color, no CSS variables changes beyond shadcn's defaults).

After init, add the two components this plan needs:

```bash
npx shadcn@latest add card badge
```

- [ ] **Step 4: Verify Tailwind + shadcn are wired correctly**

Temporarily replace the contents of `src/App.tsx` with:

```tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function App() {
  return (
    <div className="p-8">
      <Card className="max-w-sm">
        <CardHeader>
          <CardTitle>Shadcn check</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge>OK</Badge>
        </CardContent>
      </Card>
    </div>
  );
}

export default App;
```

Run:

```bash
npm run dev -- --port 5173 &
sleep 2
curl -s http://localhost:5173/src/App.tsx | grep -o 'Shadcn check'
kill %1
```

Expected: prints `Shadcn check`, and no build errors in the dev server output (check via `npm run build` once, expect exit code 0). This confirms imports from `@/components/ui/*` resolve and Tailwind classes are being processed.

- [ ] **Step 5: Commit**

```bash
git add meteo-web
git commit -m "feat(meteo-web): scaffold Vite + React + TS + Tailwind + shadcn/ui project"
```

---

### Task 3: Types and mock data

**Files:**
- Create: `meteo-web/src/types.ts`
- Create: `meteo-web/src/lib/mockData.ts`
- Test: `meteo-web/src/lib/mockData.test.ts`
- Modify: `meteo-web/package.json` (add `vitest`)

**Interfaces:**
- Consumes: nothing (pure data/types).
- Produces: `SensorReading` and `LatestReadings` types, and `mockLatestReadings: LatestReadings` constant, both consumed by `api.ts` (Task 4).

- [ ] **Step 1: Add Vitest**

```bash
cd meteo-web
npm install -D vitest
```

Add a `test` script to `meteo-web/package.json` scripts block: `"test": "vitest run"`.

- [ ] **Step 2: Define the shared types**

Create `meteo-web/src/types.ts`:

```typescript
export interface SensorReading {
  label: string;
  temperature: number | "--";
  humidity: number | "--";
  pressure: number | "--";
  gas_resistance: number | "--";
  iaq_text: string;
  iaq_color: string;
}

export interface LatestReadings {
  sensor1: SensorReading;
  sensor2: SensorReading;
}
```

- [ ] **Step 3: Write the failing test for mock data shape**

Create `meteo-web/src/lib/mockData.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { mockLatestReadings } from "./mockData";

describe("mockLatestReadings", () => {
  it("has realistic numeric values for both sensors", () => {
    expect(typeof mockLatestReadings.sensor1.temperature).toBe("number");
    expect(typeof mockLatestReadings.sensor2.temperature).toBe("number");
    expect(mockLatestReadings.sensor1.temperature).toBeGreaterThan(-10);
    expect(mockLatestReadings.sensor1.temperature).toBeLessThan(50);
  });

  it("has the expected sensor labels", () => {
    expect(mockLatestReadings.sensor1.label).toBe("Capteur Principal (0x77)");
    expect(mockLatestReadings.sensor2.label).toBe("Capteur Secondaire (0x76)");
  });

  it("has valid hex colors for IAQ badges", () => {
    expect(mockLatestReadings.sensor1.iaq_color).toMatch(/^#[0-9a-fA-F]{6}$/);
    expect(mockLatestReadings.sensor2.iaq_color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });
});
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd meteo-web && npx vitest run src/lib/mockData.test.ts`
Expected: FAIL (`mockData.ts` doesn't exist)

- [ ] **Step 5: Create the mock data**

Create `meteo-web/src/lib/mockData.ts`:

```typescript
import type { LatestReadings } from "../types";

export const mockLatestReadings: LatestReadings = {
  sensor1: {
    label: "Capteur Principal (0x77)",
    temperature: 21.3,
    humidity: 45.2,
    pressure: 1013.1,
    gas_resistance: 52.3,
    iaq_text: "Excellente",
    iaq_color: "#28a745",
  },
  sensor2: {
    label: "Capteur Secondaire (0x76)",
    temperature: 20.9,
    humidity: 47.8,
    pressure: 1012.8,
    gas_resistance: 38.1,
    iaq_text: "Bonne",
    iaq_color: "#17a2b8",
  },
};
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd meteo-web && npx vitest run src/lib/mockData.test.ts`
Expected: PASS (3 passed)

- [ ] **Step 7: Commit**

```bash
git add meteo-web/src/types.ts meteo-web/src/lib/mockData.ts meteo-web/src/lib/mockData.test.ts meteo-web/package.json meteo-web/package-lock.json
git commit -m "feat(meteo-web): add shared types and mock sensor data"
```

---

### Task 4: `getLatestReadings()` data-access function

**Files:**
- Create: `meteo-web/src/lib/api.ts`
- Test: `meteo-web/src/lib/api.test.ts`

**Interfaces:**
- Consumes: `LatestReadings` type and `mockLatestReadings` from `./mockData` (Task 3).
- Produces: `getLatestReadings(): Promise<LatestReadings>`, consumed by `App.tsx` (Task 6).

- [ ] **Step 1: Write the failing test**

Create `meteo-web/src/lib/api.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getLatestReadings } from "./api";
import { mockLatestReadings } from "./mockData";

describe("getLatestReadings", () => {
  it("resolves with the mock readings", async () => {
    const result = await getLatestReadings();
    expect(result).toEqual(mockLatestReadings);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd meteo-web && npx vitest run src/lib/api.test.ts`
Expected: FAIL (`api.ts` doesn't exist)

- [ ] **Step 3: Implement `getLatestReadings()`**

Create `meteo-web/src/lib/api.ts`:

```typescript
import type { LatestReadings } from "../types";
import { mockLatestReadings } from "./mockData";

// Mocked locally — no real sensors reachable in dev yet.
// To switch to the real backend once available, replace the body below with:
//   const response = await fetch("/api/latest");
//   return response.json();
export async function getLatestReadings(): Promise<LatestReadings> {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return mockLatestReadings;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd meteo-web && npx vitest run src/lib/api.test.ts`
Expected: PASS (1 passed)

- [ ] **Step 5: Commit**

```bash
git add meteo-web/src/lib/api.ts meteo-web/src/lib/api.test.ts
git commit -m "feat(meteo-web): add getLatestReadings data-access function"
```

---

### Task 5: `SensorCard` component

**Files:**
- Create: `meteo-web/src/components/SensorCard.tsx`

**Interfaces:**
- Consumes: `SensorReading` type from `../types` (Task 3), `Card`/`CardHeader`/`CardTitle`/`CardContent` from `../components/ui/card` and `Badge` from `../components/ui/badge` (Task 2).
- Produces: `SensorCard` React component with props `{ reading: SensorReading }`, consumed by `App.tsx` (Task 6).

No automated test for this task — it's a presentational component; correctness is verified visually in Task 6 once it's wired into `App.tsx` and viewed in the browser.

- [ ] **Step 1: Implement the component**

Create `meteo-web/src/components/SensorCard.tsx`:

```tsx
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
```

- [ ] **Step 2: Type-check**

Run: `cd meteo-web && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add meteo-web/src/components/SensorCard.tsx
git commit -m "feat(meteo-web): add SensorCard component"
```

---

### Task 6: Wire up `App.tsx` and verify in the browser

**Files:**
- Modify: `meteo-web/src/App.tsx`
- Modify: `meteo-web/src/App.css` (remove/simplify default Vite starter styles that would conflict with Tailwind layout)

**Interfaces:**
- Consumes: `getLatestReadings` from `@/lib/api` (Task 4), `SensorCard` from `@/components/SensorCard` (Task 5).
- Produces: the finished dashboard page — no further tasks depend on this one.

- [ ] **Step 1: Implement `App.tsx`**

Replace `meteo-web/src/App.tsx` with:

```tsx
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
```

- [ ] **Step 2: Clear the default Vite starter CSS**

Empty out `meteo-web/src/App.css` (replace its contents with nothing, or delete the file and remove its `import "./App.css"` line from `App.tsx` if present) — the default Vite starter styles (centered logo, spinning animation) conflict with the Tailwind layout above.

- [ ] **Step 3: Type-check and run all frontend tests**

```bash
cd meteo-web
npx tsc --noEmit
npx vitest run
```

Expected: no type errors, all tests pass (4 tests total from Tasks 3–4).

- [ ] **Step 4: Manually verify in the browser**

```bash
npm run dev -- --port 5173 &
sleep 2
curl -s http://localhost:5173/src/App.tsx | grep -o 'Tableau de Bord Environnemental'
```

Then use the `run` skill (or open `http://localhost:5173` directly) to visually confirm: page title, two cards side by side, each showing température/humidité/pression, a colored IAQ badge ("Excellente" green / "Bonne" blue), and the raw gas resistance value — matching the mock data from Task 3. Stop the dev server (`kill %1`) once confirmed.

- [ ] **Step 5: Commit**

```bash
git add meteo-web/src/App.tsx meteo-web/src/App.css
git commit -m "feat(meteo-web): wire up dashboard with mocked sensor readings"
```
