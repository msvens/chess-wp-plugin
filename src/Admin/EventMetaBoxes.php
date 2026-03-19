<?php
/**
 * Event editor form rendered after the title input.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

use Rockaden\PostTypes\Event;

/**
 * Renders a focused event editor form via the edit_form_after_title hook.
 */
class EventMetaBoxes {

	/**
	 * Register hooks.
	 */
	public static function register(): void {
		add_action( 'edit_form_after_title', [ self::class, 'render' ] );
		add_action( 'save_post_' . Event::POST_TYPE, [ self::class, 'save' ], 10, 2 );
		add_action( 'admin_enqueue_scripts', [ self::class, 'enqueue_assets' ] );
	}

	/**
	 * Enqueue editor assets for the event post type.
	 *
	 * @param string $hook The current admin page hook suffix.
	 */
	public static function enqueue_assets( string $hook ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found -- Required by admin_enqueue_scripts.
		$screen = get_current_screen();
		if ( ! $screen || Event::POST_TYPE !== $screen->post_type ) {
			return;
		}

		$asset_file = RC_PLUGIN_DIR . 'build/admin/event-metabox.asset.php';
		$asset      = file_exists( $asset_file ) ? require $asset_file : [
			'dependencies' => [],
			'version'      => RC_VERSION,
		];

		wp_enqueue_script(
			'rockaden-event-metabox',
			RC_PLUGIN_URL . 'build/admin/event-metabox.js',
			$asset['dependencies'],
			$asset['version'],
			true
		);

		wp_enqueue_style(
			'rockaden-event-metabox',
			RC_PLUGIN_URL . 'build/admin/event-metabox.css',
			[],
			$asset['version']
		);
	}

