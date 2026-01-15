# Test Requirements & Mapping Matrix

This document maps the **External Interface (EI)** and **Quality Attribute (QA)** requirements to their corresponding verification test cases in the [NonFunctional_Test_Plan.md](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md).

## 1. External Interfaces (EI) Mapping

| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **EI-01** | Email Service (SMTP) | 99% dispatched < 10s; log failures. | [NFT-EI-01](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L10) |
| **EI-02** | MinIO Object Storage | Max 10MB upload; <500ms retrieval (<2MB). | [NFT-EI-02](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L11) |
| **EI-03** | Payment Gateway | <2s callback update; 30s timeout. | [NFT-EI-03](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L12) |

## 2. Quality Attributes (QA) Mapping

### 2.1 Usability
| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **4.2.1-1** | Ease of Use | Booking process < 3 minutes. | [NFT-QA-01](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L21) |
| **4.2.1-2** | Navigation Efficiency | Reach any page in max 3 clicks. | [NFT-QA-02](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L22) |
| **4.2.1-3** | Responsiveness | Adapt to Desktop, Tablet, Mobile. | [NFT-QA-03](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L23) |

### 2.2 Scalability
| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **4.2.2-1** | User Load | 1,000 concurrent users (no degradation). | [NFT-QA-06](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L32) |
| **4.2.2-2** | Data Growth | Handle 200% annual data increase. | [NFT-QA-08](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L34) |
| **4.2.2-3** | Throughput | Minimum 50 TPS peak. | [NFT-QA-07](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L33) |

### 2.3 Interoperability
| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **4.2.3-1** | API Performance | 95% of responses < 300ms. | [NFT-QA-11](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L45) |
| **4.2.3-2** | Data Integrity | Zero tolerance for malformed JSON. | [NFT-QA-12](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L46) |
| **4.2.3-3** | Integration | 99.9% QR/Browser compatibility. | [NFT-QA-13](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L47), [NFT-QA-14](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L48) |

### 2.4 Reliability
| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **4.2.4-1** | Availability | 99.9% uptime (excluding maintenance). | [NFT-QA-16](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L57) |
| **4.2.4-2** | Error Handling | 100% caught/returned via ApiResponse. | [NFT-QA-17](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L58) |
| **4.2.4-3** | Data Consistency | Zero duplicate orders/overlapping slots. | [NFT-QA-18](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L59) |
| **4.2.4-4** | Recovery | MTTR < 30 minutes. | [NFT-QA-19](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L60) |

### 2.5 Security
| Req ID | Requirement Description | Key Metric | Verification Test Case(s) |
| :--- | :--- | :--- | :--- |
| **4.2.5-1** | Authentication | Protected ops require authentication. | [NFT-QA-21](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L71) |
| **4.2.5-2** | Authorization | RBAC enforcement for mgmt features. | [NFT-QA-21](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L71) |
| **4.2.5-3** | Data Protection | HTTPS encryption for all transmissions. | [NFT-QA-22](file:///Users/dotritrong/Desktop/Capstone/Badminton_Court_Management_System/NonFunctional_Test_Plan.md#L72) |
