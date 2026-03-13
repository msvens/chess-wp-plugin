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

	flatpickr( '#rc_start_date', opts );
	flatpickr( '#rc_end_date', opts );

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
