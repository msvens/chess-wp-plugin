<?php
/**
 * Tournament custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_tournament post type and its meta fields.
 */
class Tournament {

	public const POST_TYPE = 'rc_tournament';

	/**
	 * Register the post type.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'             => [
					'name'          => __( 'Tournaments', 'rockaden-chess' ),
					'singular_name' => __( 'Tournament', 'rockaden-chess' ),
					'add_new_item'  => __( 'Add New Tournament', 'rockaden-chess' ),
					'edit_item'     => __( 'Edit Tournament', 'rockaden-chess' ),
				],
				'public'             => true,
				'publicly_queryable' => true,
				'show_ui'            => false, // Managed via React admin page.
				'show_in_rest'       => true,
				'supports'           => [ 'title', 'editor', 'author' ],
				'has_archive'        => false,
				'rewrite'            => [ 'slug' => 'tournaments' ],
			]
		);

		self::register_meta();
	}

	/**
	 * Register post meta fields.
	 */
	private static function register_meta(): void {
		$meta_fields = [
			'rc_category'          => [
				'type'    => 'string',
				'default' => 'mixed',
			],
			'rc_status'            => [
				'type'    => 'string',
				'default' => 'auto',
			],
			'rc_format'            => [
				'type'    => 'string',
				'default' => 'round-robin',
			],
			'rc_time_control'      => [
				'type'    => 'string',
				'default' => 'classical',
			],
			'rc_participants'      => [
				'type'    => 'string', // JSON string.
				'default' => '[]',
			],
			'rc_rounds'            => [
				'type'    => 'string', // JSON string.
				'default' => '[]',
			],
			'rc_ssf_group_id'      => [
				'type'    => 'integer',
				'default' => 0,
			],
			'rc_event_id'          => [
				'type'    => 'integer',
				'default' => 0,
			],
			'rc_external_link'     => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_start_date'        => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_end_date'          => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_show_participants' => [
				'type'    => 'boolean',
				'default' => true,
			],
			'rc_show_standings'    => [
				'type'    => 'boolean',
				'default' => true,
			],
			'rc_ssf_has_results'   => [
				'type'    => 'boolean',
				'default' => false,
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
