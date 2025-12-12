#!/bin/bash

# Script to run tests and display pass/fail summary
echo "Running tests..."
echo "===================="

# Run tests and capture output
TEST_OUTPUT=$(dotnet test Tests/Tests.csproj --verbosity normal 2>&1)

# Extract summary
TOTAL=$(echo "$TEST_OUTPUT" | grep -oP "Total tests: \K\d+")
PASSED=$(echo "$TEST_OUTPUT" | grep -oP "Passed: \K\d+")
FAILED=$(echo "$TEST_OUTPUT" | grep -oP "Failed: \K\d+")

# Display results
echo ""
echo "===================="
echo "TEST RESULTS SUMMARY"
echo "===================="
echo "Total tests:  $TOTAL"
echo "Passed:       $PASSED"
echo "Failed:       $FAILED"
echo "===================="

# Calculate percentage
if [ ! -z "$TOTAL" ] && [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
    echo "Pass rate:    ${PERCENTAGE}%"
    echo "===================="
fi

# Show failed tests
if [ ! -z "$FAILED" ] && [ "$FAILED" -gt 0 ]; then
    echo ""
    echo "Failed tests:"
    echo "$TEST_OUTPUT" | grep "Failed FUNC" | sed 's/^/  /'
fi

