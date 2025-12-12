#!/bin/bash

# Simple script to get test summary
dotnet test Tests/Tests.csproj --verbosity normal 2>&1 | grep -E "Test Run|Total tests|Passed|Failed|Total time" | tail -5

