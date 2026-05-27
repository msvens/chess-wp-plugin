<?php
/**
 * Tournament admin page.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

/**
 * Registers the React-powered tournament manager admin page.
 */
class TournamentAdmin {

	/**
	 * Register the admin menu page.
	 */
	public static function register_page(): void {
		add_menu_page(
			__( 'Tournaments', 'rockaden-chess' ),
			__( 'Tournaments', 'rockaden-chess' ),
			'edit_posts',
			'rockaden-tournaments',
			[ self::class, 'render' ],
			'dashicons-awards',
			31
		);
	}

	/**
	 * Render the tournament manager page.
	 */
	public static function render(): void {
		$asset_file = RC_PLUGIN_DIR . 'build/admin/tournament-manager.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : [
			'dependencies' => [],
			'version'      => RC_VERSION,
		];

		wp_enqueue_script(
			'rockaden-tournament-manager',
			RC_PLUGIN_URL . 'build/admin/tournament-manager.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'rockaden-tournament-manager', 'rockaden-chess', RC_PLUGIN_DIR . 'languages' );

		wp_enqueue_style(
			'rockaden-tournament-manager',
			RC_PLUGIN_URL . 'build/admin/tournament-manager.css',
			[ 'wp-components' ],
			$asset['version']
		);

		wp_localize_script(
			'rockaden-tournament-manager',
			'rockadenTournament',
			[
				'restUrl' => rest_url( 'rockaden/v1/' ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'locale'  => determine_locale(),
				'clubId'  => get_option( 'rockaden_ssf_club_id', '' ),
			]
		);

		echo '<div class="wrap"><div id="rockaden-tournament-root"></div></div>';
	}
}
