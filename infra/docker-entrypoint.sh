#!/bin/sh
set -e
echo "Starting Uptime Monitor..."
export NODE_ENV=${DEPLOY_ENV:-production}
exec "$@"
