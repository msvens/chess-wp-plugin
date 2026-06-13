import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import './event-metabox.css';

document.addEventListener( 'DOMContentLoaded', () => {
	const opts: flatpickr.Options.Options = {
		enableTime: true,
		time_24hr: true,
		dateFormat: 'Y-m-d H:i',
		allowInput: true,
	};

	const startInstances = flatpickr( '#rc_start_date', opts );
	const endInstances = flatpickr( '#rc_end_date', opts );
	const fpStart = Array.isArray( startInstances )
		? startInstances[ 0 ]
		: startInstances;
	const fpEnd = Array.isArray( endInstances )
		? endInstances[ 0 ]
		: endInstances;

	// Prefill start/end from query string when opening a brand-new event page
	// (e.g. from the calendar's click/drag-to-create flow).
	const titleField = document.getElementById(
		'title'
	) as HTMLInputElement | null;
	if ( ! titleField || titleField.value === '' ) {
		const params = new URLSearchParams( window.location.search );
		const qStart = params.get( 'start' );
		const qEnd = params.get( 'end' );
		const fmt = ( raw: string ): string => raw.replace( 'T', ' ' );
		if ( qStart && fpStart ) {
			fpStart.setDate( fmt( qStart ), true );
		}
		if ( qEnd && fpEnd ) {
			fpEnd.setDate( fmt( qEnd ), true );
		}
	}

	// Recurrence toggle.
	const cb = document.getElementById(
		'rc_is_recurring'
	) as HTMLInputElement | null;
	const recurrenceFields = document.getElementById( 'rc-recurrence-fields' );
	const excludedField = document.getElementById( 'rc-excluded-dates-field' );

	if ( cb ) {
		cb.addEventListener( 'change', () => {
			const show = cb.checked;
			if ( recurrenceFields ) {
				recurrenceFields.style.display = show ? '' : 'none';
			}
			if ( excludedField ) {
				excludedField.style.display = show ? '' : 'none';
			}
		} );
	}
} );
