import { useRef, useEffect } from '@wordpress/element';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';
import './FlatpickrInput.css';

interface FlatpickrInputProps {
	value: string;
	onChange: ( iso: string ) => void;
	placeholder?: string;
	required?: boolean;
}

// A bare 'YYYY-MM-DD' doesn't match the 'Y-m-d H:i' format, which leaves the
// time picker unselected so time edits don't fire onChange. Give it midnight.
function normalizeForFp( v: string ): string {
	return /^\d{4}-\d{2}-\d{2}$/.test( v ) ? `${ v } 00:00` : v;
}

function toDate( v: string ): Date | null {
	const d = new Date( normalizeForFp( v ) );
	return isNaN( d.getTime() ) ? null : d;
}

// Emit a naive *site-local* datetime ('YYYY-MM-DDTHH:mm:00') — the convention
// the rest of the plugin uses (formatTime/EventExpander read the literal time,
// no UTC conversion). toISOString() would shift it to UTC and display wrong.
function toLocalIso( d: Date ): string {
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return `${ d.getFullYear() }-${ pad( d.getMonth() + 1 ) }-${ pad(
		d.getDate()
	) }T${ pad( d.getHours() ) }:${ pad( d.getMinutes() ) }:00`;
}

export function FlatpickrInput( {
	value,
	onChange,
	placeholder,
	required,
}: FlatpickrInputProps ) {
	const inputRef = useRef< HTMLInputElement >( null );
	const fpRef = useRef< flatpickr.Instance | null >( null );
	// The flatpickr instance is created once, so route its callback through a
	// ref to always call the latest onChange (no stale closure).
	const onChangeRef = useRef( onChange );
	onChangeRef.current = onChange;

	useEffect( () => {
		if ( ! inputRef.current ) {
			return;
		}

		const emit = ( selectedDates: Date[] ) => {
			if ( selectedDates.length > 0 ) {
				onChangeRef.current( toLocalIso( selectedDates[ 0 ] ) );
			}
		};

		const initial = value ? toDate( value ) : null;
		fpRef.current = flatpickr( inputRef.current, {
			enableTime: true,
			time_24hr: true,
			dateFormat: 'Y-m-d H:i',
			allowInput: true,
			defaultDate: initial ?? undefined,
			// onChange is debounced 300ms for time edits — saving within that
			// window would drop the change. onValueUpdate fires immediately, so
			// React state is always current. (Both call the same handler.)
			onChange: emit,
			onValueUpdate: emit,
		} );

		return () => {
			fpRef.current?.destroy();
		};
		// Only run on mount/unmount — value sync handled below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Sync external value changes into flatpickr — pass a Date object (no string
	// re-parse) and only when it actually differs, so it never clobbers the
	// time the user just picked.
	useEffect( () => {
		const fp = fpRef.current;
		if ( ! fp || ! value ) {
			return;
		}
		const next = toDate( value );
		if ( ! next ) {
			return;
		}
		const current = fp.selectedDates[ 0 ];
		if ( ! current || current.getTime() !== next.getTime() ) {
			fp.setDate( next, false );
		}
	}, [ value ] );

	return (
		<input
			ref={ inputRef }
			type="text"
			placeholder={ placeholder || 'YYYY-MM-DD HH:MM' }
			required={ required }
			className="regular-text"
			style={ { width: '100%' } }
		/>
	);
}
