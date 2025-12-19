@echo off
REM === STOP_ALL.bat: Stop all FaceRecognation Suite services ===

echo Stopping CompreFace services (docker-compose)...
docker-compose down

echo Attempting to stop face_liveness_service...
taskkill /FI "WINDOWTITLE eq face_liveness_service*" /T /F >nul 2>&1

REM Optionally, stop FaceRecognation app if running
taskkill /IM FaceRecognation.exe /F >nul 2>&1

echo All services stopped.
pause
