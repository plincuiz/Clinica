#!/bin/bash
cd "$(dirname "$0")" || exit 1
echo "============================================"
echo "  SISTEMA CLINICO - SERVIDOR"
echo "  NO CIERRES esta ventana mientras se use."
echo "============================================"
echo
IP=$(hostname -I 2>/dev/null | awk '{print $1}')
echo "  En esta PC:      http://localhost:3000"
echo "  Desde otras PCs: http://$IP:3000"
echo
npm run start
