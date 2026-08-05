# Blueprint: Knowledge Base quản lý đa dự án (docs-as-code)

> **Dành cho agent (Claude Code):** Đây là bản thiết kế hoàn chỉnh. Thực hiện theo thứ tự ở mục 10.
> Mọi quyết định thiết kế trong file này đã được chốt — không tự thay đổi schema/cấu trúc.
> Nếu gặp điều không chắc chắn, đánh dấu `#needs-review` và hỏi lại thay vì tự suy diễn.

---

## 0. Bối cảnh & Mục tiêu

**Người dùng:** Technical lead quản lý nhiều dự án (hệ sinh thái DeNA), mỗi dự án nhiều repo
(infra, api, frontend...), tech stack và môi trường khác nhau (Cloud Run, GAE, Firebase
Hosting/Functions...). Tài liệu hiện rải rác: Confluence, Google Sheets, Google Slides,
Google Docs, Excel — nhiều khả năng đã lệch so với code thật.

**Mục tiêu KB:**

1. Một kho tri thức trung tâm dạng Git repo (local-first, không dùng GCP chung) mà
   coding agent (Claude Code / Copilot) **tự truy cập, đọc đúng phần cần, và ghi bổ sung**.
2. Trả lời được câu hỏi cross-project bằng metadata: _"dự án nào dùng Cloud Run ở prod?"_
3. Tối ưu token: agent chỉ load đúng thông tin cần theo nguyên tắc **progressive disclosure**.
4. Ghi lại quyết định (ADR) khi thay đổi tính năng/fix sự cố.
5. Import tài liệu sẵn có một cách tự động, **không mất dữ liệu**, có cơ chế đánh giá độ tin cậy.

**Ràng buộc:**

- KB là repo **cá nhân** của technical lead (dev khác không truy cập) — nơi host cuối cùng
  đang chờ confirm với IT (ưu tiên: private repo trong org EMU). Thiết kế phải chạy được
  local ngay, độc lập với remote.
- **Tuyệt đối không lưu giá trị secret thật** trong KB (xem mục 7).
- Người dùng là tech lead: không code UI hằng ngày nhưng **có** deep-dive fix code bất kỳ
  repo nào khi cần → quyền ghi ADR **không giới hạn theo vùng code** (xem mục 5).

---

## 1. Cấu trúc thư mục

```
knowledge-base/
├── index/
│   ├── projects.yaml            # Index tổng — SINH TỰ ĐỘNG từ frontmatter, không viết tay
│   └── verification-report.md   # Dashboard trạng thái verify — sinh tự động
├── projects/
│   ├── <project-slug>/          # vd: dena-com-official, dena-wonderia
│   │   ├── _meta.yaml           # metadata dự án (schema mục 3)
│   │   ├── overview.md          # tổng quan < 1 trang: kiến trúc tổng, các repo
│   │   ├── <component>/         # map 1:1 với repo: frontend/, api/, infra/, contentful/...
│   │   │   ├── *.md             # tài liệu component (cicd.md, contact-api.md, env-vars.md...)
│   │   │   ├── assets/          # ảnh, sơ đồ gốc (PNG/PDF)
│   │   │   ├── *.csv            # bảng dữ liệu lớn giữ dạng CSV, không nhét vào md
│   │   │   └── decisions/       # ADR của riêng component này
│   │   │       └── YYYY-MM-DD-<slug>.md
│   │   └── decisions/           # CHỈ cho ADR cross-repo / cấp dự án
│   └── ...
├── shared/
│   ├── vocabulary.yaml          # từ vựng chuẩn hóa (mục 3.4) — validator dùng file này
│   ├── templates/               # template frontmatter, ADR, component doc
│   └── *.md                     # quy ước chung: CI/CD pattern, WIF, naming...
├── _imports/
│   ├── raw/                     # bản gốc nguyên vẹn (PDF/HTML/xlsx/PNG) — không xóa tùy tiện
│   └── converted/               # Markdown thô sau convert máy — chưa review
└── scripts/
    ├── build_index.py           # quét frontmatter → sinh index/ + validate + report
    ├── export_confluence.py     # kéo Confluence pages về raw (HTML + metadata version)
    └── export_gdrive.py         # kéo Docs/Sheets/Slides về raw (md/xlsx+csv/pdf)
```

**Quy tắc cấu trúc:**

