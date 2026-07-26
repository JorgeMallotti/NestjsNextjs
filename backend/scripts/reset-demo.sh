#!/bin/bash
# ─────────────────────────────────────────────────────────
# Reset Demo Database
# ─────────────────────────────────────────────────────────
# Drops the database, re-applies all migrations, and seeds
# with fresh demo data. Designed to run via cron every 24h.
#
# Usage:
#   ./scripts/reset-demo.sh
#
# Environment:
#   DATABASE_URL must be set (via .env or environment)
# ─────────────────────────────────────────────────────────

set -e

echo "🔄 Resetting demo database..."
echo "────────────────────────────────────"

# Step 1: Navigate to backend directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$SCRIPT_DIR"

# Step 2: Reset database (drops all data, re-applies migrations)
echo "  → Running migrate reset..."
npx prisma migrate reset --force

# Step 3: Run seed
echo "  → Running seed..."
npx prisma db seed

echo "────────────────────────────────────"
echo "✅ Demo database reset complete!"
echo "   $(date)"
