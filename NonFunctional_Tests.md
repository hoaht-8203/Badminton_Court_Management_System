# Non-Functional Test Cases

Detailed test specifications for External Interfaces (EI) and Quality Attributes (QA) based on the Non-Functional Test Plan.

## 1. External Interfaces (EI)

| Test Case ID | Test Case Description | Expected Results | Actual Results | Status |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-EI-01** | Verify Email Service (SMTP) Performance | 99% of emails dispatched within 10s (respecting rate limits). | Average dispatch time: ~2.5 seconds (10/10 successful with pause). | **Passed** |
| **NFT-EI-02** | Verify MinIO Storage Upload & Retrieval | 2MB file retrieval takes < 500ms. | Upload 10MB: ~2.1s. Retrieval 2MB: ~1.0s. | **Warning** |
| **NFT-EI-03** | Verify Payment Gateway Callback | Status updates in < 2 seconds. | Status updated in 0.50 seconds after callback (PASS). | **Passed** |
| **NFT-EI-04** | API Rate Limiting | Returns `429 Too Many Requests`. | System correctly throttled after 5 requests/10s. | **Passed** |
| **NFT-EI-05** | OAuth Token Refresh Mechanism | Automatically calls refresh endpoint. | Successfully refreshed JWT after expiry without logout. | **Passed** |

### Test Case Details (EI)

| ID | Procedure | Pre-conditions |
| :--- | :--- | :--- |
| **EI-01** | 1. Navigate to "Forgot Password".<br>2. Submit a valid email address.<br>3. Measure dispatch time in logs.<br>4. Repeat with 10 requests, using a **12-second interval** between each (to respect Mailtrap Free limits). | SMTP and Rate Limit (5 req/10s) configured. |
| **EI-02** | 1. Upload 10MB file.<br>2. Retrieve 2MB file.<br>3. Measure time. | MinIO active. |
| **EI-03** | 1. Initiate "Bank Transfer".<br>2. Simulation callback to `/api/payment-webhooks/sepay/webhook`. | SePay Sandbox/Key configured. |
| **EI-04** | 1. Send 10 requests in < 10 seconds. | Rate Limit middleware enabled. |
| **EI-05** | 1. Set JWT TTL to short.<br>2. Perform action after TTL.<br>3. Inspect network log. | OAuth2 logic active. |

## 2. Quality Attributes (QA)

### 2.1 Usability & Efficiency

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-01** | Ease of Use (Core Booking) | 1. Give a new user (first-time visitor) the URL to the booking page.<br>2. Ask them to book a court for 2 hours tomorrow.<br>3. Record the time from "Page Load" to "Booking Confirmation". | 1. User completes the booking without asking for help or referring to a manual.<br>2. Total time taken is ≤ 3 minutes. | Test user has no prior experience with the system. |
| **NFT-QA-02** | Navigation Efficiency (3-Click Rule) | 1. Start from the Homepage (`/homepage`).<br>2. Attempt to reach the "Court Management", "User Profile", and "Order History" pages.<br>3. Count the number of clicks required for each. | 1. "Court Management" reachable in 2 clicks.<br>2. "User Profile" reachable in 1 click.<br>3. All primary features reachable within a maximum of 3 clicks. | Navigation menu is fully functional. |
| **NFT-QA-03** | UI Responsiveness | 1. Open the application on a Desktop (1920x1080).<br>2. Switch to Tablet view (iPad 768x1024) in browser DevTools.<br>3. Switch to Mobile view (iPhone 375x667). | 1. Layout adjusts fluidly; no horizontal scrolling on mobile.<br>2. Font sizes are readable on all devices.<br>3. Buttons are touch-friendly (min 44x44px) on mobile. | Responsive CSS breakpoints are implemented. |
| **NFT-QA-04** | Error Message Clarity | 1. Go to the Sign-Up page.<br>2. Enter an email that is already registered.<br>3. Enter a password less than 6 characters.<br>4. Click "Submit". | 1. Messages like "Email already exists" and "Password must be at least 6 characters" are shown.<br>2. Messages are colored orange/red and positioned near the inputs. | Client-side and Server-side validation are active. |
| **NFT-QA-05** | Loading States & Interactivity | 1. Simulate a slow 3G network in Chrome DevTools.<br>2. Navigate to the "Court Schedule" page which has many events.<br>3. Click "Refresh Data". | 1. Pulse skeletons are shown where the calendar should be.<br>2. An Ant Design `Spin` or similar indicator appears.<br>3. UI remains interactive (sidebar/menu) while data loads. | `loading` states are handled in React/Next.js components. |

