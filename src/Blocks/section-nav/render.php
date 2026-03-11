<?php
/**
 * Server-side render for the Section Nav block.
 * Builds a sidebar navigation from the current page's parent/child hierarchy.
 *
 * @package Rockaden
 *
 * @var array<string, mixed> $attributes Block attributes.
 * @var string               $content    Block content.
 * @var WP_Block             $block      Block instance.
 */

defined( 'ABSPATH' ) || exit;

$current_id = get_the_ID();
if ( ! $current_id ) {
	return;
}

$current_post = get_post( $current_id );
if ( ! $current_post || 'page' !== $current_post->post_type ) {
	return;
}

// Determine root page: parent if exists, otherwise self.
$root_id = $current_post->post_parent ? $current_post->post_parent : $current_id;
$root    = get_post( $root_id );
if ( ! $root ) {
	return;
}

// Get direct children of the root page.
$children = get_pages(
	[
		'parent'      => $root_id,
		'sort_column' => 'menu_order,post_title',
	]
);

// If no children, render nothing.
if ( empty( $children ) ) {
	return;
}

// Build nav items: root first, then children.
$nav_items = array_merge( [ $root ], $children );

// Unique ID for this instance (multiple blocks on one page).
$nav_id = 'rc-snav-' . wp_unique_id();

$wrapper_attributes = get_block_wrapper_attributes(
	[ 'class' => 'rc-section-nav' ]
);
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<nav class="rc-section-nav__desktop" aria-label="<?php echo esc_attr( get_the_title( $root_id ) ); ?>">
		<ul class="rc-section-nav__list">
			<?php foreach ( $nav_items as $item ) : ?>
				<li>
					<a
						href="<?php echo esc_url( get_permalink( $item->ID ) ); ?>"
						<?php echo $item->ID === $current_id ? ' aria-current="page"' : ''; ?>
					><?php echo esc_html( get_the_title( $item->ID ) ); ?></a>
				</li>
			<?php endforeach; ?>
		</ul>
	</nav>

	<div class="rc-section-nav__mobile-wrap">
		<button
			type="button"
			class="rc-section-nav__mobile-btn"
			id="<?php echo esc_attr( $nav_id ); ?>-btn"
			aria-expanded="false"
			aria-controls="<?php echo esc_attr( $nav_id ); ?>-menu"
		>
			<span><?php echo esc_html( get_the_title( $current_id ) ); ?></span>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
				<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
			</svg>
		</button>
		<ul
			class="rc-section-nav__mobile-menu"
			id="<?php echo esc_attr( $nav_id ); ?>-menu"
			role="listbox"
			aria-label="<?php echo esc_attr( get_the_title( $root_id ) ); ?>"
		>
			<?php foreach ( $nav_items as $item ) : ?>
				<li>
					<a
						href="<?php echo esc_url( get_permalink( $item->ID ) ); ?>"
						<?php echo $item->ID === $current_id ? ' aria-current="page"' : ''; ?>
					><?php echo esc_html( get_the_title( $item->ID ) ); ?></a>
				</li>
			<?php endforeach; ?>
		</ul>
	</div>
</div>
