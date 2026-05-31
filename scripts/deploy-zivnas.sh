#!/usr/bin/env bash
set -euo pipefail

TARGET_HOST="${TARGET_HOST:-pezadmin@zivnas}"
TARGET_DIR="${TARGET_DIR:-/volume1/docker/family-hub}"
COMPOSE="${COMPOSE:-/usr/local/bin/docker-compose}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

npm run lint
npm run build

ssh -o BatchMode=yes "$TARGET_HOST" "mkdir -p '$TARGET_DIR' && find '$TARGET_DIR' -mindepth 1 ! -name '.env.production' -exec rm -rf {} +"

tar \
  --exclude='./.git' \
  --exclude='./.next' \
  --exclude='./node_modules' \
  --exclude='./.env' \
  --exclude='./.env.local' \
  --exclude='./.env.production' \
  -cf - . | ssh -o BatchMode=yes "$TARGET_HOST" "cd '$TARGET_DIR' && tar -xf -"

ssh -o BatchMode=yes "$TARGET_HOST" "test -f '$TARGET_DIR/.env.production'"
ssh -o BatchMode=yes "$TARGET_HOST" "cd '$TARGET_DIR' && PATH=/usr/local/bin:\$PATH '$COMPOSE' up -d --build"
ssh -o BatchMode=yes "$TARGET_HOST" "cd '$TARGET_DIR' && PATH=/usr/local/bin:\$PATH '$COMPOSE' ps"
