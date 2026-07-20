# Security Scan — Reusable Blueprint (dành cho AI Agent)

> **Mục đích tài liệu:** Đây là bản kế hoạch tái sử dụng, đúc kết từ tool `Security Scan`
> đã triển khai cho repo **API** (`wonderia-web-contact-api`). Một AI Agent đọc tài liệu này
> sẽ **khảo sát dự án đích → áp dụng đúng theo cấu trúc dự án → nghiệm thu**.
> Tài liệu được viết "để mở" nhằm áp dụng linh hoạt cho: repo API, repo Frontend (FE),
> Firebase Functions, hoặc monorepo chứa nhiều thành phần.

---

## 0. Cách AI Agent sử dụng tài liệu này

1. Đọc **Mục 1–5** để hiểu mục tiêu, nguyên tắc bất biến, các tầng quét (5 cốt lõi + 1 optional) và cơ chế.
2. Chạy **Mục 6 — Thuật toán áp dụng**: khảo sát dự án đích, điền **Bảng quyết định**.
3. Sinh ra 2 file, **lấy nguyên template nhúng trong tài liệu này** rồi chỉnh theo tham số ở **Mục 7**:
   - `.github/workflows/security-scan.yml` ← **Mục 10.B**
   - `.github/scripts/format-security-report.mjs` ← **Mục 10.C**
4. Tự kiểm thử theo **Mục 9** trước khi báo cáo cho dev.
5. **KHÔNG commit/push** — chỉ tạo file và báo cáo; để dev review & merge.

> ⚠️ **QUAN TRỌNG — không phụ thuộc repo khác:** AI Agent **không** cần và thường **không có quyền**
> truy cập repo gốc `wonderia-web-contact-api`. **Toàn bộ mã nguồn cần thiết đã được nhúng nguyên văn**
> trong tài liệu này (workflow ở **Mục 10.B**, script báo cáo ở **Mục 10.C**). Tuyệt đối **không** tìm/copy
> file từ repo khác (sẽ lỗi permission). Chỉ dựa vào template trong tài liệu.

---

## 1. Mục tiêu tổng quan

Xây dựng một **GitHub Actions workflow quét bảo mật** chạy **khi mở Pull Request** vào các
nhánh deploy (mặc định `develop`, `master`), với các đặc tính:

- **Phòng thủ nhiều lớp (defense-in-depth):** phủ toàn chuỗi cung ứng phần mềm bằng **5 tầng cốt lõi + 1 tầng optional**.
- **Non-blocking:** KHÔNG bao giờ chặn merge. Kết quả được đăng dưới dạng **comment trên PR**.
- **Tách rời pipeline deploy:** quét chạy ở sự kiện `pull_request` (lúc review), hoàn toàn
  độc lập với workflow deploy (`push`) → **không làm chậm deploy**.
- **Báo cáo trung thực:** phân biệt rõ 3 trạng thái *quét-OK-sạch* / *quét-OK-có-phát-hiện* /
  *quét-THẤT-BẠI* (không bao giờ hiển thị xanh giả).
- **An toàn chuỗi cung ứng:** mọi scanner được **pin version** và **verify checksum SHA256**.

---

## 2. Nguyên tắc thiết kế (BẤT BIẾN — giữ nguyên cho mọi dự án)

Các nguyên tắc sau **không đổi** dù áp dụng cho dự án nào. Đây là phần "lõi" của tool.

| # | Nguyên tắc | Cách hiện thực |
|---|---|---|
| N1 | **Chạy lúc PR, không đụng deploy** | `on: pull_request: branches: [...]`. Workflow deploy giữ nguyên. |
| N2 | **Non-blocking** | Mỗi step scan kết thúc bằng `exit 0`. Không đặt làm required check. |
| N3 | **Phân biệt 3 trạng thái** | Mỗi tool tự bắt exit code → `<TOOL>_STATUS=success/failure`. Formatter phân biệt `null`(lỗi) ≠ `[]`(sạch). File thiếu/hỏng → ⚠️ FAILED, KHÔNG phải ✅. |
| N4 | **Verify checksum + pin version** | Tải tarball ra file → tải `*_checksums.txt` → `sha256sum -c` → mới giải nén. Checksum sai → step đỏ + `::error::` + banner đỏ trong comment, nhưng job vẫn xanh (non-blocking). |
| N5 | **Comment gọn, trọng tâm** | Mỗi tầng chỉ liệt kê **≤ 15** finding, ưu tiên CRITICAL trước; luôn ghi **tổng số** + breakdown. Giới hạn tổng comment < 60.000 ký tự (limit GitHub = 65.536). |
| N6 | **Sticky comment** | `marocchino/sticky-pull-request-comment@v3` với `header` cố định → cập nhật cùng 1 comment, không spam. |
| N7 | **Timeout** | `timeout-minutes: 15` ở job → scan treo không đốt runner minutes. |
| N8 | **Runtime & action version hiện hành** | Dùng **Node LTS mới nhất** + **action version mới nhất** đang được GitHub Actions hỗ trợ **tại thời điểm thực thi**. KHÔNG hardcode version cũ trong tài liệu. Mục đích: action/runtime chạy trên Node runtime còn được hỗ trợ → tránh cảnh báo/deprecation/EOL. |
| N9 | **Quyền tối thiểu** | `permissions: { contents: read, pull-requests: write }`. |

