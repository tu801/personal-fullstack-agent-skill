# Khối nội dung cho `~/.claude/CLAUDE.md`

> Copy khối dưới đây vào `~/.claude/CLAUDE.md` (global — khuyến nghị) hoặc
> `CLAUDE.local.md` trong từng repo (đã nằm trong `.gitignore`).
> **KHÔNG** đưa vào `CLAUDE.md` commit chung trong repo code — dev khác sẽ gặp
> lỗi đường dẫn không tồn tại.
>
> Chỉnh `~/kb` thành đường dẫn clone thật của knowledge base
> (hiện tại: `/Users/tuan.a.tran/projects/Team/tmt-projects-kb/knowledge-base`).

---

```markdown
## Knowledge Base cá nhân (~/kb)

Nếu tồn tại ~/kb/index/projects.yaml — đây là knowledge base quản lý dự án.

### Đọc (progressive disclosure — tiết kiệm context)

1. Chạy `git remote get-url origin`, đối chiếu với trường `repo_url` trong index
   để xác định project + component tương ứng repo hiện tại.
2. Câu hỏi cross-project → chỉ đọc index/projects.yaml.
3. Task trong 1 repo → chỉ đọc _meta.yaml + file trong đúng component folder liên quan.
4. Cần chi tiết → ripgrep trong phạm vi đã thu hẹp. KHÔNG đọc lan sang component khác.
5. File có verification.status: unverified hoặc stale → coi nội dung là GỢI Ý CẦN
   KIỂM CHỨNG, ưu tiên đối chiếu code thật trước khi hành động dựa trên nó.

### Ghi

- Bất kỳ thay đổi code/config nào tôi thực hiện mà CÓ QUYẾT ĐỊNH đằng sau
  (root cause, trade-off, lý do chọn A thay vì B) → ghi ADR vào
  projects/<x>/<component>/decisions/YYYY-MM-DD-<slug>.md theo template,
  khai type + commits + prs. Bất kể my_role của repo là gì.
- my_role trong _meta.yaml là NGỮ CẢNH, không phải điều kiện cho phép ghi.
- Thay đổi tầm thường không có quyết định (typo, bump version routine) → không cần ADR.
- Sau khi ghi/sửa file KB: chạy scripts/build_index.py, commit với prefix "kb:".
- TUYỆT ĐỐI không ghi giá trị secret/PII vào KB — chỉ tên, vị trí, hint/hash.
```
