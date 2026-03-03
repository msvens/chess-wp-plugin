<?php
/**
 * Training Group custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_training_group post type and its meta fields.
 */
class TrainingGroup {

	public const POST_TYPE = 'rc_training_group';

	/**
	 * Register the post type.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Training Groups', 'rockaden-chess' ),
					'singular_name' => __( 'Training Group', 'rockaden-chess' ),
					'add_new_item'  => __( 'Add New Training Group', 'rockaden-chess' ),
					'edit_item'     => __( 'Edit Training Group', 'rockaden-chess' ),
				],
				'public'       => false,
				'show_ui'      => false, // Managed via React admin page.
				'show_in_rest' => true,
				'supports'     => [ 'title', 'editor', 'author' ],
				'has_archive'  => false,
			]
		);

		self::register_meta();
	}

	/**
	 * Register post meta fields.
	 */
	private static function register_meta(): void {
		$meta_fields = [
			'rc_status'         => [
				'type'    => 'string',
				'default' => 'draft',
			],
			'rc_semester'       => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_has_tournament' => [
				'type'    => 'boolean',
				'default' => false,
			],
			'rc_time_control'   => [
				'type'    => 'string',
				'default' => 'classical',
			],
			'rc_event_id'       => [
				'type'    => 'integer',
				'default' => 0,
			],
			'rc_participants'   => [
				'type'    => 'string', // JSON string.
				'default' => '[]',
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
