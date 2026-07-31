export type LocaleRecord = Record<string, unknown>;

export const mergeLocale = (base: LocaleRecord, overlay: LocaleRecord): LocaleRecord => {
  const merged: LocaleRecord = { ...base };
  Object.entries(overlay).forEach(([key, value]) => {
    const current = merged[key];
    if (
      current &&
      value &&
      typeof current === 'object' &&
      typeof value === 'object' &&
      !Array.isArray(current) &&
      !Array.isArray(value)
    ) {
      merged[key] = mergeLocale(current as LocaleRecord, value as LocaleRecord);
    } else {
      merged[key] = value;
    }
  });
  return merged;
};
