# coding — Quy tắc khi viết/sửa code, migration, CI

> Trạng thái: ACTIVE · Áp dụng cùng `00-core.md`.
> File này chỉ chứa **nguyên tắc lập trình chung, không phụ thuộc stack** — giữ ổn định kể cả khi kiến trúc thay đổi.
> Kiến thức kỹ thuật cụ thể của kiến trúc hiện hành → **bắt buộc nạp thêm skill ACTIVE** trong `.agents/skills/` (skill stack theo bảng `AGENTS.md` §2).

## 1. Core Engineering Principles — 5 nguyên tắc kỹ thuật cốt lõi

> Đây là **nền tảng** — mọi checklist/standard đều phục vụ 5 nguyên tắc này. Khi các rule mâu thuẫn nhau: ưu tiên nguyên tắc cốt lõi và **HỎI LẠI Product Owner**. (`00-core.md` §3 là bản tóm tắt dùng chung; bản dưới đây là bản đầy đủ cho công việc code.)

### 1.1. Think Before Coding — "Don't assume. Don't hide confusion. Surface tradeoffs."

- Trước khi sửa/viết code, luôn trình bày theo thứ tự: **Current Behavior → Expected Behavior → Root Cause → Proposed Solution**.
- Không fix lỗi dựa trên symptom hay error message (quy trình đầy đủ: `debugging.md`).
- Business logic chưa rõ → **HỎI LẠI**, không tự suy diễn, không tự tạo business rule mới, không tự đổi hành vi hiện tại.
- Nhiều cách giải → nêu **2–3 phương án kèm trade-off**, đề xuất phương án đơn giản nhất — không im lặng chọn một.
- Yêu cầu khó hiểu/mâu thuẫn → **dừng lại nêu rõ**, không che giấu để "code cho xong".
- **Trước khi đề xuất Solution:** rà xem giải pháp có rơi vào nhóm **PHẢI verify** của `00-core.md` §3.6 không → nếu có, **verify latest (tối đa 1–3 truy vấn có mục tiêu) TRƯỚC, thiết kế SAU**; nếu không (đa số task) → dùng skill ACTIVE + kiến thức repo, không search. Thiết kế xong mới verify = lỗi quy trình.
- Trước khi code một bước trong kế hoạch: đọc **đúng step** trong file phase của `agents-doc/plans/` (grep tên step → đọc khoảng đó; không nạp trọn file) — I/O, test và acceptance đã định nghĩa sẵn ở đó; không tự chế lại. Spec chỉ đọc đúng § mà step trích dẫn (`AGENTS.md` §3).

### 1.2. Simplicity First — "Minimum code that solves the problem. Nothing speculative."

- Viết lượng code **tối thiểu** giải quyết đúng vấn đề được yêu cầu.
- Không thêm tính năng không được yêu cầu — "might need later" nghĩa là **không làm bây giờ**.
- Không premature abstraction cho code chỉ dùng một lần; không thêm flexibility/config/option chưa ai cần; không error handling cho tình huống không thể xảy ra.
- Ưu tiên: giải pháp đơn giản nhất, chi phí thấp nhất, ít điểm bảo trì nhất. **Tránh over-engineering.**

### 1.3. Surgical Changes — "Touch only what you must. Clean up only your own mess."

- Chỉ thay đổi đúng phạm vi task. KHÔNG tự refactor architecture, rename file/function, đổi cấu trúc thư mục, đổi convention, thêm dependency — trừ khi PO yêu cầu rõ ràng.
- Không "cải thiện" code liền kề đang chạy tốt; match style hiện có của file/dự án.
- Chỉ xóa import/biến/hàm mà **chính thay đổi của mình** làm thành thừa.
- Vấn đề ngoài phạm vi → **ghi nhận & báo cáo** (mục "Ngoài phạm vi" trong handoff), KHÔNG tự sửa.
- **Legacy compatibility:** xác định input/output/luồng xử lý cũ; giải pháp mới không làm gãy behavior hiện tại, không đổi contract ngoài ý muốn, không gây regression. Mọi breaking change phải nêu rõ và được PO chấp thuận.

### 1.4. Goal-Driven Execution — "Define success criteria. Loop until verified."

- Chuyển task thành **mục tiêu xác minh được** trước khi bắt tay; nêu kế hoạch ngắn với checkpoint kiểm chứng.
- Fix bug / thêm feature → đề xuất đủ 3 loại test: **Reproduction** (tái hiện bug) · **Verification** (xác nhận đã sửa) · **Regression** (không hỏng cái cũ). Ưu tiên Unit → Integration → E2E.
- Lặp (sửa → chạy → quan sát) tới khi đạt tiêu chí. **Không tuyên bố "done" khi chưa verify.** Test fail → nói rõ kèm output; bỏ qua bước nào → nói rõ. **Không tô hồng kết quả.**
- Yêu cầu test cụ thể của repo (danh sách business-critical, golden tests, tầng test, Definition of Done) → skill stack.
- Không viết test phụ thuộc "hôm nay" / thứ tự chạy / dữ liệu còn sót từ test khác; test phải tự dọn.

