# Hermes Agent: Xác thực GitHub bằng GitHub App (WSL)

Phương án an toàn nhất: token chỉ sống khoảng 1 giờ, cấp theo từng repo, hành động dưới danh tính bot riêng.

## Chú giải ký hiệu (đọc trước)

| Ký hiệu | Ý nghĩa |
|---|---|
| 👉 `<<TÊN_BIẾN>>` | **Chỗ bạn phải tự thay** bằng giá trị thật trước khi chạy lệnh |
| `# 👉 THAY:` | Dòng chú thích ngay trên chỗ cần thay |
| 🔑 | Bước có bí mật (private key, token), cần cẩn thận |

Các giá trị cần chuẩn bị (sẽ có sau Bước 1-3):

| Giá trị | Lấy ở đâu | Dùng ở |
|---|---|---|
| 👉 `<<APP_ID>>` | Trang settings của App (Bước 2) | Bước 5 |
| 👉 `<<INSTALLATION_ID>>` | Số cuối URL sau khi cài App (Bước 3) | Bước 5 |
| 👉 `<<WINDOWS_USER>>` | Tên user Windows của bạn | Bước 4 |
| 👉 `<<TÊN_FILE_PEM>>` | Tên file `.pem` vừa tải về | Bước 4 |
| 👉 `<<APP_SLUG>>` | Tên App bạn đặt ở Bước 1 (ví dụ `tuan-hermes-bot`) | Bước 6 |
| 👉 `<<GITHUB_USER>>` / `<<TÊN_REPO>>` | Tài khoản và repo của bạn | Bước 7 |

---

## Bước 1: Tạo GitHub App

Vào **Settings → Developer settings → GitHub Apps → New GitHub App** (hoặc mở `https://github.com/settings/apps/new`).

- **GitHub App name**: 👉 `<<APP_SLUG>>` (ví dụ `tuan-hermes-bot`, phải duy nhất toàn GitHub).
- **Homepage URL**: điền tạm URL bất kỳ (ví dụ profile GitHub của bạn).
- **Webhook**: bỏ tick **Active**.
- **Repository permissions**:
  - Contents: **Read and write**
  - Pull requests: **Read and write**
  - Issues: **Read and write**
  - Metadata: Read-only (tự có)
  - **Không** chọn Administration, Workflows, Secrets.
- **Where can this app be installed?**: chọn **Only on this account**.

Bấm **Create GitHub App**.

## Bước 2: Lấy App ID và private key 🔑

Trên trang settings của App vừa tạo:

1. Ghi lại **App ID** (hoặc Client ID) ở đầu trang → đây là 👉 `<<APP_ID>>`.
2. Kéo xuống **Private keys** → **Generate a private key**. Trình duyệt tải về một file `.pem`.

> File `.pem` là bí mật dài hạn duy nhất của hệ thống. Ai có nó là tạo được token. Bảo vệ như mật khẩu.

## Bước 3: Cài App vào đúng repo cần quản lý

Sidebar trái chọn **Install App** → **Install** cạnh tài khoản của bạn → chọn **Only select repositories** → chọn các repo cho Hermes.

Sau khi cài, URL có dạng `https://github.com/settings/installations/12345678`.
Số cuối (`12345678`) là 👉 `<<INSTALLATION_ID>>`, ghi lại.

## Bước 4: Đưa private key vào WSL 🔑

Cài công cụ cần thiết (nếu chưa có):

```bash
sudo apt install jq curl openssl
```

Chép key vào WSL và khóa quyền:

```bash
mkdir -p ~/.config/hermes-bot

# 👉 THAY: <<WINDOWS_USER>> = tên user Windows, <<TÊN_FILE_PEM>> = tên file .pem đã tải
cp /mnt/c/Users/<<WINDOWS_USER>>/Downloads/<<TÊN_FILE_PEM>>.pem ~/.config/hermes-bot/app.pem

chmod 700 ~/.config/hermes-bot
chmod 600 ~/.config/hermes-bot/app.pem
```

Sau đó **xóa file `.pem` trong thư mục Downloads của Windows**.

## Bước 5: Script sinh installation token (có cache) 🔑

