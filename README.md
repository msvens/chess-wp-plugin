# Chess Club Manager for schack.se (`rockaden-chess`)

WordPress plugin for Swedish chess clubs: training management, tournaments, a calendar with
recurring events, integration with the Swedish Chess Federation's member system (SSF), and
Gutenberg blocks for all of it. Built for [SK Rockaden](https://rockaden.com) and meant to be
reusable by other clubs.

The club's website theme lives in its own repository:
[rockaden-wp](https://github.com/msvens/rockaden-wp). The plugin does not depend on it.

## Features

- **Training groups** — participants, trainers, a weekly or biweekly schedule with exceptions and
  extra sessions, and per-session attendance.
- **Tournaments** — round-robin with Berger pairings and automatic standings, or standings pulled
  from the federation for an SSF-registered tournament.
- **Calendar** — one-off and recurring events with categories, exclusions and month/week/day views.
  Recurrence is expanded server-side.
- **schack.se (SSF) integration** — club rating lists filtered by period, ELO type and member
  category; tournament and result import. The club ID is the only setting.
- **Nine Gutenberg blocks** — calendar, upcoming events, ranking list, tournament, tournaments,
  standings, training group, training groups and image carousel. All server-rendered, and styled
  from the active theme's palette.
- **Bilingual documentation built in** — twelve guides in Swedish and English, readable inside
  WP Admin, plus a Help page.

The plugin creates a **Documentation** page at `/documentation/`, visible to editors, which renders
those guides with a language toggle. That is the feature guide for site editors; this README is for
developers. The guides' source lives in [`docs/`](docs) as bilingual HTML, which is where to edit
them, not where to read them.

## Requirements

- WordPress 6.5+
- PHP 8.1+

## Installation

1. Download `rockaden-chess.zip` from the [latest release](https://github.com/msvens/chess-wp-plugin/releases/latest)
2. In WP Admin, go to **Plugins → Add New → Upload Plugin** and upload it
3. Activate, then go to **Settings → Chess Club** to configure the SSF club ID

Updates appear in WP Admin like any other plugin (the plugin checks this repository's releases).

## Theming

The plugin's front-end styles use WordPress's standard preset colour variables
(`--wp--preset--color--primary`, `--surface`, `--on-surface`, `--border`, …) with light fallbacks, so
they follow whatever palette the active theme defines. Dark mode works when the theme redefines those
variables under `html.dark`. Strings follow the site locale; the plugin ships Swedish (`sv_SE`) and is
written in English.

## Development

Requires Node.js 22+, pnpm 10+, PHP 8.1+ with Composer, and Docker.

```bash
git clone https://github.com/msvens/chess-wp-plugin.git
cd chess-wp-plugin
pnpm install
composer install
pnpm build
npx wp-env start        # WordPress at http://localhost:8889 (admin/password)
pnpm dev                # JS hot-reload (wp-scripts watch)
```

`.wp-env.json` mounts this directory as `wp-content/plugins/rockaden-chess` and the theme from a
sibling checkout at `../rockaden-wp` as `wp-content/themes/rockaden-theme`, the same names as on a
real site, so the local site looks like rockaden.com. Clone the theme beside this repository, or drop
the theme mapping to develop against a stock theme. On first start activate both once:

```bash
npx wp-env run cli wp plugin activate rockaden-chess
npx wp-env run cli wp theme activate rockaden-theme
```

PHP changes are instant (the plugin directory is mounted).

### First-time setup

After starting wp-env for the first time, enable pretty permalinks for the REST API:

```bash
npx wp-env run cli wp rewrite structure '/%postname%/'
npx wp-env run cli wp rewrite flush --hard
```

### Quality checks

```bash
pnpm run check     # TypeScript + ESLint + PHPStan/phpcs + translations + build
```

### Translations

Source strings are English; the catalogue is `languages/rockaden-chess-sv_SE.po`, the only file you
edit. Everything else is generated:

```bash
pnpm i18n          # re-extract, merge into the .po, regenerate .mo/.l10n.php/.json
pnpm i18n:check    # verify nothing has drifted (runs in `check` and CI)
```

**After adding or changing a user-facing string, run `pnpm i18n`**, then fill in any untranslated
entries in the `.po` and run it again. WordPress 6.5+ reads the generated `.l10n.php` in preference
to the `.mo`, so a string translated only in the `.po` still renders in English; `pnpm i18n:check`
fails on exactly that. `msgmerge` may mark a reworded string **fuzzy** with a guessed translation;
fuzzy entries are excluded from the compiled catalogue, so review every one.

Regenerating needs `vendor/bin/wp` (`composer install`) and GNU gettext (`brew install gettext`).
Checking needs neither, which is why CI only runs the check. The plugin serves **one** jed file for
every script handle via a `pre_load_script_translations` filter rather than per-script MD5 files.
The bundled documentation ships both languages as `rc-doc-sv` / `rc-doc-en` elements toggled by CSS.

### Build & package

```bash
pnpm build              # Build JS
pnpm package            # Build + create dist/rockaden-chess.zip (root folder = install slug)
```

### Creating a release

Bump `Version:` and `RC_VERSION` in `rockaden-chess.php` and `RC_VERSION` in
`phpstan-bootstrap.php`, run `pnpm i18n`, commit, then tag and push — GitHub Actions builds the zip
and publishes a release:

```bash
git tag v0.46.0
git push origin main v0.46.0
```

Never push a version bump to `main` without tagging it: the update checker falls back to the
branch's source zip if it finds no release, and that zip has no `vendor/`.

### Project structure

```
chess-wp-plugin/
├── rockaden-chess.php   Plugin entry point + autoloader
├── src/                 PHP classes (PSR-4 autoloaded under Rockaden\)
├── js/                  TypeScript source (admin UI, blocks, shared utilities)
├── build/               Compiled JS (generated by wp-scripts)
├── docs/                Bundled documentation (sv/en)
├── languages/           Catalogues (.po is the source; the rest is generated)
└── scripts/             i18n + packaging scripts
```

## License

[MIT](LICENSE)
