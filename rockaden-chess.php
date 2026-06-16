<?php
/**
 * Plugin Name: Rockaden Chess
 * Plugin URI:  https://github.com/msvens/rockaden-wp
 * Description: Training management, calendar, and SSF integration for SK Rockaden.
 * Version:     0.28.0
 * Author:      SK Rockaden
 * Text Domain: rockaden-chess
 * Domain Path: /languages
 * Requires at least: 6.5
 * Requires PHP: 8.1
 * License:       MIT
 *
 * @package Rockaden
 */

defined( 'ABSPATH' ) || exit;

define( 'RC_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'RC_PLUGIN_URL', plugin_dir_url( __FILE__ ) );
define( 'RC_VERSION', '0.28.0' );

// GitHub-based update checker. Reads release assets from the rockaden-wp
// repository and lets WordPress show the standard "update available" UI in
// Plugins. Pre-releases on GitHub are skipped automatically.
if ( file_exists( RC_PLUGIN_DIR . 'vendor/autoload.php' ) ) {
	require_once RC_PLUGIN_DIR . 'vendor/autoload.php';

	$rc_update_checker = YahnisElsts\PluginUpdateChecker\v5\PucFactory::buildUpdateChecker(
		'https://github.com/msvens/rockaden-wp/',
		__FILE__,
		'rockaden-chess'
	);
	/**
	 * Narrow the VCS API type so static analysis can see the GitHub-specific methods.
	 *
	 * @var \YahnisElsts\PluginUpdateChecker\v5p6\Vcs\GitHubApi $rc_vcs_api
	 */
	$rc_vcs_api = $rc_update_checker->getVcsApi();
	$rc_vcs_api->enableReleaseAssets( '/rockaden-chess\.zip$/' );
}

// PSR-4-style autoloader for plugin classes.
spl_autoload_register(
	function ( string $classname ): void {
		$prefix = 'Rockaden\\';
		if ( ! str_starts_with( $classname, $prefix ) ) {
			return;
		}

		$relative = substr( $classname, strlen( $prefix ) );
		$file     = RC_PLUGIN_DIR . 'src/' . str_replace( '\\', '/', $relative ) . '.php';

		if ( file_exists( $file ) ) {
			require_once $file;
		}
	}
);

// Load translations (English-source msgids; ships sv_SE.mo for Swedish).
// Direct load_textdomain on init priority 1 — load_plugin_textdomain isn't
// reliable in WP 6.5+ for non-global plugin language directories, and the
// textdomain must be loaded before block patterns/render fire on init.
add_action(
	'init',
	function (): void {
		$locale = determine_locale();
		$mofile = RC_PLUGIN_DIR . 'languages/rockaden-chess-' . $locale . '.mo';
		if ( file_exists( $mofile ) ) {
			load_textdomain( 'rockaden-chess', $mofile, $locale );
		}
	},
	1
);

// Boot plugin.
add_action( 'init', [ Rockaden\PostTypes\TrainingGroup::class, 'register' ] );
add_action( 'init', [ Rockaden\PostTypes\TrainingSession::class, 'register' ] );
add_action( 'init', [ Rockaden\PostTypes\Tournament::class, 'register' ] );
add_action( 'init', [ Rockaden\PostTypes\Event::class, 'register' ] );

add_action( 'rest_api_init', [ Rockaden\Api\SsfProxy::class, 'register_routes' ] );
add_action( 'rest_api_init', [ Rockaden\Api\TrainingApi::class, 'register_routes' ] );
add_action( 'rest_api_init', [ Rockaden\Api\TournamentApi::class, 'register_routes' ] );
add_action( 'rest_api_init', [ Rockaden\Api\EventApi::class, 'register_routes' ] );

add_action( 'admin_menu', [ Rockaden\Admin\TrainingAdmin::class, 'register_page' ] );
add_action( 'admin_menu', [ Rockaden\Admin\TournamentAdmin::class, 'register_page' ] );
add_action( 'admin_menu', [ Rockaden\Admin\SettingsPage::class, 'register_page' ] );
add_action( 'admin_menu', [ Rockaden\Admin\HelpPage::class, 'register_page' ] );

// WP-CLI commands.
if ( defined( 'WP_CLI' ) && WP_CLI ) {
	Rockaden\Cli\TournamentMigration::register();
}

Rockaden\Admin\EventMetaBoxes::register();

// Add "Settings" link on the Plugins page.
add_filter(
	'plugin_action_links_' . plugin_basename( __FILE__ ),
	function ( array $links ): array {
		$url           = admin_url( 'options-general.php?page=rockaden-chess-settings' );
		$settings_link = sprintf( '<a href="%s">%s</a>', esc_url( $url ), esc_html__( 'Settings', 'rockaden-chess' ) );
		$links[]       = $settings_link;

		$help_url  = admin_url( 'admin.php?page=rockaden-chess-help' );
		$help_link = sprintf( '<a href="%s">%s</a>', esc_url( $help_url ), esc_html__( 'Help', 'rockaden-chess' ) );
		$links[]   = $help_link;

		return $links;
	}
);

// Documentation: rewrite rules + query var.
add_action( 'init', [ 'Rockaden\Docs\DocsPageSetup', 'register_rewrites' ], 5 );
add_filter( 'query_vars', [ 'Rockaden\Docs\DocsPageSetup', 'add_query_var' ] );

// Documentation: create page on first run.
add_action( 'init', [ 'Rockaden\Docs\DocsPageSetup', 'maybe_create_page' ], 15 );

// Documentation: register plugin docs, then let theme add theirs.
add_action(
	'init',
	function (): void {
		$docs_dir = RC_PLUGIN_DIR . 'docs/';
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'kom-igang',
				'title_sv'   => 'Kom igång',
				'title_en'   => 'Getting started',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'kom-igang.html',
				'order'      => 10,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'sidor-och-monster',
				'title_sv'   => 'Sidor och mönster',
				'title_en'   => 'Pages and patterns',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'sidor-och-monster.html',
				'order'      => 15,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'kalender',
				'title_sv'   => 'Kalender',
				'title_en'   => 'Calendar',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'kalender.html',
				'order'      => 20,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'traning',
				'title_sv'   => 'Träning',
				'title_en'   => 'Training',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'traning.html',
				'order'      => 30,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'turnering',
				'title_sv'   => 'Turnering',
				'title_en'   => 'Tournaments',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'turnering.html',
				'order'      => 35,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'block',
				'title_sv'   => 'Block',
				'title_en'   => 'Blocks',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'block.html',
				'order'      => 40,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'bildkarusell',
				'title_sv'   => 'Bildkarusell',
				'title_en'   => 'Image Carousel',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'bildkarusell.html',
				'order'      => 45,
			]
		);

		// How-Tos: task-oriented step guides.
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-veckotraning',
				'title_sv'   => 'Skapa en veckoträning',
				'title_en'   => 'Create a weekly training',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-veckotraning.html',
				'order'      => 10,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-traningspass',
				'title_sv'   => 'Registrera ett träningspass',
				'title_en'   => 'Record a training session',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-traningspass.html',
				'order'      => 15,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-ssf-turnering',
				'title_sv'   => 'Lägg till en SSF-turnering i kalendern',
				'title_en'   => 'Add an SSF tournament to the calendar',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-ssf-turnering.html',
				'order'      => 20,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-turnering-resultat',
				'title_sv'   => 'Kör en turnering: ronder och resultat',
				'title_en'   => 'Run a tournament: rounds & results',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-turnering-resultat.html',
				'order'      => 25,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-aterkommande-handelse',
				'title_sv'   => 'Lägg till en återkommande händelse',
				'title_en'   => 'Add a recurring event',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-aterkommande-handelse.html',
				'order'      => 30,
			]
		);
		Rockaden\Docs\DocsRegistry::register(
			[
				'slug'       => 'guide-block-pa-sidor',
				'title_sv'   => 'Lägg till block på en sida',
				'title_en'   => 'Add blocks to a page',
				'section_sv' => 'How-Tos',
				'section_en' => 'How-Tos',
				'file'       => $docs_dir . 'guide-block-pa-sidor.html',
				'order'      => 50,
			]
		);

		do_action( 'rc_register_docs' );
	},
	20
);

