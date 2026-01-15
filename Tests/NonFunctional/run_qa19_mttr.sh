#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-19: Mean Time to Recovery (MTTR) - Detailed Log"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Identifying and shutting down API process..."
# Find the PID to be specific
PID=$(pgrep -f "ApiApplication")
if [ -z "$PID" ]; then
    echo "[$(date '+%H:%M:%S')] WARNING: No ApiApplication process found. Starting from fresh state."
else
    echo "[$(date '+%H:%M:%S')] Found PID $PID. Killing process..."
    kill -9 $PID
    sleep 2
fi

echo "[$(date '+%H:%M:%S')] 2. Starting API and beginning recovery window..."
START_TIME_NS=$(date +%s%N)
# Run in background and pipe output to a temp log file for visibility
dotnet run --project ApiApplication --urls "$BASE_URL" > /tmp/api_startup.log 2>&1 &
NEW_PID=$!
echo "[$(date '+%H:%M:%S')] API subprocess started with PID: $NEW_PID"

echo "[$(date '+%H:%M:%S')] 3. Polling for 200 OK at $BASE_URL/api/DevTest/health..."
ATTEMPT=0
while true; do
    ATTEMPT=$((ATTEMPT + 1))
    CODE=$(curl -s -o /dev/null -w "%{http_code}\n" "$BASE_URL/api/DevTest/health")
    
    if [ "$CODE" == "200" ]; then
        END_TIME_NS=$(date +%s%N)
        DIFF_MS=$(( (END_TIME_NS - START_TIME_NS) / 1000000 ))
        echo "[$(date '+%H:%M:%S')] SUCCESS: Attempt $ATTEMPT - API is ONLINE (HTTP 200)."
        echo "--------------------------------------------------"
        echo "TOTAL RECOVERY TIME: ${DIFF_MS}ms"
        echo "--------------------------------------------------"
        break
    else
        echo "[$(date '+%H:%M:%S')] Attempt $ATTEMPT: Received HTTP $CODE. Still waiting..."
    fi
    
    # Check if process is still alive while waiting
    if ! kill -0 $NEW_PID 2>/dev/null; then
        echo "[$(date '+%H:%M:%S')] ERROR: API process (PID $NEW_PID) died unexpectedly. Check /tmp/api_startup.log"
        exit 1
    fi
    
    sleep 1
done

echo "##################################################"
echo "MTTR TEST COMPLETED"
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"
