import { useRef, useEffect } from '@wordpress/element';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.min.css';

interface FlatpickrInputProps {
	value: string;
	onChange: ( iso: string ) => void;
	placeholder?: string;
	required?: boolean;
}

export function FlatpickrInput( {
	value,
	onChange,
	placeholder,
	required,
}: FlatpickrInputProps ) {
	const inputRef = useRef< HTMLInputElement >( null );
	const fpRef = useRef< flatpickr.Instance | null >( null );

	useEffect( () => {
		if ( ! inputRef.current ) {
			return;
		}

		fpRef.current = flatpickr( inputRef.current, {
			enableTime: true,
			time_24hr: true,
			dateFormat: 'Y-m-d H:i',
			allowInput: true,
			defaultDate: value || undefined,
			onChange: ( selectedDates ) => {
				if ( selectedDates.length > 0 ) {
					onChange( selectedDates[ 0 ].toISOString() );
				}
			},
		} );

		return () => {
			fpRef.current?.destroy();
		};
		// Only run on mount/unmount — value sync handled below.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// Sync external value changes into flatpickr.
	useEffect( () => {
		if ( fpRef.current && value ) {
			fpRef.current.setDate( value, false );
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
