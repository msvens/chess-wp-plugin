import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

export const root = join( dirname( fileURLToPath( import.meta.url ) ), '..', '..' );

/**
 * The one translatable package: this repository, at its root.
 *
 * Kept as a list so the i18n scripts stay identical to the theme's copy
 * (rockaden-wp-theme/scripts) — only this file differs between the two.
 */
export const PACKAGES = [
	{
		name: 'plugin',
		dir: '.',
		domain: 'rockaden-chess',
		// English source, Swedish catalogue.
		locales: [ 'sv_SE' ],
		// build/ holds compiled copies of every render.php — scanning it made the
		// old POT list each block string twice.
		exclude: 'build,node_modules,vendor,docs,dist,scripts',
		// wp-cli parses JavaScript but not TypeScript, and every __() call in the
		// plugin lives in this one .ts file. xgettext handles it; the two POTs are
		// then merged with msgcat.
		tsSources: [ 'js/shared/translations.ts' ],
		// Serve one jed file for all script handles rather than the usual
		// per-script MD5 files — see the pre_load_script_translations filter in
		// rockaden-chess.php.
		jed: true,
	},
];

export const paths = ( pkg, locale ) => ( {
	pkgDir: join( root, pkg.dir ),
	langDir: join( root, pkg.dir, 'languages' ),
	pot: join( root, pkg.dir, 'languages', `${ pkg.domain }.pot` ),
	po: join( root, pkg.dir, 'languages', `${ pkg.domain }-${ locale }.po` ),
	mo: join( root, pkg.dir, 'languages', `${ pkg.domain }-${ locale }.mo` ),
	php: join( root, pkg.dir, 'languages', `${ pkg.domain }-${ locale }.l10n.php` ),
	json: join( root, pkg.dir, 'languages', `${ pkg.domain }-${ locale }.json` ),
	wp: join( root, pkg.dir, 'vendor', 'bin', 'wp' ),
} );
