import { useState, useEffect } from '@wordpress/element';
import { CheckboxControl } from '@wordpress/components';
import type { Participant } from '../types';

interface AttendanceFormProps {
	participants: Participant[];
	attendance: string[];
	onChange: ( attendance: string[] ) => void;
}

export function AttendanceForm( {
	participants,
	attendance,
	onChange,
}: AttendanceFormProps ) {
	const [ present, setPresent ] = useState< Set< string > >(
		new Set( attendance )
	);

	useEffect( () => {
		setPresent( new Set( attendance ) );
	}, [ attendance ] );

	function toggle( id: string ) {
		setPresent( ( prev ) => {
			const next = new Set( prev );
			if ( next.has( id ) ) {
				next.delete( id );
			} else {
				next.add( id );
			}
			onChange( Array.from( next ) );
			return next;
		} );
	}

	const active = participants.filter( ( p ) => p.active );

	return (
		<div>
			{ active.map( ( p ) => (
				<CheckboxControl
					key={ p.id }
					label={ p.name }
					checked={ present.has( p.id ) }
					onChange={ () => toggle( p.id ) }
				/>
			) ) }
		</div>
	);
}
