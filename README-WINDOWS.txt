====================================================================
  LightViana DMX - Windows Package
====================================================================

OPTION 1 — INSTANT STANDALONE MODE (NO INSTALL REQUIRED)
  1. Extract this entire ZIP folder anywhere on your PC.
  2. Double-click "Open-LightViana-AppWindow.bat" OR "dist\index.html"
     (opening root "index.html" will also redirect automatically to "dist\index.html").
  3. Works 100% offline directly from the folder in Chrome / Edge / Firefox:
     all presets, scenes, banks, stage visualizer, audio BPM sync, and
     backup/factory-reset features work immediately.

OPTION 2 — FULL HOST SERVER (ART-NET UDP DMX + WI-FI ANDROID TABLET SYNC)
  1. Ensure Node.js 22+ is installed (https://nodejs.org/).
  2. Double-click "Start-LightViana-Windows.bat".
  3. On first run, it installs dependencies if needed and starts the
     local server on http://localhost:3000 with Art-Net (UDP 6454), RDM
     autodiscovery, and WebSocket multi-device sync for Android tablets.
  4. If Windows Defender Firewall prompts, allow access on Private/Local networks.
