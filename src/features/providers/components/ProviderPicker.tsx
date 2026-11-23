import { useTranslation } from 'react-i18next';
import { IconChevronLeft } from '@/components/ui/icons';
import { connectionCounts } from '../resourceView';
import type { ProviderBrand, ProviderGroup } from '../types';
import { BrandLogo } from './BrandLogo';
import styles from './ProviderPicker.module.scss';

interface ProviderPickerProps {
  groups: ProviderGroup[];
  /** `page` lays the catalogue out wide for first-run onboarding. */
  variant?: 'sheet' | 'page';
  onPick: (brand: ProviderBrand) => void;
}

const CUSTOM_BRANDS: ReadonlySet<ProviderBrand> = new Set(['openaiCompatibility']);

/** Catalogue of supported API protocols. */
export function ProviderPicker({ groups, variant = 'sheet', onPick }: ProviderPickerProps) {
  const { t } = useTranslation();
  const countOf = (brand: ProviderBrand) => {
    const group = groups.find((item) => item.id === brand);
    return group ? connectionCounts(group).total : 0;
  };
  const official = groups.map((group) => group.id).filter((brand) => !CUSTOM_BRANDS.has(brand));
  const custom = groups.map((group) => group.id).filter((brand) => CUSTOM_BRANDS.has(brand));
  const name = (brand: ProviderBrand) => t(`providersPage.providerNames.${brand}`);
  const connected = (brand: ProviderBrand) => {
    const count = countOf(brand);
    return count > 0 ? (
      <span className={styles.connected}>{t('providersPage.picker.connected', { count })}</span>
    ) : null;
  };

  const tile = (brand: ProviderBrand) => (
    <li key={brand}>
      <button type="button" className={styles.tile} onClick={() => onPick(brand)}>
        <BrandLogo brand={brand} size={28} />
        <span className={styles.tileName}>{name(brand)}</span>
        {connected(brand)}
        <IconChevronLeft size={14} className={styles.tileChevron} aria-hidden="true" />
      </button>
    </li>
  );

  return (
    <div className={`${styles.picker} ${variant === 'page' ? styles.pickerPage : ''}`}>
      {official.length > 0 ? (
        <section className={styles.section}>
          <h3 className={styles.heading}>{t('providersPage.picker.official')}</h3>
          <ul className={styles.tiles}>{official.map(tile)}</ul>
        </section>
      ) : null}

      {custom.length > 0 ? (
        <section className={styles.section}>
          <h3 className={styles.heading}>{t('providersPage.picker.custom')}</h3>
          <ul className={styles.tiles}>{custom.map(tile)}</ul>
        </section>
      ) : null}
    </div>
  );
}
