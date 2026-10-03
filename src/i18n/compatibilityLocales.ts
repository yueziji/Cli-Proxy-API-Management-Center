// Fork additions live outside the upstream locale JSON files to reduce merge conflicts.
export const compatibilityLocales = {
  'zh-CN': {
    modelBadge: '兼容',
    codexKeyCloakingLabel: 'Codex 身份伪装',
    codexKeyCloakingHint:
      '仅覆盖当前 API Key。关闭后停止强制写入官方身份头；模型级请求头覆盖仍可能生效。默认值继承 upstream.codex.disable-codex-cloaking。',
    codexKeyBufferingHint:
      '仅覆盖当前 API Key。缓冲初始事件以便过载时重试，会延迟响应头。默认值继承 upstream.codex.stream-bootstrap-buffering。',
    codexKeyDefault: '使用默认值',
    codexKeyOn: '开启',
    codexKeyOff: '关闭',
    bufferingLabel: '流式启动缓冲',
  },
  'zh-TW': {
    modelBadge: '相容',
    codexKeyCloakingLabel: 'Codex 身分偽裝',
    codexKeyCloakingHint:
      '僅覆寫目前的 API Key。關閉後停止強制寫入官方身分標頭；模型層級的標頭覆寫仍可能生效。預設值繼承 upstream.codex.disable-codex-cloaking。',
    codexKeyBufferingHint:
      '僅覆寫目前的 API Key。緩衝初始事件以便過載時重試，會延遲回應標頭。預設值繼承 upstream.codex.stream-bootstrap-buffering。',
    codexKeyDefault: '使用預設值',
    codexKeyOn: '開啟',
    codexKeyOff: '關閉',
    bufferingLabel: '串流啟動緩衝',
  },
  en: {
    modelBadge: 'Compat',
    codexKeyCloakingLabel: 'Codex identity cloaking',
    codexKeyCloakingHint:
      'Overrides only this API key. Off stops forcing official identity headers; model header overrides may still apply. Default inherits upstream.codex.disable-codex-cloaking.',
    codexKeyBufferingHint:
      'Overrides only this API key. Buffers initial events to allow overload retries and delays response headers. Default inherits upstream.codex.stream-bootstrap-buffering.',
    codexKeyDefault: 'Use default',
    codexKeyOn: 'On',
    codexKeyOff: 'Off',
    bufferingLabel: 'Stream bootstrap buffering',
  },
  ru: {
    modelBadge: 'Совместимость',
    codexKeyCloakingLabel: 'Маскировка под Codex',
    codexKeyCloakingHint:
      'Переопределение для этого API-ключа. Отключение отменяет принудительные заголовки Codex; переопределения модели могут сохраняться. По умолчанию наследуется upstream.codex.disable-codex-cloaking.',
    codexKeyBufferingHint:
      'Переопределение для этого API-ключа. Буферизация начальных событий позволяет повторить запрос при перегрузке, но задерживает заголовки ответа. По умолчанию наследуется upstream.codex.stream-bootstrap-buffering.',
    codexKeyDefault: 'По умолчанию',
    codexKeyOn: 'Включено',
    codexKeyOff: 'Выключено',
    bufferingLabel: 'Буферизация начала потока',
  },
} as const;
