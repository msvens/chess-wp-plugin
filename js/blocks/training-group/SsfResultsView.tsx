import { useState, useEffect } from '@wordpress/element';
import type { Translations } from '../../shared/translations';
import type { Language } from '../../shared/types';
import {
	isTeamTournament,
	getOpponentKind,
	findTournamentGroup,
	type TournamentEndResultDto,
	type TournamentRoundResultDto,
	type PlayerInfoDto,
	type TournamentDto,
} from '@msvens/schack-se-sdk';
import {
	formatIndividualRowResult,
	getResultLabels,
} from '../../shared/formatResult';
import {
	fetchTournamentForGroup,
	fetchTournamentResults,
	fetchTournamentRoundResults,
} from '../../shared/ssf';
import RoundsDisplay from './RoundsDisplay';
import type { DisplayRound } from './RoundsDisplay';

interface Props {
	ssfGroupId: number;
	t: Translations[ 'training' ];
	lang: Language;
	showRounds?: boolean;
}

function getElo( playerInfo: PlayerInfoDto ): string {
	return playerInfo.elo?.rating ? String( playerInfo.elo.rating ) : '';
}

/**
 * A round's date, formatted the way sthlmschack-reimagined shows it ("17/9/26").
 * SSF hands back either an ISO date or an epoch-ms string.
 *
 * @param dateStr Raw date from SSF.
 * @param lang    UI language.
 */
function formatRoundDate(
	dateStr: string | undefined,
	lang: Language
): string {
	if ( ! dateStr ) {
		return '';
	}
	const asNumber = Number( dateStr );
	const timestamp =
		! isNaN( asNumber ) && asNumber > 0
			? asNumber
			: new Date( dateStr ).getTime();
	if ( isNaN( timestamp ) || timestamp <= 0 ) {
		return '';
	}
	return new Date( timestamp ).toLocaleDateString(
		lang === 'sv' ? 'sv-SE' : 'en-GB',
		{ day: 'numeric', month: 'numeric', year: '2-digit' }
	);
}

/**
 * The name to show for an opponent slot. A negative id is not a player: -100 is
 * a bye (frirond, no game scheduled), any other negative is a walkover slot.
 * Without this they render as the literal string "-100".
 *
 * @param id        Opponent id from the round result.
 * @param playerMap Players from the standings.
 * @param t         The `training` translation block.
 */
function opponentName(
	id: number,
	playerMap: Map< number, PlayerInfoDto >,
	t: Translations[ 'training' ]
): string {
	const kind = getOpponentKind( id );
	if ( kind === 'walkover' ) {
		return 'W.O';
	}
	if ( kind === 'bye' ) {
		return t.bye;
	}
	const player = playerMap.get( id );
	return player
		? `${ player.lastName }, ${ player.firstName }`
		: String( id );
}

function buildSsfDisplayRounds(
	roundResults: TournamentRoundResultDto[],
	playerMap: Map< number, PlayerInfoDto >,
	roundDates: Map< number, string >,
	t: Translations[ 'training' ],
	lang: Language
): DisplayRound[] {
	const labels = getResultLabels( t );

	// Group by round number.
	const byRound = new Map< number, TournamentRoundResultDto[] >();
	for ( const r of roundResults ) {
		const existing = byRound.get( r.roundNr ) || [];
		existing.push( r );
		byRound.set( r.roundNr, existing );
	}

	const roundNrs = Array.from( byRound.keys() ).sort( ( a, b ) => a - b );

	return roundNrs.map( ( roundNr ) => {
		const games = byRound.get( roundNr ) || [];
		games.sort( ( a, b ) => a.board - b.board );

		// Prefer the actual game date; fall back to the scheduled round date.
		const dateStr = games[ 0 ]?.date || roundDates.get( roundNr );

		return {
			round: roundNr,
			date: formatRoundDate( dateStr, lang ),
			pairings: games.map( ( g ) => {
				const home = playerMap.get( g.homeId );
				const away = playerMap.get( g.awayId );
				return {
					board: g.board,
					whiteName: opponentName( g.homeId, playerMap, t ),
					whiteRating: home ? getElo( home ) || undefined : undefined,
					blackName: opponentName( g.awayId, playerMap, t ),
					blackRating: away ? getElo( away ) || undefined : undefined,
					// The SDK owns the NOT_SET fallback, so a legitimate 0-0
					// (double forfeit, adjudicated) is not read as "not played".
					result: formatIndividualRowResult( g, labels ),
				};
			} ),
		};
	} );
}

