# Preview fonts

`lxgw-wenkai-regular-preview.woff2` and `lxgw-wenkai-medium-preview.woff2`
are text subsets of LXGW WenKai's Regular and Medium fonts. The preview uses
the original font's Latin glyphs too, for a consistent, soft appearance.

Source: https://github.com/lxgw/LxgwWenKai
License: SIL Open Font License 1.1, see `WenKai-OFL.txt`.

To regenerate these two subsets, run `pyftsubset` on the upstream TTF files
with `--text-file=src/features/appearance/preview/FontPreview.tsx`,
`--flavor=woff2`, and the desired `--output-file`.

`noto-serif-sc-preview.woff2` is a Google Fonts text subset of Noto Serif SC
(weights 400–700). It includes the characters used by `FontPreview.tsx`, not the
full Chinese character set. Regenerate the subset when preview copy changes.
It is only imported by the development preview route; production does not include it.

Source: https://fonts.google.com/noto/specimen/Noto+Serif+SC
Font API: https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400..700&display=swap&text=...
License: SIL Open Font License 1.1, see `OFL.txt`.

The Noto Serif comparison uses local Georgia for Latin text.