- Component map **1:1 với repo code**. Tên component ngắn gọn: `frontend`, `api`, `infra`...
- ADR chạm 1 repo → `decisions/` của component đó. Chạm ≥2 repo hoặc mang tính dự án
  (chọn region, chuẩn naming, migrate WIF toàn pipeline) → `decisions/` cấp project,
  frontmatter khai `affects: [frontend, api]`.
- Repo mà người dùng chỉ quản một phần (vd chỉ CI/CD): folder chỉ chứa file thuộc phần đó
  (`cicd.md`, sơ đồ pipeline, decisions). **Sự vắng mặt có chủ đích cũng là thông tin.**
- File dữ liệu bảng lớn (sitemap hàng trăm dòng...) giữ dạng `.csv` cạnh file `.md`;
  file md chỉ chứa phần chưng cất + giải mã quy ước (màu ô, ký hiệu cột).

---

## 2. Nguyên tắc tìm kiếm: 3 tầng progressive disclosure

Agent truy vấn theo thứ tự từ rẻ → đắt, dừng ngay khi đủ:

1. **Tầng index** — đọc `index/projects.yaml` (file nhỏ, tổng hợp toàn bộ frontmatter).
   Trả lời mọi câu hỏi cross-project dạng ma trận _project × component × env × thuộc tính_.
2. **Tầng component** — đã xác định project + component → đọc `_meta.yaml` + list file
   trong đúng folder component đó, mở đúng file liên quan task.
3. **Tầng full-text** — `ripgrep` trong phạm vi đã thu hẹp khi cần chi tiết.

**KHÔNG dùng vector DB / embeddings** ở quy mô hiện tại (hàng chục dự án × vài chục file).
Metadata + ripgrep đủ nhanh và chính xác hơn cho thông tin infra (từ khóa rõ ràng).
Chỉ cân nhắc SQLite FTS5 khi kho vượt vài nghìn file.

---

## 3. Schema frontmatter & metadata

### 3.1. `_meta.yaml` cấp project

```yaml
project: dena-wonderia # slug, khớp tên folder
client_dept: 'DeNA XX事業部' # bộ phận khách hàng quản lý dự án
pj_code: 'PJ-XXXXXXX-XXX' # nếu có (lấy từ Confluence)
repos:
  frontend:
    repo_url: https://github.com/<org>/wonderia-web # CHÌA KHÓA để agent tự map repo→KB
    primary_devs: [dev-a, dev-b] # ai code chính hằng ngày (mô tả, không phải rào chắn)
    my_role: tech-lead # owner | tech-lead | advisor
  contact-api:
    repo_url: ...
    my_role: owner
  infra:
    repo_url: ...
    my_role: owner
urls: # bóc từ tài liệu quản lý (Confluence...)
  prod: https://...
  dev: https://...
  admin_prod: https://...
  admin_dev: https://...
```

**Ý nghĩa `my_role`:** thuần mô tả ngữ cảnh (ai là primary dev, vai trò người dùng),
định hướng **nội dung nên có sẵn** trong folder (tech-lead → cicd/kiến trúc/deploy).
**KHÔNG phải điều kiện quyết định có được ghi ADR hay không** (xem mục 5).

### 3.2. Frontmatter file nội dung component

```yaml
---
project: dena-wonderia
component: frontend
scope: cicd # nội dung file nói về mảng nào
environments: # MAP theo env — không dùng list phẳng
  dev:
    runtime: cloud-run
    gcp_project: dena-wonderia-web-dev-gcp
    access_control: ip-filter
    deploy: github-actions
    url: https://dev...
  prod:
    runtime: cloud-run # env khác nhau có thể runtime khác nhau
    gcp_project: dena-wonderia-web-prod-gcp
    access_control: public
    deploy: github-actions
integrations: [contentful, zendesk]
tags: [nextjs, contact-form]
updated: 2026-08-05
source: # BẮT BUỘC với file sinh từ import (mục 6)
  origin: confluence # confluence | gslides | gsheets | gdocs | excel | repo-code
  url: <link nguồn gốc>
  source_updated: 2025-07-16 # ngày update của TÀI LIỆU GỐC
  imported: 2026-08-05
verification: # BẮT BUỘC với file sinh từ import
  status: unverified # unverified | verified | partially-verified | stale
  verified_against: null # commit hash của repo lúc đối chiếu
  notes: null # khác biệt phát hiện khi verify
---
```

- `environments` là **map lồng**, mỗi env tự khai runtime/access/deploy riêng —
  để query chính xác kiểu `environments.prod.runtime == "cloud-run"`.
