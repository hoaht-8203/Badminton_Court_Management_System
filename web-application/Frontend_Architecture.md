# Tài liệu Chi tiết Kiến trúc Frontend Web (web-application)

Tài liệu này cung cấp sơ đồ chi tiết và phân tích các thành phần bên trong package `web-application`, bám sát mô hình kiến trúc chuẩn của dự án.

---

## 1. App Router Layer (`src/app`)
Quản lý Routing, Layout và Pages. Đây là điểm bắt đầu của mọi yêu cầu từ người dùng.

### Phân hệ Quản trị (`/quanlysancaulong/(private)`)
| Module Path | Chức năng chi tiết |
| :--- | :--- |
| `dashboard` | Tổng quan doanh thu, số lượng khách, biểu đồ tăng trưởng. |
| `court-schedule` | Giao diện kéo thả/xem lịch đặt sân theo ngày/tuần. |
| `courts` | Danh sách sân, thêm/sửa/xóa sân và cụm sân. |
| `thietlapgia` | Cấu hình bảng giá theo khung giờ, ngày lễ, khách vãng lai/cố định. |
| `orders` | Quản lý đơn hàng dịch vụ, hóa đơn thanh toán. |
| `inventory`, `stock-*` | Nhập kho, xuất kho, kiểm kho và trả hàng. |
| `salary`, `work-schedule` | Tính lương nhân viên, chia ca làm việc và điểm danh. |
| `vouchers`, `memberships` | Chương trình khuyến mãi, quản lý hạng thành viên. |
| `customers`, `list-staff` | Quản lý hồ sơ khách hàng và hồ sơ nhân sự. |
| `blogs`, `sliders` | Quản lý nội dung tin tức và hình ảnh banner quảng cáo. |

---

## 2. Components Layer (`src/components`)
Hệ thống UI được chia thành 3 nhóm cấp độ:

- **UI Primitive (`/tiptap-ui-primitive`, `/tiptap-ui`)**: Các thành phần giao diện cơ bản (Buttons, Modals, Popovers) được tối ưu cho trình soạn thảo và UI chung.
- **Business Components (`/quanlysancaulong`)**:
  - `products/update-product-drawer.tsx`: Drawer cập nhật sản phẩm.
  - `court-schedule/court-calendar.tsx`: Lịch đặt sân chi tiết.
  - `salary/payroll-table.tsx`: Bảng tính toán lương.
- **Tiptap Editor (`/tiptap-*`)**: Các node, icons và templates riêng cho trình soạn thảo văn bản phong phú.

---

## 3. Services Layer (`src/services`)
Lớp này chứa toàn bộ các logic gọi API, được phân tách theo từng module nghiệp vụ tương ứng với Backend. Hệ thống hiện có 37 services chính:

| Service File | Phạm vi nghiệp vụ |
| :--- | :--- |
| **Hệ thống & Tài khoản** | |
| `authService.ts` | Đăng nhập, đăng ký, xác thực và quản lý Token. |
| `usersService.ts` | Quản lý thông tin tài khoản người dùng hệ thống. |
| `roleService.ts` | Quản lý phân quyền và các vai trò (Roles). |
| `systemConfigService.ts` | Cấu hình các thông số vận hành của toàn hệ thống. |
| **Quản lý Sân & Đặt sân** | |
| `courtService.ts` | Quản lý thông tin sân và khu vực (Areas). |
| `courtScheduleService.ts` | Xử lý lịch trình đặt sân và tình trạng trống/bận. |
| `courtAreaService.ts` | Quản lý các cụm sân và khu vực địa lý. |
| `pricesService.ts` | Cấu hình và tính toán bảng giá linh hoạt. |
| **Kinh doanh & Thu ngân** | |
| `ordersService.ts` | Quản lý đơn hàng, hóa đơn và chi tiết mua hàng. |
| `cashierService.ts` | Nghiệp vụ dành riêng cho màn hình bán hàng tại quầy. |
| `paymentService.ts` | Xử lý trạng thái thanh toán và tích hợp QR. |
| `productService.ts` | Quản lý danh mục sản phẩm, nước uống, phụ kiện. |
| `serviceService.ts` | Quản lý các dịch vụ đi kèm (thuê vợt, cầu, v.v.). |
| `voucherService.ts` | Kiểm tra và áp dụng các mã giảm giá, khuyến mãi. |
| **Kho hàng & Nhà cung cấp** | |
| `inventoryService.ts` | Quản lý thẻ kho và tồn kho thực tế. |
| `receiptsService.ts` | Quản lý phiếu nhập kho từ nhà cung cấp. |
| `stockOutService.ts` | Quản lý phiếu xuất kho nội bộ hoặc bán lẻ. |
| `returnGoodsService.ts` | Xử lý quy trình trả hàng và hoàn kho. |
| `supplierService.ts` | Quản lý thông tin và lịch sử nhập hàng nhà cung cấp. |
| `supplierBankAccountsService.ts` | Thông tin thanh toán cho nhà cung cấp. |
| **Nhân sự & Lương** | |
| `staffService.ts` | Quản lý hồ sơ nhân viên trong hệ thống. |
| `attendanceService.ts` | Xử lý dữ liệu điểm danh và chấm công. |
| `shiftService.ts` | Định nghĩa các ca làm việc (Sáng/Chiều/Tối). |
| `schechuleService.ts` | Sắp xếp lịch trực và làm việc cho nhân viên. |
| `payrollService.ts` | Tính toán bảng lương hàng tháng và phụ cấp. |
| **Hội viên & Khách hàng** | |
| `customerService.ts` | Quản lý thông tin khách hàng và lịch sử đặt sân. |
| `membershipService.ts` | Định nghĩa các gói hội viên và quyền lợi kèm theo. |
| `userMembershipService.ts` | Quản lý trạng thái hội viên của từng khách hàng cụ thể. |
| **Tiện ích & Báo cáo** | |
| `dashboardService.ts` | Lấy dữ liệu tổng hợp cho các biểu đồ thống kê admin. |
| `cashflowService.ts` | Theo dõi dòng tiền thu/chi thực tế của cửa hàng. |
| `feedbackService.ts` | Quản lý đánh giá và phản hồi từ phía người dùng. |
| `blogService.ts` | Quản lý bài viết tin tức và nội dung website. |
| `sliderService.ts` | Quản lý hình ảnh banner hiển thị trên giao diện khách. |
| `fileService.ts` | Xử lý upload/download tài liệu và hình ảnh. |
| `exportService.ts` | Hỗ trợ xuất dữ liệu ra file Excel/PDF. |
| `storeBankAccountsService.ts` | Quản lý tài khoản ngân hàng của cửa hàng để nhận thanh toán. |
| `attendanceService.ts` | (Lặp lại) Xử lý điểm danh. |


