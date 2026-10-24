@echo off
title CAMS - Class Accounting & Attendance System
echo ========================================================
echo Starting CAMS Local Server with Face Recognition & Attendance...
echo ========================================================
cd /d "%~dp0"

:: Start the server in background and open browser
echo Starting backend server on port 5000...
start "" "http://localhost:5000"
node server/dist/index.js
pause
