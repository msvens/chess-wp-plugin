<?php
/**
 * Training Session custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_training_session post type and its meta fields.
 */
class TrainingSession {

	public const POST_TYPE = 'rc_training_session';

	/**
	 * Register the post type.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Training Sessions', 'rockaden-chess' ),
					'singular_name' => __( 'Training Session', 'rockaden-chess' ),
				],
				'public'       => false,
				'show_ui'      => false,
				'show_in_rest' => true,
				'supports'     => [ 'title', 'author' ],
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
			'rc_group_id'     => [
				'type'    => 'integer',
				'default' => 0,
			],
			'rc_session_date' => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_notes'        => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_attendance'   => [
				'type'    => 'string', // JSON string.
				'default' => '[]',
			],
			'rc_games'        => [
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