> ⚠️ **CHO AI AGENT — version trong tài liệu này chỉ là MẶC ĐỊNH TẠI THỜI ĐIỂM VIẾT, PHẢI cập nhật khi thực thi:**
> Tài liệu pin sẵn `node-version: '24.2'`, `actions/checkout@v6`, `actions/setup-node@v6`,
> `marocchino/sticky-pull-request-comment@v3`, Trivy/Gitleaks/Semgrep. **Trước khi sinh file, AI Agent
> PHẢI kiểm tra & thay bằng phiên bản phù hợp tại thời điểm chạy:**
> - **Node:** dùng bản **LTS mới nhất** GitHub Actions còn hỗ trợ (vd nếu tương lai Node 24 đã EOL và
>   Node 26 là LTS → dùng `26`, **đừng** dùng `24` đã bị loại bỏ).
> - **GitHub Actions** (`checkout`, `setup-node`, `sticky-pull-request-comment`): dùng **major version
>   mới nhất** chạy trên Node runtime còn được hỗ trợ (tránh cảnh báo "Node XX actions are deprecated").
> - **Scanner** (Trivy/Gitleaks/Semgrep): verify & pin lại version theo **Mục 4** + **Mục 10.A**.
> Cách kiểm tra nhanh: xem trang Releases/Marketplace của từng action + lịch Node LTS
> (https://nodejs.org/en/about/previous-releases) tại thời điểm thực thi.

---

## 3. Các tầng quét chính & tiêu chí

Hệ thống quét theo mô hình **defense-in-depth**: **5 tầng cốt lõi** (1–5) + **1 tầng optional** (6 — Firebase Security Rules, bật cho dự án Firebase):

| #   | Tầng quét              | Đối tượng quét                         | Tiêu chí phát hiện                                                                                            | Ngưỡng mức độ               |
| --- | ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1️⃣  | **Dependencies (SCA)** | Thư viện trong **lockfiles** (`package-lock.json`/`yarn.lock`/`pnpm-lock.yaml`) | CVE đã công bố trên thư viện phụ thuộc (Trivy tự phủ npm/yarn/pnpm)                                                                    | CRITICAL, HIGH, MEDIUM, LOW |
| 2️⃣  | **SAST**               | Mã nguồn ứng dụng (`src/`)             | Lỗi bảo mật trong code: injection, XSS, cấu hình sai… theo bộ rule JavaScript/TypeScript/Node.js/OWASP Top 10 | ERROR, WARNING              |
| 3️⃣  | **Secrets**            | **Toàn bộ lịch sử Git** (mọi commit)   | Khóa bí mật, API key, token, mật khẩu bị commit nhầm                                                          | Mọi secret phát hiện được   |
| 4️⃣  | **Container OS CVE**   | Base image (vd `node:24.2-alpine`)     | CVE ở tầng hệ điều hành / OS package của image                                                                | CRITICAL, HIGH, MEDIUM, LOW |
| 5️⃣  | **IaC Misconfig**      | `Dockerfile` & file cấu hình hạ tầng   | Cấu hình sai chuẩn (chạy root, thiếu USER, thiếu healthcheck…)                                                | HIGH, CRITICAL              |

> **Tầng 6 — Firebase Security Rules** *(optional, bật cho dự án Firebase)*: quét heuristic
> `firestore.rules`/`storage.rules`/`*.rules` tìm anti-pattern theo GCP (`if true`, allow không
> điều kiện, test-mode time-bomb, wildcard đệ quy, ghi chỉ cần đăng nhập). Ngưỡng: **CRITICAL, HIGH, WARNING**.
> Bộ pattern đầy đủ + URL tham chiếu + script: xem **Mục 10.D**.

**Tiêu chuẩn tham chiếu:** OWASP Top 10, CVE/NVD database, các bộ ruleset bảo mật chính thức của Semgrep và Trivy.

### 🔗 URL tham chiếu — Công cụ (Scanner)

| Công cụ      | Trang chính thức / Tài liệu                                | Mã nguồn                              |
| ------------ | ---------------------------------------------------------- | ------------------------------------- |
| **Trivy**    | https://trivy.dev/ — https://aquasecurity.github.io/trivy/ | https://github.com/aquasecurity/trivy |
| **Semgrep**  | https://semgrep.dev/ — https://semgrep.dev/docs/           | https://github.com/semgrep/semgrep    |
| **Gitleaks** | https://gitleaks.io/                                       | https://github.com/gitleaks/gitleaks  |

### 🔗 URL tham chiếu — Tiêu chuẩn & Cơ sở dữ liệu

| Tiêu chuẩn / Nguồn dữ liệu          | URL                                      | Áp dụng cho tầng            |
| ----------------------------------- | ---------------------------------------- | --------------------------- |
| **OWASP Top 10**                    | https://owasp.org/www-project-top-ten/   | 2️⃣ SAST                     |
| **CVE (chương trình CVE)**          | https://www.cve.org/                     | 1️⃣ SCA, 4️⃣ Container OS CVE |
| **NVD (National Vulnerability DB)** | https://nvd.nist.gov/                    | 1️⃣ SCA, 4️⃣ Container OS CVE |
| **Trivy Vulnerability DB**          | https://github.com/aquasecurity/trivy-db | 1️⃣ SCA, 4️⃣ Container OS CVE |
| **Semgrep — Ruleset JavaScript**    | https://semgrep.dev/p/javascript         | 2️⃣ SAST                     |
| **Semgrep — Ruleset TypeScript**    | https://semgrep.dev/p/typescript         | 2️⃣ SAST                     |
| **Semgrep — Ruleset Node.js**       | https://semgrep.dev/p/nodejs             | 2️⃣ SAST                     |
| **Semgrep — Ruleset OWASP Top 10**  | https://semgrep.dev/p/owasp-top-ten      | 2️⃣ SAST                     |
| **Trivy Misconfiguration (AVD)**    | https://avd.aquasec.com/misconfig/       | 5️⃣ IaC Misconfig            |
| **Firebase — Fix insecure rules**   | https://firebase.google.com/docs/rules/insecure-rules | 6️⃣ Firebase Rules |
| **Firebase — Rules basics**         | https://firebase.google.com/docs/rules/basics | 6️⃣ Firebase Rules |
| **Firebase — Rules conditions / best practice** | https://firebase.google.com/docs/firestore/security/rules-conditions | 6️⃣ Firebase Rules |

---

## 4. Phần mềm quét (Scanner) đang sử dụng

| Tầng         | Công cụ                                     | Phiên bản (đã pin) | Vai trò                                                  |
| ------------ | ------------------------------------------- | ------------------ | -------------------------------------------------------- |
| 1, 4, 5      | **Trivy** (Aqua Security)                   | `0.71.1`           | Quét CVE thư viện, CVE OS của image, và sai cấu hình IaC |
| 2            | **Semgrep** (OSS)                           | `1.166.0`          | Phân tích tĩnh mã nguồn (SAST)                           |
| 3            | **Gitleaks**                                | `8.18.4`           | Phát hiện secret trong toàn bộ lịch sử Git               |
| Báo cáo      | **Node.js script** (thuần, không phụ thuộc) | —                  | Gộp kết quả → 1 báo cáo Markdown                         |
| Đăng báo cáo | `marocchino/sticky-pull-request-comment`    | `v3`               | Đăng/cập nhật comment trên PR                            |

| 6 (optional) | **Node script** `scan-firebase-rules.mjs` (heuristic) | —                  | Quét anti-pattern Firebase Security Rules (`*.rules`)    |

**Điểm cộng về bảo mật chuỗi cung ứng:** Tất cả scanner đều được **pin phiên bản cố định** và
**xác thực checksum SHA256** khi tải binary (chống tấn công thay thế artifact / supply-chain).

> ⚠️ **Lưu ý chọn version:** version trong bảng là tại thời điểm viết. Khi áp dụng, AI Agent
> nên kiểm tra version còn tồn tại & có binary asset (xem **Mục 10** lệnh verify) rồi pin lại
> cho phù hợp. Trivy đặc biệt: có tag không kèm binary → phải verify URL trả `200`.

---

## 5. Cấu trúc file & cơ chế hoạt động

```
.github/
├── workflows/
│   └── security-scan.yml            # workflow chính: 5 tầng cốt lõi + tầng 6 optional + đăng comment
└── scripts/
    ├── format-security-report.mjs   # Node thuần: parse JSON scanner → 1 comment Markdown
    └── scan-firebase-rules.mjs       # (optional) heuristic quét Firebase Security Rules → rules.json
```

### Luồng chạy (1 job tuần tự, ~2–3 phút):
1. `checkout` (`fetch-depth: 0` — cần full history cho Gitleaks) + `setup-node`.
2. Cài Trivy + Gitleaks (tải file → verify checksum → giải nén). Semgrep cài qua `pip`.
3. Chạy 5–6 tầng quét, mỗi tầng xuất **JSON** + set biến `<TOOL>_STATUS`.
4. `format-security-report.mjs` đọc các JSON + biến status → in ra `report.md`.
5. Đăng `report.md` thành **sticky comment** trên PR.

### Hợp đồng (contract) của formatter — *quan trọng để adapt*:
- **Đầu vào (file JSON trong thư mục làm việc):** `trivy-dep.json`, `trivy-image.json`,
  `trivy-config.json`, `gitleaks.json`, `semgrep.json`, `rules.json` *(tầng 6, optional)*
  (thiếu/rỗng/hỏng đều dung thứ → ⚠️ FAILED).
- **Đầu vào (env):** `DEP_STATUS`, `IMAGE_STATUS`, `CONFIG_STATUS`, `SECRET_STATUS`,
  `SEMGREP_STATUS`, `RULES_STATUS` (`success`|`failure`|`skipped`); `TRIVY_INSTALL`,
  `GITLEAKS_INSTALL` (`ok`|`checksum-failed`|`download-failed`); `GITHUB_SHA`, `PR_NUMBER`, `BASE_IMAGE`.
- **Đầu ra:** Markdown ra stdout (đã cap 15/section + giới hạn 60k ký tự). Bảng tổng hợp đầu
  báo cáo có **2 cột trạng thái tách bạch** (xem **Mục 5.1**): `Status` (tool có chạy không) và
  `Result` (mức độ nghiêm trọng của phát hiện).
- Formatter **project-agnostic** → dùng nguyên template ở **Mục 10.C** (đã hỗ trợ sẵn trạng thái
  `skipped` cho tình huống "không có Dockerfile"). Tình huống "nhiều base image" xem **Mục 7.C**.

#### 5.1 — Bảng tổng hợp: 2 cột `Status` + `Result` (BẮT BUỘC, đã có sẵn trong template)
Bảng đầu báo cáo có **4 cột**: `Layer | Tool | Status | Result`. Hai cột trạng thái **trực giao** nhau —
tách bạch để tránh hiểu nhầm "tool chạy xong" = "không có vấn đề":

| Cột | Ý nghĩa | Icon |
|---|---|---|
| **Status** | Tool **có chạy được** không (độc lập với findings) | ✅ đã chạy · ⚠️ FAILED (không quét được — KHÔNG phải "sạch") · ⏭️ N/A (tầng không áp dụng) |
| **Result** | **Mức độ nghiêm trọng** của phát hiện (severity nặng nhất của tầng) | 🔴 CRITICAL/HIGH (hoặc Semgrep ERROR / có secret) · 🟡 MEDIUM/LOW (hoặc WARNING) · ✅ không có issue · — chưa rõ (tool FAILED) · ⏭️ skip |

- Hàm `resultIcon(statusEnv, report, severities)` (Mục 10.C) tính icon `Result`; `severities` là danh
  sách severity parse từ chính findings của tầng đó (dùng lại đúng parser của section → `Result`
  luôn khớp với phần chi tiết bên dưới).
- **Bất biến quan trọng:** `Status` ✅ **không** kéo theo `Result` ✅. Tool chạy xong nhưng có HIGH →
  `Status=✅`, `Result=🔴`. Đây là điểm thường bị render sai nếu chỉ có 1 cột.
- Map severity cho từng tool đã xử lý trong template: Trivy vuln/misconfig (CRITICAL/HIGH/MEDIUM/LOW),
  Semgrep (ERROR→🔴, WARNING/INFO→🟡), Gitleaks (mọi secret→🔴), Firebase rules (CRITICAL/HIGH→🔴, WARNING→🟡).
  Nếu **thêm tầng mới**, chỉ cần truyền mảng `severities` của tầng đó vào `resultIcon` (xem 5.2).

#### 5.2 — Thêm tầng mới vào bảng (vd tầng heuristic riêng của dự án)
Khi bổ sung 1 tầng quét mới, để có cột `Result` đúng: parse findings của tầng → mảng severity →
thêm 1 dòng `summary` dùng `statusIcon(...)` + `resultIcon(..., severities)`. Nếu tầng không có thang
severity (vd "thiếu/không thiếu") thì map sang `HIGH`/`MEDIUM`/`LOW` tuỳ mức rủi ro rồi truyền vào.

---

## 6. THUẬT TOÁN ÁP DỤNG CHO DỰ ÁN MỚI (AI Agent thực thi)

### Bước 6.1 — Khảo sát dự án đích (chạy các lệnh phát hiện)

```bash
# Liệt kê các lockfile JS/TS (mỗi cái = 1 package: API / FE / functions)
find . -type f \( -name package-lock.json -o -name yarn.lock -o -name pnpm-lock.yaml \) \
  -not -path '*/node_modules/*'

# Liệt kê Dockerfile (đối tượng cho tầng 4 + 5)
find . -type f -iname 'Dockerfile*' -not -path '*/node_modules/*'

# Marker Firebase
ls firebase.json .firebaserc firestore.rules storage.rules 2>/dev/null; ls -d functions 2>/dev/null

# Thư mục source (để chỉnh path SAST): tìm src/, app/, web/, frontend/, functions/src…
find . -maxdepth 3 -type d \( -name src -o -name app -o -name web -o -name frontend -o -name functions \) \
  -not -path '*/node_modules/*'

# Framework FE (để chọn ruleset Semgrep): đọc dependencies
grep -lER '"(react|next|vue|@angular/core|svelte)"' --include=package.json . 2>/dev/null

# Nhánh deploy thực tế của dự án (để chỉnh on.pull_request.branches)
git branch -r
```

### Bước 6.2 — Điền Bảng quyết định theo loại dự án

| Tầng | API (Node/TS) | FE (React/Next/Vue) | Firebase Functions | Monorepo (nhiều package) |
|---|---|---|---|---|
| **1 SCA** | quét `.` (tự dò mọi lockfile) | giống | giống | giống — `trivy fs .` tự phủ **mọi** lockfile |
| **2 SAST** | path `src/`; rule `js,ts,nodejs,owasp` | + dir FE; **thêm** `p/react` / `p/nextjs` (⚠️ **KHÔNG có `p/vue`** — 404; Vue xem **Mục 7.B**) | path `functions/`; rule `nodejs,owasp` | **hợp** mọi source dir + **hợp** mọi ruleset |
| **3 Secrets** | full history | giống | giống | giống (repo-wide) |
| **4 Container OS CVE** | **TỰ ĐỘNG** (auto-detect Dockerfile) | tự động (có Dockerfile→scan, không→N/A) | tự động (thường N/A vì không Dockerfile) | tự động (scan + merge từng Dockerfile) |
| **5 IaC Misconfig** | Dockerfile | Dockerfile/yaml nếu có | `firebase.json`/yaml (Trivy phủ **giới hạn** Firebase rules) | toàn bộ IaC (Dockerfile/tf/k8s) |
| **6 Firebase Rules** *(optional)* | ⏭️ N/A (skip) | ⏭️ N/A (skip) | **BẬT** — quét `*.rules` | bật nếu có `*.rules` |

### Bước 6.3 — Áp dụng theo từng tầng

- **Tầng 1 (SCA):** giữ `trivy fs --scanners vuln … .` — **không cần đổi**, đã tự phủ mọi package.
- **Tầng 2 (SAST):** chỉnh 2 tham số: `SAST_PATHS` (các thư mục source) và `SAST_CONFIGS`
  (các ruleset). Xem **Mục 7.B**.
- **Tầng 3 (Secrets):** **không đổi**.
- **Tầng 4 (Container):** **TỰ ĐỘNG** — step container tự `find Dockerfile*`: 0 file →
  `IMAGE_STATUS=skipped` (⏭️ N/A); ≥1 file → scan từng base image + merge. **Không cần chỉnh tay** (xem 7.C).
- **Tầng 5 (Misconfig):** giữ `trivy config … .` — tự dò Dockerfile/yaml/tf. Với Firebase,
  ghi chú giới hạn (Trivy không kiểm sâu `firestore.rules`).
- **Tầng 6 (Firebase Rules — optional):** nếu tồn tại file `*.rules` → thêm script
  `scan-firebase-rules.mjs` (Mục 10.D) + step ở **Mục 7.E**; nếu không → `RULES_STATUS=skipped` (⏭️ N/A).

### Bước 6.4 — Sinh file & nghiệm thu (Mục 9). KHÔNG commit/push.

---

## 7. Tham số cần chỉnh (parameter) & biến thể

Tập trung mọi tham số biến thiên vào khối `env:` để dễ chỉnh, phần còn lại giữ nguyên.

### 7.A — Phiên bản & nhánh
```yaml
on:
  pull_request:
    branches: [develop, master]   # ADAPT: nhánh deploy thực tế của dự án
env:
  TRIVY_VERSION: 0.71.1           # ADAPT: verify còn binary (Mục 10)
  GITLEAKS_VERSION: 8.18.4
  SEMGREP_VERSION: 1.166.0
```
> Ngoài scanner: cập nhật `node-version` (Node **LTS mới nhất**) và version các action
> (`checkout`/`setup-node`/`sticky-pull-request-comment`) sang bản mới nhất tại thời điểm thực thi — xem **N8**.

### 7.B — SAST (tầng 2): path + ruleset
Tham số hoá để linh hoạt FE/Firebase. Trong `env`:
```yaml
  SAST_PATHS: "src"                                              # ADAPT: vd "src web/src functions/src"
  SAST_CONFIGS: "p/javascript p/typescript p/nodejs p/owasp-top-ten"  # ADAPT: + p/react / p/nextjs (xem ⚠️ dưới)
```
Step Semgrep dựng `--config` động:
```bash
configs=""; for c in $SAST_CONFIGS; do configs="$configs --config $c"; done
semgrep scan $configs --json --output semgrep.json $SAST_PATHS
```

> ⚠️ **BẮT BUỘC verify pack Semgrep tồn tại trước khi thêm** (giống verify scanner ở Mục 10.A):
> ```bash
> curl -sL -o /dev/null -w "%{http_code}\n" "https://semgrep.dev/c/p/<pack>"   # phải = 200
> ```
> Pack **không tồn tại** → `semgrep scan` báo lỗi config (**exit code ≥ 2**) → `[ $? -le 1 ]` false →
> `SEMGREP_STATUS=failure` → report hiện **⚠️ FAILED** (KHÔNG phải "sạch"). Đây là lỗi config, KHÔNG phải lỗi code.
> - Đã kiểm (2026-06): `p/javascript`, `p/typescript`, `p/nodejs`, `p/owasp-top-ten`, `p/react`, `p/nextjs` → **200**.
>   **`p/vue` → 404 (KHÔNG tồn tại)** — đừng thêm vào `SAST_CONFIGS`, sẽ làm fail cả tầng SAST.

#### 7.B.1 — Dự án Vue (.vue SFC): bù khoảng trống bằng custom rules cục bộ
**Vấn đề:** Không có pack `p/vue`. Hơn nữa, Semgrep **có parse `.vue`** nhưng map sang ngôn ngữ `vue`,
trong khi rule registry js/ts khai báo `languages: [js/ts]` → **không chạy** trên `.vue` (đã verify với
Semgrep 1.167.0: chỉ ~5 rule chạy, bỏ sót `eval`/`innerHTML` trong `<script>`). Tức là logic `.ts/.js`
được phủ đầy đủ, còn `<script>`/`<template>` trong `.vue` gần như **không** được packs phủ.

**Cách xử lý (đã áp dụng & nghiệm thu cho repo Vue 3):** thêm rules cục bộ dùng `languages: [generic]` +
`pattern-regex` (chạy trên text thô, bất kể ngôn ngữ), **scope `paths.include: ['*.vue']`** để không trùng
với packs đã phủ `.ts/.js`:
1. Tạo file `.github/semgrep/vue-security.yml` với các rule bắt sink XSS/code-injection trong `.vue`:
   `v-html` (template XSS), `.innerHTML =`, `eval(`, `document.write(`, `new Function(`.
   ```yaml
   rules:
     - id: vue-v-html-xss
       languages: [generic]
       severity: WARNING
       message: v-html renders raw HTML — XSS sink; sanitize (DOMPurify) or avoid.
       paths: { include: ['*.vue'] }
       pattern-regex: 'v-html\s*='
     # + vue-eval-usage (\beval\s*\(), vue-inner-html-assignment (\.innerHTML\s*=),
     #   vue-document-write (document\.write\s*\(), vue-new-function (\bnew\s+Function\s*\()
   ```
   > 💡 **Đặt rules trong `.github/semgrep/`** (không phải `.semgrep/` ở gốc): code này chỉ chạy trong
   > CI và do devops maintain → gom vào `.github` cho gọn, dev FE không phải bận tâm. **Lợi ích phụ:** nhiều
   > repo có `.gitignore` chứa `.*` (ignore mọi dot-dir) → `.semgrep/` ở gốc sẽ bị bỏ qua khi commit, làm CI
   > lỗi `--config`; đặt dưới `.github/` (thường đã được track) thì tránh hẳn vấn đề này.
2. Nối `.github/semgrep` vào `SAST_CONFIGS` (loop `--config` tự nạp mọi `.yml` trong thư mục):
   `SAST_CONFIGS: "p/javascript p/typescript p/nodejs p/owasp-top-ten .github/semgrep"`.
   > ⚠️ Chỉ thêm path này **khi thư mục tồn tại & được git track** — `--config <path>` trỏ vào path không có
   > (hoặc bị gitignore nên CI không checkout) sẽ làm semgrep lỗi → SAST FAILED. Dự án không phải Vue thì
   > **không** thêm (giữ template gốc Mục 10.B).
3. **(Khuyến nghị bổ sung, không thuộc tool)** XSS qua `v-html` nằm ở `<template>` — lớp chặn tốt nhất là
   ESLint: bật `eslint-plugin-vue` rule `vue/no-v-html` (preset `vue3-recommended`, không có trong `vue3-essential`).

### 7.C — Container (tầng 4): TỰ ĐỘNG (không cần thao tác tay)
Step container ở **Mục 10.B** đã **auto-detect** giống tầng 6 — **không** cần xoá/sửa tay:
- **0 Dockerfile** → `IMAGE_STATUS=skipped` (⏭️ N/A).
- **1 Dockerfile** → resolve `FROM` → `trivy image`.
- **≥2 Dockerfile** (monorepo) → loop từng Dockerfile, scan từng base image, **merge** JSON bằng `jq`
  (`jq` có sẵn trên runner mặc định `ubuntu-latest-large`); `BASE_IMAGE` = danh sách image (ngăn cách bởi dấu phẩy).

> **Giới hạn:** lấy `FROM` **đầu tiên** mỗi Dockerfile — với multi-stage build, base của stage cuối
> (runtime image thật) có thể bị bỏ sót. Nếu cần chính xác cho multi-stage: chỉnh để lấy `FROM` cuối.

Trạng thái `skipped` đã được formatter (**Mục 10.C**) render thành `⏭️ N/A` — không cần sửa gì thêm.

### 7.D — Formatter: trạng thái `skipped` (đã hỗ trợ sẵn)
Template formatter ở **Mục 10.C đã hỗ trợ sẵn** trạng thái `skipped` (hàm `skipped()`/`skipBlock()`
+ `statusIcon` map `skipped` → `⏭️ N/A`). **Không cần sửa gì** — chỉ cần workflow set
`echo "<LAYER>_STATUS=skipped" >> "$GITHUB_ENV"` (vd `IMAGE_STATUS=skipped` khi không có Dockerfile).

### 7.E — Firebase Security Rules (tầng 6, optional)
Bật khi dự án có `firestore.rules`/`storage.rules`/`*.rules`. Thêm script `scan-firebase-rules.mjs`
(**Mục 10.D**) vào `.github/scripts/`, và thêm step sau vào workflow (trước step "Build report"):
```yaml
      - name: 'Firebase Security Rules (heuristic)'
        run: |
          set +e
          if find . -name '*.rules' -not -path '*/node_modules/*' -print -quit | grep -q .; then
            node .github/scripts/scan-firebase-rules.mjs > rules.json
            [ $? -eq 0 ] && echo "RULES_STATUS=success" >> "$GITHUB_ENV" || echo "RULES_STATUS=failure" >> "$GITHUB_ENV"
          else
            echo "RULES_STATUS=skipped" >> "$GITHUB_ENV"
          fi
          exit 0
```
Formatter (**Mục 10.C**) đã có sẵn `renderRules()` + dòng status tầng 6 → **không cần sửa thêm**.
Bộ pattern + severity + URL: xem **Mục 10.D**.

> **Khuyến nghị GIỮ step này cho mọi dự án** — nó tự `skipped` (⏭️ N/A) khi không có `*.rules`.
> ⚠️ Nếu muốn **bỏ hẳn** tầng 6: phải xoá **cả** step này **lẫn** 2 dòng tầng 6 trong formatter
> (dòng `| 6. Firebase Security Rules ...` ở bảng status + dòng `renderRules(...)` ở mảng `sections`).
> Nếu chỉ xoá step mà quên formatter, tầng 6 sẽ hiện **⚠️ FAILED** (vì `RULES_STATUS` không được set).

---

## 8. Yêu cầu môi trường & quyền

- **GitHub Actions permission:** Repo/Org phải cho phép Actions **"Read and write permissions"**
  (Settings → Actions → General). Workflow đã khai `pull-requests: write`; nếu org ép read-only
  sẽ không đăng được comment.
- **Runner ra Internet:** tải binary Trivy/Gitleaks + checksums, Trivy DB, pull base image,
  rule Semgrep (registry), pip cài Semgrep.
- **Không cần secret** cho bản OSS (Trivy/Semgrep/Gitleaks CLI đều free). Tránh dùng
  `gitleaks-action` (yêu cầu license cho org) — dùng **Gitleaks CLI binary**. Tránh CodeQL
  trên repo **private** (cần GitHub Advanced Security, tốn phí) — dùng **Semgrep OSS**.
- **⚠️ Giới hạn đã biết — rate-limit (KHÔNG phải lỗi code):** `trivy fs`/`trivy image` kéo vuln DB từ
  **GHCR** và pull base image từ **Docker Hub** — đều có anonymous rate-limit theo IP runner.
  Runner mặc định `dena-fixed-ip` có **fixed IP** (không dùng chung pool IP với toàn bộ tenant
  GitHub-hosted) → giảm đáng kể rủi ro dính rate-limit chéo. Khi vẫn bị giới hạn → tầng 1/4 hiện
  **⚠️ FAILED** dù dự án không có vấn đề. Giảm thiểu: đã bật **cache Trivy DB** (Mục 10.B) + chạy lại
  PR; nếu hay dính → *(optional)* `docker login` Docker Hub bằng secret token trước `trivy image`
  để nâng hạn mức, và/hoặc set `TRIVY_DB_REPOSITORY` sang mirror.
- **Phụ thuộc Python (tầng 2 — Semgrep):** Semgrep cài qua `pip3` → cần `python3`/`pip3` trên runner.
  Runner mặc định `dena-fixed-ip` / `ubuntu-latest-large` **đã có sẵn nền tảng Python** → không cần
  setup thêm. Chỉ khi user đổi sang runner/image khác không có pip → thêm
  `- uses: actions/setup-python@<bản mới nhất>` trước step Semgrep.
- **Runner MẶC ĐỊNH của org:** template dùng runner group của org:
  ```yaml
  runs-on:
    group: dena-fixed-ip
    labels: ubuntu-latest-large
  ```
  Runner này **đã có sẵn quyền cần thiết + nền tảng Python (python3/pip3)** cho tool, có **fixed IP**,
  và là **x64** — khớp với asset binary trong template (`Linux-64bit` / `linux_x64`).
  **AI Agent PHẢI confirm lại với user tại thời điểm tạo tool xem có cần đổi runner cho dự án đích
  không** (mỗi dự án có thể dùng runner riêng). Nếu user chọn runner khác kiến trúc (vd ARM
  `ubuntu-24.04-arm`) → asset x64 **sai arch** → Trivy/Gitleaks ⚠️ FAILED; phải đổi tên asset sang
  arch tương ứng (vd `Linux-ARM64` / `linux_arm64`) hoặc detect động qua `uname -m`.

---

## 9. Nghiệm thu / Kiểm thử (AI Agent tự chạy trước khi báo cáo)

```bash
# 1) YAML hợp lệ — KHÔNG phụ thuộc js-yaml cài sẵn (đa số dự án dùng npm):
#    Primary (npm): npx tự tải js-yaml on-the-fly
npx --yes js-yaml .github/workflows/security-scan.yml > /dev/null && echo "YAML OK"
#    Tốt hơn nếu có: actionlint (validate cả ngữ nghĩa GitHub Actions)
command -v actionlint >/dev/null && actionlint .github/workflows/security-scan.yml
#    Fallback: nếu KHÔNG có công cụ nào (offline/không npx) → BỎ QUA bước này,
#    KHÔNG coi là fail (chỉ là không validate được, không phải YAML hỏng).

# 2) Cú pháp script Node
node --check .github/scripts/format-security-report.mjs
node --check .github/scripts/scan-firebase-rules.mjs   # nếu có tầng 6

# 3) Dry-run formatter với dữ liệu mẫu: tạo các file *.json giả lập rồi chạy
#    - findings (kiểm tra cap 15 + tổng số + ưu tiên CRITICAL)
#    - sạch (không banner)
#    - TRIVY_INSTALL=checksum-failed (kiểm tra banner đỏ + section ⚠️)
#    - IMAGE_STATUS=skipped (kiểm tra render "⏭️ N/A" cho tầng không áp dụng):
DEP_STATUS=success IMAGE_STATUS=skipped CONFIG_STATUS=success SECRET_STATUS=success \
  SEMGREP_STATUS=success RULES_STATUS=skipped \
  node .github/scripts/format-security-report.mjs   # tầng 4 & 6 phải hiện "⏭️ N/A"
```

**Checklist nghiệm thu:**
- [ ] **Runner: đã confirm với user** — mặc định dùng `group: dena-fixed-ip` + `labels: ubuntu-latest-large`
      (Mục 8); nếu user yêu cầu runner khác → kiểm tra lại arch asset (x64/ARM).
- [ ] Trigger đúng nhánh deploy của dự án (`on.pull_request.branches`).
- [ ] Các tầng áp dụng đều có step + set `*_STATUS`; tầng không áp dụng set `skipped` (⏭️ N/A).
- [ ] Nếu là dự án Firebase: tầng 6 bật + `scan-firebase-rules.mjs` đã copy; nếu không: tầng 6 `skipped` hoặc đã gỡ đúng cách (cả step lẫn formatter).
- [ ] Dry-run case `skipped` render đúng `⏭️ N/A` (không phải ⚠️ FAILED).
- [ ] SAST quét đúng **mọi** thư mục source của dự án + ruleset hợp với framework.
- [ ] Container: scan đúng / skip đúng / merge đúng theo số Dockerfile.
- [ ] Mọi scanner **pin version** + **verify checksum** (Trivy/Gitleaks).
- [ ] `timeout-minutes` + `permissions` tối thiểu + sticky comment `@v3`.
- [ ] Job luôn xanh (non-blocking); chỉ checksum-fail/tool-fail hiện ⚠️/🟥 trong comment.
- [ ] Bảng tổng hợp có **2 cột** `Status` + `Result` (Mục 5.1); dry-run kiểm: tầng có HIGH →
      `Result=🔴` (dù `Status=✅`), tầng chỉ MEDIUM/LOW → 🟡, tầng sạch → ✅, tool FAILED → `Result=—`.
- [ ] YAML + formatter pass kiểm thử local.
- [ ] **KHÔNG commit/push.**

---

## 10. Phụ lục

### 10.A — Lệnh verify version & checksum của scanner (chạy khi pin lại version)
```bash
# Lưu ý arch: tên asset phụ thuộc kiến trúc runner (x64: Linux-64bit/linux_x64; ARM: Linux-ARM64/linux_arm64).
# Trivy: phải có binary asset (KHÔNG chỉ source). Phải trả 200:
curl -sIL -o /dev/null -w "%{http_code}\n" \
  "https://github.com/aquasecurity/trivy/releases/download/v<VER>/trivy_<VER>_Linux-64bit.tar.gz"
# File checksum:
curl -sL "https://github.com/aquasecurity/trivy/releases/download/v<VER>/trivy_<VER>_checksums.txt" | grep Linux-64bit

# Gitleaks:
curl -sIL -o /dev/null -w "%{http_code}\n" \
  "https://github.com/gitleaks/gitleaks/releases/download/v<VER>/gitleaks_<VER>_linux_x64.tar.gz"

# Semgrep (PyPI): xem version mới nhất
curl -sL "https://pypi.org/pypi/semgrep/json" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>console.log(JSON.parse(s).info.version))"
```

### 10.B — Template workflow đầy đủ (canonical cho repo API — điểm xuất phát)

> Đánh dấu `# ADAPT[x]` tại các điểm cần chỉnh theo dự án. Phần không đánh dấu = giữ nguyên (nguyên tắc N1–N9).

```yaml
name: Security Scan

on:
  pull_request:
    branches: [develop, master]        # ADAPT[1]: nhánh deploy thực tế

permissions:
  contents: read
  pull-requests: write

concurrency:
  group: security-scan-${{ github.event.pull_request.number }}
  cancel-in-progress: true

env:
  TRIVY_VERSION: 0.71.1                 # ADAPT[2]: verify còn binary
  GITLEAKS_VERSION: 8.18.4
  SEMGREP_VERSION: 1.166.0
  SAST_PATHS: "src"                                                   # ADAPT[3]: dir source (FE/functions…)
  SAST_CONFIGS: "p/javascript p/typescript p/nodejs p/owasp-top-ten"  # ADAPT[4]: + p/react/p/nextjs (verify 200). KHÔNG có p/vue → Vue dùng .github/semgrep, xem Mục 7.B.1

jobs:
  scan:
    name: Scan & report
    # DEFAULT runner của org (xem Mục 8): fixed IP + sẵn python3/pip3, x64 (khớp asset Linux-64bit/linux_x64).
    # AI Agent PHẢI confirm lại với user xem dự án đích có cần dùng runner khác không trước khi sinh file.
    runs-on:
      group: dena-fixed-ip
      labels: ubuntu-latest-large
    timeout-minutes: 15
    steps:
      # ⚠️ ADAPT (xem N8): cập nhật node-version (Node LTS mới nhất) + version các action
      #     (checkout / setup-node / sticky-pull-request-comment) sang bản MỚI NHẤT tại thời điểm
      #     thực thi. Version dưới đây chỉ là mặc định lúc viết, có thể đã EOL khi bạn đọc.
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v6
        with:
          node-version: '24.2'

      # Cache Trivy vuln DB → giảm pull GHCR (giảm rủi ro rate-limit gây FAILED giả). Xem Mục 8.
      - name: Compute Trivy DB cache date
        run: echo "TRIVY_DB_DATE=$(date +%Y%m%d)" >> "$GITHUB_ENV"

      - name: Cache Trivy DB
        uses: actions/cache@v4
        with:
          path: ~/.cache/trivy
          key: trivy-db-${{ env.TRIVY_DB_DATE }} # 1 entry/ngày (trúng primary trong ngày, tránh phình cache)
          restore-keys: |
            trivy-db-

      - name: Install Trivy
        continue-on-error: true
        run: |
          set +e
          mkdir -p "$RUNNER_TEMP/bin"; cd "$RUNNER_TEMP"
          base="https://github.com/aquasecurity/trivy/releases/download/v${TRIVY_VERSION}"
          tarball="trivy_${TRIVY_VERSION}_Linux-64bit.tar.gz"
          if ! curl -sSfL -O "$base/$tarball" || ! curl -sSfL -O "$base/trivy_${TRIVY_VERSION}_checksums.txt"; then
            echo "TRIVY_INSTALL=download-failed" >> "$GITHUB_ENV"
            echo "::error title=Trivy download failed::could not download release artifacts"; exit 1
          fi
          if ! grep " ${tarball}\$" "trivy_${TRIVY_VERSION}_checksums.txt" | sha256sum -c -; then
            echo "TRIVY_INSTALL=checksum-failed" >> "$GITHUB_ENV"
            echo "::error title=Trivy checksum verification FAILED::${tarball} SHA256 mismatch"; exit 1
          fi
          tar -xzf "$tarball" -C "$RUNNER_TEMP/bin" trivy
          echo "$RUNNER_TEMP/bin" >> "$GITHUB_PATH"
          echo "TRIVY_INSTALL=ok" >> "$GITHUB_ENV"

      - name: Install Gitleaks
        continue-on-error: true
        run: |
          set +e
          mkdir -p "$RUNNER_TEMP/bin"; cd "$RUNNER_TEMP"
          base="https://github.com/gitleaks/gitleaks/releases/download/v${GITLEAKS_VERSION}"
          tarball="gitleaks_${GITLEAKS_VERSION}_linux_x64.tar.gz"
          if ! curl -sSfL -O "$base/$tarball" || ! curl -sSfL -O "$base/gitleaks_${GITLEAKS_VERSION}_checksums.txt"; then
            echo "GITLEAKS_INSTALL=download-failed" >> "$GITHUB_ENV"
            echo "::error title=Gitleaks download failed::could not download release artifacts"; exit 1
          fi
          if ! grep " ${tarball}\$" "gitleaks_${GITLEAKS_VERSION}_checksums.txt" | sha256sum -c -; then
            echo "GITLEAKS_INSTALL=checksum-failed" >> "$GITHUB_ENV"
            echo "::error title=Gitleaks checksum verification FAILED::${tarball} SHA256 mismatch"; exit 1
          fi
          tar -xzf "$tarball" -C "$RUNNER_TEMP/bin" gitleaks
          echo "$RUNNER_TEMP/bin" >> "$GITHUB_PATH"
          echo "GITLEAKS_INSTALL=ok" >> "$GITHUB_ENV"

      - name: 'Trivy: dependencies (package CVE — npm/yarn/pnpm)'
        run: |
          set +e
          trivy fs --scanners vuln --severity CRITICAL,HIGH,MEDIUM,LOW \
            --format json --output trivy-dep.json --exit-code 0 .
          [ $? -eq 0 ] && echo "DEP_STATUS=success" >> "$GITHUB_ENV" || echo "DEP_STATUS=failure" >> "$GITHUB_ENV"
          exit 0

      # Container OS CVE — AUTO-DETECT Dockerfile(s): 0 → skipped; ≥1 → scan từng base image + merge.
      # Không cần chỉnh tay (xem Mục 7.C). Giới hạn: lấy FROM đầu mỗi Dockerfile (multi-stage xem 7.C).
      - name: 'Trivy: container base image (OS CVE)'
        run: |
          set +e
          mapfile -t DFILES < <(find . -iname 'Dockerfile*' -not -path '*/node_modules/*')
          if [ ${#DFILES[@]} -eq 0 ]; then
            echo "IMAGE_STATUS=skipped" >> "$GITHUB_ENV"; exit 0
          fi
          echo '{"Results":[]}' > trivy-image.json; rc=0; imgs=""
          for df in "${DFILES[@]}"; do
            img=$(grep -m1 -E '^[Ff][Rr][Oo][Mm]' "$df" | awk '{print $2}')
            [ -z "$img" ] && continue
            imgs="${imgs:+$imgs, }$img"
            trivy image --scanners vuln --severity CRITICAL,HIGH,MEDIUM,LOW \
              --format json --output _img.json --exit-code 0 "$img" || rc=1
            jq -s '{Results: (.[0].Results + (.[1].Results // []))}' trivy-image.json _img.json > _m.json && mv _m.json trivy-image.json
          done
          echo "BASE_IMAGE=$imgs" >> "$GITHUB_ENV"
          [ $rc -eq 0 ] && echo "IMAGE_STATUS=success" >> "$GITHUB_ENV" || echo "IMAGE_STATUS=failure" >> "$GITHUB_ENV"
          exit 0

      - name: 'Trivy: Dockerfile/IaC misconfig'
        run: |
          set +e
          trivy config --severity HIGH,CRITICAL \
            --format json --output trivy-config.json --exit-code 0 .
          [ $? -eq 0 ] && echo "CONFIG_STATUS=success" >> "$GITHUB_ENV" || echo "CONFIG_STATUS=failure" >> "$GITHUB_ENV"
          exit 0

      - name: 'Gitleaks: secrets (full history)'
        run: |
          set +e
          gitleaks detect --source . --no-banner --redact \
            --report-format json --report-path gitleaks.json --exit-code 0
          [ $? -eq 0 ] && echo "SECRET_STATUS=success" >> "$GITHUB_ENV" || echo "SECRET_STATUS=failure" >> "$GITHUB_ENV"
          exit 0

      # ⚠️ Semgrep cài qua pip → phụ thuộc python3/pip3 (đã có sẵn trên runner mặc định
      #    dena-fixed-ip / ubuntu-latest-large). Nếu user đổi sang runner/image không có pip →
      #    step FAILED. Xem Mục 8 (nếu cần: thêm `- uses: actions/setup-python@<latest>`).
      - name: 'Semgrep: SAST'
        run: |
          set +e
          pip3 install --quiet "semgrep==${SEMGREP_VERSION}"
          configs=""; for c in $SAST_CONFIGS; do configs="$configs --config $c"; done   # ADAPT[4]
          semgrep scan $configs --json --output semgrep.json $SAST_PATHS                 # ADAPT[3]
          [ $? -le 1 ] && echo "SEMGREP_STATUS=success" >> "$GITHUB_ENV" || echo "SEMGREP_STATUS=failure" >> "$GITHUB_ENV"
          exit 0

      # ADAPT[6] — Layer 6 (optional Firebase). Tự skip khi không có *.rules.
      # Bỏ hẳn step này NẾU không phải dự án Firebase (xem Mục 7.E: phải gỡ cả dòng tầng 6 trong formatter).
      - name: 'Firebase Security Rules (heuristic)'
        run: |
          set +e
          if find . -name '*.rules' -not -path '*/node_modules/*' -print -quit | grep -q .; then
            node .github/scripts/scan-firebase-rules.mjs > rules.json
            [ $? -eq 0 ] && echo "RULES_STATUS=success" >> "$GITHUB_ENV" || echo "RULES_STATUS=failure" >> "$GITHUB_ENV"
          else
            echo "RULES_STATUS=skipped" >> "$GITHUB_ENV"
          fi
          exit 0

      - name: Build report
        env:
          GITHUB_SHA: ${{ github.event.pull_request.head.sha }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: node .github/scripts/format-security-report.mjs > report.md

      - name: Post report comment (sticky)
        uses: marocchino/sticky-pull-request-comment@v3
        with:
          header: security-scan
          path: report.md
```

> **Formatter:** dùng nguyên template ở **Mục 10.C** ngay dưới đây (không cần truy cập repo khác).

### 10.C — Template đầy đủ `format-security-report.mjs`

> Copy nguyên văn vào `.github/scripts/format-security-report.mjs`. Node thuần, không phụ thuộc.
> Project-agnostic — đã hỗ trợ sẵn trạng thái `skipped` (tầng không áp dụng), banner checksum đỏ,
> cap 15/section, ưu tiên CRITICAL, truncate 60k ký tự. **Thường không cần sửa gì.**

````js
// Formats security scan outputs (Trivy + Gitleaks + Semgrep) into a single
// concise Markdown report for posting as a PR comment. Plain Node (no deps).
//
// Reads, from the current working directory (missing/empty/corrupt tolerated):
//   - trivy-dep.json    : `trivy fs --scanners vuln`   (npm/package CVEs)
//   - trivy-image.json  : `trivy image`                (base image OS CVEs)
//   - trivy-config.json : `trivy config`               (Dockerfile/IaC misconfig)
//   - gitleaks.json     : `gitleaks detect`            (secrets, full git history)
//   - semgrep.json      : `semgrep scan --json`        (SAST)
//   - rules.json        : `scan-firebase-rules.mjs`    (Firebase rules — optional)
//
// Each scan step exports a `<TOOL>_STATUS` env (success|failure|skipped). A
// section is "clean" only when the tool ran successfully AND produced valid
// output; otherwise ⚠️ FAILED (never a false ✅). "skipped" => ⏭️ N/A (a layer
// that does not apply to this project, e.g. no Dockerfile -> no container scan).
//
// Only HIGH/CRITICAL are listed in detail; MEDIUM/LOW are summarized as counts.
// Output (stdout) is truncated to stay under GitHub's comment size limit.
import { readFileSync, existsSync } from 'node:fs';

const HIGH = new Set(['HIGH', 'CRITICAL']);
const MAX_PER_SECTION = 15; // cap findings listed per section (avoid comment size limit)
const GLOBAL_LIMIT = 60000; // GitHub comment hard limit is 65536 chars

function load(path) {
  try {
    if (!existsSync(path)) return null;
    const raw = readFileSync(path, 'utf8').trim();
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// A tool's output is trustworthy only if its step reported success AND a valid
// report was parsed. Distinguishes null (failure) from [] / empty (clean).
function toolOk(statusEnv, report) {
  return process.env[statusEnv] === 'success' && report !== null;
}

function statusIcon(statusEnv, report) {
  if (process.env[statusEnv] === 'skipped') return '⏭️ N/A';
  return toolOk(statusEnv, report) ? '✅' : '⚠️ FAILED';
}

// Result reflects the SEVERITY of what was found (orthogonal to whether the tool
// ran — that's `statusIcon`). Worst severity across the layer's findings wins:
//   🔴 = CRITICAL/HIGH (or Semgrep ERROR, or any leaked secret)
//   🟡 = MEDIUM/LOW (or Semgrep WARNING/INFO, or Firebase-rules WARNING)
//   ✅ = no issues found
//   ⏭️ = layer skipped (N/A);  — = tool failed, result unknown.
// `severities` is the list of severity strings parsed from this layer's findings.
function resultIcon(statusEnv, report, severities) {
  if (skipped(statusEnv)) return '⏭️';
  if (!toolOk(statusEnv, report)) return '—';
  const up = severities.map((s) => String(s || '').toUpperCase());
  if (up.some((s) => s === 'CRITICAL' || s === 'HIGH' || s === 'ERROR')) return '🔴';
  if (up.length > 0) return '🟡';
  return '✅';
}

function cap(arr, max = MAX_PER_SECTION) {
  return { shown: arr.slice(0, max), extra: Math.max(0, arr.length - max) };
}

// A layer can opt out (e.g. no Dockerfile -> container scan skipped).
function skipped(statusEnv) {
  return process.env[statusEnv] === 'skipped';
}

function skipBlock(heading) {
  return `### ${heading}\n⏭️ **N/A** — bỏ qua (không áp dụng cho dự án này).`;
}

function failBlock(heading, installStatus) {
  if (installStatus === 'checksum-failed') {
    return `### ${heading}\n🟥 **CHECKSUM VERIFICATION FAILED** — binary tải về không khớp SHA256, có thể bị tamper/hỏng. KHÔNG dùng kết quả. Xem Actions log.`;
  }
  return `### ${heading}\n⚠️ **Scan THẤT BẠI / không chạy được** — KHÔNG coi là sạch. Xem Actions log.`;
}

function moreLine(extra, what = 'finding') {
  return extra > 0 ? `\n_… và ${extra} ${what} khác — xem Actions log._` : '';
}

// ----- parsers -----
function trivyVulns(report) {
  const out = [];
  if (!report || !Array.isArray(report.Results)) return out;
  for (const r of report.Results) {
    const target = r.Target || '';
    for (const v of r.Vulnerabilities || []) {
      out.push({
        pkg: v.PkgName,
        target,
        id: v.VulnerabilityID,
        severity: v.Severity,
        installed: v.InstalledVersion,
        fixed: v.FixedVersion || 'no fix yet',
      });
    }
  }
  return out;
}

function trivyMisconfigs(report) {
  const out = [];
  if (!report || !Array.isArray(report.Results)) return out;
  for (const r of report.Results) {
    const target = r.Target || '';
    for (const m of r.Misconfigurations || []) {
      out.push({
        target,
        id: m.AVDID || m.ID,
        title: m.Title,
        severity: m.Severity,
        resolution: m.Resolution || '—',
      });
    }
  }
  return out;
}

function gitleaksFindings(report) {
  if (!Array.isArray(report)) return [];
  return report.map((f) => ({
    rule: f.RuleID,
    file: f.File,
    line: f.StartLine,
    commit: (f.Commit || '').slice(0, 7),
  }));
}

function semgrepFindings(report) {
  if (!report || !Array.isArray(report.results)) return [];
  return report.results.map((r) => ({
    path: r.path,
    line: r.start && r.start.line,
    rule: r.check_id,
    severity: (r.extra && r.extra.severity) || 'INFO',
  }));
}

// ----- renderers -----
function renderVuln(heading, statusEnv, report, installStatus) {
  if (skipped(statusEnv)) return skipBlock(heading);
  if (!toolOk(statusEnv, report)) return failBlock(heading, installStatus);

  const vulns = trivyVulns(report);
  const high = vulns.filter((v) => HIGH.has(v.severity));
  const lowCount = vulns.length - high.length;

  if (high.length === 0) {
    const low = lowCount ? `, ${lowCount} MEDIUM/LOW` : '';
    return `### ${heading}\n✅ Scan OK — 0 HIGH/CRITICAL vulnerabilities${low}.`;
  }

  // Total count is always reported, even though only the first N are listed.
  const nCrit = high.filter((v) => v.severity === 'CRITICAL').length;
  const nHigh = high.filter((v) => v.severity === 'HIGH').length;
  const vulnWord = high.length === 1 ? 'vulnerability' : 'vulnerabilities';
  const total = `${high.length} ${vulnWord} (${nCrit} CRITICAL, ${nHigh} HIGH)`;

  // Show CRITICAL before HIGH so the most severe survive the per-section cap.
  high.sort((a, b) => (a.severity === b.severity ? 0 : a.severity === 'CRITICAL' ? -1 : 1));

  const { shown, extra } = cap(high);
  const blocks = shown
    .map(
      (v) =>
        `${v.pkg} (${v.target})\n` +
        `├── ${v.id}   ${v.severity}\n` +
        `├── Installed: ${v.installed}\n` +
        `└── Fixed in: ${v.fixed}`,
    )
    .join('\n\n');

  let s = `### ${heading} — ✅ Scan OK, ${total}\n_Hiển thị ${shown.length}/${high.length} ${vulnWord}._\n\`\`\`\n${blocks}\n\`\`\``;
  s += moreLine(extra, 'vulnerabilities');
  if (lowCount) s += `\n_MEDIUM/LOW: ${lowCount} (ẩn)._`;
  return s;
}

function renderMisconfig(heading, statusEnv, report, installStatus) {
  if (skipped(statusEnv)) return skipBlock(heading);
  if (!toolOk(statusEnv, report)) return failBlock(heading, installStatus);

  const items = trivyMisconfigs(report).filter((m) => HIGH.has(m.severity));
  if (items.length === 0) return `### ${heading}\n✅ Scan OK — 0 HIGH/CRITICAL misconfig issues.`;

  const issueWord = items.length === 1 ? 'misconfig issue' : 'misconfig issues';

  const { shown, extra } = cap(items);
  const body = shown
    .map(
      (m) =>
        `${m.target} [${m.id}]  ${m.severity}\n` +
        `├── ${m.title}\n` +
        `└── Fix: ${m.resolution}`,
    )
    .join('\n\n');

  return `### ${heading} — ✅ Scan OK, ${items.length} ${issueWord}\n\`\`\`\n${body}\n\`\`\`${moreLine(extra, 'misconfig issues')}`;
}

function renderSecrets(heading, statusEnv, report, installStatus) {
  if (skipped(statusEnv)) return skipBlock(heading);
  if (!toolOk(statusEnv, report)) return failBlock(heading, installStatus);

  const findings = gitleaksFindings(report);
  if (findings.length === 0) return `### ${heading}\n✅ Scan OK — 0 secret.`;

  const { shown, extra } = cap(findings);
  const body = shown
    .map((x) => `${x.file}:${x.line}  [${x.rule}]  commit ${x.commit}`)
    .join('\n');
  // Secret value is intentionally NOT printed (would re-leak it).
  return `### ${heading} — ⚠️ ${findings.length} secret (cần ROTATE)\n\`\`\`\n${body}\n\`\`\`${moreLine(extra, 'secret')}`;
}

function renderSast(heading, statusEnv, report, installStatus) {
  if (skipped(statusEnv)) return skipBlock(heading);
  if (!toolOk(statusEnv, report)) return failBlock(heading, installStatus);

  const all = semgrepFindings(report).filter(
    (f) => f.severity === 'ERROR' || f.severity === 'WARNING',
  );
  if (all.length === 0) return `### ${heading}\n✅ Scan OK — 0 finding.`;

  const { shown, extra } = cap(all);
  const body = shown
    .map((f) => `${f.path}:${f.line}  [${f.rule}]  ${f.severity}`)
    .join('\n');
  return `### ${heading} — ✅ Scan OK, ${all.length} finding\n\`\`\`\n${body}\n\`\`\`${moreLine(extra)}`;
}

// Layer 6 (optional) — Firebase Security Rules heuristic (rules.json).
function renderRules(heading, statusEnv, report) {
  if (skipped(statusEnv)) return skipBlock(heading);
  if (process.env[statusEnv] !== 'success' || report === null) return failBlock(heading);

  const items = Array.isArray(report) ? report : [];
  if (items.length === 0) return `### ${heading}\n✅ Scan OK — 0 vấn đề rules.`;

  const order = { CRITICAL: 0, HIGH: 1, WARNING: 2 };
  items.sort((a, b) => (order[a.severity] ?? 9) - (order[b.severity] ?? 9));

  const { shown, extra } = cap(items);
  const body = shown
    .map(
      (x) =>
        `${x.file}:${x.line}  [${x.severity}] ${x.pattern}\n` +
        `└── Fix: ${x.recommendation}`,
    )
    .join('\n\n');
  return `### ${heading} — ⚠️ ${items.length} vấn đề\n\`\`\`\n${body}\n\`\`\`${moreLine(extra, 'vấn đề')}`;
}

// ----- assemble -----
const dep = load('trivy-dep.json');
const image = load('trivy-image.json');
const config = load('trivy-config.json');
const gitleaks = load('gitleaks.json');
const semgrep = load('semgrep.json');
const rules = load('rules.json');

const sha = (process.env.GITHUB_SHA || '').slice(0, 7);
const pr = process.env.PR_NUMBER || '';
const baseImage = process.env.BASE_IMAGE || 'base image';
const trivyInstall = process.env.TRIVY_INSTALL;
const gitleaksInstall = process.env.GITLEAKS_INSTALL;

// Per-layer severities feeding the Result column (worst severity wins). Reuse the
// same parsers the sections use, so Result always matches the detail below.
const depSeverities = trivyVulns(dep).map((v) => v.severity);
const sastSeverities = semgrepFindings(semgrep)
  .filter((f) => f.severity === 'ERROR' || f.severity === 'WARNING')
  .map((f) => f.severity);
const secretSeverities = gitleaksFindings(gitleaks).map(() => 'HIGH'); // any leaked secret = high
const imageSeverities = trivyVulns(image).map((v) => v.severity);
const configSeverities = trivyMisconfigs(config).map((m) => m.severity);
const rulesSeverities = (Array.isArray(rules) ? rules : []).map((r) => r.severity);

const summary = [
  '| Layer | Tool | Status | Result |',
  '|---|---|---|---|',
  `| 1. Dependencies (package CVE) | Trivy | ${statusIcon('DEP_STATUS', dep)} | ${resultIcon('DEP_STATUS', dep, depSeverities)} |`,
  `| 2. SAST | Semgrep | ${statusIcon('SEMGREP_STATUS', semgrep)} | ${resultIcon('SEMGREP_STATUS', semgrep, sastSeverities)} |`,
  `| 3. Secrets (git history) | Gitleaks | ${statusIcon('SECRET_STATUS', gitleaks)} | ${resultIcon('SECRET_STATUS', gitleaks, secretSeverities)} |`,
  `| 4. Container OS CVE | Trivy | ${statusIcon('IMAGE_STATUS', image)} | ${resultIcon('IMAGE_STATUS', image, imageSeverities)} |`,
  `| 5. Dockerfile/IaC misconfig | Trivy | ${statusIcon('CONFIG_STATUS', config)} | ${resultIcon('CONFIG_STATUS', config, configSeverities)} |`,
  `| 6. Firebase Security Rules | heuristic | ${statusIcon('RULES_STATUS', rules)} | ${resultIcon('RULES_STATUS', rules, rulesSeverities)} |`,
].join('\n');

const sections = [
  renderVuln('1️⃣ Dependencies — Package CVE (lockfiles: npm/yarn/pnpm)', 'DEP_STATUS', dep, trivyInstall),
  renderSast('2️⃣ SAST — Semgrep', 'SEMGREP_STATUS', semgrep, null),
  renderSecrets('3️⃣ Secrets — Gitleaks (full git history)', 'SECRET_STATUS', gitleaks, gitleaksInstall),
  renderVuln(`4️⃣ Container base \`${baseImage}\` — OS CVE`, 'IMAGE_STATUS', image, trivyInstall),
  renderMisconfig('5️⃣ Dockerfile/IaC — Misconfig', 'CONFIG_STATUS', config, trivyInstall),
  renderRules('6️⃣ Firebase Security Rules — heuristic', 'RULES_STATUS', rules),
];

const header = `## 🔒 Security Scan Report${pr ? ` — PR #${pr}` : ''}${sha ? ` (commit ${sha})` : ''}`;
const note = [
  '> ⚠️ Non-blocking: KHÔNG chặn merge.',
  '> **Status** = tool có chạy được không? ✅ đã chạy · ⚠️ FAILED (không quét được — KHÔNG phải "sạch") · ⏭️ N/A.',
  '> **Result** = mức độ nghiêm trọng của phát hiện: 🔴 CRITICAL/HIGH · 🟡 MEDIUM/LOW · ✅ không có · — chưa rõ (tool lỗi).',
].join('\n');

// Loud, top-level banner when a downloaded binary failed SHA256 verification.
const checksumFails = [];
if (trivyInstall === 'checksum-failed') checksumFails.push('Trivy');
if (gitleaksInstall === 'checksum-failed') checksumFails.push('Gitleaks');
const banner = checksumFails.length
  ? `> 🟥 **CHECKSUM FAILED**: ${checksumFails.join(', ')} — binary tải về KHÔNG khớp SHA256, có thể bị tamper/hỏng. Các lớp liên quan KHÔNG đáng tin.`
  : '';

const head = banner ? [header, note, banner] : [header, note];
let out = [...head, '', summary, '', ...sections.flatMap((s) => [s, ''])].join('\n');

if (out.length > GLOBAL_LIMIT) {
  out =
    out.slice(0, GLOBAL_LIMIT) +
    '\n\n_⚠️ Report bị cắt bớt do quá dài — xem đầy đủ ở Actions log._';
}

process.stdout.write(out);
````

---

### 10.D — Template đầy đủ `scan-firebase-rules.mjs` (tầng 6, optional)

> Copy nguyên văn vào `.github/scripts/scan-firebase-rules.mjs`. Node thuần, không phụ thuộc.
> Heuristic line-based — **không** thay thế review thủ công. ⚠️ **Chỉ bắt pattern trên 1 DÒNG**:
> rule viết đa dòng (vd `allow write: if` xuống dòng rồi `request.auth...`) có thể bị **bỏ sót** → vẫn
> cần review thủ công. Mỗi dòng tạo tối đa **1 finding** (pattern nghiêm trọng nhất — PATTERNS được
> sort theo severity giảm dần + `break`).

> ⚠️ **NOTE CHO AI AGENT:** Best practice của Firebase Security Rules thay đổi theo thời gian.
> **Tại thời điểm thực thi**, hãy mở các URL bên dưới, kiểm tra khuyến nghị MỚI NHẤT của GCP và
> **bổ sung/cập nhật** mảng `PATTERNS` trong script cho đúng trước khi chạy. Bảng dưới là điểm
> xuất phát, **không đầy đủ**.

**Bộ pattern phát hiện (severity + khuyến nghị theo GCP):**

| Pattern | Severity | Khuyến nghị (GCP) |
|---|---|---|
| `: if true` (mọi `allow … if true`) | 🔴 CRITICAL | Không dùng `if true` ở production — thêm điều kiện auth/ownership |
| `allow …;` thiếu `if` (không điều kiện) | 🔴 CRITICAL | Mọi `allow` phải kèm `if <condition>`; deny-by-default |
| Test-mode time-bomb: `request.time < timestamp.date(...)` | 🟠 HIGH | Thay rule test-mode bằng rule production có điều kiện thật |
| `match /{…=**}` wildcard đệ quy | 🟡 WARNING | Tránh phủ toàn bộ cây tài liệu; đảm bảo điều kiện đủ chặt |
| Ghi chỉ cần đăng nhập: `allow write: if request.auth != null` | 🟡 WARNING | Dùng ownership: `request.auth.uid == resource.data.ownerId` |

**URL tham chiếu — KIỂM TRA CẬP NHẬT tại thời điểm chạy:**
- Fix insecure rules — https://firebase.google.com/docs/rules/insecure-rules
- Rules basics — https://firebase.google.com/docs/rules/basics
- Conditions / best practice — https://firebase.google.com/docs/firestore/security/rules-conditions

````js
// Heuristic scanner for Firebase Security Rules (firestore.rules / storage.rules / *.rules).
// Flags well-known insecure patterns per Google's official guidance:
//   - Fix insecure rules:        https://firebase.google.com/docs/rules/insecure-rules
//   - Rules basics:              https://firebase.google.com/docs/rules/basics
//   - Conditions / best practice: https://firebase.google.com/docs/firestore/security/rules-conditions
//
// ⚠️ NOTE FOR AI AGENT: Firebase rules best practices evolve. AT EXECUTION TIME,
// re-check the URLs above and ADD/UPDATE the PATTERNS below to match the latest
// GCP-recommended rules before running. This list is a starting point, not exhaustive.
//
// Output: JSON array of { file, line, severity, pattern, recommendation } to stdout.
// Plain Node, no dependencies. Heuristic (line-based) — không thay thế review thủ công.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next']);

function findRuleFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = join(dir, name);
    let st;
    try {
      st = statSync(p);
    } catch {
      continue;
    }
    if (st.isDirectory()) out.push(...findRuleFiles(p));
    else if (name.endsWith('.rules')) out.push(p);
  }
  return out;
}

// severity: CRITICAL | HIGH | WARNING
const PATTERNS = [
  {
    re: /:\s*if\s+true\b/,
    severity: 'CRITICAL',
    pattern: 'allow ... : if true',
    rec: 'Không dùng "if true" ở production — thêm điều kiện auth/ownership.',
  },
  {
    re: /\ballow\b[^:;{}]*;\s*$/,
    severity: 'CRITICAL',
    pattern: 'allow không có điều kiện (thiếu "if")',
    rec: 'Mọi "allow" phải kèm "if <condition>"; mặc định deny-by-default.',
  },
  {
    re: /request\.time\s*<\s*timestamp\.date\s*\(/,
    severity: 'HIGH',
    pattern: 'rule test-mode hết hạn (time-bomb)',
    rec: 'Thay rule test-mode bằng rule production có điều kiện thật.',
  },
  {
    re: /match\s*\/\{[^}]*=\*\*\}/,
    severity: 'WARNING',
    pattern: 'match wildcard đệ quy /{...=**}',
    rec: 'Đảm bảo điều kiện đủ chặt; tránh phủ toàn bộ cây tài liệu.',
  },
  {
    re: /\ballow\s+(?:read\s*,\s*)?(?:write|create|update|delete)\s*:\s*if\s+request\.auth\s*!=\s*null\s*;?\s*$/,
    severity: 'WARNING',
    pattern: 'ghi chỉ cần đăng nhập (thiếu kiểm tra sở hữu)',
    rec: 'Dùng ownership: request.auth.uid == resource.data.ownerId (hoặc tương đương).',
  },
];

// Check most-severe patterns first so the single reported finding per line
// is the highest severity (CRITICAL > HIGH > WARNING).
const SEV_RANK = { CRITICAL: 0, HIGH: 1, WARNING: 2 };
PATTERNS.sort((a, b) => SEV_RANK[a.severity] - SEV_RANK[b.severity]);

const findings = [];
for (const file of findRuleFiles('.')) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const code = line.replace(/\/\/.*$/, ''); // strip line comments to reduce noise
    for (const p of PATTERNS) {
      if (p.re.test(code)) {
        findings.push({
          file,
          line: i + 1,
          severity: p.severity,
          pattern: p.pattern,
          recommendation: p.rec,
        });
        break; // one finding per line (most-severe pattern wins) — heuristic, single-line only
      }
    }
  });
}

