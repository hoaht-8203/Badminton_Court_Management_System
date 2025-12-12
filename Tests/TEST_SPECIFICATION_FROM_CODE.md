# Test Specification - Badminton Court Management System

Tài liệu này mô tả chi tiết các test cases đã được triển khai, dựa trên code test thực tế trong thư mục Tests.

---

## FUNC_01: UserRegisterAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC01 | UserRegisterAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure registration enforces unique email/username and password policy then issues OTP.

**Test Results:**
- **Passed:** 3
- **Failed:** 2
- **Total:** 5

| | | | | UTCID01 | UTCID02 | UTCID03 | UTCID04 | UTCID05 |
|:---|:---|:---|:---|:--------|:--------|:--------|:--------|:--------|
| Condition | Precondition | | | | | | | |
| | | | | Server connection available | O | O | O | O | O |
| | | | | Database connection available | O | O | O | O | O |
| | | | | Email not exists in DB | O | | O | O | O |
| | | | | Username not exists in DB | O | O | | O | O |
| | | Input | | | | | | |
| | | UserName | | | | | | |
| | | | | | testuser | O | O | | O | O |
| | | | | | existinguser | | | O | | |
| | | FullName | | | | | | |
| | | | | | Test User | O | O | O | O | O |
| | | Email | | | | | | |
| | | | | | test@example.com | O | | O | | O |
| | | | | | existing@example.com | | O | | | |
| | | Password | | | | | | |
| | | | | | Test123!@# | O | O | O | | O |
| | | PhoneNumber | | | | | | |
| | | | | | 0123456789 | O | O | O | O | O |
| Confirm | Return | | | | | | |
| | | CurrentUserResponse | | | | | | |
| | | | | | not null | O | | | | |
| | | | | | Email = input | O | | | | |
| | | | | | UserName = input | O | | | | |
| | Exception | | | | | | |
| | | | | | ApiException: Email already exists | | O | | | |
| | | | | | ApiException: UserManager.CreateAsync failed | | | | O | |
| | Database changes | | | | | | |
| | | | | | ApplicationUser created | O | | | | O |
| | | | | | Customer created | O | | | | O |
| | | | | | ApplicationUserToken created | O | | | | O |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | | | |
| | | | | | N | A | A | A | N |
| | Passed/Failed | | | | | |
| | | | | | P | P | P | F | F |

---

## FUNC_02: LoginAsync

| Code Module | Function Code | Method | Created By | Executed By |
|:------------|:--------------|:-------|:----------|:------------|
| AuthService | FUNC02 | LoginAsync | DungNVHE182057 | DungNVHE182057 |

**Test Requirement:** Ensure login validates credentials, checks account status, and issues authentication tokens.

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
| | | | | User status is Active | O | | O | | |
| | | | | User status is Locked | | | | O | |
| | | | | User status is Pending | | | | | O |
| | | Input | | | | | | |
| | | Email | | | | | | |
| | | | | | user@example.com | O | | O | O | O |
| | | | | | nonexistent@example.com | | O | | | |
| | | Password | | | | | | |
| | | | | | Password123! | O | | O | O | O |
| | | | | | WrongPassword! | | | O | | |
| Confirm | Return | | | | | | |
| | | AuthResponse | | | | | | |
| | | | | | not null | O | | | | |
| | | | | | IsSuccess = true | O | | | | |
| | | | | | AccessToken not empty | O | | | | |
| | Exception | | | | | | |
| | | | | | ApiException: Email hoặc mật khẩu không đúng | | O | O | | |
| | | | | | ApiException: Tài khoản của bạn đã bị khóa | | | | O | |
| | | | | | ApiException: Tài khoản của bạn chưa được xác minh | | | | | O |
| | Database changes | | | | | | |
| | | | | | ApplicationUserToken created | O | | | | |
| Result | Type(N : Normal, A : Abnormal, B : Boundary) | | | | | |
| | | | | | N | A | A | A | A |
| | Passed/Failed | | | | | |
| | | | | | P | P | P | P | P |

---

*Note: File này sẽ tiếp tục với các FUNC còn lại (FUNC03-40) theo cùng format.*

