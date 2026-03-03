import { useState } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingSession } from '../types';
import { createSession } from '../api';

interface SessionListProps {
	groupId: number;
	sessions: TrainingSession[];
	t: Translations;
	onSelectSession: ( sessionId: number ) => void;
	onCreated: () => void;
}

export function SessionList( {
	groupId,
	sessions,
	t,
	onSelectSession,
	onCreated,
}: SessionListProps ) {
	const [ creating, setCreating ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );

	async function handleCreate() {
		setCreating( true );
		setError( null );
		const today = new Date().toISOString().split( 'T' )[ 0 ];
		try {
			const session = await createSession( groupId, today );
			onCreated();
			onSelectSession( session.id );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create session' );
		} finally {
			setCreating( false );
		}
	}

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

			<div style={ { marginBottom: 12 } }>
				<Button
					variant="primary"
					onClick={ handleCreate }
					isBusy={ creating }
					disabled={ creating }
				>
					{ t.training.startSession }
				</Button>
			</div>

			{ sessions.length === 0 ? (
				<p style={ { fontStyle: 'italic' } }>{ t.training.noGroups }</p>
			) : (
				<table className="widefat striped">
					<thead>
						<tr>
							<th>#</th>
							<th style={ { width: '40%' } }>
								{ t.training.sessions }
							</th>
							<th>{ t.training.attendance }</th>
							<th>{ t.training.pairings }</th>
						</tr>
					</thead>
					<tbody>
						{ sessions.map( ( session, idx ) => (
							<tr
								key={ session.id }
								onClick={ () => onSelectSession( session.id ) }
								style={ { cursor: 'pointer' } }
							>
								<td>{ idx + 1 }</td>
								<td>{ session.sessionDate }</td>
								<td>{ session.attendance.length }</td>
								<td>{ session.games.length }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }
		</div>
	);
}
