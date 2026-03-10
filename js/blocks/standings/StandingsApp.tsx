import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { TrainingGroup, SsfPlayer, Participant } from '../../admin/types';
import type { GameResult } from '../../shared/roundRobin';
import { computeStandings } from '../../shared/roundRobin';
import { getTranslation, toLanguage } from '../../shared/translations';
import { useLocale } from '../../shared/useLocale';
import RoundsDisplay, { formatResult } from '../training-group/RoundsDisplay';
import type { DisplayRound } from '../training-group/RoundsDisplay';
import SsfResultsView from '../training-group/SsfResultsView';

interface Props {
	groupId: number;
	clubId: string;
	locale: string;
	showRounds: boolean;
}

function buildDisplayRounds(
	rounds: TrainingGroup[ 'rounds' ],
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

export default function StandingsApp( {
	groupId,
	clubId,
	locale,
	showRounds,
}: Props ) {
	const currentLocale = useLocale( locale );
	const lang = toLanguage( currentLocale );
	const t = getTranslation( lang );
	const [ group, setGroup ] = useState< TrainingGroup | null >( null );
	const [ ratings, setRatings ] = useState< Map< number, SsfPlayer > >(
		new Map()
	);
	const [ loading, setLoading ] = useState( true );

	useEffect( () => {
		if ( ! groupId ) {
			setLoading( false );
			return;
		}

		apiFetch< TrainingGroup >( {
			path: `/rockaden/v1/training-groups/${ groupId }`,
		} )
			.then( ( data ) => setGroup( data ) )
			.catch( () => {} )
			.finally( () => setLoading( false ) );
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

	// SSF-linked group: delegate entirely to SsfResultsView.
	if ( group.ssfGroupId > 0 ) {
		return (
			<div className="rc-st">
				<h2 className="rc-st__title">
					{ t.training.standings } — { group.title }
				</h2>
				<SsfResultsView
					ssfGroupId={ group.ssfGroupId }
					t={ t.training }
					showRounds={ showRounds }
				/>
			</div>
		);
	}

	// Local tournament standings.
	const active = group.participants.filter( ( p ) => p.active );
	const participantIds = active.map( ( p ) => p.id );
	const participantMap = new Map( active.map( ( p ) => [ p.id, p ] ) );

	const allGames: GameResult[] = group.rounds.flatMap( ( r ) => r.pairings );
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

	const displayRounds = showRounds
		? buildDisplayRounds( group.rounds, participantMap, ratings )
		: [];

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

			{ showRounds && displayRounds.length > 0 && (
				<RoundsDisplay rounds={ displayRounds } t={ t.training } />
			) }
		</div>
	);
}
