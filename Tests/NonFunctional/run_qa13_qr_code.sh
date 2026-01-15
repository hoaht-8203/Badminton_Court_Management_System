#!/bin/bash
BASE_URL="http://localhost:5039"

echo "=== NFT-QA-13: QR Code Compatibility ==="

echo "1. Getting Admin token..."
TOKEN=$(curl -s -X POST "$BASE_URL/api/Auth/login" \
     -H "Content-Type: application/json" \
     -d "{\"email\": \"admin@email.com\", \"password\": \"admin123\"}" | jq -r .data.accessToken)

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
    echo "FAILED: Could not login as admin."
    exit 1
fi

echo "2. Seeding test data (Booking + Payment)..."
SEED_RESP=$(curl -s "$BASE_URL/api/DevTest/seed-qr-test-data")
BOOKING_ID=$(echo "$SEED_RESP" | jq -r .bookingId)

if [ "$BOOKING_ID" == "null" ] || [ -z "$BOOKING_ID" ]; then
    echo "FAILED: Could not seed test data."
    exit 1
fi
echo "Seeded Booking ID: $BOOKING_ID"

echo "3. Fetching QR URL for this booking..."
QR_URL=$(curl -s -H "Authorization: Bearer $TOKEN" "$BASE_URL/api/Payments/qr-by-booking-id?BookingId=$BOOKING_ID" | jq -r .data.qrUrl)

if [[ "$QR_URL" == "https://qr.sepay.vn"* ]]; then
    echo "SUCCESS: Found valid SePay QR URL: $QR_URL"
else
    echo "FAILED: Could not retrieve a valid QR URL. Response: $QR_URL"
fi
echo "=== Test Completed ==="