Tạo file `~/.config/hermes-bot/get-token.sh`. Script dùng lại token cũ nếu còn hạn hơn 5 phút, nếu không thì tự sinh mới, nên **không bao giờ phải refresh bằng tay**.

```bash
#!/usr/bin/env bash
set -euo pipefail

# 👉 THAY: <<APP_ID>> bằng App ID ở Bước 2 (giữ nguyên dấu nháy kép)
APP_ID="<<APP_ID>>"
# 👉 THAY: <<INSTALLATION_ID>> bằng Installation ID ở Bước 3 (giữ nguyên dấu nháy kép)
INSTALLATION_ID="<<INSTALLATION_ID>>"

DIR="$HOME/.config/hermes-bot"
PEM="$DIR/app.pem"
CACHE="$DIR/token.cache"

# Còn hạn > 300s thì dùng lại
if [ -f "$CACHE" ]; then
  read -r tok exp < "$CACHE" || true
  if [ -n "${tok:-}" ] && [ $(( ${exp:-0} - $(date +%s) )) -gt 300 ]; then
    echo "$tok"; exit 0
  fi
fi

b64() { openssl base64 -A | tr '+/' '-_' | tr -d '='; }
now=$(date +%s)
header=$(printf '{"alg":"RS256","typ":"JWT"}' | b64)
payload=$(printf '{"iat":%d,"exp":%d,"iss":"%s"}' "$((now-60))" "$((now+540))" "$APP_ID" | b64)
sig=$(printf '%s.%s' "$header" "$payload" | openssl dgst -sha256 -sign "$PEM" | b64)

resp=$(curl -sf -X POST \
  -H "Authorization: Bearer $header.$payload.$sig" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/app/installations/$INSTALLATION_ID/access_tokens")

tok=$(jq -r .token <<<"$resp")
exp=$(date -d "$(jq -r .expires_at <<<"$resp")" +%s)
[ "$tok" != "null" ] || { echo "Không lấy được token" >&2; exit 1; }

umask 077
printf '%s %s\n' "$tok" "$exp" > "$CACHE"
echo "$tok"
```

Cấp quyền chạy và thử:

```bash
chmod 700 ~/.config/hermes-bot/get-token.sh
~/.config/hermes-bot/get-token.sh   # in ra token dạng ghs_...
```

**Tùy chọn, thu hẹp token:** thêm `-d` vào lệnh `curl` để giới hạn token chỉ cho 1 repo / ít quyền hơn:

```bash
# 👉 THAY: <<TÊN_REPO>> = tên repo (không kèm tên user)
-d '{"repositories":["<<TÊN_REPO>>"],"permissions":{"contents":"write","pull_requests":"write"}}'
```

## Bước 6: Cho `git` và `gh` tự lấy token

### 6.1 Git (credential helper)

```bash
cat > ~/.config/hermes-bot/git-credential.sh <<'EOF'
#!/usr/bin/env bash
if [ "$1" = "get" ]; then
  echo "username=x-access-token"
  echo "password=$("$HOME/.config/hermes-bot/get-token.sh")"
fi
EOF

chmod 700 ~/.config/hermes-bot/git-credential.sh
git config --global credential.https://github.com.helper '!~/.config/hermes-bot/git-credential.sh'
```

Mỗi lần `git fetch/push` qua HTTPS, git tự gọi script để lấy token còn hạn.
**Remote phải dùng HTTPS** (`https://github.com/<<GITHUB_USER>>/<<TÊN_REPO>>.git`), không dùng SSH.

### 6.2 `gh` CLI (wrapper)

```bash
mkdir -p ~/.local/bin
cat > ~/.local/bin/gh <<'EOF'
#!/usr/bin/env bash
GH_TOKEN=$("$HOME/.config/hermes-bot/get-token.sh") exec /usr/bin/gh "$@"
EOF
chmod 755 ~/.local/bin/gh
```

- Chạy `which -a gh` để xem `gh` thật nằm ở đâu. Nếu không phải `/usr/bin/gh`, sửa đường dẫn trong wrapper.
- Đảm bảo `~/.local/bin` nằm **trước** trong `PATH` của user chạy Hermes.
- Từ giờ agent gõ `gh pr create ...` là tự có token mới.

