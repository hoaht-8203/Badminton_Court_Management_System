# Unit Test Documentation - Badminton Court Management System

## Tổng quan

Tài liệu này mô tả chi tiết các unit test đã được triển khai cho hệ thống quản lý sân cầu lông, sử dụng MSTest framework và Moq library.

### Thống kê tổng quan

| Metric | Value |
|--------|-------|
| **Total Test Cases** | 174 |
| **Passed** | 157 (90.2%) |
| **Failed** | 17 (9.8%) |
| **Test Files** | 19 |
| **Services Tested** | 19 |

### Cấu trúc Test Files

```
Tests/
├── AuthServiceTests.cs              (FUNC01-05)
├── BookingCourtServiceTests.cs     (FUNC06-13)
├── OrderServiceTests.cs            (FUNC14-15)
├── PaymentServiceTests.cs          (FUNC16)
├── VoucherServiceTests.cs         (FUNC17-18)
├── MembershipServiceTests.cs       (FUNC19-20)
├── UserMembershipServiceTests.cs   (FUNC21-22)
├── StaffServiceTests.cs            (FUNC23-24)
├── ScheduleServiceTests.cs         (FUNC25-26)
├── ShiftServiceTests.cs           (FUNC27-28)
├── AttendanceServiceTests.cs       (FUNC29-30)
├── InventoryCardServiceTests.cs    (FUNC31-32)
├── StockOutServiceTests.cs        (FUNC33)
├── ReturnGoodsServiceTests.cs     (FUNC34)
├── PriceTableServiceTests.cs      (FUNC35)
├── ServiceServiceTests.cs         (FUNC36-37)
├── CustomerServiceTests.cs        (FUNC38)
├── ProductServiceTests.cs         (FUNC39)
├── CourtServiceTests.cs           (FUNC40)
└── TestHelpers.cs                 (Helper methods)
```

---

## FUNC_01: UserRegisterAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC01 | UserRegisterAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure registration enforces unique email/username and password policy then issues OTP.

**Test Results:**
- **Passed:** 2
- **Failed:** 3
- **Total:** 5

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should create user and customer | N | ❌ Failed |
| UTCID02 | Email exists - Should throw exception | A | ✅ Passed |
| UTCID03 | Username exists - Should throw exception | A | ✅ Passed |
| UTCID04 | Create user fails - Should throw exception | A | ❌ Failed |
| UTCID05 | With optional fields - Should create successfully | N | ❌ Failed |

**Preconditions:**
- Server connection available
- Database connection available
- Email not exists in DB (UTCID01, UTCID03-05)
- Username not exists in DB (UTCID01, UTCID04-05)

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:----------|:--------|:--------|:--------|:--------|:--------|
| UserName | valid_user | existing_user | valid_user | valid_user | valid_user |
| FullName | Nguyen Van Dung | Nguyen Van Dung | Nguyen Van Dung | Nguyen Van Dung | Nguyen Van Dung |
| Email | nguyenvandung@gmail.com | leconghieu@gmail.com | nguyenvandung@gmail.com | invalid-email | nguyenvandung@gmail.com |
| Password | Password@123 | Password@123 | Password@123 | 123 | Password@123 |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:--------|:--------|:--------|:--------|:--------|:--------|
| CurrentUserResponse not null | ✅ | ❌ | ❌ | ❌ | ✅ |
| UserId != Guid.Empty | ✅ | ❌ | ❌ | ❌ | ✅ |
| EmailConfirmed = false | ✅ | ❌ | ❌ | ❌ | ✅ |
| Exception: Email already exists | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exception: Username already exists | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exception: Invalid email format | ❌ | ❌ | ❌ | ✅ | ❌ |
| Exception: Password too weak | ❌ | ❌ | ❌ | ❌ | ✅ |
| ApplicationUserToken created | ✅ | ❌ | ❌ | ❌ | ✅ |
| Verification email sent | ✅ | ❌ | ❌ | ❌ | ✅ |

---

