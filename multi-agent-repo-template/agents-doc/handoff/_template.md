---
date: 2026-01-01
time: "16:15"
agent: claude-code (coding)        # codex (docs) · gemini (planning) · copilot (coding) …
phase: 1                           # số phase, hoặc cross khi việc nằm ngoài phase
step: "1.2"                        # hoặc "ngoài step — <tên việc>"
area:                              # KHU VỰC đã đụng — để phiên song song không chồng nhau
  - path/to/module/
  - agents-doc/decisions/
status: done                       # done · paused · blocked
---

## Kết quả / việc đang dở
- Đủ cụ thể để agent khác tiếp tục mà không đoán: file đang sửa dở, test nào chưa chạy, blocker gì.
- Verify: lệnh đã chạy + kết quả nguyên văn (không tô hồng — `00-core.md` §3.5).

## Ngoài phạm vi, ghi nhận
- Vấn đề nhìn thấy nhưng KHÔNG sửa (coding.md §1.3) — để PO quyết.

## Việc kế tiếp
- Cho PO: lệnh commit gợi ý (Conventional Commits), quyết định cần chốt (ID).
- Cho agent sau: step kế tiếp, điều kiện bắt đầu.
