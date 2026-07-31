export const forkLocales = {
  'zh-CN': {
    auth_files: {
      refresh_interval_label: '刷新间隔（refresh_interval）',
      refresh_interval_placeholder: '例如: 15m / 3h / 900s',
      refresh_interval_hint: '填写带单位的 Go duration，例如 15m、3h、900s；留空则不写入。',
      refresh_interval_invalid: '刷新间隔必须包含单位，例如 15m、3h 或 900s。',
      note_display: '备注',
      disable_cooling_label: '禁用冷却（disable_cooling）',
      disable_cooling_hint: '支持布尔值、0/非0 数字或字符串 true/false/1/0；无法解析时忽略。',
    },
    dashboard: {
      current_config: '当前配置',
      management_keys: '管理密钥',
      provider_keys_detail:
        'G:{{gemini}} C:{{codex}} X:{{xai}} Cl:{{claude}} V:{{vertex}} O:{{openai}}',
      oauth_credentials: 'OAuth 凭证',
      edit_settings: '编辑设置',
      routing_strategy: '路由策略',
      available_models: '可用模型',
      available_models_desc: '所有提供商的模型总数',
      welcome_back: '欢迎回来',
      greeting_morning: '早上好',
      greeting_afternoon: '下午好',
      greeting_evening: '晚上好',
      greeting_night: '夜深了',
      caring_morning: '新的一天，准备大展身手吧。',
      caring_afternoon: '稳步推进中，继续加油。',
      caring_evening: '今天辛苦了，收尾工作做好哦。',
      caring_night: '夜深了，别忘了早些休息。',
      system_overview: '系统概览',
    },
    config_editor: {
      visual: {
        sections: {
          system: {
            request_log: '请求日志',
            request_log_desc: '仅在需要排查问题时开启，日常请保持关闭。',
          },
        },
      },
    },
    providersPage: {
      table: { disableCoolingTag: '禁用冷却' },
      detail: { fields: { disableCooling: '禁用冷却' } },
    },
  },
  'zh-TW': {
    auth_files: {
      refresh_interval_label: '重新整理間隔（refresh_interval）',
      refresh_interval_placeholder: '例如: 15m / 3h / 900s',
      refresh_interval_hint: '填寫帶單位的 Go duration，例如 15m、3h、900s；留空則不寫入。',
      refresh_interval_invalid: '重新整理間隔必須包含單位，例如 15m、3h 或 900s。',
      note_display: '備註',
      disable_cooling_label: '停用冷卻（disable_cooling）',
      disable_cooling_hint: '支援布林值、0/非0 數字或字串 true/false/1/0；無法解析時忽略。',
    },
    dashboard: {
      current_config: '目前設定',
      management_keys: '管理金鑰',
      provider_keys_detail:
        'G:{{gemini}} C:{{codex}} X:{{xai}} Cl:{{claude}} V:{{vertex}} O:{{openai}}',
      oauth_credentials: 'OAuth 憑證',
      edit_settings: '編輯設定',
      routing_strategy: '路由策略',
      available_models: '可用模型',
      available_models_desc: '所有供應商的模型總數',
      welcome_back: '歡迎回來',
      greeting_morning: '早安',
      greeting_afternoon: '午安',
      greeting_evening: '晚安',
      greeting_night: '夜深了',
      caring_morning: '新的一天，準備大展身手吧。',
      caring_afternoon: '穩步推進中，繼續加油。',
      caring_evening: '今天辛苦了，收尾工作做好喔。',
      caring_night: '夜深了，別忘了早點休息。',
      system_overview: '系統概覽',
    },
    config_editor: {
      visual: {
        sections: {
          system: {
            request_log: '請求記錄',
            request_log_desc: '僅在需要排查問題時開啟，日常請保持關閉。',
          },
        },
      },
    },
    providersPage: {
      table: { disableCoolingTag: '停用冷卻' },
      detail: { fields: { disableCooling: '停用冷卻' } },
    },
  },
  en: {
    auth_files: {
      refresh_interval_label: 'Refresh Interval (refresh_interval)',
      refresh_interval_placeholder: 'e.g. 15m / 3h / 900s',
      refresh_interval_hint:
        'Enter a Go duration with units, such as 15m, 3h, or 900s. Leave blank to omit it.',
      refresh_interval_invalid: 'Refresh interval must include a unit, such as 15m, 3h, or 900s.',
      note_display: 'Note',
      disable_cooling_label: 'Disable cooling (disable_cooling)',
      disable_cooling_hint:
        'Supports booleans, numeric 0/non-0, and strings like true/false/1/0; unparseable values are ignored.',
    },
    dashboard: {
      current_config: 'Current Configuration',
      management_keys: 'Management Keys',
      provider_keys_detail:
        'G:{{gemini}} C:{{codex}} X:{{xai}} Cl:{{claude}} V:{{vertex}} O:{{openai}}',
      oauth_credentials: 'OAuth Credentials',
      edit_settings: 'Edit Settings',
      routing_strategy: 'Routing Strategy',
      available_models: 'Available Models',
      available_models_desc: 'Total models from all providers',
      welcome_back: 'Welcome Back',
      greeting_morning: 'Good Morning',
      greeting_afternoon: 'Good Afternoon',
      greeting_evening: 'Good Evening',
      greeting_night: 'Good Night',
      caring_morning: "A fresh start — let's make today count.",
      caring_afternoon: "Steady progress — you're doing great.",
      caring_evening: 'Wrapping up nicely — almost there.',
      caring_night: "Burning the midnight oil? Don't forget to rest.",
      system_overview: 'System Overview',
    },
    config_editor: {
      visual: {
        sections: {
          system: {
            request_log: 'Request Logging',
            request_log_desc: 'Keep this off unless you need detailed troubleshooting.',
          },
        },
      },
    },
    providersPage: {
      table: { disableCoolingTag: 'No cooling' },
      detail: { fields: { disableCooling: 'Disable cooling' } },
    },
  },
  ru: {
    auth_files: {
      refresh_interval_label: 'Интервал обновления (refresh_interval)',
      refresh_interval_placeholder: 'например: 15m / 3h / 900s',
      refresh_interval_hint:
        'Введите Go duration с единицей, например 15m, 3h или 900s. Оставьте пустым, чтобы не записывать.',
      refresh_interval_invalid:
        'Интервал обновления должен содержать единицу, например 15m, 3h или 900s.',
      note_display: 'Заметка',
      disable_cooling_label: 'Отключение охлаждения (disable_cooling)',
      disable_cooling_hint:
        'Поддерживает boolean, числа 0/не 0 и строки true/false/1/0; непарсируемые значения игнорируются.',
    },
    dashboard: {
      current_config: 'Текущая конфигурация',
      management_keys: 'Ключи управления',
      provider_keys_detail:
        'G:{{gemini}} C:{{codex}} X:{{xai}} Cl:{{claude}} V:{{vertex}} O:{{openai}}',
      oauth_credentials: 'Учётные данные OAuth',
      edit_settings: 'Изменить настройки',
      routing_strategy: 'Стратегия маршрутизации',
      available_models: 'Доступные модели',
      available_models_desc: 'Всего моделей от всех провайдеров',
      welcome_back: 'С возвращением',
      greeting_morning: 'Доброе утро',
      greeting_afternoon: 'Добрый день',
      greeting_evening: 'Добрый вечер',
      greeting_night: 'Доброй ночи',
      caring_morning: 'Новый день — начнём продуктивно.',
      caring_afternoon: 'Уверенный прогресс — отличная работа.',
      caring_evening: 'День подходит к концу — финальный рывок.',
      caring_night: 'Поздняя работа? Не забудьте отдохнуть.',
      system_overview: 'Обзор системы',
    },
    config_editor: {
      visual: {
        sections: {
          system: {
            request_log: 'Журналирование запросов',
            request_log_desc: 'Оставьте выключенным, если подробная диагностика не нужна.',
          },
        },
      },
    },
    providersPage: {
      table: { disableCoolingTag: 'Без cooldown' },
      detail: { fields: { disableCooling: 'Отключение cooldown' } },
    },
  },
} as const;
