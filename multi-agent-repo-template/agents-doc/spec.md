# <PROJECT_NAME> — System Spec

> Trạng thái: **DRAFT** · Version 0.1 · Ngày đổi trạng thái: YYYY-MM-DD
> Nguồn sự thật DUY NHẤT về sản phẩm & kiến trúc. Agent đọc **theo section** (`grep -n '^## '`), không đọc trọn (`AGENTS.md` §3). Mọi thay đổi hành vi/kiến trúc đã chốt phải cập nhật vào đây trong cùng lượt — không để spec lệch code.

## 1. Mục tiêu & phạm vi
<!-- Sản phẩm làm gì, cho ai, KHÔNG làm gì ở mức một đoạn. -->

## 2. Người dùng & user journeys chuẩn
<!-- J1, J2... — kế hoạch và test bám theo các journey này (planning.md §3). -->

## 3. Nguyên tắc kiến trúc (bất biến)
<!-- 5–8 nguyên tắc, mỗi cái một dòng, có ID để trích (vd 3.1, 3.2). planning.md §4 tóm tắt lại từ đây. -->

## 4. Non-goals
<!-- Những gì cố ý KHÔNG làm. Agent planning đọc mục này TRƯỚC. Mở lại một non-goal = một file quyết định. -->

## 5. Stack & hạ tầng
<!-- Tổng quan; chi tiết kỹ thuật/convention nằm trong .agents/skills/stack-<name>/SKILL.md. Chi phí recurring mục tiêu. -->

## 6. Mô hình dữ liệu & contract
<!-- Trỏ sang tài liệu chi tiết (database-erd.md, api-contracts.md) + quy tắc version của chúng. -->

## 7. Bảo mật & dữ liệu nhạy cảm
<!-- Tầng authorization duy nhất; secrets sống ở đâu; PII; quy tắc dữ liệu thật vs fixture (00-core §5.1). -->

## 8. Tool cho agent (nếu có: CLI / MCP)
<!-- Danh sách tool đọc/ghi; dry_run mặc định; cổng xác nhận của con người (AGENTS.md §5.5). -->

## 9. Definition of Done cho mọi feature
<!-- Danh sách tick: code + test theo tầng + authorization + error/empty state + docs cập nhật + ... coding.md §1.4 trỏ tới đây. -->

## 10. Roadmap theo phase & gate
<!-- Phase 0..N một dòng mỗi phase; chi tiết ở agents-doc/plans/. -->
