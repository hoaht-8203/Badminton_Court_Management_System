#!/bin/bash

# Quick script to show only test counts
result=$(dotnet test Tests/Tests.csproj --verbosity minimal 2>&1 | tail -3)
echo "$result" | grep -E "Total tests|Passed|Failed"

