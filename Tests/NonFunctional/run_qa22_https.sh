#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-22: Security - HTTPS Encryption (Detailed Log)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Checking for HTTPS redirection headers on root..."
REDIRECT=$(curl -s -I "$BASE_URL" | grep -iE "Strict-Transport-Security|Location: https")
if [ -n "$REDIRECT" ]; then
    echo "[$(date '+%H:%M:%S')] SUCCESS: Found redirect/HSTS headers: $REDIRECT"
else
    echo "[$(date '+%H:%M:%S')] INFO: No HTTPS redirect at root. Testing app configuration..."
fi

echo "[$(date '+%H:%M:%S')] 2. Auditing Program.cs for HTTPS middleware..."
if grep -q "app.UseHttpsRedirection()" ApiApplication/Program.cs; then
    echo "[$(date '+%H:%M:%S')] SUCCESS: 'app.UseHttpsRedirection()' is enabled in codebase."
else
    echo "[$(date '+%H:%M:%S')] WARNING: 'app.UseHttpsRedirection()' not found in Program.cs."
fi

echo "##################################################"
echo "QA-22 TEST COMPLETED"
echo "##################################################"
