# .agents/skills — Module kiến thức kỹ thuật/domain cho AI Agents

> Trạng thái: ACTIVE
>
> **Phân biệt với `.agents/rules/`:**
> - `.agents/rules/` = **cách suy nghĩ & hành xử** (nguyên tắc, quy trình, checklist tư duy) — ổn định, gần như không đổi khi kiến trúc đổi.
> - `.agents/skills/` = **kiến thức kỹ thuật/domain cụ thể** (stack, công nghệ, nghiệp vụ) — thay đổi/mở rộng theo tiến hóa của dự án.
>
> Khi kiến trúc thay đổi (vd: thêm API layer mới): **tạo skill mới hoặc bump version skill cũ — KHÔNG sửa `.agents/rules/`**.

## Format: theo chuẩn mở Agent Skills (agentskills.io)

Folder này tuân thủ **Agent Skills open standard** (Anthropic công bố 12/2025; được Claude Code, Codex, Gemini CLI, Cursor, VS Code/Copilot và nhiều tool khác hỗ trợ — theo skill gốc của repo nguồn, verified 2026-08-15; re-verify khi quá 6 tháng theo `00-core.md` §3.6):

```text
.agents/skills/
├── <skill-name>/            ← 1 skill = 1 folder, FLAT (không subfolder theo domain)
│   ├── SKILL.md             ← bắt buộc, đúng tên này
│   └── references/ scripts/ ← tùy chọn, tài liệu/script kèm theo (nạp khi cần)
├── _SKILL-template.md       ← khung để copy khi tạo skill mới (KHÔNG phải skill, tool bỏ qua)
├── VENDORED.md              ← nguồn/pin/precedence của skill copy từ upstream (KHÔNG phải skill)
└── README.md
```

Quy tắc `SKILL.md` (bắt buộc theo spec):
1. **Frontmatter YAML** tối thiểu 2 field:
   - `name`: kebab-case, ≤64 ký tự, **phải trùng chính xác tên folder** (sai là tool không load).
   - `description`: ≤1024 ký tự, nói rõ **skill làm gì + KHI NÀO dùng** — đây là phần duy nhất agent đọc lúc startup (progressive disclosure), viết bằng English để tương thích mọi tool.
2. Body markdown tự do (ngôn ngữ của PO OK); có dòng Trạng thái/Version/Ngày (theo `.agents/rules/planning.md` §5.1).
3. Mỗi fact chỉ sống ở **một chỗ**: skill phương pháp trỏ sang skill stack, không chép lại (chống drift).

## Skills hiện có

| Skill | Domain | Trạng thái |
|---|---|---|
| `stack-example/` | coding — kiến trúc hiện hành (**đổi tên** thành `stack-<name>` và điền nội dung khi khởi tạo dự án) | TEMPLATE |
| *(thêm)* `frontend-<framework>/`, `backend-architect/`, `<domain>/`... | theo tiến hóa dự án | — |

Domain của skill thể hiện qua `description` + bảng router `AGENTS.md` §2 — KHÔNG dùng subfolder theo domain (giữ flat để đúng chuẩn discovery của các tool).

## Quy ước vận hành

1. Skill nào được nạp cho mục đích nào → khai báo trong bảng router `AGENTS.md` §2. **Router là cơ chế nạp bảo đảm (deterministic); auto-discovery của từng tool chỉ là tiện ích bổ sung.** Bài học gốc: một file kiến thức không được router trỏ tới thì agent tuân thủ đúng quy trình sẽ không bao giờ đọc nó.
2. Skill bị thay thế → đánh `DEPRECATED` trong SKILL.md + trỏ tới skill thay thế, không xóa ngay.
3. Skill mới cần PO duyệt trước khi chuyển `ACTIVE` (một file quyết định trong `agents-doc/decisions/` nếu có quyết định kiến trúc đằng sau).
4. Skill **VENDORED** (copy từ upstream bên ngoài): nguồn + pin version + quy trình update + **bảng precedence** nằm ở `VENDORED.md`. Không sửa nội dung upstream tại chỗ; cần điều chỉnh cho repo → ghi override vào `VENDORED.md` §2 và skill stack (skill luôn được nạp cho task code).
5. **Cache fact đã verify** (`00-core.md` §3.6): mỗi skill có bảng "Facts đã kiểm chứng" (fact · nguồn · ngày · hạn) — agent verify xong ghi vào đây, lần sau dùng lại không search.

## Wiring auto-discovery (`.claude/skills/`)

`.agents/skills/` là **nguồn canonical duy nhất**. Claude Code chỉ tự quét `.claude/skills/`, nên repo tạo symlink trỏ ngược về, KHÔNG copy (tránh 2 bản nội dung lệch nhau):

```bash
mkdir -p .claude/skills
ln -sfn ../../.agents/skills/<skill-name> .claude/skills/<skill-name>
```

Chỉ symlink skill **nặng, dùng có điều kiện** (để progressive disclosure có ích); skill stack luôn nạp qua router thì không cần. Không symlink `_SKILL-template.md`/`VENDORED.md`.

Lưu ý Windows: git chỉ tái tạo symlink khi `core.symlinks=true` (cần Developer Mode hoặc admin). Không có symlink thì auto-discovery tắt — **không sao**, router `AGENTS.md` §2 vẫn là đường nạp bảo đảm; agent đọc thẳng file trong `.agents/skills/`.

**Không dùng CLI cài skill tự động** (`npx skills add` hay tương tự) ghi song song vào `.claude/skills/` lẫn `.agents/skills/`: không pin version và tạo 2 bản sao — mất single-source.
