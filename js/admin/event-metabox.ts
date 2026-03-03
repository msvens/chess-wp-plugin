import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

document.addEventListener( 'DOMContentLoaded', () => {
	const opts: flatpickr.Options.Options = {
		enableTime: true,
		time_24hr: true,
		dateFormat: 'Y-m-d H:i',
		allowInput: true,
	};

	flatpickr( '#rc_start_date', opts );
	flatpickr( '#rc_end_date', opts );
} );
