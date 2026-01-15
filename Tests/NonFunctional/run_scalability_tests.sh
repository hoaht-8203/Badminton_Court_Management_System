#!/bin/bash

# Scalability & Performance Test Runner
# This script runs all the JMeter tests for the Scalability & Performance test cases

echo "=== Badminton Court Management System ==="
echo "=== Scalability & Performance Tests ==="
echo "=========================================="

# Configuration
BASE_URL=${1:-"http://localhost:5039"}
RESULTS_DIR="./results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Extract components from BASE_URL
# Format: protocol://domain[:port]
PROTOCOL=$(echo "$BASE_URL" | grep :// | sed -e's,^\(.*\)://.*,\1,g')
[ -z "$PROTOCOL" ] && PROTOCOL="http"
URL=$(echo "$BASE_URL" | sed -e 's,^.*://,,g')
DOMAIN=$(echo "$URL" | cut -d: -f1)
PORT=$(echo "$URL" | cut -s -d: -f2)
[ -z "$PORT" ] && [ "$PROTOCOL" == "http" ] && PORT="80"
[ -z "$PORT" ] && [ "$PROTOCOL" == "https" ] && PORT="443"

# Create results directory
mkdir -p "$RESULTS_DIR"

echo "Base URL: $BASE_URL"
echo "Protocol: $PROTOCOL"
echo "Domain: $DOMAIN"
echo "Port: $PORT"
echo "Results Directory: $RESULTS_DIR"
echo "Timestamp: $TIMESTAMP"

# Function to run JMeter test
run_jmeter_test() {
    local test_file=$1
    local test_name=$2
    local additional_params=$3
    
    echo ""
    echo "--- Running $test_name ---"
    echo "Test File: $test_file"
    
    if [ ! -f "$test_file" ]; then
        echo "ERROR: Test file $test_file not found!"
        return 1
    fi
    
    local result_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.jtl"
    local log_file="$RESULTS_DIR/${test_name}_${TIMESTAMP}.log"
    
    # Run JMeter test
    jmeter -n -t "$test_file" \
           -l "$result_file" \
           -j "$log_file" \
           -Jprotocol="$PROTOCOL" \
           -Jdomain="$DOMAIN" \
           -Jport="$PORT" \
           -Jbase_url="$BASE_URL" \
           $additional_params
    
    local exit_code=$?
    
    if [ $exit_code -eq 0 ]; then
        echo "✅ $test_name completed successfully"
        echo "Results: $result_file"
        echo "Log: $log_file"
    else
        echo "❌ $test_name failed with exit code $exit_code"
        echo "Check log file: $log_file"
    fi
    
    return $exit_code
}

echo ""
echo "=========================================="
echo "Starting Performance Tests..."
echo "=========================================="

# Test 1: NFT-QA-06 - Concurrent User Load
echo ""
echo "TEST 1/5: NFT-QA-06 - Concurrent User Load Test"
echo "Description: Test 1000 concurrent users viewing homepage for 1 minute"
run_jmeter_test "NFT_QA_06_ConcurrentUserLoad.jmx" "concurrent_user_load" "-Jusers=1000 -Jramp_up=30 -Jduration=60"

# Test 2: NFT-QA-07 - Transaction Throughput
echo ""
echo "TEST 2/5: NFT-QA-07 - Transaction Throughput Test"
echo "Description: Test 10 booking creation requests per second (TPS) (Local Scale)"
run_jmeter_test "NFT_QA_07_TransactionThroughput.jmx" "transaction_throughput" "-Jtps=10 -Jduration=60 -Jramp_up=10"

# Test 3: NFT-QA-08 - Data Growth Simulation
echo ""
echo "TEST 3/5: NFT-QA-08 - Data Growth Simulation Test"
echo "Description: Test database performance with 100,000 bookings - Search operations"
run_jmeter_test "NFT_QA_08_DataGrowthSimulation.jmx" "data_growth_simulation" "-Jusers=10 -Jiterations=50"

# Test 4: NFT-QA-09 - Resource Auto-scaling
echo ""
echo "TEST 4/5: NFT-QA-09 - Resource Auto-scaling Test"
echo "Description: Test high CPU load via DevTest controller"
run_jmeter_test "NFT_QA_09_ResourceAutoScaling.jmx" "resource_auto_scaling" "-Jusers=50 -Jramp_up=10 -Jduration=60"

# Test 5: NFT-QA-10 - Batch Notification Performance
echo ""
echo "TEST 5/5: NFT-QA-10 - Batch Notification Performance Test"
echo "Description: Test batch notification to 1000 users simultaneously and measure queuing performance"
run_jmeter_test "NFT_QA_10_BatchNotification.jmx" "batch_notification" "-Jnotification_users=1000 -Jbatch_size=100 -Jtest_iterations=5"

echo ""
echo "=========================================="
echo "All Performance Tests Completed!"
echo "=========================================="

echo ""
echo "Results Summary:"
echo "- Results directory: $RESULTS_DIR"
echo "- Timestamp: $TIMESTAMP"
echo ""

# Generate summary report
echo "Generating summary report..."
echo "Performance Test Execution Summary - $TIMESTAMP" > "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "=================================================" >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "Base URL: $BASE_URL" >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "Execution Time: $(date)" >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "" >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
echo "Test Files:" >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"
ls -la "$RESULTS_DIR"/*_${TIMESTAMP}.* >> "$RESULTS_DIR/summary_${TIMESTAMP}.txt"

echo "Summary report: $RESULTS_DIR/summary_${TIMESTAMP}.txt"

echo ""
echo "🎯 Performance testing complete!"
echo "📊 Review results in $RESULTS_DIR directory"
echo "📈 Analyze .jtl files for detailed metrics"
echo "📝 Check .log files for execution details"