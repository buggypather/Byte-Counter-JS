# Byte & Bit Reader

A standalone Vue 3 + TypeScript browser application for inspecting the bit and byte cost of text across Unicode encodings.

## Current features

- UTF-8, UTF-16 LE/BE, UTF-32 LE/BE, ASCII, and Latin-1 analysis
- Grapheme, code-point, and UTF-16 code-unit counts
- Highlight/selection analysis
- Character inspector with hex and binary output
- File/BOM and newline modeling
- Filesystem allocation estimates
- CSV and Markdown export
- Collapsible, scrollable input and tabbed analysis workspace

## Development

```bash
npm install
npm run dev
```

Production check:

```bash
npm run build
```

The app is designed to remain client-side and usable as a standalone web/browser utility.
