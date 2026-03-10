import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import type { Translations } from '../../shared/translations';
import type {
	SsfEndResult,
	SsfRoundResult,
	SsfPlayerInfo,
} from '../../shared/ssfTypes';
import RoundsDisplay from './RoundsDisplay';
import type { DisplayRound } from './RoundsDisplay';

interface Props {
	ssfGroupId: number;
	t: Translations[ 'training' ];
	showRounds?: boolean;
}

function formatSsfResult( result: number ): string {
	if ( result === 1 ) {
		return '1';
	}
	if ( result === 0.5 ) {
		return '½';
	}
	return '0';
}

function getElo( playerInfo: SsfPlayerInfo ): string {
	return playerInfo.elo?.rating ? String( playerInfo.elo.rating ) : '';
}

function buildSsfDisplayRounds(
	roundResults: SsfRoundResult[],
	playerMap: Map< number, SsfPlayerInfo >
): DisplayRound[] {
	// Group by round number.
	const byRound = new Map< number, SsfRoundResult[] >();
	for ( const r of roundResults ) {
		const existing = byRound.get( r.roundNr ) || [];
		existing.push( r );
		byRound.set( r.roundNr, existing );
	}

	const roundNrs = Array.from( byRound.keys() ).sort( ( a, b ) => a - b );

	return roundNrs.map( ( roundNr ) => {
		const games = byRound.get( roundNr ) || [];
		games.sort( ( a, b ) => a.board - b.board );

		return {
			round: roundNr,
			pairings: games.map( ( g ) => {
				const home = playerMap.get( g.homeId );
				const away = playerMap.get( g.awayId );
				const result = `${ formatSsfResult(
					g.homeResult
				) }-${ formatSsfResult( g.awayResult ) }`;
				return {
					board: g.board,
					whiteName: home
						? `${ home.lastName }, ${ home.firstName }`
						: String( g.homeId ),
					whiteRating: home ? getElo( home ) || undefined : undefined,
					blackName: away
						? `${ away.lastName }, ${ away.firstName }`
						: String( g.awayId ),
					blackRating: away ? getElo( away ) || undefined : undefined,
					result,
				};
			} ),
		};
	} );
}

export default function SsfResultsView( {
	ssfGroupId,
	t,
	showRounds = true,
}: Props ) {
	const [ endResults, setEndResults ] = useState< SsfEndResult[] | null >(
		null
	);
	const [ roundResults, setRoundResults ] = useState<
		SsfRoundResult[] | null
	>( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( false );

	useEffect( () => {
		const fetchResults = async () => {
			try {
				const [ tableData, roundData ] = await Promise.all( [
					apiFetch< SsfEndResult[] >( {
						path: `/rockaden/v1/ssf/tournamentresults/table/id/${ ssfGroupId }`,
					} ),
					showRounds
						? apiFetch< SsfRoundResult[] >( {
								path: `/rockaden/v1/ssf/tournamentresults/roundresults/id/${ ssfGroupId }`,
						  } )
						: Promise.resolve( null ),
				] );
				setEndResults( tableData );
				setRoundResults( roundData );
			} catch {
				setError( true );
			} finally {
				setLoading( false );
			}
		};

		fetchResults();
	}, [ ssfGroupId, showRounds ] );

	if ( loading ) {
		return <p className="rc-ssf__loading">{ t.loadingResults }</p>;
	}

	if ( error || ! endResults ) {
		return <p className="rc-ssf__error">{ t.resultsFetchError }</p>;
	}

	// Build player map from end results.
	const playerMap = new Map< number, SsfPlayerInfo >();
	for ( const r of endResults ) {
		playerMap.set( r.playerInfo.id, r.playerInfo );
	}

	// Sort by place.
	const sorted = [ ...endResults ].sort( ( a, b ) => a.place - b.place );

	const totalGames = ( r: SsfEndResult ) =>
		r.wonGames + r.drawGames + r.lostGames;

	const displayRounds =
		showRounds && roundResults
			? buildSsfDisplayRounds( roundResults, playerMap )
			: [];

	return (
		<div className="rc-td__panel">
			<table className="rc-td__table rc-td__table--standings">
				<thead>
					<tr>
						<th>{ t.rank }</th>
						<th>{ t.name }</th>
						<th>{ t.rating }</th>
						<th>{ t.played }</th>
						<th>+</th>
						<th>=</th>
						<th>-</th>
						<th>{ t.points }</th>
						<th>{ t.tiebreak }</th>
					</tr>
				</thead>
				<tbody>
					{ sorted.map( ( r ) => (
						<tr key={ r.playerInfo.id }>
							<td>{ r.place }</td>
							<td>
								{ r.playerInfo.lastName },{ ' ' }
								{ r.playerInfo.firstName }
							</td>
							<td className="rc-td__rating">
								{ getElo( r.playerInfo ) ||
									t.ratingUnavailable }
							</td>
							<td>{ totalGames( r ) }</td>
							<td>{ r.wonGames }</td>
							<td>{ r.drawGames }</td>
							<td>{ r.lostGames }</td>
							<td className="rc-td__points">{ r.points }</td>
							<td>{ Math.round( r.secPoints * 10 ) / 10 }</td>
						</tr>
					) ) }
				</tbody>
			</table>

			{ showRounds && displayRounds.length > 0 && (
				<RoundsDisplay rounds={ displayRounds } t={ t } />
			) }
		</div>
	);
}
