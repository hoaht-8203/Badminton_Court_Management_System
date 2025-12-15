# Test Failures Summary

**Total Tests:** 174  
**Passed:** 157  
**Failed:** 17  
**Pass Rate:** 90.2%

## Failed Test Cases by Service

### 1. AuthService (FUNC01-05) - 5 failures

#### FUNC01_TC01: UserRegisterAsync_Success_ShouldCreateUserAndCustomer
- **Service:** AuthService
- **Error:** `NullReferenceException` at line 531 in AuthService.cs
- **Issue:** Object reference not set to an instance of an object

#### FUNC01_TC04: UserRegisterAsync_CreateUserFails_ShouldThrowException
- **Service:** AuthService
- **Error:** Threw `NullReferenceException` instead of expected `ApiException`
- **Issue:** Same NullReferenceException at line 531

#### FUNC01_TC05: UserRegisterAsync_WithMinimalRequiredFields_ShouldCreateUserSuccessfully
- **Service:** AuthService
- **Error:** `NullReferenceException` at line 531 in AuthService.cs
- **Issue:** Object reference not set to an instance of an object

#### FUNC03_TC01: UpdatePasswordAsync_Success_ShouldUpdatePassword
- **Service:** AuthService
- **Error:** `ApiException: Không được phép truy cập` at line 434
- **Issue:** Authorization/authentication context not properly set up

#### FUNC04_TC03: ForgotPasswordAsync_ResetPasswordFails_ShouldThrowException
- **Service:** AuthService
- **Error:** No exception thrown (expected `ApiException`)
- **Issue:** Mock setup for `ResetPasswordAsync` not working correctly

---

### 2. BookingCourtService (FUNC06-13) - 4 failures

#### FUNC06_TC01: CreateBookingCourtAsync_Success_ShouldCreateBooking
- **Service:** BookingCourtService
- **Error:** `ApiException: Booking vãng lai phải có StartDate = EndDate và DayOfWeek = null`
- **Issue:** Test data doesn't satisfy validation for "vãng lai" bookings

#### FUNC06_TC06: CreateBookingCourtAsync_WithVoucher_ShouldApplyDiscount
- **Service:** BookingCourtService
- **Error:** Same validation error as FUNC06_TC01
- **Issue:** Test data doesn't satisfy validation for "vãng lai" bookings

#### FUNC07_TC01: UserCreateBookingCourtAsync_Success_ShouldCreateBooking
- **Service:** BookingCourtService
- **Error:** Same validation error as FUNC06_TC01
- **Issue:** Test data doesn't satisfy validation for "vãng lai" bookings

#### FUNC09_TC01: CheckInOccurrenceAsync_Success_ShouldCheckIn
- **Service:** BookingCourtService
- **Error:** `ApiException: Chỉ có thể check-in trong khung giờ đã đặt`
- **Issue:** Check-in time doesn't fall within the booking time window

---

### 3. PaymentService (FUNC16) - 1 failure

#### FUNC16_TC08: CreatePaymentForOrderAsync_ShouldSendSignalRNotification
- **Service:** PaymentService
- **Error:** `MockException: Expected invocation on the mock at least once, but was never performed: x => x.Clients.All`
- **Issue:** SignalR hub context mock not properly set up or method not being called

---

### 4. UserMembershipService (FUNC21-22) - 4 failures

#### FUNC21_TC01: CreateForCurrentUserAsync_Success_ShouldCreateMembership
- **Service:** UserMembershipService
- **Error:** `NullReferenceException` in ConfigurationBinder.GetValue
- **Issue:** Configuration key "Booking:HoldMinutes" not properly mocked

#### FUNC22_TC01: ExtendPaymentAsync_Success_ShouldExtendPayment
- **Service:** UserMembershipService
- **Error:** `NullReferenceException` in ConfigurationBinder.GetValue at line 313
- **Issue:** Configuration key "Booking:HoldMinutes" not properly mocked

#### FUNC22_TC04: ExtendPaymentAsync_ShouldCreateNewPayment
- **Service:** UserMembershipService
- **Error:** Same NullReferenceException in ConfigurationBinder.GetValue
- **Issue:** Configuration key "Booking:HoldMinutes" not properly mocked

#### FUNC22_TC05: ExtendPaymentAsync_ShouldResetStatusToPending
- **Service:** UserMembershipService
- **Error:** Same NullReferenceException in ConfigurationBinder.GetValue
- **Issue:** Configuration key "Booking:HoldMinutes" not properly mocked

---

### 5. VoucherService (FUNC17) - 3 failures

#### FUNC17_TC01: ValidateAndCalculateDiscountAsync_Success_ShouldReturnValidResponse
- **Service:** VoucherService
- **Error:** `Assert.AreEqual failed. Expected:<10000>. Actual:<0>`
- **Issue:** Discount amount calculation returning 0 instead of expected 10000

#### FUNC17_TC07: ValidateAndCalculateDiscountAsync_PercentageDiscount_ShouldCalculateCorrectly
- **Service:** VoucherService
- **Error:** `Assert.AreEqual failed. Expected:<10000>. Actual:<0>`
- **Issue:** Percentage discount calculation returning 0 instead of expected 10000

#### FUNC17_TC08: ValidateAndCalculateDiscountAsync_PercentageWithMaxDiscount_ShouldCapAtMax
- **Service:** VoucherService
- **Error:** `Assert.AreEqual failed. Expected:<50000>. Actual:<0>`
- **Issue:** Max discount cap not working, returning 0 instead of expected 50000

---

## Summary by Service

| Service | Total Tests | Passed | Failed | Pass Rate |
|---------|-------------|--------|--------|-----------|
| AuthService | 24 | 19 | 5 | 79.2% |
| BookingCourtService | 26 | 22 | 4 | 84.6% |
| PaymentService | 8 | 7 | 1 | 87.5% |
| UserMembershipService | 11 | 7 | 4 | 63.6% |
| VoucherService | 14 | 11 | 3 | 78.6% |
| **Other Services** | **91** | **91** | **0** | **100%** |
| **TOTAL** | **174** | **157** | **17** | **90.2%** |

## Common Issues

1. **NullReferenceException in AuthService (line 531):** Need to check what object is null at this line
2. **Configuration mocking:** UserMembershipService tests need proper IConfiguration mock setup
3. **Booking validation:** BookingCourtService tests need correct test data for "vãng lai" bookings
4. **SignalR mocking:** PaymentService test needs proper SignalR hub context mock
5. **Voucher calculation:** VoucherService discount calculation logic may have issues

