# AGENTS.md — Quy tắc chung cho MỌI AI Agent trong repo này

> File này là **router quy tắc canonical** của repo `<PROJECT_NAME>`. Mọi AI agent (Claude Code, Codex/OpenAI, Gemini CLI/Antigravity, GitHub Copilot — trên bất kỳ máy nào: macOS, Windows, Linux) làm việc trong repo này ĐỀU PHẢI đọc file này trước khi thao tác, sau đó nạp đúng bộ quy tắc theo mục đích công việc.
>
> Cách dùng template: thay `<PROJECT_NAME>`, điền §0, giữ nguyên phần còn lại trừ khi Product Owner (PO) quyết định khác. Đổi quy tắc = một file quyết định trong `agents-doc/decisions/`, không sửa lặng lẽ.

## 0. Bối cảnh dự án (điền một lần, ngắn — agent đọc mỗi phiên)

- **Sản phẩm:** <một câu: làm gì, cho ai>.
- **Stack:** <frontend → backend → hạ tầng>. Kiến thức stack chi tiết sống trong `.agents/skills/stack-<name>/SKILL.md`, KHÔNG viết ở đây.
- **Ràng buộc cứng:** <vd: 1 developer bảo trì dài hạn · chi phí recurring ≈ 0 · private repo>.
- **Nguồn sự thật sản phẩm/kiến trúc:** `agents-doc/spec.md`.

## 1. Thứ tự ưu tiên khi có mâu thuẫn (precedence)

```text
1. Chỉ thị trực tiếp của Product Owner trong phiên làm việc
2. Quy tắc repo này (AGENTS.md + .agents/rules/*)
3. Skill trong .agents/skills/ (kiến thức kỹ thuật; skill VENDORED xếp sau skill repo tự viết)
4. Global instructions của từng tool (vd ~/.claude/CLAUDE.md, ~/.codex/instructions.md)
```

Trong phạm vi repo này, quy tắc repo **thắng** global instructions của tool. Gặp mâu thuẫn không tự giải được → dừng lại, hỏi PO.

## 2. Chọn bộ quy tắc + skill theo mục đích (bắt buộc)

Hai tầng: **`.agents/rules/`** = cách suy nghĩ & hành xử (ổn định, không đổi theo stack) · **`.agents/skills/`** = kiến thức kỹ thuật/domain cụ thể (thay đổi theo tiến hóa kiến trúc — xem `.agents/skills/README.md`).

| Mục đích công việc | Rules phải nạp | Skills phải nạp | Trạng thái |
|---|---|---|---|
| **Luôn luôn** (mọi loại task) | `.agents/rules/00-core.md` | — | ACTIVE |
| Viết/sửa code, migration, CI, config | `.agents/rules/coding.md` | `.agents/skills/stack-<name>/SKILL.md` (+ skill theo lớp: frontend / backend / DB nếu repo có) | ACTIVE |
| Sửa bug, điều tra sự cố, "vì sao X chậm/sai" | `.agents/rules/coding.md` + `.agents/rules/debugging.md` | skill stack liên quan | ACTIVE |
| Thiết kế kiến trúc, lập kế hoạch, viết/sửa spec | `.agents/rules/planning.md` | skill stack liên quan (khi thiết kế phần kỹ thuật) | ACTIVE |
| Mục đích mới chưa có bộ quy tắc | copy `.agents/rules/_template.md` → đề xuất PO duyệt | — | — |

Một phiên làm nhiều loại việc → nạp nhiều bộ tương ứng. Không chắc task thuộc loại nào → hỏi. Kiến trúc thay đổi → thêm/bump skill trong `.agents/skills/` + cập nhật bảng này — KHÔNG sửa rules.

## 3. Bản đồ source-of-truth — đọc THEO VIỆC, không đọc trọn

Không tài liệu nào dưới đây phải đọc trọn ở đầu phiên. Đọc lướt còn hại hơn không đọc, vì kết luận sai mà tưởng đã đọc. Đọc đúng **phần được trích dẫn** — section `§`, step trong plan, ID quyết định — và chỉ khi task chạm tới. Công thức chung cho mọi tool: `grep -n '^## ' <file>` lấy số dòng section → đọc đúng khoảng đó (Claude Code `Read offset/limit`; Codex/Gemini `sed -n 'a,bp'`).

| Tài liệu | Vai trò | Đọc khi | Đọc phần nào |
|---|---|---|---|
| `agents-doc/spec.md` | Spec sản phẩm & kiến trúc — nguồn sự thật DUY NHẤT | thiết kế / lập kế hoạch / sửa spec; code một step có trích dẫn § | § non-goals (khi planning) + đúng § được task/plan/rule trích |
| `agents-doc/plans/` | Kế hoạch thực thi từng phase (checkbox trạng thái, gates) | code hoặc planning | đúng file phase → đúng step (I/O, test, acceptance) |
| `agents-doc/handoff/` | Nhật ký bàn giao giữa các phiên — **một file/phiên** | phiên có sửa repo | 1–3 file mới nhất cùng `area`; quy trình ở `handoff/README.md` |
| `agents-doc/decisions/` | Quyết định của PO — **một file/quyết định** (MADR 4.0.0); `README.md` là index sinh tự động | **mọi phiên** | mục **"Đang mở"** của `README.md`; file quyết định theo ID khi task/plan/handoff trích dẫn hoặc trùng `area`. Nghi index cũ → `grep -l '^status: proposed' agents-doc/decisions/[0-9]*.md` (đọc thẳng frontmatter, luôn đúng) |
| `.agents/skills/` | Kiến thức kỹ thuật theo stack | code / thiết kế kỹ thuật | đúng skill theo bảng §2; `references/` của skill chỉ khi cần |

