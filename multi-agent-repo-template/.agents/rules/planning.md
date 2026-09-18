# planning — Quy tắc khi thiết kế kiến trúc / lập kế hoạch / sửa spec

> Trạng thái: ACTIVE · Áp dụng cùng `00-core.md`.

## 1. Phạm vi áp dụng

Thiết kế kiến trúc/schema, lập hoặc sửa kế hoạch thực thi, viết/sửa spec, phân tích yêu cầu, đánh giá công nghệ.

## 2. Quy trình bắt buộc

1. **Đọc spec theo section, không đọc trọn** (`agents-doc/spec.md`): § non-goals + đúng section liên quan tới việc đang thiết kế (`grep -n '^## '` để định vị — `AGENTS.md` §3). Mọi đề xuất phải đối chiếu và trích dẫn section; không đề xuất thứ spec đã cấm.
2. Yêu cầu chưa rõ/mâu thuẫn → **tạo một file quyết định mới trong `agents-doc/decisions/`** theo `_template.md` (đề xuất mặc định + lý do + chỗ trả lời; `status: proposed`) rồi `pnpm decisions:index`, trình PO chốt. Không tự quyết thay PO.
3. Nhiều phương án → bảng so sánh 2–3 phương án kèm trade-off (công sức, chi phí, độ phức tạp bảo trì, rủi ro), đề xuất phương án đơn giản nhất đáp ứng yêu cầu.
4. Công nghệ/dịch vụ mới → trả lời đủ: giải quyết đúng vấn đề gì; vì sao thành phần hiện có không giải được; recurring cost; security impact; hoãn được không (`AGENTS.md` §5.2). Kiểm tra pricing/limits hiện hành, không dùng trí nhớ (`00-core.md` §3.6).
5. Đánh giá kiến trúc theo 4 trục: monthly cost · operational complexity · scalability đủ dùng (không thiết kế cho tải tưởng tượng) · maintenance effort. Boring technology wins.

## 3. Nghĩa vụ đầu ra

- Quyết định kiến trúc được chốt → cập nhật **spec** (đúng section) + ghi kết quả vào file quyết định tương ứng trong `agents-doc/decisions/`.
- Quyết định liên quan schema/contract → ghi vào tài liệu thiết kế kỹ thuật theo skill stack (kèm lý do + phương án bị loại).
- Kế hoạch mới/sửa kế hoạch → theo `agents-doc/plans/README.md` + `_template-phase.md`: bước có checkbox, function I/O kiểu chữ ký (TypeScript-style hoặc tương đương), data flow (mermaid khi đáng vẽ), test theo tầng, init data, gate checklist.
- Kế hoạch phải bám user journey chuẩn đã chốt trong spec; không bắt đầu code một phase khi gate phase trước chưa pass.

## 4. Nguyên tắc thiết kế phải giữ

- <Liệt kê 5–8 bất biến kiến trúc của dự án, mỗi dòng một ý, trích § spec. Ví dụ mẫu:> deterministic first, AI second · authorization ở đúng một tầng · không overwrite lịch sử (version bất biến) · free-first · nguồn sự thật duy nhất cho mỗi loại dữ liệu.
- Requirements before solutions: trước khi đề xuất, trả lời spec section nào chi phối · user journey nào · data shape & volume THẬT · consistency cần gì · failure story cho từng dependency ngoài (timeout, retry, fallback, user thấy gì).
- Mọi mutation retry được phải idempotent; mọi thiết kế nêu rõ trade-off — không có thiết kế trade-off-free.

## 5. Version, trạng thái & bàn giao giữa các agent (BẮT BUỘC)

> Bối cảnh: dự án dùng nhiều agent thay phiên nhau (Claude Code / Codex / Gemini / Copilot, nhiều máy). Agent sau phải nắm được chính xác agent trước đã kết thúc ở đâu và làm tiếp — **không làm lại, không overlap**.

### 5.1. Đánh dấu version & trạng thái trên tài liệu

- Mọi tài liệu thiết kế/kế hoạch **và mọi file tài liệu tạo mới** phải có header ghi rõ: **Trạng thái** (`DRAFT / IN REVIEW / ACTIVE / IN PROGRESS / DONE / ON HOLD`) + **ngày đổi trạng thái** (+ version nếu tài liệu có vòng đời dài). Ngày sửa nội dung lần cuối **không ghi tay** — lấy từ `git log -1 --format=%cs -- <file>`. *(Lý do: dòng header là điểm nóng conflict khi nhiều agent cùng sửa một file.)*
- Đổi **Trạng thái / version** → cập nhật header trong cùng lần sửa. **Chỉ thêm/sửa nội dung → KHÔNG đụng dòng header.**

