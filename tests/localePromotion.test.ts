import { describe, expect, test } from 'bun:test';
import i18n from '../src/i18n';
import { forbiddenPaths } from '../scripts/locale-promotion-rules.json';

describe('locale promotion exclusions', () => {
  const localeDirectory = 'src/i18n/locales';
  for (const file of new Bun.Glob('*.json').scanSync({ cwd: localeDirectory })) {
    test(`${file}: excludes promotion keys from source and registered translations`, async () => {
      const source = await Bun.file(`${localeDirectory}/${file}`).json();
      const registered = i18n.getResourceBundle(file.slice(0, -'.json'.length), 'translation');
      for (const path of forbiddenPaths) {
        expect(source).not.toHaveProperty(path);
        if (registered) expect(registered).not.toHaveProperty(path);
      }
    });
  }
});
