@echo off
title CAMS - Development Mode
echo ========================================================
echo Starting CAMS in Dev Mode (Vite + TSX)...
echo ========================================================
cd /d "%~dp0"

start "" "http://localhost:3000"
npm run dev
pause
