#!/bin/bash
BASE_URL="http://localhost:5039"

echo "##################################################"
echo "NFT-QA-16: Reliability - System Health Monitoring"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"

check_endpoint() {
    local url=$1
    local name=$2
    echo "[$(date '+%H:%M:%S')] Checking $name ($url)..."
    
    # Use curl with -v for more detail if needed, but for logs we'll just capture code and response
    local start=$(date +%s%N)
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    local end=$(date +%s%N)
    local diff=$(( (end - start) / 1000000 ))
    
    if [ "$code" == "200" ]; then
        echo "[$(date '+%H:%M:%S')] SUCCESS: $name is ONLINE. Status: $code. Latency: ${diff}ms"
    else
        echo "[$(date '+%H:%M:%S')] WARNING: $name returned HTTP $code. Latency: ${diff}ms"
    fi
}

check_endpoint "$BASE_URL/health" "Root Health (Middleware)"
check_endpoint "$BASE_URL/api/DevTest/health" "Custom API Health"

echo "##################################################"
echo "QA-16 TEST COMPLETED"
echo "Finished at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "##################################################"
