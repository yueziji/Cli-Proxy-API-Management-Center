// Fork additions live outside the upstream locale JSON files to reduce merge conflicts.
export const compatibilityLocales = {
  'zh-CN': {
    modelLabel: '兼容模式（is-compat）',
    modelBadge: '兼容',
    modelHint:
      '为第三方接口启用思考内容与签名兼容处理，默认关闭。Codex OAuth 的多代理消息转换还需开启 oauth.providers.codex.optimize-multi-agent-v2。',
    codexTitle: 'Codex OAuth 请求行为',
    cloakingLabel: '禁用 Codex 身份伪装',
    cloakingHint:
      '停止在 HTTP/SSE 和 WebSocket 请求中强制覆盖为官方 Codex 的 User-Agent 和 Originator。默认关闭。',
    bufferingLabel: '流式启动缓冲',
    bufferingHint:
      '暂存初始握手事件，让流内过载错误仍可触发换凭据重试。响应头会延迟至开始生成内容，可能触发客户端或反向代理的读取超时。默认关闭。',
  },
  'zh-TW': {
    modelLabel: '相容模式（is-compat）',
    modelBadge: '相容',
    modelHint:
      '為第三方介面啟用思考內容與簽章相容處理，預設關閉。Codex OAuth 的多代理訊息轉換還需開啟 oauth.providers.codex.optimize-multi-agent-v2。',
    codexTitle: 'Codex OAuth 請求行為',
    cloakingLabel: '停用 Codex 身分偽裝',
    cloakingHint:
      '停止在 HTTP/SSE 與 WebSocket 請求中強制覆寫為官方 Codex 的 User-Agent 與 Originator。預設關閉。',
    bufferingLabel: '串流啟動緩衝',
    bufferingHint:
      '暫存初始交握事件，讓串流內過載錯誤仍可觸發更換憑證重試。回應標頭會延遲至開始產生內容，可能觸發用戶端或反向代理的讀取逾時。預設關閉。',
  },
  en: {
    modelLabel: 'Compatibility mode (is-compat)',
    modelBadge: 'Compat',
    modelHint:
      'Enable thinking and signature compatibility handling for third-party endpoints. Off by default. Codex OAuth multi-agent message conversion also requires oauth.providers.codex.optimize-multi-agent-v2.',
    codexTitle: 'Codex OAuth request behavior',
    cloakingLabel: 'Disable Codex identity cloaking',
    cloakingHint:
      'Stop forcing the official Codex User-Agent and Originator headers on HTTP/SSE and WebSocket requests. Off by default.',
    bufferingLabel: 'Stream bootstrap buffering',
    bufferingHint:
      'Buffer initial handshake events so overload errors inside the stream can still trigger a retry with another credential. Response headers wait until generation starts, which may trigger client or reverse-proxy read timeouts. Off by default.',
  },
  ru: {
    modelLabel: 'Режим совместимости (is-compat)',
    modelBadge: 'Совместимость',
    modelHint:
      'Включает совместимую обработку рассуждений и подписей для сторонних API. По умолчанию выключен. Для преобразования мультиагентных сообщений Codex OAuth также нужен oauth.providers.codex.optimize-multi-agent-v2.',
    codexTitle: 'Поведение запросов Codex OAuth',
    cloakingLabel: 'Отключить маскировку под Codex',
    cloakingHint:
      'Не заменять принудительно User-Agent и Originator на официальные заголовки Codex в запросах HTTP/SSE и WebSocket. По умолчанию выключено.',
    bufferingLabel: 'Буферизация начала потока',
    bufferingHint:
      'Буферизует начальные события, чтобы ошибка перегрузки внутри потока позволяла повторить запрос с другими учётными данными. Заголовки ответа задерживаются до начала генерации, что может вызвать тайм-аут чтения у клиента или обратного прокси. По умолчанию выключена.',
  },
} as const;
