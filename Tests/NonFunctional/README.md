# Scalability & Performance Test Documentation

## Mục lục

1. [Tổng quan](#tổng-quan)
2. [Yêu cầu hệ thống](#yêu-cầu-hệ-thống)
3. [Cài đặt và chuẩn bị](#cài-đặt-và-chuẩn-bị)
4. [Các test case](#các-test-case)
5. [Cách chạy test](#cách-chạy-test)
6. [Phân tích kết quả](#phân-tích-kết-quả)
7. [Tiêu chí đánh giá](#tiêu-chí-đánh-giá)

## Tổng quan

Bộ test Scalability & Performance được thiết kế để kiểm tra khả năng mở rộng và hiệu suất của hệ thống Quản lý Sân Cầu Lông. Bộ test bao gồm 5 test case chính:

- **NFT-QA-06**: Concurrent User Load Test - Kiểm tra khả năng xử lý 1000 người dùng đồng thời
- **NFT-QA-07**: Transaction Throughput Test - Kiểm tra throughput 50 TPS cho việc tạo booking
- **NFT-QA-08**: Data Growth Simulation Test - Kiểm tra hiệu suất với 1M records
- **NFT-QA-09**: Resource Auto-scaling Test - Kiểm tra auto-scaling khi CPU đạt 80%
- **NFT-QA-10**: Batch Notification Performance Test - Kiểm tra gửi notification cho 1000 users

## Yêu cầu hệ thống

### Software Requirements

- **Apache JMeter 5.5+** - Load testing tool
- **Java 8+** - JMeter runtime requirement
- **Operating System**: Windows, macOS, hoặc Linux
- **Memory**: Tối thiểu 4GB RAM cho JMeter
- **Network**: Kết nối ổn định đến target system

### Test Data Requirements

- CSV files với test data (đã được tạo sẵn)
- Admin credentials hợp lệ
- Test user credentials hợp lệ

## Cài đặt và chuẩn bị

### 1. Cài đặt JMeter

```bash
# Download JMeter từ https://jmeter.apache.org/download_jmeter.cgi
# Extract và thêm vào PATH

# Kiểm tra installation
jmeter -v
```

### 2. Chuẩn bị test environment

```bash
# Di chuyển đến thư mục test
cd Tests/NonFunctional

# Đảm bảo các file CSV đã có sẵn
ls -la *.csv

# Tạo thư mục results
mkdir -p results
```

### 3. Chuẩn bị test data

Đảm bảo các file CSV sau đã có dữ liệu hợp lệ:

- `test_users.csv` - User credentials cho load test
- `admin_users.csv` - Admin credentials
- `court_slots.csv` - Court booking slots
- `search_terms.csv` - Search test data

## Các test case

### NFT-QA-06: Concurrent User Load Test

**Mục tiêu**: Kiểm tra khả năng xử lý 1000 concurrent users trong 10 phút

**Tham số**:

- Users: 1000
- Ramp-up: 60 giây
- Duration: 600 giây (10 phút)

**Kịch bản**:

1. Login với user credentials
2. Xem homepage data
3. Get user profile
4. Random think time giữa các requests

**Tiêu chí thành công**:

- Average response time < 2 seconds
- Error rate < 1%
- System không crash

### NFT-QA-07: Transaction Throughput Test

**Mục tiêu**: Kiểm tra throughput 50 TPS cho booking creation

**Tham số**:

- TPS: 50 transactions/second
- Duration: 300 giây (5 phút)
- Ramp-up: 30 giây

**Kịch bản**:

1. Login
2. Create booking (main transaction)
3. Verify booking creation

**Tiêu chí thành công**:

- Maintain ≥ 50 TPS throughout test
- CPU không duy trì 100% quá 5 giây
- Booking success rate > 95%

### NFT-QA-08: Data Growth Simulation Test

**Mục tiêu**: Kiểm tra hiệu suất search với large dataset (1M bookings)

**Tham số**:

- Users: 20
- Iterations: 100 per user

**Kịch bản**:

1. Admin login
2. Search booking by ID
3. Search bookings by customer name
4. Search users by email
5. Large pagination test

**Tiêu chí thành công**:

- Search by ID < 50ms
- Search by name < 200ms (with index)
- Large pagination < 500ms

### NFT-QA-09: Resource Auto-scaling Test

**Mục tiêu**: Trigger auto-scaling khi CPU hits 80%

**Tham số**:

- Start threads: 100
- Max threads: 2000
- Increment: 50 threads
- Duration: 1200 giây (20 phút)

**Kịch bản**:

1. Stepping load pattern
2. CPU-intensive operations:
   - Complex search queries
   - Dashboard statistics
   - Multiple booking creations
3. Health monitoring

**Tiêu chí thành công**:

- New instance provisioned trong 3 phút khi CPU > 80%
- Load balancing to new instance
- System stability throughout test

### NFT-QA-10: Batch Notification Performance Test

**Mục tiêu**: Kiểm tra batch notification cho 1000 users

**Tham số**:

- Notification users: 1000
- Batch size: 100
- Test iterations: 5

**Kịch bản**:

1. Admin login
2. Send broadcast notification
3. Monitor batch job status
4. Check system resources

**Tiêu chí thành công**:

- All 1000 jobs queued trong < 5 giây
- System không crash
- Resource usage ổn định

## Cách chạy test

### Chạy toàn bộ test suite

#### Linux/macOS:

```bash
chmod +x run_scalability_tests.sh
./run_scalability_tests.sh [BASE_URL]

# Ví dụ:
./run_scalability_tests.sh http://localhost:5000
```

#### Windows:

```cmd
run_scalability_tests.bat [BASE_URL]

# Ví dụ:
run_scalability_tests.bat http://localhost:5000
```

### Chạy test riêng lẻ

```bash
# Test 1: Concurrent User Load
jmeter -n -t NFT_QA_06_ConcurrentUserLoad.jmx \
       -l results/concurrent_load_$(date +%Y%m%d_%H%M%S).jtl \
       -Jbase_url=http://localhost:5000 \
       -Jusers=1000 -Jramp_up=60 -Jduration=600

# Test 2: Transaction Throughput
jmeter -n -t NFT_QA_07_TransactionThroughput.jmx \
       -l results/throughput_$(date +%Y%m%d_%H%M%S).jtl \
       -Jbase_url=http://localhost:5000 \
       -Jtps=50 -Jduration=300

# Test 3: Data Growth Simulation
jmeter -n -t NFT_QA_08_DataGrowthSimulation.jmx \
       -l results/data_growth_$(date +%Y%m%d_%H%M%S).jtl \
       -Jbase_url=http://localhost:5000 \
       -Jusers=20 -Jiterations=100

# Test 4: Resource Auto-scaling
jmeter -n -t NFT_QA_09_ResourceAutoScaling.jmx \
       -l results/auto_scaling_$(date +%Y%m%d_%H%M%S).jtl \
       -Jbase_url=http://localhost:5000 \
       -Jstart_threads=100 -Jmax_threads=2000

# Test 5: Batch Notification
jmeter -n -t NFT_QA_10_BatchNotification.jmx \
       -l results/batch_notification_$(date +%Y%m%d_%H%M%S).jtl \
       -Jbase_url=http://localhost:5000 \
       -Jnotification_users=1000
```

### Tùy chỉnh parameters

Các parameter có thể được điều chỉnh qua command line:

```bash
# Concurrent User Load parameters
-Jusers=500              # Số lượng concurrent users
-Jramp_up=30            # Thời gian ramp-up (seconds)
-Jduration=300          # Thời gian test (seconds)

# Transaction Throughput parameters
-Jtps=25                # Target TPS
-Jduration=180          # Test duration (seconds)

# Data Growth parameters
-Jusers=10              # Số users thực hiện search
-Jiterations=50         # Số iterations per user

# Auto-scaling parameters
-Jstart_threads=50      # Số threads bắt đầu
-Jmax_threads=1000      # Số threads tối đa
-Jincrement_threads=25  # Số threads tăng mỗi step

# Batch Notification parameters
-Jnotification_users=500 # Số users nhận notification
-Jbatch_size=50         # Batch size
-Jtest_iterations=3     # Số lần test
```

## Phân tích kết quả

### JTL File Analysis

File kết quả .jtl có thể được phân tích bằng:

1. **JMeter GUI**: Load file vào Aggregate Report hoặc Summary Report
2. **Command line tools**:
   ```bash
   # Generate HTML report
   jmeter -g results/concurrent_load_20250107_143025.jtl \
          -o results/html_report/
   ```

### Key Metrics để theo dõi

#### Response Time Metrics:

- **Average Response Time**: Thời gian phản hồi trung bình
- **90th Percentile**: 90% requests hoàn thành trong thời gian này
- **95th Percentile**: 95% requests hoàn thành trong thời gian này
- **99th Percentile**: 99% requests hoàn thành trong thời gian này

#### Throughput Metrics:

- **Requests/Second**: Số requests được xử lý mỗi giây
- **Bytes/Second**: Bandwidth consumption
- **Transactions/Second**: Số transactions thành công mỗi giây

#### Error Metrics:

- **Error Rate**: Tỷ lệ lỗi (%)
- **Error Types**: Phân loại các loại lỗi
- **Failed Requests**: Số requests thất bại

#### Resource Metrics:

- **CPU Usage**: Mức sử dụng CPU
- **Memory Usage**: Mức sử dụng RAM
- **Network I/O**: Lưu lượng mạng
- **Disk I/O**: Lưu lượng đĩa

### Sample Analysis Commands

```bash
# Extract basic stats from JTL file
awk -F',' 'NR>1 {sum+=$2; count++; if($8=="false") errors++}
           END {print "Avg Response Time:", sum/count "ms";
                print "Error Rate:", (errors/count)*100 "%"}' \
           results/concurrent_load_20250107_143025.jtl

# Count total requests
wc -l results/concurrent_load_20250107_143025.jtl

# Find slow requests (> 2000ms)
awk -F',' 'NR>1 && $2>2000 {print $1","$2","$3}' \
    results/concurrent_load_20250107_143025.jtl
```

## Tiêu chí đánh giá

### NFT-QA-06: Concurrent User Load

✅ **Passed** nếu:

- Average response time ≤ 2000ms
- Error rate ≤ 1%
- 99% requests completed successfully
- No system crashes

❌ **Failed** nếu:

- Average response time > 2000ms
- Error rate > 1%
- System crashes hoặc unresponsive

### NFT-QA-07: Transaction Throughput

✅ **Passed** nếu:

- Maintains ≥ 50 TPS throughout test
- CPU usage doesn't stay at 100% > 5 seconds
- Booking success rate > 95%

❌ **Failed** nếu:

- TPS drops below 50 for extended periods
- CPU saturated consistently
- High booking failure rate

### NFT-QA-08: Data Growth Simulation

✅ **Passed** nếu:

- Search by ID < 50ms (95th percentile)
- Search by name < 200ms (95th percentile)
- Large pagination < 500ms
- No database timeouts

❌ **Failed** nếu:

- Search times exceed thresholds
- Database errors or timeouts
- Significant performance degradation

### NFT-QA-09: Resource Auto-scaling

✅ **Passed** nếu:

- New instance provisioned within 3 minutes of CPU > 80%
- Traffic load-balanced to new instance
- System remains stable throughout

❌ **Failed** nếu:

- Auto-scaling doesn't trigger
- New instance takes > 3 minutes
- System instability

### NFT-QA-10: Batch Notification

✅ **Passed** nếu:

- All 1000 jobs queued < 5 seconds
- System remains stable
- No memory leaks hoặc crashes

❌ **Failed** nếu:

- Queuing takes > 5 seconds
- System crashes
- Resource exhaustion

## Troubleshooting

### Common Issues

1. **OutOfMemoryError trong JMeter**:

   ```bash
   export JVM_ARGS="-Xms1g -Xmx4g"
   jmeter -n -t test.jmx ...
   ```

2. **Connection timeout/refused**:

   - Kiểm tra target system availability
   - Verify BASE_URL parameter
   - Check firewall/network settings

3. **High error rates**:

   - Kiểm tra test data validity
   - Verify API endpoints
   - Check authentication tokens

4. **Slow JMeter performance**:
   - Disable View Results Tree listeners
   - Use non-GUI mode
   - Increase JMeter heap size

### Performance Tuning Tips

1. **JMeter Tuning**:

   ```bash
   # JMeter properties
   -Jhttpclient.reset_state_on_thread_group_iteration=true
   -Jhttpclient.retry.count=1
   -Jhttpclient.timeout=30000
   ```

2. **System Under Test Tuning**:

   - Monitor resource usage
   - Optimize database queries
   - Configure connection pooling
   - Enable caching where appropriate

3. **Network Considerations**:
   - Sử dụng keep-alive connections
   - Minimize request/response payload
   - Consider geographic proximity

## Best Practices

1. **Preparation**:

   - Validate test environment trước khi chạy full load
   - Backup data trước performance tests
   - Coordinate with team về test schedule

2. **Execution**:

   - Start với smaller loads để validate setup
   - Monitor system resources trong test
   - Document any issues encountered

3. **Analysis**:

   - So sánh results với baseline performance
   - Identify bottlenecks và root causes
   - Prioritize optimizations based on business impact

4. **Reporting**:
   - Include both technical metrics và business impact
   - Provide clear recommendations
   - Track performance improvements over time
