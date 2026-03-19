<?php
/**
 * Event custom post type.
 *
 * @package Rockaden
 */

namespace Rockaden\PostTypes;

/**
 * Registers the rc_event post type and its meta fields.
 */
class Event {

	public const POST_TYPE = 'rc_event';

	/**
	 * Register the post type.
	 */
	public static function register(): void {
		register_post_type(
			self::POST_TYPE,
			[
				'labels'       => [
					'name'          => __( 'Events', 'rockaden-chess' ),
					'singular_name' => __( 'Event', 'rockaden-chess' ),
					'add_new_item'  => __( 'Add New Event', 'rockaden-chess' ),
					'edit_item'     => __( 'Edit Event', 'rockaden-chess' ),
				],
				'public'       => true,
				'show_in_rest' => true,
				'supports'     => [ 'title', 'author' ],
				'has_archive'  => true,
				'menu_icon'    => 'dashicons-calendar-alt',
				'rewrite'      => [ 'slug' => 'events' ],
			]
		);

		self::register_meta();

		add_filter(
			'use_block_editor_for_post_type',
			function ( bool $enabled, string $post_type ): bool {
				return self::POST_TYPE === $post_type ? false : $enabled;
			},
			10,
			2
		);
	}

	/**
	 * Register post meta fields.
	 */
	private static function register_meta(): void {
		$meta_fields = [
			'rc_start_date'        => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_end_date'          => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_location'          => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_category'          => [
				'type'    => 'string',
				'default' => 'other',
			],
			'rc_is_recurring'      => [
				'type'    => 'boolean',
				'default' => false,
			],
			'rc_recurrence_type'   => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_recurrence_end'    => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_excluded_dates'    => [
				'type'    => 'string', // JSON string.
				'default' => '[]',
			],
			'rc_link'              => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_link_label'        => [
				'type'    => 'string',
				'default' => '',
			],
			'rc_ssf_group_id'      => [
				'type'    => 'integer',
				'default' => 0,
			],
			'rc_ssf_tournament_id' => [
				'type'    => 'integer',
				'default' => 0,
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
