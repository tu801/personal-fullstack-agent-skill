# 00-core — Quy tắc lõi (LUÔN áp dụng, mọi mục đích, mọi agent)

> Trạng thái: ACTIVE · Áp dụng cùng với bộ quy tắc theo mục đích (coding / debugging / planning / <domain>).
> File này KHÔNG chứa kiến thức stack. Kiến thức stack sống trong `.agents/skills/`.

## 1. Bối cảnh repo (đọc 1 lần cho mỗi phiên)

Xem `AGENTS.md` §0 (sản phẩm · stack · ràng buộc cứng · nguồn sự thật). Không lặp lại ở đây để tránh hai bản lệch nhau.

## 2. Ngôn ngữ (CRITICAL — không thương lượng)

- **Hội thoại/giải thích:** theo ngôn ngữ Product Owner (PO) dùng (mặc định template: tiếng Việt).
- **Code, comments, tên biến/hàm/bảng, commit message:** English ONLY — kể cả khi đang chat bằng ngôn ngữ khác.
- Tài liệu trong `agents-doc/`: ngôn ngữ của PO được phép (docs cho PO đọc). Frontmatter và `description` của skill: English (tương thích mọi tool).

## 3. Nguyên tắc suy luận chung

1. **Don't assume. Don't hide confusion. Surface tradeoffs.** Business logic chưa rõ → HỎI, không suy diễn, không tự tạo rule mới. Yêu cầu mâu thuẫn → dừng lại nêu rõ.
2. **Nhiều phương án → nêu 2–3 kèm trade-off, đề xuất phương án đơn giản nhất.** Không im lặng chọn một.
3. **Simplicity first:** lượng thay đổi tối thiểu giải đúng vấn đề; "might need later" = không làm bây giờ; tránh premature abstraction/over-engineering.
4. **Surgical changes:** đúng phạm vi task; không tự refactor/rename/đổi cấu trúc/thêm dependency ngoài yêu cầu; vấn đề ngoài phạm vi → ghi nhận & báo cáo, không tự sửa.
5. **Goal-driven, verify tới cùng:** chuyển task thành mục tiêu xác minh được; lặp sửa→chạy→quan sát; **không tuyên bố done khi chưa verify**; test fail thì nói rõ kèm output — không tô hồng.
6. **Verify latest, then reason — nhưng verify CÓ CHỌN LỌC (Simplicity First áp dụng cả cho việc search).** Mọi agent đều có knowledge cutoff; kiến thức về hệ sinh thái bên ngoài mặc định là **stale**. Tuy nhiên KHÔNG search tràn lan — search thừa vừa tốn token vừa làm loãng context, dẫn tới phân tích kém và gợi ý giải pháp tồi.
   - **KHÔNG cần verify (mặc định — đa số task):** business logic nội bộ; sửa code theo pattern/convention đã có trong repo; docs/typo; pure function; kiến thức đã có trong skill ACTIVE còn hạn tin cậy (xem Cache bên dưới).
   - **PHẢI verify (targeted, official docs / spec / release notes / repo gốc):** thêm/nâng version dependency hoặc chọn tool/service mới · thiết kế theo chuẩn/format/convention/protocol bên ngoài LẦN ĐẦU (chưa có trong skill) · viết code dựa trên API/behavior của dịch vụ ngoài chưa được skill cover · tuyên bố về pricing/limits/tính năng dịch vụ ngoài · security best practice cho thành phần mới · gặp lỗi nghi do version/deprecation (trường hợp này verify bất kể hạn tin cậy).
   - **Ngân sách search: 1–3 truy vấn CÓ MỤC TIÊU cho mỗi fact cần verify.** Xác định trước câu hỏi cụ thể cần trả lời rồi mới search — không search khám phá lan man. Quá 3 truy vấn vẫn chưa đủ kết luận → DỪNG, báo PO điều chưa xác minh được kèm phương án — không tiếp tục nạp nhiễu vào context rồi suy luận trên đó.
   - **Cache — verify 1 lần, dùng nhiều lần:** verify xong → ghi fact + nguồn + ngày vào skill liên quan trong `.agents/skills/` (hoặc bump mục có sẵn). Hạn tin cậy: chuẩn/convention/API surface = 6 tháng · pricing/limits = 3 tháng · luôn re-verify khi bump version package liên quan. Trong hạn → agent dùng skill, KHÔNG search lại; dòng Information Currency ghi "theo skill <tên> (verified <ngày>)".
   - Output khi có verify phải ghi **nguồn + ngày kiểm chứng**. "Tôi nhớ là..." không phải bằng chứng. **Fallback khi không có web access** (chỉ áp dụng cho nhóm PHẢI verify): nói rõ "chưa kiểm chứng được — kiến thức tới cutoff, có rủi ro outdated" và DỪNG chờ PO xác nhận trước khi thiết kế/code phần liên quan — không im lặng làm tiếp.
   - Mọi fact chưa kiểm chứng xuất hiện trong phân tích/đề xuất phải đánh dấu rõ `[ASSUMED — từ memory, chưa kiểm chứng]` — PO veto được với chi phí gần 0. Fact chưa kiểm chứng KHÔNG được dùng để bác một phương án.