export default function SsfResultsView( {
	ssfGroupId,
	t,
	lang,
	showRounds = true,
}: Props ) {
	const [ tournament, setTournament ] = useState< TournamentDto | null >(
		null
	);
	const [ endResults, setEndResults ] = useState<
		TournamentEndResultDto[] | null
	>( null );
	const [ roundResults, setRoundResults ] = useState<
		TournamentRoundResultDto[] | null
	>( null );
	const [ loading, setLoading ] = useState( true );
	const [ error, setError ] = useState( false );

	useEffect( () => {
		let cancelled = false;
		setLoading( true );
		setError( false );
		setTournament( null );
		setEndResults( null );
		setRoundResults( null );

		( async () => {
			try {
				// The group endpoint returns the parent tournament (type/state).
				const meta = await fetchTournamentForGroup( ssfGroupId );
				if ( cancelled ) {
					return;
				}
				if ( ! meta ) {
					throw new Error( 'SSF tournament unavailable' );
				}
				setTournament( meta );
				// Team tournaments use different endpoints — link out instead.
				if ( isTeamTournament( meta.type ) ) {
					return;
				}
				const [ tableData, roundData ] = await Promise.all( [
					fetchTournamentResults( ssfGroupId ),
					showRounds
						? fetchTournamentRoundResults( ssfGroupId )
						: Promise.resolve< TournamentRoundResultDto[] >( [] ),
				] );
				if ( cancelled ) {
					return;
				}
				setEndResults( tableData );
				setRoundResults( roundData );
			} catch {
				if ( ! cancelled ) {
					setError( true );
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
	}, [ ssfGroupId, showRounds ] );

	if ( loading ) {
		return <p className="rc-ssf__loading">{ t.loadingResults }</p>;
	}

	// Team tournament: link out — its results live on SSF.
	if ( tournament && isTeamTournament( tournament.type ) ) {
		const link = `https://chess.msvens.com/results/${ tournament.id }/${ ssfGroupId }`;
		return (
			<p className="rc-ssf__notice">
				{ t.ssfTeamNotice }{ ' ' }
				<a href={ link } target="_blank" rel="noopener noreferrer">
					{ t.fullResults } ↗
				</a>
			</p>
		);
	}

	if ( error || ! endResults ) {
		return <p className="rc-ssf__error">{ t.resultsFetchError }</p>;
	}

	// Build player map from end results.
	const playerMap = new Map< number, PlayerInfoDto >();
	for ( const r of endResults ) {
		playerMap.set( r.playerInfo.id, r.playerInfo );
	}

	// Not started yet (registration) → show the registered players, clearly
	// labelled, instead of an empty/placeholder standings table.
	if ( tournament && tournament.state === 1 ) {
		const registered = [ ...endResults ].sort(
			( a, b ) =>
				( b.playerInfo.elo?.rating ?? 0 ) -
				( a.playerInfo.elo?.rating ?? 0 )
		);
		return (
			<div className="rc-td__panel">
				<p className="rc-ssf__notice">{ t.ssfNotStarted }</p>
				<h3 className="rc-ssf__subtitle">
					{ t.registeredPlayers } ({ registered.length })
				</h3>
				<table className="rc-td__table rc-td__table--standings">
					<thead>
						<tr>
							<th>#</th>
							<th>{ t.name }</th>
							<th>{ t.rating }</th>
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
								<td className="rc-td__rating">
									{ getElo( r.playerInfo ) ||
										t.ratingUnavailable }
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>
		);
	}

	// Sort by place.
	const sorted = [ ...endResults ].sort( ( a, b ) => a.place - b.place );

	const totalGames = ( r: TournamentEndResultDto ) =>
		r.wonGames + r.drawGames + r.lostGames;

	// Scheduled round dates are already inside the tournament payload we fetch.
	// SSF returns tournamentRounds unsorted, so key them by round number.
	const roundDates = new Map< number, string >();
	const group = tournament
		? findTournamentGroup( tournament, ssfGroupId )?.group
		: null;
	for ( const r of group?.tournamentRounds ?? [] ) {
		roundDates.set( r.roundNumber, r.roundDate );
	}

	const displayRounds =
		showRounds && roundResults
			? buildSsfDisplayRounds(
					roundResults,
					playerMap,
					roundDates,
					t,
					lang
			  )
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
