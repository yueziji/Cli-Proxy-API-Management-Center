export const configProviderLocales = {
  'zh-CN': {
    additions: {
      clientToolsTitle: '客户端与工具',
      codexEnableApplyPatch: {
        label: '扩展 apply_patch 支持',
        hint: '默认关闭：仍保留模型原生声明的 freeform apply_patch 能力。开启后，所有路由执行器均支持的非模板及桥接模型也会声明 freeform 能力。',
      },
      codexWebSearchResultCacheEnabled: {
        label: '缓存 Codex 搜索结果',
        hint: '缓存并补回 Codex 客户端在后续请求历史中遗漏的网页搜索结果。默认关闭。',
      },
      codexWebSearchResultCacheTTL: {
        label: '搜索结果缓存有效期',
        hint: '支持 30m、24h 或整数秒。留空或设为 0 使用默认的 24 小时，不能为负数。',
      },
      codexWebSearchResultCacheLimit: {
        label: '搜索结果缓存容量',
        hint: '最多保留的缓存条目数。留空或设为 0 使用默认的 1024 条，不能为负数。',
      },
      routingSessionAffinityRebindOn: {
        label: '会话换号策略',
        hint: '仅在启用会话亲和性时生效。any：凭据错误时换号；quota：瞬时错误仅为本次请求切换，配额或认证错误重新绑定；never：保持原凭据并返回错误或在原凭据上重试。',
        options: {
          default: '后端默认（any）',
          any: '凭据错误时换号',
          quota: '配额或认证错误时换号',
          never: '保持原凭据',
        },
      },
      claudeToolSearch: {
        label: 'Claude 工具搜索',
        hint: '为路由到 Claude 的 Codex Responses 请求启用工具搜索。支持的凭据使用 Anthropic 原生工具搜索，其余采用兼容转换。默认关闭。',
      },
      streamingSendKeepAliveBeforeFT: {
        label: '首 token 前发送心跳',
        hint: '在首 token 到达前发送 SSE 心跳。仅在心跳间隔大于 0 时生效，默认关闭。',
      },
    },
    validation: {
      invalid_session_affinity_rebind: '请选择 any、quota、never，或使用后端默认值。',
    },
  },
  'zh-TW': {
    additions: {
      clientToolsTitle: '用戶端與工具',
      codexEnableApplyPatch: {
        label: '擴充 apply_patch 支援',
        hint: '預設關閉：仍保留模型原生宣告的 freeform apply_patch 能力。開啟後，所有路由執行器均支援的非範本及橋接模型也會宣告 freeform 能力。',
      },
      codexWebSearchResultCacheEnabled: {
        label: '快取 Codex 搜尋結果',
        hint: '快取並補回 Codex 用戶端在後續請求歷史中遺漏的網頁搜尋結果。預設關閉。',
      },
      codexWebSearchResultCacheTTL: {
        label: '搜尋結果快取有效期',
        hint: '支援 30m、24h 或整數秒。留空或設為 0 使用預設的 24 小時，不得為負數。',
      },
      codexWebSearchResultCacheLimit: {
        label: '搜尋結果快取容量',
        hint: '最多保留的快取項目數。留空或設為 0 使用預設的 1024 筆，不得為負數。',
      },
      routingSessionAffinityRebindOn: {
        label: '工作階段換號策略',
        hint: '僅在啟用工作階段親和性時生效。any：憑證錯誤時換號；quota：暫時錯誤僅為本次請求切換，配額或驗證錯誤重新綁定；never：保持原憑證並回傳錯誤或在原憑證上重試。',
        options: {
          default: '後端預設（any）',
          any: '憑證錯誤時換號',
          quota: '配額或驗證錯誤時換號',
          never: '保持原憑證',
        },
      },
      claudeToolSearch: {
        label: 'Claude 工具搜尋',
        hint: '為路由至 Claude 的 Codex Responses 請求啟用工具搜尋。支援的憑證使用 Anthropic 原生工具搜尋，其餘採用相容轉換。預設關閉。',
      },
      streamingSendKeepAliveBeforeFT: {
        label: '首個 token 前傳送心跳',
        hint: '在首個 token 到達前傳送 SSE 心跳。僅在心跳間隔大於 0 時生效，預設關閉。',
      },
    },
    validation: {
      invalid_session_affinity_rebind: '請選擇 any、quota、never，或使用後端預設值。',
    },
  },
  en: {
    additions: {
      clientToolsTitle: 'Client and tools',
      codexEnableApplyPatch: {
        label: 'Extend apply_patch support',
        hint: 'Default off: models with native freeform apply_patch support still advertise it. When enabled, eligible non-template and bridged models also advertise freeform if every routing executor supports it.',
      },
      codexWebSearchResultCacheEnabled: {
        label: 'Cache Codex search results',
        hint: 'Cache and restore web search results omitted from later Codex client request history. Default off.',
      },
      codexWebSearchResultCacheTTL: {
        label: 'Search result cache lifetime',
        hint: 'Accepts durations such as 30m or 24h, or integer seconds. Blank or 0 uses the default 24 hours. Must not be negative.',
      },
      codexWebSearchResultCacheLimit: {
        label: 'Search result cache capacity',
        hint: 'Maximum retained entries. Blank or 0 uses the default 1024 entries. Must not be negative.',
      },
      routingSessionAffinityRebindOn: {
        label: 'Session credential failover',
        hint: 'Requires session affinity. any: rebind on credential errors; quota: preserve the binding for transient errors and rebind on quota or auth errors; never: keep the credential and return the error or retry it.',
        options: {
          default: 'Backend default (any)',
          any: 'Rebind on credential errors',
          quota: 'Rebind on quota or auth errors',
          never: 'Keep the original credential',
        },
      },
      claudeToolSearch: {
        label: 'Claude tool search',
        hint: 'Enable tool search for Codex Responses requests routed to Claude. Supported credentials use Anthropic native tool search; other routes use a compatible translation. Default off.',
      },
      streamingSendKeepAliveBeforeFT: {
        label: 'Send heartbeats before the first token',
        hint: 'Send SSE heartbeats before the first token arrives. Requires a heartbeat interval greater than 0. Default off.',
      },
    },
    validation: {
      invalid_session_affinity_rebind: 'Choose any, quota, never, or the backend default.',
    },
  },
  ru: {
    additions: {
      clientToolsTitle: 'Клиент и инструменты',
      codexEnableApplyPatch: {
        label: 'Расширить поддержку apply_patch',
        hint: 'По умолчанию выключено: модели с нативной поддержкой freeform apply_patch сохраняют её. При включении подходящие модели без шаблона и модели с преобразованием протокола также объявляют freeform, если его поддерживают все исполнители маршрута.',
      },
      codexWebSearchResultCacheEnabled: {
        label: 'Кэшировать результаты поиска Codex',
        hint: 'Кэшировать и восстанавливать результаты веб-поиска, пропущенные в истории последующих запросов клиента Codex. По умолчанию выключено.',
      },
      codexWebSearchResultCacheTTL: {
        label: 'Срок хранения результатов поиска',
        hint: 'Длительность, например 30m или 24h, либо целое число секунд. Пустое поле или 0: 24 часа. Отрицательные значения запрещены.',
      },
      codexWebSearchResultCacheLimit: {
        label: 'Ёмкость кэша результатов поиска',
        hint: 'Максимальное число записей. Пустое поле или 0: 1024 записи. Отрицательные значения запрещены.',
      },
      routingSessionAffinityRebindOn: {
        label: 'Смена учётных данных сессии',
        hint: 'Требует привязки сессии. any: смена при ошибках учётных данных; quota: временные ошибки сохраняют привязку, ошибки квоты или авторизации меняют её; never: сохранить учётные данные и вернуть ошибку или повторить запрос.',
        options: {
          default: 'По умолчанию (any)',
          any: 'При ошибках учётных данных',
          quota: 'При ошибках квоты или авторизации',
          never: 'Сохранить исходные учётные данные',
        },
      },
      claudeToolSearch: {
        label: 'Поиск инструментов Claude',
        hint: 'Включить поиск инструментов для запросов Codex Responses к Claude. Поддерживаемые учётные данные используют нативный поиск Anthropic, остальные — совместимое преобразование. По умолчанию выключено.',
      },
      streamingSendKeepAliveBeforeFT: {
        label: 'Отправлять heartbeat до первого токена',
        hint: 'Отправлять SSE heartbeat до первого токена. Требуется интервал heartbeat больше 0. По умолчанию выключено.',
      },
    },
    validation: {
      invalid_session_affinity_rebind: 'Выберите any, quota, never или значение по умолчанию.',
    },
  },
} as const;
