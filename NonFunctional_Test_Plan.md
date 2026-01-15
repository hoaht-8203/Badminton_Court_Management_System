# Non-Functional Test Plan

This document outlines the test scenarios for the non-functional requirements specified in Section 4.1 (External Interfaces) and 4.2 (Quality Attributes).

## 1. External Interfaces (EI)

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-EI-01** | Verify Email Service (SMTP) Performance | 1. Trigger actions that send emails.<br>2. Measured dispatch time. | 99% of emails dispatched within 10 seconds. | SMTP provider configured. |
| **NFT-EI-02** | Verify MinIO Storage Upload & Retrieval | 1. Upload 10MB file.<br>2. Retrieve 2MB file. | 1. 10MB succeeds.<br>2. Retrieval < 500ms. | MinIO active. |
| **NFT-EI-03** | Verify Payment Gateway Callback & Timeout | 1. Simulate callback.<br>2. Simulate 30s delay. | 1. DB updates < 2s.<br>2. Timeout at 30s. | Gateway sandbox active. |
| **NFT-EI-04** | API Rate Limiting for External Clients | 1. Send excessive requests to external-facing APIs. | System returns 429 Too Many Requests after threshold. | Rate limit configured. |
| **NFT-EI-05** | OAuth Token Refresh Mechanism | 1. Expire external service token manually.<br>2. Trigger feature using that service. | System refreshes token automatically without failure. | OAuth integration active. |

## 2. Quality Attributes (QA)

### 2.1 Usability & Efficiency

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-01** | Ease of Use (Core Booking) | 1. New user performs booking without guide. | Completion ≤ 3 minutes. | Zero guide provided. |
| **NFT-QA-02** | Navigation Efficiency (3-Click Rule) | 1. Navigate to any page from home. | Max 3 clicks to reach any feature. | All menus active. |
| **NFT-QA-03** | UI Responsiveness | 1. View on Desktop, Tablet, Mobile. | Layout adapts correctly; no loss of function. | Web URL accessible. |
| **NFT-QA-04** | Error Message Clarity | 1. Trigger validation errors (e.g., duplicate booking). | Messages are user-friendly and actionable. | Validation logic active. |
| **NFT-QA-05** | Loading States & Interactivity | 1. Simulate slow network (3G).<br>2. Perform data-heavy action. | Skeletons/Spinners shown; UI non-blocking. | Network throttler active. |

### 2.2 Scalability & Performance

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-06** | Concurrent User Load | 1. Simulate 1,000 concurrent users. | No response time degradation. | Load tool (JMeter) set. |
| **NFT-QA-07** | Transaction Throughput | 1. Simulate 50 booking TPS. | System handles ≥ 50 TPS. | High-perf env. |
| **NFT-QA-08** | Data Growth Simulation | 1. Populate DB with 200% more data. | Query performance remains stable. | Data generator tool. |
| **NFT-QA-09** | Resource Auto-scaling | 1. Increase traffic until CPU hits 80%. | New instances/resources provisioned. | Scaling rules active. |
| **NFT-QA-10** | Batch Notification Performance | 1. Trigger 1,000 notifications at once. | System processes batch without crashing. | Celery/Task queue active. |

### 2.3 Interoperability & Integrity

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-11** | API Response Performance | 1. Perform various REST calls. | 95% of calls < 300ms. | Low-latency network. |
| **NFT-QA-12** | Data Integrity (JSON Schema) | 1. Send malformed JSON. | 100% rejection of malformed data. | API active. |
| **NFT-QA-13** | QR Code Compatibility | 1. Generate booking QR.<br>2. Scan with 3 generic readers. | All readers parse the code correctly. | QR generator active. |
| **NFT-QA-14** | Browser Compatibility | 1. Test on Chrome, Safari, Firefox, Edge. | 99.9% compatibility; no visual bugs. | Cross-browser env. |
| **NFT-QA-15** | OpenAPI Spec Consistency | 1. Compare Swagger UI with actual API response. | 100% match in field names and types. | Swagger/Redoc active. |

### 2.4 Reliability & Recovery

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-16** | System Availability (Uptime) | 1. Monitor 24/7 for 30 days. | Uptime ≥ 99.9%. | Monitoring tool on. |
| **NFT-QA-17** | Standardized Error Body | 1. Trigger 4xx and 5xx errors. | Responses use `ApiResponse` format. | Errors triggered. |
| **NFT-QA-18** | Race Condition Prevention | 1. Multi-user simultaneous booking. | Zero overlapping slots; no duplicates. | Locking logic on. |
| **NFT-QA-19** | Mean Time to Recovery (MTTR) | 1. Terminate core process.<br>2. Measure restart/recovery time. | MTTR < 30 minutes. | Watchdog active. |
| **NFT-QA-20** | Backup & Restore Integrity | 1. Perform daily backup.<br>2. Restore to temp DB. | Data matches exactly; zero loss. | Backup job active. |

### 2.5 Security

| Test Case ID | Test Case Description | Test Case Procedure | Expected Results | Pre-conditions |
| :--- | :--- | :--- | :--- | :--- |
| **NFT-QA-21** | RBAC Enforcement | 1. Access admin UI as Guest. | Access blocked with 403 Forbidden. | RBAC config on. |
| **NFT-QA-22** | HTTPS Encryption | 1. Capture traffic via Wireshark. | All data is encrypted (TLS 1.2+). | SSL cert on. |
| **NFT-QA-23** | Password Hashing Security | 1. Query `Users` table directly. | Passwords appear as random hashes. | DB access. |
| **NFT-QA-24** | SQL Injection Resistance | 1. Input `' OR 1=1 --` in login fields. | Login fails; no data leakage. | SQL injection pen-test. |
| **NFT-QA-25** | JWT Expiration & Revocation | 1. Use token after TTL expiry.<br>2. Logout and reuse token. | Both cases result in 401 Unauthorized. | JWT engine active. |
