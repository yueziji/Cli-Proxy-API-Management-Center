// Keep provider-wide Codex fields together so upstream config changes need only small hooks.
export const CODEX_BEHAVIOR_FIELDS = [
  { valueKey: 'codexIdentityConfuse', yamlKey: 'identity-confuse' },
  { valueKey: 'codexDisableCloaking', yamlKey: 'disable-codex-cloaking' },
  { valueKey: 'codexStreamBootstrapBuffering', yamlKey: 'stream-bootstrap-buffering' },
] as const;

export type CodexBehaviorValues = Record<
  (typeof CODEX_BEHAVIOR_FIELDS)[number]['valueKey'],
  boolean
>;

export const readCodexBehavior = (raw: unknown): CodexBehaviorValues => {
  const record =
    raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return {
    codexIdentityConfuse: record['identity-confuse'] === true,
    codexDisableCloaking: record['disable-codex-cloaking'] === true,
    codexStreamBootstrapBuffering: record['stream-bootstrap-buffering'] === true,
  };
};
