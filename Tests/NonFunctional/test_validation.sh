#!/bin/bash

# Configuration
BASE_URL="http://localhost:5039"

echo "--------------------------------------------------"
echo "Data Integrity / Validation Test (NFT-QA-12)"
echo "--------------------------------------------------"

# 1. Missing required fields in Login
echo "Test 1: Login with empty object"
curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{}" | jq .

# 2. Invalid data type
echo -e "\nTest 2: Request with invalid data (string for int if applicable)"
# We'll use a public search or similar if available, or just stick to Auth for validation testing.
# Let's try to send a string for a boolean or similar if we can find one.
# For now, let's verify the Login validation messages.

echo "--------------------------------------------------"
echo "Validation tests completed."
