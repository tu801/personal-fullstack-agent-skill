# Execution Plans — Index

> Trạng thái: **ACTIVE** · Bộ kế hoạch thực thi chi tiết, mỗi file = 1 giai đoạn (phase). Nguồn sự thật nghiệp vụ: `../spec.md`.

| File | Giai đoạn | Trạng thái | Gate để bắt đầu |
|---|---|---|---|
| `phase-0-foundation.md` | Nền móng: repo, CI, baseline schema/auth, shell app, contracts cho agent | NOT STARTED | — |
| `phase-1-<name>.md` | … | NOT STARTED | Gate 0→1 pass |

## Trạng thái và việc tiếp theo — rà soát YYYY-MM-DD
<!-- 3–6 dòng: đã xong gì, đang ở đâu, ưu tiên kế tiếp. Việc phụ còn mở → KHÔNG liệt kê lại — xem mục "Đang mở" của agents-doc/decisions/README.md để khỏi lệch. -->

## Quy ước chung cho mọi file kế hoạch

1. **Trạng thái từng bước:** `[ ]` chưa làm · `[~]` đang làm · `[x]` xong (đã verify). Cập nhật **NGAY tại thời điểm** bắt đầu/hoàn thành step — không đợi cuối phiên. `[x]` chỉ đánh khi test/acceptance của step pass.
2. **Bàn giao:** một file/phiên trong `agents-doc/handoff/` — KHÔNG có bảng bàn giao trong file plan. Agent bắt đầu phiên PHẢI `git fetch` + đọc checklist + 1–3 file bàn giao mới nhất, làm tiếp từ chỗ dừng, không làm lại step đã `[x]` (`.agents/rules/planning.md` §5).
3. **Input/Output:** function được mô tả bằng chữ ký kiểu TypeScript-style (hoặc tương đương của stack); kiểu dữ liệu nhạy cảm (tiền, thời gian) theo quy tắc trong skill stack §4.
4. **Errors:** mã lỗi chuẩn của contract liệt kê ở skill stack §4; thêm mã mới = thêm vào đó + ghi step/ngày.
5. **Định nghĩa Done cho mọi bước có code:** `spec.md` § Definition of Done.
6. **Khi thay đổi schema/contract:** migration + cập nhật tài liệu thiết kế theo skill stack §2.
7. **Test levels:** `UT` unit · `IT` integration · `E2E` end-to-end · `MT` manual trên thiết bị/môi trường thật.
8. Mỗi phase kết thúc bằng **Gate checklist** — không sang phase sau khi gate chưa pass. Mục gate đóng phải ghi **bằng chứng** (run CI nào, lệnh nào, ai xác nhận, ngày) ngay cạnh checkbox.

## User journeys chuẩn
<!-- Copy từ spec §2 (ID + một dòng mô tả) — kế hoạch và E2E bám theo đây. -->