- Env không cố định: có thể thêm `stg`, `preview`... tùy dự án.
- Component có nhiều service: thêm tầng `services:` trong env khi cần, đừng over-engineer sớm.

### 3.3. Frontmatter ADR

```yaml
---
project: dena-wonderia
component: frontend # hoặc affects: [frontend, api] nếu ADR cấp project
type: incident-fix # incident-fix | architecture | cicd | dependency | security
date: 2026-08-04
commits: [60fbd66, 3d40b05] # liên kết Git evidence
prs: [528, 529]
environments_affected: [prod]
---
```

Body ADR theo template: **Triệu chứng → Root cause → Fix → Lý do/Trade-off → Phòng ngừa**.
Với fix trong repo của dev khác, thêm ghi chú bảo vệ kiểu _"file này cố ý viết khác chuẩn
— đừng refactor cho đồng nhất"_.

Validator: ADR `type: incident-fix` thiếu `commits` → warning.

### 3.4. `shared/vocabulary.yaml` — chuẩn hóa từ vựng

```yaml
runtime:
  [
    cloud-run,
    gae,
    firebase-hosting,
    firebase-functions,
    cloud-functions-gen1,
    cloudflare,
  ]
access_control: [public, iap, basic-auth, ip-filter, token-header]
deploy: [github-actions, manual, terraform]
my_role: [owner, tech-lead, advisor]
verification_status: [unverified, verified, partially-verified, stale]
adr_type: [incident-fix, architecture, cicd, dependency, security]
origin: [confluence, gslides, gsheets, gdocs, excel, repo-code]
```

`build_index.py` **validate mọi frontmatter theo file này** — giá trị lạ (vd `cloudrun`
thay vì `cloud-run`) → lỗi build. Đây là điều kiện sống còn để search không sót.

---

## 4. Script `build_index.py` — yêu cầu chức năng

1. Quét toàn bộ `projects/**/*.md` + `_meta.yaml`, parse frontmatter (PyYAML).
2. Validate: theo `shared/vocabulary.yaml`; báo lỗi field thiếu/giá trị lạ;
   warning ADR incident-fix thiếu commits; warning file thiếu `updated`.
3. Sinh `index/projects.yaml`: cấu trúc lồng đầy đủ
   (project → components → files → environments/tags/integrations/scope/verification).
4. Sinh `index/verification-report.md`:
   - Bảng thống kê % verified theo project.
   - Danh sách file `unverified`/`stale` sắp theo tuổi `source_updated` (cũ nhất lên đầu).
   - Cảnh báo "verified nhưng cũ": `verified_against` quá xa HEAD hiện tại của repo
     (nếu có thể check) hoặc verify quá N ngày.
5. Chạy được thủ công + gợi ý gắn pre-commit hook / GitHub Actions khi lên remote.

---

## 5. Quy tắc cho agent (nội dung đưa vào `~/.claude/CLAUDE.md`)

Vì KB là repo cá nhân, **KHÔNG ghi hướng dẫn KB vào `CLAUDE.md` commit trong repo code**
(dev khác dùng chung sẽ gặp lỗi đường dẫn không tồn tại). Dùng một trong hai:

- `~/.claude/CLAUDE.md` (global, khuyến nghị — khai một lần), hoặc
- `CLAUDE.local.md` trong từng repo (nằm trong `.gitignore`).

Nội dung mẫu cho `~/.claude/CLAUDE.md`:

```markdown
## Knowledge Base cá nhân (~/kb)

Nếu tồn tại ~/kb/index/projects.yaml — đây là knowledge base quản lý dự án.

### Đọc (progressive disclosure — tiết kiệm context)

1. Chạy `git remote get-url origin`, đối chiếu với trường `repo_url` trong index
   để xác định project + component tương ứng repo hiện tại.
2. Câu hỏi cross-project → chỉ đọc index/projects.yaml.
3. Task trong 1 repo → chỉ đọc \_meta.yaml + file trong đúng component folder liên quan.
4. Cần chi tiết → ripgrep trong phạm vi đã thu hẹp. KHÔNG đọc lan sang component khác.
5. File có verification.status: unverified hoặc stale → coi nội dung là GỢI Ý CẦN
   KIỂM CHỨNG, ưu tiên đối chiếu code thật trước khi hành động dựa trên nó.

### Ghi

- Bất kỳ thay đổi code/config nào tôi thực hiện mà CÓ QUYẾT ĐỊNH đằng sau
  (root cause, trade-off, lý do chọn A thay vì B) → ghi ADR vào
  projects/<x>/<component>/decisions/YYYY-MM-DD-<slug>.md theo template,
  khai type + commits + prs. Bất kể my_role của repo là gì.
- my_role trong \_meta.yaml là NGỮ CẢNH, không phải điều kiện cho phép ghi.
- Thay đổi tầm thường không có quyết định (typo, bump version routine) → không cần ADR.
- Sau khi ghi/sửa file KB: chạy scripts/build_index.py, commit với prefix "kb:".
- TUYỆT ĐỐI không ghi giá trị secret/PII vào KB — chỉ tên, vị trí, hint/hash (mục 7).
```

