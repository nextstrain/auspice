#!/bin/sh
set -eu

export NODE_ENV=production
export MAPBOX_API_TOKEN="${MAPBOX_API_TOKEN:-no_access_token}"

npm run build

./auspice.js view --datasetDir data
