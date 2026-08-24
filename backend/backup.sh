#!/usr/bin/env bash
set -euo pipefail

SRC="$(pwd)/data.db"
OUT_DIR="$(pwd)/backups"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

if [ ! -f "$SRC" ]; then
  echo "No data.db found at $SRC — nothing to backup." >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
cp "$SRC" "$OUT_DIR/data-$TIMESTAMP.db"
echo "Backup saved to $OUT_DIR/data-$TIMESTAMP.db"