## FUNC_02: LoginAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC02 | LoginAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure login validates credentials, checks user status, and issues authentication tokens.

**Test Results:**
- **Passed:** 5
- **Failed:** 0
- **Total:** 5

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should return user with tokens | N | ✅ Passed |
| UTCID02 | Invalid credentials - Should throw exception | A | ✅ Passed |
| UTCID03 | Wrong password - Should throw exception | A | ✅ Passed |
| UTCID04 | Inactive user - Should throw exception | A | ✅ Passed |
| UTCID05 | With temp password - Should log warning | B | ✅ Passed |

**Preconditions:**
- Server connection available
- Database connection available
- User exists in DB (UTCID01, UTCID03-05)
- User status is Active (UTCID01, UTCID02)

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 |
|:----------|:--------|:--------|:--------|:--------|
| Email | nguyenvandung@gmail.com | leconghieu@gmail.com | nguyenvandung@gmail.com | nguyenvandung@gmail.com |
| Password | Dung@123 | Dung@123 | Dung123 | Dung@123 |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 |
|:--------|:--------|:--------|:--------|:--------|
| CurrentUserResponse not null | ✅ | ❌ | ❌ | ❌ |
| UserId != Guid.Empty | ✅ | ❌ | ❌ | ❌ |
| Email = input | ✅ | ❌ | ❌ | ❌ |
| Roles not empty | ✅ | ❌ | ❌ | ❌ |
| ACCESS_TOKEN cookie set | ✅ | ❌ | ❌ | ❌ |
| REFRESH_TOKEN cookie set | ✅ | ❌ | ❌ | ❌ |
| Exception: Email or password incorrect | ❌ | ✅ | ✅ | ❌ |
| Exception: Account is inactive | ❌ | ❌ | ❌ | ✅ |
| RefreshToken saved to DB | ✅ | ❌ | ❌ | ❌ |

---

## FUNC_03: UpdatePasswordAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC03 | UpdatePasswordAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure password updates require valid refresh token, authenticated active users, and rotate auth cookies while cleaning up temporary tokens.

**Test Results:**
- **Passed:** 5
- **Failed:** 1
- **Total:** 6

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should update password | N | ❌ Failed |
| UTCID02 | No refresh token - Should throw exception | A | ✅ Passed |
| UTCID03 | Invalid refresh token - Should throw exception | A | ✅ Passed |
| UTCID04 | Inactive user - Should throw exception | A | ✅ Passed |
| UTCID05 | Password change fails - Should throw exception | A | ✅ Passed |
| UTCID06 | User not found for token - Should throw exception | A | ✅ Passed |

**Preconditions:**
- Server connection available
- Database connection available
- User principal authenticated (UTCID01, UTCID03-06)
- User status is Active (UTCID01, UTCID02, UTCID04-06)
- Refresh token record exists in DB (UTCID01, UTCID03-06)

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:----------|:--------|:--------|:--------|:--------|:--------|:--------|
| OldPassword | Dung@123 | Dung@123 | Dung@123 | Dung@123 | Dungg@123 | Dung@123 |
| NewPassword | DungNew@123 | DungNew@123 | DungNew@123 | DungNew@123 | DungNew@123 | DungNew@123 |
| RefreshToken | valid-refresh-token | null/missing | valid-refresh-token | valid-refresh-token | valid-refresh-token | valid-refresh-token |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:--------|:--------|:--------|:--------|:--------|:--------|:--------|
| ACCESS_TOKEN cookie set with new JWT | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| REFRESH_TOKEN cookie rotated (7 days) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exception: Mã refresh token không tồn tại | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Exception: Không được phép truy cập | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exception: Tài khoản dừng hoạt động | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exception: Cập nhật mật khẩu thất bại | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Exception: Không thể lấy thông tin người dùng | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Temp password tokens removed | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## FUNC_04: ForgotPasswordAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC04 | ForgotPasswordAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure password reset requires valid email, creates reset token, and sends email notification.

