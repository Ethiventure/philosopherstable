#!/bin/zsh
# Dev-stack keep-alive for the Dialectical Cabinet.
# The netlify-dev wrapper sometimes outlives its inner Vite server (or dies
# during long idle gaps), leaving "Could not proxy request" on :8888.
# This loop checks the site every 45s and restarts the stack when it stops
# answering. Logs to /tmp/cabinet-netlify.log. Safe to run alongside a
# manual `npx netlify dev` (it will just see 200s and idle).
#
# Usage: nohup ./scripts/dev-keepalive.sh >/tmp/cabinet-keepalive.log 2>&1 &
set -u
cd "${0:A:h}/.."

log() { echo "[$(date '+%H:%M:%S')] $*"; }

log "keep-alive watching http://localhost:8888/"
while true; do
  if ! curl -sf -m 8 -o /dev/null http://localhost:8888/ 2>/dev/null; then
    log "site down — restarting stack"
    pkill -f "netlify dev" 2>/dev/null
    pkill -f npxnetlify 2>/dev/null
    pkill -f "/bin/vite" 2>/dev/null
    sleep 3
    nohup npx -y netlify dev --port 8888 >> /tmp/cabinet-netlify.log 2>&1 &
    sleep 30
    if curl -sf -m 8 -o /dev/null http://localhost:8888/ 2>/dev/null; then
      log "site back up"
    else
      log "restart did not recover the site (will retry)"
    fi
  fi
  sleep 45
done
