# debugging — Quy tắc khi sửa bug / điều tra sự cố / "vì sao X sai hoặc chậm"

> Trạng thái: ACTIVE · Áp dụng cùng `00-core.md` + `coding.md`. Nạp thêm skill stack liên quan (checklist chẩn đoán đặc thù: query plan, RLS, cache, CI...).
> File này gom **quy trình chẩn đoán chung** — nội dung vốn nằm rải trong `coding.md` §1.1/§1.4 và `00-core.md` §3.6 — để mọi agent debug theo cùng một khung, cùng một đầu ra.

## 1. Phạm vi áp dụng

Bug report của PO · test đỏ · CI đỏ · hành vi khác spec · hiệu năng kém · sự cố dùng thật · "hồi trước chạy được giờ không".

## 2. Nguyên tắc

1. **Root cause trước, fix sau.** Không sửa theo symptom hay error message. Phải trả lời được: root cause là gì · vì sao xảy ra · khi nào bắt đầu xuất hiện · vì sao quy trình cũ từng chạy được · thành phần nào bị ảnh hưởng.
2. **Tái hiện được rồi mới sửa.** Không tái hiện được → nói rõ, thu thêm bằng chứng (log, input thật đã ẩn PII, phiên bản), không đoán mò rồi "thử sửa xem".
3. **Một giả thuyết một lần.** Nêu giả thuyết → chọn cách kiểm nhanh nhất bác/khẳng định nó → ghi kết quả → mới sang giả thuyết kế. Không đổi nhiều thứ cùng lúc.
4. **Đọc code thật, không đọc trí nhớ.** Kết luận về hành vi của code phải trỏ được `file:line`. Kết luận về hành vi của tool/service ngoài → `00-core.md` §3.6 (lỗi nghi do version/deprecation = PHẢI verify, bất kể hạn tin cậy).
5. **Đừng tin CI xanh / test xanh một cách mù quáng.** Test xanh local nhưng CI đỏ (hoặc ngược lại) là dữ liệu — tìm khác biệt môi trường (version, timezone, dữ liệu còn sót, thứ tự chạy, artefact chưa build), không retry cho tới khi xanh.
6. **Không mở rộng phạm vi.** Phát hiện bug khác/nợ kỹ thuật trong lúc điều tra → ghi vào handoff mục "Ngoài phạm vi", không sửa kèm (`coding.md` §1.3).

## 3. Quy trình bắt buộc

```text
0. Thu bằng chứng   — thông điệp lỗi nguyên văn, bước tái hiện, môi trường (version, OS, branch,
                      commit), thời điểm bắt đầu; ẩn PII/secret trước khi dán vào chat/handoff.
1. Current Behavior — mô tả đúng cái đang xảy ra (có bằng chứng), không diễn giải.
2. Expected Behavior— trích spec § / plan step / test đang định nghĩa hành vi đúng. Không có nguồn
                      → đây là câu hỏi nghiệp vụ → HỎI PO, không tự định nghĩa "đúng".
3. Reproduction     — viết test/lệnh tái hiện ĐỎ trước khi sửa (Reproduction Test).
4. Root Cause       — giả thuyết → kiểm → kết luận, trỏ file:line; nêu vì sao trước đây chạy được
                      (commit/version/dữ liệu nào đổi). Nghi do dependency/service ngoài → verify
                      release notes/docs (1–3 truy vấn), ghi nguồn + ngày.
5. Proposed Solution— 2–3 phương án khi có (vá tại chỗ · sửa gốc · chặn ở biên) kèm trade-off,
                      đề xuất phương án đơn giản nhất KHÔNG che lỗi. Chạm nhóm nguy hiểm
                      (coding.md §1.5) → dừng chờ PO.
6. Fix + Verify     — Reproduction Test chuyển XANH · Regression suite liên quan xanh · nêu
                      lệnh đã chạy + kết quả nguyên văn.
7. Ghi lại          — handoff (bằng chứng, root cause, lệnh verify) · quyết định nếu có
                      (agents-doc/decisions/) · cache fact ngoài đã verify vào skill.
```

Bước nào bỏ qua → nói rõ trong báo cáo. Không có bước 3 thì không có bước 6.

## 4. Anti-patterns (thấy là dừng)

- Sửa để "test xanh" mà không giải thích được vì sao trước đó đỏ.
- Thêm `try/catch` nuốt lỗi, `retry`, `sleep`, `skip test`, nới ngưỡng, đổi assertion cho vừa output.
- Kết luận "do flaky" khi chưa chạy lại có kiểm soát và chưa chỉ ra nguồn bất định.
- Đổ lỗi cho tool/framework mà không có release note/issue upstream làm bằng chứng.
- Chạm dữ liệu thật/production để "xem thử" — chỉ dùng fixture hoặc bản sao đã ẩn PII (`00-core.md` §5.1).

## 5. Checklist trước khi kết thúc task

- [ ] Bằng chứng tái hiện + lệnh verify nằm trong báo cáo/handoff, nguyên văn.
- [ ] Root cause trỏ `file:line` (hoặc nguồn ngoài + ngày kiểm chứng).
- [ ] Đủ 3 loại test: Reproduction · Verification · Regression (`coding.md` §1.4) — thiếu loại nào nói rõ.
- [ ] Không sửa ngoài phạm vi; việc phát hiện thêm đã ghi vào handoff.
- [ ] Nếu bug lộ ra một lỗ hổng quy trình (rule/skill thiếu, checklist sót) → đề xuất sửa rule/skill trong một file quyết định, không chỉ vá code.

## 6. Đầu ra

Báo cáo theo `00-core.md` §6, phần **Summary** viết đúng thứ tự: Current → Expected → Root Cause → Fix → Verify. Bug sinh ra từ dữ liệu/quy trình dùng thật → cân nhắc thêm một file quyết định để PO chốt thay đổi quy trình.

## 7. Ranh giới

- Không sửa production DB/hạ tầng để "chữa cháy" khi chưa có PO xác nhận + rollback plan.
- Không tắt/giảm cấp security control (auth, RLS/policy, validation) để bug "biến mất".
- Không xóa dữ liệu, kể cả dữ liệu test trên môi trường dùng chung, mà không hỏi.
