import { useState, useEffect } from '@wordpress/element';
import {
	Button,
	Spinner,
	Notice,
	TextareaControl,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingGroup, TrainingSession, Game } from '../types';
import { fetchGroup, fetchSessions, saveNotes } from '../api';
import { AttendanceForm } from './AttendanceForm';
import { PairingsPanel } from './PairingsPanel';

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
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ notes, setNotes ] = useState( '' );
	const [ savingNotes, setSavingNotes ] = useState( false );

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
				setSessions( ss );
				const found =
					ss.find( ( item ) => item.id === sessionId ) || null;
				setSession( found );
				setNotes( found?.notes || '' );
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

	if ( loading ) {
		return <Spinner />;
	}
	if ( error ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error }
			</Notice>
		);
	}
	if ( ! group || ! session ) {
		return null;
	}

	const sessionIndex = sessions.findIndex( ( s ) => s.id === sessionId );

	async function handleSaveNotes() {
		setSavingNotes( true );
		try {
			const updated = await saveNotes( sessionId, notes );
			setSession( ( prev ) =>
				prev ? { ...prev, notes: updated.notes } : prev
			);
		} catch ( err: any ) {
			setError( err?.message || 'Failed to save notes' );
		} finally {
			setSavingNotes( false );
		}
	}

	function handleAttendanceSaved( attendance: string[] ) {
		setSession( ( prev ) => ( prev ? { ...prev, attendance } : prev ) );
	}

	function handleGamesUpdated( games: Game[] ) {
		setSession( ( prev ) => ( prev ? { ...prev, games } : prev ) );
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

			<Heading level={ 3 } style={ { marginTop: 24 } }>
				{ t.training.attendance }
			</Heading>
			<AttendanceForm
				sessionId={ sessionId }
				participants={ group.participants }
				attendance={ session.attendance }
				t={ t }
				onSaved={ handleAttendanceSaved }
			/>

			{ group.hasTournament && (
				<>
					<Heading level={ 3 } style={ { marginTop: 24 } }>
						{ t.training.pairings } &mdash; { t.training.round }{ ' ' }
						{ sessionIndex + 1 }
					</Heading>
					<PairingsPanel
						sessionId={ sessionId }
						sessionIndex={ sessionIndex }
						participants={ group.participants }
						games={ session.games }
						t={ t }
						onGamesUpdated={ handleGamesUpdated }
					/>
				</>
			) }

			<Heading level={ 3 } style={ { marginTop: 24 } }>
				{ t.training.notes }
			</Heading>
			<TextareaControl value={ notes } onChange={ setNotes } rows={ 4 } />
			<Button
				variant="primary"
				onClick={ handleSaveNotes }
				isBusy={ savingNotes }
				disabled={ savingNotes }
			>
				{ t.training.saveNotes }
			</Button>
		</div>
	);
}