**Test Results:**
- **Passed:** 3
- **Failed:** 1
- **Total:** 4

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should create reset token | N | ✅ Passed |
| UTCID02 | Email not found - Should throw exception | A | ✅ Passed |
| UTCID03 | Reset password fails - Should throw exception | A | ❌ Failed |
| UTCID04 | Empty email - Should throw exception | B | ✅ Passed |

**Preconditions:**
- Server connection available
- Database connection available

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 |
|:----------|:--------|:--------|:--------|:--------|
| Email | levanh@gmail.com | leconghieu@gmail.com | phamthic@gmail.com | <empty> |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 |
|:--------|:--------|:--------|:--------|:--------|
| ResetPassword OTP stored (TokenType=ResetPassword) | ✅ | ❌ | ✅ | ❌ |
| OTP expires after 10 minutes | ✅ | ❌ | ✅ | ❌ |
| Forgot password email queued | ✅ | ❌ | ✅ | ❌ |
| Exception: Email không tồn tại | ❌ | ✅ | ✅ | ❌ |
| ApplicationUserToken persisted for reset | ✅ | ❌ | ✅ | ❌ |

---

## FUNC_05: VerifyEmailAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC05 | VerifyEmailAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure email verification validates token, confirms email, and creates customer record.

**Test Results:**
- **Passed:** 6
- **Failed:** 0
- **Total:** 6

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should confirm email and create customer | N | ✅ Passed |
| UTCID02 | Invalid email - Should throw exception | A | ✅ Passed |
| UTCID03 | Email not found - Should throw exception | A | ✅ Passed |
| UTCID04 | Invalid token - Should throw exception | A | ✅ Passed |
| UTCID05 | Expired token - Should throw exception | A | ✅ Passed |
| UTCID06 | User already has customer - Should not create duplicate | B | ✅ Passed |

**Preconditions:**
- Server connection available
- Database connection available

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:----------|:--------|:--------|:--------|:--------|:--------|:--------|
| Email | daoxuand@gmail.com | leconghieu@gmail.com | hoangthie@gmail.com | daoxuand@gmail.com | daoxuand@gmail.com | daoxuand@gmail.com |
| Token | VALID-OTP | <empty> | VALID-OTP | WRONG-OTP | EXPIRED-OTP | VALID-OTP |
| TokenRecordState | Record matches user/token | No token record found | Record matches user/token | No token record found | Record matches user/token | Record matches user/token |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:--------|:--------|:--------|:--------|:--------|:--------|:--------|
| EmailConfirmed flag set to true | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Verification token removed from DB | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Exception: Email hoặc token không hợp lệ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Exception: Email không tồn tại | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exception: Mã xác thực email không hợp lệ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exception: Mã xác thực email đã hết hạn | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| User EmailConfirmed persisted | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| ApplicationUserToken deleted | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## FUNC_06: CreateBookingCourtAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| BookingCourtService | FUNC06 | CreateBookingCourtAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Receptionist booking creation validates court availability, schedule overlap, and voucher rules before generating occurrences and payment records.

**Test Results:**
- **Passed:** 4
- **Failed:** 2
- **Total:** 6

| Test Case ID | Description | Type | Status |
|:-------------|:------------|:-----|:-------|
| UTCID01 | Success - Should create booking | N | ❌ Failed |
| UTCID02 | Court not found - Should throw exception | A | ✅ Passed |
| UTCID03 | Court inactive - Should throw exception | A | ✅ Passed |
| UTCID04 | Invalid time range - Should throw exception | A | ✅ Passed |
| UTCID05 | Past date - Should throw exception | A | ✅ Passed |
| UTCID06 | With voucher - Should apply discount | N | ❌ Failed |

**Preconditions:**
- Server connection available
- Database connection available
- Court exists (UTCID01, UTCID03-06)
- Court status is Active (UTCID01, UTCID03-06)
- Pricing configured for requested slot (UTCID01-06)
- No conflicting booking (UTCID01-02, UTCID05-06)
- Voucher passes validation (UTCID01-03, UTCID05-06)

