---
name: stack-example
description: Stack-specific engineering knowledge for this repo's current architecture (REPLACE with the real stack, e.g. "React/Vite PWA + Supabase Postgres/RLS + Cloudflare Pages, pnpm monorepo"). Contains the change-impact component list, database/infra change checklist, security review specifics, code conventions, testing requirements, CI pipeline rules and the cache of verified external facts. Use for ANY coding task in this repo — writing or modifying application code, migrations, contracts, tests, or CI configuration. Always load together with .agents/rules/coding.md.
---

# Skill: Stack <NAME> (kiến trúc hiện hành)

> Trạng thái: **TEMPLATE — đổi tên folder + `name:` thành `stack-<name>` rồi điền** · Version 0.1 · Ngày đổi trạng thái: YYYY-MM-DD
> Áp dụng cho kiến trúc theo `agents-doc/spec.md` §<stack>.
> Nạp cùng `.agents/rules/00-core.md` + `.agents/rules/coding.md` cho mọi task code.
> **Kiến trúc thay đổi → tạo skill mới / bump version file này — KHÔNG sửa `.agents/rules/coding.md`.**
>
> Các mục dưới đây là **đúng những chỗ rules trỏ sang** ("→ skill stack"). Giữ đủ mục, điền nội dung thật của dự án; mục nào chưa áp dụng ghi "N/A" kèm lý do, không xóa.

## 1. Change Impact — danh mục thành phần của repo này (dùng với `coding.md` §2)

Khi sửa code, rà ảnh hưởng tới: <liệt kê: API/RPC contracts + mã lỗi chuẩn · schema + authorization policies · generated types · domain packages dùng chung · background jobs · CLI/MCP tools của agent · CI pipeline · UI từng nền tảng · tài liệu thiết kế>.

## 2. Database / Infra Change Checklist (dùng với `coding.md` §6)

1. Chỉ qua migration file trong `<đường dẫn>` — không SQL ad-hoc vào DB.
2. Phân tích: existing data impact · authorization impact (bảng mới = policy mới, deny-by-default) · lock/index · backward compatibility · rollback strategy.
3. Destructive migration → nêu Risk/Rollback, chờ PO duyệt.
4. Linter/advisor của platform chạy trước khi đóng task: `<lệnh>`; phát hiện SECURITY phải xử lý hoặc giải trình.
5. Sau migration: bump version tài liệu schema `<file>` + changelog + regenerate types `<lệnh>`.
6. Bất biến dữ liệu của dự án (vd: bảng ledger không có đường ghi trực tiếp, mọi ghi qua RPC): <điền>.

## 3. Security Review Checklist — nội dung cụ thể cho trigger ở `coding.md` §1.5/§5

- Broken access control đặc thù stack: <vd: policy cross-tenant, view thiếu `security_invoker`, function `SECURITY DEFINER` thiếu `search_path`>.
- Injection trong <RPC/handler nhận jsonb/text>: parameterized only.
- Secrets/PII exposure: <key nào là public by design, key nào tuyệt đối không vào bundle>; lệnh rà PII: `<lệnh>`.
- XSS / path traversal: <điểm render nội dung người dùng, điểm import file>.

## 4. Chuẩn code & domain

- Naming theo lớp: <TS camelCase/PascalCase · SQL snake_case · ...>. Comments English only.
- Kiểu dữ liệu nhạy cảm (tiền, thời gian, timezone): <quy tắc, vd: aggregate ở SQL, client chỉ format; kỳ báo cáo qua một hàm chung>.
- Mã lỗi chuẩn của contract: `<ERR_A / ERR_B / ...>` — client map mã → thông điệp ở `<file>`, không normalize hai lần.
- Tool ghi của agent (CLI/MCP): `dry_run` mặc định true, trả **bản sẽ ghi** + mã duyệt; server stdio không `console.log` (stdout là protocol).

## 5. Testing — yêu cầu cụ thể của repo (dùng với `coding.md` §1.4)

- Business-critical logic **bắt buộc có test**: <danh sách>.
- Golden tests dùng số liệu đã định nghĩa trong `agents-doc/plans/` — không tự chế số.
- Tầng test: `UT` <runner> · `IT` <môi trường, guard local-only> · `E2E` <runner + trình duyệt/thiết bị> · `MT` thiết bị thật tại gate.
- Definition of Done cho feature: `agents-doc/spec.md` §<DoD>.
- Bẫy đã gặp (ghi ngày): <vd: assert vắng mặt trên màn dùng chung → CI xanh giả; test phụ thuộc "hôm nay">.

## 6. CI pipeline

- Thứ tự job: <format → lint → typecheck → test → build → audit → secret scan; integration/E2E>. Chạy khi: <PR vào main / push>. Lý do (quota, chi phí): <quyết định ID>.
- Bẫy pipeline đã gặp (ghi ngày): <vd: lint cần artefact build; gen types không tất định → so sánh sorted>.

## 7. Logging & observability

- Mức log: <structured console/stderr; không in dữ liệu nhạy cảm>. Có/không dashboard/alerting: <quyết định free-first>.

## 8. Facts đã kiểm chứng (cache — `00-core.md` §3.6)

| Fact | Nguồn (URL / doc version) | Ngày kiểm chứng | Hạn tin cậy |
|---|---|---|---|
| <vd: CLI X ≥ 2.81 có lệnh `advisors`> | <official docs> | YYYY-MM-DD | 6 tháng |

## Changelog
- 0.1 (YYYY-MM-DD): khởi tạo từ template.
