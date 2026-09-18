---
name: <skill-name>            # kebab-case, ≤64 chars, MUST equal the folder name
description: <What this skill provides and WHEN to load it — one or two sentences, English, ≤1024 chars. This is the only part agents read at startup; make the trigger conditions explicit (task types, keywords, paths).>
---

# Skill: <Tên skill>

> Trạng thái: **DRAFT** · Version 0.1 · Ngày đổi trạng thái: YYYY-MM-DD
> Nạp cùng: `.agents/rules/00-core.md` + `<rule theo mục đích>`.
> Precedence: `AGENTS.md` §1 — rules repo thắng skill; skill repo tự viết thắng skill VENDORED.

## 0. Định vị & ranh giới
<!-- Skill này cung cấp gì (fact stack? phương pháp? domain?), KHÔNG cung cấp gì, trỏ sang skill nào cho phần còn lại. Mỗi fact chỉ sống ở một chỗ. -->

## 1. <Nội dung chính theo mục>
<!-- Checklist / convention / template / anti-patterns. Ngắn, có thể tick. Tách tài liệu dài sang references/<file>.md và trỏ tới khi cần. -->

## N. Facts đã kiểm chứng (cache — `00-core.md` §3.6)

| Fact | Nguồn (URL / doc version) | Ngày kiểm chứng | Hạn tin cậy |
|---|---|---|---|
| <vd: CLI X flag `--foo` có từ v2.3> | <official docs link> | YYYY-MM-DD | 6 tháng (API surface) · 3 tháng (pricing/limits) |

## Changelog
- 0.1 (YYYY-MM-DD): khởi tạo.
