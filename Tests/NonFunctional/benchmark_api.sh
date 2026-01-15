#!/bin/bash

# Configuration
BASE_URL="http://localhost:5039"
ENDPOINTS=(
  "/api/DevTest/health"
  "/api/Courts/list"
  "/api/Dashboard/summary"
  "/api/Products/list"
)

echo "--------------------------------------------------"
echo "API Response Performance Benchmark (NFT-QA-11)"
echo "Target: 95% < 300ms"
echo "--------------------------------------------------"

for ep in "${ENDPOINTS[@]}"; do
  echo "Testing: $ep"
  for i in {1..5}; do
    time_taken=$(curl -s -w "%{time_total}\n" -o /dev/null "$BASE_URL$ep")
    ms=$(echo "$time_taken * 1000 / 1" | bc)
    echo "  Run $i: ${ms}ms"
  done
done

echo "--------------------------------------------------"
echo "Benchmark completed."
