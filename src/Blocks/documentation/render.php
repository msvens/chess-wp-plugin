<?php
/**
 * Server-side render for the Documentation block.
 *
 * Reads the registry, resolves the requested doc slug, and renders
 * a two-column layout with sidebar nav + content from bundled HTML files.
 *
 * @package Rockaden
 */

defined( 'ABSPATH' ) || exit;

use Rockaden\Docs\DocsRegistry;

// Gate: require editor capability — redirect to login.
if ( ! current_user_can( 'edit_posts' ) ) {
	wp_safe_redirect( wp_login_url( get_permalink() ) );
	exit;
}

$all_entries = DocsRegistry::get_all();
if ( empty( $all_entries ) ) {
	return;
}

// Resolve current doc slug.
$slug = get_query_var( 'rc_doc', '' );
if ( '' === $slug ) {
	$slug = DocsRegistry::get_default_slug();
}

$current = DocsRegistry::get_by_slug( $slug );
if ( ! $current ) {
	$current = $all_entries[0];
	$slug    = $current['slug'];
}

// Read content file.
// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- bundled file, not remote.
$content = file_get_contents( $current['file'] );
if ( false === $content ) {
	$content = '<p>Could not load documentation.</p>';
}

// Build page URL base.
$page_id  = (int) get_option( 'rc_docs_page_id', 0 );
$base_url = $page_id ? get_permalink( $page_id ) : '/documentation/';

// Build sidebar nav.
$sections = DocsRegistry::get_sections();
$nav_id   = 'rc-docs-nav-' . wp_unique_id();

$wrapper_attributes = get_block_wrapper_attributes( [ 'class' => 'rc-docs-block' ] );
?>
<div <?php echo wp_kses_post( $wrapper_attributes ); ?>>
	<div class="rc-docs-layout">

		<!-- Sidebar nav -->
		<div class="rc-docs-sidebar">
			<nav class="rc-docs-nav__desktop" aria-label="Documentation">
				<ul class="rc-docs-nav__list">
					<?php foreach ( $sections as $section ) : ?>
						<li class="rc-docs-nav__heading">
							<span class="rc-doc-sv"><?php echo esc_html( $section['title_sv'] ); ?></span>
							<span class="rc-doc-en"><?php echo esc_html( $section['title_en'] ); ?></span>
						</li>
						<?php foreach ( $section['entries'] as $entry ) : ?>
							<li>
								<a
									href="<?php echo esc_url( trailingslashit( $base_url ) . $entry['slug'] . '/' ); ?>"
									<?php echo $entry['slug'] === $slug ? ' aria-current="page"' : ''; ?>
								>
									<span class="rc-doc-sv"><?php echo esc_html( $entry['title_sv'] ); ?></span>
									<span class="rc-doc-en"><?php echo esc_html( $entry['title_en'] ); ?></span>
								</a>
							</li>
						<?php endforeach; ?>
					<?php endforeach; ?>
				</ul>
			</nav>

			<div class="rc-docs-nav__mobile-wrap">
				<button
					type="button"
					class="rc-docs-nav__mobile-btn"
					id="<?php echo esc_attr( $nav_id ); ?>-btn"
					aria-expanded="false"
					aria-controls="<?php echo esc_attr( $nav_id ); ?>-menu"
				>
					<span>
						<span class="rc-doc-sv"><?php echo esc_html( $current['title_sv'] ); ?></span>
						<span class="rc-doc-en"><?php echo esc_html( $current['title_en'] ); ?></span>
					</span>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
						<path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/>
					</svg>
				</button>
				<ul
					class="rc-docs-nav__mobile-menu"
					id="<?php echo esc_attr( $nav_id ); ?>-menu"
					role="listbox"
					aria-label="Documentation"
				>
					<?php foreach ( $sections as $section ) : ?>
						<?php foreach ( $section['entries'] as $entry ) : ?>
							<li>
								<a
									href="<?php echo esc_url( trailingslashit( $base_url ) . $entry['slug'] . '/' ); ?>"
									<?php echo $entry['slug'] === $slug ? ' aria-current="page"' : ''; ?>
								>
									<span class="rc-doc-sv"><?php echo esc_html( $entry['title_sv'] ); ?></span>
									<span class="rc-doc-en"><?php echo esc_html( $entry['title_en'] ); ?></span>
								</a>
							</li>
						<?php endforeach; ?>
					<?php endforeach; ?>
				</ul>
			</div>
		</div>

		<!-- Content -->
		<div class="rc-docs-content">
			<h1 class="rc-docs-title">
				<span class="rc-doc-sv"><?php echo esc_html( $current['title_sv'] ); ?></span>
				<span class="rc-doc-en"><?php echo esc_html( $current['title_en'] ); ?></span>
			</h1>
			<?php
			// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- trusted bundled HTML.
			echo $content;
			?>
		</div>

	</div>
</div>
<?php