(Đường dẫn `~/kb` điều chỉnh theo vị trí clone thật.)

**Copilot:** hạn chế hơn với instructions cá nhân ngoài repo → dùng Claude Code làm agent
chính cho task cần KB. Khi KB lên org EMU và được chia sẻ chính thức mới đưa reference vào
`.github/copilot-instructions.md`.

**Nâng cấp tương lai (mức 2):** MCP server nhỏ expose `kb_query_index(filter)`,
`kb_read(project, component)`, `kb_search(project, keyword)`, `kb_write(path, content)` —
phục vụ cả Claude Code lẫn Copilot, kiểm soát chính xác agent thấy gì. Cấu trúc repo
không đổi khi nâng cấp. Chưa làm ở phase đầu.

---

## 6. Pipeline import tài liệu sẵn có

### 6.0. Nguyên tắc: 3 tầng, không mất dữ liệu, code là trọng tài

```
Tầng 1  _imports/raw/        bản gốc nguyên vẹn (bảo hiểm — luôn quay lại được)
Tầng 2  _imports/converted/  Markdown thô sau convert máy
Tầng 3  projects/.../*.md    KB chính thức — mọi file import đều mang source + verification
```

- Mặc định mọi file import vào tầng 3: `verification.status: unverified`.
  Tài liệu quá cũ (vd spec 2020) → gắn thẳng `stale`.
- **Không cố làm sạch lúc import** — import kèm nhãn tin cậy, rồi verify bằng code (6.3).
- Tầng raw nặng → Git LFS hoặc thư mục ngoài repo; nó là archive, agent không đọc thường xuyên.

### 6.1. Kéo về raw (tự động bằng script)

| Nguồn         | Cách export                                     | Lưu raw              | Ghi chú                                   |
| ------------- | ----------------------------------------------- | -------------------- | ----------------------------------------- |
| Confluence    | REST API `body.storage` + `version.when`        | HTML + metadata JSON | `version.when` → `source_updated` tự động |
| Google Docs   | Drive API `files.export` → Markdown             | md                   | Docs export md native                     |
| Google Sheets | export **xlsx** (giữ formatting) + CSV từng tab | xlsx + csv           | CSV mất màu/format → xlsx là bản gốc      |
| Google Slides | export **PDF**                                  |                      | Giữ layout 2 chiều + hình                 |
| Excel         | copy nguyên file                                | xlsx                 |                                           |

### 6.2. Chưng cất converted → KB (Claude Code làm chính, người dùng review diff)

**Confluence dạng bảng thuộc tính** (PJ code, URL theo env, admin URL):
→ **bóc thẳng vào `_meta.yaml`/frontmatter** (structured data đội lốt wiki), không chỉ
convert thành bảng md. Phần văn xuôi còn lại → body Markdown.

**Google Sheets nhiều tab:**

- Mỗi tab xử lý riêng. Tab dữ liệu lớn (sitemap...) → giữ `.csv` cạnh file md.
- File md chỉ chứa: cấu trúc tổng quan, quy ước (Page-ID...), và **GIẢI MÃ FORMATTING**
  (ô vàng nghĩa gì, ô xám/gạch nghĩa gì, cột ○ là gì) — phần này hỏi người dùng nếu
  không suy ra được, ghi rõ vào doc. Formatting là lớp nghĩa dễ mất nhất.

**Google Slides:** đọc PDF (layout + hình) và **tường thuật lại thành prose Markdown** —
không phải convert cơ học. Spec cũ nhiều năm → `status: stale` ngay từ đầu.

**Hình ảnh & sơ đồ:**

