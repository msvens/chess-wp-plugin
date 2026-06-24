/**
 * Client-side SSF (Swedish Chess Federation) access via `@msvens/schack-se-sdk`.
 *
 * All SSF traffic goes through the plugin's WP REST proxy
 * (`/rockaden/v1/ssf/…`), so each bundle calls `configureSsf()` once at its
 * entry point to point the SDK's `baseUrl` at that proxy. The SDK reads the
 * configured `baseUrl` when a service is constructed, so services must be
 * instantiated lazily (inside these helpers / effects), never at module load.
 *
 * These helpers are non-throwing: on any failure they resolve to an empty
 * list / null, matching the blocks' graceful-degradation behaviour.
 */
import {
	configure,
	RatingsService,
	ResultsService,
	TournamentService,
	RatingType,
	PlayerCategory,
	parseLocalDate,
	type PlayerInfoDto,
	type TournamentDto,
	type TournamentEndResultDto,
	type TournamentRoundResultDto,
} from '@msvens/schack-se-sdk';

/**
 * Point the SDK at the plugin's SSF proxy. Call once per bundle entry.
 *
 * @param baseUrl Absolute URL of the proxy root (`…/rockaden/v1/ssf`).
 */
export function configureSsf( baseUrl: string ): void {
	if ( baseUrl ) {
		configure( { baseUrl } );
	}
}

/**
 * Club rating list for a given period — backs the ranking-list block.
 *
 * @param clubId     SSF club ID.
 * @param date       Rating period date (YYYY-MM-DD).
 * @param ratingType Rating type (1=standard, 6=rapid, 7=blitz).
 * @param category   Player category filter.
 */
export async function fetchClubRatingList(
	clubId: string,
	date: string,
	ratingType: number,
	category: number
): Promise< PlayerInfoDto[] > {
	if ( ! clubId ) {
		return [];
	}
	const res = await new RatingsService().getClubRatingList(
		Number( clubId ),
		parseLocalDate( date ),
		ratingType,
		category
	);
	return res.data ?? [];
}

/**
 * Current standard club rating list — used to annotate local tournament /
 * training participants with their live elo (matched by SSF member id).
 *
 * @param clubId SSF club ID.
 */
export async function fetchClubPlayers(
	clubId: string
): Promise< PlayerInfoDto[] > {
	if ( ! clubId ) {
		return [];
	}
	const res = await new RatingsService().getClubRatingList(
		Number( clubId ),
		new Date(),
		RatingType.STANDARD,
		PlayerCategory.ALL
	);
	return res.data ?? [];
}

/**
 * Parent tournament (with class/group tree) for an SSF group id, or null.
 *
 * @param groupId SSF group ID.
 */
export async function fetchTournamentForGroup(
	groupId: number
): Promise< TournamentDto | null > {
	const res = await new TournamentService().getTournamentFromGroup( groupId );
	return res.data ?? null;
}

/**
 * Final standings table for an SSF group.
 *
 * @param groupId SSF group ID.
 */
export async function fetchTournamentResults(
	groupId: number
): Promise< TournamentEndResultDto[] > {
	const res = await new ResultsService().getTournamentResults( groupId );
	return res.data ?? [];
}

/**
 * Round-by-round results for an SSF group.
 *
 * @param groupId SSF group ID.
 */
export async function fetchTournamentRoundResults(
	groupId: number
): Promise< TournamentRoundResultDto[] > {
	const res = await new ResultsService().getTournamentRoundResults( groupId );
	return res.data ?? [];
}