// Register Gutenberg blocks, and wire up JS translations for each block's
// editor + view scripts so `__( 'English', 'rockaden-chess' )` calls inside
// React resolve to Swedish under the sv_SE locale.
add_action(
	'init',
	function (): void {
		$blocks    = [ 'calendar', 'carousel', 'documentation', 'latest-news', 'ranking-list', 'standings', 'tournament', 'tournaments', 'training-group', 'training-groups', 'upcoming-events' ];
		$lang_path = RC_PLUGIN_DIR . 'languages';
		foreach ( $blocks as $block ) {
			$block_dir = RC_PLUGIN_DIR . "src/Blocks/{$block}";
			if ( ! file_exists( "{$block_dir}/block.json" ) ) {
				continue;
			}
			$block_type = register_block_type( $block_dir );
			if ( ! $block_type instanceof WP_Block_Type ) {
				continue;
			}
			$handles = array_merge( $block_type->editor_script_handles, $block_type->view_script_handles );
			foreach ( $handles as $handle ) {
				wp_set_script_translations( $handle, 'rockaden-chess', $lang_path );
			}
		}
	}
);

// All plugin block + admin scripts use the same set of __() strings (they all
// import plugin/js/shared/translations.ts). Rather than fan out one JSON per
// script-file MD5 (the default convention), serve a single jed-format JSON
// for any handle requesting the rockaden-chess domain.
add_filter(
	'pre_load_script_translations',
	function ( $translations, $file, $handle, $domain ) {
		if ( 'rockaden-chess' !== $domain ) {
			return $translations;
		}
		static $cache = [];
		$locale       = determine_locale();
		if ( ! array_key_exists( $locale, $cache ) ) {
			$json             = RC_PLUGIN_DIR . 'languages/rockaden-chess-' . $locale . '.json';
			$decoded          = file_exists( $json ) ? wp_json_file_decode( $json, [ 'associative' => true ] ) : null;
			$cache[ $locale ] = null === $decoded ? false : wp_json_encode( $decoded );
		}
		return false !== $cache[ $locale ] ? $cache[ $locale ] : $translations;
	},
	10,
	4
);

// Flush rewrite rules on activation so CPT permalinks (e.g. /tournaments/...) start working immediately.
register_activation_hook(
	__FILE__,
	function (): void {
		Rockaden\PostTypes\TrainingGroup::register();
		Rockaden\PostTypes\TrainingSession::register();
		Rockaden\PostTypes\Tournament::register();
		Rockaden\PostTypes\Event::register();
		flush_rewrite_rules();
	}
);

register_deactivation_hook( __FILE__, 'flush_rewrite_rules' );
