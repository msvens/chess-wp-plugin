<?php
/**
 * Documentation page setup.
 *
 * Creates the Documentation page on first run, registers rewrite rules
 * and the rc_doc query variable.
 *
 * @package Rockaden
 */

namespace Rockaden\Docs;

defined( 'ABSPATH' ) || exit;

/**
 * Documentation page lifecycle: creates the page, registers rewrites and query vars.
 */
class DocsPageSetup {

	const PAGE_OPTION = 'rc_docs_page_id';
	const PAGE_SLUG   = 'documentation';

	/**
	 * Register query var and rewrite rule.
	 * Hooked on init (early priority so rules are available).
	 */
	public static function register_rewrites(): void {
		add_rewrite_rule(
			'^' . self::PAGE_SLUG . '/([^/]+)/?$',
			'index.php?pagename=' . self::PAGE_SLUG . '&rc_doc=$matches[1]',
			'top'
		);
	}

	/**
	 * Add rc_doc to recognized query vars.
	 *
	 * @param string[] $vars Existing query vars.
	 * @return string[]
	 */
	public static function add_query_var( array $vars ): array {
		$vars[] = 'rc_doc';
		return $vars;
	}

	/**
	 * Create the Documentation page if it doesn't exist yet.
	 * Called on init — checks an option flag to avoid repeated lookups.
	 */
	public static function maybe_create_page(): void {
		$page_id = (int) get_option( self::PAGE_OPTION, 0 );

		// Page already recorded — verify it still exists.
		if ( $page_id > 0 ) {
			$post = get_post( $page_id );
			if ( $post && self::PAGE_SLUG === $post->post_name ) {
				return;
			}
		}

		// Check if a page with this slug already exists.
		$existing = get_page_by_path( self::PAGE_SLUG );
		if ( $existing ) {
			update_option( self::PAGE_OPTION, $existing->ID );
			return;
		}

		// Create the page.
		$new_id = wp_insert_post(
			[
				'post_title'   => 'Documentation',
				'post_name'    => self::PAGE_SLUG,
				'post_status'  => 'publish',
				'post_type'    => 'page',
				'post_content' => '<!-- wp:rockaden/documentation /-->',
			]
		);

		if ( $new_id ) {
			update_option( self::PAGE_OPTION, $new_id );
			flush_rewrite_rules();
		}
	}
}
