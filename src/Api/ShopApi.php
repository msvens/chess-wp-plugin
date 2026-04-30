<?php
/**
 * Shop item REST API endpoints.
 *
 * @package Rockaden
 */

namespace Rockaden\Api;

use Rockaden\PostTypes\ShopItem;
use WP_REST_Request;
use WP_REST_Response;

/**
 * Provides REST endpoints for shop items.
 */
class ShopApi {

	private const NAMESPACE = 'rockaden/v1';

	/**
	 * Register REST routes.
	 */
	public static function register_routes(): void {
		register_rest_route(
			self::NAMESPACE,
			'/shop-items',
			[
				'methods'             => 'GET',
				'callback'            => [ self::class, 'list_items' ],
				'permission_callback' => '__return_true',
				'args'                => [
					'count' => [
						'type'        => 'integer',
						'description' => 'Maximum number of items to return.',
						'required'    => false,
						'default'     => 0,
					],
				],
			]
		);
	}

	/**
	 * List published shop items.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function list_items( WP_REST_Request $request ): WP_REST_Response {
		$count = (int) $request->get_param( 'count' );

		$args = [
			'post_type'      => ShopItem::POST_TYPE,
			'post_status'    => 'publish',
			'posts_per_page' => $count > 0 ? $count : -1,
			'orderby'        => 'menu_order date',
			'order'          => 'ASC',
		];

		$posts = get_posts( $args );
		$items = array_map( [ self::class, 'format_item' ], $posts );

		return new WP_REST_Response( $items );
	}

	/**
	 * Format a shop-item post for the API response.
	 *
	 * @param \WP_Post $post The post to format.
	 * @return array<string, mixed>
	 */
	public static function format_item( \WP_Post $post ): array {
		$thumb_id = (int) get_post_thumbnail_id( $post->ID );
		return [
			'id'        => $post->ID,
			'title'     => $post->post_title,
			'permalink' => get_permalink( $post ),
			'excerpt'   => $post->post_excerpt,
			'price'     => get_post_meta( $post->ID, 'rc_price', true ) ?: '',
			'salePrice' => get_post_meta( $post->ID, 'rc_sale_price', true ) ?: '',
			'buyUrl'    => get_post_meta( $post->ID, 'rc_buy_url', true ) ?: '',
			'imageUrl'  => $thumb_id ? wp_get_attachment_image_url( $thumb_id, 'medium' ) : '',
			'imageAlt'  => $thumb_id ? get_post_meta( $thumb_id, '_wp_attachment_image_alt', true ) : '',
		];
	}
}
