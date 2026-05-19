<?php
/**
 * Shop item meta box for price + buy URL fields.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

use Rockaden\PostTypes\ShopItem;

/**
 * Renders price and buy-URL fields in a side meta box on the shop-item editor.
 */
class ShopItemMetaBox {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'add_meta_boxes', [ self::class, 'add_meta_box' ] );
		add_action( 'save_post_' . ShopItem::POST_TYPE, [ self::class, 'save' ], 10, 2 );
	}

	/**
	 * Register the meta box.
	 */
	public static function add_meta_box(): void {
		add_meta_box(
			'rc_shop_item_pricing',
			__( 'Pricing & Purchase', 'rockaden-chess' ),
			[ self::class, 'render' ],
			ShopItem::POST_TYPE,
			'side',
			'high'
		);
	}

	/**
	 * Render the meta box.
	 *
	 * @param \WP_Post $post The current post object.
	 */
	public static function render( \WP_Post $post ): void {
		wp_nonce_field( 'rc_shop_item_meta', 'rc_shop_item_meta_nonce' );

		$price        = get_post_meta( $post->ID, 'rc_price', true );
		$sale_price   = get_post_meta( $post->ID, 'rc_sale_price', true );
		$buy_url      = get_post_meta( $post->ID, 'rc_buy_url', true );
		$stock_status = get_post_meta( $post->ID, 'rc_stock_status', true ) ?: 'in_stock';
		$how_to_order = get_post_meta( $post->ID, 'rc_how_to_order', true );
		?>
		<p>
			<label for="rc_price"><strong><?php esc_html_e( 'Price', 'rockaden-chess' ); ?></strong></label><br />
			<input type="text" id="rc_price" name="rc_price" value="<?php echo esc_attr( $price ); ?>" class="widefat" placeholder="910 kr" />
		</p>
		<p>
			<label for="rc_sale_price"><strong><?php esc_html_e( 'Sale price', 'rockaden-chess' ); ?></strong></label><br />
			<input type="text" id="rc_sale_price" name="rc_sale_price" value="<?php echo esc_attr( $sale_price ); ?>" class="widefat" placeholder="780 kr" />
			<span class="description"><?php esc_html_e( 'Optional. When set, the regular price is shown struck through.', 'rockaden-chess' ); ?></span>
		</p>
		<p>
			<label for="rc_buy_url"><strong><?php esc_html_e( 'Buy URL', 'rockaden-chess' ); ?></strong></label><br />
			<input type="url" id="rc_buy_url" name="rc_buy_url" value="<?php echo esc_attr( $buy_url ); ?>" class="widefat" placeholder="https://…" />
		</p>
		<p>
			<label for="rc_stock_status"><strong><?php esc_html_e( 'Stock status', 'rockaden-chess' ); ?></strong></label><br />
			<select id="rc_stock_status" name="rc_stock_status" class="widefat">
				<option value="in_stock" <?php selected( $stock_status, 'in_stock' ); ?>><?php esc_html_e( 'In stock', 'rockaden-chess' ); ?></option>
				<option value="out_of_stock" <?php selected( $stock_status, 'out_of_stock' ); ?>><?php esc_html_e( 'Out of stock', 'rockaden-chess' ); ?></option>
			</select>
		</p>
		<p>
			<label for="rc_how_to_order"><strong><?php esc_html_e( 'How to order', 'rockaden-chess' ); ?></strong></label><br />
			<textarea id="rc_how_to_order" name="rc_how_to_order" rows="3" class="widefat" placeholder="<?php esc_attr_e( 'e.g. Come to the club to buy, or email …', 'rockaden-chess' ); ?>"><?php echo esc_textarea( $how_to_order ); ?></textarea>
			<span class="description"><?php esc_html_e( 'Optional. Shown on the public shop card when set.', 'rockaden-chess' ); ?></span>
		</p>
		<?php
	}

	/**
	 * Save meta box fields.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 */
	public static function save( int $post_id, \WP_Post $post ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by save_post hook signature.
		if ( ! isset( $_POST['rc_shop_item_meta_nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rc_shop_item_meta_nonce'] ) ), 'rc_shop_item_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		update_post_meta( $post_id, 'rc_price', sanitize_text_field( wp_unslash( $_POST['rc_price'] ?? '' ) ) );
		update_post_meta( $post_id, 'rc_sale_price', sanitize_text_field( wp_unslash( $_POST['rc_sale_price'] ?? '' ) ) );
		update_post_meta( $post_id, 'rc_buy_url', esc_url_raw( wp_unslash( $_POST['rc_buy_url'] ?? '' ) ) );

		$stock_status = sanitize_text_field( wp_unslash( $_POST['rc_stock_status'] ?? 'in_stock' ) );
		if ( ! in_array( $stock_status, [ 'in_stock', 'out_of_stock' ], true ) ) {
			$stock_status = 'in_stock';
		}
		update_post_meta( $post_id, 'rc_stock_status', $stock_status );
		update_post_meta( $post_id, 'rc_how_to_order', sanitize_textarea_field( wp_unslash( $_POST['rc_how_to_order'] ?? '' ) ) );
	}
}
