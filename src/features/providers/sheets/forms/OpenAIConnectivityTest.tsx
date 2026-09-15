import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { IconLoader2 } from '@/components/ui/icons';
import type { ApiKeyEntryInput } from '../../types';
import { ConnectivityStatusIcon } from './ConnectivityStatusIcon';
import type { ConnectivityState, ConnectivityStatus } from './useConnectivityTest';
import styles from './sharedForm.module.scss';

interface OpenAIConnectivityTestProps {
  entries: ApiKeyEntryInput[];
  statuses: ConnectivityStatus[];
  disabled: boolean;
  onTest: () => Promise<void>;
}

export function OpenAIConnectivityTest({
  entries,
  statuses,
  disabled,
  onTest,
}: OpenAIConnectivityTestProps) {
  const { t } = useTranslation();
  const aggregateStatus = useMemo<ConnectivityState>(() => {
    if (statuses.some((status) => status.state === 'loading')) return 'loading';
    if (statuses.some((status) => status.state === 'error')) return 'error';

    // 清空输入框后仍会使用已保存的密钥或 authIndex，汇总时也要计入。
    const testableCount = entries.filter(
      (entry) =>
        entry.apiKey.trim() || entry.existingApiKey?.trim() || (entry.authIndex ?? '').trim()
    ).length;
    const successCount = statuses.filter((status) => status.state === 'success').length;
    return testableCount > 0 && successCount >= testableCount ? 'success' : 'idle';
  }, [entries, statuses]);

  return (
    <div className={styles.connectivityRow}>
      <button
        type="button"
        className={styles.connectivityBtn}
        disabled={disabled}
        onClick={() => void onTest()}
      >
        {aggregateStatus === 'loading' ? (
          <span className={`${styles.statusIcon} ${styles.statusIconLoading}`}>
            <IconLoader2 size={14} />
          </span>
        ) : null}
        <span>{t('providersPage.connectivity.testAll')}</span>
      </button>
      <ConnectivityStatusIcon state={aggregateStatus} />
      {aggregateStatus === 'success' ? (
        <span className={styles.connectivityHintSuccess}>
          {t('providersPage.connectivity.success')}
        </span>
      ) : null}
    </div>
  );
}
