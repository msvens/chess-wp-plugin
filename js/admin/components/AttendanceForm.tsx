import { useState, useEffect } from '@wordpress/element';
import { CheckboxControl, Button, Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { Participant } from '../types';
import { saveAttendance } from '../api';

interface AttendanceFormProps {
	sessionId: number;
	participants: Participant[];
	attendance: string[];
	t: Translations;
	onSaved: ( attendance: string[] ) => void;
}

export function AttendanceForm( {
	sessionId,
	participants,
	attendance,
	t,
	onSaved,
}: AttendanceFormProps ) {
	const [ present, setPresent ] = useState< Set< string > >(
		new Set( attendance )
	);
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

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
			return next;
		} );
	}

	async function handleSave() {
		setSaving( true );
		setError( null );
		const ids = Array.from( present );
		try {
			const updated = await saveAttendance( sessionId, ids );
			onSaved( updated.attendance );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to save attendance' );
		} finally {
			setSaving( false );
		}
	}

	const active = participants.filter( ( p ) => p.active );

	return (
		<div>
			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			{ active.map( ( p ) => (
				<CheckboxControl
					key={ p.id }
					label={ p.name }
					checked={ present.has( p.id ) }
					onChange={ () => toggle( p.id ) }
				/>
			) ) }

			<Button
				variant="primary"
				onClick={ handleSave }
				isBusy={ saving }
				disabled={ saving }
				style={ { marginTop: 8 } }
			>
				{ t.training.saveAttendance }
			</Button>
		</div>
	);
}