	/**
	 * Render the event editor form.
	 *
	 * @param \WP_Post $post The current post object.
	 */
	public static function render( \WP_Post $post ): void {
		if ( Event::POST_TYPE !== $post->post_type ) {
			return;
		}

		wp_nonce_field( 'rc_event_meta', 'rc_event_meta_nonce' );

		$start_date        = get_post_meta( $post->ID, 'rc_start_date', true );
		$end_date          = get_post_meta( $post->ID, 'rc_end_date', true );
		$location          = get_post_meta( $post->ID, 'rc_location', true );
		$category          = get_post_meta( $post->ID, 'rc_category', true ) ?: 'other';
		$link              = get_post_meta( $post->ID, 'rc_link', true );
		$link_label        = get_post_meta( $post->ID, 'rc_link_label', true );
		$is_recurring      = (bool) get_post_meta( $post->ID, 'rc_is_recurring', true );
		$recurrence_type   = get_post_meta( $post->ID, 'rc_recurrence_type', true ) ?: 'weekly';
		$excluded_dates    = get_post_meta( $post->ID, 'rc_excluded_dates', true ) ?: '[]';
		$excluded_str      = implode( ', ', json_decode( $excluded_dates, true ) ?: [] );
		$ssf_group_id      = absint( get_post_meta( $post->ID, 'rc_ssf_group_id', true ) );
		$ssf_tournament_id = absint( get_post_meta( $post->ID, 'rc_ssf_tournament_id', true ) );

		$categories = [
			'training'    => __( 'Training', 'rockaden-chess' ),
			'tournament'  => __( 'Tournament', 'rockaden-chess' ),
			'junior'      => __( 'Junior', 'rockaden-chess' ),
			'allsvenskan' => __( 'Allsvenskan', 'rockaden-chess' ),
			'skolschack'  => __( 'School Chess', 'rockaden-chess' ),
			'other'       => __( 'Other', 'rockaden-chess' ),
		];

		$start_local = $start_date ? gmdate( 'Y-m-d H:i', strtotime( $start_date ) ) : '';
		$end_local   = $end_date ? gmdate( 'Y-m-d H:i', strtotime( $end_date ) ) : '';
		?>
		<div id="rc-event-editor">

			<div class="rc-event-section rc-ssf-section">
				<h3><?php esc_html_e( 'SSF Import', 'rockaden-chess' ); ?></h3>
				<?php if ( $ssf_group_id ) : ?>
					<p class="rc-ssf-linked">
						<?php
						printf(
							/* translators: %d: SSF group ID */
							esc_html__( 'Linked to SSF group %d', 'rockaden-chess' ),
							intval( $ssf_group_id )
						);
						if ( $ssf_tournament_id ) {
							printf(
								/* translators: %d: SSF tournament ID */
								' (%s %d)',
								esc_html__( 'tournament', 'rockaden-chess' ),
								intval( $ssf_tournament_id )
							);
						}
						?>
					</p>
				<?php endif; ?>
				<div class="rc-ssf-fetch-row">
					<input type="number" id="rc_ssf_lookup_id" value="<?php echo $ssf_group_id ? esc_attr( (string) $ssf_group_id ) : ''; ?>" placeholder="<?php esc_attr_e( 'SSF ID', 'rockaden-chess' ); ?>" min="1" class="regular-text" />
					<button type="button" id="rc-ssf-fetch-group-btn" class="button"><?php esc_html_e( 'Fetch Group', 'rockaden-chess' ); ?></button>
					<button type="button" id="rc-ssf-fetch-tournament-btn" class="button"><?php esc_html_e( 'Fetch Tournament', 'rockaden-chess' ); ?></button>
				</div>
				<div id="rc-ssf-preview"></div>
				<input type="hidden" id="rc_ssf_group_id" name="rc_ssf_group_id" value="<?php echo esc_attr( (string) $ssf_group_id ); ?>" />
				<input type="hidden" id="rc_ssf_tournament_id" name="rc_ssf_tournament_id" value="<?php echo esc_attr( (string) $ssf_tournament_id ); ?>" />
			</div>

			<div class="rc-event-section">
				<h3><?php esc_html_e( 'Date & Time', 'rockaden-chess' ); ?></h3>
				<div class="rc-event-row rc-event-row--dates">
					<div class="rc-event-field">
						<label for="rc_start_date"><?php esc_html_e( 'Start', 'rockaden-chess' ); ?> *</label>
						<input type="text" id="rc_start_date" name="rc_start_date" value="<?php echo esc_attr( $start_local ); ?>" required class="regular-text" />
					</div>
					<div class="rc-event-field">
						<label for="rc_end_date"><?php esc_html_e( 'End', 'rockaden-chess' ); ?> *</label>
						<input type="text" id="rc_end_date" name="rc_end_date" value="<?php echo esc_attr( $end_local ); ?>" required class="regular-text" />
					</div>
				</div>
				<div class="rc-event-row rc-event-row--recurrence">
					<label class="rc-event-checkbox">
						<input type="checkbox" id="rc_is_recurring" name="rc_is_recurring" value="1" <?php checked( $is_recurring ); ?> />
						<?php esc_html_e( 'Recurring', 'rockaden-chess' ); ?>
					</label>
					<div id="rc-recurrence-fields" style="<?php echo $is_recurring ? '' : 'display:none;'; ?>">
						<select id="rc_recurrence_type" name="rc_recurrence_type">
							<option value="weekly" <?php selected( $recurrence_type, 'weekly' ); ?>><?php esc_html_e( 'Weekly', 'rockaden-chess' ); ?></option>
							<option value="biweekly" <?php selected( $recurrence_type, 'biweekly' ); ?>><?php esc_html_e( 'Biweekly', 'rockaden-chess' ); ?></option>
						</select>
					</div>
				</div>
				<div id="rc-excluded-dates-field" style="<?php echo $is_recurring ? '' : 'display:none;'; ?>">
					<label for="rc_excluded_dates"><?php esc_html_e( 'Excluded Dates', 'rockaden-chess' ); ?></label>
					<textarea id="rc_excluded_dates" name="rc_excluded_dates" rows="2" placeholder="2026-03-15, 2026-04-01"><?php echo esc_textarea( $excluded_str ); ?></textarea>
					<p class="description"><?php esc_html_e( 'Comma-separated YYYY-MM-DD dates to exclude from recurrence.', 'rockaden-chess' ); ?></p>
				</div>
			</div>

			<div class="rc-event-section">
				<h3><?php esc_html_e( 'Details', 'rockaden-chess' ); ?></h3>
				<div class="rc-event-row">
					<div class="rc-event-field">
						<label for="rc_location"><?php esc_html_e( 'Location', 'rockaden-chess' ); ?></label>
						<input type="text" id="rc_location" name="rc_location" value="<?php echo esc_attr( $location ); ?>" class="regular-text" />
					</div>
				</div>
				<div class="rc-event-row">
					<div class="rc-event-field">
						<label for="rc_category"><?php esc_html_e( 'Category', 'rockaden-chess' ); ?></label>
						<select id="rc_category" name="rc_category">
							<?php foreach ( $categories as $value => $label ) : ?>
								<option value="<?php echo esc_attr( $value ); ?>" <?php selected( $category, $value ); ?>><?php echo esc_html( $label ); ?></option>
							<?php endforeach; ?>
						</select>
					</div>
				</div>
			</div>

			<div class="rc-event-section">
				<h3><?php esc_html_e( 'Link', 'rockaden-chess' ); ?></h3>
				<div class="rc-event-row rc-event-row--dates">
					<div class="rc-event-field">
						<label for="rc_link"><?php esc_html_e( 'URL', 'rockaden-chess' ); ?></label>
						<input type="url" id="rc_link" name="rc_link" value="<?php echo esc_attr( $link ); ?>" class="regular-text" />
					</div>
					<div class="rc-event-field">
						<label for="rc_link_label"><?php esc_html_e( 'Link Text', 'rockaden-chess' ); ?></label>
						<input type="text" id="rc_link_label" name="rc_link_label" value="<?php echo esc_attr( $link_label ); ?>" class="regular-text" />
					</div>
				</div>
			</div>

			<div class="rc-event-section">
				<h3><?php esc_html_e( 'Description', 'rockaden-chess' ); ?></h3>
				<?php
				wp_editor(
					$post->post_content,
					'rc_description',
					[
						'media_buttons' => false,
						'textarea_rows' => 6,
						'teeny'         => true,
						'quicktags'     => true,
					]
				);
				?>
			</div>

		</div>
		<?php
	}

