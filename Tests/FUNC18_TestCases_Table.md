# FUNC18 - Record Voucher Usage - Test Cases Table

| No | Test Case ID | Test Case Description | Type | Passed | Failed | Untested |
|----|--------------|----------------------|------|--------|--------|----------|
| 1 | FUNC18_TC01 | RecordVoucherUsageAsync_Success_ShouldCreateUsageRecord | N | ✓ | | |
| 2 | FUNC18_TC02 | RecordVoucherUsageAsync_MultipleUsages_ShouldIncrementCount | A | ✓ | | |
| 3 | FUNC18_TC03 | RecordVoucherUsageAsync_DifferentCustomers_ShouldCreateSeparateRecords | A | ✓ | | |
| 4 | FUNC18_TC04 | RecordVoucherUsageAsync_ShouldSetUsedAtTimestamp | A | ✓ | | |
| 5 | FUNC18_TC05 | RecordVoucherUsageAsync_WithZeroDiscount_ShouldStillRecord | A | ✓ | | |
| 6 | FUNC18_TC06 | RecordVoucherUsageAsync_VoucherNotFound_ShouldStillIncrement | B | ✓ | | |

**Summary:**
- **Total Test Cases:** 6
- **N (Normal):** 1
- **A (Alternative):** 4
- **B (Boundary/Exception):** 1
- **Passed:** 6
- **Failed:** 0
- **Untested:** 0

