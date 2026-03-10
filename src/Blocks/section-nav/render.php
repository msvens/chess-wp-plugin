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

// Output styles once per page load.
static $styles_output = false;
if ( ! $styles_output ) {
	$styles_output = true;
	?>
	<style>
	/* Desktop nav list */
	.rc-section-nav ul.rc-section-nav__list {
		list-style: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	.rc-section-nav ul.rc-section-nav__list li {
		list-style: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	.rc-section-nav ul.rc-section-nav__list li a {
		display: block;
		padding: 0.375rem 0.75rem;
		color: var(--wp--preset--color--on-surface-muted) !important;
		text-decoration: none !important;
		border-radius: 0.25rem;
		font-size: 0.875rem;
		font-weight: 400;
		transition: color 0.15s, background-color 0.15s;
	}
	.rc-section-nav ul.rc-section-nav__list li a:hover {
		color: var(--wp--preset--color--on-surface) !important;
		background-color: var(--wp--preset--color--surface-dim);
		text-decoration: none !important;
	}
	.rc-section-nav ul.rc-section-nav__list li a[aria-current="page"] {
		font-weight: 600;
		color: var(--wp--preset--color--on-surface) !important;
		background-color: var(--wp--preset--color--surface-dim);
	}

	/* Mobile custom dropdown — hidden on desktop */
	.rc-section-nav__mobile-wrap {
		display: none !important;
		position: relative;
	}
	.rc-section-nav__mobile-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
		padding: 0.5rem 0.75rem;
		font-family: inherit;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--wp--preset--color--on-surface);
		background-color: var(--wp--preset--color--surface);
		border: 1px solid var(--wp--preset--color--border);
		border-radius: 0.25rem;
		cursor: pointer;
		transition: border-color 0.15s;
	}
	.rc-section-nav__mobile-btn:hover {
		border-color: var(--wp--preset--color--on-surface-muted);
	}
	.rc-section-nav__mobile-btn svg {
		width: 1rem;
		height: 1rem;
		flex-shrink: 0;
		transition: transform 0.2s;
	}
	.rc-section-nav__mobile-btn.is-open svg {
		transform: rotate(180deg);
	}
	.rc-section-nav__mobile-menu {
		display: none;
		position: absolute;
		top: calc(100% + 0.25rem);
		left: 0;
		right: 0;
		z-index: 40;
		list-style: none !important;
		margin: 0 !important;
		padding: 0.25rem 0 !important;
		background-color: var(--wp--preset--color--surface);
		border: 1px solid var(--wp--preset--color--border);
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.08);
	}
	html.dark .rc-section-nav__mobile-menu {
		box-shadow: 0 4px 12px rgb(0 0 0 / 0.3);
	}
	.rc-section-nav__mobile-menu.is-open {
		display: block;
	}
	.rc-section-nav__mobile-menu li {
		list-style: none !important;
		margin: 0 !important;
		padding: 0 !important;
	}
	.rc-section-nav__mobile-menu li a {
		display: block;
		padding: 0.5rem 0.75rem;
		font-size: 0.875rem;
		font-weight: 400;
		color: var(--wp--preset--color--on-surface-muted) !important;
		text-decoration: none !important;
		transition: color 0.15s, background-color 0.15s;
	}
	.rc-section-nav__mobile-menu li a:hover {
		color: var(--wp--preset--color--on-surface) !important;
		background-color: var(--wp--preset--color--surface-dim);
		text-decoration: none !important;
	}
	.rc-section-nav__mobile-menu li a[aria-current="page"] {
		font-weight: 600;
		color: var(--wp--preset--color--on-surface) !important;
		background-color: var(--wp--preset--color--surface-dim);
	}

	/* Sidebar column */
	.rc-section-sidebar {
		padding-right: 1rem;
	}

	/* Responsive */
	@media screen and (max-width: 767px) {
		.rc-section-sidebar {
			border-right: none !important;
			padding-right: 0 !important;
		}
		.rc-section-nav .rc-section-nav__desktop {
			display: none !important;
		}
		.rc-section-nav .rc-section-nav__mobile-wrap {
			display: block !important;
		}
	}
	</style>
	<?php
}

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
<script>
(function(){
	var btn = document.getElementById('<?php echo esc_js( $nav_id ); ?>-btn');
	var menu = document.getElementById('<?php echo esc_js( $nav_id ); ?>-menu');
	if (!btn || !menu) return;
	btn.addEventListener('click', function() {
		var open = menu.classList.toggle('is-open');
		btn.classList.toggle('is-open', open);
		btn.setAttribute('aria-expanded', open ? 'true' : 'false');
	});
	document.addEventListener('click', function(e) {
		if (!btn.contains(e.target) && !menu.contains(e.target)) {
			menu.classList.remove('is-open');
			btn.classList.remove('is-open');
			btn.setAttribute('aria-expanded', 'false');
		}
	});
})();
</script>
