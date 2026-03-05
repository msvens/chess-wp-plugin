import type { Participant, StoredRound, SsfPlayer } from '../../admin/types';
import type { GameResult } from '../../shared/roundRobin';
import { computeStandings } from '../../shared/roundRobin';
import type { Translations } from '../../shared/translations';

interface Props {
	participants: Participant[];
	rounds: StoredRound[];
	ratings: Map< number, SsfPlayer >;
	t: Translations[ 'training' ];
}

export default function StandingsTab( {
	participants,
	rounds,
	ratings,
	t,
}: Props ) {
	const active = participants.filter( ( p ) => p.active );
	const participantIds = active.map( ( p ) => p.id );
	const participantMap = new Map( active.map( ( p ) => [ p.id, p ] ) );

	// Collect all games from rounds + synthetic bye results.
	const allGames: GameResult[] = rounds.flatMap( ( r ) => r.pairings );
	const standings = computeStandings( participantIds, allGames );

	if ( standings.length === 0 ) {
		return <p className="rc-td__empty">{ t.standings } (0)</p>;
	}

	const getName = ( id: string ) => participantMap.get( id )?.name || id;

	const getRating = ( id: string ): string => {
		const p = participantMap.get( id );
		if ( ! p?.ssfId ) {
			return '';
		}
		const player = ratings.get( p.ssfId );
		return player?.elo ? String( player.elo.rating ) : '';
	};

	return (
		<div className="rc-td__panel">
			<table className="rc-td__table rc-td__table--standings">
				<thead>
					<tr>
						<th>{ t.rank }</th>
						<th>{ t.name }</th>
						{ ratings.size > 0 && <th>{ t.rating }</th> }
						<th>{ t.played }</th>
						<th>{ t.wins }</th>
						<th>{ t.draws }</th>
						<th>{ t.losses }</th>
						<th>{ t.points }</th>
					</tr>
				</thead>
				<tbody>
					{ standings.map( ( row, idx ) => {
						const rating = getRating( row.participantId );
						return (
							<tr key={ row.participantId }>
								<td>{ idx + 1 }</td>
								<td>{ getName( row.participantId ) }</td>
								{ ratings.size > 0 && (
									<td className="rc-td__rating">
										{ rating || t.ratingUnavailable }
									</td>
								) }
								<td>{ row.played }</td>
								<td>{ row.wins }</td>
								<td>{ row.draws }</td>
								<td>{ row.losses }</td>
								<td className="rc-td__points">
									{ row.points }
								</td>
							</tr>
						);
					} ) }
				</tbody>
			</table>
		</div>
	);
}
