<?php
/**
 * Plugin settings page.
 *
 * @package Rockaden
 */

namespace Rockaden\Admin;

/**
 * Registers and renders the Rockaden settings admin page.
 */
class SettingsPage {

	private const OPTION_GROUP = 'rockaden_settings';
	private const PAGE_SLUG    = 'rockaden-chess-settings';

	/**
	 * Register the submenu page under Settings.
	 */
	public static function register_page(): void {
		add_submenu_page(
			'options-general.php',
			__( 'Rockaden Settings', 'rockaden-chess' ),
			__( 'Rockaden', 'rockaden-chess' ),
			'manage_options',
			self::PAGE_SLUG,
			[ self::class, 'render' ]
		);

		add_action( 'admin_init', [ self::class, 'register_settings' ] );
	}

	/**
	 * Register settings, sections, and fields.
	 */
	public static function register_settings(): void {
		register_setting(
			self::OPTION_GROUP,
			'rockaden_ssf_club_id',
			[
				'type'              => 'string',
				'sanitize_callback' => 'sanitize_text_field',
				'default'           => '',
			]
		);

		add_settings_section(
			'rockaden_ssf_section',
			__( 'SSF Integration', 'rockaden-chess' ),
			fn () => printf(
				'<p>%s</p>',
				esc_html__( 'Configure the connection to the Swedish Chess Federation (SSF) API.', 'rockaden-chess' )
			),
			self::PAGE_SLUG
		);

		add_settings_field(
			'rockaden_ssf_club_id',
			__( 'SSF Club ID', 'rockaden-chess' ),
			[ self::class, 'render_club_id_field' ],
			self::PAGE_SLUG,
			'rockaden_ssf_section'
		);
	}

	/**
	 * Render the club ID input field.
	 */
	public static function render_club_id_field(): void {
		$value = get_option( 'rockaden_ssf_club_id', '' );
		printf(
			'<input type="text" name="rockaden_ssf_club_id" value="%s" class="regular-text" placeholder="e.g. 1234" />',
			esc_attr( $value )
		);
		printf(
			'<p class="description">%s</p>',
			esc_html__( 'The club ID from member.schack.se', 'rockaden-chess' )
		);
	}

	/**
	 * Render the settings page.
	 */
	public static function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		?>
		<div class="wrap">
			<h1><?php echo esc_html( get_admin_page_title() ); ?></h1>
			<form action="options.php" method="post">
				<?php
				settings_fields( self::OPTION_GROUP );
				do_settings_sections( self::PAGE_SLUG );
				submit_button();
				?>
			</form>
		</div>
		<?php
	}
}
