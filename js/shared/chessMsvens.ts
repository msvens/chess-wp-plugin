/**
 * Links to msvens-chess (chess.msvens.com), which has the per-player and
 * per-tournament pages this plugin does not.
 */
export const CHESS_MSVENS_BASE = 'https://chess.msvens.com';

/**
 * A player's page, keyed by SSF member id.
 *
 * @param ssfId SSF member id.
 */
export function playerUrl( ssfId: number ): string {
	return `${ CHESS_MSVENS_BASE }/players/${ ssfId }`;
}

/**
 * A tournament's results page, or one of its groups when `groupId` is given.
 *
 * @param tournamentId SSF tournament id.
 * @param groupId      SSF group id.
 */
export function resultsUrl( tournamentId: number, groupId?: number ): string {
	const base = `${ CHESS_MSVENS_BASE }/results/${ tournamentId }`;
	return groupId ? `${ base }/${ groupId }` : base;
}
