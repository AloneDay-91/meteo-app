# Meteo Web Frontend — Design

## Contexte

`meteo-serveur/` est une petite app Flask + SQLite qui reçoit des mesures de 2
capteurs BME680 (température, humidité, pression, résistance gaz) via
`POST /update`, et affiche la dernière mesure sur une page HTML rendue
côté serveur (`GET /`).

Objectif : ajouter une interface web moderne (Vite + React + TypeScript +
Tailwind + shadcn/ui) tout en gardant le côté minimaliste de l'app actuelle.
Pas d'accès aux capteurs réels pour le développement local : les données
sont mockées pour que l'UI soit testable avec des valeurs réalistes.

## Architecture

Deux projets côte à côte dans `meteo-app/` :

- `meteo-serveur/` (existant, peu modifié) — ajout d'un endpoint JSON
  `GET /api/latest`. La route `/` HTML existante et `/update` restent
  inchangées.
- `meteo-web/` (nouveau) — app Vite + React + TypeScript + Tailwind +
  shadcn/ui, indépendante, qui consomme les données (mock pour l'instant,
  API réelle plus tard).

Pas de changement de déploiement (Containerfile) pour cette étape : on se
concentre sur le développement local. L'intégration prod sera traitée dans
un futur projet séparé.

## Backend — `GET /api/latest`

Réutilise la logique existante (`evaluate_iaq`) et le même `SELECT` que la
route `/`. Renvoie un JSON avec la dernière mesure des 2 capteurs, IAQ déjà
calculée côté serveur :

```json
{
  "sensor1": {
    "label": "Capteur Principal (0x77)",
    "temperature": 21.3,
    "humidity": 45.2,
    "pressure": 1013.1,
    "gas_resistance": 52.3,
    "iaq_text": "Excellente",
    "iaq_color": "#28a745"
  },
  "sensor2": {
    "label": "Capteur Secondaire (0x76)",
    "temperature": 20.9,
    "humidity": 47.8,
    "pressure": 1012.8,
    "gas_resistance": 38.1,
    "iaq_text": "Bonne",
    "iaq_color": "#17a2b8"
  }
}
```

Si la base est vide, comportement équivalent à l'existant (valeurs `"--"`,
IAQ "En attente...").

## Frontend — structure de fichiers

```
meteo-web/
  src/
    App.tsx              # layout page, titre, grille des 2 SensorCard
    components/
      SensorCard.tsx      # carte shadcn (Card + Badge) pour un capteur
    lib/
      api.ts              # getLatestReadings(): retourne les données
      mockData.ts          # objet JSON statique réaliste, même forme que /api/latest
    types.ts              # types TS partagés (SensorReading, LatestReadings)
```

- `api.ts` expose une seule fonction `getLatestReadings()` qui retourne
  aujourd'hui les données de `mockData.ts` (avec un léger délai simulé pour
  se rapprocher d'un vrai appel réseau). Passer au vrai backend plus tard
  ne touchera que ce fichier (`fetch('/api/latest')`).
- `mockData.ts` contient des valeurs statiques réalistes pour les 2
  capteurs, au même format que le JSON de `/api/latest`.
- `SensorCard.tsx` reçoit un `SensorReading` en props et affiche
  température / humidité / pression via `Card` de shadcn, avec un `Badge`
  coloré pour l'IAQ.

## Style

Tailwind + shadcn/ui en thème neutre par défaut (pas de dark mode custom
pour cette itération). Cartes épurées façon dashboard, cohérentes avec
l'esprit minimaliste de l'app actuelle mais avec une UI plus soignée
(`Card`, `Badge`, `Separator`).

## Hors scope (pour cette itération)

- Historique / graphiques d'évolution dans le temps
- Mise à jour du Containerfile / déploiement production
- Dark mode
- Simulation live des données mockées (valeurs statiques suffisent)
