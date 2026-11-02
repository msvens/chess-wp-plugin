import { useState, useEffect } from '@wordpress/element';
import type { Translations } from '../../shared/translations';
import type { Language } from '../../shared/types';
import {
	isTeamTournament,
	getOpponentKind,
	findTournamentGroup,
	getGroupTimeControl,
	getPlayerRatingByAlgorithm,
	getPlayerRatingForRound,
	hasStandings,
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
	formatRating,
	groupRating,
} from '../../shared/ssf';
import RoundsDisplay from './RoundsDisplay';
import type { DisplayRound } from './RoundsDisplay';

interface Props {
	ssfGroupId: number;
	t: Translations[ 'training' ];
	lang: Language;
	showRounds?: boolean;
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
	rankingAlgorithm: number | undefined,
	roundRated: Map< number, number >,
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

		// The round's own rated type, falling back to the group's ranking
		// chain as schack.se does (a standard 1447 in a rapid round).
		const rated = roundRated.get( roundNr );
		const pairingRating = ( player: PlayerInfoDto | undefined ) =>
			formatRating(
				getPlayerRatingForRound( player?.elo, rankingAlgorithm, rated, {
					fallback: true,
				} ),
				lang
			) ?? undefined;

		return {
			round: roundNr,
			date: formatRoundDate( dateStr, lang ),
			pairings: games.map( ( g ) => ( {
				board: g.board,
				whiteName: opponentName( g.homeId, playerMap, t ),
				whiteRating: pairingRating( playerMap.get( g.homeId ) ),
				blackName: opponentName( g.awayId, playerMap, t ),
				blackRating: pairingRating( playerMap.get( g.awayId ) ),
				// The SDK owns the NOT_SET fallback, so a legitimate 0-0
				// (double forfeit, adjudicated) is not read as "not played".
				result: formatIndividualRowResult( g, labels ),
			} ) ),
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

	// Not started yet (no real places — SSF puts every row at place 1000 until
	// there are results) → show the registered players, clearly labelled and
	// seeded by the group's rating type as schack.se does, instead of a
	// placeholder standings table.
	if ( ! hasStandings( endResults ) ) {
		const seedGroup = tournament
			? findTournamentGroup( tournament, ssfGroupId )?.group
			: undefined;
		const timeControl = seedGroup
			? getGroupTimeControl( seedGroup ).primary
			: 'unknown';
		const seedRating = ( r: TournamentEndResultDto ) =>
			groupRating( r.playerInfo.elo, timeControl );
		const registered = [ ...endResults ].sort(
			( a, b ) =>
				( seedRating( b ).rating ?? 0 ) -
				( seedRating( a ).rating ?? 0 )
		);
		return (
			<div className="rc-td__panel">
				<p className="rc-ssf__notice">{ t.ssfNotStarted }</p>
				<h3 className="rc-ssf__subtitle">
					{ t.registeredPlayers } ({ registered.length })
				</h3>
				<div className="rc-table-wrap">
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
										{ formatRating(
											seedRating( r ),
											lang
										) ?? t.ratingUnavailable }
									</td>
								</tr>
							) ) }
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	// Sort by place.
	const sorted = [ ...endResults ].sort( ( a, b ) => a.place - b.place );

	const totalGames = ( r: TournamentEndResultDto ) =>
		r.wonGames + r.drawGames + r.lostGames;

	// Scheduled round dates and rated types are already inside the tournament
	// payload we fetch. SSF returns tournamentRounds unsorted, so key them by
	// round number.
	const roundDates = new Map< number, string >();
	const roundRated = new Map< number, number >();
	const group = tournament
		? findTournamentGroup( tournament, ssfGroupId )?.group
		: null;
	for ( const r of group?.tournamentRounds ?? [] ) {
		roundDates.set( r.roundNumber, r.roundDate );
		roundRated.set( r.roundNumber, r.rated );
	}
	// The rating schack.se's results table shows: the group's ranking chain.
	const standingsRating = ( r: TournamentEndResultDto ) =>
		getPlayerRatingByAlgorithm( r.playerInfo.elo, group?.rankingAlgorithm );

	const displayRounds =
		showRounds && roundResults
			? buildSsfDisplayRounds(
					roundResults,
					playerMap,
					roundDates,
					group?.rankingAlgorithm,
					roundRated,
					t,
					lang
			  )
			: [];

	return (
		<div className="rc-td__panel">
			<div className="rc-table-wrap">
				<table className="rc-td__table rc-td__table--standings">
					<thead>
						<tr>
							<th>{ t.rank }</th>
							<th>{ t.name }</th>
							<th>{ t.rating }</th>
							<th className="rc-td__col--played">{ t.played }</th>
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
									{ formatRating(
										standingsRating( r ),
										lang
									) ?? t.ratingUnavailable }
								</td>
								<td className="rc-td__col--played">
									{ totalGames( r ) }
								</td>
								<td>{ r.wonGames }</td>
								<td>{ r.drawGames }</td>
								<td>{ r.lostGames }</td>
								<td className="rc-td__points">{ r.points }</td>
								<td>{ Math.round( r.secPoints * 10 ) / 10 }</td>
							</tr>
						) ) }
					</tbody>
				</table>
			</div>

			{ showRounds && displayRounds.length > 0 && (
				<RoundsDisplay rounds={ displayRounds } t={ t } />
			) }
		</div>
	);
}
