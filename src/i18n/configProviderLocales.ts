export const configProviderLocales = {
  'zh-CN': {
    additions: {
      upstreamTitle: '共享上游行为',
      upstreamHint: '适用于 OAuth 和 API Key 凭据的默认设置，凭据自身的显式覆盖优先。',
      clientTitle: '客户端兼容',
      clientHint: 'Codex 客户端设置跨提供商生效，适用于 OAuth 和 API Key 路由。',
      codexEnableApplyPatch: {
        label: '扩展 apply_patch 支持',
        hint: '默认关闭：仍保留模型原生声明的 freeform apply_patch 能力。开启后，所有路由执行器均支持的非模板及桥接模型也会声明 freeform 能力。',
      },
      codexOptimizeMultiAgentV2: {
        hint: '优化跨提供商的 Codex 客户端多代理请求：更新 spawn_agent 模型信息、移除消息参数加密、规范化 agent_message，并为非 Codex 协议转换为用户消息。默认关闭，适用于 OAuth 和 API Key 路由。',
      },
      claudeDisableCloakMode: {
        hint: '禁用 Claude Code CLI 身份伪装和系统提示词替换，原样传递系统提示词。凭据的 cloak_mode 或 API Key 的 cloak.mode 显式设置优先。默认关闭，仅对非 Claude Code 客户端自动伪装。',
      },
    },
    headers: {
      description:
        'Claude 指纹默认值适用于 OAuth 和 API Key；Codex 默认请求头仅适用于 OAuth 凭据。',
      claude_title: 'Claude 共享指纹默认值',
    },
  },
  'zh-TW': {
    additions: {
      upstreamTitle: '共用上游行為',
      upstreamHint: '適用於 OAuth 與 API Key 憑證的預設設定，憑證本身的明確覆寫優先。',
      clientTitle: '用戶端相容性',
      clientHint: 'Codex 用戶端設定跨提供商生效，適用於 OAuth 與 API Key 路由。',
      codexEnableApplyPatch: {
        label: '擴充 apply_patch 支援',
        hint: '預設關閉：仍保留模型原生宣告的 freeform apply_patch 能力。開啟後，所有路由執行器均支援的非範本及橋接模型也會宣告 freeform 能力。',
      },
      codexOptimizeMultiAgentV2: {
        hint: '最佳化跨提供商的 Codex 用戶端多代理請求：更新 spawn_agent 模型資訊、移除訊息參數加密、正規化 agent_message，並為非 Codex 協定轉換為使用者訊息。預設關閉，適用於 OAuth 與 API Key 路由。',
      },
      claudeDisableCloakMode: {
        hint: '停用 Claude Code CLI 身分偽裝與系統提示詞替換，原樣傳遞系統提示詞。憑證的 cloak_mode 或 API Key 的 cloak.mode 明確設定優先。預設關閉，僅對非 Claude Code 用戶端自動偽裝。',
      },
    },
    headers: {
      description:
        'Claude 指紋預設值適用於 OAuth 與 API Key；Codex 預設請求標頭僅適用於 OAuth 憑證。',
      claude_title: 'Claude 共用指紋預設值',
    },
  },
  en: {
    additions: {
      upstreamTitle: 'Shared upstream behavior',
      upstreamHint:
        'Defaults for OAuth and API-key credentials. Explicit credential overrides take priority.',
      clientTitle: 'Client compatibility',
      clientHint:
        'Codex client settings apply across providers and to both OAuth and API-key routes.',
      codexEnableApplyPatch: {
        label: 'Extend apply_patch support',
        hint: 'Default off: models with native freeform apply_patch support still advertise it. When enabled, eligible non-template and bridged models also advertise freeform if every routing executor supports it.',
      },
      codexOptimizeMultiAgentV2: {
        hint: 'Optimize Codex client multi-agent requests across providers: update spawn_agent model details, remove message parameter encryption, normalize agent_message, and convert it to user messages for non-Codex protocols. Default off; applies to OAuth and API-key routes.',
      },
      claudeDisableCloakMode: {
        hint: 'Disable the Claude Code CLI disguise and system prompt replacement. Explicit credential cloak_mode or API-key cloak.mode settings take priority. Default off: automatically cloak non-Claude-Code clients.',
      },
    },
    headers: {
      description:
        'Claude fingerprint defaults apply to OAuth and API keys; Codex header defaults apply only to OAuth credentials.',
      claude_title: 'Claude shared fingerprint defaults',
    },
  },
  ru: {
    additions: {
      upstreamTitle: 'Общие настройки провайдеров',
      upstreamHint:
        'Значения по умолчанию для OAuth и API-ключей. Явные настройки отдельных учётных данных имеют приоритет.',
      clientTitle: 'Совместимость клиентов',
      clientHint:
        'Настройки клиентов Codex действуют для всех провайдеров и маршрутов с OAuth и API-ключами.',
      codexEnableApplyPatch: {
        label: 'Расширить поддержку apply_patch',
        hint: 'По умолчанию выключено: модели с нативной поддержкой freeform apply_patch сохраняют её. При включении подходящие модели без шаблона и модели с преобразованием протокола также объявляют freeform, если его поддерживают все исполнители маршрута.',
      },
      codexOptimizeMultiAgentV2: {
        hint: 'Оптимизировать запросы клиентов Codex с несколькими агентами у всех провайдеров: обновить сведения spawn_agent, убрать шифрование параметров, нормализовать agent_message и преобразовать его в сообщения пользователя для других протоколов. По умолчанию выключено; действует для OAuth и API-ключей.',
      },
      claudeDisableCloakMode: {
        hint: 'Отключить имитацию Claude Code CLI и замену системного промпта. Явные настройки cloak_mode учётных данных или cloak.mode API-ключа имеют приоритет. По умолчанию выключено: автоматически маскируются клиенты, отличные от Claude Code.',
      },
    },
    headers: {
      description:
        'Общие настройки отпечатка Claude действуют для OAuth и API-ключей; заголовки Codex по умолчанию — только для OAuth.',
      claude_title: 'Общие настройки отпечатка Claude',
    },
  },
} as const;
