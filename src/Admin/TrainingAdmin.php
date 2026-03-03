<?php
/**
 * Training admin page.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

/**
 * Registers the React-powered training manager admin page.
 */
class TrainingAdmin {

	/**
	 * Register the admin menu page.
	 */
	public static function register_page(): void {
		add_menu_page(
			__( 'Training', 'rockaden-chess' ),
			__( 'Training', 'rockaden-chess' ),
			'edit_posts',
			'rockaden-training',
			[ self::class, 'render' ],
			'dashicons-groups',
			30
		);
	}

	/**
	 * Render the training manager page.
	 */
	public static function render(): void {
		// Enqueue the React app.
		$asset_file = RC_PLUGIN_DIR . 'build/admin/training-manager.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : [
			'dependencies' => [],
			'version'      => RC_VERSION,
		];

		wp_enqueue_script(
			'rockaden-training-manager',
			RC_PLUGIN_URL . 'build/admin/training-manager.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'rockaden-training-manager',
			RC_PLUGIN_URL . 'build/admin/training-manager.css',
			[ 'wp-components' ],
			$asset['version']
		);

		wp_localize_script(
			'rockaden-training-manager',
			'rockadenTraining',
			[
				'restUrl' => rest_url( 'rockaden/v1/' ),
				'nonce'   => wp_create_nonce( 'wp_rest' ),
				'locale'  => determine_locale(),
				'clubId'  => get_option( 'rockaden_ssf_club_id', '' ),
			]
		);

		echo '<div class="wrap"><div id="rockaden-training-root"></div></div>';
	}
}
