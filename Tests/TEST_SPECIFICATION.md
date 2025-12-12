# Test Specification - Badminton Court Management System

Tài liệu này mô tả chi tiết các test cases đã được triển khai, dựa trên code test thực tế trong thư mục Tests.

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | |
| | | | | Server connection available | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O |
| | | | | Email not exists in DB | O | | O | O | O |
| | | | | Username not exists in DB | O | O | | O | O |
| | Input | | | | | | | |
| | | UserName | | | testuser | testuser | existinguser | testuser | testuser |
| | | FullName | | | Test User | New User | New User | Test User | Test User |
| | | Email | | | test@example.com | existing@example.com | new@example.com | test@example.com | test@example.com |
| | | Password | | | Test123!@# | Test123!@# | Test123!@# | Test123!@# | Test123!@# |
| | | PhoneNumber | | | 0123456789 | 0123456789 | 0123456789 | 0123456789 | 0123456789 |
| | | DateOfBirth | | | | | | | DateOnly.FromDateTime(DateTime.Now.AddYears(-25)) |
| | | Address | | | | | | | 123 Test St |
| | | City | | | | | | | Test City |
| | | District | | | | | | | Test District |
| | | Ward | | | | | | | Test Ward |
| Confirm | Return | | | | | | | |
| | | CurrentUserResponse | | | | | | |
| | | | | | not null | | | | not null |
| | | | | | UserId != Guid.Empty | | | | |
| | | | | | Email = input | | | | |
| | | | | | UserName = input | | | | |
| | | | | | EmailConfirmed = false | | | | |
| | | | | | Roles contains User | | | | |
| | | Exception | | | | | | |
| | | | | | | ApiException: Email already exists | ApiException: Username already exists | ApiException: Create user fails | |
| | Database changes | | | | | | | |
| | | | | | ApplicationUserToken created (TokenType.EmailConfirm) | | | | ApplicationUserToken created |
| | | | | | Customer created | | | | Customer created with optional fields |
| | | | | | Verification email sent | | | | |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | A | N |
| | Passed/Failed | | | | ❌ Failed | ✅ Passed | ✅ Passed | ❌ Failed | ❌ Failed |

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | |
| | | | | Server connection available | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O |
| | | | | User exists in DB | O | | O | O | O |
| | | | | User status is Active | O | | O | | O |
| | Input | | | | | | | |
| | | Email | | | test@example.com | test@example.com | test@example.com | test@example.com | test@example.com |
| | | Password | | | password123 | wrongpassword | password123 | password123 | password123 |
| Confirm | Return | | | | | | | |
| | | CurrentUserResponse | | | | | | |
| | | | | | not null | | | | |
| | | | | | UserId != Guid.Empty | | | | |
| | | | | | Email = input | | | | |
| | | | | | Roles not empty | | | | |
| | | | | | ACCESS_TOKEN cookie set | | | | |
| | | | | | REFRESH_TOKEN cookie set | | | | |
| | | Exception | | | | | | |
| | | | | | | ApiException: Email or password incorrect | ApiException: Email or password incorrect | ApiException: Account is inactive | |
| | Database changes | | | | | | | |
| | | | | | RefreshToken saved to DB (TokenType.RefreshToken) | | | | |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | A | B |
| | Passed/Failed | | | | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed |

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | |
| | | | | Server connection available | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O |
| | | | | User principal authenticated | O | O | | O | O |
| | | | | User status is Active | O | O | O | | O |
| | | | | Refresh token record exists in DB | O | O | O | O | O |
| | Input | | | | | | | |
| | | OldPassword | | | Dung@123 | Dung@123 | Dung@123 | Dung@123 | Dungg@123 |
| | | NewPassword | | | DungNew@123 | DungNew@123 | DungNew@123 | DungNew@123 | DungNew@123 |
| | | RefreshToken | | | valid-refresh-token | null/missing | valid-refresh-token | valid-refresh-token | valid-refresh-token |
| Confirm | Return | | | | | | | |
| | | Auth cookies & response | | | | | | |
| | | | | | ACCESS_TOKEN cookie set with new JWT | | | | |
| | | | | | REFRESH_TOKEN cookie rotated (7 days) | | | | |
| | | | | | Password change acknowledged | | | | |
| | | Exception | | | | | | |
| | | | | | | ApiException: Mã refresh token không tồn tại | ApiException: Không được phép truy cập | ApiException: Tài khoản dừng hoạt động | ApiException: Cập nhật mật khẩu thất bại |
| | Database changes | | | | | | | |
| | | | | | Temp password tokens removed and refresh token rotated | | | | |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | A | A |
| | Passed/Failed | | | | ❌ Failed | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed |

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | |
| | | | | Server connection available | O | O | O | O |
| | | | | Database connection available | O | O | O | O |
| | Input | | | | | | |
| | | Email | | | levanh@gmail.com | leconghieu@gmail.com | phamthic@gmail.com | <empty> |
| Confirm | Return | | | | | | |
| | | OTP & notification | | | | | |
| | | | | | ResetPassword OTP stored (TokenType=ResetPassword) | | ResetPassword OTP stored | |
| | | | | | OTP expires after 10 minutes | | OTP expires after 10 minutes | |
| | | | | | Forgot password email queued via SendEmailFireAndForget | | Forgot password email queued | |
| | | Exception | | | | | |
| | | | | | | ApiException: Email không tồn tại | ApiException: Reset password fails | ApiException: Email không tồn tại |
| | Database changes | | | | | | |
| | | | | | ApplicationUserToken persisted for reset | | ApplicationUserToken persisted | |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | B |
| | Passed/Failed | | | | ✅ Passed | ✅ Passed | ❌ Failed | ✅ Passed |

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | | |
| | | | | Server connection available | O | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O | O |
| | Input | | | | | | | | |
| | | Email | | | daoxuand@gmail.com | leconghieu@gmail.com | hoangthie@gmail.com | daoxuand@gmail.com | daoxuand@gmail.com | daoxuand@gmail.com |
| | | Token | | | VALID-OTP | <empty> | VALID-OTP | WRONG-OTP | EXPIRED-OTP | VALID-OTP |
| | | TokenRecordState | | | Record matches user/token | No token record found | Record matches user/token | No token record found | Record matches user/token | Record matches user/token |
| Confirm | Return | | | | | | | | |
| | | Verification result | | | | | | | |
| | | | | | EmailConfirmed flag set to true | | | | | EmailConfirmed flag set to true |
| | | | | | Verification token removed from DB | | | | | Verification token removed |
| | | Exception | | | | | | | |
| | | | | | | ApiException: Email hoặc token không hợp lệ | ApiException: Email không tồn tại | ApiException: Mã xác thực email không hợp lệ | ApiException: Mã xác thực email đã hết hạn | |
| | Database changes | | | | | | | | |
| | | | | | User EmailConfirmed persisted | | | | | User EmailConfirmed persisted |
| | | | | | ApplicationUserToken deleted | | | | | ApplicationUserToken deleted |
| | | | | | Customer created | | | | | Customer not duplicated |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | A | A | B |
| | Passed/Failed | | | | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed |

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

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 | UTCID06 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | | |
| | | | | Server connection available | O | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O | O |
| | | | | Court exists | O | | O | O | O | O |
| | | | | Court status is Active | O | | O | O | O | O |
| | | | | Pricing configured for requested slot | O | | O | O | O | O |
| | | | | No conflicting booking | O | | O | O | O | O |
| | | | | Voucher passes validation | O | | O | O | O | O |
| | Input | | | | | | | | |
| | | CustomerId | | | customer.Id | customer.Id | customer.Id | customer.Id | customer.Id | customer.Id |
| | | CourtId | | | court.Id | Guid.NewGuid() | court.Id | court.Id | court.Id | court.Id |
| | | StartDate | | | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(-1) | DateTime.UtcNow.AddDays(1) |
| | | EndDate | | | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(1) | DateTime.UtcNow.AddDays(-1) | DateTime.UtcNow.AddDays(1) |
| | | StartTime | | | TimeOnly(10, 0) | TimeOnly(10, 0) | TimeOnly(10, 0) | TimeOnly(10, 0) | TimeOnly(10, 0) | TimeOnly(10, 0) |
| | | EndTime | | | TimeOnly(11, 0) | TimeOnly(11, 0) | TimeOnly(11, 0) | TimeOnly(11, 0) | TimeOnly(11, 0) | TimeOnly(11, 0) |
| | | DaysOfWeek | | | null | | | | | null |
| | | PaymentMethod | | | Cash | | | | | Cash |
| | | VoucherId | | | | | | | | 1 |
| Confirm | Return | | | | | | | | |
| | | DetailBookingCourtResponse | | | | | | | |
| | | | | | Response not null with booking details | | | | | Response not null |
| | | | | | Status PendingPayment & HoldExpiresAtUtc set | | | | | |
| | | | | | Payment created with requested deposit/full preference | | | | | |
| | | Exception | | | | | | | |
| | | | | | | ApiException: Sân này không tồn tại | ApiException: Sân này chưa được cấu hình giá | ApiException: Giờ bắt đầu phải nhỏ hơn giờ kết thúc | ApiException: Không được đặt sân trong quá khứ | ApiException: Voucher không hợp lệ |
| | Database changes | | | | | | | | |
| | | | | | BookingCourt + occurrences persisted as PendingPayment | | | | | BookingCourt persisted |
| | | | | | Payment + hold expiry saved | | | | | Payment saved |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | N | A | A | A | A | N |
| | Passed/Failed | | | | ❌ Failed | ✅ Passed | ✅ Passed | ✅ Passed | ✅ Passed | ❌ Failed |

---

*Note: Tài liệu này được tạo dựa trên code test thực tế. Các FUNC còn lại (FUNC07-40) sẽ được bổ sung tương tự.*

**Last Updated:** December 12, 2024

