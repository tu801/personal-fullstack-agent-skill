#!/usr/bin/env node
/**
 * Builds agents-doc/decisions/README.md (the decisions index) from the YAML front matter of every
 * decision file, or verifies it with `--check` (one file per decision, MADR 4.0.0 layout).
 *
 * File name: `NNNN-<id lower>-<slug>.md`. Front matter contract:
 *   id: AE1                        unique, [A-Z]{1,3}[0-9]{1,3}; must match the id in the file name
 *   status: proposed               proposed | accepted | rejected | deprecated | superseded by <ID>
 *   date: 2026-09-14               last updated (YYYY-MM-DD)
 *   decision-makers: [Product Owner]
 *   group: AE                      optional, informational
 *   phase: 1                       a phase number, or `cross`
 * The title is the first level-1 heading. Files starting with `_` and README.md are skipped.
 * `pnpm lint:docs` runs `--check`, so a hand-edited status without a regenerated index fails CI.
 *
 * Zero dependencies on purpose: any agent on any machine can run it with plain Node.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { parseFrontMatter as readFrontMatter } from './lib/frontMatter.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.resolve(here, '..', 'agents-doc', 'decisions');
const INDEX = path.join(DIR, 'README.md');
const STATUSES = ['proposed', 'accepted', 'rejected', 'deprecated'];
const FILE_RE = /^(\d{4})-([a-z]{1,3}\d{1,3})-[a-z0-9-]+\.md$/;
const ID_RE = /^[A-Z]{1,3}\d{1,3}$/;
const PHASE_RE = /^(\d{1,2}|cross)$/;

function loadDecisions() {
  const errors = [];
  const decisions = [];
  const seen = new Map();
  const files = readdirSync(DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && !f.startsWith('_'))
    .sort();
  for (const file of files) {
    const nameMatch = FILE_RE.exec(file);
    if (!nameMatch) {
      errors.push(`${file}: file name must match NNNN-<id>-<slug>.md`);
      continue;
    }
    let parsed;
    try {
      parsed = readFrontMatter(readFileSync(path.join(DIR, file), 'utf8'));
      if (!parsed) throw new Error(`${file}: missing front matter`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      continue;
    }
    const { fm, body } = parsed;
    const id = String(fm.id ?? '');
    const status = String(fm.status ?? '');
    const date = String(fm.date ?? '');
    const phase = String(fm.phase ?? '');
    const title = /^# (.+)$/m.exec(body)?.[1]?.trim() ?? '';
    if (!ID_RE.test(id)) errors.push(`${file}: id "${id}" invalid`);
    if (id.toLowerCase() !== nameMatch[2])
      errors.push(`${file}: file name id ≠ front matter id "${id}"`);
    if (seen.has(id)) errors.push(`${file}: duplicate id ${id} (also in ${seen.get(id)})`);
    seen.set(id, file);
    if (!STATUSES.includes(status) && !/^superseded by [A-Z]{1,3}\d{1,3}$/.test(status)) {
      errors.push(`${file}: status "${status}" invalid`);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
      errors.push(`${file}: date "${date}" must be YYYY-MM-DD`);
    if (!PHASE_RE.test(phase)) errors.push(`${file}: phase "${phase}" must be a number or "cross"`);
    if (!title) errors.push(`${file}: missing "# <title>" heading`);
    decisions.push({ file, seq: Number(nameMatch[1]), id, status, date, phase, title });
  }
  return { decisions, errors };
}

const bySeq = (a, b) => a.seq - b.seq;
const cell = (s) => s.replace(/\|/g, '\\|');
function shortTitle(title) {
  const clean = title.replace(/^[A-Z]{1,3}\d{1,3}\.\s*/, '');
  return clean.length > 110 ? `${clean.slice(0, 107).trimEnd()}…` : clean;
}
const link = (d) => `[${d.file}](./${d.file})`;
/** Numeric phases ascending, then `cross`. */
function phaseOrder(decisions) {
  const phases = [...new Set(decisions.map((d) => d.phase))];
  return phases.sort((a, b) => {
    if (a === 'cross') return 1;
    if (b === 'cross') return -1;
    return Number(a) - Number(b);
  });
}

