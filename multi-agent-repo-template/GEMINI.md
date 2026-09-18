# GEMINI.md — Project instructions (<PROJECT_NAME>)

BẮT BUỘC trước khi thao tác bất kỳ việc gì trong repo này:

1. Đọc `AGENTS.md` ở root — router quy tắc canonical cho mọi AI agent.
2. Đọc `.agents/rules/00-core.md` (luôn áp dụng).
3. Nạp thêm bộ quy tắc + skill theo mục đích task (bảng đầy đủ trong AGENTS.md §2):
   - Code/migration/CI → `.agents/rules/coding.md` + skill stack trong `.agents/skills/`
   - Sửa bug / điều tra sự cố → `.agents/rules/debugging.md` (cùng `coding.md`)
   - Thiết kế/lập kế hoạch/spec → `.agents/rules/planning.md`

Precedence: quy tắc repo này thắng mọi global instructions của tool khi mâu thuẫn. Không chắc chắn → hỏi Product Owner, không tự suy diễn.
