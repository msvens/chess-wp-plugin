import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type {
	TrainingGroup,
	TrainingSession,
	SsfPlayer,
} from '../../admin/types';
import type { Language } from '../../shared/types';
import type { GameResult } from '../../shared/roundRobin';
import { computeStandings } from '../../shared/roundRobin';
import { getTranslation } from '../../shared/translations';

interface Props {
	groupId: number;
	clubId: string;
	locale: string;
}

function toLanguage( locale: string ): Language {
	return locale.startsWith( 'sv' ) ? 'sv' : 'en';
}

export default function StandingsApp( { groupId, clubId, locale }: Props ) {
	const lang = toLanguage( locale );
	const t = getTranslation( lang );
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ sessions, setSessions ] = useState< TrainingSession[] >( [] );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! groupId ) {
			setLoading( false );
			return;
		}

		const fetchData = async () => {
			try {
				const [ groupData, sessionData ] = await Promise.all( [
					apiFetch< TrainingGroup >( {
						path: `/rockaden/v1/training-groups/${ groupId }`,
					} ),
					apiFetch< TrainingSession[] >( {
						path: `/rockaden/v1/training-groups/${ groupId }/sessions`,
					} ),
				] );
				setGroup( groupData );
				setSessions( sessionData );
			} catch {
				// Silently fail.
			} finally {
				setLoading( false );
			}
		};

		fetchData();
	}, [ groupId ] );

	useEffect( () => {
		if ( ! clubId ) {
			return;
		}

		apiFetch< SsfPlayer[] >( {
			path: `/rockaden/v1/ssf/federation/player/club/${ clubId }`,
		} )
			.then( ( players ) => {
				const map = new Map< number, SsfPlayer >();
				for ( const player of players ) {
					map.set( player.id, player );
				}
				setRatings( map );
			} )
			.catch( () => {} );
	}, [ clubId ] );

	if ( loading ) {
		return <p className="rc-st__loading">{ t.common.loading }</p>;
	}

	if ( ! group ) {
		return null;
	}

	const active = group.participants.filter( ( p ) => p.active );
	const participantIds = active.map( ( p ) => p.id );
	const participantMap = new Map( active.map( ( p ) => [ p.id, p ] ) );

	const allGames: GameResult[] = sessions.flatMap( ( s ) =>
		s.games.map( ( g ) => ( {
			whiteId: g.whiteId,
			blackId: g.blackId,
			result: g.result,
		} ) )
	);

	const standings = computeStandings( participantIds, allGames );

	if ( standings.length === 0 ) {
		return null;
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
		<div className="rc-st">
			<h2 className="rc-st__title">
				{ t.training.standings } — { group.title }
			</h2>
			<table className="rc-st__table">
				<thead>
					<tr>
						<th>{ t.training.rank }</th>
						<th>{ t.training.name }</th>
						{ ratings.size > 0 && <th>{ t.training.rating }</th> }
						<th>{ t.training.played }</th>
						<th>{ t.training.wins }</th>
						<th>{ t.training.draws }</th>
						<th>{ t.training.losses }</th>
						<th>{ t.training.points }</th>
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
									<td className="rc-st__rating">
										{ rating ||
											t.training.ratingUnavailable }
									</td>
								) }
								<td>{ row.played }</td>
								<td>{ row.wins }</td>
								<td>{ row.draws }</td>
								<td>{ row.losses }</td>
								<td className="rc-st__points">
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
