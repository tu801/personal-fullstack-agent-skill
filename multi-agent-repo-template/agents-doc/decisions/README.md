# Decisions — Index (sinh tự động, KHÔNG sửa tay)

> Sinh bởi `pnpm decisions:index` từ frontmatter của các file trong thư mục này; `pnpm lint:docs` chạy bản `--check` và đỏ khi index lệch. Một file = một quyết định theo MADR 4.0.0. **Quyết định mới:** copy `_template.md` → `NNNN-<id>-<slug>.md` (`status: proposed`) → chạy lại lệnh sinh; NNNN chỉ để sắp thứ tự, ID mới là danh tính (trùng NNNN giữa hai phiên song song không sao). **PO chốt:** agent đổi `status` + `date` trong đúng file đó rồi sinh lại index.
>
> **Khi nào chạy `pnpm decisions:index`:** ngay sau khi (1) tạo file quyết định mới, (2) đổi `status` / `date` / tiêu đề của một file — do chính agent vừa sửa chạy, trong cùng lượt. Quên → `pnpm lint:docs` (local, và CI khi mở PR) đỏ với thông báo rõ; không có lỗi im lặng. Index chỉ là **bản nhìn** cho người đọc, không phải chỉ mục tra cứu: tìm kiếm đi thẳng vào frontmatter và không phụ thuộc file này — danh sách đang mở luôn đúng bằng `grep -l '^status: proposed' agents-doc/decisions/[0-9]*.md`.
>
> Tổng 1 · đang mở 0 · accepted 1 · rejected 0 · deprecated 0 · superseded 0

## Đang mở (proposed) — 0 mục

| ID | Tiêu đề | Phase | Ngày | File |
|---|---|---|---|---|

## Đã chốt / đã loại — theo phase

### Xuyên phase (cross) — 1 mục

| ID | Tiêu đề | Trạng thái | Ngày | File |
|---|---|---|---|---|
| T1 | Áp dụng khung làm việc nhiều agent (router · rules · skills · decisions · handoff · plans) cho repo này | accepted | 2026-09-17 | [0001-t1-ap-dung-khung-lam-viec-nhieu-agent.md](./0001-t1-ap-dung-khung-lam-viec-nhieu-agent.md) |
