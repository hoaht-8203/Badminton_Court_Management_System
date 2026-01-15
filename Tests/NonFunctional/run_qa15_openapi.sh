#!/bin/bash
BASE_URL="http://localhost:5039"

echo "=== NFT-QA-15: OpenAPI Spec Consistency ==="
echo "1. Fetching live Swagger JSON..."
curl -s "$BASE_URL/swagger/v1/swagger.json" > Tests/NonFunctional/swagger_tmp.json

echo "2. Fetching sample API response (Courts)..."
curl -s "$BASE_URL/api/Courts/list" | jq '.data[0]' > Tests/NonFunctional/response_tmp.json

echo -e "\n--- Field Comparison (Sample) ---"
echo "Swagger (ListCourtResponse properties):"
jq '.components.schemas.ListCourtResponse.properties | keys' Tests/NonFunctional/swagger_tmp.json | head -n 10

echo -e "\nActual API Response keys:"
jq 'keys' Tests/NonFunctional/response_tmp.json | head -n 10

echo -e "\n3. Verifying camelCase consistency..."
# Check for any PascalCase keys in the actual data (simple heuristic)
PASCAL_KEYS=$(jq 'keys[] | select(test("^[A-Z]"))' Tests/NonFunctional/response_tmp.json)

if [ -z "$PASCAL_KEYS" ]; then
    echo "SUCCESS: All keys follow camelCase naming convention."
else
    echo "WARNING: Found PascalCase keys: $PASCAL_KEYS"
fi

echo -e "\n--- Test Completed ---"
rm Tests/NonFunctional/swagger_tmp.json Tests/NonFunctional/response_tmp.json