### 5.2. Checklist từng step trong `agents-doc/plans/` (nguồn sự thật về tiến độ)

- Mỗi step có checkbox: `[ ]` chưa làm · `[~]` đang làm · `[x]` xong **đã verify**.
- Cập nhật checkbox **NGAY tại thời điểm** bắt đầu step (`[~]`) và hoàn thành step (`[x]`) — không đợi cuối phiên, không cập nhật gộp.
- `[x]` chỉ được đánh khi phần test/acceptance của step đó pass (không tô hồng — `00-core.md` §3.5).

### 5.3. Nhật ký bàn giao (Handoff log) — một file cho mỗi phiên

- Kết thúc phiên làm việc (hoặc dừng giữa chừng) → tạo **một file mới** `agents-doc/handoff/YYYY-MM-DD-HHMM-<agent>-<slug>.md` theo khung trong `agents-doc/handoff/README.md` (frontmatter: date · time · agent · phase · step · **area** · status; body: kết quả/việc đang dở · việc kế tiếp). Không sửa file bàn giao của phiên khác.
- **Một phiên không phải một lượt chat.** Nhiều câu hỏi, trả lời làm rõ, lần chạy test và subtask liên tiếp phục vụ cùng một mục tiêu/commit-ready batch vẫn là **một phiên** → chỉ tạo **một** handoff khi thực sự kết thúc hoặc tạm dừng. Không tạo handoff trung gian sau mỗi tin nhắn. Nếu đã tạo sớm nhưng công việc tiếp tục trước khi commit, cập nhật/gộp file **của chính phiên đang chưa commit**; file đã commit hoặc của agent/phiên khác thì không sửa.
- KHÔNG ghi bàn giao vào bảng chung trong file plan. Lý do: quy ước "dòng mới nhất trên cùng" làm mọi phiên chèn vào cùng một dòng → conflict chắc chắn khi nhiều agent/máy cùng commit một nhánh; **file mới thì không bao giờ conflict**.
- Việc dở dang phải ghi đủ cụ thể để agent khác tiếp tục được mà không cần đoán (file nào đang sửa dở, test nào chưa chạy, blocker gì).

### 5.4. Nghĩa vụ của agent KHI BẮT ĐẦU phiên làm việc

1. `git fetch` + `git status -sb` (read-only). Local **behind** origin → **báo PO chạy `git pull --rebase`** trước khi sửa bất kỳ docs dùng chung nào (plans, decisions, spec, skills). Agent không tự chạy lệnh ghi git (`AGENTS.md` §5.1).
2. Đọc mục "Đang mở" của `agents-doc/decisions/README.md` + checklist của phase + **1–3 file bàn giao mới nhất** trong `agents-doc/handoff/` (lọc theo phase / khu vực) **trước khi làm bất kỳ việc gì**; khai `area` của phiên ngay từ đầu.
3. Tiếp tục từ step `[~]`/step `[ ]` kế tiếp; **tuyệt đối không làm lại step đã `[x]`**.
4. Trạng thái trong file có vẻ sai lệch so với code thực tế → dừng lại, báo PO — không tự làm đè.

### 5.5. Nhiều agent làm song song trên một nhánh

- **Một nhánh tích hợp** (`feat/<phase>`), mỗi phiên **một khu vực** (`area` trong file bàn giao). Hai phiên song song không chồng `area`; cần đụng khu vực của phiên khác → hỏi PO.
- **Docs dùng chung — quy tắc ghi để merge sạch:** plan → chỉ sửa dòng step của mình; `agents-doc/decisions/` → quyết định mới = **một file mới**, không sửa file quyết định của phiên khác trừ khi ghi câu trả lời của PO vào đúng file đó, rồi `pnpm decisions:index`; spec → chỉ section liên quan; skill → bump version header là điểm dễ conflict nhỏ, chấp nhận và giải bằng giữ cả hai. Không sửa header khi chỉ thêm nội dung (§5.1).
- **Cuối phiên PO commit ngay:** `git pull --rebase` → `git commit` → `git push`; commit nhỏ, không để dồn nhiều phiên rồi mới commit.
- **Khi nào dùng worktree + nhánh riêng cho từng agent:** tính năng chạy nhiều ngày trên hai máy, hoặc hai phiên buộc phải đụng cùng khu vực. Mặc định không dùng — thêm bước merge cho PO một người.

## 6. Ranh giới

- Không tự quyết thay PO; không đổi quyết định đã `accepted` bằng cách sửa file cũ — tạo quyết định mới + đánh `superseded by <ID>` cho file cũ.
- Không viết kế hoạch cho phase kế khi gate phase hiện tại chưa pass, trừ khi PO yêu cầu tường minh.
- Không đề xuất thứ spec § non-goals đã loại mà không kèm một file quyết định xin mở lại.
