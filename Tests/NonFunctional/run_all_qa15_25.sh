#!/bin/bash

# Configuration
BASE_URL="http://localhost:5039"
SCRIPTS=(
  "run_qa15_openapi.sh"
  "run_qa16_health.sh"
  "run_qa17_error_body.sh"
  "run_qa18_race_condition.sh"
  "run_qa19_mttr.sh"
  "run_qa20_cleanup.sh"
  "test_security_rbac.sh"
  "run_qa22_https.sh"
  "run_qa23_hashing.sh"
  "test_security_sqli.sh"
  "run_qa25_token_revocation.sh"
)

echo "##################################################"
echo "MASTER NFT TEST SUITE (QA-15 to QA-25)"
echo "Started at: $(date)"
echo "##################################################"

for script in "${SCRIPTS[@]}"; do
  if [ -f "Tests/NonFunctional/$script" ]; then
    chmod +x "Tests/NonFunctional/$script"
    ./Tests/NonFunctional/"$script"
    echo -e "\n--------------------------------------------------"
  else
    echo "WARNING: Script $script not found."
  fi
done

echo "##################################################"
echo "ALL TESTS COMPLETED"
echo "End time: $(date)"
echo "##################################################"
