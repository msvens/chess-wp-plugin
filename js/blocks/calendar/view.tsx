/**
 * Frontend hydration for the Calendar block.
 * Finds all .rockaden-calendar-block containers and mounts React.
 */
import { createRoot } from '@wordpress/element';
import CalendarApp from './CalendarApp';
import './calendar.css';

document
	.querySelectorAll< HTMLDivElement >( '.rockaden-calendar-block' )
	.forEach( ( el ) => {
		const locale =
			document.documentElement.dataset.lang || el.dataset.locale || 'sv';
		const canEdit = el.dataset.canEdit === '1';
		const adminBase = el.dataset.adminBase || '/wp-admin/';
		createRoot( el ).render(
			<CalendarApp
				locale={ locale }
				canEdit={ canEdit }
				adminBase={ adminBase }
			/>
		);
	} );
