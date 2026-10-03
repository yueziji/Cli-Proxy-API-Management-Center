import { isMap, isNode, isScalar, parseDocument } from 'yaml';
import type { Document } from 'yaml';

const OPTIONS = { indent: 2, lineWidth: 120, minContentWidth: 0 };

function sections(doc: Document, text: string) {
  const result = new Map<string, { start: number; end: number; text: string }>();
  if (!isMap(doc.contents) || doc.contents.flow) return result;
  for (const { key, value } of doc.contents.items) {
    if (!isScalar(key) || typeof key.value !== 'string' || !key.range || key.anchor || key.tag)
      continue;
    if (!isNode(value) || !value.range) continue;
    const start = key.range[0];
    // Only splice complete, unindented block entries. Nested/flow entries need
    // their surrounding indentation and punctuation to be serialized together.
    if (start > 0 && text[start - 1] !== '\n') continue;
    const end = value.range[2];
    result.set(key.value, { start, end, text: text.slice(start, end) });
  }
  return result;
}

/** Retain the original text of top-level sections the visual editor did not change. */
export function stringifyConfigYaml(doc: Document, source: string): string {
  const formatted = doc.toString(OPTIONS);
  const original = parseDocument(source);
  if (original.errors.length > 0) return formatted;
  const baseline = original.toString(OPTIONS);
  if (formatted === baseline) return source;

  const rawSections = sections(original, source);
  const beforeSections = sections(parseDocument(baseline), baseline);
  const afterSections = sections(parseDocument(formatted), formatted);
  let result = formatted;
  // Compare serialized nodes, including comments/anchors, rather than just
  // values. Restore from the current server document, never the stale draft.
  for (const [key, after] of [...afterSections].reverse()) {
    const raw = rawSections.get(key);
    if (!raw || beforeSections.get(key)?.text !== after.text) continue;
    const separator = !raw.text.endsWith('\n') && after.end < formatted.length ? '\n' : '';
    result = result.slice(0, after.start) + raw.text + separator + result.slice(after.end);
  }
  const eol = source.includes('\r\n') ? '\r\n' : '\n';
  return result.replace(/\r?\n/g, eol);
}
