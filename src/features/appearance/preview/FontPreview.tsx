// DEV-only, no backend required: /#/__preview/fonts.
// Reuses dashboard styles and widgets to compare fonts at the app's actual sizes.
import { useState } from 'react';
import {
  IconSidebarDashboard,
  IconSidebarProviders,
  IconSidebarAuthFiles,
  IconSidebarQuota,
  IconSidebarConfig,
  IconSidebarLogs,
} from '@/components/ui/icons';
import { Meter } from '@/features/dashboard/components/Meter';
import { Sparkline } from '@/features/dashboard/components/Sparkline';
import dashboard from '@/features/dashboard/dashboard.module.scss';
import styles from './FontPreview.module.scss';

const FONTS = [
  { id: 'original', title: '原有字体', sample: '清晰，熟悉。', note: '系统无衬线 · 对照' },
  {
    id: 'wenkai',
    title: '霞鹜文楷',
    sample: '字里，有呼吸。',
    note: '柔和楷意 · 书卷气',
    recommended: true,
  },
  { id: 'song', title: '轻宋体', sample: '让界面像一页书。', note: '细致宋体 · 对照' },
] as const;

const THEMES = [
  { id: 'light', label: '纸感' },
  { id: 'white', label: '纯白' },
  { id: 'dark', label: '深色' },
] as const;

const NAV = [
  { label: '仪表盘', icon: IconSidebarDashboard },
  { label: 'AI 提供商', icon: IconSidebarProviders },
  { label: '认证文件', icon: IconSidebarAuthFiles },
  { label: '额度管理', icon: IconSidebarQuota },
  { label: '配置管理', icon: IconSidebarConfig },
  { label: '请求日志', icon: IconSidebarLogs },
];

const PROVIDERS = [
  {
    name: 'Codex',
    credentials: 12,
    requests: '8,642',
    rate: 99.8,
    points: [4, 8, 6, 12, 9, 18, 14, 23],
  },
  {
    name: 'Claude',
    credentials: 8,
    requests: '3,186',
    rate: 99.5,
    points: [3, 6, 5, 9, 7, 13, 11, 16],
  },
  {
    name: 'Gemini',
    credentials: 4,
    requests: '1,018',
    rate: 98.9,
    points: [2, 4, 3, 6, 5, 8, 6, 10],
  },
];

