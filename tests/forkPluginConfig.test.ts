import { describe, expect, test } from 'bun:test';
import type { PluginConfigField } from '../src/types';
import {
  renderForkPluginField,
  validateForkPluginDraft,
} from '../src/features/plugins/forkPluginConfig';
import {
  buildPluginConfigDraft,
  buildPluginConfigPatch,
} from '../src/features/plugins/pluginConfigDraft';
import { ModelRetryOverridesEditor } from '../src/features/plugins/components/ModelRetryOverridesEditor';
import { PluginJsonFieldEditor } from '../src/features/plugins/components/PluginJsonFieldEditor';

const field: PluginConfigField = {
  name: 'model_overrides',
  type: 'object',
  enumValues: [],
  description: 'Overrides',
};
const plugin = { id: 'model-retry-wrapper', enabled: true, configFields: [field] };
const t = (key: string) => key;

describe('fork plugin integration', () => {
  test('selects the retry editor only for its plugin and leaves scalar fields to upstream', () => {
    const draft = buildPluginConfigDraft(plugin, {});
    const retry = renderForkPluginField(plugin, field, draft, true, () => {});
    expect(retry?.type).toBe(ModelRetryOverridesEditor);
    expect(retry?.props.disabled).toBe(true);
    const generic = renderForkPluginField(
      { ...plugin, id: 'other' },
      field,
      draft,
      false,
      () => {}
    );
    expect(generic?.type).toBe(PluginJsonFieldEditor);
    expect(
      renderForkPluginField(
        plugin,
        { ...field, name: 'text', type: 'string' },
        draft,
        false,
        () => {}
      )
    ).toBeNull();
    expect(draft.touchedFields).toEqual({});
  });

  test('unfinished JSON edits block saving and correcting them clears the blocking error', () => {
    const other = { ...plugin, id: 'other' };
    let draft = buildPluginConfigDraft(other, { model_overrides: { existing: true } });
    const editor = renderForkPluginField(other, field, draft, false, (update) => {
      draft = update(draft);
    });
    editor!.props.onChange('{', 'unfinished');
    expect(draft.touchedFields.model_overrides).toBe(true);
    expect(buildPluginConfigPatch(draft, other.configFields, t)).toEqual({
      patch: {},
      errors: { model_overrides: 'unfinished' },
    });
    editor!.props.onChange('{"existing":false}', '');
    expect(buildPluginConfigPatch(draft, other.configFields, t)).toEqual({
      patch: { model_overrides: { existing: false } },
      errors: {},
    });
  });

  test('validates effective retry delays only after a relevant edit on the retry plugin', () => {
    const draft = buildPluginConfigDraft(plugin, {
      model_overrides: { model: { initial_delay_ms: 20000 } },
    });
    expect(validateForkPluginDraft(plugin, draft, t)).toEqual({});
    draft.touchedFields.enabled = true;
    expect(validateForkPluginDraft(plugin, draft, t)).toEqual({});
    draft.touchedFields.initial_delay_ms = true;
    expect(validateForkPluginDraft(plugin, draft, t).model_overrides).toBeTruthy();
    expect(validateForkPluginDraft({ ...plugin, id: 'other' }, draft, t)).toEqual({});
    draft.values.model_overrides = '{"model":{"initial_delay_ms":20000,"max_delay_ms":30000}}';
    expect(validateForkPluginDraft(plugin, draft, t)).toEqual({});
  });
});
