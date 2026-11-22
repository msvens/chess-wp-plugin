<?php
/**
 * REST controller for rc_qr_code.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

/**
 * The standard posts controller, except that reading QR codes requires being
 * able to edit posts. Core lets anyone read published posts of a non-public
 * type over REST; QR codes are only needed by the block editor, and a club
 * may point a code at an address it doesn't link anywhere else.
 */
class QrCodeRestController extends \WP_REST_Posts_Controller {

	/**
	 * Listing codes requires edit_posts.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return true|\WP_Error
	 */
	public function get_items_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return $this->forbidden();
		}
		return parent::get_items_permissions_check( $request );
	}

	/**
	 * Reading a single code requires edit_posts.
	 *
	 * @param \WP_REST_Request $request Full details about the request.
	 * @return bool|\WP_Error
	 */
	public function get_item_permissions_check( $request ) {
		if ( ! current_user_can( 'edit_posts' ) ) {
			return $this->forbidden();
		}
		return parent::get_item_permissions_check( $request );
	}

	/**
	 * The error for a read without permission.
	 */
	private function forbidden(): \WP_Error {
		return new \WP_Error(
			'rest_forbidden',
			__( 'Sorry, you are not allowed to view QR codes.', 'rockaden-chess' ),
			[ 'status' => rest_authorization_required_code() ]
		);
	}
}