### 1.5. Security & Production Safety by Default — "Assume hostile input. Never touch prod without a rollback plan."

- Mọi thay đổi chạm **Authentication / Authorization / File Upload / DB Query / External API / Secret Management** → tự chạy security review theo checklist §5 **và** checklist cụ thể trong skill stack trước khi kết thúc task.
- Luôn validate input ở mọi entry point; **không bao giờ hardcode secret**; secrets không vào bundle/Git/prompt.
- **KHÔNG tự thực hiện/đề xuất chạy trực tiếp** khi chưa phân tích **Risk / Downtime / Rollback plan** và chưa được PO xác nhận rõ ràng: destructive database migration · production deployment · production data modification · git history rewrite · IaC apply/destroy.
- Thay đổi DB/hạ tầng phải qua checklist §6; code mới phải giữ pipeline CI xanh trước khi merge.

## 2. Change Impact Checklist (trước khi thực hiện — generic)

Bắt buộc rà trước khi sửa: callers/callees của function · contracts (API/RPC/function signatures) · database schema + authorization rules · background jobs/scheduled tasks · event consumers/queue workers · CI/CD pipeline · UI trên mọi nền tảng được hỗ trợ · tài liệu liên quan (spec/plans/skill). Không sửa một file đơn lẻ mà bỏ qua luồng liên quan. **Danh mục thành phần cụ thể của repo → skill stack.**

## 3. Dependency & Package Upgrade Checklist

- Bắt buộc kiểm tra: official documentation · release notes · migration guide · breaking changes · security advisories/CVE.
- Ghi rõ: current version → target version · lý do nâng cấp · breaking changes · các file cần sửa.
- **Không suy đoán behavior của package** — kiểm chứng bằng release notes/docs hiện hành.
- Không thêm dependency mới ngoài phạm vi task; cần thì trình **build-vs-buy**: tự viết vs ≥2 package đã kiểm chứng (maintenance, size, license, CVE) → PO duyệt trước khi code.
- Lockfile: cài bằng chế độ frozen (`--frozen-lockfile` hoặc tương đương); không regenerate lockfile trong CI.

## 4. Chuẩn chung

- Naming: `camelCase` biến/hàm; `PascalCase` class/component/type; `snake_case` cho định danh SQL. Comments English only (`00-core.md` §2). Convention chi tiết theo stack → skill stack.
- Match style code xung quanh; không đổi convention giữa chừng. Formatter lo format, linter lo correctness — hai thứ không được đánh nhau.
- Trả lời về framework/library/cloud service: ghi rõ version + kiểm tra tài liệu hiện hành — không dùng kiến thức version cũ cho version mới (`00-core.md` §3.6).
- Server/CLI dùng stdout làm protocol (vd MCP stdio) → **không log ra stdout**; log ra stderr.

## 5. Security Review Checklist (tự rà, tool-agnostic)

- Broken access control (user A đọc/ghi dữ liệu của B? resource mới quên bật authorization? policy "cho tất cả"?).
- Injection: SQL (parameterized only) · command · template.
- XSS (render nội dung người dùng nhập) · SSRF (URL người dùng cung cấp) · path traversal (import/upload file).
- Sensitive data exposure: secret/PII trong log, bundle, commit, file mới; thông điệp lỗi lộ nội bộ.
- Kiểm tra bổ sung đặc thù stack → skill stack (vd RLS pitfalls, `security definer`, CORS, JWT).

## 6. Infrastructure & Database Change Checklist

**IaC / hạ tầng** — phải phân tích: resource nào bị recreate · downtime risk · state impact · security impact · cost impact.

**Database** — đổi schema phải phân tích: existing data impact · lock risk · index impact · backward compatibility · rollback strategy. Chỉ qua migration file có version — không SQL ad-hoc vào DB. Destructive migration → chờ PO duyệt (§1.5). Sau migration: cập nhật tài liệu schema theo quy tắc trong skill stack.

## 7. CI/CD

- Pipeline tối thiểu: **Format/Lint → Typecheck → Unit test → Build → Secret scan → Dependency audit**; integration/E2E theo skill stack. Thứ tự lint-trước-build có thể fail nếu lint cần artefact build — skill stack ghi rõ bẫy này nếu có.
- Mọi thay đổi source phải kiểm tra ảnh hưởng tới pipeline; **không merge giải pháp có nguy cơ làm fail pipeline**.
- Docker (nếu có): multi-stage build; không secret trong image.
