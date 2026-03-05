import { useMemo } from '@wordpress/element';
import type { Translations } from '../../shared';
import { computeStandings } from '../../shared';
import type { Participant, StoredRound, SsfRatingInfo } from '../types';
import { ratingForTimeControl, ratingLabel } from './ratingUtils';

interface StandingsTableProps {
	participants: Participant[];
	rounds: StoredRound[];
	ratings: Map< number, SsfRatingInfo >;
	timeControl: string;
	t: Translations;
}

export function StandingsTable( {
	participants,
	rounds,
	ratings,
	timeControl,
	t,
}: StandingsTableProps ) {
	const active = useMemo(
		() => participants.filter( ( p ) => p.active ),
		[ participants ]
	);

	const nameMap = useMemo( () => {
		const m = new Map< string, Participant >();
		for ( const p of participants ) {
			m.set( p.id, p );
		}
		return m;
	}, [ participants ] );

	const allGames = useMemo(
		() => rounds.flatMap( ( r ) => r.pairings ),
		[ rounds ]
	);

	const standings = useMemo(
		() =>
			computeStandings(
				active.map( ( p ) => p.id ),
				allGames
			),
		[ active, allGames ]
	);

	function getRating( participantId: string ): string {
		const p = nameMap.get( participantId );
		if ( ! p?.ssfId ) {
			return t.training.ratingUnavailable;
		}
		const r = ratings.get( p.ssfId );
		if ( ! r ) {
			return t.training.ratingUnavailable;
		}
		const val = ratingForTimeControl( r, timeControl );
		return val ? String( val ) : t.training.ratingUnavailable;
	}

	if ( standings.length === 0 ) {
		return <p style={ { fontStyle: 'italic' } }>{ t.training.noGroups }</p>;
	}

	return (
		<table className="widefat striped">
			<thead>
				<tr>
					<th>{ t.training.rank }</th>
					<th>{ t.training.name }</th>
					<th>{ ratingLabel( timeControl, t ) }</th>
					<th>{ t.training.played }</th>
					<th>{ t.training.wins }</th>
					<th>{ t.training.draws }</th>
					<th>{ t.training.losses }</th>
					<th>{ t.training.points }</th>
				</tr>
			</thead>
			<tbody>
				{ standings.map( ( row, idx ) => {
					const p = nameMap.get( row.participantId );
					return (
						<tr key={ row.participantId }>
							<td>{ idx + 1 }</td>
							<td>{ p?.name || row.participantId }</td>
							<td>{ getRating( row.participantId ) }</td>
							<td>{ row.played }</td>
							<td>{ row.wins }</td>
							<td>{ row.draws }</td>
							<td>{ row.losses }</td>
							<td>
								<strong>{ row.points }</strong>
							</td>
						</tr>
					);
				} ) }
			</tbody>
		</table>
	);
}
