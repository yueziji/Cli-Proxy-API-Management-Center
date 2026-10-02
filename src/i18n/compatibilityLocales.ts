// Fork additions live outside the upstream locale JSON files to reduce merge conflicts.
export const compatibilityLocales = {
  'zh-CN': {
    modelBadge: '兼容',
    codexKeyCloakingLabel: 'Codex 身份伪装',
    codexKeyCloakingHint:
      '仅作用于当前 API Key。关闭后停止强制写入官方身份头；模型级请求头覆盖仍可能生效。默认值不继承 OAuth 设置。',
    codexKeyBufferingHint:
      '仅作用于当前 API Key，需要后端支持凭据级流式启动缓冲。缓冲初始事件以便过载时重试，会延迟响应头。默认值不继承 OAuth 设置。',
    codexKeyDefault: '使用默认值',
    codexKeyOn: '开启',
    codexKeyOff: '关闭',
    bufferingLabel: '流式启动缓冲',
  },
  'zh-TW': {
    modelBadge: '相容',
    codexKeyCloakingLabel: 'Codex 身分偽裝',
    codexKeyCloakingHint:
      '僅作用於目前的 API Key。關閉後停止強制寫入官方身分標頭；模型層級的標頭覆寫仍可能生效。預設值不繼承 OAuth 設定。',
    codexKeyBufferingHint:
      '僅作用於目前的 API Key，需要後端支援憑證層級的串流啟動緩衝。緩衝初始事件以便過載時重試，會延遲回應標頭。預設值不繼承 OAuth 設定。',
    codexKeyDefault: '使用預設值',
    codexKeyOn: '開啟',
    codexKeyOff: '關閉',
    bufferingLabel: '串流啟動緩衝',
  },
  en: {
    modelBadge: 'Compat',
    codexKeyCloakingLabel: 'Codex identity cloaking',
    codexKeyCloakingHint:
      'Applies only to this API key. Off stops forcing official identity headers; model header overrides may still apply. Defaults do not inherit OAuth settings.',
    codexKeyBufferingHint:
      'Applies only to this API key and requires backend support for per-key bootstrap buffering. Buffers initial events to allow overload retries and delays response headers. Defaults do not inherit OAuth settings.',
    codexKeyDefault: 'Use default',
    codexKeyOn: 'On',
    codexKeyOff: 'Off',
    bufferingLabel: 'Stream bootstrap buffering',
  },
  ru: {
    modelBadge: 'Совместимость',
    codexKeyCloakingLabel: 'Маскировка под Codex',
    codexKeyCloakingHint:
      'Только для этого API-ключа. Отключение отменяет принудительные заголовки Codex; переопределения модели могут сохраняться. Значения по умолчанию не наследуют настройки OAuth.',
    codexKeyBufferingHint:
      'Только для этого API-ключа; требуется поддержка буферизации для отдельных ключей на сервере. Буферизация начальных событий позволяет повторить запрос при перегрузке, но задерживает заголовки ответа. Настройки OAuth не наследуются.',
    codexKeyDefault: 'По умолчанию',
    codexKeyOn: 'Включено',
    codexKeyOff: 'Выключено',
    bufferingLabel: 'Буферизация начала потока',
  },
} as const;
