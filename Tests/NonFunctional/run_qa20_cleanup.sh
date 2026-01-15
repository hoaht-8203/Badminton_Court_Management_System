#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-20: Periodic Cleanup Performance - Realistic Test"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Seeding 100 test users to ensure there is data to clear..."
SEED_RESULT=$(curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=9000&count=100" | jq -r .)
echo "[$(date '+%H:%M:%S')] Seed result: $SEED_RESULT"

echo "[$(date '+%H:%M:%S')] 2. Verifying current performance-related user count..."
USER_COUNT=$(curl -s "$BASE_URL/api/DevTest/user-count" | jq -r .count)
echo "[$(date '+%H:%M:%S')] Initial count: $USER_COUNT users found."

if [ "$USER_COUNT" -eq 0 ]; then
    echo "[$(date '+%H:%M:%S')] ERROR: Seeding failed or count is zero. Aborting cleanup test."
    exit 1
fi

echo "[$(date '+%H:%M:%S')] 3. Triggering cleanup-test-data endpoint..."
START_TIME_NS=$(date +%s%N)
RESULT=$(curl -s -X DELETE "$BASE_URL/api/DevTest/cleanup-test-data")
END_TIME_NS=$(date +%s%N)
DIFF_MS=$(( (END_TIME_NS - START_TIME_NS) / 1000000 ))

echo "[$(date '+%H:%M:%S')] 4. Response received."
echo "Server Response: $RESULT"

echo "[$(date '+%H:%M:%S')] 5. Verifying final count..."
FINAL_COUNT=$(curl -s "$BASE_URL/api/DevTest/user-count" | jq -r .count)
echo "[$(date '+%H:%M:%S')] Final count: $FINAL_COUNT users found."

echo "--------------------------------------------------"
echo "SUCCESS: Deleted $((USER_COUNT - FINAL_COUNT)) records."
echo "TOTAL CLEANUP DURATION: ${DIFF_MS}ms"
echo "--------------------------------------------------"

echo "##################################################"
echo "QA-20 TEST COMPLETED"
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"
