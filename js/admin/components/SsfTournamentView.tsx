import { useState, useEffect } from '@wordpress/element';
import {
	Spinner,
	Notice,
	__experimentalHeading as Heading,
} from '@wordpress/components';
import type { Translations } from '../../shared';
import type {
	SsfEndResult,
	SsfRoundResult,
	SsfPlayerInfo,
} from '../../shared/ssfTypes';
import { fetchSsfTournamentResults, fetchSsfRoundResults } from '../api';

interface SsfTournamentViewProps {
	ssfGroupId: number;
	t: Translations;
}

function formatResult( result: number ): string {
	if ( result === 1 ) {
		return '1';
	}
	if ( result === 0.5 ) {
		return '½';
	}
	return '0';
}

function getElo( playerInfo: SsfPlayerInfo ): string {
	return playerInfo.elo?.rating ? String( playerInfo.elo.rating ) : '—';
}

interface DisplayPairing {
	board: number;
	whiteName: string;
	whiteRating: string;
	blackName: string;
	blackRating: string;
	result: string;
}

interface DisplayRound {
	round: number;
	pairings: DisplayPairing[];
}

function buildDisplayRounds(
	roundResults: SsfRoundResult[],
	playerMap: Map< number, SsfPlayerInfo >
): DisplayRound[] {
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
				return {
					board: g.board,
					whiteName: home
						? `${ home.lastName }, ${ home.firstName }`
						: String( g.homeId ),
					whiteRating: home ? getElo( home ) : '—',
					blackName: away
						? `${ away.lastName }, ${ away.firstName }`
						: String( g.awayId ),
					blackRating: away ? getElo( away ) : '—',
					result: `${ formatResult(
						g.homeResult
					) } - ${ formatResult( g.awayResult ) }`,
				};
			} ),
		};
	} );
}

export function SsfTournamentView( { ssfGroupId, t }: SsfTournamentViewProps ) {
	const [ endResults, setEndResults ] = useState< SsfEndResult[] | null >(
		null
	);
	const [ displayRounds, setDisplayRounds ] = useState< DisplayRound[] >(
		[]
	);
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState< string | null >( null );
	const [ activeRound, setActiveRound ] = useState( 0 );

	useEffect( () => {
		setLoading( true );
		setError( null );

		Promise.all( [
			fetchSsfTournamentResults( ssfGroupId ),
			fetchSsfRoundResults( ssfGroupId ),
		] )
			.then( ( [ tableData, roundData ] ) => {
				setEndResults( tableData );

				const playerMap = new Map< number, SsfPlayerInfo >();
				for ( const r of tableData ) {
					playerMap.set( r.playerInfo.id, r.playerInfo );
				}
				setDisplayRounds( buildDisplayRounds( roundData, playerMap ) );
			} )
			.catch( () => {
				setError( t.training.resultsFetchError );
			} )
			.finally( () => {
				setLoading( false );
			} );
	}, [ ssfGroupId, t.training.resultsFetchError ] );

	if ( loading ) {
		return <Spinner />;
	}

	if ( error || ! endResults ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error || t.training.resultsFetchError }
			</Notice>
		);
	}

	const sorted = [ ...endResults ].sort( ( a, b ) => a.place - b.place );
	const totalGames = ( r: SsfEndResult ) =>
		r.wonGames + r.drawGames + r.lostGames;

	const round =
		displayRounds.length > 0 ? displayRounds[ activeRound ] : null;

	return (
		<div>
			<table className="widefat striped">
				<thead>
					<tr>
						<th>#</th>
						<th>{ t.training.name }</th>
						<th>{ t.training.rating }</th>
						<th>{ t.training.played }</th>
						<th>+</th>
						<th>=</th>
						<th>-</th>
						<th>{ t.training.points }</th>
						<th>{ t.training.tiebreak }</th>
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
							<td>{ getElo( r.playerInfo ) }</td>
							<td>{ totalGames( r ) }</td>
							<td>{ r.wonGames }</td>
							<td>{ r.drawGames }</td>
							<td>{ r.lostGames }</td>
							<td>
								<strong>{ r.points }</strong>
							</td>
							<td>{ Math.round( r.secPoints * 10 ) / 10 }</td>
						</tr>
					) ) }
				</tbody>
			</table>

			{ displayRounds.length > 0 && (
				<div style={ { marginTop: 24 } }>
					<Heading level={ 4 } style={ { margin: 0 } }>
						{ t.training.round }
					</Heading>

					<div
						style={ {
							display: 'flex',
							gap: 0,
							marginTop: 8,
							marginBottom: 12,
							flexWrap: 'wrap',
							borderBottom: '1px solid #ccc',
						} }
					>
						{ displayRounds.map( ( r, idx ) => {
							const isActive = idx === activeRound;
							return (
								<button
									key={ r.round }
									type="button"
									onClick={ () => setActiveRound( idx ) }
									style={ {
										padding: '8px 16px',
										border: 'none',
										background: 'none',
										cursor: 'pointer',
										fontWeight: isActive ? 600 : 400,
										borderBottom: isActive
											? '2px solid #3858e9'
											: '2px solid transparent',
										color: isActive ? '#3858e9' : '#1e1e1e',
										marginBottom: '-1px',
									} }
								>
									{ t.training.round } { r.round }
								</button>
							);
						} ) }
					</div>

					{ round && (
						<table className="widefat striped">
							<thead>
								<tr>
									<th>{ t.training.board }</th>
									<th>{ t.training.white }</th>
									<th>{ t.training.rating }</th>
									<th>{ t.training.black }</th>
									<th>{ t.training.rating }</th>
									<th>{ t.training.result }</th>
								</tr>
							</thead>
							<tbody>
								{ round.pairings.map( ( p ) => (
									<tr key={ p.board }>
										<td>{ p.board }</td>
										<td>{ p.whiteName }</td>
										<td>{ p.whiteRating }</td>
										<td>{ p.blackName }</td>
										<td>{ p.blackRating }</td>
										<td>{ p.result }</td>
									</tr>
								) ) }
							</tbody>
						</table>
					) }
				</div>
			) }
		</div>
	);
}
