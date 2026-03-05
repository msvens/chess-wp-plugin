import type { TrainingSession, Participant } from '../../admin/types';
import type { Translations } from '../../shared/translations';

interface Props {
	session: TrainingSession;
	participants: Participant[];
	onBack: () => void;
	t: Translations[ 'training' ];
}

export default function SessionDetail( {
	session,
	participants,
	onBack,
	t,
}: Props ) {
	const participantMap = new Map( participants.map( ( p ) => [ p.id, p ] ) );
	const getName = ( id: string ) => participantMap.get( id )?.name || id;

	const date = new Date( session.sessionDate );
	const dateStr = date.toLocaleDateString( 'sv-SE', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	} );

	return (
		<div className="rc-td__panel">
			<button className="rc-td__back" onClick={ onBack }>
				&larr; { t.backToGroup }
			</button>

			<h3 className="rc-td__session-title">{ dateStr }</h3>

			{ /* Attendance */ }
			{ session.attendance.length > 0 && (
				<div className="rc-td__section">
					<h4 className="rc-td__section-title">
						{ t.attendance } ({ session.attendance.length })
					</h4>
					<ul className="rc-td__attendance-list">
						{ session.attendance.map( ( id ) => (
							<li key={ id }>{ getName( id ) }</li>
						) ) }
					</ul>
				</div>
			) }

			{ /* Notes */ }
			{ session.notes && (
				<div className="rc-td__section">
					<h4 className="rc-td__section-title">{ t.notes }</h4>
					<p className="rc-td__notes">{ session.notes }</p>
				</div>
			) }
		</div>
	);
}
