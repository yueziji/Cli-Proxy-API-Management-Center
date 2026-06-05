/**
 * 验证工具函数
 */

/**
 * 验证 API Key 字符集（仅允许 ASCII 可见字符）
 */
export function isValidApiKeyCharset(key: string): boolean {
  if (!key) return false;
  return /^[\x21-\x7E]+$/.test(key);
}

/**
 * baseUrl 保存前校验结果。
 *
 * - `errorKey` 存在时表示硬错误，应阻止保存（i18n key，位于
 *   `providersPage.form.validation` 命名空间下）。
 * - `warningKeys` 为软提示（i18n key，位于同命名空间），不阻止保存。
 * - `normalized` 为规整后的值（裸域名补 https://、去掉末尾斜杠），调用方
 *   应在通过校验后用它写回表单 / 提交，使其与后端各 executor 的拼接行为对齐。
 */
export interface BaseUrlValidationResult {
  ok: boolean;
  normalized: string;
  errorKey?: string;
  warningKeys: string[];
}

/**
 * 末尾误填的上游端点路径片段。后端各 executor 会无条件再拼接一次
 * （如 claude 的 `%s/v1/messages`、openai 的 `+ /chat/completions`），
 * 用户若已经把这些写进 baseUrl 会导致路径重复 → 404，给软提示。
 */
const KNOWN_ENDPOINT_SUFFIXES = [
  '/v1/messages',
  '/chat/completions',
  '/responses',
  '/responses/compact',
  '/v1',
  '/v1beta',
];

/**
 * 校验并规整用户填写的 baseUrl。
 *
 * 设计依据（CLIProxyAPI 后端真实行为）：
 * - 后端保存时仅 `TrimSpace`，不补协议、不校验格式；裸域名会在请求阶段被
 *   Go 的 http.Client 以 `unsupported protocol scheme` 拒绝。→ 这里补 https://。
 * - claude / gemini 拼接 URL 时 **不去尾部斜杠**（`fmt.Sprintf("%s/v1/messages", base)`），
 *   末尾 `/` 会拼出 `//`；codex / openai 用 `TrimSuffix(base,"/")` 才安全。→ 这里统一去尾斜杠。
 * - 路径中间的连续 `//` 同样会被原样拼接且无人修复，几乎必坏。→ 硬拦截。
 */
export function validateBaseUrl(raw: string): BaseUrlValidationResult {
  const value = (raw ?? '').trim();

  // 允许为空：是否必填由调用方（descriptor.baseUrlRequired）决定。
  if (!value) {
    return { ok: true, normalized: '', warningKeys: [] };
  }

  // 内部空白（trim 后中间仍含空格 / 制表 / 换行）一定是误填，硬拦。
  if (/\s/.test(value)) {
    return { ok: false, normalized: value, errorKey: 'baseUrlHasWhitespace', warningKeys: [] };
  }

  // 裸域名（无 scheme）自动补 https://；已写 scheme 的保持原样。
  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(value);
  const candidate = hasScheme ? value : `https://${value}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    return { ok: false, normalized: value, errorKey: 'baseUrlInvalid', warningKeys: [] };
  }

  // 协议必须是 http / https（挡掉 ws:// ftp:// file:// 等）。
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return { ok: false, normalized: value, errorKey: 'baseUrlProtocol', warningKeys: [] };
  }

  // 必须有主机名（挡掉 https:///path 这类）。
  if (!url.hostname) {
    return { ok: false, normalized: value, errorKey: 'baseUrlNoHost', warningKeys: [] };
  }

  // 路径中间出现连续斜杠（new URL 会原样保留在 pathname），硬拦。
  if (/\/{2,}/.test(url.pathname)) {
    return { ok: false, normalized: value, errorKey: 'baseUrlDoubleSlash', warningKeys: [] };
  }

  // —— 通过硬校验，开始规整 —— //
  // 仅做用户已批准的两类静默规整：补协议（上面已做）、去掉末尾斜杠。
  // query / fragment 只警告、不改写，避免越权修改用户输入。
  const normalized = candidate.replace(/\/+$/g, '');

  const warningKeys: string[] = [];
  if (url.search) {
    warningKeys.push('baseUrlHasQuery');
  }
  if (url.hash) {
    warningKeys.push('baseUrlHasFragment');
  }

  const pathForSuffix = url.pathname.replace(/\/+$/g, '').toLowerCase();
  if (KNOWN_ENDPOINT_SUFFIXES.some((suffix) => pathForSuffix.endsWith(suffix))) {
    warningKeys.push('baseUrlEndpointSuffix');
  }

  return { ok: true, normalized, warningKeys };
}
