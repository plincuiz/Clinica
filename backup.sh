#!/bin/bash
cd ~/clinica || exit 1
FECHA=$(date +%Y%m%d_%H%M%S)
mkdir -p ~/backups_clinica
if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 prisma/dev.db ".backup '$HOME/backups_clinica/clinica_$FECHA.db'"
else
  cp prisma/dev.db "$HOME/backups_clinica/clinica_$FECHA.db"
fi
cp .env "$HOME/backups_clinica/env_$FECHA.bak"
if [ -d storage ]; then
  tar czf "$HOME/backups_clinica/storage_$FECHA.tar.gz" storage
  ls -t ~/backups_clinica/storage_*.tar.gz | tail -n +15 | xargs -r rm
fi
ls -t ~/backups_clinica/clinica_*.db | tail -n +15 | xargs -r rm
echo "Backup creado: clinica_$FECHA.db"
