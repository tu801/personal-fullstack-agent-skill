/**
 * Minimal YAML-ish front matter reader shared by the repo's doc linters (decisions index and
 * any future doc lint). Deliberately tiny: `key: value` lines, `[a, b]` flow lists, nested
 * `- item` lists, quoted strings, `#` comments. Anything richer belongs in a real YAML parser,
 * which these docs do not need.
 */

/** @returns {{ fm: Record<string, string | string[]>, body: string } | null} null when absent */
export function parseFrontMatter(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!match) return null;
  const fm = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    // Nested list items (`  - foo`) belong to the previous key; keep them as an array.
    const nested = /^\s+-\s+(.*)$/.exec(line);
    if (nested) {
      const lastKey = Object.keys(fm).at(-1);
      if (lastKey === undefined) continue;
      const current = fm[lastKey];
      fm[lastKey] = Array.isArray(current) ? [...current, nested[1].trim()] : [nested[1].trim()];
      continue;
    }
    const idx = line.indexOf(':');
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    const raw = line
      .slice(idx + 1)
      .trim()
      .replace(/\s+#.*$/, '');
    fm[key] =
      raw.startsWith('[') && raw.endsWith(']')
        ? raw
            .slice(1, -1)
            .split(',')
            .map((s) => s.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        : raw.replace(/^["']|["']$/g, '');
  }
  return { fm, body: text.slice(match[0].length) };
}
