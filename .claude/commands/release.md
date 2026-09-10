# Release Command

Create a new release tag and push it:

## Steps

1. **Determine version**
   - Run `git tag --sort=-v:refname | head -1` to find the latest tag
   - If arguments contain a version (e.g., `0.3.0` or `v0.3.0`), use that
   - Otherwise, bump the minor version by 1 (e.g., `v0.1.0` → `v0.2.0`)
   - Ensure the version starts with `v` prefix
   - The bare version (without `v`) is used for file updates

2. **Verify state**
   - Run `git status` to ensure working tree is clean (no uncommitted changes)
   - If dirty, abort and tell user to commit first (suggest `/co`)
   - Confirm we're on `main` branch

3. **Bump version strings in source files**
   Update the version number (without `v` prefix) in:
   - `rockaden-chess.php` — both the `Version:` header comment and the `define( 'RC_VERSION', '...' )` line
   - `phpstan-bootstrap.php` — the `define( 'RC_VERSION', '...' )` line

   Then run `pnpm i18n` and stage the regenerated catalogue alongside them. `wp i18n make-pot`
   builds `Project-Id-Version` from the `Version:` header, so bumping the version without
   regenerating leaves the `.pot` stale. Expect header-only churn: `pnpm run check` already gates
   `i18n:check`, so the strings themselves are in sync by release time. If `pnpm i18n` reports
   anything needing attention, stop — that is untranslated work, not release noise.

   Stage and commit everything with message: `Bump version to <version>`

4. **Show what will be released**
   - Run `git log --oneline <latest-tag>..HEAD` to show commits since last release
   - Display the new version number
   - Ask user to confirm before tagging

5. **Create and push tag**
   - Run `git tag <version>`
   - Run `git push origin main` (push the version bump commit)
   - Run `git push origin <version>` (push the tag)
   - Report success with tag name

## Important

- **The bump commit and the tag go out together.** The update checker falls back to the branch's
  source zip when it finds no release, and that zip has no `vendor/` — so `main` must never sit at a
  version higher than the latest release. Never push a bump without its tag; never push a tag by hand
  outside this flow.
- **Abort if working tree is dirty** — all changes must be committed first
- **Never force-push tags** — if tag exists, abort and inform user
- Tag format is always `vX.Y.Z` (semver with `v` prefix)
- The `.github/workflows/release.yml` will automatically build and create a GitHub Release
- **No Claude attribution** in the version bump commit
- The theme is released separately from its own repository (`rockaden-wp`); the two no longer
  share versions.

## Example usage

```
/release          # Bump minor version (v0.1.0 → v0.2.0)
/release 0.3.0    # Release specific version v0.3.0
/release v1.0.0   # Release specific version v1.0.0
```
