# LXGW WenKai UI fonts

The UI uses local Regular and Medium WOFF2 subsets of LXGW WenKai. Medium is
used for all heavier CSS weights to retain the soft stroke weight selected in
the preview. Numeric telemetry and code retain the existing monospace font.
Vite embeds these files in the single-file production HTML.

The subsets include all characters in `src/i18n/**/*.json` and
`src/i18n/**/*.ts`, printable Latin characters, Latin extensions, Cyrillic,
and the 6,763 common Chinese characters in GB2312. Glyphs the upstream font
does not support, and other user-supplied characters, use the system fallback.

Source: https://github.com/lxgw/LxgwWenKai
License: SIL Open Font License 1.1; see `OFL.txt` (includes permission for web
font subsets). These subsets are intended for web delivery.

Original TTF SHA-256:

- Regular: `2D73EEA94AD808999D90C0000C239A84A33B09D4BC6AB6C5B8BBF1EDA8A7FC8B`
- Medium: `F4B8A34D1F838FE411540CB7C97B1C384AC9738A876C4104500BC42508B2312A`

To regenerate, collect Unicode codepoints from the public locale files and
the ranges above into a comma-separated `U+XXXX` list. GB2312 Chinese
characters are the valid GBK-decoded byte pairs with lead bytes `B0–F7` and
trail bytes `A1–FE`. Run FontTools' `pyftsubset` on each upstream TTF using
`--unicodes-file=<list> --flavor=woff2 --output-file=<output>`.
