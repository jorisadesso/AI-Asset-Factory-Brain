#!/bin/sh
set -e

echo "Running database migrations..."
node node_modules/prisma/build/index.js migrate deploy

echo "Seeding admin user if needed..."
node scripts/seed-admin.js

echo "Starting server..."
exec node server.js
