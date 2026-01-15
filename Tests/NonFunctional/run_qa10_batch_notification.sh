#!/bin/bash
BASE_URL="http://localhost:5039"

echo "=== NFT-QA-10: Batch Notification Performance ==="
echo "1. Seeding 1,000 users..."
curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=1&count=200" > /dev/null
curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=201&count=200" > /dev/null
curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=401&count=200" > /dev/null
curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=601&count=200" > /dev/null
curl -s "http://localhost:5039/api/DevTest/seed-users?startIndex=801&count=200" > /dev/null

echo "2. Triggering batch notification test..."
RESULT=$(curl -s "http://localhost:5039/api/DevTest/test-batch-notification?count=1000")
echo "$RESULT" | jq .

echo "=== Test Completed ==="
