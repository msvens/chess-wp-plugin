import type { Participant, StoredRound, SsfPlayer } from '../../admin/types';
import type { GameResult } from '../../shared/roundRobin';
import { computeStandings } from '../../shared/roundRobin';
import type { Translations } from '../../shared/translations';
import RoundsDisplay, { formatResult } from './RoundsDisplay';
import type { DisplayRound } from './RoundsDisplay';
import SsfResultsView from './SsfResultsView';

interface Props {
	participants: Participant[];
	rounds: StoredRound[];
	ratings: Map< number, SsfPlayer >;
	t: Translations[ 'training' ];
	ssfGroupId: number;
}

function buildDisplayRounds(
	rounds: StoredRound[],
	participantMap: Map< string, Participant >,
	ratings: Map< number, SsfPlayer >
): DisplayRound[] {
	return rounds.map( ( r ) => ( {
		round: r.round,
		pairings: r.pairings.map( ( p, idx ) => {
			const white = participantMap.get( p.whiteId );
			const black = participantMap.get( p.blackId );
			const whiteRating = getRatingStr( white, ratings );
			const blackRating = getRatingStr( black, ratings );
			return {
				board: idx + 1,
				whiteName: white?.name || p.whiteId,
				whiteRating,
				blackName: black?.name || p.blackId,
				blackRating,
				result: formatResult( p.result ),
			};
		} ),
		byeName: r.bye ? participantMap.get( r.bye )?.name || r.bye : undefined,
	} ) );
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

export default function StandingsTab( {
	participants,
	rounds,
	ratings,
	t,
	ssfGroupId,
}: Props ) {
	if ( ssfGroupId > 0 ) {
		return <SsfResultsView ssfGroupId={ ssfGroupId } t={ t } />;
	}

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

	const displayRounds = buildDisplayRounds( rounds, participantMap, ratings );

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

			<RoundsDisplay rounds={ displayRounds } t={ t } />
		</div>
	);
}
