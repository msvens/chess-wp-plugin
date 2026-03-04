import type { Participant, SsfPlayer } from '../../admin/types';
import type { Translations } from '../../shared/translations';

interface Props {
	participants: Participant[];
	ratings: Map< number, SsfPlayer >;
	t: Translations[ 'training' ];
}

function getRating(
	participant: Participant,
	ratings: Map< number, SsfPlayer >
): string {
	if ( ! participant.ssfId ) {
		return '';
	}
	const player = ratings.get( participant.ssfId );
	if ( ! player?.elo ) {
		return '';
	}
	return String( player.elo.rating );
}

export default function ParticipantsTab( { participants, ratings, t }: Props ) {
	const active = participants.filter( ( p ) => p.active );

	if ( active.length === 0 ) {
		return <p className="rc-td__empty">{ t.participants } (0)</p>;
	}

	return (
		<div className="rc-td__panel">
			<table className="rc-td__table">
				<thead>
					<tr>
						<th>{ t.name }</th>
						{ ratings.size > 0 && <th>{ t.rating }</th> }
					</tr>
				</thead>
				<tbody>
					{ active.map( ( p ) => {
						const rating = getRating( p, ratings );
						return (
							<tr key={ p.id }>
								<td>{ p.name }</td>
								{ ratings.size > 0 && (
									<td className="rc-td__rating">
										{ rating || t.ratingUnavailable }
									</td>
								) }
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