## 4. Git

- Conventional Commits (`feat(scope): ...`, `fix(...)`, `docs(...)`, `chore(...)`).
- Trước khi sửa code: kiểm tra branch hiện tại là feature branch (`feat/*`, `feature/*`, `fix/*`); nếu không → cảnh báo PO trước khi action.
- **KHÔNG tự ý commit/push/force-push.** Chuẩn bị thay đổi, PO kiểm tra và thực hiện.
- **Đầu phiên:** `git fetch` + `git status -sb` (read-only). Local behind origin → báo PO `git pull --rebase` **trước** khi sửa docs dùng chung (nhiều máy/agent cùng commit một nhánh).
- **Cuối phiên:** ghi **một file bàn giao mới** trong `agents-doc/handoff/` (không sửa bảng/ file cũ), rồi nhắc PO `git pull --rebase` → commit → `git push` ngay — commit nhỏ, không dồn.
- Sau mỗi lần PO force-push (history rewrite): các máy khác `git fetch && git reset --hard origin/<branch>` — tuyệt đối không `git pull`.

## 5. An toàn dữ liệu & chi phí (nhắc lại từ AGENTS.md §5 — vi phạm là lỗi nghiêm trọng)

- File từ nguồn ngoài → rà PII/secret trước khi vào repo; ảnh/PDF crop/blur tay.
- Secrets: không hardcode, không vào bundle/Git/AI prompt; chỉ ở nơi secret của hạ tầng hoặc `.env` local (agent không đọc/tạo/sửa).
- Không thêm dịch vụ/hạ tầng có recurring cost khi chưa qua 4 câu hỏi (AGENTS.md §5.2) + PO duyệt tường minh. Khi nói về pricing/tính năng dịch vụ ngoài: kiểm tra thông tin hiện hành, ghi rõ version — không dùng trí nhớ cũ.
- **Mọi thay đổi agent tạo ra phải có người thật xác nhận** (AGENTS.md §5.5): tool ghi mặc định `dry_run=true`, ghi thật cần hành động tường minh của con người. Agent không xác nhận thay người dùng; bản "sẽ ghi" hiển thị nguyên văn, không tóm tắt.
- Thao tác nguy hiểm (destructive migration, xóa dữ liệu, history rewrite, production deployment) → phân tích Risk / Downtime / Rollback plan và chờ PO xác nhận, không tự chạy.

## 5.1. Tách dữ liệu thật và dev/test

- Fixture/dữ liệu mẫu dùng cho dev/test phải nằm ở folder/tài khoản riêng, được PO chỉ định tường minh; agent coding chỉ dùng fixture, không đọc dữ liệu thật làm mẫu, không copy dữ liệu thật sang fixture và ngược lại.
- Ví dụ/placeholder trong UI, test, docs dùng chung: dùng tên chung, không dùng tên người/tài sản/tổ chức thật của PO.
- <Điền mapping cụ thể của dự án tại đây nếu có: fixture nào, môi trường nào, cách khôi phục baseline (vd `git checkout -- <folder> && git clean -fd <folder>`)>.

## 6. Báo cáo hoàn thành task (bắt buộc, cuối mỗi task)

```text
Summary            — task đã làm gì
Reason             — lý do (feature / fix / security / docs / upgrade)
Changes            — file/function/migration nào thay đổi
Version Changes    — nếu có (package, schema version)
Breaking Changes   — liệt kê; không có ghi "None"
Impact Analysis    — module/flow bị ảnh hưởng
Required Validation— chức năng cần PO kiểm tra lại
Local Test Steps   — các bước verify local
Information Currency — nguồn external đã kiểm chứng + ngày (§3.6); "N/A" nếu task không chạm external ecosystem
Rollback Plan      — cách hoàn tác
Risk Level         — Low / Medium / High
```

Task nhỏ (sửa docs, typo) được rút gọn còn Summary + Changes + Risk.
