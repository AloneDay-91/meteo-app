# Déploiement Podman

Deux façons de lancer `meteo-serveur` et `meteo-web` avec Podman :

- **compose.yaml** (à la racine du dépôt) — pratique pour lancer/tester
  rapidement les deux services ensemble avec `podman compose`.
- **Quadlet** (`deploy/quadlet/`) — la façon recommandée de faire démarrer
  les conteneurs automatiquement au redémarrage de la machine, l'équivalent
  Podman du comportement par défaut de Docker (`--restart=always` +
  `dockerd` qui tourne en permanence). Contrairement à Docker, Podman n'a
  pas de démon persistant : `podman compose up -d` ne survit pas à un
  redémarrage de la machine à lui seul, il faut passer par systemd.

## Démarrage rapide avec compose

```bash
podman compose up -d --build
```

- Dashboard : http://localhost:8080
- API Flask : http://localhost:5000

`restart: always` dans `compose.yaml` relance les conteneurs s'ils
plantent, mais ne les relance PAS après un redémarrage de la machine (voir
la section Quadlet ci-dessous pour ça).

## Démarrage automatique au boot (Quadlet)

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

### Mettre à jour après un changement de code

Quadlet ne rebuild pas automatiquement. Après une modification :

```bash
podman build -t localhost/meteo-serveur:latest ./meteo-serveur
podman build -t localhost/meteo-web:latest ./meteo-web
systemctl --user restart meteo-serveur.service meteo-web.service
```

### Root vs rootless

Ces instructions supposent un usage rootless (recommandé). Pour un
déploiement root/système, les fichiers vont dans
`/etc/containers/systemd/` et les commandes `systemctl --user ...`
deviennent `systemctl ...` (sans `--user`) — dans ce cas `loginctl
enable-linger` n'est pas nécessaire.
