@echo off
REM === START_ALL.bat: Orchestrator for FaceRecognation Suite ===

REM 1. Start CompreFace via Docker Compose
echo Starting CompreFace services...
docker-compose up -d
if %ERRORLEVEL% neq 0 (
    echo Failed to start CompreFace via Docker Compose. Ensure Docker Desktop is running.
    pause
    exit /b 1
)

REM 2. Start face_liveness_service (Python)
cd face_liveness_service
if exist venv\Scripts\activate.bat (
    call venv\Scripts\activate.bat
) else (
    echo Python venv not found. Please set up the environment first.
    pause
    exit /b 1
)
start "face_liveness_service" cmd /c "python app.py"
cd ..

REM 3. Wait for CompreFace (port 8000) and face_liveness (port 5001) to be healthy
setlocal enabledelayedexpansion
set MAX_RETRIES=30
set RETRY_DELAY=5
set /a COUNT=0
:wait_compreface
    powershell -Command "try { $r=Invoke-WebRequest -Uri http://localhost:8000 -UseBasicParsing -TimeoutSec 3 } catch {}; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 }"
    if %ERRORLEVEL%==0 goto wait_face_liveness
    set /a COUNT+=1
    if !COUNT! geq %MAX_RETRIES% (
        echo Timeout waiting for CompreFace to be healthy.
        pause
        exit /b 1
    )
    echo Waiting for CompreFace (attempt !COUNT!/%MAX_RETRIES%)...
    timeout /t %RETRY_DELAY% >nul
    goto wait_compreface
:wait_face_liveness
set /a COUNT=0
:wait_liveness
    powershell -Command "try { $r=Invoke-WebRequest -Uri http://localhost:5001 -UseBasicParsing -TimeoutSec 3 } catch {}; if ($r.StatusCode -eq 200) { exit 0 } else { exit 1 }"
    if %ERRORLEVEL%==0 goto launch_app
    set /a COUNT+=1
    if !COUNT! geq %MAX_RETRIES% (
        echo Timeout waiting for face_liveness_service to be healthy.
        pause
        exit /b 1
    )
    echo Waiting for face_liveness_service (attempt !COUNT!/%MAX_RETRIES%)...
    timeout /t %RETRY_DELAY% >nul
    goto wait_liveness

REM 4. Launch FaceRecognation WPF app
echo Launching FaceRecognation application...
if exist FaceRecognation\FaceRecognation.exe (
    start "FaceRecognation" FaceRecognation\FaceRecognation.exe
) else if exist FaceRecognation\bin\Release\net6.0-windows\FaceRecognation.exe (
    start "FaceRecognation" FaceRecognation\bin\Release\net6.0-windows\FaceRecognation.exe
) else (
    echo Khong tim thay file FaceRecognation.exe. Vui long kiem tra thu muc publish.
)

echo All services started. You may close this window.
pause
