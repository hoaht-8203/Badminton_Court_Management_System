#!/bin/bash

# Simple script to show test summary
echo "Running tests..."
echo ""

# Determine the correct path to Tests.csproj
if [ -f "Tests/Tests.csproj" ]; then
    # Running from project root
    TEST_PROJECT="Tests/Tests.csproj"
elif [ -f "Tests.csproj" ]; then
    # Running from Tests directory
    TEST_PROJECT="Tests.csproj"
else
    echo "Error: Cannot find Tests.csproj"
    exit 1
fi

# Run tests with minimal output
output=$(dotnet test "$TEST_PROJECT" --verbosity minimal 2>&1)

# Extract numbers using sed (compatible with macOS)
total=$(echo "$output" | sed -n 's/.*Total:[[:space:]]*\([0-9]*\).*/\1/p')
passed=$(echo "$output" | sed -n 's/.*Passed:[[:space:]]*\([0-9]*\).*/\1/p')
failed=$(echo "$output" | sed -n 's/.*Failed:[[:space:]]*\([0-9]*\).*/\1/p')

# Display summary
echo "════════════════════════"
echo "   TEST SUMMARY"
echo "════════════════════════"
echo "Total:  $total"
echo "Passed: $passed"
echo "Failed: $failed"
echo "════════════════════════"

# Calculate percentage if total > 0
if [ ! -z "$total" ] && [ "$total" -gt 0 ]; then
    percent=$(awk "BEGIN {printf \"%.1f\", ($passed/$total)*100}")
    echo "Pass Rate: ${percent}%"
    echo "════════════════════════"
fi

