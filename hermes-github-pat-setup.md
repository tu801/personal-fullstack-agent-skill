# Hermes Agent: Xác thực GitHub bằng Fine-grained PAT (WSL)

Phương án đơn giản: không cần script sinh token, token sống đến ngày hết hạn bạn chọn nên không bị hết hạn sau 1 giờ.

## Chú giải ký hiệu (đọc trước)

| Ký hiệu | Ý nghĩa |
|---|---|
| 👉 `<<TÊN_BIẾN>>` | **Chỗ bạn phải tự thay** bằng giá trị thật trước khi chạy lệnh |
| `# 👉 THAY:` | Dòng chú thích ngay trên chỗ cần thay |
| 🔑 **DÁN TOKEN** | Chỗ duy nhất bạn dán token `github_pat_...` (xem Bước 2) |

Giá trị cần chuẩn bị:

| Giá trị | Lấy ở đâu | Dùng ở |
|---|---|---|
| 🔑 Token `github_pat_...` | Hiện **một lần duy nhất** sau khi bấm Generate (Bước 1) | Bước 2 |
| 👉 `<<GITHUB_USER>>` / `<<TÊN_REPO>>` | Tài khoản và repo của bạn | Bước 5 |

---

## Bước 1: Tạo token

Vào **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token** (hoặc `https://github.com/settings/personal-access-tokens/new`).

- **Token name**: ví dụ `hermes-wsl`.
- **Expiration**: 30 ngày (tối đa nên 90 ngày). Ngắn hơn thì an toàn hơn, đổi lại phải tạo lại thường xuyên.
- **Resource owner**: tài khoản của bạn.
- **Repository access**: **Only select repositories** → chọn đúng các repo cho Hermes. **Không** chọn All repositories.
- **Repository permissions**:
  - Contents: **Read and write**
  - Pull requests: **Read and write**
  - Issues: **Read and write**
  - Metadata: Read-only (tự có)
  - **Không** chọn Administration, Workflows, Secrets, Actions.

Nếu muốn thận trọng, bắt đầu với Contents: Read-only và mở dần khi cần.

Bấm **Generate token**. Token dạng `github_pat_...` chỉ hiện **một lần**, hãy **copy ngay** (chưa đóng trang).

## Bước 2: Lưu token trong WSL 🔑

Không dán token vào `.bashrc` hay file trong repo. Chạy các lệnh sau:

```bash
mkdir -p ~/.config/hermes-bot
chmod 700 ~/.config/hermes-bot
umask 077
read -rsp "Dán PAT: " T; echo
```

> 🔑 **DÁN TOKEN Ở ĐÂY:** sau khi chạy dòng `read -rsp ...`, terminal sẽ hiện `Dán PAT:` và đứng chờ. Lúc đó **dán token `github_pat_...` rồi nhấn Enter**. Màn hình sẽ **không hiện gì** khi dán, đó là bình thường (chế độ ẩn). **Không** sửa dòng lệnh để chèn token vào.

Tiếp tục chạy:

```bash
printf '%s' "$T" > ~/.config/hermes-bot/pat
unset T
chmod 600 ~/.config/hermes-bot/pat
```

`read -s` giúp token không hiện trên màn hình và không nằm trong lịch sử shell.

## Bước 3: Cho `git` dùng token

```bash
cat > ~/.config/hermes-bot/git-credential.sh <<'EOF'
#!/usr/bin/env bash
if [ "$1" = "get" ]; then
  echo "username=x-access-token"
  echo "password=$(cat "$HOME/.config/hermes-bot/pat")"
fi
EOF

chmod 700 ~/.config/hermes-bot/git-credential.sh
git config --global credential.https://github.com.helper '!~/.config/hermes-bot/git-credential.sh'
```

**Remote phải dùng HTTPS**: `https://github.com/<<GITHUB_USER>>/<<TÊN_REPO>>.git` (không dùng SSH).

