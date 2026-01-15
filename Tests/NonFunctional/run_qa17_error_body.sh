#!/bin/bash
BASE_URL="http://localhost:5039"

echo "=== NFT-QA-17: Standardized Error Body ==="

echo "Test 1: Trigger 404 (Not Found)"
curl -s "$BASE_URL/api/NonExistentEndpoint" | jq .

echo -e "\nTest 2: Trigger 400 (Bad Request)"
curl -s -X POST "$BASE_URL/api/Auth/login" -H "Content-Type: application/json" -d "{}" | jq .

echo -e "\nTest 3: Trigger 500 (Internal Server Error - Simulated via bad syntax if any)"
# We'll call an endpoint that we know might fail if misused or use a dev-test route that throws
curl -s "http://localhost:5039/api/DevTest/test-batch-notification?count=1000000" | jq .

echo "=== Test Completed ==="