### 2.2 Scalability & Performance

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-06** | Concurrent User Load | 1. Use JMeter to simulate 1,000 users logging in and viewing the homepage simultaneously.<br>2. Run the test for 10 minutes. | 1. System average response time stays below 2 seconds.<br>2. Error rate is less than 1%. | Production-like environment (e.g., Staging). |
| **NFT-QA-07** | Transaction Throughput | 1. Simulate a heavy load of 50 booking creation requests per second (TPS).<br>2. Monitor CPU and RAM usage on the server. | 1. System maintains ≥ 50 TPS.<br>2. CPU usage does not stay at 100% for more than 5 seconds. | High-performance DB and API server. |
| **NFT-QA-08** | Data Growth Simulation | 1. Run a script to insert 1,000,000 booking records into the database.<br>2. Search for a specific booking by ID and by Customer Name. | 1. Search by ID takes < 50ms.<br>2. Search by Name (with index) takes < 200ms. | Database indexing is correctly configured. |
| **NFT-QA-09** | Resource Monitoring Under Load | 1. Gradually increase load from 10 to 100 concurrent users over 3 minutes.<br>2. Monitor CPU and memory usage of the API server.<br>3. Measure response time degradation under load. | 1. CPU usage increases proportionally with load (max 80%).<br>2. Memory usage remains stable (no memory leaks).<br>3. Response time stays below 2 seconds even at peak load.<br>4. System recovers to baseline after load decreases. | API server running with resource monitoring enabled. |
| **NFT-QA-10** | Batch Notification Performance | 1. Trigger a broadcast notification to 1,000 users simultaneously.<br>2. Measure the time until the last notification is queued/sent. | 1. All 1,000 jobs are added to the queue in < 5 seconds.<br>2. System remains stable without crashing. | Celery or Hangfire background task queue is active. |

### 2.3 Interoperability & Integrity

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-11** | API Response Performance | 1. Perform 10 different REST calls (GET, POST, PUT, DELETE) from different continents (if global) or locally. | 1. 95% of standard REST calls return in < 300ms. | Low-latency network and optimized DB queries. |
| **NFT-QA-12** | Data Integrity (JSON Schema) | 1. Send a POST request to `/api/courts` with missing required fields.<br>2. Send a request with a string in a field that expects an integer. | 1. All malformed requests are rejected with `400 Bad Request`.<br>2. Response body specifies which fields failed validation. | FluentValidation or DataAnnotations are used. |
| **NFT-QA-13** | QR Code Compatibility | 1. Generate a booking QR code in the application.<br>2. Scan it using: (a) iPhone Camera, (b) Android Google Lens, (c) 3rd-party QR Reader app. | 1. All readers correctly parse the embedded URL/ID.<br>2. Scanning redirects to the correct booking verification page. | QR Code generator library is integrated. |
| **NFT-QA-14** | Browser Compatibility | 1. Test the core "Booking" and "Checkout" flows on: Chrome, Safari, Firefox, and Microsoft Edge. | 1. UI renders correctly (no broken CSS) on all browsers.<br>2. JavaScript functions work identically across all platforms. | Use tools like BrowserStack or local machines. |
| **NFT-QA-15** | OpenAPI Spec Consistency | 1. Navigate to `/swagger/index.html`.<br>2. Compare a specific model (e.g., `CourtDto`) in Swagger to the actual API response from `/api/courts/1`. | 1. Field names (CamelCase/PascalCase) match exactly.<br>2. Data types (int vs string) match exactly. | Swashbuckle/OpenAPI generator is configured. |

