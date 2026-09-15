import { useTranslation } from 'react-i18next';
import type { BaseUrlValidationResult } from '@/utils/validation';
import styles from './sharedForm.module.scss';

interface BaseUrlValidationHintProps {
  validation: BaseUrlValidationResult;
}

export function BaseUrlValidationHint({ validation }: BaseUrlValidationHintProps) {
  const { t } = useTranslation();

  if (validation.errorKey) {
    return (
      <span className={styles.fieldError}>
        {t(`providersPage.form.validation.${validation.errorKey}`)}
      </span>
    );
  }

  if (!validation.warningKeys.length) return null;

  return (
    <span className={styles.fieldWarning}>
      {validation.warningKeys.map((key) => t(`providersPage.form.validation.${key}`)).join(' ')}
    </span>
  );
}
