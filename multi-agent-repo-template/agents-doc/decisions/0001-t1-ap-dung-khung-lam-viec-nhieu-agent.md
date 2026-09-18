---
id: T1
status: accepted
date: 2026-09-17
decision-makers: [Product Owner]
group: T
phase: cross
---

# T1. Áp dụng khung làm việc nhiều agent (router · rules · skills · decisions · handoff · plans) cho repo này

## Bối cảnh và vấn đề (Context and Problem Statement)

Repo sẽ có nhiều AI agent (Claude Code, Codex, Gemini, Copilot) trên nhiều máy thay phiên nhau code. Không có khung chung thì mỗi tool đọc một file instructions riêng, quy tắc trôi dạt giữa các bản, agent sau không biết agent trước dừng ở đâu, và quyết định của PO nằm rải trong chat. Khung này được chưng cất từ một repo đã vận hành thật với 4 agent trong hơn một tháng (2026-08 → 2026-09), gồm cả các sự cố đã dẫn tới từng quy tắc.

## Yếu tố quyết định (Decision Drivers)

- Một nguồn sự thật cho quy tắc; mọi tool đọc được (chuẩn `AGENTS.md`, `CLAUDE.md`/`GEMINI.md` chỉ trỏ về).
- Tách **cách hành xử** (ổn định) khỏi **kiến thức stack** (thay đổi) để đổi kiến trúc không phải sửa rules.
- Nhiều agent/máy cùng commit một nhánh → tài liệu dùng chung phải viết theo kiểu **thêm file mới, không chèn dòng vào file chung** (chống conflict).
- Queue "chờ PO chốt" phải tách khỏi audit trail, có index sinh tự động và lint bắt lệch — bài học từ một file pending-decisions 232 KB làm agent bỏ sót quyết định đã chốt.

## Phương án đã cân nhắc (Considered Options)

- (A) Mỗi tool một file instructions riêng, nội dung copy tay.
- (B) **Router `AGENTS.md` + hai tầng `.agents/rules/` · `.agents/skills/` + `agents-doc/{decisions,handoff,plans}` với lint sinh index.**
- (C) Chỉ một file `AGENTS.md` dài chứa tất cả.

## Kết quả quyết định (Decision Outcome)

- **Chọn (B).** (A) trôi dạt chắc chắn; (C) không đọc theo việc được và mọi phiên đều sửa cùng một file.
- **Trả lời (PO):** OK — áp dụng template ngày khởi tạo repo.

### Hệ quả (Consequences)

- Tốt: mọi agent đọc cùng một router; quyết định/bàn giao có chỗ cố định và không conflict; đổi stack chỉ đụng skills.
- Đánh đổi: mỗi phiên phải viết một handoff và chạy `pnpm decisions:index` khi đụng quyết định — chi phí vài phút, có lint nhắc.

### Xác nhận (Confirmation)

- `pnpm lint:docs` xanh trên repo mới; `AGENTS.md` §0 đã điền; skill `stack-<name>` đã đổi tên và có nội dung; handoff đầu tiên tồn tại sau phiên khởi tạo.

## Thông tin thêm (More Information)

- File này đồng thời là **ví dụ định dạng** cho quyết định trong repo. Khi dùng template cho dự án thật: giữ lại (đổi ngày) hoặc xoá và sinh lại index.
