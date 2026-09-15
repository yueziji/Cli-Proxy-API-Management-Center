import { useTranslation } from 'react-i18next';
import { supportsDisableCoolingControl } from '../../providerCapabilities';
import type { ProviderBrand } from '../../types';
import styles from './sharedForm.module.scss';

interface DisableCoolingOptionProps {
  brand: ProviderBrand;
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
}

export function DisableCoolingOption({
  brand,
  checked,
  disabled,
  onChange,
}: DisableCoolingOptionProps) {
  const { t } = useTranslation();
  if (!supportsDisableCoolingControl(brand)) return null;

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
        <span>{t('providersPage.form.disableCooling')}</span>
        <small>{t('providersPage.form.disableCoolingHint')}</small>
      </span>
    </label>
  );
}
