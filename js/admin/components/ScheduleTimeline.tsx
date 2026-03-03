import { useState } from '@wordpress/element';
import { Button, Notice } from '@wordpress/components';
import type { Translations } from '../../shared';
import type { TrainingSession } from '../types';
import { createSession } from '../api';

interface ScheduleTimelineProps {
	groupId: number;
	scheduleDates: string[];
	sessions: TrainingSession[];
	t: Translations;
	onSelectSession: ( sessionId: number ) => void;
	onCreated: () => void;
}

export function ScheduleTimeline( {
	groupId,
	scheduleDates,
	sessions,
	t,
	onSelectSession,
	onCreated,
}: ScheduleTimelineProps ) {
	const [ creating, setCreating ] = useState< string | null >( null );
	const [ error, setError ] = useState< string | null >( null );

	const today = new Date().toISOString().split( 'T' )[ 0 ];

	// Map session dates to sessions for quick lookup
	const sessionByDate = new Map< string, TrainingSession >();
	for ( const s of sessions ) {
		sessionByDate.set( s.sessionDate, s );
	}

	async function handleStartSession( date: string ) {
		setCreating( date );
		setError( null );
		try {
			const session = await createSession( groupId, date );
			onCreated();
			onSelectSession( session.id );
		} catch ( err: any ) {
			setError( err?.message || 'Failed to create session' );
		} finally {
			setCreating( null );
		}
	}

	if ( scheduleDates.length === 0 ) {
		return (
			<p style={ { fontStyle: 'italic' } }>{ t.training.noSchedule }</p>
		);
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

			<table className="widefat striped">
				<thead>
					<tr>
						<th>#</th>
						<th style={ { width: '35%' } }>
							{ t.training.schedule }
						</th>
						<th>{ t.training.attendance }</th>
						<th>{ t.training.pairings }</th>
						<th></th>
					</tr>
				</thead>
				<tbody>
					{ scheduleDates.map( ( date, idx ) => {
						const session = sessionByDate.get( date );
						const isPast = date < today;
						const isToday = date === today;

						return (
							<tr
								key={ date }
								style={ {
									opacity: isPast && ! session ? 0.5 : 1,
									background: isToday ? '#fff8e1' : undefined,
									cursor: session ? 'pointer' : undefined,
								} }
								onClick={
									session
										? () => onSelectSession( session.id )
										: undefined
								}
							>
								<td>{ idx + 1 }</td>
								<td>
									{ date }
									{ isToday && (
										<strong
											style={ {
												marginLeft: 8,
												color: '#1e3a5f',
											} }
										>
											({ t.calendar.today })
										</strong>
									) }
								</td>
								<td>
									{ session
										? session.attendance.length
										: '—' }
								</td>
								<td>
									{ session ? session.games.length : '—' }
								</td>
								<td>
									{ ! session && (
										<Button
											variant="secondary"
											size="small"
											onClick={ (
												e: React.MouseEvent
											) => {
												e.stopPropagation();
												handleStartSession( date );
											} }
											isBusy={ creating === date }
											disabled={ creating !== null }
										>
											{ t.training.startSession }
										</Button>
									) }
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
