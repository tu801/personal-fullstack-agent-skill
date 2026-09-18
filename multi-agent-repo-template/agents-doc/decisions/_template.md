---
id: XX1
status: proposed
date: 2026-01-01
decision-makers: [Product Owner]
group: XX
phase: cross
---

# XX1. Tiêu đề ngắn — nêu được vấn đề và hướng giải

<!-- Template theo MADR 4.0.0 (adr.github.io/madr, kiểm chứng 2026-09-14 tại repo nguồn).
     Cách dùng: copy file này thành `NNNN-<id thường>-<slug>.md` (NNNN = số kế tiếp trong thư mục; ID = mã nhóm + số,
     vd AH1 — ID mới là danh tính, NNNN chỉ để sắp thứ tự; trùng NNNN giữa hai phiên song song không sao). Điền frontmatter:
     `status: proposed`, `date` = hôm nay, `phase` = số phase hoặc cross, `group` tuỳ chọn (chỉ khi nhiều quyết định sinh cùng
     một sự cố/phiên). Chạy `pnpm decisions:index`. PO chốt → đổi `status` (accepted | rejected | deprecated | superseded by <ID>)
     + `date`, ghi câu trả lời vào "Kết quả quyết định", sinh lại index.
     Mục nào không cần thì xoá — MADR đánh dấu tất cả trừ Bối cảnh và Kết quả là tuỳ chọn. Xoá comment này. -->

## Bối cảnh và vấn đề (Context and Problem Statement)

Hai đến ba câu: hiện trạng, vì sao phải quyết, cái gì sai/thiếu. Trích dẫn spec §, step plan, handoff nếu có. Có số đo thì đưa số đo.

## Yếu tố quyết định (Decision Drivers)

- Ràng buộc/nguyên tắc chi phối (free-first, một dev bảo trì dài hạn, bất biến kiến trúc §3 spec…).

## Phương án đã cân nhắc (Considered Options)

- (A) …
- (B) …

## Kết quả quyết định (Decision Outcome)

- **Đề xuất (mặc định):** (A) — vì …
- **Trả lời (PO):** ⬜ — PO ghi `OK` hoặc quyết định khác; agent đổi `status`/`date` rồi `pnpm decisions:index`.

### Hệ quả (Consequences)

- Tốt: … · Xấu/đánh đổi: …

### Xác nhận (Confirmation)

- Kiểm bằng gì: test, migration, file/section docs phải đổi theo. Khi làm xong ghi "**Đã thực hiện <ngày> (<agent>)**" kèm danh sách file.

## Ưu/nhược của từng phương án (Pros and Cons of the Options)

- (A) tốt vì … · xấu vì …
- (B) …

## Thông tin thêm (More Information)

- Link handoff, sự cố gốc, số đo, nguồn đã kiểm chứng (+ ngày).