- Sơ đồ kiến trúc/flow (thứ còn thay đổi) → **tái sinh thành Mermaid** trong md
  (diff được, agent đọc trực tiếp). Ảnh gốc giữ ở `assets/`, nhúng dưới sơ đồ với comment
  `<!-- original, imported YYYY-MM-DD, có thể outdated -->` trong giai đoạn chuyển tiếp.
- Ảnh chụp trạng thái (screenshot console, mockup) → giữ PNG trong `assets/`, nhúng vào md
  **bắt buộc kèm 2-3 dòng alt-text mô tả nội dung** (không có mô tả = ảnh vô hình với agent).
- Ảnh chứa bảng dữ liệu (bảng phân quyền...) → bóc thành bảng Markdown, ảnh chỉ là backup.

### 6.3. Verify: đối chiếu code/infra thật

Không thể validate tài liệu bằng cách nhìn tài liệu. Chạy **phiên verify theo project**:
mở Claude Code với cả repo code lẫn KB, đối chiếu từng claim kiểm chứng được:

| Claim                       | Cách verify                                                    |
| --------------------------- | -------------------------------------------------------------- |
| "prod deploy lên Cloud Run" | đọc `.github/workflows/*.yml`, hoặc `gcloud run services list` |
| "URL dev là ..."            | `curl -sI` + DNS/Cloud DNS record                              |
| "secret ở Secret Manager X" | `gcloud secrets list --project=X`                              |
| "API connect Zendesk"       | grep codebase tìm SDK/endpoint                                 |
| "dev dùng basic auth"       | đọc middleware/config                                          |

Kết quả: cập nhật `verification.status` (verified/stale/partially-verified), điền
`verified_against` = commit hash repo lúc đối chiếu, ghi khác biệt vào `verification.notes`.
Lệnh gcloud cần quyền → output cho người dùng chạy, không tự chạy.

Khác biệt phát hiện được ("doc nói GAE, code deploy Cloud Run") là **sản phẩm giá trị**:
danh sách cần báo phía quản lý Nhật cập nhật, kèm bằng chứng commit hash.

### 6.4. Khai quật tri thức ngầm từ repo code (làm TRƯỚC import tài liệu)

Đáng tin nhất vì nguồn là code đang chạy. Mỗi repo chạy phiên Claude Code với prompt:

```
Đọc repo này và sinh draft KB vào projects/<x>/<component>/:
1. architecture.md — stack, cấu trúc thư mục có chủ đích, thành phần chính
2. env-vars.md — quét toàn bộ biến môi trường: khai báo ở đâu (workflow env, Cloud Run
   env, terraform variables, .env.example), secret nào tham chiếu Secret Manager nào
   (CHỈ tên + vị trí, tuyệt đối không ghi value), biến bắt buộc/optional
3. conventions.md — lưu ý ngầm: pattern có chủ đích, chỗ code "kỳ lạ" kèm giả thuyết
   lý do (đánh dấu [GIẢ THUYẾT] nếu suy đoán), comment WARNING/HACK/TODO đáng chú ý,
   thứ tự thao tác bắt buộc (vd: chạy X trước terraform apply)
4. environments trong frontmatter — suy từ workflows + terraform: env nào deploy đi đâu

Đánh dấu source.origin: repo-code, verification.status: verified,
verified_against: <commit hash hiện tại>. Điều KHÔNG chắc → tag #needs-review.
```

Terraform: `terraform show -json` / state = sự thật tuyệt đối về infra tại thời điểm sinh.

**Thứ tự quan trọng:** khai quật repo TRƯỚC → import tài liệu SAU → phiên verify (6.3)
chỉ còn là so hai văn bản thay vì đọc lại code từ đầu.

---

## 7. Secrets — quy tắc tuyệt đối

1. **KHÔNG BAO GIỜ** lưu giá trị secret/API key/password/PII thật trong KB.
2. Chỉ lưu **con trỏ**: tên secret + vị trí ("Secret Manager @ project-X / secret-name").
3. Để đối chiếu khi copy value chạy local, lưu thêm:

```yaml
secrets:
  - name: CONTACT_API_KEY
    location: 'Secret Manager @ dena-com-official-prod-gcp / contact-api-key'
    hint: 'AIza****x9Kq' # 4 ký tự đầu/cuối (tùy chọn)
    sha256_prefix: '3f8a1c92' # 8 ký tự đầu sha256 của value — verify toàn bộ value
    rotated: 2026-06-15
```

