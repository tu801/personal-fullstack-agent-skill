# agents-doc/handoff — Nhật ký bàn giao giữa các phiên: **một file cho mỗi phiên**

> Trạng thái: **ACTIVE** · Quy tắc đầy đủ: `.agents/rules/planning.md` §5.3–§5.5.

## Vì sao một file một phiên

Nhiều agent (Claude Code, Codex, Gemini, Copilot) trên nhiều máy cùng commit vào một nhánh. Bảng bàn giao chung với quy ước "dòng mới nhất trên cùng" khiến **mọi phiên đều chèn vào cùng một dòng** của cùng một file → Git conflict chắc chắn, dù code nằm ở hai khu vực không liên quan (sự cố thật ở repo nguồn 2026-09-08: hai agent cùng chèn dòng 109 của một file plan và cùng sửa dòng header). **File mới không bao giờ conflict** — đó là toàn bộ ý tưởng.

## Tên file

```text
YYYY-MM-DD-HHMM-<agent>-<slug>.md
2026-09-08-1615-claude-code-handoff-convention.md
```

- `HHMM` = giờ địa phương lúc kết thúc phiên (để hai phiên cùng ngày không trùng tên và sắp đúng thứ tự).
- `<agent>` ∈ `claude-code` · `codex` · `gemini` · `copilot` · `<tool-khác>`.
- `<slug>` kebab-case ngắn, nói việc vừa làm.

## Một "phiên" được tính thế nào?

**Phiên là một khoảng làm việc liên tục tạo thành một batch có thể bàn giao hoặc commit**, không phải một lượt chat hay một yêu cầu nhỏ của PO. Các việc sau vẫn thuộc **cùng một phiên** khi cùng phục vụ một mục tiêu: PO trả lời câu hỏi làm rõ rồi agent tiếp tục · sửa → chạy test → sửa tiếp · cập nhật code, docs, trạng thái và kiểm tra của cùng một step · nhiều tin nhắn liên tiếp trước khi PO review/commit.

Chỉ bắt đầu handoff mới khi có ít nhất một ranh giới thật: agent kết thúc/tạm dừng và bàn giao; một batch đã sẵn sàng để PO commit; chuyển sang mục tiêu/khu vực độc lập; hoặc công việc trước đã commit và sau đó được mở lại. **Không tạo handoff sau mỗi câu trả lời.** Lỡ tạo sớm rồi tiếp tục làm trước khi commit → cập nhật/gộp file **của chính phiên chưa commit**, giữ đúng một file cuối cùng. Không sửa handoff đã commit hoặc của phiên/agent khác.

## Nội dung — copy `_template.md`

Frontmatter: `date` · `time` · `agent` · `phase` · `step` · `area` (KHU VỰC đã đụng — để phiên song song không chồng nhau) · `status` (`done` · `paused` · `blocked`). Body: **Kết quả / việc đang dở** (đủ cụ thể để agent khác tiếp tục mà không đoán; lệnh verify + kết quả nguyên văn) · **Ngoài phạm vi, ghi nhận** (vấn đề thấy nhưng không sửa) · **Việc kế tiếp** (cho PO / cho agent sau).

## Đầu phiên (bắt buộc — `planning.md` §5.4)

1. `git fetch && git status -sb` (read-only). Local **behind** origin → **báo PO chạy `git pull --rebase`** trước khi sửa bất kỳ docs dùng chung nào. Agent không tự chạy lệnh ghi git.
2. Đọc mục "Đang mở" của `agents-doc/decisions/README.md` + 1–3 file bàn giao mới nhất của phase / khu vực liên quan + checklist trong file plan:
   - macOS/Linux: `ls -r agents-doc/handoff | head -10`
   - Windows PowerShell: `Get-ChildItem agents-doc/handoff | Sort-Object Name -Descending | Select-Object -First 10`
3. Khai `area` của phiên ngay từ đầu. Hai phiên chạy song song **không chồng `area`**; cần đụng khu vực của phiên khác → hỏi PO.

## Cuối phiên (kể cả dừng giữa chừng)

1. Tạo **đúng một file mới** theo `_template.md` cho toàn bộ phiên.
2. Cập nhật checkbox step trong plan (`[~]` / `[x]`) — chỉ dòng step của mình.
3. Nhắc PO chuỗi **`git pull --rebase` → `git commit` → `git push` ngay** — commit nhỏ, không để dồn nhiều phiên.

## Điều KHÔNG làm

- Không ghi bàn giao vào bất kỳ bảng/file chung nào khác.
- Không sửa dòng header `Trạng thái/Version` của plan / skill khi **chỉ thêm nội dung** — ngày sửa cuối lấy từ `git log -1 --format=%cs -- <file>`.
- Không chép lại danh sách quyết định "còn mở" vào handoff — index đã là danh sách đó.
