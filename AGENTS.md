<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## NeuroFlow architecture
- Keep the primary adaptive reader at the index route, with focused ingestion, text rendering, preferences and toolbar components; this isolates reading interactions while preserving one usable first screen.
- Keep pure chunking and bionic rules in a browser-safe reader module, with tests; this makes transformations independently verifiable.
- Use TanStack server functions for URL extraction and a streaming server route for AI rewriting; secrets remain server-only and long responses reach the reader progressively.
- Use Readability with linkedom for article extraction and validate public HTTPS destinations plus every redirect; this removes distracting markup without executing page scripts.
- Keep session text in React state, not persistent storage; reading content is transient until a future explicit save feature is requested.
