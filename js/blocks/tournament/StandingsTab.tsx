import type { Tournament, SsfPlayer, Participant } from '../../admin/types';
import type { GameResult } from '../../shared/roundRobin';
import { computeStandings } from '../../shared/roundRobin';
import type { Translations } from '../../shared/translations';
import RoundsDisplay, { formatResult } from '../training-group/RoundsDisplay';
import type { DisplayRound } from '../training-group/RoundsDisplay';

interface Props {
	tournament: Tournament;
	ratings: Map< number, SsfPlayer >;
	t: Translations[ 'training' ];
}

function getRatingStr(
	participant: Participant | undefined,
	ratings: Map< number, SsfPlayer >
): string {
	if ( ! participant?.ssfId ) {
		return '';
	}
	const player = ratings.get( participant.ssfId );
	return player?.elo ? String( player.elo.rating ) : '';
}

function buildDisplayRounds(
	rounds: Tournament[ 'rounds' ],
	participantMap: Map< string, Participant >,
	ratings: Map< number, SsfPlayer >
): DisplayRound[] {
	return rounds.map( ( r ) => ( {
		round: r.round,
		pairings: r.pairings.map( ( p, idx ) => {
			const white = participantMap.get( p.whiteId );
			const black = participantMap.get( p.blackId );
			return {
				board: idx + 1,
				whiteName: white?.name || p.whiteId,
				whiteRating: getRatingStr( white, ratings ),
				blackName: black?.name || p.blackId,
				blackRating: getRatingStr( black, ratings ),
				result: formatResult( p.result ),
			};
		} ),
		byeName: r.bye ? participantMap.get( r.bye )?.name || r.bye : undefined,
	} ) );
}

export default function StandingsTab( { tournament, ratings, t }: Props ) {
	const active = tournament.participants.filter( ( p ) => p.active );
	const participantIds = active.map( ( p ) => p.id );
	const participantMap = new Map( active.map( ( p ) => [ p.id, p ] ) );

	const allGames: GameResult[] = tournament.rounds.flatMap(
		( r ) => r.pairings
	);
	const standings = computeStandings( participantIds, allGames );

	if ( standings.length === 0 ) {
		return <p className="rc-td__empty">{ t.standings } (0)</p>;
	}

	const getName = ( id: string ) => participantMap.get( id )?.name || id;

	const getRating = ( id: string ): string => {
		const p = participantMap.get( id );
		return getRatingStr( p, ratings );
	};

	const displayRounds = buildDisplayRounds(
		tournament.rounds,
		participantMap,
		ratings
	);

	return (
		<div className="rc-td__panel">
			<table className="rc-td__table">
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

			{ displayRounds.length > 0 && (
				<RoundsDisplay rounds={ displayRounds } t={ t } />
			) }
		</div>
	);
}
