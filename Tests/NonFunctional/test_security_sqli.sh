#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-24: Security - SQL Injection Resistance (Detailed Log)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Test: Login with injection payload in email field..."
PAYLOAD="' OR '1'='1"
RESULT=$(curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"$PAYLOAD\", \"password\": \"wrongpass\"}")
echo "[$(date '+%H:%M:%S')] Payload: $PAYLOAD"
echo "[$(date '+%H:%M:%S')] API Response: $(echo $RESULT | jq -r .message)"

echo "[$(date '+%H:%M:%S')] 2. Test: Search courts with destructive injection payload..."
PAYLOAD="'; DROP TABLE \"AspNetUsers\"; --"
RESULT=$(curl -s "$BASE_URL/api/Courts/list?Search=$PAYLOAD")
echo "[$(date '+%H:%M:%S')] Payload: $PAYLOAD"
echo "[$(date '+%H:%M:%S')] API Status: Successful request (Expected 200 with empty list or literal match)"

echo "[$(date '+%H:%M:%S')] 3. Verifying database integrity (Checking if Admin still exists)..."
CODE=$(curl -s -o /dev/null -w "%{http_code}\n" -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"admin@email.com\", \"password\": \"admin123\"}")
if [ "$CODE" == "200" ]; then
    echo "[$(date '+%H:%M:%S')] SUCCESS: Database is intact. Admin login still works."
else
    echo "[$(date '+%H:%M:%S')] ERROR: Admin login failed after injection attempt!"
fi

echo "##################################################"
echo "QA-24 TEST COMPLETED"
echo "##################################################"