## Bước 4: Cho `gh` dùng token

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/gh <<'EOF'
#!/usr/bin/env bash
GH_TOKEN=$(cat "$HOME/.config/hermes-bot/pat") exec /usr/bin/gh "$@"
EOF
chmod 755 ~/.local/bin/gh
```

- Chạy `which -a gh` để xem `gh` thật nằm ở đâu. Nếu không phải `/usr/bin/gh`, sửa đường dẫn trong wrapper.
- Đảm bảo `~/.local/bin` nằm **trước** trong `PATH` của user chạy Hermes.

Nếu Hermes cần biến môi trường `GITHUB_TOKEN` (ưu điểm của PAT, vì không hết hạn sau 1 giờ):

```bash
GITHUB_TOKEN=$(cat ~/.config/hermes-bot/pat) hermes
```

> Ở lệnh trên **không cần dán token**: `$(cat ...)` tự đọc từ file `pat` đã lưu ở Bước 2.

## Bước 5: Kiểm tra

```bash
TOKEN=$(cat ~/.config/hermes-bot/pat)
curl -s -H "Authorization: Bearer $TOKEN" https://api.github.com/user/repos | jq '.[].full_name'

# 👉 THAY: <<GITHUB_USER>> và <<TÊN_REPO>>
git ls-remote https://github.com/<<GITHUB_USER>>/<<TÊN_REPO>>.git
```

Repo ngoài danh sách đã chọn mà bị từ chối (404/403) là cấu hình đúng. Nên thử `git push` thẳng vào `main` để xác nhận ruleset chặn được.

## Bước 6: Khóa nhánh `main`

Vào repo → **Settings → Rules → Rulesets → New branch ruleset**:

- Target: `main`
- Bật **Require a pull request before merging** và **Block force pushes**.
- Để trống **Bypass list**.

Hermes chỉ push nhánh riêng (ví dụ `hermes/*`) và mở PR; bạn duyệt và merge.

> Với tài khoản cá nhân, repo private cần gói GitHub Pro trở lên mới dùng được ruleset/branch protection. Repo public dùng miễn phí.

---

## Xoay hoặc thu hồi token

- **Hết hạn / xoay định kỳ**: tạo token mới ở Bước 1, rồi chạy lại **chỉ Bước 2** (ghi đè file `pat`). Git và `gh` tự dùng token mới.
- **Nghi ngờ lộ**: vào `https://github.com/settings/personal-access-tokens` → chọn token → **Delete** ngay, sau đó tạo token mới.

## Khác biệt so với GitHub App

- **Danh tính**: commit, PR, comment của Hermes mang tên **tài khoản của bạn**, không phân biệt được trong audit log. Bạn cũng không tự approve được PR do chính tài khoản mình mở, nên với repo bắt buộc review bạn sẽ phải để số approval là 0 hoặc dùng quyền bypass, làm yếu lớp bảo vệ.
- **Thời hạn**: token lộ thì dùng được đến khi hết hạn hoặc bị thu hồi, lâu hơn 1 giờ rất nhiều. Phải nhớ tạo lại định kỳ.
- **Cách khắc phục danh tính**: tạo tài khoản GitHub phụ làm bot. Tuy nhiên fine-grained PAT chỉ truy cập được repo do chính chủ token sở hữu hoặc thuộc organization mà tài khoản đó là member. Với repo cá nhân, cần chuyển repo vào một organization miễn phí, thêm tài khoản bot làm member rồi tạo PAT từ tài khoản bot. (Theo hiểu biết hiện tại, bạn nên kiểm tra lại trên GitHub trước khi làm.)

## Khi nào nên chọn PAT

PAT hợp lý nếu Hermes cần `GITHUB_TOKEN` cố định hoặc bạn muốn setup nhanh. Nếu Hermes chủ yếu gọi `git`/`gh` qua shell thì GitHub App (file `hermes-github-app-setup.md`) an toàn hơn.

## Lớp bảo vệ bổ sung

- Chạy Hermes bằng user Linux / distro WSL riêng, không chứa SSH key và cloud credentials cá nhân.
- Hạn chế truy cập `/mnt/c` (tắt automount trong `/etc/wsl.conf`).
- Bật chế độ xin xác nhận cho lệnh nguy hiểm (`git push`, `rm`, `curl | sh`) nếu Hermes hỗ trợ.
- **Prompt injection**: issue/PR/code của người khác có thể chứa chỉ dẫn độc hại. Quyền nhỏ và người duyệt PR là lớp chốt cuối.