---

## 4. Hooks Layer (`src/hooks`)
Logic tái sử dụng dưới dạng Custom Hooks (kết hợp TanStack Query).

- **Data Fetching Hooks**: `useProducts`, `useStaffs`, `useBookingCourt`, `useOrders`.
- **UI Logic Hooks**:
  - `use-mobile.ts`: Kiểm tra thiết bị di động để tối ưu UI.
  - `use-tiptap-editor.ts`: Khởi tạo và quản lý trạng thái Editor.
  - `use-composed-ref.ts`: Xử lý refs phức tạp trong React.
Lớp này chứa các logic tái sử dụng, bao gồm cả việc fetch dữ liệu qua TanStack Query và các xử lý UI. Dự án có 40 hooks chính:

| Hook File | Chức năng chính |
| :--- | :--- |
| **Nghiệp vụ (API Hooks)** | |
| `useAuth.ts`, `useProfile.ts` | Quản lý thông tin đăng nhập và hồ sơ cá nhân. |
| `useBookingCourt.ts` | Xử lý các yêu cầu đặt sân và lịch đặt. |
| `useCourt.ts`, `useCourtArea.ts` | Lấy danh sách sân và các cụm sân. |
| `useProducts.ts`, `useCategories.ts` | Quản lý sản phẩm và phân loại. |
| `useOrders.ts`, `useCheckout.ts` | Xử lý đơn hàng và quy trình thanh toán. |
| `useStaffs.ts`, `usePayroll.ts` | Xử lý thông tin nhân sự và bảng lương. |
| `useVouchers.ts`, `useMembership.ts` | Quản lý khuyến mãi và gói hội viên. |
| `useInventory.ts`, `useSuppliers.ts` | Xử lý kho hàng và nhà cung cấp. |
| `useDashboard.ts`, `useCashflow.ts` | Lấy dữ liệu thống kê và báo cáo tài chính. |
| `useFeedback.ts`, `useBlogs.ts` | Quản lý phản hồi và tin tức. |
| **Tiện ích UI (Utility Hooks)** | |
| `use-mobile.ts`, `use-window-size.ts` | Responsive: Kiểm tra kích thước màn hình. |
| `use-tiptap-editor.ts` | Khởi tạo và quản lý trạng thái trình soạn thảo văn bản. |
| `use-scrolling.ts`, `use-cursor-visibility.ts` | Hiệu ứng UI: Theo dõi cuộn trang và con trỏ. |
| `use-throttled-callback.ts` | Tối ưu hiệu năng: Giảm tần suất thực thi hàm. |
| `use-element-rect.ts` | Tính toán kích thước/vị trí của phần tử HTML. |

---

## 5. Context Layer (`src/context`)
Quản lý trạng thái toàn cục (Global State) chia sẻ giữa các thành phần không cùng cấp.

- **`AuthContext.tsx`**: Lưu trữ và cung cấp thông tin người dùng hiện tại (`user`), trạng thái đăng nhập, và các hàm `login`, `logout`. Đây là context quan trọng nhất để quản lý quyền truy cập.

---

## 6. Providers Layer (`src/providers`)
Bọc ứng dụng để cung cấp các dịch vụ/thư viện từ bên thứ ba.

- **`QueryProvider.tsx`**: Khởi tạo `QueryClient` cho TanStack Query, hỗ trợ caching dữ liệu API và tự động fetch lại khi cần.
- **Root Providers** (trong `layout.tsx`): Kết hợp nhiều provider như `ThemeProvider` (chế độ sáng tối), `SessionProvider`, và `Toaster` (thông báo popup).

---

## 7. Library & Core Integrations (`src/lib`)
Cấu hình các thư viện bên thứ ba cốt lõi.

- **`axios.ts`**: Cấu hình Base URL, Interceptors để tự động gắn Token vào Header.
- **`query-client.ts`**: Cấu hình global cho TanStack Query (caching, retry logic).
- **`tiptap-utils.ts`**: Các hàm trợ giúp xử lý nội dung văn bản trong Editor.
- **`common.ts`**: Các hằng số và hàm tiện ích dùng chung toàn ứng dụng.

---

## 8. Types & Schema (`src/types`)
- **`types-openapi/`**: Chứa hơn 500 file định nghĩa kiểu dữ liệu đồng nhất với Backend API (được generate tự động).
- **`types/`**: Các schema định nghĩa cho Form validation (Zod) và UI States.

---

## 9. Configuration & Providers (`src/providers`, `src/theme`)
- **Providers**: Quản lý `NextThemesProvider`, `QueryClientProvider`, `Toaster` (thông báo).
- **Theme**: Định nghĩa hệ màu (Primary, Secondary, Success, Danger) và cấu hình Dark Mode.
