#!/bin/bash

echo "##################################################"
echo "MASTER SECURITY TEST SUITE (QA-21 to QA-25)"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

SCRIPTS=(
    "test_security_rbac.sh"
    "run_qa22_https.sh"
    "run_qa23_hashing.sh"
    "test_security_sqli.sh"
    "run_qa25_token_revocation.sh"
)

for script in "${SCRIPTS[@]}"; do
    if [ -f "Tests/NonFunctional/$script" ]; then
        chmod +x "Tests/NonFunctional/$script"
        ./Tests/NonFunctional/"$script"
        echo ""
    else
        echo "WARNING: Script Tests/NonFunctional/$script not found."
    fi
done

echo "##################################################"
echo "MASTER SECURITY SUITE COMPLETED"
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"
