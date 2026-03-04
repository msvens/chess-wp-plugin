import type { SsfPlayer } from '../../admin/types';

export const RATING_TYPES = {
	STANDARD: 1,
	RAPID: 6,
	BLITZ: 7,
} as const;

export const PLAYER_CATEGORIES = {
	ALL: 0,
	JUNIORS: 1,
	CADETS: 2,
	VETERANS: 4,
	WOMEN: 5,
	MINORS: 6,
	KIDS: 7,
} as const;

export type RatingType = ( typeof RATING_TYPES )[ keyof typeof RATING_TYPES ];
export type PlayerCategory =
	( typeof PLAYER_CATEGORIES )[ keyof typeof PLAYER_CATEGORIES ];

export const PAGE_SIZE = 50;

/**
 * Generate the last 12 rating periods (first of each month, YYYY-MM-DD).
 */
export function generateRatingPeriods(): string[] {
	const periods: string[] = [];
	const now = new Date();
	for ( let i = 0; i < 12; i++ ) {
		const d = new Date( now.getFullYear(), now.getMonth() - i, 1 );
		const yyyy = d.getFullYear();
		const mm = String( d.getMonth() + 1 ).padStart( 2, '0' );
		periods.push( `${ yyyy }-${ mm }-01` );
	}
	return periods;
}

/**
 * Build the SSF rating list API path.
 *
 * @param clubId     SSF club ID.
 * @param date       Rating period date (YYYY-MM-DD).
 * @param ratingType Rating type (1=standard, 6=rapid, 7=blitz).
 * @param category   Player category filter.
 */
export function buildRatingPath(
	clubId: string,
	date: string,
	ratingType: RatingType,
	category: PlayerCategory
): string {
	return `/rockaden/v1/ssf/ratinglist/club/${ clubId }/date/${ date }/ratingtype/${ ratingType }/category/${ category }`;
}

/**
 * Extract the relevant rating value from a player's elo data.
 *
 * @param elo        Player elo object (or null).
 * @param ratingType Which rating to extract.
 */
export function getRatingValue(
	elo: SsfPlayer[ 'elo' ],
	ratingType: RatingType
): number {
	if ( ! elo ) {
		return 0;
	}
	switch ( ratingType ) {
		case RATING_TYPES.RAPID:
			return elo.rapidRating;
		case RATING_TYPES.BLITZ:
			return elo.blitzRating;
		default:
			return elo.rating;
	}
}
