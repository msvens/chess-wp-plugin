/**
 * Tournament ordering shared by the admin Tournaments page and the public
 * Tournaments overview block, so the two list tournaments the same way.
 *
 * Ongoing first, then upcoming, then completed. Within ongoing and upcoming the
 * soonest start comes first; within completed the most recently ended comes
 * first. Tournaments without dates (a local tournament with no calendar event)
 * go last in their group, alphabetically.
 */

type TournamentStatus = 'planned' | 'active' | 'completed';

interface Sortable {
	title: string;
	status: TournamentStatus;
	startDate: string;
	endDate: string;
}

const STATUS_ORDER: Record< TournamentStatus, number > = {
	active: 0,
	planned: 1,
	completed: 2,
};

// The date part of an ISO date or date-time ('' when there is none).
function day( value: string ): string {
	return ( value || '' ).slice( 0, 10 );
}

/**
 * Comparator for Array.prototype.sort().
 *
 * @param a First tournament.
 * @param b Second tournament.
 */
export function compareTournaments( a: Sortable, b: Sortable ): number {
	const byStatus = STATUS_ORDER[ a.status ] - STATUS_ORDER[ b.status ];
	if ( byStatus !== 0 ) {
		return byStatus;
	}

	const completed = a.status === 'completed';
	// Completed: when it ended; otherwise: when it starts.
	const key = ( t: Sortable ) =>
		completed ? day( t.endDate ) || day( t.startDate ) : day( t.startDate );
	const ka = key( a );
	const kb = key( b );

	if ( ka && kb && ka !== kb ) {
		// Soonest start first; most recently ended first.
		return completed ? kb.localeCompare( ka ) : ka.localeCompare( kb );
	}
	if ( ka && ! kb ) {
		return -1;
	}
	if ( ! ka && kb ) {
		return 1;
	}
	return a.title.localeCompare( b.title, 'sv' );
}

/**
 * The tournaments sorted with compareTournaments(), as a new array.
 *
 * @param tournaments Tournaments in any order.
 */
export function sortTournaments< T extends Sortable >( tournaments: T[] ): T[] {
	return [ ...tournaments ].sort( compareTournaments );
}
