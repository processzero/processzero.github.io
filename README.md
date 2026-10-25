# Process Zero

The public site is https://processzero.github.io/. Edit content at
https://processzero.github.io/edit/ using the private PIN.

The editor uses Quill, with the public site's layout. **Save changes** publishes
content immediately to the shared content service; visitors get the current
content on page load. There is no GitHub deployment wait for text changes.

## Source and data

- `index.html`: original readable page and fallback when the content service is unavailable.
- `assets/site.css`: shared public/editor typography and layout.
- `assets/content.js`: loads current public content and handles the accordion.
- `edit/index.html`, `assets/editor.js`, `assets/editor.css`: editor UI.
- `assets/initial-content.json`: original content snapshot, not the live source of truth.
- `assets/quill*`, `assets/purify.min.js`: locally hosted, pinned editor/sanitizer assets, with licenses.

Live content is stored in Cloudflare D1 through the Sites backend:
`https://processzero-content-api.aryammanbhatia.chatgpt.site`.
Backend project: `appgprj_6ade5dc6aab081918b3f1dd89868a408`.
Its source repository is managed by Sites. The local checkout for this chat is
`work/processzero-content-api`.

The PIN hash and salt live only in secret backend environment variables. No PIN
or publishing credential belongs in this public repository. Sessions are random,
expire after 30 minutes, and stay only in the editor tab's memory. The backend
enforces persistent global limits of 5 login attempts/hour and 20/day, with an
additional per-IP limit. These apply to successful and unsuccessful attempts.
The database stores the last 20 published versions for recovery. A stale tab
cannot overwrite a newer save. Published HTML is sanitized on the server and
again before display.

For future code changes, preserve live D1 content and the backend project ID.
Do not regenerate the site from an old text snapshot. Changes to the fallback
HTML do not replace live content. Content edits should go through the editor.
Main content is public; the PIN protects writes, not readership. A four-digit PIN
has limited entropy despite server-side checking and strict throttling.