**Input:**

| Parameter | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:----------|:--------|:--------|:--------|:--------|:--------|:--------|
| CourtId | A01 | 00000000-0000-0000-0000-000000000001 | A01 | A01 | A01 | A01 |
| StartDate | T0+1 | T0+1 | T0+1 | T0+1 | T0+1 | T0+1 |
| StartTime | 18:00 | 18:00 | 20:00 | 18:00 | 18:00 | 18:00 |
| EndTime | 20:00 | 20:00 | 18:00 | 20:00 | 20:00 | 20:00 |
| PayInFull | true | true | true | true | true | true |
| PaymentMethod | Bank | Bank | Bank | Bank | Bank | Bank |
| VoucherId | 123 (valid) | 123 (valid) | 123 (valid) | 123 (valid) | 123 (valid) | 123 (ValidateVoucher.IsValid=false) |

**Expected Results:**

| Confirm | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:--------|:--------|:--------|:--------|:--------|:--------|:--------|
| Response not null with booking details | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Status PendingPayment & HoldExpiresAtUtc set | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payment created with requested deposit/full preference | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Exception: Sân này không tồn tại | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Exception: Giờ bắt đầu phải nhỏ hơn giờ kết thúc | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| Exception: Khoảng thời gian/sân đã được đặt trước | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Exception: Voucher không hợp lệ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| BookingCourt + occurrences persisted | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Payment + hold expiry saved | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## Tổng kết các FUNC còn lại (FUNC07-40)

### FUNC07-13: BookingCourtService
- **FUNC07:** UserCreateBookingCourtAsync (6 test cases)
- **FUNC08:** CancelBookingCourtAsync (4 test cases)
- **FUNC09:** CheckInOccurrenceAsync (3 test cases)
- **FUNC10:** CheckOutOccurrenceAsync (4 test cases)
- **FUNC11:** MarkOccurrenceNoShowAsync (3 test cases)
- **FUNC12:** AddOrderItemAsync (5 test cases)
- **FUNC13:** UpdateOrderItemAsync (6 test cases)

### FUNC14-15: OrderService
- **FUNC14:** CheckoutAsync (7 test cases)
- **FUNC15:** ExtendPaymentTimeAsync (5 test cases)

### FUNC16: PaymentService
- **FUNC16:** CreatePaymentForOrderAsync (8 test cases)

### FUNC17-18: VoucherService
- **FUNC17:** ValidateAndCalculateDiscountAsync (8 test cases)
- **FUNC18:** RecordVoucherUsageAsync (6 test cases)

### FUNC19-20: MembershipService
- **FUNC19:** CreateAsync (5 test cases)
- **FUNC20:** UpdateStatusAsync (5 test cases)

### FUNC21-22: UserMembershipService
- **FUNC21:** CreateForCurrentUserAsync (6 test cases)
- **FUNC22:** ExtendPaymentAsync (5 test cases)

### FUNC23-24: StaffService
- **FUNC23:** CreateStaffAsync (6 test cases)
- **FUNC24:** ChangeStaffStatusAsync (4 test cases)

### FUNC25-26: ScheduleService
- **FUNC25:** AssignShiftToStaffAsync (4 test cases)
- **FUNC26:** RemoveStaffFromShiftAsync (4 test cases)

### FUNC27-28: ShiftService
- **FUNC27:** CreateShiftAsync (4 test cases)
- **FUNC28:** DeleteShiftAsync (3 test cases)

### FUNC29-30: AttendanceService
- **FUNC29:** CheckInAsync (4 test cases)
- **FUNC30:** CheckOutAsync (4 test cases)

### FUNC31-32: InventoryCardService
- **FUNC31:** CreateInventoryCardForSaleAsync (5 test cases)
- **FUNC32:** CreateInventoryCardForPurchaseAsync (4 test cases)

### FUNC33: StockOutService
- **FUNC33:** CompleteAsync (4 test cases)

