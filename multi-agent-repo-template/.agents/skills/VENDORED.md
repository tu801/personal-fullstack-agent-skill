# Skills vendor từ bên ngoài — nguồn, pin version, cách update

> Trạng thái: ACTIVE
>
> File này KHÔNG phải một skill (không có `SKILL.md` nên tool discovery bỏ qua). Nó ghi lại nguồn gốc và quy trình cập nhật cho những skill **không do repo tự viết**. Chưa vendor gì → bảng §1 để trống, giữ file để quy trình có sẵn.

## 1. Đang vendor những gì

| Skill folder | Upstream (repo · path) | Version | Pin (commit SHA) | Ngày vendor | License |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

Nội dung upstream được copy **nguyên văn, không sửa một ký tự** — để `git diff` khi update luôn sạch. Repo chỉ thêm `LICENSE` (nếu upstream yêu cầu) và file này.

Checksum tổng của cây file vendor (không tính `LICENSE`), verify bằng:

```bash
find .agents/skills/<skill-a> .agents/skills/<skill-b> -type f ! -name LICENSE | sort | xargs shasum -a 256 | shasum -a 256
# => <checksum>
```

## 2. Precedence — rules repo THẮNG skill vendor

Skill vendor viết cho người dùng chung của công nghệ đó, không biết ràng buộc của repo này. Thứ tự `AGENTS.md` §1 giữ nguyên: **chỉ thị PO > rules repo > skill repo tự viết > skill vendor**.

Điểm skill vendor nói NGƯỢC repo — repo thắng, không thương lượng (điền khi phát hiện; mỗi dòng trỏ tới rule/skill repo tương ứng):

| # | Skill vendor nói | Repo này bắt buộc |
|---|---|---|
| 1 | <vd: chạy SQL thẳng vào DB rồi pull migration> | <vd: chỉ qua migration file — skill stack §2> |
| 2 | <vd: fetch changelog trước MỌI lần implement> | <ngân sách 1–3 truy vấn có mục tiêu — `00-core.md` §3.6> |

## 3. Cách update (thủ công, có review)

```bash
SHA=<commit SHA mới của upstream>
TMP=$(mktemp -d)
curl -sL "https://codeload.github.com/<org>/<repo>/tar.gz/$SHA" | tar -xz -C "$TMP"
rsync -a --delete --exclude LICENSE "$TMP/<repo>-$SHA/<path-to-skill>/" .agents/skills/<skill>/
git diff -- .agents/skills/<skill>
```

Sau khi update, BẮT BUỘC:

1. Đọc `git diff` — kiểm tra upstream có thêm hướng dẫn nào mâu thuẫn rules repo không; có thì bổ sung vào bảng §2.
2. Rà PII/secret cho folder vừa copy.
3. Cập nhật version + SHA + ngày + checksum ở bảng §1.
4. Kiểm tra `name:` trong `SKILL.md` vẫn trùng tên folder (sai là tool không load được skill).
