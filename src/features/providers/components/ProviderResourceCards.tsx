import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IconAlertTriangle,
  IconCheck,
  IconCheckCircle2,
  IconEye,
  IconPencil,
  IconTrash2,
  IconX,
} from '@/components/ui/icons';
import { ToggleSwitch } from '@/components/ui/ToggleSwitch';
import { ProviderStatusBar } from '@/components/providers/ProviderStatusBar';
import type { ProviderRecentUsageMap } from '@/components/providers/utils';
import type { ProviderResource } from '../types';
import { resolveStatusBarData, resolveTotalStats } from '../resourceStats';
import styles from './ProviderResourceCards.module.scss';
import statusBarStyles from './providerStatusBar.module.scss';

interface ProviderResourceCardsProps {
  resources: ProviderResource[];
  selectedId?: string | null;
  disableMutations?: boolean;
  usageByProvider?: ProviderRecentUsageMap;
  onView: (resource: ProviderResource) => void;
  onEdit: (resource: ProviderResource) => void;
  onDelete: (resource: ProviderResource) => void;
  onToggleDisabled?: (resource: ProviderResource, disabled: boolean) => void;
}

export function ProviderResourceCards({
  resources,
  selectedId,
  disableMutations,
  usageByProvider,
  onView,
  onEdit,
  onDelete,
  onToggleDisabled,
}: ProviderResourceCardsProps) {
  const { t } = useTranslation();

  const renderMetric = (key: string, label: string, value: number) => (
    <span key={key} className={styles.metric}>
      <span className={styles.metricLabel}>{label}</span>
      <span className={styles.metricValue}>{value}</span>
    </span>
  );

  const renderFlagTag = (key: string, label: string) => (
    <span key={key} className={styles.flagTag}>
      {label}
    </span>
  );

  const renderModelsSummary = (r: ProviderResource) => {
    const items: ReactNode[] = [];
    if (r.brand === 'openaiCompatibility') {
      items.push(
        renderMetric('models', t('providersPage.table.metrics.models'), r.modelCount),
        renderMetric('keys', t('providersPage.table.metrics.keys'), r.apiKeyEntryCount),
        renderMetric('headers', t('providersPage.table.metrics.headers'), r.headerCount),
      );
    } else {
      items.push(
        renderMetric('models', t('providersPage.table.metrics.models'), r.modelCount),
        renderMetric('headers', t('providersPage.table.metrics.headers'), r.headerCount),
      );
      if (r.brand === 'codex' && r.flags.websockets) {
        items.push(renderFlagTag('ws', t('providersPage.table.websocketsTag')));
      }
      if (r.flags.disableCooling) {
        items.push(renderFlagTag('cooling', t('providersPage.table.disableCoolingTag')));
      }
      if (r.brand === 'claude' && r.flags.cloakEnabled) {
        items.push(renderFlagTag('cloak', t('providersPage.table.cloakTag')));
      }
    }
    return <div className={styles.metricsCell}>{items}</div>;
  };

  const renderStatus = (r: ProviderResource) => {
    if (r.disabled) {
      return (
        <span className={`${styles.statusBadge} ${styles.statusDisabled}`}>
          <IconAlertTriangle size={14} />
          {t('providersPage.status.disabled')}
        </span>
      );
    }
    return (
      <span className={`${styles.statusBadge} ${styles.statusActive}`}>
        <IconCheckCircle2 size={14} />
        {t('providersPage.status.active')}
      </span>
    );
  };

  const renderPrimary = (r: ProviderResource) => {
    if (r.brand === 'openaiCompatibility') {
      const extra = r.apiKeyEntryCount > 1 ? ` · +${r.apiKeyEntryCount - 1}` : '';
      return (
        <div className={styles.primaryCell}>
          <span className={styles.primaryName}>{r.name ?? r.identifier}</span>
          <span className={styles.primarySub}>{(r.apiKeyPreview ?? '—') + extra}</span>
        </div>
      );
    }
    return (
      <div className={styles.primaryCell}>
        <span className={styles.primaryName}>{r.apiKeyPreview ?? '—'}</span>
        {r.authIndex ? <span className={styles.primarySub}>auth: {r.authIndex}</span> : null}
      </div>
    );
  };

  const renderBaseUrl = (r: ProviderResource) => {
    if (r.brand === 'claude' && !r.baseUrl) {
      return (
        <span className={styles.baseUrl}>
          https://api.anthropic.com {t('providersPage.status.defaultSuffix')}
        </span>
      );
    }
    return <span className={styles.baseUrl}>{r.baseUrl ?? t('providersPage.status.notSet')}</span>;
  };

  const renderField = (label: string, value: ReactNode) => (
    <div className={styles.field}>
      <span className={styles.fieldLabel}>{label}</span>
      <div className={styles.fieldValue}>{value}</div>
    </div>
  );

  return (
    <div className={styles.cardList}>
      {resources.map((resource) => {
        const showStats = usageByProvider;
        const stats = showStats ? resolveTotalStats(resource, usageByProvider) : null;

        return (
          <article
            key={resource.id}
            className={`${styles.card} ${resource.id === selectedId ? styles.selected : ''}`}
          >
            <div className={styles.cardHeader}>
              {renderPrimary(resource)}
              {onToggleDisabled ? (
                <span className={styles.toggleWrap} onClick={(e) => e.stopPropagation()}>
                  <ToggleSwitch
                    checked={!resource.disabled}
                    disabled={disableMutations}
                    onChange={(value) => onToggleDisabled(resource, !value)}
                    ariaLabel={
                      resource.disabled
                        ? t('providersPage.actions.enable')
                        : t('providersPage.actions.disable')
                    }
                  />
                </span>
              ) : null}
            </div>

            <div className={styles.fieldGrid}>
              {renderField(t('providersPage.table.baseUrl'), renderBaseUrl(resource))}
              {renderField(
                t('providersPage.table.prefix'),
                resource.prefix ? (
                  <span className={styles.chip}>{resource.prefix}</span>
                ) : (
                  <span className={styles.baseUrl}>{t('providersPage.status.none')}</span>
                )
              )}
              {renderField(
                t('common.priority'),
                resource.priority === null ? (
                  <span className={styles.baseUrl}>{t('providersPage.status.none')}</span>
                ) : (
                  <span className={styles.priorityValue}>{resource.priority}</span>
                )
              )}
              {renderField(t('providersPage.table.models'), renderModelsSummary(resource))}
            </div>

            <div className={styles.statusRow}>
              {renderStatus(resource)}
              {stats ? (
                <div className={styles.stats}>
                  <span className={`${styles.statPill} ${styles.statSuccess}`}>
                    <IconCheck size={13} />
                    {stats.success}
                  </span>
                  <span className={`${styles.statPill} ${styles.statFailure}`}>
                    <IconX size={13} />
                    {stats.failure}
                  </span>
                </div>
              ) : null}
            </div>

            {showStats ? (
              <ProviderStatusBar
                statusData={resolveStatusBarData(resource, usageByProvider)}
                styles={statusBarStyles}
              />
            ) : null}

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t('providersPage.actions.view')}
                title={t('providersPage.actions.view')}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(resource);
                }}
              >
                <IconEye size={16} />
              </button>
              <button
                type="button"
                className={styles.iconBtn}
                aria-label={t('providersPage.actions.edit')}
                title={t('providersPage.actions.edit')}
                disabled={disableMutations}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(resource);
                }}
              >
                <IconPencil size={16} />
              </button>
              <button
                type="button"
                className={`${styles.iconBtn} ${styles.iconBtnDanger}`}
                aria-label={t('providersPage.actions.delete')}
                title={t('providersPage.actions.delete')}
                disabled={disableMutations}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(resource);
                }}
              >
                <IconTrash2 size={16} />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