function render(decisions) {
  const open = decisions.filter((d) => d.status === 'proposed').sort(bySeq);
  const closed = decisions.filter((d) => d.status !== 'proposed');
  const count = (s) => decisions.filter((d) => d.status === s).length;
  const lines = [
    '# Decisions — Index (sinh tự động, KHÔNG sửa tay)',
    '',
    '> Sinh bởi `pnpm decisions:index` từ frontmatter của các file trong thư mục này; `pnpm lint:docs` chạy bản `--check` và đỏ khi index lệch. Một file = một quyết định theo MADR 4.0.0. **Quyết định mới:** copy `_template.md` → `NNNN-<id>-<slug>.md` (`status: proposed`) → chạy lại lệnh sinh; NNNN chỉ để sắp thứ tự, ID mới là danh tính (trùng NNNN giữa hai phiên song song không sao). **PO chốt:** agent đổi `status` + `date` trong đúng file đó rồi sinh lại index.',
    '>',
    "> **Khi nào chạy `pnpm decisions:index`:** ngay sau khi (1) tạo file quyết định mới, (2) đổi `status` / `date` / tiêu đề của một file — do chính agent vừa sửa chạy, trong cùng lượt. Quên → `pnpm lint:docs` (local, và CI khi mở PR) đỏ với thông báo rõ; không có lỗi im lặng. Index chỉ là **bản nhìn** cho người đọc, không phải chỉ mục tra cứu: tìm kiếm đi thẳng vào frontmatter và không phụ thuộc file này — danh sách đang mở luôn đúng bằng `grep -l '^status: proposed' agents-doc/decisions/[0-9]*.md`.",
    '>',
    `> Tổng ${decisions.length} · đang mở ${open.length} · accepted ${count('accepted')} · rejected ${count('rejected')} · deprecated ${count('deprecated')} · superseded ${decisions.filter((d) => d.status.startsWith('superseded')).length}`,
    '',
    `## Đang mở (proposed) — ${open.length} mục`,
    '',
    '| ID | Tiêu đề | Phase | Ngày | File |',
    '|---|---|---|---|---|',
    ...open.map(
      (d) => `| ${d.id} | ${cell(shortTitle(d.title))} | ${d.phase} | ${d.date} | ${link(d)} |`,
    ),
    '',
    '## Đã chốt / đã loại — theo phase',
  ];
  for (const phase of phaseOrder(closed)) {
    const rows = closed.filter((d) => d.phase === phase).sort(bySeq);
    lines.push(
      '',
      `### ${phase === 'cross' ? 'Xuyên phase (cross)' : `Phase ${phase}`} — ${rows.length} mục`,
      '',
      '| ID | Tiêu đề | Trạng thái | Ngày | File |',
      '|---|---|---|---|---|',
      ...rows.map(
        (d) => `| ${d.id} | ${cell(shortTitle(d.title))} | ${d.status} | ${d.date} | ${link(d)} |`,
      ),
    );
  }
  return `${lines.join('\n')}\n`;
}

const check = process.argv.includes('--check');
const { decisions, errors } = loadDecisions();
if (errors.length > 0) {
  console.error(`decisions-index: ${errors.length} error(s)\n - ${errors.join('\n - ')}`);
  process.exit(1);
}
const output = render(decisions);
const openCount = decisions.filter((d) => d.status === 'proposed').length;
if (check) {
  let current = '';
  try {
    current = readFileSync(INDEX, 'utf8');
  } catch {
    // A missing index is drift too; the comparison below reports it.
  }
  if (current !== output) {
    console.error(
      'decisions-index: agents-doc/decisions/README.md is stale — run `pnpm decisions:index` and commit the result.',
    );
    process.exit(1);
  }
  console.log(`decisions-index: OK (${decisions.length} decisions, ${openCount} open)`);
} else {
  writeFileSync(INDEX, output);
  console.log(
    `decisions-index: wrote ${path.relative(process.cwd(), INDEX)} (${decisions.length} decisions, ${openCount} open)`,
  );
}
