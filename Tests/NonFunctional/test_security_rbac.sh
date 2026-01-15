#!/bin/bash
BASE_URL="http://localhost:5039"
CUST_EMAIL="customer_only@example.com"
CUST_PASS="Password123!"

echo "##################################################"
echo "NFT-QA-21: Security - RBAC Enforcement (Detailed Log)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Test: Guest (No Token) accessing /api/Dashboard/summary..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/Dashboard/summary")
echo "[$(date '+%H:%M:%S')] Result: HTTP $CODE (Expected 401 Unauthorized)"

echo "[$(date '+%H:%M:%S')] 2. Test: Admin login and accessing /api/Dashboard/summary..."
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"admin@email.com\", \"password\": \"admin123\"}" | jq -r .data.accessToken)

if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/Dashboard/summary")
    echo "[$(date '+%H:%M:%S')] Admin Result: HTTP $CODE (Expected 200 OK)"
else
    echo "[$(date '+%H:%M:%S')] ERROR: Admin login failed."
fi

echo "[$(date '+%H:%M:%S')] 3. Test: Seeding and logging in as Customer-only..."
curl -s "$BASE_URL/api/DevTest/seed-customer-only" > /dev/null
CUST_TOKEN=$(curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"$CUST_EMAIL\", \"password\": \"$CUST_PASS\"}" | jq -r .data.accessToken)

if [ "$CUST_TOKEN" != "null" ] && [ -n "$CUST_TOKEN" ]; then
    echo "[$(date '+%H:%M:%S')] Customer Login: SUCCESS"
    CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $CUST_TOKEN" "$BASE_URL/api/Dashboard/summary")
    echo "[$(date '+%H:%M:%S')] Customer Access to Admin-Only Resource: HTTP $CODE (Expected 403 Forbidden)"
else
    echo "[$(date '+%H:%M:%S')] ERROR: Customer login failed for $CUST_EMAIL."
fi

echo "##################################################"
echo "QA-21 TEST COMPLETED"
echo "##################################################"
