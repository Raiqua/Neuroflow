# NeuroFlow MVP

## Recommended stack
React 19 with TanStack Start provides the reader and secure server boundaries. Tailwind CSS v4 and accessible shadcn/Radix controls supply the design system. Mozilla Readability with linkedom extracts article text without running webpage scripts. Lovable Cloud supports server-side AI through the Lovable AI Gateway Responses endpoint. Web Speech API supplies optional browser-native read-aloud.

## Frontend architecture
- Index reader: session article, reading level, AI stream consumption, focus state, progress and dialogs.
- IngestionPanel: website, raw text and .txt/.md document inputs with validation.
- ReadingText / BionicText: safe text rendering and initial-letter emphasis, never injected source HTML.
- ReaderSettings: four themes, text size, comfortable line spacing and actual OpenDyslexic font.
- FocusToolbar: bionic reading, focus line, sequential cards, read-aloud and distraction-free mode.
- Pure reader helpers: article types, chunking, word emphasis and destination validation.

## Server architecture
`extractArticle` calls an edge-compatible extraction helper. Public HTTPS destinations are checked against public DNS A records, including redirects, and responses are bounded. Original webpage HTML is never rendered. DNS validation is defense-in-depth, not a guarantee against DNS rebinding; production hardening should use an egress proxy with destination-IP pinning.

`/api/public/simplify` validates source text and reading level, checks browser origins, and forwards a streamed AI response. It sends user-provided content as data, not instructions. Secrets never enter frontend code. Failures and refusals stop the request and keep original text available. There is no automatic retry or background generation.

## MVP limits
Uploads support plain text and Markdown; PDF/DOCX are not included. Articles requiring login or blocking readers should be pasted as text. Text stays in session state; accounts, saved libraries and payments are outside this MVP. AI may change meaning, so original text remains accessible. Browser-native voices vary by device. This is not a claim of audited WCAG conformance. Public AI usage should have persistent abuse controls before a broad public launch.