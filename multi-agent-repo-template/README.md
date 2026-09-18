# multi-agent-repo-template

> Trạng thái: **ACTIVE** · Version 1.0 · Ngày đổi trạng thái: 2026-09-17
> Khung làm việc để **nhiều AI agent** (Claude Code · Codex · Gemini CLI/Antigravity · GitHub Copilot) trên **nhiều máy** cùng code một repo mà không dẫm chân nhau: cùng một bộ nguyên tắc suy luận, cùng cách lập kế hoạch, theo dõi tiến độ, ghi quyết định, bàn giao và debug.
>
> Chưng cất từ repo `personal-finance-os` sau hơn một tháng vận hành thật với 4 agent (2026-08 → 2026-09), gồm cả các sự cố đã sinh ra từng quy tắc (xem §6). Không chứa kiến thức stack hay nghiệp vụ nào — phần đó dự án tự điền vào chỗ đã chừa.

## 1. Bốn tầng — ai đọc gì

```text
Router      AGENTS.md                 ← MỌI agent đọc đầu tiên; CLAUDE.md / GEMINI.md /
                                         .github/copilot-instructions.md chỉ trỏ về đây
Rules       .agents/rules/*.md        ← CÁCH suy nghĩ & hành xử — ổn định, không đổi theo stack
Skills      .agents/skills/*/SKILL.md ← KIẾN THỨC stack/domain — đổi theo kiến trúc (Agent Skills standard)
Docs        agents-doc/               ← spec (nguồn sự thật) · plans (tiến độ) · decisions (PO chốt) · handoff (bàn giao)
```

Precedence khi mâu thuẫn: **chỉ thị PO trong phiên > rules repo > skills (repo tự viết > vendored) > global instructions của tool**.

## 2. Cây thư mục

```text
.
├── AGENTS.md                      # router canonical: bối cảnh §0 · precedence · bảng nạp theo mục đích · map source-of-truth · nghĩa vụ docs · ranh giới an toàn · ghi chú từng tool
├── CLAUDE.md · GEMINI.md          # trỏ về AGENTS.md (Claude Code @import; Gemini đọc trực tiếp)
├── .github/copilot-instructions.md
├── .agents/
│   ├── rules/
│   │   ├── 00-core.md             # LUÔN nạp: ngôn ngữ · 6 nguyên tắc suy luận (gồm verify-có-chọn-lọc) · git · an toàn · báo cáo task
│   │   ├── coding.md              # 5 nguyên tắc kỹ thuật · change impact · upgrade · security review · DB/infra · CI
│   │   ├── debugging.md           # Current → Expected → Reproduce → Root cause → Fix → Verify; anti-patterns
│   │   ├── planning.md            # quy trình thiết kế · đầu ra · §5 version/checkbox/handoff/song song
│   │   └── _template.md           # khung cho bộ quy tắc mục đích mới
│   └── skills/
│       ├── README.md              # chuẩn Agent Skills · router là cơ chế nạp bảo đảm · wiring .claude/skills symlink
│       ├── _SKILL-template.md
│       ├── VENDORED.md            # nguồn/pin/precedence cho skill copy từ upstream
│       └── stack-example/SKILL.md # ĐỔI TÊN thành stack-<name>, điền đúng các mục rules trỏ sang
├── agents-doc/
│   ├── README.md · spec.md        # spec skeleton — nguồn sự thật duy nhất, đọc theo §
│   ├── plans/  README.md · _template-phase.md
│   ├── decisions/ README.md (SINH TỰ ĐỘNG) · _template.md (MADR 4.0.0) · 0001-t1-…md (ví dụ + quyết định áp dụng khung)
│   └── handoff/  README.md · _template.md
├── scripts/
│   ├── decisions-index.mjs        # sinh/--check index quyết định (zero-dependency Node)
│   ├── mcp-configs-check.mjs      # 4 file cấu hình MCP client phải cùng lệnh khởi động server
│   └── lib/frontMatter.mjs
├── .mcp.json · .vscode/mcp.json · .gemini/settings.json · .codex/config.toml   # 1 server, 4 client (placeholder `example`)
├── .github/workflows/docs-ci.yml  # PR → check index + MCP configs + gitleaks
├── .gitleaks.toml · .gitignore · .gitattributes (LF) · package.json (scripts, không dependency)
```

## 3. Khởi tạo dự án mới từ template — checklist

