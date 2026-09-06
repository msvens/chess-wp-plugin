import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import './flatpickr-overrides.css';
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

	// Recurrence-end is a date-only field (no time).
	flatpickr( '#rc_recurrence_end', {
		enableTime: false,
		dateFormat: 'Y-m-d',
		allowInput: true,
	} );
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

	initExtraSessions();
} );

/**
 * One extra session: a date-time it starts, and optionally one it ends.
 *
 * A bare string is the shorthand for "that day, at the event's usual time" —
 * both shapes are stored, so a session that doesn't differ needs no times.
 */
type ExtraSession = string | { start: string; end?: string };

/**
 * Rows of date pickers for sessions outside the usual schedule.
 *
 * Kept as rows rather than the comma-separated textarea the excluded dates use,
 * because these carry times: typing "2026-10-12 10:00" by hand is exactly the
 * job flatpickr already does everywhere else in this editor. The rows are
 * serialised back into one hidden field so the save path stays a single input.
 */
function initExtraSessions(): void {
	const store = document.getElementById(
		'rc_included_dates'
	) as HTMLInputElement | null;
	const rows = document.getElementById( 'rc-included-dates-rows' );
	const addButton = document.getElementById( 'rc-included-dates-add' );

	if ( ! store || ! rows || ! addButton ) {
		return;
	}

	let sessions: ExtraSession[] = [];
	try {
		const parsed = JSON.parse( store.value || '[]' );
		sessions = Array.isArray( parsed ) ? parsed : [];
	} catch {
		// A malformed value is not worth losing the whole editor over; start
		// empty and let saving overwrite it.
		sessions = [];
	}

	// Normalise the stored shorthand into rows the pickers can fill: a bare
	// date becomes a start with no time, which reads back out the same way.
	const model = sessions.map( ( entry ) =>
		typeof entry === 'string'
			? { start: entry, end: '' }
			: { start: entry.start ?? '', end: entry.end ?? '' }
	);

	const persist = (): void => {
		store.value = JSON.stringify(
			model
				.filter( ( row ) => row.start.trim() !== '' )
				.map( ( row ) =>
					row.end.trim() === ''
						? { start: row.start }
						: { start: row.start, end: row.end }
				)
		);
	};

	const render = (): void => {
		rows.textContent = '';

		model.forEach( ( row, index ) => {
			const wrapper = document.createElement( 'div' );
			wrapper.className = 'rc-extra-session';

			const start = document.createElement( 'input' );
			start.type = 'text';
			start.value = row.start;
			start.placeholder = '2026-10-12 10:00';
			start.className = 'rc-extra-session__start';

			const end = document.createElement( 'input' );
			end.type = 'text';
			end.value = row.end;
			end.placeholder = '2026-10-12 13:00';
			end.className = 'rc-extra-session__end';

			const remove = document.createElement( 'button' );
			remove.type = 'button';
			remove.className = 'button-link rc-extra-session__remove';
			remove.textContent = '×';
			remove.setAttribute(
				'aria-label',
				addButton.dataset.removeLabel || 'Remove'
			);
			remove.addEventListener( 'click', () => {
				model.splice( index, 1 );
				persist();
				render();
			} );

			wrapper.append( start, end, remove );
			rows.append( wrapper );

			// allowInput so a date can still be typed or pasted; onChange keeps
			// the model in step whichever way the value arrives.
			const pickerOpts: flatpickr.Options.Options = {
				enableTime: true,
				time_24hr: true,
				dateFormat: 'Y-m-d H:i',
				allowInput: true,
			};

			flatpickr( start, {
				...pickerOpts,
				onChange: ( _dates, value ) => {
					row.start = value;
					persist();
				},
			} );
			flatpickr( end, {
				...pickerOpts,
				onChange: ( _dates, value ) => {
					row.end = value;
					persist();
				},
			} );

			start.addEventListener( 'input', () => {
				row.start = start.value;
				persist();
			} );
			end.addEventListener( 'input', () => {
				row.end = end.value;
				persist();
			} );
		} );
	};

	addButton.addEventListener( 'click', () => {
		model.push( { start: '', end: '' } );
		render();
	} );

	render();
}
