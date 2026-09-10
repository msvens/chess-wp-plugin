# chess-wp-plugin

WordPress plugin `rockaden-chess` for Swedish chess clubs, built for SK Rockaden (Stockholm) and
meant to be reusable by other clubs. This repository holds only the plugin; the club's block theme
lives in `rockaden-wp` (sibling checkout `../rockaden-wp`). The plugin never depends on
the theme. The theme places some plugin blocks by name and provides templates for the plugin's post
types, so **block names, post-type slugs, meta keys and REST routes are public API — keep them stable.**

Package manager: **pnpm** (single package, at the repository root). No workspace.

## Origin

Ported from `/Users/msvens/projects/github.com/msvens/rockaden2` (PayloadCMS + Next.js POC).
`js/shared/` contains framework-agnostic logic copied from that project.

## Architecture

- **PSR-4 autoloader** in `rockaden-chess.php`, namespace `Rockaden\`
- **Custom Post Types**: `rc_training_group`, `rc_training_session`, `rc_event`, `rc_tournament` —
  all data stored as post meta (JSON strings for arrays)
- **REST API** (`/wp-json/rockaden/v1/`):
  - `ssf/{path}` — Proxy to member.schack.se (solves CORS). SSF logic is client-side only.
  - `training-groups`, `training-groups/{id}`, participants, sessions CRUD
  - `training-sessions/{id}/attendance`, `/games/{idx}`, `/notes`
  - `tournaments`, `events?month=YYYY-MM` — with server-side recurring event expansion
- **Admin pages**: React training manager, tournament manager, Settings page (SSF club ID), Help
- **Gutenberg blocks** (`src/Blocks/*/block.json`, registered in `rockaden-chess.php`): calendar,
  carousel, documentation, ranking-list, standings, tournament, tournaments, training-group,
  training-groups, upcoming-events. Server `render.php` + optional built `view.js`.
- **wp-scripts** build with custom `webpack.config.js` (explicit entry map — add an entry per new
  editor/view script)
- **Shared TypeScript** (`js/shared/`): `roundRobin.ts` (Berger pairings + standings),
  `expandRecurringEvents.ts`, `deriveStatus.ts`, `overviewFields.ts`, `participantsVisible.ts`,
  `translations.ts` (every `__()` string used by React lives here; the i18n script extracts TS from
  this one file only), `types.ts`
- **Docs**: `docs/*.html` bundled sv/en pages rendered by the documentation block; the theme
  registers its own pages through the `rc_register_docs` action.

## Development

```bash
pnpm install && composer install
npx wp-env start          # WordPress at http://localhost:8889 (admin/password); mounts ../rockaden-wp
pnpm dev                  # wp-scripts watch
# PHP changes are instant (mounted by wp-env)
```

Requires Docker running.

## Build & quality

```bash
pnpm run check            # typecheck + eslint + PHPStan/phpcs + i18n:check + build — must be green before commit
pnpm package              # dist/rockaden-chess.zip with root folder rockaden-chess (the install slug)
pnpm i18n                 # regenerate catalogues; edit only languages/rockaden-chess-sv_SE.po; read every fuzzy
```

- PHP: PHPStan level 6 (`phpstan.neon`, bootstrap `phpstan-bootstrap.php` for runtime constants) +
  phpcs WordPress standard (`phpcs.xml`, text domain `rockaden-chess`)
- ESLint: `.eslintrc.json` extends WP recommended; TypeScript via wp-scripts/Babel
- Never add phpstan-ignore / phpcs:ignore / eslint-disable / @ts-ignore silently — discuss first
- `pnpm package` runs `composer install --no-dev`; re-run `composer install` afterwards

## Release

`/release` bumps `Version:` + `RC_VERSION` in `rockaden-chess.php` and `RC_VERSION` in
`phpstan-bootstrap.php`, regenerates catalogues, commits, tags `vX.Y.Z` and pushes; `release.yml`
builds the zip and creates the GitHub Release. Sites update through the plugin-update-checker, which
reads this repository's releases (asset `rockaden-chess.zip`, `REQUIRE_RELEASE_ASSETS`).
**Never push a version bump to `main` without its tag, and never push tags by hand**: with no
release the checker falls back to the branch source zip, which has no `vendor/`.

## Conventions
- PHP: PSR-4 namespacing under `Rockaden\`, meta keys prefixed `rc_`
- REST: namespace `rockaden/v1`, editor capability for writes, public reads
- JSON meta: participants, attendance, games stored as JSON strings in post_meta
- Front-end CSS uses `var(--wp--preset--color--*, fallback)` so any theme's palette applies; dark
  mode comes from the theme redefining those variables under `html.dark`
- Git: never commit, push or open PRs without an explicit request; one PR at a time; no Claude
  attribution in commit messages
