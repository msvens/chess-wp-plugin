<?php
/**
 * Shop item custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_shop_item post type and its meta fields.
 *
 * Represents purchasable chess equipment (boards, clocks, sets) that members
 * can buy through the club. Uses the standard WP post editor — kept simple
 * so admins can add items without learning a custom React UI.
 */
class ShopItem {

	public const POST_TYPE = 'rc_shop_item';

	/**
	 * Register the post type.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Shop Items', 'rockaden-chess' ),
					'singular_name' => __( 'Shop Item', 'rockaden-chess' ),
					'add_new_item'  => __( 'Add New Shop Item', 'rockaden-chess' ),
					'edit_item'     => __( 'Edit Shop Item', 'rockaden-chess' ),
				],
				'public'       => true,
				'show_ui'      => true,
				'show_in_rest' => true,
				'supports'     => [ 'title', 'editor', 'thumbnail', 'excerpt' ],
				'has_archive'  => true,
				'menu_icon'    => 'dashicons-cart',
				'rewrite'      => [ 'slug' => 'schackmaterial' ],
			]
		);

		self::register_meta();
	}

	/**
	 * Register post meta fields.
	 */
	private static function register_meta(): void {
		$meta_fields = [
			'rc_price'      => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_sale_price' => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_buy_url'    => [
				'type'    => 'string',
				'default' => '',
			],
		];

		foreach ( $meta_fields as $key => $args ) {
			register_post_meta(
				self::POST_TYPE,
				$key,
				[
					'show_in_rest'  => true,
					'single'        => true,
					'type'          => $args['type'],
					'default'       => $args['default'],
					'auth_callback' => fn () => current_user_can( 'edit_posts' ),
				]
			);
		}
	}
}