## 4. Nghĩa vụ cập nhật tài liệu (mọi agent)

- Đổi schema / contract → file migration hoặc contract + cập nhật tài liệu thiết kế tương ứng (theo skill stack).
- Hoàn thành/bắt đầu bước trong kế hoạch → cập nhật checkbox trong `agents-doc/plans/*.md` **ngay lập tức** (không đợi cuối phiên).
- **Bàn giao giữa các agent:** BẮT ĐẦU phiên = `git fetch` + `git status -sb` (behind → báo PO `git pull --rebase` trước khi sửa docs dùng chung), đọc checklist + **1–3 file bàn giao mới nhất trong `agents-doc/handoff/`**, khai khu vực (`area`) của phiên, làm tiếp từ chỗ dừng, không làm lại step đã `[x]`. KẾT THÚC phiên (kể cả dừng giữa chừng) = tạo **một file bàn giao mới** theo `agents-doc/handoff/README.md` — **một phiên không phải một lượt chat; nhiều lượt liên tiếp cùng mục tiêu chỉ có một handoff**. Hai phiên song song không chồng khu vực. (Quy tắc đầy đủ: `.agents/rules/planning.md` §5.)
- Phát sinh quyết định cần PO chốt → tạo **một file mới** trong `agents-doc/decisions/` theo `_template.md` (`status: proposed`) rồi chạy `pnpm decisions:index` **ngay trong cùng lượt**; KHÔNG tự quyết. PO chốt → agent đổi `status`/`date` trong đúng file đó và sinh lại index cùng lượt. Ai sửa file quyết định thì người đó chạy lệnh sinh; quên → `pnpm lint:docs` đỏ (local + CI khi mở PR), không có lỗi im lặng.
- Thay đổi hành vi/kiến trúc đã chốt → cập nhật spec (không để spec lệch code).

## 5. Ranh giới an toàn tuyệt đối (mọi mục đích, mọi agent)

1. **Không tự ý commit/push**; không force-push; không sửa production DB/hạ tầng trực tiếp. Dev/PO kiểm tra và thực hiện.
2. **Không thêm hạ tầng/dịch vụ có recurring cost** khi chưa trả lời 4 câu: giải quyết đúng vấn đề gì · vì sao thành phần hiện có không giải được · chi phí/tháng và security impact · hoãn được không — và được PO duyệt tường minh.
3. **Secrets không bao giờ vào bundle/Git/prompt.** File từ nguồn ngoài (export, dump, ảnh chụp) phải được rà PII/secret trước khi vào repo.
4. **Agent không bao giờ đụng vào credentials**: không đọc/in/tạo/sửa file secret (mọi `.env*`), không tự thu thập key/mật khẩu từ bất kỳ nguồn nào (CLI status, dashboard, code test, CI config...) để tự cấp cho mình đường truy cập. Tool báo thiếu credentials → **dừng, báo PO tự tay làm** — đó là bước thuộc về con người.
5. **Mọi thay đổi agent tạo ra phải có người thật xác nhận.** Tool ghi (DB, API bên ngoài, file hệ thống) mặc định `dry_run=true`; ghi thật cần một hành động tường minh của **con người** (gõ trên TTY, form xác nhận của client, hoặc câu xác nhận mới trong chat). Agent không tự tạo câu xác nhận, không xác nhận thay người dùng, không gộp dry-run và commit vào cùng một lượt. Bản "sẽ ghi" phải được hiển thị **nguyên văn** trước khi hỏi xác nhận — không tóm tắt.
6. **Thao tác nguy hiểm** (destructive migration, xóa dữ liệu, history rewrite, production deployment) → phân tích Risk / Downtime / Rollback plan và chờ PO xác nhận, không tự chạy.
7. <Ranh giới đặc thù dự án — thêm tại đây nếu có, mỗi dòng một ranh giới; để trống nếu không>.

## 6. Ghi chú cho từng tool

- **Claude Code**: `CLAUDE.md` ở root tự nạp file này qua `@import` — không cần làm gì thêm; áp dụng cho mọi máy.
- **Codex (OpenAI)**: đọc trực tiếp `AGENTS.md` này theo chuẩn.
- **Gemini CLI / Antigravity**: `GEMINI.md` ở root trỏ về đây — phải đọc file này + bộ rules tương ứng trước khi làm.
- **GitHub Copilot** (VS Code, coding agent, CLI): đọc `AGENTS.md` native (GitHub Changelog 2025-08-28, kiểm chứng 2026-09-17); `.github/copilot-instructions.md` giữ thêm một dòng trỏ về đây cho bản/chế độ chưa đọc `AGENTS.md`.
- Tool khác: đọc file này trước tiên, coi như system instructions của repo.
- **MCP server** (nếu repo có): nguồn sự thật là `.mcp.json` root; file dẫn xuất cho VS Code Copilot / Gemini CLI / Codex nằm ở `.vscode/mcp.json` · `.gemini/settings.json` · `.codex/config.toml` — đổi lệnh server thì sửa **cả bốn** (`pnpm lint:docs` chạy `scripts/mcp-configs-check.mjs` bắt lệch).
