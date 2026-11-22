#!/usr/bin/env bash
# Double-click (Mac: right-click > Open the first time) or run: ./start-mac-linux.sh
cd "$(dirname "$0")"
echo "Clinic Patient Manager"
if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org/ and run this again."
  (open https://nodejs.org/ || xdg-open https://nodejs.org/) >/dev/null 2>&1
  read -r -p "Press Enter to close"; exit 1
fi
if [ ! -d node_modules ]; then
  echo "First run: installing, this takes a few minutes..."
  npm install || { read -r -p "Install failed. Press Enter to close"; exit 1; }
fi
echo "Starting... your browser will open at http://localhost:3000. Keep this window open; close it to stop."
(sleep 10; open http://localhost:3000 2>/dev/null || xdg-open http://localhost:3000 2>/dev/null) &
npm run dev
