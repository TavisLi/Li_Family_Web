#!/bin/sh
# macOS disposable PostgreSQL rehearsal. All database files and uploads live under the private socket directory.
set -eu
umask 077
root=$(cd "$(dirname "$0")/../.." && pwd)
node_bin=$(command -v node)
pg_bin=${PG_BIN:-/opt/homebrew/opt/postgresql@17/bin}
scratch=$(mktemp -d /private/tmp/family-media-rehearsal.XXXXXX)
cleanup() {
  if test -f "$scratch/db/postmaster.pid"; then
    "$pg_bin/pg_ctl" -D "$scratch/db" -m immediate -w stop >/dev/null || return 1
  fi
  rm -rf "$scratch"
}
trap cleanup EXIT
"$pg_bin/initdb" -U fixture -A trust -D "$scratch/db" --encoding=UTF8 --no-locale > "$scratch/init.log"
"$pg_bin/pg_ctl" -D "$scratch/db" -l "$scratch/server.log" -o "-c listen_addresses='' -k $scratch -p 59744" -w start >/dev/null
cd "$scratch"
env -i PATH=/usr/bin:/bin NODE_ENV=development PAYLOAD_SECRET=disposable-fixture-key PAYLOAD_TELEMETRY_DISABLED=1 \
  TSX_TSCONFIG_PATH="$root/tsconfig.json" "$node_bin" --import "$root/node_modules/tsx/dist/loader.mjs" "$root/src/scripts/family-media-rehearsal.mjs" "$scratch"