1. Copy toàn bộ folder vào repo mới (hoặc merge vào repo có sẵn). `pnpm install` không cần — script chạy bằng Node ≥ 20.
2. Thay `<PROJECT_NAME>` trong `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `.github/copilot-instructions.md`, `agents-doc/spec.md`; điền **`AGENTS.md` §0** (sản phẩm · stack · ràng buộc cứng) và **§5.7** (ranh giới đặc thù, nếu có).
3. Đổi tên `.agents/skills/stack-example/` → `stack-<name>` (cả folder lẫn `name:`), điền 8 mục — đó là đúng những chỗ `coding.md`/`debugging.md` ghi "→ skill stack". Cập nhật bảng `AGENTS.md` §2 và bảng skill trong `.agents/skills/README.md`.
4. Điền `agents-doc/spec.md` tối thiểu §3 nguyên tắc, §4 non-goals, §9 Definition of Done; chép 5–8 bất biến vào `planning.md` §4; sao ID user journey vào `agents-doc/plans/README.md`.
5. Ngôn ngữ: template mặc định hội thoại/docs tiếng Việt, code English. Đổi ngôn ngữ PO → sửa `00-core.md` §2 (một chỗ).
6. Quyết định mẫu `0001-t1-…`: giữ (đổi `date`) hoặc xoá; rồi `pnpm decisions:index`. Từ đây mọi quyết định = một file mới.
7. MCP: có server → sửa `.mcp.json` rồi **cả ba** file dẫn xuất; không có → xoá 4 file cấu hình (check tự bỏ qua khi không có `.mcp.json`).
8. Claude Code auto-discovery (tuỳ chọn, chỉ skill nặng): `mkdir -p .claude/skills && ln -sfn ../../.agents/skills/<skill> .claude/skills/<skill>`.
9. Ghép `.github/workflows/docs-ci.yml` vào pipeline thật theo thứ tự `coding.md` §7; `pnpm lint:docs` phải xanh trước commit đầu.
10. Kết thúc phiên khởi tạo bằng **một handoff** theo `agents-doc/handoff/_template.md` — agent kế tiếp có chỗ bắt đầu.

## 4. Vòng đời một phiên làm việc (mọi agent, mọi tool)

```text
ĐẦU PHIÊN   git fetch + git status -sb (read-only; behind → báo PO pull --rebase trước)
            → đọc AGENTS.md → 00-core → rules theo mục đích → skill theo bảng §2
            → decisions/README.md mục "Đang mở" → 1–3 handoff mới nhất cùng area → step [~]/[ ] kế tiếp
            → khai `area` của phiên
GIỮA PHIÊN  Current → Expected → Root cause → Proposed (2–3 phương án) → HỎI khi nghiệp vụ chưa rõ
            → checkbox [~] ngay khi bắt đầu step, [x] chỉ khi test/acceptance pass
            → quyết định cần PO → file mới trong decisions/ + `pnpm decisions:index` cùng lượt
            → fact ngoài: verify 1–3 truy vấn có mục tiêu, cache vào skill kèm nguồn + ngày
            → tool ghi: dry_run → hiển thị NGUYÊN VĂN bản sẽ ghi → người thật xác nhận → ghi
CUỐI PHIÊN  báo cáo theo 00-core §6 → MỘT file handoff (một phiên ≠ một lượt chat)
            → nhắc PO: git pull --rebase → commit (Conventional Commits) → push ngay