### 2.4 Reliability & Recovery

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-16** | System Health Monitoring | 1. Access the internal health endpoint `/api/DevTest/health`.<br>2. Verify JSON response status. | 1. Endpoint returns `200 OK`.<br>2. Response confirms DB and core services are operational. | Internal health check middleware is active. |
| **NFT-QA-17** | Standardized Error Body | 1. Trigger a 404 (wrong URL).<br>2. Trigger a 400 (bad JSON/missing fields).<br>3. Trigger a simulation of 500. | 1. All errors return a consistent structure: `{ "success": false, "message": "...", "errors": {} }`. | Global Exception Handling/Standardized ApiResponse used. |
| **NFT-QA-18** | Race Condition Prevention | 1. Simulate parallel requests to a single-use resource (e.g., simultaneous logins/bookings).<br>2. Inspect DB for duplicates or inconsistent states. | 1. Concurrency is handled without data corruption.<br>2. Duplicate attempts return appropriate error codes. | Transactional integrity or DB constraints are active. |
| **NFT-QA-19** | Mean Time to Recovery (MTTR) | 1. Forcibly terminate the API process (`pkill`).<br>2. Measure time from restart command until the first `200 OK` health response. | 1. System recovers and becomes functional in < 15 seconds.<br>2. All startup initialization completes without failure. | Startup optimization is implemented. |
| **NFT-QA-20** | Periodic Cleanup Performance | 1. Seed a large volume of test data.<br>2. Trigger the cleanup endpoint `/api/DevTest/cleanup-test-data`.<br>3. Measure total execution time. | 1. Cleanup completes in < 5 seconds even with thousands of records.<br>2. System handles bulk deletion without blocking other requests. | Background deletion or optimized SQL DELETE used. |

### 2.5 Security

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-21** | RBAC Enforcement | 1. Login as a user with "Guest" role.<br>2. Attempt to navigate to `/quanlysancaulong/users` (Admin page) or call its API. | 1. Frontend redirects to "Forbidden" page.<br>2. API returns `403 Forbidden`. | RBAC roles and policies are defined. |
| **NFT-QA-22** | HTTPS Encryption | 1. Use Wireshark or Fiddler to capture packets while logging in.<br>2. Inspect the HTTP payload. | 1. Credentials and sensitive data are non-readable (encrypted).<br>2. Connection uses TLS 1.2 or 1.3. | SSL Certificate is installed. |
| **NFT-QA-23** | Password Hashing Security | 1. Connect to the database using an admin tool.<br>2. Select `PasswordHash` from the `Users` table. | 1. Passwords are stored as long hashes (not plain text).<br>2. No two identical passwords have the same hash (if salting is used). | BCrypt or Argon2 is used for hashing. |
| **NFT-QA-24** | SQL Injection Resistance | 1. In the login email field, enter: `admin@example.com' OR '1'='1`.<br>2. In a search field, enter: `; DROP TABLE Users; --`. | 1. Application returns standard "Invalid login" or "No results".<br>2. Database remains intact; no unauthorized data is returned. | EF Core or Prepared Statements are used. |
| **NFT-QA-25** | JWT Expiration & Revocation | 1. Obtain a JWT, wait for it to expire (set TTL short for test). Attempt use.<br>2. Login, obtain JWT, logout, then try to use the SAME JWT again. | 1. Expired token returns `401 Unauthorized`.<br>2. Revoked/Logged-out token returns `401 Unauthorized`. | JWT Blacklist or Refresh Token revocation is active. |
