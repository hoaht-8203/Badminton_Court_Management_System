# Test Commands

## Cách chạy test và xem số pass/fail

### 1. Lệnh đơn giản nhất (khuyên dùng):
```bash
dotnet test Tests/Tests.csproj --verbosity normal 2>&1 | grep -E "Total tests|Passed|Failed" | tail -3
```

### 2. Dùng script:
```bash
./Tests/test-summary.sh
```

### 3. Xem kết quả chi tiết:
```bash
dotnet test Tests/Tests.csproj --verbosity normal
```

### 4. Chỉ xem summary:
```bash
dotnet test Tests/Tests.csproj --verbosity minimal
```

### 5. Lọc chỉ số pass/fail:
```bash
dotnet test Tests/Tests.csproj --verbosity normal 2>&1 | awk '/Test Run/{flag=1} flag && /Total tests|Passed|Failed/{print} flag && /Total time/{print; exit}'
```

## Kết quả hiện tại:
- **Total tests:** 174
- **Passed:** 157 (90.2%)
- **Failed:** 17 (9.8%)