### FUNC34: ReturnGoodsService
- **FUNC34:** CompleteAsync (5 test cases)

### FUNC35: PriceTableService
- **FUNC35:** SetProductsAsync (4 test cases)

### FUNC36-37: ServiceService
- **FUNC36:** AddBookingServiceAsync (5 test cases)
- **FUNC37:** EndServiceAsync (3 test cases)

### FUNC38: CustomerService
- **FUNC38:** ChangeCustomerStatusAsync (4 test cases)

### FUNC39: ProductService
- **FUNC39:** UpdateWebDisplayAsync (3 test cases)

### FUNC40: CourtService
- **FUNC40:** ChangeCourtStatusAsync (4 test cases)

---

## Cách chạy Test

### 1. Chạy tất cả tests:
```bash
dotnet test Tests/Tests.csproj
```

### 2. Chạy với output chi tiết:
```bash
dotnet test Tests/Tests.csproj --verbosity normal
```

### 3. Xem summary:
```bash
./Tests/test-summary.sh
```

### 4. Chạy test cho một service cụ thể:
```bash
dotnet test Tests/Tests.csproj --filter "FullyQualifiedName~AuthServiceTests"
```

---

## Test Helpers

File `TestHelpers.cs` cung cấp các helper methods:

- `BuildDbContext(ICurrentUser?)`: Tạo ApplicationDbContext với in-memory database
- `BuildMapper()`: Tạo IMapper với tất cả mapping profiles
- `CreateUser(...)`: Tạo ApplicationUser test data
- `CreateCustomer(...)`: Tạo Customer test data
- `CreateCourt(...)`: Tạo Court test data

---

## Dependencies và Mocking

### Các dependencies được mock:
- `IPaymentService`
- `IVoucherService`
- `INotificationService`
- `IHubContext<BookingHub>`
- `IConfiguration`
- `ICurrentUser`
- `UserManager<ApplicationUser>`
- `IAuthTokenProcessor`
- `IHttpContextAccessor`
- `IEmailService`
- `ILogger`
- `IInventoryCardService`
- `ICashflowService`
- `IStorageService`

### Database Testing:
- Sử dụng Entity Framework Core In-Memory Database
- Mỗi test case có database riêng biệt
- Test data được seed trong `SetUp` method

---

## Kết quả Test hiện tại

**Tổng số test:** 174
- ✅ **Passed:** 157 (90.2%)
- ❌ **Failed:** 17 (9.8%)

### Các test đang fail:
1. FUNC01_TC01, FUNC01_TC04, FUNC01_TC05 (AuthService - UserRegisterAsync)
2. FUNC03_TC01 (AuthService - UpdatePasswordAsync)
3. FUNC04_TC03 (AuthService - ForgotPasswordAsync)
4. FUNC06_TC01, FUNC06_TC06 (BookingCourtService - CreateBookingCourtAsync)
5. FUNC07_TC01 (BookingCourtService - UserCreateBookingCourtAsync)
6. FUNC09_TC01 (BookingCourtService - CheckInOccurrenceAsync)
7. FUNC16_TC08 (PaymentService - CreatePaymentForOrderAsync)
8. FUNC17_TC01, FUNC17_TC07, FUNC17_TC08 (VoucherService - ValidateAndCalculateDiscountAsync)
9. FUNC21_TC01 (UserMembershipService - CreateForCurrentUserAsync)
10. FUNC22_TC01, FUNC22_TC04, FUNC22_TC05 (UserMembershipService - ExtendPaymentAsync)

---

## Ghi chú

- Tất cả test cases sử dụng MSTest framework
- Mocking được thực hiện bằng Moq library
- Database testing sử dụng EF Core In-Memory Database
- AutoMapper được sử dụng cho DTO mapping
- Test data được tạo động trong mỗi test case để đảm bảo isolation

---

**Last Updated:** December 12, 2024
**Test Framework:** MSTest
**Mocking Library:** Moq
**Database:** EF Core In-Memory

