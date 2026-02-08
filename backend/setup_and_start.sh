#!/bin/bash
set -e

echo "Installing Playwright browsers and dependencies..."
playwright install-deps chromium
playwright install chromium

echo "Starting Xvfb..."
Xvfb :99 -screen 0 1024x768x24 -ac +extension GLX +render -noreset &
export DISPLAY=:99

echo "Waiting for Xvfb to start..."
sleep 2

echo "Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port $PORT --loop asyncio --workers 1
