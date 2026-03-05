import { useState, useEffect, useCallback } from '@wordpress/element';
import {
	Button,
	Spinner,
	Notice,
	TextareaControl,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingGroup, TrainingSession } from '../types';
import { fetchGroup, fetchSessions, saveAttendance, saveNotes } from '../api';
import { AttendanceForm } from './AttendanceForm';

interface SessionDetailProps {
	groupId: number;
	sessionId: number;
	t: Translations;
	onBack: () => void;
}

export function SessionDetail( {
	groupId,
	sessionId,
	t,
	onBack,
}: SessionDetailProps ) {
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ session, setSession ] = useState< TrainingSession | null >( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ notes, setNotes ] = useState( '' );
	const [ attendance, setAttendance ] = useState< string[] >( [] );
	const [ saving, setSaving ] = useState( false );

	useEffect( () => {
		let cancelled = false;
		setLoading( true );
		setError( null );

		Promise.all( [ fetchGroup( groupId ), fetchSessions( groupId ) ] )
			.then( ( [ g, ss ] ) => {
				if ( cancelled ) {
					return;
				}
				setGroup( g );
				const found =
					ss.find( ( item ) => item.id === sessionId ) || null;
				setSession( found );
				setNotes( found?.notes || '' );
				setAttendance( found?.attendance || [] );
			} )
			.catch( ( err: any ) => {
				if ( ! cancelled ) {
					setError( err?.message || 'Failed to load session' );
				}
			} )
			.finally( () => {
				if ( ! cancelled ) {
					setLoading( false );
				}
			} );

		return () => {
			cancelled = true;
		};
	}, [ groupId, sessionId ] );

	const handleAttendanceChange = useCallback(
		( updated: string[] ) => setAttendance( updated ),
		[]
	);

	async function handleSave() {
		setSaving( true );
		setError( null );
		try {
			const [ updatedAttendance, updatedNotes ] = await Promise.all( [
				saveAttendance( sessionId, attendance ),
				saveNotes( sessionId, notes ),
			] );
			setSession( ( prev ) =>
				prev
					? {
							...prev,
							attendance: updatedAttendance.attendance,
							notes: updatedNotes.notes,
					  }
					: prev
			);
		} catch ( err: any ) {
			setError( err?.message || 'Failed to save' );
		} finally {
			setSaving( false );
		}
	}

	if ( loading ) {
		return <Spinner />;
	}
	if ( error && ! group ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error }
			</Notice>
		);
	}
	if ( ! group || ! session ) {
		return null;
	}

	return (
		<div>
			<Button
				variant="link"
				onClick={ onBack }
				style={ { marginBottom: 8 } }
			>
				&larr; { t.training.backToGroup }
			</Button>

			<Heading level={ 2 }>
				{ group.title } &mdash; { session.sessionDate }
			</Heading>

			{ error && (
				<Notice
					status="error"
					isDismissible
					onDismiss={ () => setError( null ) }
				>
					{ error }
				</Notice>
			) }

			<Heading level={ 3 } style={ { marginTop: 24 } }>
				{ t.training.attendance }
			</Heading>
			<AttendanceForm
				participants={ group.participants }
				attendance={ session.attendance }
				onChange={ handleAttendanceChange }
			/>

			<Heading level={ 3 } style={ { marginTop: 24 } }>
				{ t.training.notes }
			</Heading>
			<TextareaControl value={ notes } onChange={ setNotes } rows={ 4 } />

			<Button
				variant="primary"
				onClick={ handleSave }
				isBusy={ saving }
				disabled={ saving }
				style={ { marginTop: 8 } }
			>
				{ t.common.save }
			</Button>
		</div>
	);
}
