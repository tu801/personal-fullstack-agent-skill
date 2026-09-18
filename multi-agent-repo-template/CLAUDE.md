# CLAUDE.md — Project instructions (<PROJECT_NAME>)

Repo này dùng bộ quy tắc chung cho mọi AI agent. Đọc và tuân thủ nghiêm ngặt:

@AGENTS.md
@.agents/rules/00-core.md

Khi task là **viết/sửa code, migration, CI, config** → đọc thêm `.agents/rules/coding.md` + skill stack theo bảng `AGENTS.md` §2. Không nạp sẵn cho phiên không code.
Khi task là **sửa bug / điều tra sự cố** → đọc thêm `.agents/rules/debugging.md` (cùng `coding.md`).
Khi task là **thiết kế/lập kế hoạch/sửa spec** → đọc thêm `.agents/rules/planning.md`.

Lưu ý precedence: trong phạm vi repo này, quy tắc repo (AGENTS.md + .agents/rules/) **thắng** global instructions (`~/.claude/CLAUDE.md`) khi mâu thuẫn. Quy tắc này áp dụng trên MỌI máy (macOS, Windows, Linux).
