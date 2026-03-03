/**
 * Frontend hydration for the Calendar block.
 * Finds all .rockaden-calendar-block containers and mounts React.
 */
import { createRoot } from '@wordpress/element';

function CalendarBlock( {
	restUrl,
	locale,
}: {
	restUrl: string;
	locale: string;
} ) {
	return (
		<div className="rockaden-calendar" data-rest-url={ restUrl }>
			<p>Calendar ({ locale }) will be built here in Phase 5.</p>
		</div>
	);
}

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-calendar-block' )
	.forEach( ( el ) => {
		const restUrl = el.dataset.restUrl || '/wp-json/rockaden/v1/';
		const locale = el.dataset.locale || 'sv';
		createRoot( el ).render(
			<CalendarBlock restUrl={ restUrl } locale={ locale } />
		);
	} );
