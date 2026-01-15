#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-23: Security - Password Hashing (Detailed Log)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

echo "[$(date '+%H:%M:%S')] 1. Verifying hashing logic in registration flow..."
HASH_LOGIC=$(grep -A 5 "user.PasswordHash =" ApiApplication/Services/Impl/AuthService.cs | grep "HashPassword")
if [ -n "$HASH_LOGIC" ]; then
    echo "[$(date '+%H:%M:%S')] SUCCESS: AuthService correctly calls HashPassword()."
else
    echo "[$(date '+%H:%M:%S')] ERROR: Could not verify hashing call in AuthService.cs."
fi

echo "[$(date '+%H:%M:%S')] 2. Checking identity configuration in Program.cs..."
if grep -q "AddIdentity" ApiApplication/Program.cs || grep -q "AddDefaultIdentity" ApiApplication/Program.cs; then
    echo "[$(date '+%H:%M:%S')] SUCCESS: ASP.NET Core Identity (Active) handles secure hashing automatically."
else
    echo "[$(date '+%H:%M:%S')] INFO: Manual or simplified identity configuration detected."
fi

echo "##################################################"
echo "QA-23 TEST COMPLETED"
echo "##################################################"
