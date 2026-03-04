import { useState, useEffect } from '@wordpress/element';
import type { TrainingSession, Participant } from '../../admin/types';
import type { Translations } from '../../shared/translations';
import SessionDetail from './SessionDetail';

interface Props {
	sessions: TrainingSession[];
	participants: Participant[];
	initialSessionId: number | null;
	t: Translations[ 'training' ];
}

export default function SessionsTab( {
	sessions,
	participants,
	initialSessionId,
	t,
}: Props ) {
	const [ selectedId, setSelectedId ] = useState< number | null >(
		initialSessionId
	);

	// Update URL hash when session changes.
	useEffect( () => {
		if ( selectedId ) {
			window.history.replaceState( null, '', `#session-${ selectedId }` );
		} else {
			window.history.replaceState( null, '', window.location.pathname );
		}
	}, [ selectedId ] );

	const selectedSession = sessions.find( ( s ) => s.id === selectedId );

	if ( selectedSession ) {
		return (
			<SessionDetail
				session={ selectedSession }
				participants={ participants }
				onBack={ () => setSelectedId( null ) }
				t={ t }
			/>
		);
	}

	if ( sessions.length === 0 ) {
		return <p className="rc-td__empty">{ t.sessions } (0)</p>;
	}

	return (
		<div className="rc-td__panel">
			<ul className="rc-td__session-list">
				{ sessions.map( ( session ) => {
					const attendeeCount = session.attendance.length;
					return (
						<li key={ session.id }>
							<button
								className="rc-td__session-link"
								onClick={ () => setSelectedId( session.id ) }
							>
								<span className="rc-td__session-date">
									{ formatDate( session.sessionDate ) }
								</span>
								<span className="rc-td__session-meta">
									{ attendeeCount }{ ' ' }
									{ t.present.toLowerCase() }
								</span>
							</button>
						</li>
					);
				} ) }
			</ul>
		</div>
	);
}

function formatDate( dateStr: string ): string {
	const date = new Date( dateStr );
	return date.toLocaleDateString( 'sv-SE', {
		weekday: 'short',
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	} );
}
