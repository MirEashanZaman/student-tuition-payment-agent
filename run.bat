@echo off
start "Tuition Agent Backend (Port 4568)" cmd /k "cd /d %~dp0backend && npm run start:dev"
start "Tuition Agent Frontend (Port 4567)" cmd /k "cd /d %~dp0frontend && npm run dev"
echo Both services are starting in dedicated windows.
echo Backend: http://localhost:4568
echo Frontend: http://localhost:4567
