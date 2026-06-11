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
	SsfTournament,
} from '../../shared/ssfTypes';
import { isSsfTeamType } from '../../shared/ssfTypes';
import {
	fetchSsfTournamentForGroup,
	fetchSsfTournamentResults,
	fetchSsfRoundResults,
} from '../api';

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
	const [ tournament, setTournament ] = useState< SsfTournament | null >(
		null
	);
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
		let cancelled = false;
		setLoading( true );
		setError( null );
		setTournament( null );
		setEndResults( null );
		setDisplayRounds( [] );

		( async () => {
			try {
				// The group endpoint returns the parent tournament (type/state).
				const meta = await fetchSsfTournamentForGroup( ssfGroupId );
				if ( cancelled ) {
					return;
				}
				setTournament( meta );
				// Team tournaments use different result endpoints — link out
				// instead of fetching the individual table (which 500s).
				if ( isSsfTeamType( meta.type ) ) {
					return;
				}
				const [ tableData, roundData ] = await Promise.all( [
					fetchSsfTournamentResults( ssfGroupId ),
					fetchSsfRoundResults( ssfGroupId ),
				] );
				if ( cancelled ) {
					return;
				}
				setEndResults( tableData );
				const playerMap = new Map< number, SsfPlayerInfo >();
				for ( const r of tableData ) {
					playerMap.set( r.playerInfo.id, r.playerInfo );
				}
				setDisplayRounds( buildDisplayRounds( roundData, playerMap ) );
			} catch {
				if ( ! cancelled ) {
					setError( t.training.resultsFetchError );
				}
			} finally {
				if ( ! cancelled ) {
					setLoading( false );
				}
			}
		} )();

		return () => {
			cancelled = true;
		};
	}, [ ssfGroupId, t.training.resultsFetchError ] );

	if ( loading ) {
		return <Spinner />;
	}

	// Team tournament: not rendered inline — point to the SSF results page.
	if ( tournament && isSsfTeamType( tournament.type ) ) {
		const link = `https://chess.msvens.com/results/${ tournament.id }/${ ssfGroupId }`;
		return (
			<Notice status="info" isDismissible={ false }>
				{ t.tournament.ssfTeamNotice }{ ' ' }
				<a href={ link } target="_blank" rel="noreferrer">
					{ t.tournament.viewOnSsf } ↗
				</a>
			</Notice>
		);
	}

	if ( error || ! endResults ) {
		return (
			<Notice status="error" isDismissible={ false }>
				{ error || t.training.resultsFetchError }
			</Notice>
		);
	}

	// Not started yet (registration) → the "table" is the registration list.
	if ( tournament && tournament.state === 1 ) {
		const registered = [ ...endResults ].sort(
			( a, b ) =>
				( b.playerInfo.elo?.rating ?? 0 ) -
				( a.playerInfo.elo?.rating ?? 0 )
		);
		return (
			<div>
				<Notice status="info" isDismissible={ false }>
					{ t.tournament.ssfNotStarted }
				</Notice>
				<Heading level={ 4 } style={ { margin: '12px 0 8px' } }>
					{ t.tournament.registeredPlayers } ({ registered.length })
				</Heading>
				<table className="widefat striped">
					<thead>
						<tr>
							<th>#</th>
							<th>{ t.training.name }</th>
							<th>{ t.training.rating }</th>
						</tr>
					</thead>
					<tbody>
						{ registered.map( ( r, idx ) => (
							<tr key={ r.playerInfo.id }>
								<td>{ idx + 1 }</td>
								<td>
									{ r.playerInfo.lastName },{ ' ' }
									{ r.playerInfo.firstName }
								</td>
								<td>{ getElo( r.playerInfo ) }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
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