```

## 5. Cơ chế chống lỗi có sẵn

| Cơ chế | Bắt lỗi gì | Ở đâu |
|---|---|---|
| Router deterministic | agent không đọc file kiến thức vì không ai trỏ tới | `AGENTS.md` §2, `.agents/skills/README.md` mục Quy ước 1 |
| Đọc theo § / step / ID | nạp trọn tài liệu lớn → kết luận sai mà tưởng đã đọc | `AGENTS.md` §3 |
| Một file / quyết định + index sinh tự động + `--check` | queue chờ chốt lẫn với audit trail; index lệch im lặng | `scripts/decisions-index.mjs`, CI |
| Một file / phiên handoff | conflict git khi nhiều agent chèn cùng một dòng | `agents-doc/handoff/README.md` |
| Không sửa header khi chỉ thêm nội dung; ngày lấy từ `git log` | conflict ở dòng header | `planning.md` §5.1 |
| `area` trong handoff | hai phiên song song chồng khu vực | `planning.md` §5.5 |
| Verify có chọn lọc + cache vào skill | kiến thức stale hoặc search tràn lan làm loãng context | `00-core.md` §3.6 |
| `[ASSUMED]` bắt buộc | fact chưa kiểm chứng dùng để bác phương án | `00-core.md` §3.6 |
| dry-run + bản sẽ ghi nguyên văn + người thật gõ xác nhận | agent "xác nhận hộ" hoặc tóm tắt làm mất thông tin | `AGENTS.md` §5.5 |
| Agent không đụng credentials | agent tự lấy key để tự cấp quyền | `AGENTS.md` §5.4 |
| 4 file MCP client + check | client này chạy server khác client kia | `scripts/mcp-configs-check.mjs` |
| Fixture tách dữ liệu thật | ví dụ/test lộ tên người/tài sản thật | `00-core.md` §5.1 |

## 6. Bài học đằng sau từng quy tắc (từ repo nguồn)

- **2026-08-12** — agent tự thiết kế cấu trúc skills theo trí nhớ trong khi chuẩn Agent Skills đã tồn tại → sinh nguyên tắc *verify latest, then reason* (có chọn lọc).
- **2026-08-18** — file nguyên tắc domain "mồ côi", không rule/router nào trỏ tới → agent đúng quy trình không bao giờ đọc → *router là cơ chế nạp bảo đảm*.
- **2026-08-21** — tool báo thiếu `.env`, agent tự lấy key local và tạo file → ranh giới *agent không đụng credentials*.
- **2026-09-08** — hai agent cùng chèn dòng 109 của một file plan và cùng sửa header → *một file / phiên handoff*, không sửa header khi chỉ thêm nội dung.
- **2026-09-09** — agent gọi tool ghi mà không có người xác nhận → *mọi thay đổi agent tạo ra phải có người thật xác nhận*.
- **2026-09-14** — file pending-decisions 232 KB (1.149 dòng), trạng thái ghi ở 4 chỗ không kiểm chéo → agent bỏ sót quyết định đã chốt → *một file / quyết định + index sinh tự động + lint*.
- **2026-09-17** — agent dry-run xong chỉ tóm tắt "thành công", PO phải đòi bảng → *bản sẽ ghi hiển thị nguyên văn, mã duyệt nằm trong bảng*.

## 7. Mở rộng

- **Mục đích mới** (vd phân tích dữ liệu, viết nội dung): copy `.agents/rules/_template.md`, thêm dòng vào `AGENTS.md` §2, một file quyết định để PO duyệt.
- **Skill mới**: copy `_SKILL-template.md` vào folder cùng tên; `name:` = tên folder; khai vào router.
- **Skill vendor** (copy từ upstream): theo `.agents/skills/VENDORED.md` — pin SHA, không sửa tại chỗ, bảng precedence.
- **Thêm client MCP**: thêm đường dẫn vào `DERIVED` trong `scripts/mcp-configs-check.mjs` + cập nhật `AGENTS.md` §6.
- **Knowledge/domain docs** (WHY nghiệp vụ, không phải code docs): tạo folder riêng (vd `knowledge/`), khai vào `AGENTS.md` §3 với cột "đọc khi / phần nào"; tách dữ liệu thật và fixture theo `00-core.md` §5.1.

## 8. Những gì template cố ý KHÔNG có

- Kiến thức stack, convention code cụ thể, mã lỗi, checklist DB — sống trong skill của từng dự án.
- Rule domain (vd phân tích tài chính) — mỗi dự án tự viết theo `_template.md`.
- Tool ghi/CLI/MCP server thật — chỉ có cấu hình placeholder và check lệch.
- Pipeline build/test thật — chỉ có job docs + secret scan để ghép vào.

## 9. Kiểm chứng ngoài (Information Currency)

| Fact | Nguồn | Ngày kiểm chứng | Hạn tin cậy |
|---|---|---|---|
| Copilot coding agent đọc `AGENTS.md` ở root repo, ngoài `.github/copilot-instructions.md` và `.github/instructions/*.instructions.md`; cũng nhận `CLAUDE.md`/`GEMINI.md` | GitHub Changelog 2025-08-28 "Copilot coding agent now supports AGENTS.md custom instructions"; GitHub Docs "Adding repository custom instructions for GitHub Copilot" | 2026-09-17 | 6 tháng |
| Agent Skills open standard: `SKILL.md` + frontmatter `name` (= tên folder) / `description`, cấu trúc flat | agentskills.io — theo skill README repo nguồn (verified 2026-08-15) | 2026-08-15 | 6 tháng → re-verify trước 2027-02 |
| MADR 4.0.0 — cấu trúc mục của một quyết định | adr.github.io/madr — theo `_template.md` repo nguồn (verified 2026-09-14) | 2026-09-14 | 6 tháng |
| Định dạng cấu hình MCP của 4 client (`.mcp.json` · `.vscode/mcp.json` `servers` · `.gemini/settings.json` `mcpServers` · `.codex/config.toml` `[mcp_servers.x]`) | chạy thật trong repo nguồn (quyết định AA, 2026-09-10) | 2026-09-10 | re-verify khi client đổi major |
| `actions/checkout@v7`, `actions/setup-node@v7`, gitleaks CLI 8.30.1 | chạy xanh trong CI repo nguồn | 2026-09 | re-verify khi bump |