process.stdout.write(JSON.stringify(findings));
````

---

## 11. Lịch sử quyết định thiết kế (vì sao làm vậy)

Để AI Agent không "phát minh lại" hoặc đi ngược các quyết định đã cân nhắc:

- **PR-time, không nằm trong deploy:** đảm bảo không làm chậm merge/deploy (deploy chạy ở `push`).
- **Chỉ scan base image, KHÔNG build app image (chiến lược A):** OS CVE đến từ base image;
  CVE app đã do tầng 1 (SCA) phủ → không cần `docker build` (nhanh, không tốn thời gian).
- **Semgrep OSS thay CodeQL:** repo private dùng CodeQL cần GitHub Advanced Security (phí).
- **Gitleaks CLI thay gitleaks-action:** action yêu cầu license cho org.
- **Non-blocking + ⚠️/🟥 thay vì fail PR:** theo yêu cầu nghiệp vụ (không chặn merge) nhưng
  vẫn hiển thị lỗi rõ ràng (status table, banner đỏ checksum, annotation `::error::`).
- **Verify checksum + pin version:** chống supply-chain (artifact bị thay) & build reproducible.
- **Cap 15/section + tổng số + truncate 60k:** tránh vượt limit comment GitHub (65.536 ký tự).
- **Tách 2 cột `Status` + `Result`:** cột `Status` chỉ cho biết tool *có chạy được không*, nên
  nếu chỉ có 1 cột thì tầng "đã quét xong nhưng có HIGH" vẫn hiện ✅ → gây hiểu nhầm là "sạch".
  Cột `Result` phản ánh **mức độ nghiêm trọng thực tế** (🔴/🟡/✅) lấy từ chính findings, trực giao
  với `Status`. Đây là tính năng bổ sung **tương thích ngược** (chỉ thêm cột, không đổi logic cũ).
```
