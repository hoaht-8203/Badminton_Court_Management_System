#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-25: Security - JWT Revocation Flow (Detailed Log)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Obtaining Admin JWT..."
ADMIN_TOKEN=$(curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"admin@email.com\", \"password\": \"admin123\"}" | jq -r .data.accessToken)

if [ "$ADMIN_TOKEN" == "null" ] || [ -z "$ADMIN_TOKEN" ]; then
    echo "[$(date '+%H:%M:%S')] ERROR: Admin login failed."
    exit 1
fi

echo "[$(date '+%H:%M:%S')] 2. Verifying token access (Before 'Logout')..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/Dashboard/summary")
echo "[$(date '+%H:%M:%S')] Result: HTTP $CODE (Expected 200)"

echo "[$(date '+%H:%M:%S')] 3. Simulating 'Logout' (If endpoint exists)..."
# Even if stateless, we check how the app handles it.
curl -s -X POST "$BASE_URL/api/Auth/logout" -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
echo "[$(date '+%H:%M:%S')] Logout sent."

echo "[$(date '+%H:%M:%S')] 4. Verifying token access (After 'Logout')..."
CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $ADMIN_TOKEN" "$BASE_URL/api/Dashboard/summary")
echo "[$(date '+%H:%M:%S')] Result: HTTP $CODE"

if [ "$CODE" == "200" ]; then
    echo "[$(date '+%H:%M:%S')] NOTE: Token is still valid (Stateless JWT Behavior)."
else
    echo "[$(date '+%H:%M:%S')] SUCCESS: Token was invalidated."
fi

echo "##################################################"
echo "QA-25 TEST COMPLETED"
echo "##################################################"