export function FontPreview() {
  const [font, setFont] = useState<(typeof FONTS)[number]['id']>('wenkai');
  const [applyToBody, setApplyToBody] = useState(true);
  const [theme, setTheme] = useState<(typeof THEMES)[number]['id']>('light');
  const [section, setSection] = useState<'overview' | 'details'>('overview');
  const selectedFont = FONTS.find((option) => option.id === font)!;
  const fontSource =
    font === 'song'
      ? 'https://fonts.google.com/noto/specimen/Noto+Serif+SC'
      : 'https://github.com/lxgw/LxgwWenKai';

  return (
    <div className={styles.page} data-theme={theme} data-font={font}>
      <div className={styles.container}>
        <header className={styles.toolbar}>
          <div>
            <p className={styles.kicker}>APPEARANCE / 字体试验</p>
            <h1 className={styles.title}>给界面一点书卷气。</h1>
            <p className={styles.description}>柔和一点，从容一点。切换字体，看看哪一种更舒服。</p>
          </div>
          <div className={styles.themeControls} role="group" aria-label="预览主题">
            {THEMES.map((option) => (
              <button
                key={option.id}
                type="button"
                aria-pressed={theme === option.id}
                onClick={() => setTheme(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        <div className={styles.fontControls} role="group" aria-label="字体方案">
          {FONTS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={styles.fontOption}
              data-font={option.id}
              aria-pressed={font === option.id}
              onClick={() => setFont(option.id)}
            >
              <span className={styles.optionTitle}>
                {option.title}
                {'recommended' in option && <span className={styles.recommended}>推荐</span>}
                <span className={styles.radio} aria-hidden="true" />
              </span>
              <span className={styles.optionSample}>{option.sample}</span>
              <span className={styles.optionNote}>{option.note}</span>
            </button>
          ))}
        </div>

        <div className={styles.applicationControls}>
          <label>
            <input
              type="checkbox"
              checked={applyToBody}
              disabled={font === 'original'}
              onChange={(event) => setApplyToBody(event.target.checked)}
            />
            正文和控件也使用这款字体
          </label>
          <span>
            {font === 'original'
              ? '原有字体对照'
              : applyToBody
                ? '标题与正文一起预览'
                : '先看标题，正文保持原有字体'}
          </span>
        </div>

        <div
          className={styles.surface}
          data-font={font}
          data-body-font={applyToBody && font !== 'original'}
        >
          <aside className={styles.sidebar} aria-label="侧栏样例">
            <div className={styles.brand}>
              <span className={styles.brandMark}>C</span>CLI Proxy
            </div>
            <p className={styles.sidebarCaption}>工作空间</p>
            <ul className={styles.navigation}>
              {NAV.map(({ label, icon: Icon }, index) => (
                <li key={label} className={index === 0 ? styles.activeNav : undefined}>
                  <Icon size={18} />
                  <span>{label}</span>
                </li>
              ))}
            </ul>
            <div className={styles.sidebarFooter}>
              <span className={styles.statusDot} />
              本地预览<span>DEMO</span>
            </div>
          </aside>

          <main className={styles.main}>
            <div className={styles.previewHeader}>
              <span>
                管理中心 <span className={styles.separator}>/</span> 仪表盘
              </span>
              <span className={styles.previewBadge}>模拟数据</span>
            </div>
            <div className={styles.dashboard}>
              <section className={`${dashboard.hero} ${styles.hero}`} aria-label="仪表盘样例">
                <div className={dashboard.heroCopy}>
                  <p className={styles.kicker}>YOUR PROXY, AT A GLANCE</p>
                  <h2 className={`${dashboard.heroTitle} ${styles.heroTitle}`}>
                    一切流畅<span className={styles.heroPeriod}>。</span>
                  </h2>
                  <p className={styles.heroDescription}>
                    每一次请求，都有条不紊。
                    <br />
                    在这里，掌握你的模型、流量与连接。
                  </p>
                  <div className={dashboard.heroActions}>
                    <button
                      className={
                        section === 'overview' ? dashboard.primaryAction : dashboard.ghostAction
                      }
                      type="button"
                      aria-pressed={section === 'overview'}
                      onClick={() => setSection('overview')}
                    >
                      流量概览
                    </button>
                    <button
                      className={
                        section === 'details' ? dashboard.primaryAction : dashboard.ghostAction
                      }
                      type="button"
                      aria-pressed={section === 'details'}
                      onClick={() => setSection('details')}
                    >
                      请求明细 →
                    </button>
                  </div>
                </div>
                <div className={dashboard.heroPanel}>
                  <div className={dashboard.heroPanelTop}>
                    <span className={dashboard.heroPanelLabel}>累计请求</span>
                    <span className={dashboard.liveBadge}>示例</span>
                  </div>
                  <strong className={dashboard.heroFigure}>12,846</strong>
                  <span className={dashboard.heroPanelMeta}>最近 24 小时 · Requests</span>
                  <Sparkline
                    points={[4, 8, 6, 12, 9, 18, 14, 23, 17, 26, 21, 30]}
                    color="var(--viz-success)"
                    ariaLabel="模拟请求趋势"
                    className={styles.heroSpark}
                  />
                  <div className={dashboard.heroSplit}>
                    <span className={dashboard.heroSplitItem}>
                      成功 <b>12,805</b>
                    </span>
                    <span className={dashboard.heroSplitItem}>
                      失败 <b>41</b>
                    </span>
                  </div>
                </div>
              </section>

              <section className={dashboard.statsRow} aria-label="关键指标样例">
                {[
                  ['成功率', '99.68%'],
                  ['可用凭据', '24'],
                  ['提供商密钥', '16'],
                  ['可用模型', '32'],
                ].map(([label, value]) => (
                  <article key={label} className={dashboard.statTile}>
                    <span className={dashboard.statLabel}>{label}</span>
                    <strong className={dashboard.statValue}>{value}</strong>
                    <span className={styles.metricNote}>
                      {label === '成功率' ? '运行平稳' : '已连接 · 可用'}
                    </span>
                  </article>
                ))}
              </section>

              <section
                className={dashboard.section}
                aria-label={section === 'overview' ? '流量概览' : '请求明细'}
              >
                <header className={dashboard.sectionHead}>
                  <span className={dashboard.eyebrow}>
                    {section === 'overview' ? 'PROVIDER FLEET' : 'RECENT REQUESTS'}
                  </span>
                  <h2 className={dashboard.sectionTitle}>
                    {section === 'overview' ? '流量，各有去处。' : '每一次请求，都有迹可循。'}
                  </h2>
                </header>
                <div className={dashboard.panel}>
                  {section === 'overview' ? (
                    <ul className={dashboard.fleetList}>
                      {PROVIDERS.map((provider, index) => (
                        <li key={provider.name} className={dashboard.fleetRow}>
                          <span className={dashboard.fleetRank}>
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <div className={dashboard.fleetIdentity}>
                            <span className={`${dashboard.fleetName} ${styles.providerName}`}>
                              {provider.name}
                            </span>
                            <span className={`${dashboard.fleetMeta} ${styles.bodyLabel}`}>
                              {provider.credentials} 个凭据
                            </span>
                          </div>
                          <Sparkline
                            points={provider.points}
                            color="var(--viz-success)"
                            ariaLabel={`${provider.name} 模拟流量`}
                            className={dashboard.fleetSpark}
                          />
                          <div className={dashboard.fleetNumbers}>
                            <span className={dashboard.fleetTotal}>{provider.requests}</span>
                            <span className={`${dashboard.fleetTotalLabel} ${styles.bodyLabel}`}>
                              请求
                            </span>
                          </div>
                          <div className={dashboard.fleetRate}>
                            <span className={dashboard.fleetRateValue}>{provider.rate}%</span>
                            <Meter
                              value={provider.rate}
                              ariaLabel={`${provider.name} 成功率`}
                              className={dashboard.fleetMeter}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className={styles.tableWrapper}>
                      <table className={styles.table}>
                        <thead>
                          <tr>
                            <th>时间</th>
                            <th>模型</th>
                            <th>状态</th>
                            <th>耗时</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            ['14:32:08', 'codex-demo', '248 ms'],
                            ['14:31:56', 'claude-demo', '412 ms'],
                            ['14:31:42', 'gemini-demo', '186 ms'],
                          ].map(([time, model, latency]) => (
                            <tr key={time}>
                              <td>
                                <code>{time}</code>
                              </td>
                              <td>
                                <code>{model}</code>
                              </td>
                              <td>
                                <span className={styles.success}>成功</span>
                              </td>
                              <td>
                                <code>{latency}</code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>

              <section className={styles.typeSample} aria-label="中英文正文样例">
                <div>
                  <p className={styles.kicker}>READING SAMPLE</p>
                  <h2>好的字体，让信息更从容。</h2>
                </div>
                <p>管理连接，观察流量，把复杂留在后台。标题多一点温度，正文保持轻松易读。</p>
                <p className={styles.english}>
                  A quieter workspace. A clearer view of every request.
                </p>
                <code>GET /v1/models · 200 OK · 128 ms</code>
              </section>
            </div>
          </main>
        </div>

        <footer className={styles.footer}>
          <p>
            <strong>{selectedFont.title}</strong> ·{' '}
            {font === 'original'
              ? '系统无衬线字体'
              : font === 'wenkai'
                ? '霞鹜文楷，柔和的楷体风格'
                : 'Noto Serif SC，常规字重'}
            ；数字、模型 ID 和代码保持等宽。
          </p>
          <p>
            仅开发预览，不保存偏好。字体已本地化，可离线查看。
            <a href={fontSource} target="_blank" rel="noreferrer">
              字体来源 ↗
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
