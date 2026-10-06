# Security review

Date: 2026-10-06. Scope: the whole repo at commit 6195fe7.

No high or medium severity issues. The app is a static Vue SPA with no backend and no secrets, and all input from users and from Entur reaches the DOM through Vue text interpolation. There are four low severity items, mostly hardening.

## What was checked

- **XSS.** There is no `v-html`, `innerHTML`, `eval` or `document.write` anywhere. Import link data, Entur notices and stop names are all rendered as text.
- **GraphQL injection.** Quay, line and stop IDs go in as GraphQL variables. Only loop indexes and constants are built into the query string (`src/lib/entur.ts:95-129`, `src/lib/entur.ts:267-275`). Search text goes through `URLSearchParams`.
- **Import link.** `parseConfig` checks every field's type, the transport mode against an allowlist, the time with a regex, and the numbers against `LIMITS`. Nothing is imported until the user confirms.
- **Inline style.** `LineBadge` sets colours with a `:style` object. Vue applies this with `style.setProperty`, so a bad value can't add other CSS rules. The colours also only come from Entur, never from the config (`ConfigView` passes `null`).
- **Secrets.** There are none in the tree or in git history. `ET-Client-Name` is a public identifier, not a credential.
- **Dependencies.** `npm audit` reports 0 vulnerabilities.
- **Geolocation.** Coordinates go only to Entur and are not stored, which matches what the UI tells the user.

## Findings

### 1. The workflow gives Pages permissions to PR builds (low)

`.github/workflows/deploy.yml:9-12` sets `pages: write` and `id-token: write` for the whole workflow. That means the `build` job gets them too, and it runs `npm ci` and `npm test` on pull request code. GitHub reduces these to read-only for PRs from forks, so the risk is limited to branches in this repo. Only the `deploy` job needs them:

```yaml
permissions:
  contents: read

jobs:
  build:
    # unchanged
  deploy:
    permissions:
      pages: write
      id-token: write
```

Related availability bug, not a security issue: `concurrency: group: pages` with `cancel-in-progress: true` puts PR runs in the same group as main. A PR opened while main is deploying can cancel that deploy. Using `group: pages-${{ github.ref }}` fixes it.

Recommendation: fix.

### 2. Actions are pinned by tag (low)

`actions/checkout@v5` and the other actions point to tags, which can be moved. Pinning to commit SHAs blocks a hijacked action from running in the workflow. For a side project the tags are a reasonable tradeoff.

Recommendation: skip unless strict supply chain hygiene is wanted.

### 3. Import links have no size limit (low)

`parseConfig` in `src/lib/config.ts` doesn't cap the number of rows or the string lengths. A crafted link with thousands of rows would make the board send one huge GraphQL query every 30 seconds, under this app's `ET-Client-Name`. It could also fill the localStorage quota. The user has to tap "Bruk dette oppsettet" first, so the realistic impact is a broken board and a misbehaving client name at Entur.

Recommendation: fix with a cap of about 50 rows and about 200 characters per string in `parseRow` and `parseConfig`.

### 4. No Content Security Policy (low, defense in depth)

GitHub Pages can't send headers, but a meta tag in `index.html` works:

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; connect-src https://api.entur.io; style-src 'self' 'unsafe-inline'; img-src 'self' data:">
```

`unsafe-inline` for styles is needed because of Vue's `:style` bindings and scoped styles. Check that the production build still loads before shipping it.

Recommendation: optional.

## Follow-up

- Finding 1: fixed. Only the `deploy` job has `pages: write` and `id-token: write`, and the concurrency group is per ref.
- Finding 2: not fixed, as recommended.
- Finding 3: fixed. `parseConfig` rejects more than 50 rows and strings over 200 characters, and the config page stops at 50 rows.
- Finding 4: fixed. The CSP meta tag is added in production builds only, since it would block Vite's hot reload in dev. Tested with `vite preview`: departures, nearby stops and stop search all load.
