import { useTranslation } from 'react-i18next';
import styles from './sharedForm.module.scss';

export function ModelCompatOption({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}) {
  const { t } = useTranslation();
  return (
    <label className={styles.checkboxRow}>
      <input
        type="checkbox"
        className={styles.checkboxBox}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className={styles.checkboxText}>
        <span>{t('compatibilitySettings.modelLabel')}</span>
        <small>{t('compatibilitySettings.modelHint')}</small>
      </span>
    </label>
  );
}
