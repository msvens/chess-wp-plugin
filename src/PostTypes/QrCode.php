<?php
/**
 * QR code custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_qr_code post type: a saved QR code is a name (the title)
 * and a target URL (meta rc_qr_url). Storage only: codes are managed in the
 * React QR Codes page (Admin\QrCodeAdmin) over REST, like tournaments, and the
 * QR Code block shows one on a page.
 */
class QrCode {

	public const POST_TYPE = 'rc_qr_code';
	public const META_URL  = 'rc_qr_url';

	/**
	 * Register the post type and its meta.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'                => [
					'name'               => __( 'QR Codes', 'rockaden-chess' ),
					'singular_name'      => __( 'QR Code', 'rockaden-chess' ),
					'menu_name'          => __( 'QR Codes', 'rockaden-chess' ),
					'add_new'            => __( 'Add New QR Code', 'rockaden-chess' ),
					'add_new_item'       => __( 'Add New QR Code', 'rockaden-chess' ),
					'edit_item'          => __( 'Edit QR Code', 'rockaden-chess' ),
					'search_items'       => __( 'Search QR Codes', 'rockaden-chess' ),
					'not_found'          => __( 'No QR codes found.', 'rockaden-chess' ),
					'not_found_in_trash' => __( 'No QR codes found in Trash.', 'rockaden-chess' ),
				],
				'public'                => false,
				'show_ui'               => false, // Managed via React admin page.
				// REST for the QR Codes page and the QR Code block.
				'show_in_rest'          => true,
				// Reads limited to users who can edit posts (see the class).
				'rest_controller_class' => \Rockaden\Api\QrCodeRestController::class,
				'supports'              => [ 'title' ],
				// Standard post capabilities: authors manage their own codes,
				// editors and admins all of them. Creating needs publish_posts so
				// contributors (who have edit_posts) are kept out.
				'capability_type'       => 'post',
				'map_meta_cap'          => true,
				'capabilities'          => [
					'create_posts' => 'publish_posts',
				],
			]
		);

		register_post_meta(
			self::POST_TYPE,
			self::META_URL,
			[
				'type'    => 'string',
				'single'  => true,
				'default' => '',
			]
		);

		// Registered meta only reaches REST when the type supports
		// custom-fields; explicit fields keep the address normalised on write.
		register_rest_field(
			self::POST_TYPE,
			self::META_URL,
			[
				'get_callback'    => static fn( array $post ): string => (string) get_post_meta( (int) $post['id'], self::META_URL, true ),
				'update_callback' => [ self::class, 'rest_update_url' ],
				'schema'          => [
					'description' => 'Target address encoded in the QR code. A site path such as /bli-medlem/ is expanded to a full URL.',
					'type'        => 'string',
					'context'     => [ 'view', 'edit' ],
				],
			]
		);

		// Lets the QR Codes page hide Edit/Delete on codes the user may not
		// change (authors can see every code but edit only their own).
		register_rest_field(
			self::POST_TYPE,
			'rc_can_edit',
			[
				'get_callback' => static fn( array $post ): bool => current_user_can( 'edit_post', (int) $post['id'] ),
				'schema'       => [
					'description' => 'Whether the current user may edit or delete this code.',
					'type'        => 'boolean',
					'readonly'    => true,
					'context'     => [ 'view', 'edit' ],
				],
			]
		);
	}

	/**
	 * Store a code's address sent over REST, normalised like normalize_url().
	 * The posts controller has already checked edit_post for this code.
	 *
	 * @param mixed    $value The address sent.
	 * @param \WP_Post $post  The code being saved.
	 * @return true|\WP_Error
	 */
	public static function rest_update_url( $value, \WP_Post $post ) {
		$raw = is_string( $value ) ? $value : '';
		$url = self::normalize_url( $raw );
		if ( '' === $url && '' !== trim( $raw ) ) {
			return new \WP_Error(
				'rest_invalid_param',
				__( 'Enter a full http(s) address, or a path starting with /.', 'rockaden-chess' ),
				[ 'status' => 400 ]
			);
		}
		update_post_meta( $post->ID, self::META_URL, $url );
		return true;
	}

	/**
	 * Normalise a typed address for storage: a site path such as /bli-medlem/
	 * becomes an absolute URL on this site (a printed code can't be relative);
	 * anything that isn't http(s) becomes ''. js/shared/qr.ts expandPath()
	 * mirrors the path rule for the live preview.
	 *
	 * @param string $value What the user typed.
	 */
	public static function normalize_url( string $value ): string {
		$value = trim( $value );
		if ( str_starts_with( $value, '/' ) && ! str_starts_with( $value, '//' ) ) {
			$value = home_url( $value );
		}
		$scheme = wp_parse_url( $value, PHP_URL_SCHEME );
		if ( ! in_array( $scheme, [ 'http', 'https' ], true ) ) {
			return '';
		}
		return esc_url_raw( $value, [ 'http', 'https' ] );
	}
}
