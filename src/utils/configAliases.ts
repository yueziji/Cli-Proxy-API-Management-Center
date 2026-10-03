import { isAlias, isMap, isNode, parseDocument, visit } from 'yaml';

// CLIProxyAPI v8.0.12 config_v8.go: canonical values win by presence, even null.
const sharedPaths = [
  'codex.disable-codex-cloaking',
  'codex.stream-bootstrap-buffering',
  'codex.stream-bootstrap-timeout',
  'codex.orphan-delegation-compatibility',
  'codex.model-level-cooling',
  'codex.response-steering',
  'claude.model-level-cooling',
  'claude.disable-claude-cloak-mode',
  ...[
    'user-agent',
    'package-version',
    'runtime-version',
    'os',
    'arch',
    'timeout',
    'timezone',
    'stabilize-device-profile',
  ].map((key) => `claude.header-defaults.${key}`),
  'xai.inject-x-search',
];

export const CONFIG_PATH_ALIASES: Readonly<Record<string, readonly string[]>> = {
  ...Object.fromEntries(
    sharedPaths.map((path) => [`upstream.${path}`, [`oauth.providers.${path}`]])
  ),
  'upstream.claude.disable-cloaking-model-list': [
    'oauth.providers.claude.claude-code.disable-cloaking-model-list',
  ],
  'client.codex.optimize-multi-agent-v2': [
    'oauth.providers.codex.optimize-multi-agent-v2',
    'providers.codex.optimize-multi-agent-v2',
    'codex.optimize-multi-agent-v2',
  ],
};

type Doc = ReturnType<typeof parseDocument>;

// Moving an anchor after its consumers (or pruning its parent) invalidates YAML.
// Snapshot only references to the affected nodes; leave unrelated anchors alone.
function preserveAliasReferences(doc: Doc, path: string[]) {
  const affected = new Set(
    path.map((_, index) => doc.getIn(path.slice(0, index + 1), true)).filter(isNode)
  );
  visit(doc, {
    Alias: (_key, node) => {
      const target = node.resolve(doc);
      if (!affected.has(node) && (!target || !affected.has(target))) return;
      const copy = doc.createNode(node.toJS(doc));
      copy.comment = node.comment;
      copy.commentBefore = node.commentBefore;
      copy.spaceBefore = node.spaceBefore;
      return copy;
    },
  });
}

export function deleteConfigPath(doc: Doc, path: string[]) {
  doc.deleteIn(path);
  for (let end = path.length - 1; end > 0; end--) {
    const parent = path.slice(0, end);
    const node = doc.getIn(parent, true);
    if (!isMap(node) || node.items.length) break;
    doc.deleteIn(parent);
  }
}

/** Move only requested fields; retain YAML nodes/comments and unrelated siblings. */
export function normalizeConfigAliases(doc: Doc, paths = Object.keys(CONFIG_PATH_ALIASES)) {
  for (const path of paths) {
    const canonical = path.split('.');
    for (const alias of CONFIG_PATH_ALIASES[path] ?? []) {
      const old = alias.split('.');
      if (!doc.hasIn(old)) continue;
      // A moved scalar may itself be an alias to another field.
      if (
        isAlias(doc.getIn(old, true)) ||
        old.some((_, index) => {
          const node = doc.getIn(old.slice(0, index + 1), true);
          return isNode(node) && 'anchor' in node && Boolean(node.anchor);
        })
      )
        preserveAliasReferences(doc, old);
      if (!doc.hasIn(canonical)) {
        for (let end = 1; end < canonical.length; end++) {
          const parent = canonical.slice(0, end);
          if (!isMap(doc.getIn(parent, true))) doc.setIn(parent, doc.createNode({}));
        }
        doc.setIn(canonical, doc.getIn(old, true));
      }
      deleteConfigPath(doc, old);
    }
  }
}