### 6.3 Danh tính commit của bot

```bash
# 👉 THAY: <<APP_SLUG>> = tên App ở Bước 1 (ví dụ tuan-hermes-bot). Giữ nguyên %5Bbot%5D.
BOT_ID=$(curl -s "https://api.github.com/users/<<APP_SLUG>>%5Bbot%5D" | jq .id)

# 👉 THAY: <<APP_SLUG>> ở cả 2 dòng dưới. Giữ nguyên phần [bot].
git config --global user.name "<<APP_SLUG>>[bot]"
git config --global user.email "${BOT_ID}+<<APP_SLUG>>[bot]@users.noreply.github.com"
```

> Nên làm toàn bộ cấu hình này trong **một user Linux hoặc distro WSL riêng** cho Hermes để không ảnh hưởng git cá nhân của bạn.

## Bước 7: Kiểm tra

```bash
TOKEN=$(~/.config/hermes-bot/get-token.sh)

# Liệt kê repo App truy cập được (phải đúng danh sách bạn đã chọn)
curl -s -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  https://api.github.com/installation/repositories | jq '.repositories[].full_name'

# 👉 THAY: <<GITHUB_USER>> và <<TÊN_REPO>>
git ls-remote https://github.com/<<GITHUB_USER>>/<<TÊN_REPO>>.git
```

Repo ngoài danh sách bị từ chối (404/403) là cấu hình đúng.

## Bước 8: Khóa nhánh `main`

Vào repo → **Settings → Rules → Rulesets → New branch ruleset**:

- Target: `main`
- Bật **Require a pull request before merging** và **Block force pushes**.
- Để trống **Bypass list** (App không được bypass).

Hermes chỉ push nhánh riêng (ví dụ `hermes/*`) và mở PR; **bạn là người duyệt và merge**.

> Với tài khoản cá nhân, repo private cần gói GitHub Pro trở lên mới dùng được ruleset/branch protection. Repo public dùng miễn phí. Nếu không có, hãy để Hermes chỉ push nhánh riêng và tự bạn merge.

---

## Gắn vào Hermes

- Cách chắc chắn nhất: để Hermes gọi `git`/`gh` trong shell WSL đã cấu hình như trên.
- Nếu Hermes đòi biến môi trường `GITHUB_TOKEN`:
  ```bash
  GITHUB_TOKEN=$(~/.config/hermes-bot/get-token.sh) hermes
  ```
  Lưu ý: token chỉ sống 1 giờ và process chỉ đọc biến **một lần lúc khởi động**, nên phiên dài sẽ hỏng khi hết hạn.

### Giới hạn cần biết

Cách này **không** giải quyết được trường hợp tool/MCP server đọc `GITHUB_TOKEN` một lần lúc khởi động. Nếu gặp:

1. Cấu hình để Hermes dùng `git`/`gh` qua shell thay vì tích hợp GitHub riêng (đơn giản nhất).
2. Nếu tool hỗ trợ lấy token từ lệnh/file (kiểu `token_command`), trỏ vào `get-token.sh`.
3. Nếu bắt buộc dùng biến môi trường: chạy Hermes theo phiên ngắn, hoặc dùng fine-grained PAT cho riêng tool đó (xem file `hermes-github-pat-setup.md`).

## Lớp bảo vệ bổ sung

- Chạy Hermes bằng user Linux / distro WSL riêng, không chứa SSH key và cloud credentials cá nhân.
- Hạn chế truy cập `/mnt/c` (tắt automount trong `/etc/wsl.conf`).
- Bật chế độ xin xác nhận cho lệnh nguy hiểm (`git push`, `rm`, `curl | sh`) nếu Hermes hỗ trợ.
- **Prompt injection**: issue/PR/code của người khác có thể chứa chỉ dẫn độc hại. Quyền nhỏ và người duyệt PR là lớp chốt cuối.
- Theo dõi audit log của bot, thu hồi ngay (xóa private key trên trang App) nếu nghi ngờ lộ.