Kiểm tra local: `echo -n "$VALUE" | sha256sum | head -c 8` rồi so `sha256_prefix`.
(Hash an toàn hơn hint vì không lộ ký tự thật và bắt được lỗi copy thiếu ở giữa.)

4. Nếu bắt buộc lưu value thật (token tool nội bộ, credential test chưa có nhà):
   **repo riêng** `secrets-repo/` mã hóa bằng **SOPS + age**:
   - SOPS mã hóa value giữ nguyên key/cấu trúc YAML → diff đọc được ở mức key.
   - age keypair đơn giản, private key ở `~/.config/sops/age/` (ngoài repo, backup vào
     password manager). Thêm người → thêm public key vào `.sops.yaml` + `sops updatekeys`.
   - **Agent KHÔNG có quyền giải mã secrets-repo** — chỉ cần biết tên + vị trí từ KB.
5. Nguồn sự thật của secret vận hành vẫn là **Secret Manager của từng GCP project**
   (đúng ranh giới quản lý theo bộ phận DeNA). secrets-repo không được thành bản copy
   thứ hai của Secret Manager — hai nguồn sự thật = drift.

---

## 8. Nơi host

- Chờ confirm IT: **ưu tiên private repo trong org EMU** (internal tooling).
- Trong lúc chờ: **local Git**, mọi thứ hoạt động không phụ thuộc remote.
- Nếu buộc phải remote ngoài EMU: Gitea/GitLab self-hosted nội bộ > GitHub cá nhân.
  GitHub cá nhân chỉ khi có xác nhận bằng văn bản của quản lý, và khi đó quy tắc mục 7
  càng nghiêm ngặt (chỉ con trỏ, 2FA + signed commits).

---

## 9. Sản phẩm agent cần tạo (deliverables)

1. Cây thư mục mục 1 + `.gitignore` (loại `_imports/raw/` nếu quá nặng, `CLAUDE.local.md`).
2. `shared/vocabulary.yaml` theo mục 3.4.
3. `shared/templates/`: `_meta.yaml.tpl`, `component-doc.md.tpl`, `adr.md.tpl`
   (đúng schema mục 3, ADR body: Triệu chứng → Root cause → Fix → Trade-off → Phòng ngừa).
4. `scripts/build_index.py` theo yêu cầu mục 4 (Python 3, PyYAML; kèm README cách chạy).
5. `scripts/export_confluence.py` (REST API, input: space key/page ids, output raw HTML +
   metadata JSON có `version.when`) và `scripts/export_gdrive.py` (Drive API `files.export`
   theo bảng 6.1). Đọc credential từ biến môi trường, không hardcode.
6. Khối nội dung mẫu cho `~/.claude/CLAUDE.md` (mục 5) — file riêng `CLAUDE_MD_SNIPPET.md`.
7. Prompt khai quật repo (6.4) và prompt phiên verify (6.3) — file `PROMPTS.md` để tái sử dụng.
8. README.md gốc của KB: tóm tắt nguyên tắc vận hành cho chính người dùng.

---

## 10. Thứ tự triển khai

| Phase | Việc                                                                                                     | Ghi chú                                      |
| ----- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| 1     | Scaffold toàn bộ deliverables mục 9                                                                      | chạy `build_index.py` trên KB rỗng phải pass |
| 2     | **Pilot 1 dự án nhỏ** (vd dena-wonderia): khai quật các repo bằng prompt 6.4 → KB nền `verified` từ code | làm trước import tài liệu                    |
| 3     | Pilot import: export raw nguồn tài liệu của dự án đó → chưng cất theo 6.2 → tất cả `unverified`/`stale`  | người dùng review diff từng commit           |
| 4     | Phiên verify pilot (6.3): đối chiếu, cập nhật status, ghi khác biệt                                      | output: danh sách lệch doc-vs-code           |
| 5     | Review pilot với người dùng → điều chỉnh template/vocabulary nếu cần                                     |                                              |
| 6     | Nhân rộng phase 2-4 cho từng dự án còn lại                                                               | mỗi dự án 1 nhánh/loạt commit riêng          |
| 7     | Bật `verification-report.md` làm dashboard theo dõi định kỳ                                              |                                              |
| 8     | (Sau này) MCP server mức 2; đưa reference vào copilot-instructions khi KB lên org EMU                    | không thuộc phạm vi hiện tại                 |

**Definition of done cho mỗi phase:** `build_index.py` pass không lỗi, commit prefix `kb:`,
người dùng đã review diff.
