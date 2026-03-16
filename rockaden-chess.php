<?php
/**
 * Plugin Name: Rockaden Chess
 * Plugin URI:  https://github.com/msvens/rockaden-wp
 * Description: Training management, calendar, and SSF integration for SK Rockaden.
 * Version:     0.8.0
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
define( 'RC_VERSION', '0.8.0' );

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

Rockaden\Admin\EventMetaBoxes::register();

// Register Gutenberg blocks.
add_action(
	'init',
	function (): void {
		$blocks = [ 'calendar', 'ranking-list', 'standings', 'training-group', 'training-groups' ];
		foreach ( $blocks as $block ) {
			$block_dir = RC_PLUGIN_DIR . "src/Blocks/{$block}";
			if ( file_exists( "{$block_dir}/block.json" ) ) {
				register_block_type( $block_dir );
			}
		}
	}
);
