/**
 * Round-robin tournament pairing generator using the circle (Berger) method.
 * Deterministic: same participant list always produces the same pairings.
 */

export interface Pairing {
	whiteId: string;
	blackId: string;
}

export interface Round {
	round: number;
	pairings: Pairing[];
	bye?: string;
}

export interface StandingRow {
	participantId: string;
	played: number;
	wins: number;
	draws: number;
	losses: number;
	points: number;
}

export interface GameResult {
	whiteId: string;
	blackId: string;
	result: '1-0' | '0.5-0.5' | '0-1' | 'bye-white' | 'bye-black' | null;
}

/**
 * Generate round-robin pairings for a list of participant IDs.
 * Uses the circle method: fix player 0, rotate the rest.
 * If odd number of players, a virtual BYE player is added.
 * @param participantIds
 */
export function generateRoundRobin( participantIds: string[] ): Round[] {
	if ( participantIds.length < 2 ) {
		return [];
	}

	const ids = [ ...participantIds ];
	const hasBye = ids.length % 2 !== 0;
	const BYE = '__BYE__';

	if ( hasBye ) {
		ids.push( BYE );
	}

	const n = ids.length;
	const rounds: Round[] = [];
	const numRounds = n - 1;

	const indices = ids.map( ( _, i ) => i );

	for ( let r = 0; r < numRounds; r++ ) {
		const pairings: Pairing[] = [];
		let bye: string | undefined;

		for ( let i = 0; i < n / 2; i++ ) {
			const home = indices[ i ];
			const away = indices[ n - 1 - i ];
			const homeId = ids[ home ];
			const awayId = ids[ away ];

			if ( homeId === BYE ) {
				bye = awayId;
			} else if ( awayId === BYE ) {
				bye = homeId;
			} else if ( r % 2 === 0 ) {
				pairings.push( { whiteId: homeId, blackId: awayId } );
			} else {
				pairings.push( { whiteId: awayId, blackId: homeId } );
			}
		}

		rounds.push( { round: r + 1, pairings, bye } );

		const last = indices[ n - 1 ];
		for ( let i = n - 1; i > 1; i-- ) {
			indices[ i ] = indices[ i - 1 ];
		}
		indices[ 1 ] = last;
	}

	return rounds;
}

/**
 * Compute standings from a flat list of game results across all sessions.
 * @param participantIds
 * @param games
 */
export function computeStandings(
	participantIds: string[],
	games: GameResult[]
): StandingRow[] {
	const map = new Map< string, StandingRow >();

	for ( const id of participantIds ) {
		map.set( id, {
			participantId: id,
			played: 0,
			wins: 0,
			draws: 0,
			losses: 0,
			points: 0,
		} );
	}

	for ( const game of games ) {
		if ( ! game.result ) {
			continue;
		}

		const white = map.get( game.whiteId );
		const black = map.get( game.blackId );

		switch ( game.result ) {
			case '1-0':
				if ( white ) {
					white.played++;
					white.wins++;
					white.points += 1;
				}
				if ( black ) {
					black.played++;
					black.losses++;
				}
				break;
			case '0-1':
				if ( white ) {
					white.played++;
					white.losses++;
				}
				if ( black ) {
					black.played++;
					black.wins++;
					black.points += 1;
				}
				break;
			case '0.5-0.5':
				if ( white ) {
					white.played++;
					white.draws++;
					white.points += 0.5;
				}
				if ( black ) {
					black.played++;
					black.draws++;
					black.points += 0.5;
				}
				break;
			case 'bye-white':
				if ( white ) {
					white.played++;
					white.wins++;
					white.points += 1;
				}
				break;
			case 'bye-black':
				if ( black ) {
					black.played++;
					black.wins++;
					black.points += 1;
				}
				break;
		}
	}

	return Array.from( map.values() ).sort( ( a, b ) => {
		if ( b.points !== a.points ) {
			return b.points - a.points;
		}
		if ( b.wins !== a.wins ) {
			return b.wins - a.wins;
		}
		return a.participantId.localeCompare( b.participantId );
	} );
}
