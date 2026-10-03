import { isMap, isNode, isScalar, isSeq, parseDocument } from 'yaml';
import type { Document } from 'yaml';

const OPTIONS = { indent: 2, lineWidth: 120, minContentWidth: 0 };

function sections(doc: Document, text: string) {
  const result = new Map<string, { start: number; end: number; indent: number; text: string }>();
  function collect(node: unknown, path: (string | number)[]) {
    // A flow parent owns the commas/brackets around its entries. Only complete
    // entries inside block collections can be restored independently.
    if (isSeq(node) && !node.flow) {
      node.items.forEach((item, index) => collect(item, [...path, index]));
    } else if (isMap(node) && !node.flow) {
      for (const { key, value } of node.items) {
        if (!isScalar(key) || typeof key.value !== 'string' || !key.range || key.anchor || key.tag)
          continue;
        if (!isNode(value) || !value.range) continue;
        const childPath = [...path, key.value];
        const start = key.range[0];
        const prefix = text.slice(text.lastIndexOf('\n', start - 1) + 1, start);
        // The first mapping key of a block sequence item may follow "- ".
        if (/^(?: *- )* *$/.test(prefix)) {
          const end = value.range[2];
          result.set(JSON.stringify(childPath), {
            start,
            end,
            indent: prefix.length,
            text: text.slice(start, end),
          });
        }
        collect(value, childPath);
      }
    }
  }
  collect(doc.contents, []);
  return result;
}

/** Retain unchanged block entries, including siblings inside edited sections. */
export function stringifyConfigYaml(doc: Document, source: string): string {
  const formatted = doc.toString(OPTIONS);
  const original = parseDocument(source);
  if (original.errors.length > 0) return formatted;
  const baseline = original.toString(OPTIONS);
  if (formatted === baseline) return source;

  const rawSections = sections(original, source);
  const beforeSections = sections(parseDocument(baseline), baseline);
  const afterSections = sections(parseDocument(formatted), formatted);
  const replacements: { start: number; end: number; text: string }[] = [];
  let preservedEnd = -1;
  // Compare serialized nodes, including comments/anchors, rather than just
  // values. Restore from the current server document, never the stale draft.
  for (const [key, after] of afterSections) {
    if (after.start < preservedEnd) continue;
    const raw = rawSections.get(key);
    if (!raw || beforeSections.get(key)?.text !== after.text) continue;
    // The edited parent may use a different indent. Shift continuation lines
    // with their key so block scalars and nested collections retain their values.
    const delta = after.indent - raw.indent;
    const text = raw.text
      .split(/\r?\n/)
      .map((line, index) => {
        if (index === 0 || line.length === 0) return line;
        const indent = line.match(/^ */)?.[0].length ?? 0;
        return ' '.repeat(Math.max(0, indent + delta)) + line.slice(indent);
      })
      .join('\n');
    const separator = !text.endsWith('\n') && after.end < formatted.length ? '\n' : '';
    replacements.push({ start: after.start, end: after.end, text: text + separator });
    preservedEnd = after.end;
  }
  let result = formatted;
  for (const { start, end, text } of replacements.reverse()) {
    result = result.slice(0, start) + text + result.slice(end);
  }
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return result.replace(/\r?\n/g, eol);
}
