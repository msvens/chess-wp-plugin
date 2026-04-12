<?php
/**
 * Plugin Name: Rockaden Chess
 * Plugin URI:  https://github.com/msvens/rockaden-wp
 * Description: Training management, calendar, and SSF integration for SK Rockaden.
 * Version:     0.10.0
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
define( 'RC_VERSION', '0.10.0' );

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

// Boot plugin.
add_action( 'init', [ Rockaden\PostTypes\TrainingGroup::class, 'register' ] );
add_action( 'init', [ Rockaden\PostTypes\TrainingSession::class, 'register' ] );
add_action( 'init', [ Rockaden\PostTypes\Event::class, 'register' ] );

add_action( 'rest_api_init', [ Rockaden\Api\SsfProxy::class, 'register_routes' ] );
add_action( 'rest_api_init', [ Rockaden\Api\TrainingApi::class, 'register_routes' ] );
add_action( 'rest_api_init', [ Rockaden\Api\EventApi::class, 'register_routes' ] );

add_action( 'admin_menu', [ Rockaden\Admin\TrainingAdmin::class, 'register_page' ] );
add_action( 'admin_menu', [ Rockaden\Admin\SettingsPage::class, 'register_page' ] );
add_action( 'admin_menu', [ Rockaden\Admin\HelpPage::class, 'register_page' ] );

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
				'slug'       => 'block',
				'title_sv'   => 'Block',
				'title_en'   => 'Blocks',
				'section_sv' => 'Plugin',
				'section_en' => 'Plugin',
				'file'       => $docs_dir . 'block.html',
				'order'      => 40,
			]
		);

		do_action( 'rc_register_docs' );
	},
	20
);

// Register Gutenberg blocks.
add_action(
	'init',
	function (): void {
		$blocks = [ 'calendar', 'documentation', 'ranking-list', 'standings', 'training-group', 'training-groups' ];
		foreach ( $blocks as $block ) {
			$block_dir = RC_PLUGIN_DIR . "src/Blocks/{$block}";
			if ( file_exists( "{$block_dir}/block.json" ) ) {
				register_block_type( $block_dir );
			}
		}
	}
);
