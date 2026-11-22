<?php
/**
 * QR Codes admin page (React app).
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

/**
 * Registers the QR Codes menu page and boots the React manager
 * (js/admin/qr-manager.tsx), the same way the Tournaments page works.
 */
class QrCodeAdmin {

	/**
	 * Register the admin menu page. Authors and up: creating a code needs
	 * publish_posts (see PostTypes\QrCode).
	 */
	public static function register_page(): void {
		add_menu_page(
			__( 'QR Codes', 'rockaden-chess' ),
			__( 'QR Codes', 'rockaden-chess' ),
			'publish_posts',
			'rockaden-qr-codes',
			[ self::class, 'render' ],
			'dashicons-screenoptions',
			33
		);
	}

	/**
	 * Render the QR code manager page.
	 */
	public static function render(): void {
		$asset_file = RC_PLUGIN_DIR . 'build/admin/qr-manager.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : [
			'dependencies' => [],
			'version'      => RC_VERSION,
		];

		wp_enqueue_script(
			'rockaden-qr-manager',
			RC_PLUGIN_URL . 'build/admin/qr-manager.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_set_script_translations( 'rockaden-qr-manager', 'rockaden-chess', RC_PLUGIN_DIR . 'languages' );

		wp_enqueue_style(
			'rockaden-qr-manager',
			RC_PLUGIN_URL . 'build/admin/qr-manager.css',
			[ 'wp-components' ],
			$asset['version']
		);

		wp_localize_script(
			'rockaden-qr-manager',
			'rockadenQr',
			[
				'siteUrl' => home_url( '/' ),
				'locale'  => determine_locale(),
			]
		);

		echo '<div class="wrap"><div id="rockaden-qr-root"></div></div>';
	}
}