	/**
	 * Save event meta box data.
	 *
	 * @param int      $post_id The post ID.
	 * @param \WP_Post $post    The post object.
	 */
	public static function save( int $post_id, \WP_Post $post ): void { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundAfterLastUsed -- Required by save_post hook signature.
		if ( ! isset( $_POST['rc_event_meta_nonce'] ) ) {
			return;
		}
		if ( ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['rc_event_meta_nonce'] ) ), 'rc_event_meta' ) ) {
			return;
		}
		if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		// Start/End dates: convert datetime-local to ISO 8601.
		$start = sanitize_text_field( wp_unslash( $_POST['rc_start_date'] ?? '' ) );
		$end   = sanitize_text_field( wp_unslash( $_POST['rc_end_date'] ?? '' ) );

		if ( $start ) {
			$start = gmdate( 'c', strtotime( $start ) );
		}
		if ( $end ) {
			$end = gmdate( 'c', strtotime( $end ) );
		}

		update_post_meta( $post_id, 'rc_start_date', $start );
		update_post_meta( $post_id, 'rc_end_date', $end );
		update_post_meta( $post_id, 'rc_location', sanitize_text_field( wp_unslash( $_POST['rc_location'] ?? '' ) ) );
		update_post_meta( $post_id, 'rc_category', sanitize_text_field( wp_unslash( $_POST['rc_category'] ?? 'other' ) ) );
		update_post_meta( $post_id, 'rc_link', esc_url_raw( wp_unslash( $_POST['rc_link'] ?? '' ) ) );
		update_post_meta( $post_id, 'rc_link_label', sanitize_text_field( wp_unslash( $_POST['rc_link_label'] ?? '' ) ) );

		$is_recurring = ! empty( $_POST['rc_is_recurring'] );
		update_post_meta( $post_id, 'rc_is_recurring', $is_recurring ? '1' : '' );

		if ( $is_recurring ) {
			update_post_meta( $post_id, 'rc_recurrence_type', sanitize_text_field( wp_unslash( $_POST['rc_recurrence_type'] ?? 'weekly' ) ) );

			// Auto-derive rc_recurrence_end from rc_end_date.
			if ( $end ) {
				$rec_end = gmdate( 'c', strtotime( gmdate( 'Y-m-d', strtotime( $end ) ) ) );
				update_post_meta( $post_id, 'rc_recurrence_end', $rec_end );
			}

			// Parse excluded dates.
			$excluded_raw = sanitize_text_field( wp_unslash( $_POST['rc_excluded_dates'] ?? '' ) );
			$excluded     = [];
			if ( $excluded_raw ) {
				foreach ( explode( ',', $excluded_raw ) as $d ) {
					$d = trim( $d );
					if ( preg_match( '/^\d{4}-\d{2}-\d{2}$/', $d ) ) {
						$excluded[] = $d;
					}
				}
			}
			update_post_meta( $post_id, 'rc_excluded_dates', wp_slash( wp_json_encode( $excluded ) ) );
		} else {
			update_post_meta( $post_id, 'rc_recurrence_type', '' );
			update_post_meta( $post_id, 'rc_recurrence_end', '' );
			update_post_meta( $post_id, 'rc_excluded_dates', '[]' );
		}

		// SSF IDs.
		update_post_meta( $post_id, 'rc_ssf_group_id', absint( $_POST['rc_ssf_group_id'] ?? 0 ) );
		update_post_meta( $post_id, 'rc_ssf_tournament_id', absint( $_POST['rc_ssf_tournament_id'] ?? 0 ) );

		// Save description to post_content.
		$description = wp_kses_post( wp_unslash( $_POST['rc_description'] ?? '' ) );
		remove_action( 'save_post_' . Event::POST_TYPE, [ self::class, 'save' ], 10 );
		wp_update_post(
			[
				'ID'           => $post_id,
				'post_content' => $description,
			]
		);
		add_action( 'save_post_' . Event::POST_TYPE, [ self::class, 'save' ], 10, 2 );
	}
}
