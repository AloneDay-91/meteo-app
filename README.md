# Station Météo — Tableau de Bord Environnemental

Suivi de deux capteurs BME680 (température, humidité, pression, qualité de
l'air) : un serveur Flask qui reçoit et stocke les mesures, et un dashboard
web qui les affiche en temps réel avec historique et graphiques.

## Structure du projet

```
meteo-app/
├── meteo-serveur/     API Flask + SQLite (reçoit les mesures des capteurs)
├── meteo-web/         Dashboard Vite + React + TypeScript + Tailwind + shadcn/ui
├── compose.yaml        Orchestration Podman des deux services (dev/test rapide)
└── deploy/quadlet/     Unités systemd pour un déploiement en production
```

## Architecture

- **meteo-serveur** reçoit les mesures des capteurs via `POST /update`, les
  stocke dans SQLite (table `mesures`, une ligne par mesure avec horodatage),
  et les expose en JSON :
  - `GET /api/latest` — dernière mesure des 2 capteurs, avec qualité de
    l'air déjà évaluée côté serveur.
  - `GET /api/history` — historique regroupé par jour (moyenne des mesures
    de chaque jour), quel que soit le nombre de mesures reçues par jour.
  - `GET /` — page HTML simple (ancien dashboard, conservée telle quelle).
- **meteo-web** consomme ces deux endpoints (`src/lib/api.ts`) et affiche :
  cartes par capteur, historique de température comparé entre les 2
  capteurs (graphique en aire), et un dialog par capteur avec tableau
  filtrable/paginé de tout l'historique (température, humidité, pression,
  résistance gaz).

## Développement local

### Backend (`meteo-serveur/`)

```bash
cd meteo-serveur
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # inclut pytest, en plus de Flask/gunicorn

python app.py                          # démarre sur http://localhost:5000
```

> Sur macOS, le port 5000 est parfois pris par AirPlay Receiver
> (Réglages Système → Général → AirDrop et Handoff → désactiver
> "Récepteur AirPlay"), ou lancez avec un autre port en modifiant
> temporairement `app.run(port=...)`.

Tests :

```bash
pytest test_app.py -v
```

### Frontend (`meteo-web/`)

```bash
cd meteo-web
npm install
npm run dev                            # http://localhost:5173
```

Le serveur de dev Vite proxy automatiquement `/api/*` vers
`http://localhost:5000` (le backend Flask en local). Pour pointer vers un
autre backend (ex. une VM), créez `meteo-web/.env.local` :

```
VITE_API_PROXY_TARGET=http://<ip-ou-nom-de-la-vm>:5000
```

Tests, type-check, build :

```bash
npx vitest run
npx tsc -b
npm run build
```

## Déploiement en production (Podman)

Deux façons de lancer `meteo-serveur` et `meteo-web` avec Podman :

- **compose.yaml** (racine du dépôt) — pratique pour lancer/tester
  rapidement les deux services ensemble.
- **Quadlet** (`deploy/quadlet/`) — la façon recommandée de faire démarrer
  les conteneurs automatiquement au redémarrage de la machine, l'équivalent
  Podman du comportement par défaut de Docker (`--restart=always` +
  `dockerd` qui tourne en permanence). **Contrairement à Docker, Podman n'a
  pas de démon persistant** : `podman compose up -d` ne survit pas à un
  redémarrage de la machine à lui seul, il faut passer par systemd.

### Démarrage rapide avec compose

```bash
podman compose up -d --build
```

- Dashboard : http://localhost:8080
- API Flask : http://localhost:5000

Le frontend est servi par nginx, qui proxy `/api/*` vers le conteneur
`meteo-serveur` (voir `meteo-web/nginx.conf`) — pas de configuration CORS
ni d'URL à coder en dur, le dashboard appelle simplement `/api/latest` et
`/api/history` en relatif.

`restart: always` dans `compose.yaml` relance les conteneurs s'ils
plantent, mais ne les relance **pas** après un redémarrage de la machine
(voir la section Quadlet ci-dessous pour ça).

### Démarrage automatique au boot (Quadlet)

1. Builder les images localement (Quadlet ne build pas depuis un
   Containerfile, il faut une image déjà construite) :

   ```bash
   podman build -t localhost/meteo-serveur:latest ./meteo-serveur
   podman build -t localhost/meteo-web:latest ./meteo-web
   ```

2. Copier les fichiers Quadlet dans le dossier systemd utilisateur :

   ```bash
   mkdir -p ~/.config/containers/systemd
   cp deploy/quadlet/*.network deploy/quadlet/*.volume deploy/quadlet/*.container \
     ~/.config/containers/systemd/
   ```

3. Recharger systemd et activer les services :

   ```bash
   systemctl --user daemon-reload
   systemctl --user enable --now meteo-serveur.service meteo-web.service
   ```

4. **Étape indispensable** : autoriser les services utilisateur à démarrer
   sans session ouverte (sinon rien ne redémarre après un reboot tant que
   vous ne vous reconnectez pas) :

   ```bash
   loginctl enable-linger $(whoami)
   ```

5. Vérifier :

   ```bash
   systemctl --user status meteo-serveur.service meteo-web.service
   podman ps
   ```

Après un `reboot`, les deux conteneurs doivent redémarrer automatiquement
sans action manuelle — testez avec un vrai redémarrage de la machine pour
confirmer.

#### Mettre à jour après un changement de code

Quadlet ne rebuild pas automatiquement. Après une modification :

```bash
podman build -t localhost/meteo-serveur:latest ./meteo-serveur
podman build -t localhost/meteo-web:latest ./meteo-web
systemctl --user restart meteo-serveur.service meteo-web.service
```

#### Root vs rootless

Ces instructions supposent un usage rootless (recommandé). Pour un
déploiement root/système, les fichiers vont dans
`/etc/containers/systemd/` et les commandes `systemctl --user ...`
deviennent `systemctl ...` (sans `--user`) — dans ce cas `loginctl
enable-linger` n'est pas nécessaire.

### Persistance des données

La base SQLite (`meteo.db`) vit dans le volume Podman `meteo-db`, monté sur
`/app/db` dans le conteneur `meteo-serveur` — elle survit aux rebuilds et
redémarrages des conteneurs (voir `deploy/quadlet/meteo-db.volume` et le
bloc `volumes:` de `compose.yaml`).
