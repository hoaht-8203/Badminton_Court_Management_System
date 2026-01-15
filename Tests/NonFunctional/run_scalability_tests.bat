@echo off
REM Scalability & Performance Test Runner for Windows
REM This script runs all the JMeter tests for the Scalability & Performance test cases

echo === Badminton Court Management System ===
echo === Scalability ^& Performance Tests ===
echo ==========================================

REM Configuration
set BASE_URL=%1
if "%BASE_URL%"=="" set BASE_URL=http://localhost:5000

set RESULTS_DIR=.\results
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%

REM Create results directory
if not exist "%RESULTS_DIR%" mkdir "%RESULTS_DIR%"

echo Base URL: %BASE_URL%
echo Results Directory: %RESULTS_DIR%
echo Timestamp: %TIMESTAMP%

echo.
echo ==========================================
echo Starting Performance Tests...
echo ==========================================

REM Test 1: NFT-QA-06 - Concurrent User Load
echo.
echo TEST 1/5: NFT-QA-06 - Concurrent User Load Test
echo Description: Test 1000 concurrent users logging in and viewing homepage for 10 minutes
call jmeter -n -t "NFT_QA_06_ConcurrentUserLoad.jmx" -l "%RESULTS_DIR%\concurrent_user_load_%TIMESTAMP%.jtl" -j "%RESULTS_DIR%\concurrent_user_load_%TIMESTAMP%.log" -Jbase_url="%BASE_URL%" -Jusers=1000 -Jramp_up=60 -Jduration=600

REM Test 2: NFT-QA-07 - Transaction Throughput
echo.
echo TEST 2/5: NFT-QA-07 - Transaction Throughput Test
echo Description: Test 50 booking creation requests per second (TPS) for throughput measurement
call jmeter -n -t "NFT_QA_07_TransactionThroughput.jmx" -l "%RESULTS_DIR%\transaction_throughput_%TIMESTAMP%.jtl" -j "%RESULTS_DIR%\transaction_throughput_%TIMESTAMP%.log" -Jbase_url="%BASE_URL%" -Jtps=50 -Jduration=300 -Jramp_up=30

REM Test 3: NFT-QA-08 - Data Growth Simulation
echo.
echo TEST 3/5: NFT-QA-08 - Data Growth Simulation Test
echo Description: Test database performance with large dataset (1M bookings) - Search operations
call jmeter -n -t "NFT_QA_08_DataGrowthSimulation.jmx" -l "%RESULTS_DIR%\data_growth_simulation_%TIMESTAMP%.jtl" -j "%RESULTS_DIR%\data_growth_simulation_%TIMESTAMP%.log" -Jbase_url="%BASE_URL%" -Jusers=20 -Jiterations=100

REM Test 4: NFT-QA-09 - Resource Auto-scaling
echo.
echo TEST 4/5: NFT-QA-09 - Resource Auto-scaling Test
echo Description: Test auto-scaling triggers by increasing load until CPU hits 80%
call jmeter -n -t "NFT_QA_09_ResourceAutoScaling.jmx" -l "%RESULTS_DIR%\resource_auto_scaling_%TIMESTAMP%.jtl" -j "%RESULTS_DIR%\resource_auto_scaling_%TIMESTAMP%.log" -Jbase_url="%BASE_URL%" -Jstart_threads=100 -Jmax_threads=2000 -Jincrement_threads=50 -Jduration=1200

REM Test 5: NFT-QA-10 - Batch Notification Performance
echo.
echo TEST 5/5: NFT-QA-10 - Batch Notification Performance Test
echo Description: Test batch notification to 1000 users simultaneously and measure queuing performance
call jmeter -n -t "NFT_QA_10_BatchNotification.jmx" -l "%RESULTS_DIR%\batch_notification_%TIMESTAMP%.jtl" -j "%RESULTS_DIR%\batch_notification_%TIMESTAMP%.log" -Jbase_url="%BASE_URL%" -Jnotification_users=1000 -Jbatch_size=100 -Jtest_iterations=5

echo.
echo ==========================================
echo All Performance Tests Completed!
echo ==========================================

echo.
echo Results Summary:
echo - Results directory: %RESULTS_DIR%
echo - Timestamp: %TIMESTAMP%
echo.

echo Generating summary report...
echo Performance Test Execution Summary - %TIMESTAMP% > "%RESULTS_DIR%\summary_%TIMESTAMP%.txt"
echo ================================================= >> "%RESULTS_DIR%\summary_%TIMESTAMP%.txt"
echo Base URL: %BASE_URL% >> "%RESULTS_DIR%\summary_%TIMESTAMP%.txt"
echo Execution Time: %date% %time% >> "%RESULTS_DIR%\summary_%TIMESTAMP%.txt"

echo.
echo Performance testing complete!
echo Review results in %RESULTS_DIR% directory
echo Analyze .jtl files for detailed metrics
echo Check .log files for execution details

pause